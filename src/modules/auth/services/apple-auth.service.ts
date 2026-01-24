import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPrivateKey, createPublicKey } from 'crypto';
import jwt from 'jsonwebtoken';
import { get as httpsGet, request as httpsRequest } from 'https';

type AppleTokenResponse = {
    access_token?: string;
    expires_in?: number;
    id_token?: string;
    refresh_token?: string;
    token_type?: string;
    error?: string;
    error_description?: string;
};

type AppleJwksKey = {
    kid: string;
    kty: string;
    n: string;
    e: string;
};

type AppleIdTokenPayload = {
    sub: string;
    email?: string;
    email_verified?: boolean | 'true' | 'false';
    aud?: string | string[];
    iss?: string;
    exp?: number;
    iat?: number;
};

@Injectable()
export class AppleAuthService {
    private readonly appleJwksUrl = 'https://appleid.apple.com/auth/keys';
    private readonly appleTokenUrl = 'https://appleid.apple.com/auth/token';
    private readonly appleJwksTtlMs = 6 * 60 * 60 * 1000;

    private appleJwksCache: { fetchedAt: number; keys: AppleJwksKey[] } = {
        fetchedAt: 0,
        keys: [],
    };

    constructor(private readonly config: ConfigService) {}

    public async exchangeCodeForIdToken(code: string): Promise<string> {
        const clientId = this.getAppleClientId();
        const tokenResponse = await this.exchangeAppleCode(code, clientId);

        if (!tokenResponse.id_token) {
            const description = tokenResponse.error_description
                ? `${tokenResponse.error}: ${tokenResponse.error_description}`
                : tokenResponse.error;

            throw new UnauthorizedException(
                description ? `Apple identity token is missing (${description})` : 'Apple identity token is missing',
            );
        }

        return tokenResponse.id_token;
    }

    public async verifyIdToken(idToken: string): Promise<AppleIdTokenPayload> {
        const clientId = this.getAppleClientId();

        const { kid, alg } = this.decodeJwtHeader(idToken);
        if (!kid || alg !== 'RS256') {
            throw new UnauthorizedException('Invalid Apple token header');
        }

        const publicKeyPem = await this.getApplePublicKeyPem(kid);

        let payload: AppleIdTokenPayload;
        try {
            payload = jwt.verify(idToken, publicKeyPem, {
                algorithms: ['RS256'],
                issuer: 'https://appleid.apple.com',
                audience: clientId,
            }) as AppleIdTokenPayload;
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new UnauthorizedException(`Invalid Apple token: ${message}`);
        }

        if (!payload?.sub) {
            throw new UnauthorizedException('Apple token payload is incomplete');
        }

        if (payload.email && payload.email_verified !== undefined) {
            const emailVerified = payload.email_verified === true || payload.email_verified === 'true';
            if (!emailVerified) {
                throw new UnauthorizedException('Apple email is not verified');
            }
        }

        return payload;
    }

    private getAppleClientId(): string {
        const bundleId = this.config.get<string>('APPLE_BUNDLE_ID')?.trim();
        if (!bundleId) {
            throw new BadRequestException('Apple auth is not configured (APPLE_BUNDLE_ID missing)');
        }
        return bundleId;
    }

    private getApplePrivateKeyPem(): string {
        const b64Key = this.config.get<string>('APPLE_PRIVATE_KEY_B64')?.trim();
        if (!b64Key) {
            throw new BadRequestException('Apple auth is not configured (APPLE_PRIVATE_KEY_B64 missing)');
        }

        const decoded = Buffer.from(b64Key, 'base64').toString('utf8');
        const pem = this.normalizePrivateKey(decoded).trim();

        if (!pem.includes('BEGIN PRIVATE KEY') || !pem.includes('END PRIVATE KEY')) {
            throw new BadRequestException('APPLE_PRIVATE_KEY_B64 is not a valid PEM private key');
        }

        return pem + '\n';
    }

    private buildAppleClientSecret(clientId: string): string {
        const teamId = this.config.get<string>('APPLE_TEAM_ID')?.trim();
        const keyId = this.config.get<string>('APPLE_KEY_ID')?.trim();

        if (!teamId || !keyId) {
            throw new BadRequestException('Apple auth is not configured (APPLE_TEAM_ID / APPLE_KEY_ID missing)');
        }

        const privateKeyPem = this.getApplePrivateKeyPem();

        const keyObject = createPrivateKey({
            key: privateKeyPem,
            format: 'pem',
            type: 'pkcs8',
        });

        if (keyObject.asymmetricKeyType !== 'ec') {
            throw new BadRequestException(`Apple key is not EC (got: ${keyObject.asymmetricKeyType ?? 'unknown'})`);
        }

        const nowSec = Math.floor(Date.now() / 1000);

        const payload = {
            iss: teamId,
            iat: nowSec,
            exp: nowSec + 300,
            aud: 'https://appleid.apple.com',
            sub: clientId,
        };

        return jwt.sign(payload, keyObject, {
            algorithm: 'ES256',
            header: { kid: keyId, alg: 'ES256' },
        });
    }

    private async exchangeAppleCode(code: string, clientId: string): Promise<AppleTokenResponse> {
        const clientSecret = this.buildAppleClientSecret(clientId);

        const body = new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            grant_type: 'authorization_code',
        }).toString();

        const response = await this.postAppleToken(body);

        if (response.error) {
            const description = response.error_description
                ? `${response.error}: ${response.error_description}`
                : response.error;

            throw new UnauthorizedException(`Apple code exchange failed (${description})`);
        }

        return response;
    }

    private async postAppleToken(body: string): Promise<AppleTokenResponse> {
        return new Promise((resolve, reject) => {
            const request = httpsRequest(
                this.appleTokenUrl,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Content-Length': Buffer.byteLength(body),
                    },
                },
                (response) => {
                    let data = '';
                    response.setEncoding('utf8');
                    response.on('data', (chunk) => (data += chunk));
                    response.on('end', () => {
                        try {
                            const parsed = JSON.parse(data) as AppleTokenResponse;
                            resolve(parsed);
                        } catch (error) {
                            reject(error);
                        }
                    });
                },
            );

            request.on('error', reject);
            request.write(body);
            request.end();
        });
    }

    private async getApplePublicKeyPem(kid: string): Promise<string> {
        const now = Date.now();
        const cacheAge = now - this.appleJwksCache.fetchedAt;
        const expired = cacheAge > this.appleJwksTtlMs;

        if (expired || !this.appleJwksCache.keys.length) {
            this.appleJwksCache.keys = await this.fetchAppleJwks();
            this.appleJwksCache.fetchedAt = now;
        }

        let key = this.appleJwksCache.keys.find((item) => item.kid === kid);
        if (!key) {
            this.appleJwksCache.keys = await this.fetchAppleJwks();
            this.appleJwksCache.fetchedAt = Date.now();
            key = this.appleJwksCache.keys.find((item) => item.kid === kid);
        }

        if (!key) {
            throw new UnauthorizedException('Invalid Apple token (kid not found)');
        }

        if (key.kty !== 'RSA' || !key.n || !key.e) {
            throw new UnauthorizedException('Invalid Apple token (unsupported JWKS key)');
        }

        const pubKey = createPublicKey({
            key: { kty: key.kty, n: key.n, e: key.e },
            format: 'jwk',
        });

        return pubKey.export({ format: 'pem', type: 'spki' }).toString();
    }

    private async fetchAppleJwks(): Promise<AppleJwksKey[]> {
        return new Promise((resolve, reject) => {
            const request = httpsGet(this.appleJwksUrl, (response) => {
                if (!response.statusCode || response.statusCode >= 400) {
                    reject(new Error(`Apple JWKS request failed with status ${response.statusCode}`));
                    response.resume();
                    return;
                }

                let body = '';
                response.setEncoding('utf8');
                response.on('data', (chunk) => (body += chunk));
                response.on('end', () => {
                    try {
                        const parsed = JSON.parse(body) as { keys?: AppleJwksKey[] };
                        const keys = parsed.keys ?? [];
                        if (!keys.length) {
                            reject(new Error('Apple JWKS response is empty'));
                            return;
                        }
                        resolve(keys);
                    } catch (error) {
                        reject(error);
                    }
                });
            });

            request.on('error', reject);
        });
    }

    private decodeJwtHeader(token: string): { kid?: string; alg?: string } {
        const [rawHeader] = token.split('.');
        if (!rawHeader) return {};

        try {
            const headerJson = Buffer.from(this.normalizeBase64(rawHeader), 'base64').toString('utf8');
            const header = JSON.parse(headerJson) as { kid?: string; alg?: string };
            return { kid: header.kid, alg: header.alg };
        } catch {
            return {};
        }
    }

    private normalizeBase64(value: string): string {
        const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
        const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
        return normalized + padding;
    }

    private normalizePrivateKey(rawKey: string): string {
        const keyWithNewlines = rawKey.includes('\\n') ? rawKey.replace(/\\n/g, '\n') : rawKey;
        if (keyWithNewlines.includes('\n')) {
            return keyWithNewlines;
        }

        const stripped = keyWithNewlines.replace(/\s+/g, '');
        const headerMatch = stripped.match(/-----BEGIN[^-]+-----/);
        const footerMatch = stripped.match(/-----END[^-]+-----/);

        if (!headerMatch || !footerMatch) {
            return keyWithNewlines;
        }

        const header = headerMatch[0];
        const footer = footerMatch[0];
        const body = stripped.slice(header.length, stripped.length - footer.length);
        const wrapped = body.match(/.{1,64}/g)?.join('\n') ?? body;

        return `${header}\n${wrapped}\n${footer}\n`;
    }
}

import {BadRequestException, Injectable, UnauthorizedException} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {ConfigService} from '@nestjs/config';
import {get as httpsGet, request as httpsRequest} from 'https';
import { createPrivateKey } from 'crypto';


@Injectable()
export class AppleAuthService {
    private readonly appleJwksUrl = 'https://appleid.apple.com/auth/keys';
    private readonly appleTokenUrl = 'https://appleid.apple.com/auth/token';
    private readonly appleJwksTtlMs = 6 * 60 * 60 * 1000;
    private appleJwksCache: {fetchedAt: number; keys: {kid: string; x5c?: string[]}[]} = {
        fetchedAt: 0,
        keys: [],
    };

    constructor(
        private readonly jwtService: JwtService,
        private readonly config: ConfigService,
    ) {
    }

    async exchangeCodeForIdToken(code: string): Promise<string> {
        const clientIds = this.getAppleClientIds();
        if (!clientIds.length) {
            throw new BadRequestException('Apple auth is not configured');
        }

        const tokenResponse = await this.exchangeAppleCode(code, clientIds);
        if (!tokenResponse.id_token) {
            throw new UnauthorizedException('Apple identity token is missing');
        }

        return tokenResponse.id_token;
    }

    async verifyIdToken(idToken: string): Promise<{ sub: string; email?: string; email_verified?: boolean | 'true' | 'false' }> {
        const clientIds = this.getAppleClientIds();
        if (!clientIds.length) {
            throw new BadRequestException('Apple auth is not configured');
        }

        const {kid, alg} = this.decodeJwtHeader(idToken);
        if (!kid || (alg && alg !== 'RS256')) {
            throw new UnauthorizedException('Invalid Apple token');
        }

        const publicKey = await this.getApplePublicKey(kid);

        let payload:
            | {
                  sub: string;
                  email?: string;
                  email_verified?: boolean | 'true' | 'false';
              }
            | undefined;
        try {
            payload = await this.jwtService.verifyAsync(idToken, {
                secret: publicKey,
                algorithms: ['RS256'],
                issuer: 'https://appleid.apple.com',
                audience: clientIds.length === 1 ? clientIds[0] : clientIds,
            });
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

    private getAppleClientIds(): string[] {
        const bundleId = this.config.get<string>('APPLE_BUNDLE_ID');
        const serviceId = this.config.get<string>('APPLE_SERVICE_ID');
        const clientId = this.config.get<string>('APPLE_CLIENT_ID');
        return [bundleId, serviceId, clientId].filter((id): id is string => Boolean(id));
    }

    private getApplePrivateKey(): string {
        const b64KeyRaw = this.config.get<string>('APPLE_PRIVATE_KEY_B64');
        const b64Key = b64KeyRaw?.trim();

        if (!b64Key) {
            throw new BadRequestException('Apple auth is not configured');
        }

        const decoded = Buffer.from(b64Key, 'base64').toString('utf8');
        const pem = this.normalizePrivateKey(decoded).trim();

        if (!pem.includes('BEGIN PRIVATE KEY') || !pem.includes('END PRIVATE KEY')) {
            throw new BadRequestException('APPLE_PRIVATE_KEY_B64 is not a valid PEM private key');
        }

        return pem + '\n';
    }

    private async buildAppleClientSecret(clientId: string): Promise<string> {
        const teamId = this.config.get<string>('APPLE_TEAM_ID');
        const keyId = this.config.get<string>('APPLE_KEY_ID');

        if (!teamId || !keyId) {
            throw new BadRequestException('Apple auth is not configured');
        }

        const privateKeyPem = this.getApplePrivateKey();

        const keyObject = createPrivateKey({
            key: privateKeyPem,
            format: 'pem',
            type: 'pkcs8',
        });

        return this.jwtService.signAsync(
            {},
            {
                algorithm: 'ES256',
                header: { kid: keyId, alg: 'ES256' },
                issuer: teamId,
                audience: 'https://appleid.apple.com',
                subject: clientId,
                expiresIn: 300,
                privateKey: keyObject as unknown as string,
            },
        );
    }

    private async exchangeAppleCode(
        code: string,
        clientIds: string[],
    ): Promise<{
        access_token?: string;
        expires_in?: number;
        id_token?: string;
        refresh_token?: string;
        token_type?: string;
        error?: string;
        error_description?: string;
    }> {
        const errors: string[] = [];

        for (const clientId of clientIds) {
            try {
                const clientSecret = await this.buildAppleClientSecret(clientId);
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
                    errors.push(`${clientId}: ${description}`);
                    continue;
                }
                return response;
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                errors.push(`${clientId}: ${message}`);
            }
        }

        throw new UnauthorizedException(
            errors.length ? `Apple code exchange failed (${errors.join(', ')})` : 'Apple code exchange failed',
        );
    }

    private async postAppleToken(body: string): Promise<{
        access_token?: string;
        expires_in?: number;
        id_token?: string;
        refresh_token?: string;
        token_type?: string;
        error?: string;
        error_description?: string;
    }> {
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
                            const parsed = JSON.parse(data) as {
                                access_token?: string;
                                expires_in?: number;
                                id_token?: string;
                                refresh_token?: string;
                                token_type?: string;
                                error?: string;
                                error_description?: string;
                            };
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

    private decodeJwtHeader(token: string): {kid?: string; alg?: string} {
        const [rawHeader] = token.split('.');
        if (!rawHeader) {
            return {};
        }
        try {
            const headerJson = Buffer.from(this.normalizeBase64(rawHeader), 'base64').toString('utf8');
            const header = JSON.parse(headerJson);
            return {kid: header.kid, alg: header.alg};
        } catch {
            return {};
        }
    }

    private async getApplePublicKey(kid: string): Promise<string> {
        const now = Date.now();
        if (now - this.appleJwksCache.fetchedAt > this.appleJwksTtlMs || !this.appleJwksCache.keys.length) {
            this.appleJwksCache.keys = await this.fetchAppleJwks();
            this.appleJwksCache.fetchedAt = now;
        }

        let key = this.appleJwksCache.keys.find((item) => item.kid === kid);
        if (!key) {
            this.appleJwksCache.keys = await this.fetchAppleJwks();
            this.appleJwksCache.fetchedAt = Date.now();
            key = this.appleJwksCache.keys.find((item) => item.kid === kid);
        }

        if (!key?.x5c?.length) {
            throw new UnauthorizedException('Invalid Apple token');
        }

        return this.appleCertToPem(key.x5c[0]);
    }

    private async fetchAppleJwks(): Promise<{kid: string; x5c?: string[]}[]> {
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
                        const parsed = JSON.parse(body) as {keys?: {kid: string; x5c?: string[]}[]};
                        if (!parsed.keys?.length) {
                            reject(new Error('Apple JWKS response is empty'));
                            return;
                        }
                        resolve(parsed.keys);
                    } catch (error) {
                        reject(error);
                    }
                });
            });

            request.on('error', reject);
        });
    }

    private appleCertToPem(cert: string): string {
        const wrapped = cert.match(/.{1,64}/g)?.join('\n') ?? cert;
        return `-----BEGIN CERTIFICATE-----\n${wrapped}\n-----END CERTIFICATE-----\n`;
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

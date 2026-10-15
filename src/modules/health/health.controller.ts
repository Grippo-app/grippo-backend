import {Controller, Get, Inject, ServiceUnavailableException} from '@nestjs/common';
import {ApiExcludeController} from '@nestjs/swagger';
import {DataSource} from 'typeorm';

@ApiExcludeController()
@Controller('health')
export class HealthController {
    private pendingProbe: Promise<void> | undefined;

    constructor(@Inject('DATA_SOURCE') private readonly dataSource: DataSource) {
    }

    @Get()
    async check(): Promise<{status: string}> {
        if (!this.dataSource.isInitialized) throw new ServiceUnavailableException();

        // Share the deadline/result too: per-request Promise.race would retain
        // one subscription per timed-out HTTP request on a stalled DB query.
        if (!this.pendingProbe) {
            this.pendingProbe = new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => reject(new ServiceUnavailableException()), 2000);
                timeout.unref();
                const finish = (success: boolean) => {
                    clearTimeout(timeout);
                    this.pendingProbe = undefined;
                    if (success) resolve();
                    else reject(new ServiceUnavailableException());
                };
                // A synchronous provider failure is handled like a rejected query.
                void Promise.resolve().then(() => this.dataSource.query('SELECT 1')).then(
                    () => finish(true),
                    () => finish(false),
                );
            });
        }
        try {
            // A timeout stays cached until the raw query settles, preventing
            // new queries/listeners while still allowing recovery afterwards.
            await this.pendingProbe;
            return {status: 'ok'};
        } catch {
            throw new ServiceUnavailableException();
        }
    }
}

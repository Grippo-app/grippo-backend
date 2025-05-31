import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';
import { setupSwagger } from './swagger';
import { LoggingInterceptor } from './common/logging.interceptor';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(
        AppModule,
        new ExpressAdapter(),
        { cors: true },
    );

    const configService = app.get<ConfigService>(ConfigService);
    const logger = new Logger('Bootstrap');

    // ✅ Validation
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
        }),
    );

    // ✅ HTTP Logging
    app.useGlobalInterceptors(new LoggingInterceptor());

    // ✅ Swagger Docs
    setupSwagger(app);

    // ✅ Optional global prefix
    // app.setGlobalPrefix('api');

    // ✅ Start the app
    const port = configService.get<number>('PORT');

    if (!port) {
        throw new Error('❌ Environment variable PORT is required');
    }

    const host = configService.get<string>('HOST');

    if (!host) {
        throw new Error('❌ Environment variable HOST is required');
    }

    try {
        await app.listen(port, host);
        const url = await app.getUrl();
        logger.log(`📚 Swagger docs available at ${url}/docs`);
    } catch (err) {
        logger.error('❌ Failed to start server', err);
        process.exit(1);
    }

    // ✅ Graceful shutdown
    const shutdown = async () => {
        logger.log('👋 Gracefully shutting down...');
        await app.close();
        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

bootstrap();

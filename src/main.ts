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
    );

    // Register CORS before the Swagger routes mounted below.
    app.enableCors();

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
    const rawPort = configService.get<string>('BACKEND_PORT');
    const port = Number(rawPort);

    if (!/^\d+$/.test(String(rawPort)) || !Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error('BACKEND_PORT must be an integer between 1 and 65535');
    }

    try {
        // ❗ Always bind to 0.0.0.0 in Docker
        await app.listen(port, '0.0.0.0');
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

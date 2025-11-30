import {INestApplication} from '@nestjs/common';
import {DocumentBuilder, SwaggerDocumentOptions, SwaggerModule,} from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
    const isProd = process.env.NODE_ENV === 'production';
    const swaggerUiPath = 'docs';
    const swaggerJsonPath = `/${swaggerUiPath}-json`;

    const config = new DocumentBuilder()
        .setTitle('🏋️ Grippo API')
        .setDescription('📘 Full documentation for Grippo API endpoints.')
        .setVersion('1.0.0')
        .addServer('/', 'Local server')
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                in: 'header',
                name: 'Authorization',
                description: 'Enter JWT token',
            },
            'access-token' // 👈 schema name
        )
        .build();

    const options: SwaggerDocumentOptions = {
        ignoreGlobalPrefix: false,
    };

    const doc = SwaggerModule.createDocument(app, config, options);

    const customCss = `
      :root {
        color-scheme: dark;
      }
      body,
      .swagger-ui,
      .swagger-ui .topbar,
      .swagger-ui .information-container,
      .swagger-ui .scheme-container {
        background-color: #0f172a !important;
        color: #f8fafc !important;
      }
      .swagger-ui .topbar {
        border-bottom: 1px solid #1f2937;
      }
      .swagger-ui .topbar .download-url-wrapper .selectize-input,
      .swagger-ui select,
      .swagger-ui input,
      .swagger-ui textarea {
        background-color: #1e293b !important;
        color: #f8fafc !important;
        border-color: #334155 !important;
      }
      .topbar-wrapper img {
        content: url('https://img.icons8.com/color/48/gym.png');
        width: 40px;
        height: 40px;
      }
      .swagger-ui .swagger-json-link {
        margin-left: 1rem;
        color: #38bdf8;
        font-weight: 600;
        text-decoration: none;
      }
      .swagger-ui .swagger-json-link:hover {
        text-decoration: underline;
      }
    `;

    const jsonLinkScript = `
      window.addEventListener('load', () => {
        const topbar = document.querySelector('.topbar');
        if (!topbar || topbar.querySelector('.swagger-json-link')) {
          return;
        }
        const link = document.createElement('a');
        link.href = '${swaggerJsonPath}';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = 'swagger-json-link';
        link.textContent = 'Swagger JSON';
        topbar.appendChild(link);
      });
    `;

    const httpAdapter = app.getHttpAdapter();
    const httpServer = httpAdapter.getInstance();
    if (httpAdapter.getType() === 'fastify') {
        httpServer.get('/swagger-custom.js', (_req, reply) =>
            reply.type('application/javascript').send(jsonLinkScript),
        );
    } else {
        httpServer.get('/swagger-custom.js', (_req, res) =>
            res.type('application/javascript').send(jsonLinkScript),
        );
    }

    SwaggerModule.setup(swaggerUiPath, app, doc, {
        swaggerOptions: {
            persistAuthorization: true,
            docExpansion: 'none',
            displayRequestDuration: true,
            deepLinking: true,
            tagsSorter: 'alpha',
            operationsSorter: 'alpha',
            tryItOutEnabled: true,
        },
        customSiteTitle: `📘 Grippo API Docs (${isProd ? 'PROD' : 'DEV'})`,
        customCss,
        customJs: '/swagger-custom.js',
    });
}

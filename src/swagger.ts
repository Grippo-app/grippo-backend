import { INestApplication } from '@nestjs/common';
import {
    DocumentBuilder,
    SwaggerDocumentOptions,
    SwaggerModule,
} from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
    const isProd = process.env.NODE_ENV === 'production';

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

    const acceptLanguageStorageKey = 'swagger-accept-language';
    const acceptLanguageOptions = ['en', 'ua', 'ru'];
    const acceptLanguageDefault = acceptLanguageOptions[0];

    const topbarTextColor = isProd ? '#1f2937' : '#f8fafc';
    const controlBorderColor = isProd ? '#cbd5f5' : '#334155';
    const controlBackground = isProd ? '#f8fafc' : '#1e293b';
    const controlTextColor = isProd ? '#1f2937' : '#f8fafc';

    const customCss = `
    .swagger-ui .topbar {
      background-color: ${isProd ? '#ffffff' : '#1e293b'};
      border-bottom: 1px solid #ccc;
    }
    .topbar-wrapper img {
      content: url('https://img.icons8.com/color/48/gym.png');
      width: 40px;
      height: 40px;
    }
    .swagger-ui .topbar .accept-language-control {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: 16px;
      color: ${topbarTextColor};
      font-weight: 500;
    }
    .swagger-ui .topbar .accept-language-control select {
      background: ${controlBackground};
      color: ${controlTextColor};
      border: 1px solid ${controlBorderColor};
      border-radius: 6px;
      padding: 4px 10px;
      font-weight: 500;
      cursor: pointer;
    }
    .swagger-ui .topbar .accept-language-control label {
      margin-bottom: 0;
    }
  `;

    const customJsStr = `
      (function () {
        const STORAGE_KEY = '${acceptLanguageStorageKey}';
        const OPTIONS = ${JSON.stringify(acceptLanguageOptions)};
        const DEFAULT_VALUE = '${acceptLanguageDefault}';
        const CONTROL_CLASS = 'accept-language-control';

        function renderControl() {
          const topbar = document.querySelector('.swagger-ui .topbar');
          if (!topbar) {
            return false;
          }

          if (topbar.querySelector('.' + CONTROL_CLASS)) {
            return true;
          }

          const wrapper = topbar.querySelector('.download-url-wrapper');
          if (!wrapper || !wrapper.parentElement) {
            return false;
          }

          const container = document.createElement('div');
          container.className = CONTROL_CLASS;

          const label = document.createElement('label');
          label.setAttribute('for', 'accept-language-select');
          label.textContent = 'Accept-Language';

          const select = document.createElement('select');
          select.id = 'accept-language-select';

          const existing = window.localStorage.getItem(STORAGE_KEY);
          const storedValue = existing || DEFAULT_VALUE;

          if (!existing) {
            window.localStorage.setItem(STORAGE_KEY, storedValue);
          }

          OPTIONS.forEach(function (value) {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            if (value === storedValue) {
              option.selected = true;
            }
            select.appendChild(option);
          });

          select.addEventListener('change', function () {
            window.localStorage.setItem(STORAGE_KEY, select.value);
          });

          container.appendChild(label);
          container.appendChild(select);
          wrapper.parentElement.appendChild(container);

          return true;
        }

        function initControl() {
          if (!renderControl()) {
            setTimeout(initControl, 300);
          }
        }

        document.addEventListener('DOMContentLoaded', initControl);

        const observer = new MutationObserver(function () {
          renderControl();
        });

        observer.observe(document.body, { childList: true, subtree: true });
      })();
    `;

    SwaggerModule.setup('docs', app, doc, {
        swaggerOptions: {
            persistAuthorization: true,
            docExpansion: 'none',
            displayRequestDuration: true,
            deepLinking: true,
            tagsSorter: 'alpha',
            operationsSorter: 'alpha',
            tryItOutEnabled: true,
            requestInterceptor: (req) => {
                const storage = typeof window !== 'undefined' ? window.localStorage : undefined;
                const language = storage?.getItem(acceptLanguageStorageKey) ?? acceptLanguageDefault;

                if (language) {
                    req.headers['Accept-Language'] = language;
                }

                return req;
            },
        },
        customSiteTitle: `📘 Grippo API Docs (${isProd ? 'PROD' : 'DEV'})`,
        customCss,
        customJsStr,
    });
}

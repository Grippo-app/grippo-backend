# Grippo Backend

Общие инструкции находятся в [AGENTS.md](AGENTS.md). Они действуют и при работе
через Claude: выбери профильный skill из таблицы и загружай только нужные
references. Не поддерживай здесь второй набор архитектурных правил и recipes.

- Архитектура/кодстайл: [grippo-architecture](.agents/skills/grippo-architecture/SKILL.md).
- Данные и доменные сценарии: [grippo-domain-data](.agents/skills/grippo-domain-data/SKILL.md).
- Identity/API/i18n: [grippo-identity-api](.agents/skills/grippo-identity-api/SKILL.md).
- Эксплуатация: [grippo-operations](.agents/skills/grippo-operations/SKILL.md).
- Координация, проверки и ревью — по маршрутизации AGENTS.

Деплой никогда не выполняется самостоятельно: каждая конкретная попытка требует
явного разрешения человека и нового успешного дампа штатным scripts/dump.sh.
Полный обязательный порядок:
[deployment-policy](.agents/skills/grippo-operations/references/deployment-policy.md).

Факты проверяются по текущему исходному коду. Не расширяй задачу на schema,
dependencies, auth/framework или тестовую инфраструктуру без нужного scope;
не изменяй неизвестную remote среду и не раскрывай секреты. Изучение инструкций
не разрешает SSH, dump, deploy, restore или cleanup.

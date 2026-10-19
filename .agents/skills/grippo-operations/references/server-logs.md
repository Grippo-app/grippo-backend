# Подключение к логам сервера Grippo

Используй при просьбах «подключись к логам», «сейчас дерну запрос», «поймай
ошибку на сервере». Это чтение логов; restart, dump, deploy, изменение logger,
запросы к БД и воспроизведение business write сюда не входят. Написание этого
runbook не разрешает подключение. Прямая просьба пользователя читать логи
известной цели разрешает эти read-only подшаги без повторного вопроса.

## Проверенная цель

Последняя проверка в разрешённой сессии: **2026-10-19**.

| Поле | Значение |
|---|---|
| Окружение / SSH | production, `ubuntu@51.21.57.106:22` |
| Checkout | `/home/ubuntu/grippo-backend` |
| Существующий ключ | `~/.ssh/grippo-deploy.pem` (содержимое не читать) |
| Доверенный ED25519 fingerprint | `SHA256:FS0XbKpIOAXx4+EjL9hroSJ2as6DcX0bfhltaa/Dlws` |
| Compose project / service | `grippo-backend` / `backend` |
| Backend при проверке | `grippo_backend`; каждый раз заново находить по labels |
| Docker на этом host | локальный socket `unix:///var/run/docker.sock` |

Это датированные сведения для выбора известной цели, а не постоянное разрешение.
Если пользователь назвал другую цель, используй её после проверки по
[remote-access](remote-access.md). При изменённом fingerprint остановись;
`ssh-keyscan`, отключение host verification или удаление known_hosts не являются
способом подтвердить новый host.

## 1. Локальная проверка доступа

Из корня проекта, Bash или Zsh. Команда показывает только fingerprints:

```bash
test -r "$HOME/.ssh/grippo-deploy.pem"
ssh-keygen -F 51.21.57.106 -f "$HOME/.ssh/known_hosts" | ssh-keygen -lf -
```

Сверь ED25519 с таблицей. Наличие RSA/ECDSA не заменяет эту проверку.
Создай массив в той же локальной shell session:

```bash
LOG_SSH=(ssh -T -p 22 -i "$HOME/.ssh/grippo-deploy.pem"
  -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=yes
  -o HostKeyAlgorithms=ssh-ed25519 -o ForwardAgent=no
  -o ConnectTimeout=10 -o ServerAliveInterval=20 -o ServerAliveCountMax=3
  ubuntu@51.21.57.106)
```

При sandbox `Operation not permitted` запроси обычную tool escalation на тот же
read-only SSH; это не повод повторно просить разрешение пользователя на уже
разрешённое чтение. Rejected approval не обходи; сообщи причину ограничения.

## 2. Проверка checkout и контейнера

```bash
"${LOG_SSH[@]}" 'exec timeout --signal=TERM --kill-after=5s 25s sh -s' <<'LOG_METADATA'
set -eu
cd /home/ubuntu/grippo-backend
test "$(pwd -P)" = /home/ubuntu/grippo-backend
id -un
git rev-parse HEAD
docker --host unix:///var/run/docker.sock info --format "daemon={{.ID}}"
docker --host unix:///var/run/docker.sock ps --all --no-trunc \
  --filter label=com.docker.compose.project=grippo-backend \
  --filter label=com.docker.compose.service=backend \
  --format "{{.ID}} {{.Names}} {{.Status}} root={{.Label \"com.docker.compose.project.working_dir\"}}"
LOG_METADATA
```

Должен быть ровно один backend с ожидаемым checkout label. Не подставляй первый
попавшийся контейнер и не переключайся на DB/другой Docker context. При остановленном
backend зафиксируй состояние: следующий режим follow рассчитан на running service.
Не запускай его ради диагностики. Не читай `.env`, полный inspect/config или keys.

## 3. Поймать запрос

Сначала открой поток, после успешного preflight сообщи «подключился, можешь
выполнять запрос». Выводит только HTTP metadata: время UTC и Europe/Kyiv,
method, канонический route без ID, status, duration. Фильтр локальный,
сам SSH/Docker не запускает и сырые строки не сохраняет:
[summarize_http_logs.py](../scripts/summarize_http_logs.py).

Готовая команда для `/trainings`: история 5 минут, максимум 500 исходных строк,
follow до 180 секунд. Выполняй в Bash/Zsh с созданным выше `LOG_SSH`:

```bash
set -o pipefail
"${LOG_SSH[@]}" 'exec timeout --signal=TERM --kill-after=5s 180s sh -s' 2>&1 <<'LOG_STREAM' | \
  python3 -u .agents/skills/grippo-operations/scripts/summarize_http_logs.py --route /trainings
set -eu
cd /home/ubuntu/grippo-backend
test "$(pwd -P)" = /home/ubuntu/grippo-backend
LOG_IDS=$(docker --host unix:///var/run/docker.sock ps --quiet --no-trunc \
  --filter label=com.docker.compose.project=grippo-backend \
  --filter label=com.docker.compose.service=backend)
set -- $LOG_IDS
test "$#" -eq 1
LOG_ID=$1
test "$(docker --host unix:///var/run/docker.sock inspect --format "{{index .Config.Labels \"com.docker.compose.project.working_dir\"}}" "$LOG_ID")" = /home/ubuntu/grippo-backend
exec docker --host unix:///var/run/docker.sock logs --since 5m --tail 500 \
  --timestamps --follow "$LOG_ID"
LOG_STREAM
```

Для всех известных HTTP routes убери `--route /trainings`. `/health` по умолчанию
скрыт; включи `--include-health` либо `--route /health`. Новые/неизвестные routes,
auth email, uid, headers, bodies, SQL, произвольные errors/stacks фильтр опускает.
Нельзя выдавать опущенные строки за отсутствие ошибки. Не заменяй фильтр на raw
`docker logs` в tool output и не используй `tee` для сохранения сырого потока.

Открывай процесс с управляемой session/TTY и коротким yield; между чтениями
обновляй пользователя не реже раза в минуту. `Ctrl+C` завершает локальный pipeline;
remote `timeout` ограничивает весь prelude и follow даже после обрыва SSH. Не оставляй nohup/tmux
или фоновый бесконечный tail. Дочитай завершение: с `pipefail` код 124 ожидаем
после истечения окна, 255 означает SSH failure, остальные nonzero нужно проверить.
Сам фильтр не подтверждает успешность SSH. При необходимости нового окна чтения
той же цели не спрашивай согласование повторно, если scope не изменился.

## 4. Что устанавливают эти логи

[LoggingInterceptor](../../../../src/common/logging.interceptor.ts) пишет статус
и время, но не `err.message` или тело validation response. Поэтому
`POST /trainings 400` устанавливает факт отказа, а не конкретное поле/причину.
Для подтверждения нужен безопасный фрагмент ответа `message` и при необходимости
только значение отклонённого поля; токены, headers и весь request не нужны.
Скриншот тренировки не позволяет восстановить скрытые агрегаты и JSON типов.

Для 5xx можно продолжить анализ по соответствующему controller/service и
проверенной runtime revision; произвольный текст exception не пересылай в чат.
Текущий checkout SHA не доказывает running image: при необходимости считай только
immutable image ID/revision label узким `docker inspect --format`, без Env/Log.
Не меняй production logger ради диагностики без отдельного разрешения на такую
работу и её rollout. Отсутствие записи может означать другой route, фильтрацию,
отказ до interceptor или запрос, не дошедший до этого backend.

В отчёте укажи цель, окно наблюдения, route/status/duration, UTC/Kyiv и предел
вывода. Разделяй наблюдение, гипотезу и подтверждённую причину. Если пользователь
только попросил подключиться, сообщи готовность в commentary и дождись запроса
в пределах окна; после завершения явно назови результат и закрой поток.

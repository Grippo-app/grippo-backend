# Skill и экспертные агенты аудита упражнений

Запрос: создать качественный, научно аккуратный комплект для повторяемых
аудитов упражнений Grippo. Это работа над инструкциями и локальными
инструментами, не применение прежних 19 предложений к каталогу.

Текущее состояние — команда из десяти профилей. Ниже сохранена история
версий, включая первоначальные пять ролей; результат последнего прохода —
в разделе «Финальная дотошная перепроверка» в конце документа.

## Scope и владельцы

- Root: SKILL, пять профилей, routing, общий audit/review протокол,
  поведенческие сценарии и интеграция.
- Evidence author: evidence-method/source-library.
- Methods author: exercise-model/catalog-policies.
- Tool author: readonly JSON checker и snapshot-checks.
- Независимые исполнители: слепые поведенческие прогоны; reviewer не автор
  соответствующих материалов.

Имена: grippo-exercise-auditor, grippo-strength-coach,
grippo-biomechanics-scientist, grippo-exercise-researcher,
grippo-exercise-audit-reviewer. Модель и разрешения наследуются.

## Критерии

Точное разделение факта записи/биомеханики/эмпирики/продуктового правила;
идентификация варианта; проценты без ложной точности; сложность отдельно от
нагрузки/силы/ROM; coverage manifest; доказательные before→after; независимый
review; только нужные references. Исторические 44 находки и конкретные карты
не закрепляются как постоянная истина.

Проверки: metadata/TOML/ссылки/достижимость/discovery; readonly checker на
синтетических valid+invalid fixtures; слепые запросы без ключа оценивания;
независимое содержательное ревью и повторная проверка исправлений.

## Исходное состояние

До правок tracked diff пуст; существует пользовательский untracked
`tasks/exercise-catalog-audit-validation.md`. Его содержимое сохраняется.
Полный `python3 scripts/validate-agent-kit.py` до изменений завершился exit1:
14 ошибок ссылок этого документа на внешние локальные HTML/JSON-артефакты.
Новых ошибок исходного комплекта нет. Validator и пользовательский документ
не ослабляются/не редактируются ради зелёного результата. Для нового комплекта
дополнительно проверяется изолированная копия с явно исключённым только этим
исходным документом; полный результат сообщается отдельно.

Исходный временный JSON каталога предыдущего аудита может отсутствовать;
проверка инструмента на реальном readback не обещается. SQL-дамп не читается
и не используется как подмена JSON. Нет SSH/DB/Docker/deploy/runtime changes.

## Первоначальная версия: исторический результат

Созданы [skill](../.agents/skills/grippo-exercise-audit/SKILL.md), пять
[профилей](../.agents/skills/grippo-exercise-audit/references/agent-team.md),
10 подробных references, readonly JSON checker и 16 синтетических случаев.
SKILL entrypoint — 77 строк; подробности загружаются по вопросу.
Discovery добавлен в AGENTS/README/CLAUDE, общий workflow/routing и domain-data.
Локальный инструмент внесён в source-map. Runtime приложения не менялся.

### Первоначальная верификация 18 октября 2026

| Проверка | Результат и граница |
|---|---|
| Штатный skill-creator quick_validate | PASS. PyYAML6.0.2 установлен только во временный `/tmp/grippo-skill-validator-deps`; project dependencies не менялись. |
| Agent kit, изолированная копия | PASS:8skills/13agents; metadata/TOML, локальные ссылки, достижимость references, routing и inventory. Исключён только исходный пользовательский документ выше. |
| Полный validator рабочего дерева | exit1: те же14 исходных ошибок внешних ссылок userdoc; новых ошибок комплекта0. Validator и userdoc не изменялись. |
| JSON checker, автор | 51 CLI-сценарий PASS; before/after SHA входов одинаковы. |
| JSON checker, независимый reviewer | 18 дополнительных сценариев PASS, включая дробные/целые JSON numbers, bool/string, overflow, optional false, missing nullable, duplicate pair и отсутствие echo неизвестных данных. |
| Слепое поведение пяти profiles | 15 исходных случаев + отдельный C04 regression:16PASS/0FAIL/0INCONCLUSIVE по независимому grader. |
| Реальный JSON каталога | NOT_RUN: прежний полный временный readback отсутствует; SQL-дамп не читался, live DB не подключалась. |
| Активация новых custom names текущим клиентом | NOT_CONFIRMED: инструмент текущей сессии вернул unknown agent_type на bounded smoke. Проверены тексты profiles через generic agents, а не нативная загрузка этих имён. |

Слепые исполнители получали профиль/skill и только свои синтетические facts,
без ключа, прежних выводов и истории родительского аудита. Ответы фиксировались
до оценки. Grader не автор profiles и не исполнитель кейсов. Это проверка
решений на предоставленных входах, не клиническая или общая научная валидация
модели и не независимый runtime-аудит всех её действий.

| Cases | Что проверялось | Итог |
|---|---|---|
| A01–A03 | Покрытие, read-only/instructions-as-data, UUID/история решений | 3PASS |
| C01–C03 | Нагрузка vsтехника, рабочие суставы, неизвестное видео/optional assist | 3PASS |
| B01–B03 | EMG, netmoment, условная target-only карта и масштаб | 3PASS |
| R01–R03 | Эквивалентность, разные outcomes, недоступный источник | 3PASS |
| V01–V03 | Ложная физиология, лишняя смена глубины/уровня, история данных | 3PASS |
| C04 | Технический enum отдельно от readiness фиксированного unassisted-варианта | PASS |

### Исправления по независимому ревью

- P2: reference сложности смешивал относительную силу/мобильность с
  техническим advanced. Решающие технические требования отделены от
  readiness-профиля; unassisted-канон сохраняется, иная объединённая шкала
  требует явно принятой конвенции. C04 проверен новым слепым исполнителем.
- P2: checker отвергал `100.0`, хотя JS/class-validator принимает его как
  целое число. Общая проверка математически целого finite JSONnumber
  применяется и к диапазону, и к сумме; bool/strings/дробные не принимаются.
  JSON overflow отклоняется как invalid input, а не как ошибка каталога.
  Регрессионные и независимые CLI-сценарии прошли.
- P3: подпись Kinoshita2023 исправлена по первичной titlepage; Maeo является
  соавтором. Научные выводы не менялись.

Hash первоначального скрипта (не текущей версии):
`5ef2a8b2b9cc88a079a25a6eef17134cc1315304597daf4fb2ff468e26e87cbb`.
Hash первоначального набора19 новых файлов skill/profiles:
`f963755f370ea7a309ad61546025401b1e223394755feee73a49d84166991058`.
Метод: SHA256 UTF8JSON(sorted relativepath→SHA256bytes), compact separators,
сортировка ключей; task/integration-файлы в bundle не входят.

Временные подробные результаты:
`/tmp/grippo-audit-behavior-grading.json`,
`/tmp/grippo-exercise-audit-tool/verification.json`,
`/tmp/grippo-exercise-kit-validation-result.json`,
`/tmp/grippo-exercise-audit-instruction-manifest.json`.
Исходные сценарии и критерии остаются в skill для повторного прогона, даже
если временные отчёты удалятся.

Независимое ревью первоначального комплекта: **APPROVE** на тот момент.
Последующее жёсткое ревью ниже выявило пропущенные дефекты; этот исторический
вердикт не подтверждает исправленную текущую версию. У старых15 ответов не было
полных индивидуальных receipts до запуска; поздний bundle hash не доказывает,
что все они выполнялись на окончательных references. Их результаты сохраняются
как исторические, а не актуальная валидация всей версии.
БД/production, схемы, runtime, клиент и пользовательский прежний taskdoc
не менялись. Отсутствие нативного discovery в этой сессии и непроверенный
реальный каталог не выдаются за PASS.

## Повторное жёсткое ревью 18 октября 2026

Запрос: независимо перепроверить skill, profiles и helper, исправить все
подтверждённые дефекты в этих границах. Исходное дерево сохранено во временном
before manifest; существующие интеграционные правки и пользовательская история
аудита не являются результатом этого повторного прохода.

Независимые направления: научные методы/источники, структурный helper,
поведенческие проверки и достоверность прежних claims. Root — единственный
writer исправлений. Production, SSH, DB, Docker, .env и SQL backups вне задачи.

Подтверждённые дефекты повторного прохода:

| ID | Уровень | Было → стало |
|---|---|---|
| S01 | P2 | Decimal принимал underscores/Unicode digits и строки с overflow, хотя JS Number получал NaN/Infinity → ASCII decimal grammar и finite consumer conversion. Повторное ревью также нашло обход через Python strip(U+001C/U+0085); оставлен только ASCII whitespace. |
| S02 | P2 | recovery24.0 отвергалось как Python float → общий finite integral JSON number predicate; bool/string/fraction/negative остаются невалидными. |
| E01 | P2 | Oracle A02/C02/B03 мог принять безопасное откладывание вместо нужного after → обязательный конкретный supported deliverable; обоснованный hold только неизвестной части. |
| E02 | P2 | Researcher проверял готовые source summaries, reviewer — только плохие предложения → новые случаи с реальным primary-source чтением, корректным APPROVE и допустимыми положительными вычислениями/редакцией. |
| E03 | P2 | Поздний hash bundle не связывал старые ответы с исполненными инструкциями → до каждого нового запуска frozen manifest/assignment/settings; после — answer hash, identity, read-level receipt и независимый grader. Старые16 результатов отмечены historical с неполной provenance. |
| S03 | P3 | Nullable dictionary group FK=null назывался invalid UUID → observation dictionary_group_unassigned с явным риском пропуска grouped API; nonnull malformed/orphan FK остаются findings. |

Научный reviewer сверил14 первичных/официальных источников: новых
подтверждённых содержательных P0–P3 нет. Это проверка выбранных утверждений
и источников комплекта, а не систематический обзор всей науки об упражнениях.
Научные references и пять profiles не переписывались без доказанного дефекта.

Helper:51 исходный авторский CLI-сценарий PASS;95 независимых сценариев PASS,
0FAIL. Проверены hashes до/после, отсутствие echo контрольных данных, stdout/
stderr и exit codes. Независимый повторный вердикт — APPROVE для helper/ref;
S01/S02 CLOSED, S03 ACCEPTED. Подробности:
`/tmp/grippo-hard-review-snapshot-final.json`.

### Новые слепые результаты

8 новых уникальных задач,9 исполнений,8 отдельных dispatches:9PASS/0FAIL/
0INCONCLUSIVE у независимого grader. H01 отдельно выполнен через обычный
AGENTS routing и через дословный профиль ведущего; это два исполнения одной
задачи, а не две новые задачи. Все пять profiles проверены как переданный
текст; native custom-role activation остаётся NOT_CONFIRMED.

| Cases | Проверено | Результат |
|---|---|---|
| H01, normal routing + lead profile | Реальные supported category/ru after, rawNULL vs public fallback,3×5coverage с пропусками,2groups/2cells/2rows/1exercise | 2PASS |
| H02 | Допустимые20N·m/1000N по модели, целевая изометрия, нулевая механическая работа отдельно от усилия/метаболизма, без вывода процентов | PASS |
| H03 | Выбранный press-канон против старого fly: конкретные name/category/исполняемый description, scoped-out поля сохранены | PASS |
| H04 | Настоящая эквивалентность в заранее принятой границе и неопределённое сравнение; MRI не превращается в muscle map | PASS |
| H05 | Чтение реального publisher full text без готового source summary: методы/головки мышц/фазовый результат; grader сам повторно открыл первоисточник | PASS |
| H06 | Корректный APPROVE полного ограниченного read-only patch, без ложного hold и разрешения записи | PASS |
| QH01 | По принятой многоцелевой редакционной модели конкретный after57/29/14 и largest remainder; исключение forearm по роли, а не по2% | PASS |
| QH02 | intermediate→advanced по однозначной технической рубрике/цепочке смен опор; сила и индивидуальная готовность отдельно | PASS |

Эти синтетические after и рубрики не являются предложениями для production.
Задания и критерии после фиксации ответов включены в baseline v3:24cases.
При следующем существенном пересмотре нужны новые holdouts; опубликованные
кейсы больше не считаются скрытыми.

У каждого запуска до dispatch сохранены точные instruction/assignment hashes
и параметры. Ответы зафиксированы до grader. Позднее изменились только три
evaluation-файла при публикации baseline/ключа и уточнении протокола;
семантические profiles/прочитанные audit references остались теми же.
Итоговые receipts связывают исходные manifests, executor identities,
answer hashes, read-level self-reports и независимые grades. Exact served
model неизвестен; указан inherited, actual tool agent_type=default,
fork_turns=none. Они не являются независимой аттестацией всех runtime events.

Дополнительная P3-неточность: executor H02 назвал историю inherited, хотя
фактический родительский вызов был fork_turns=none. Raw receipt и ответ
сохранены; отдельный history-reconciliation содержит корректное значение
и его источник. Это не доказательство утечки ключа. Протокол теперь явно
разделяет параметр вызова и впечатление исполнителя о контексте.

Временные артефакты повторного прохода:
`/tmp/grippo-hard-review-grading.json`,
`/tmp/grippo-hard-review-extra-grading.json`,
`/tmp/grippo-hard-review-lead-grading.json`;
полный per-run набор и `behavioral-verification.json` находятся в
`/var/folders/gs/p9xpr8w95s3g6tcyx10tqbc80000gn/T/grippo-audit-hard-review-bb5xh106/`.
Постоянные cases/criteria сохраняются в skill; temp receipts могут быть
удалены системой, поэтому ни этот отчёт, ни будущий прогон не должны
приписывать утраченным артефактам отсутствующее доказательство.

### Состояние файлов по окончании повторного ревью

Script SHA256 на конец этого прохода:
`e46d5d28235bd9e98bb11a8e0c2b9488fb65dab2884f3a5967aa524b0089e35d`.
19-file bundle SHA256 на конец этого прохода по указанному выше методу:
`eeeb5166e8106fe447dd3f4c6c1508a9d0bfb065ce734d077f7f379d07927ed4`.
Это manifest итоговых файлов; он не подменяет receipts исполненных версий.

Skill-creator quick_validate PASS. Изолированная metadata/source копия:
validator PASS8skills/13agents/695links/135indexedfiles; из документов
исключён только исходный userdoc с14 внешними ссылками, env/dump/runtime
содержимое не копировалось. Полный validator рабочего дерева по-прежнему
сообщает те же14 исходных ошибок только этого userdoc. Validator и userdoc
не изменены; SHA userdoc сохранён:
`71171a2dfa90ddaf227006a7f97443bd5d860ef02903de72e51994af7c119757`.

Настоящий полный snapshot NOT_RUN, native activation NOT_CONFIRMED;
production/БД/runtime/клиент не проверялись и не менялись. Первоначальные
PASS не переносятся автоматически.

Итог независимого повторного ревью: helper/ref — **APPROVE**, научная часть —
**APPROVE** в проверенных пределах, workflow/evaluation/provenance —
**APPROVE** (`/tmp/grippo-hard-review-evaluation-final.json`). Все5 исходных
P2 закрыты; nullable-FK уточнение и дополнительная metadata-коррекция P3
проверены. Открытых применимых findings нет. Каждый вердикт ограничен своим
scope; вместе они не подтверждают неисполненные проверки, перечисленные выше.

## Расширение до предметной команды

Новый запрос: отдельные владельцы переводов, процентов и других направлений;
исследователи должны действительно искать и анализировать множество подходящих
источников. Это изменение инструкций/команды, не продолжение production-правок.
Предыдущие hashes/проверки выше относятся к завершённым предыдущим версиям.

Состав теперь10 специализаций: ведущий, coach, biomechanics, muscle-map,
difficulty, equipment, localization, researcher, evidence-analyst, reviewer.
Новые5profiles — muscle-map/difficulty/equipment/localization/evidence-analyst;
researcher, lead и reviewer уточнены под совместную работу. Общие правила
научной осторожности сохранены. Два новых references: specialist-handoffs
и research-program; entrypoint/routing/UI prompt направляют к ним.

Ownership: root — общие инструкции и интеграция; specialist author — четыре
предметных profiles; research author — researcher/evidence-analyst/program;
отдельный reviewer — независимое ревью; case author — слепые задания/ключи
только во временных файлах. Исходное состояние сохранено в before manifest
`/var/folders/gs/p9xpr8w95s3g6tcyx10tqbc80000gn/T/grippo-team-expansion-71cp6hu5/`.

Критерии: у полного аудита реальные отдельные исполнители/выходы направлений,
при лимите4 active agents — работа волнами. Канон версионируется; зависимые
карты/уровни/локали перепроверяются при его изменении. Поиск включает real
queries/opened papers, альтернативные результаты и read levels; URL/публикации/
studies/cohorts считаются отдельно, analyst проверяет вывод независимо.
Принятая редакционная политика позволяет конкретный after без выдуманного
физиологического доказательства. Локализация охватывает base/en/ua/ru и
отделяет raw storage от fallback, оборудование — точный вариант и null/false.

### Верификация расширения

Независимое статическое ревью10profiles и связанных контрактов — **APPROVE**,
0findings. Reviewer прочитал29файлов, проверил текущий i18n/DTO/entity контракт
на чтение и открыл3методологических опоры. Артефакт:
`/tmp/grippo-team-independent-review.json`.

7новых слепых заданий,4dispatches: **7PASS/0FAIL/0INCONCLUSIVE** у другого
независимого grader. По два отдельных профильных задания в каждом офлайн-пакете;
исследователь выполнял отдельное онлайн-задание. Это проверка семантики
инструкций семи назначенных профилей и плана команды, не полный реальный
каталожный аудит цепочкой всех10ролей. Прежние PASS на новую версию не перенесены.

| Cases | Что фактически проверено | Результат |
|---|---|---|
| L27 | Доказанные ошибки base/ru, корректный en и rawUA=null с fallback именно к base; минимальный языковой after | PASS |
| P38 | Полный редакционный after60/40 по принятой нормировке, без силовых процентов и переноса на соседний вариант | PASS |
| D46 | beginner→intermediate по scoped технической рубрике; тяжёлый подход другого варианта не меняет enum | PASS |
| E52 | Идентичность plate-loaded машины, отдельные опоры/альтернативы и сохранение optional externalWeight=false | PASS |
| S63 | Четыре публикации/три независимые когорты, acute EMG/долгосрочная толщина/модель отдельно; полезный нейтральный вывод | PASS |
| T74 | План10различимых owners/выходов при трёх рабочих слотах помимо lead, зависимости/coverage/пропуски и другой reviewer | PASS |
| W85 | Настоящий многопервоисточный поиск по calf raises, несколько первичных работ и корректные read levels; grader сам открыл6использованных первичных/официальных источников и сверил опорные методы/результаты | PASS |

Артефакты graders: `/tmp/grippo-team-expansion-grading.json` и
`/tmp/grippo-team-web-grading.json`. Historical web opens/queries подтверждаются
receipt и содержанием ответа; полной независимой трассы исходных tool returns
нет. Независимая текущая проверка scientific source support не объявляется
аттестацией всех прежних вызовов. Abstract не считается прочитанным full text.

У всех запусков до dispatch сохранены manifests/assignments/settings; ответы
зафиксированы до grader/key. Основные profiles/прочитанные core references
не менялись между запуском и оценкой. После фиксации опубликованы только три
evaluation-файла: cases/key/behavioral-evaluation. Теперь baseline v4 содержит
31case; old24объекта сохранены без изменений, new7точно совпадают с исходными
заданиями. Это известные regression cases, будущим существенным изменениям
нужны новые holdouts. Postpublication review — **APPROVE**, 0findings:
`/tmp/grippo-team-postpublication-review.json`.

Итоговый26-file skill/profile bundle SHA256 по прежнему методу:
`43f9a9dd83c89284668ffe58615c1c68a423cd63a35b2053a860352c2f21895d`.
Это итоговое состояние файлов, не замена per-run receipts. Все4набора
receipts и `behavioral-verification.json` сохранены во временной папке этого
прохода, указанной выше. Их удаление системой не позволяет позднее заявлять
неподтверждённую provenance.

Quick_validate PASS; metadata/source fixture validator PASS:
8skills/18agents/723local links/135indexedfiles. Полный validator рабочего
дерева сохраняет14исходных ошибок внешних ссылок userdoc; новых ошибок0,
validator/userdoc сохранены. Helper не менялся, его hash по-прежнему e46d5d…;
новый реальный snapshot не проверялся и повторных CLI-тестов неизменного
helper не проводили. Нативная загрузка новых custom names — NOT_CONFIRMED;
проверены переданные дословно инструкции default agents. Exact serving model
и полная runtime/history isolation не подтверждены.

Никаких DB/SSH/Docker/.env/SQL/runtime/deploy действий в задаче. Синтетические
after и проверка источников не являются применёнными изменениями каталога.

## Финальная дотошная перепроверка — 18 октября 2026

Запрос: ещё раз очень внимательно проверить качество и корректность всей
команды, исправить подтверждённые дефекты. Три независимых направления review:
научные правила/источники; роли и контракт текущего backend; качество
поведенческих проверок и достоверность прежних отчётов. Это review инструкций,
не продолжение production-аудита или применение каталожных предложений.

### Исправленные справочные дефекты

В самом научном skill и десяти профилях новых подтверждённых дефектов не
обнаружено. Прямые справочные зависимости содержали старые утверждения об
уже исправленном коде: команда могла бы повторно объявить их текущими ошибками.
Исправлены десять групп утверждений и их повторы:

| Было в справке | Подтверждено по текущему коду |
|---|---|
| Вложенные массивы в name/description проходят DTO | IsObject(each:true) отвергает массивы вместо localized rows; непустой текст при этом не обязателен |
| value:null проходит IsOptional и падает на trim | ValidateIf(value !== undefined) + IsString отклоняет явный null; отсутствие value допустимо |
| Неизвестные muscle/equipment IDs заранее не проверяются | validateReferences работает в transaction через manager с for_key_share; неизвестные ID дают BadRequest, дедупликация поиска не запрещает повторные связи |
| Update проверяет existence вне transaction | READ COMMITTED, pessimistic_write родителя и чтения/замены через тот же manager |
| Delete считает usage вне transaction | Parent lock, usage count и удаления находятся в одной transaction; это ещё не результат SQL concurrency test |
| Swagger объявляет ветви components optional | ApiProperty документирует обязательные nullable ключи |
| Components/ветви допускают массивы | IsObject вместе с nested validation отвергает эту форму |
| Components parent можно не передать API | IsDefined/IsObject требуют parent; четыре дочерних ключа обязательны с object/null значениями |
| Muscle size/sensitivity не имеют transformer | Текущий MusclesEntity преобразует hydrated numeric через Number с сохранением null |
| Nullable iteration weights превращают SQL null в NaN | Все пять текущих IterationsEntity transformers сохраняют null перед parseFloat; raw SQL/нечисловые значения отдельно |

Правки ограничены тремя справками:
[catalog-and-dictionaries](../.agents/skills/grippo-domain-data/references/catalog-and-dictionaries.md),
[workflows-and-review](../.agents/skills/grippo-domain-data/references/workflows-and-review.md),
[localization-and-http](../.agents/skills/grippo-identity-api/references/localization-and-http.md).
Nullable storage не подменяет request contract; удаление языка при replacement
требует его отсутствия в обоих наборах name/description. Оговорки о direct
service/import, raw SQL, неизвестной production revision и границах доказательств
сохранены. Приложение и данные не изменялись.

### Что фактически проверено заново

- Scientific review: актуальные правила процентов, целевой изометрии,
  сложности/готовности и исследовательского синтеза — APPROVE в проверенном
  scope. Reviewer открыл первичные abstracts Kubo/Suprak; отдельный source
  reviewer проверил опорные записи библиотеки. Чтение abstract/официальной
  страницы не объявляется full-text review всей литературы.
- Contract review: десять профилей, текущие i18n/DTO/entities/services и
  девять статических сценариев; старые справочные противоречия выявлены
  отдельно и исправлены автором. Повторное независимое review всех десяти
  уточнённых утверждений — APPROVE, открытых findings нет.
- Evaluation review: 31 текущий baseline case и критерии, согласованность
  четырёх прежних run chains/семи ответов. Это проверка доказательств прежних
  PASS, а не повторное исполнение всех 31 cases.
- Новый C96: один свежий offline holdout, новый default executor с
  fork_turns=none и дословным профилем lead. Другой grader: PASS по восьми
  критериям. В девяти scoped полях корректно разделены два готовых after,
  подтверждённые v2 retain и pending после смены канона; устаревшие v1
  карта/переводы/синтез/approval не финализированы. Это интеграция уже данных
  синтетических отчётов, не live исполнение аудита всей командой.
- После безопасного Jest discovery запущен существующий DTO spec:
  49/49 PASS. Дополнительная временная проверка реальных ValidationPipe и
  transformer functions: 56 DTO scenarios + 7 колонок = 63/63 PASS. Она
  проверяет исправленные shape/null/false утверждения, а не HTTP, driver
  hydration всей БД или конкурентные SQL-сценарии. Постоянные specs не добавлялись.
- Skill-creator quick_validate: PASS. Изолированная metadata/source fixture:
  PASS — 8 skills, 18 agents, 727 local links, 135 indexed files. Это
  format/routing/links/inventory без чтения env/dump/source data; полный
  validator отдельно сохраняет те же 14 исходных внешних ссылок
  пользовательского исторического документа, новых ошибок нет.

Формат standalone TOML (project .codex/agents, три обязательных поля,
наследование при отсутствии overrides) дополнительно сверен с
[официальной документацией Codex](https://learn.chatgpt.com/docs/agent-configuration/subagents).
Это подтверждает соответствие формата; нативная загрузка новых custom names
текущим клиентом остаётся NOT_CONFIRMED. Проверено применение текста профиля
через доступный default agent. Serving model не аттестован.

### Артефакты и границы

Указатель на before manifest, исходные три справки, diff, validation и C96:
`/tmp/grippo-final-audit-current.json`. Независимые отчёты:
`/tmp/grippo-final-science-review.json`,
`/tmp/grippo-final-contract-review.json`,
`/tmp/grippo-final-evaluation-review.json`,
`/tmp/grippo-final-cross-role-grading.json`.

Для C96 инструкции/assignment зафиксированы до dispatch, answer SHA256 —
`3be7c7aa576de00e6d123506e8bcfe294d233bc923fe807a43f816a4725a5f56`
зафиксирован до grader. На момент фиксации все 71 frozen instruction files
были неизменны. После неё исправлена одна не прочитанная C96 справка
workflows-and-review; все девять заявленных прочитанных входов совпадают с
receipt. Это post-fix inventory drift, не ретроактивное изменение raw receipt.
Чтения подтверждены self-report/hash сверкой; полной независимой трассы всех
tool returns нет. Системное удаление временных файлов ограничит последующую
проверку provenance. Новый holdout не добавлен в baseline assets; baseline
по-прежнему содержит 31 известный case.

26-file skill/profile bundle не менялся:
`43f9a9dd83c89284668ffe58615c1c68a423cd63a35b2053a860352c2f21895d`.
Helper также не менялся (e46d5d…); его прежние CLI PASS не объявляются новым
запуском. Реальный полный каталог, видео всех упражнений, production SQL,
работа всех десяти ролей на полном каталоге и native activation не проверялись.
Пользовательская история аудита и validator сохранены.

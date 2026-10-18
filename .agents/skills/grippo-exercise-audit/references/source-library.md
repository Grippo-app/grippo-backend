# Стартовая библиотека для аудита упражнений

Последняя проверка ссылок и указанных разделов: **2026-10-18**.
Это небольшой набор примеров и методов, а не полный обзор литературы. Перед
новым существенным выводом проверь релевантную работу и доступные обновления.
Ни одна работа ниже не валидирует универсальные точные проценты мышц Grippo,
уровни beginner/intermediate/advanced или семантику equipment enum приложения.

`Read level` описывает фактически проверенный материал при создании библиотеки:
**full-text sections** — доступны и прочитаны перечисленные разделы;
**abstract** — проверено резюме, полные методы не проверены;
**official page/TOC** — официальная страница/оглавление, содержание книги или
платного видео не считается просмотренным. Новое чтение отмечай отдельно.

## Методология

### M01 — интерпретация EMG, Vigotsky et al., 2018

**Interpreting Signal Amplitudes in Surface Electromyography Studies in Sport
and Rehabilitation Sciences.** DOI
[10.3389/fphys.2017.00985](https://doi.org/10.3389/fphys.2017.00985).
[Официальный полный текст](https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2017.00985/full).

- Тип: методологический **review**, не новый тренировочный эксперимент.
  Опубликован 4 января 2018; `2017` в DOI не является датой публикации.
- Read level: full-text sections — force production/force sharing,
  longitudinal outcomes, summary of considerations.
- Поддерживает: ограничения вывода о силе и её распределении из амплитуды sEMG;
  необходимость учитывать условия сокращения и способ регистрации.
- Не поддерживает: превращение `%MVC` в проценты вклада разных мышц; вывод
  об оптимальном упражнении или гипертрофии только по острому сигналу.

### M02 — EMG как предиктор гипертрофии, Vigotsky et al., 2022

**Longing for a Longitudinal Proxy: Acutely Measured Surface EMG Amplitude is
not a Validated Predictor of Muscle Hypertrophy.** DOI
[10.1007/s40279-021-01619-2](https://doi.org/10.1007/s40279-021-01619-2).
[Авторская копия публикации](https://andrewvigotsky.com/studies/Vigotsky_2022_Sports_Med_sEMG_hypertrophy.pdf).

- Тип: методологический **leading article/commentary**, не систематический
  обзор и не первичное сравнение тренировочных программ.
- Read level: full-text sections — abstract, Background и разбор логики
  использования acute sEMG для longitudinal adaptations.
- Поддерживает: необходимость отдельного обоснования предиктивной валидности
  острого EMG для роста мышц.
- Не поддерживает: утверждение, что EMG бесполезно для любого вопроса, либо
  что более низкий сигнал гарантирует равную/лучшую гипертрофию.

### M03 — SENIAM, Hermens et al., 2000

**Development of recommendations for SEMG sensors and sensor placement
procedures.** DOI
[10.1016/S1050-6411(00)00027-4](https://doi.org/10.1016/S1050-6411(00)00027-4).
[PubMed](https://pubmed.ncbi.nlm.nih.gov/11018445/).

- Тип: исходная методологическая публикация о разработке рекомендаций SENIAM
  (обзор практики, экспертная разработка и оценка процедур), не exercise RCT.
- Read level: abstract, включая процесс разработки и охват 27 мышц;
  полные процедуры для отдельных мышц здесь не проверялись.
- Поддерживает: важность стандартов датчиков и их расположения, описания метода.
- Не поддерживает: автоматическую достоверность всех выводов статьи, которая
  упоминает SENIAM; для конкретного расположения нужна сама процедура.

### M04 — мышечные силы и коактивация, Pizzolato et al., 2015

**CEINMS: A toolbox to investigate the influence of different neural control
solutions on the prediction of muscle excitation and joint moments during
dynamic motor tasks.** DOI
[10.1016/j.jbiomech.2015.09.021](https://doi.org/10.1016/j.jbiomech.2015.09.021).
[Полный текст в репозитории лаборатории соавтора](https://rcnl.rice.edu/PDFs/job2015.pdf).

- Тип: **первичная методологическая/программная работа**, сравнительные
  примеры neuromusculoskeletal modelling; не исследование карт упражнений.
- Read level: full-text sections — introduction, methods/calibration/validation,
  discussion of neural mapping and model limitations.
- Поддерживает: разные модельные решения могут распределять мышечные силы и
  коактивацию по-разному при одной геометрии и измеренном движении; нужны
  калибровка и валидация.
- Не поддерживает: чтение отдельных мышечных сил прямо из net joint moment;
  перенос модельного результата на любое упражнение или человека.

### M05 — отсутствие различия и эквивалентность, Lakens, 2017

**Equivalence Tests: A Practical Primer for t Tests, Correlations, and
Meta-Analyses.** DOI
[10.1177/1948550617697177](https://doi.org/10.1177/1948550617697177).
[Версия издателя в репозитории университета автора](https://pure.tue.nl/ws/portalfiles/portal/80918653/lakeequi2017.pdf).

- Тип: **методологический primer** с процедурой TOST и примерами,
  не первичное exercise-исследование.
- Read level: full-text sections — introduction, equivalence bounds/TOST,
  differences between dependent means.
- Поддерживает: незначимый NHST-результат сам по себе не доказывает равенства;
  эквивалентность требует обоснованных границ и подходящего анализа.
- Не поддерживает: применение произвольного порога «малого эффекта» ко всем
  мышцам или обратный расчёт недостающих paired-данных.

## Примеры упражнений и границы переноса

### E01 — стоячие/сидячие calf raises, Kinoshita et al., 2023

**Triceps surae muscle hypertrophy is greater after standing versus seated
calf-raise training.** DOI
[10.3389/fphys.2023.1272106](https://doi.org/10.3389/fphys.2023.1272106).
[Официальный полный текст](https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2023.1272106/full).

- Тип: **первичная 12-недельная интервенция**, within-person split-leg;
  14 нетренированных взрослых, по 7 женщин и мужчин. Условия ног
  counterbalanced по доминированию; не переименовывай это в parallel-group RCT.
- Read level: full-text sections — abstract, participants/program,
  MRI outcomes/results, discussion.
- Поддерживает: различие гипертрофии gastrocnemius между изученными условиями;
  для soleus статистически значимого межусловного различия не обнаружено.
- Не поддерживает: равную эффективность для всех популяций, эквивалентность
  soleus по одному p, отсутствие работы бедра/корпуса или физиологическое
  `calf 100`. Измерялись объёмы мышц голени, не доли общей работы тела.

### E02 — ширина хвата в жиме, Larsen, Gomo & van den Tillaar, 2021

**A Biomechanical Analysis of Wide, Medium, and Narrow Grip Width Effects on
Kinematics, Horizontal Kinetics, and Muscle Activity…** (сокращённое название;
статья о sticking region при 1RM-жиме). DOI
[10.3389/fspor.2020.637066](https://doi.org/10.3389/fspor.2020.637066).
[Официальный полный текст](https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2020.637066/full).

- Тип: **первичное острое within-subject repeated-measures** сравнение трёх
  хватов, рандомизированный порядок; 14 тренированных мужчин, 1RM.
  Опубликовано 22 января 2021, том/DOI имеют `2020`.
- Read level: full-text sections — methods/procedures, abstract/results,
  Table 3 с EMG по регионам повторения.
- Поддерживает: хват меняет наблюдаемые кинетические/кинематические условия;
  зарегистрирован больший medial-triceps EMG при medium/narrow против wide.
- Не поддерживает: карты «трицепс 50/55%», точное распределение между частями
  груди, преимущество роста или сложность упражнения для новичков.

### E03 — ширина хвата в pulldown, Andersen et al., 2014

**Effects of grip width on muscle strength and activation in the lat
pull-down.** DOI
[10.1097/JSC.0000000000000232](https://doi.org/10.1097/JSC.0000000000000232).
[PubMed](https://pubmed.ncbi.nlm.nih.gov/24662157/).

- Тип: **первичное острое сравнение** 6RM/EMG; 15 мужчин, pronated хват
  1/1.5/2 biacromial distance, randomized/counterbalanced order.
- Read level: **abstract**, получен в индексированном тексте PubMed/издателя;
  прямое открытие периодически ограничено, полный текст не проверен.
- Поддерживает: в анализе целого движения различия latissimus EMG не обнаружены;
  для eccentric-фазы авторы сообщают wide > narrow. Фазу нельзя потерять.
- Не поддерживает: эквивалентность хватов, отсутствие любого различия, числа
  `58 → 56` или одинаковую гипертрофию. Последняя фраза abstract о росте —
  экстраполяция авторов, а не измеренный тренировочный исход.

### E04 — хват/наклон в pulldown, Buonsenso et al., 2025

**Electromyographic Analysis of Back Muscle Activation During Lat Pulldown
Exercise: Effects of Grip Variations and Forearm Orientation.** DOI
[10.3390/jfmk10030345](https://doi.org/10.3390/jfmk10030345).
[Официальный полный текст](https://www.mdpi.com/2411-5142/10/3/345).

- Тип: **первичное острое within-subject сравнение** семи вариантов с
  рандомизированным порядком; авторы называют дизайн observational.
  40 мужчин с ≥5 лет тренировок, 5 повторений при 70% 1RM.
- Read level: full-text sections — abstract, methods 2.1–2.3,
  results 3, discussion/limitations.
- Поддерживает: latissimus EMG-различия между изученными вариантами не обнаружены;
  posterior deltoid выше при wide-pronated + 30° наклон против двух указанных
  вертикальных вариантов.
- Не поддерживает: отсутствие эффектов любого хвата, точные мышечные доли,
  преимущества роста или доказанную безопасность наклона. Обобщающие фразы
  abstract проверяй против results: там есть исключение для posterior deltoid.

### E05 — ширина стойки/положение штанги, Larsen et al., 2021

**Effects of Stance Width and Barbell Placement on Kinematics, Kinetics, and
Myoelectric Activity in Back Squats.** DOI
[10.3389/fspor.2021.719013](https://doi.org/10.3389/fspor.2021.719013).
[Официальный полный текст](https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2021.719013/full).

- Тип: **первичное острое repeated-measures** исследование 3RM;
  18 тренированных участников, четыре сочетания high/low bar и narrow/wide.
- Read level: full-text sections — design/participants/procedures,
  results joint moments/contributions и myoelectric activity, discussion.
- Поддерживает: зависимость суставной кинетики и зарегистрированного EMG от
  условий и фазы; доля hip/knee/ankle moments — именно доля выбранных моментов.
- Не поддерживает: распределение силы между мышцами, точные карты Hack Squat,
  обязательную для всех глубину либо клиническую безопасность по EMG.

### E06 — кинетика стойки в приседе, Lahti et al., 2019

**Effects of barbell back squat stance width on sagittal and frontal hip and
knee kinetics.** DOI
[10.1111/sms.13305](https://doi.org/10.1111/sms.13305).
[Официальная публикация/abstract](https://onlinelibrary.wiley.com/doi/pdf/10.1111/sms.13305).

- Тип: **первичное острое сравнение** 14 любителей регби, narrow/wide,
  70/85% 1RM, femur-parallel depth. Online 2018; выпуск 29(1), 2019.
- Read level: **abstract** на странице издателя; полные методы не проверены.
- Поддерживает: в изученных условиях wide имеет большее hip-to-knee extension
  net joint moment ratio и knee-adduction NJM.
- Не поддерживает: соответствующие доли ягодичных/приводящих, перенос на
  направляющие машины или снижение риска травм, которое здесь не измерялось.

## Практическая техника и оборудование

### P01 — NSCA, Exercise Technique Manual, 4th ed., 2022

[Официальная страница издателя, описание и оглавление](https://us.humankinetics.com/products/exercise-technique-manual-for-resistance-training-4th-edition-with-hkpropel-online-video).
ISBN **9781492596998**.
[NSCA: указание руководства среди учебных материалов](https://www.nsca.com/nsca-cpt-study/).

- Тип: **профессиональное руководство**, не эксперимент. Read level:
  official page/TOC; полный текст и HKPropel-видео не просмотрены.
- Поддерживает: существование принятой тренерской номенклатуры и разделения
  вариантов/суставных категорий. В оглавлении Dumbbell Pull-Over помещён в
  single-joint, Cable Crossover — machine; это конвенции именно руководства.
- Не поддерживает: точную технику любой записи Grippo, принадлежность к enum
  `cable`/`cable_crossover`, AND/OR оборудования, коэффициент массы тела,
  научную истинность уровня сложности или мышечных процентов.
- Для конкретной машины ищи официальный manual с совпадающими manufacturer,
  model и вариантом установки; запиши рисунок/страницу. Руководство другой
  модели — косвенный источник. Не изобретай модель по имени «Hack» или фото.

## Что добавлять при новой задаче

Расширяй библиотеку только источником, который меняет решение или метод.
Для новой записи укажи DOI/официальный URL, год/версию, дизайн, read level,
точный поддерживаемый claim, ограничения и дату проверки. Новая публикация
не вытесняет старую автоматически; сопоставь методы и исходы.

Нет проверенного универсального первичного источника, который определяет
для каталога «всем стабилизаторам 1–3%», «удалить любую долю <5%» или
«сумма EMG = 100% нагрузки». Это продуктовые гипотезы, а не факты библиотеки.
Решение об учёте стабилизаторов сначала требует явного определения метрики,
после чего можно проверять её последовательность и полезность.

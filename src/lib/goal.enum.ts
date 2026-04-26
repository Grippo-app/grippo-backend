export enum GoalPrimaryGoalEnum {
    BUILD_MUSCLE = 'build_muscle',
    GET_STRONGER = 'get_stronger',
    LOSE_FAT = 'lose_fat',
    RETURN_TO_TRAINING = 'return_to_training',
    MAINTAIN = 'maintain',
    GENERAL_FITNESS = 'general_fitness',
}

export enum GoalSecondaryGoalEnum {
    BUILD_MUSCLE = 'build_muscle',
    GET_STRONGER = 'get_stronger',
    LOSE_FAT = 'lose_fat',
    RETURN_TO_TRAINING = 'return_to_training',
    MAINTAIN = 'maintain',
    GENERAL_FITNESS = 'general_fitness',
    CONSISTENCY = 'consistency',
}

/**
 * Optional tag-based hints attached to a user's goal.
 *
 * These tags are NOT used for hard filtering or validation. They are passed
 * to the AI as additional context when generating training plans, sessions,
 * or exercise recommendations. Treat each value as a soft signal — the AI is
 * expected to interpret the combination holistically.
 *
 * Conventions:
 *  - Prefix groups related tags so the UI can render them by section and the
 *    AI can recognize axes (SPORT_*, FOCUS_*, IMPROVE_*, AVOID_*, PREFER_*,
 *    PHASE_*, *_CARE).
 *  - Soft semantic overlap is intentional. Multiple tags pointing at the same
 *    intent (e.g. LOWER_BACK_CARE + AVOID_HEAVY_SPINAL_LOADING) reinforce the
 *    signal for the AI rather than contradicting each other.
 *  - Hard duplicates with existing structured fields (e.g. user `experience`,
 *    `excludedMuscles`, `excludedEquipments`, `target`, `secondaryGoal`) are
 *    intentionally NOT included here — those have their own sources of truth.
 */
export enum GoalPersonalizationKeyEnum {
    // ──────────────────────────────────────────────────────────────────
    // SCHEDULE — how often / when the user trains
    // ──────────────────────────────────────────────────────────────────
    LOW_FREQUENCY = 'low_frequency',                 // 1–2 sessions/week
    MODERATE_FREQUENCY = 'moderate_frequency',       // 3–4 sessions/week
    HIGH_FREQUENCY = 'high_frequency',               // 5+ sessions/week
    WEEKDAYS_ONLY = 'weekdays_only',
    WEEKENDS_ONLY = 'weekends_only',
    FLEXIBLE_SCHEDULE = 'flexible_schedule',         // can adapt around life
    UNPREDICTABLE_SCHEDULE = 'unpredictable_schedule', // chaotic, hard to plan

    // ──────────────────────────────────────────────────────────────────
    // SESSION DURATION — wide buckets so users see clear boundaries
    // and the AI gets a meaningfully different signal between them.
    // ──────────────────────────────────────────────────────────────────
    MINUTES_UP_TO_45 = 'minutes_up_to_45',           // express / time-pressed
    MINUTES_45_TO_90 = 'minutes_45_to_90',           // standard session
    MINUTES_90_PLUS = 'minutes_90_plus',             // long / high-volume
    FLEXIBLE_DURATION = 'flexible_duration',

    // ──────────────────────────────────────────────────────────────────
    // LIFESTYLE — persistent context, not daily readiness
    // ──────────────────────────────────────────────────────────────────
    HIGH_STRESS_LIFESTYLE = 'high_stress_lifestyle',
    POOR_SLEEP_PATTERN = 'poor_sleep_pattern',
    LOW_ENERGY_TENDENCY = 'low_energy_tendency',
    SEDENTARY_JOB = 'sedentary_job',
    PHYSICALLY_ACTIVE_JOB = 'physically_active_job',

    // ──────────────────────────────────────────────────────────────────
    // RECOVERY CONTEXT
    // ──────────────────────────────────────────────────────────────────
    RETURNING_AFTER_BREAK = 'returning_after_break',
    RECOVERING_FROM_INJURY = 'recovering_from_injury',
    LIMITED_RANGE_OF_MOTION = 'limited_range_of_motion',
    FATIGUE_MANAGEMENT = 'fatigue_management',
    RECOVERY_FOCUS = 'recovery_focus',
    MOBILITY_FOCUS = 'mobility_focus',

    // ──────────────────────────────────────────────────────────────────
    // CARE ZONES — sensitive areas to handle gently
    // ──────────────────────────────────────────────────────────────────
    NECK_CARE = 'neck_care',
    LOWER_BACK_CARE = 'lower_back_care',
    UPPER_BACK_CARE = 'upper_back_care',
    SHOULDER_CARE = 'shoulder_care',
    ELBOW_CARE = 'elbow_care',
    WRIST_CARE = 'wrist_care',
    HIP_CARE = 'hip_care',
    KNEE_CARE = 'knee_care',
    ANKLE_CARE = 'ankle_care',

    // ──────────────────────────────────────────────────────────────────
    // HEALTH CONDITIONS — medical context that affects programming
    // ──────────────────────────────────────────────────────────────────
    HYPERTENSION = 'hypertension',
    DIABETES = 'diabetes',
    ASTHMA = 'asthma',
    OSTEOPOROSIS = 'osteoporosis',
    ARTHRITIS = 'arthritis',
    HERNIATED_DISC = 'herniated_disc',
    CHRONIC_PAIN = 'chronic_pain',
    PREGNANCY = 'pregnancy',
    POSTPARTUM = 'postpartum',

    // ──────────────────────────────────────────────────────────────────
    // MOVEMENT RESTRICTIONS — patterns the AI should avoid
    // ──────────────────────────────────────────────────────────────────
    AVOID_HIGH_INTENSITY = 'avoid_high_intensity',
    AVOID_HEAVY_LOADING = 'avoid_heavy_loading',
    AVOID_HIGH_IMPACT = 'avoid_high_impact',         // jumping, plyometrics
    AVOID_DEEP_SQUATS = 'avoid_deep_squats',
    AVOID_LUNGES = 'avoid_lunges',
    AVOID_OVERHEAD_WORK = 'avoid_overhead_work',
    AVOID_HEAVY_SPINAL_LOADING = 'avoid_heavy_spinal_loading',
    AVOID_SPINAL_FLEXION = 'avoid_spinal_flexion',   // herniated disc protocol
    AVOID_TWISTING = 'avoid_twisting',
    AVOID_FLOOR_WORK = 'avoid_floor_work',
    AVOID_INVERSIONS = 'avoid_inversions',           // hypertension, pregnancy
    AVOID_VALSALVA = 'avoid_valsalva',               // hypertension, pregnancy
    NEEDS_SUPPORTED_MOVEMENTS = 'needs_supported_movements',

    // ──────────────────────────────────────────────────────────────────
    // SPORTS — gym is supportive work for a primary sport.
    // Grouped by training-program similarity, not by sport family —
    // disciplines whose gym work looks the same are merged into one tag.
    // ──────────────────────────────────────────────────────────────────
    // Strength / functional (each has a distinct gym program)
    SPORT_POWERLIFTING = 'sport_powerlifting',
    SPORT_BODYBUILDING = 'sport_bodybuilding',
    SPORT_OLYMPIC_WEIGHTLIFTING = 'sport_olympic_weightlifting',
    SPORT_CROSSFIT = 'sport_crossfit',
    SPORT_CALISTHENICS = 'sport_calisthenics',

    // Endurance
    SPORT_RUNNING = 'sport_running',
    SPORT_CYCLING = 'sport_cycling',
    SPORT_SWIMMING = 'sport_swimming',

    // Combat — split by grappling vs striking; gym work differs between
    // the two (grappling: grip/neck/isometrics; striking: explosive
    // power/core/shoulder durability), but is similar within each group.
    SPORT_GRAPPLING = 'sport_grappling',           // BJJ, wrestling, judo, sambo
    SPORT_STRIKING = 'sport_striking',             // boxing, MMA, muay thai, karate, kickboxing

    // Team / racquet — grouped by shared demands
    SPORT_TEAM_BALL_SPORTS = 'sport_team_ball_sports',  // soccer, basketball, volleyball, hockey, etc.
    SPORT_RACQUET_SPORTS = 'sport_racquet_sports',      // tennis, badminton, squash, padel

    // Outdoor / board / winter
    SPORT_CLIMBING = 'sport_climbing',
    SPORT_WINTER_BOARD_SPORTS = 'sport_winter_board_sports', // skiing, snowboarding

    // Mind-body / movement arts
    SPORT_YOGA_OR_PILATES = 'sport_yoga_or_pilates',

    // ──────────────────────────────────────────────────────────────────
    // FOCUS AREAS — body parts the user wants to prioritize.
    // Top-level tags (FOCUS_CHEST/BACK/SHOULDERS/ARMS/ABS_AND_CORE/LEGS)
    // map 1:1 to the project's MuscleGroupEnum. Sub-focus tags
    // (FOCUS_GLUTES, FOCUS_HAMSTRINGS, FOCUS_QUADRICEPS, FOCUS_CALVES,
    // FOCUS_REAR_DELTS, FOCUS_FOREARMS_AND_GRIP) cover the common
    // "lagging body part" requests inside those groups.
    // ──────────────────────────────────────────────────────────────────
    FOCUS_CHEST = 'focus_chest',
    FOCUS_BACK = 'focus_back',
    FOCUS_SHOULDERS = 'focus_shoulders',
    FOCUS_REAR_DELTS = 'focus_rear_delts',           // commonly lagging
    FOCUS_ARMS = 'focus_arms',
    FOCUS_FOREARMS_AND_GRIP = 'focus_forearms_and_grip',
    FOCUS_ABS_AND_CORE = 'focus_abs_and_core',
    FOCUS_LEGS = 'focus_legs',
    FOCUS_GLUTES = 'focus_glutes',
    FOCUS_QUADRICEPS = 'focus_quadriceps',
    FOCUS_HAMSTRINGS = 'focus_hamstrings',           // commonly lagging
    FOCUS_CALVES = 'focus_calves',

    // ──────────────────────────────────────────────────────────────────
    // PHYSICAL QUALITIES — secondary attributes to develop
    // ──────────────────────────────────────────────────────────────────
    IMPROVE_CARDIO = 'improve_cardio',
    IMPROVE_MUSCULAR_ENDURANCE = 'improve_muscular_endurance',
    IMPROVE_EXPLOSIVE_POWER = 'improve_explosive_power',
    IMPROVE_SPEED = 'improve_speed',
    IMPROVE_FLEXIBILITY = 'improve_flexibility',
    IMPROVE_BALANCE = 'improve_balance',
    IMPROVE_GRIP_STRENGTH = 'improve_grip_strength',
    IMPROVE_CORE_STABILITY = 'improve_core_stability',

    // ──────────────────────────────────────────────────────────────────
    // PROGRAM PREFERENCES — volume, progression, complexity
    // ──────────────────────────────────────────────────────────────────
    SIMPLE_PLAN = 'simple_plan',
    LOWER_VOLUME = 'lower_volume',
    HIGHER_VOLUME = 'higher_volume',
    GRADUAL_PROGRESSION = 'gradual_progression',
    AGGRESSIVE_PROGRESSION = 'aggressive_progression',

    // ──────────────────────────────────────────────────────────────────
    // ROUTINE STRUCTURE PREFERENCES
    // ──────────────────────────────────────────────────────────────────
    PREFER_FULL_BODY = 'prefer_full_body',
    PREFER_UPPER_LOWER = 'prefer_upper_lower',
    PREFER_PUSH_PULL_LEGS = 'prefer_push_pull_legs',
    PREFER_SPLIT_ROUTINE = 'prefer_split_routine',

    // ──────────────────────────────────────────────────────────────────
    // SET / METHOD PREFERENCES
    // ──────────────────────────────────────────────────────────────────
    PREFER_STRAIGHT_SETS = 'prefer_straight_sets',
    PREFER_SUPERSETS = 'prefer_supersets',
    PREFER_CIRCUITS = 'prefer_circuits',             // HIIT-style
    PREFER_HEAVY_COMPOUNDS = 'prefer_heavy_compounds',

    // ──────────────────────────────────────────────────────────────────
    // EQUIPMENT PREFERENCES (within the gym)
    // ──────────────────────────────────────────────────────────────────
    PREFER_FREE_WEIGHTS = 'prefer_free_weights',
    PREFER_MACHINES = 'prefer_machines',             // safety, comfort, simplicity
    PREFER_CABLES = 'prefer_cables',
    PREFER_BODYWEIGHT = 'prefer_bodyweight',

    // ──────────────────────────────────────────────────────────────────
    // TRAINING PHASE — current macro-cycle context
    // ──────────────────────────────────────────────────────────────────
    PHASE_BULKING = 'phase_bulking',
    PHASE_CUTTING = 'phase_cutting',
    PHASE_MAINTENANCE = 'phase_maintenance',
    PHASE_DELOAD = 'phase_deload',
    PHASE_COMPETITION_PREP = 'phase_competition_prep',
}

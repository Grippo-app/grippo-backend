export enum ExerciseRulesEntryTypeEnum {
    RepetitionsAndWeight = 'RepetitionsAndWeight',
    RepetitionsOnly = 'RepetitionsOnly',
    RepetitionsWithOptionalExtraWeight = 'RepetitionsWithOptionalExtraWeight',
    RepetitionsWithOptionalExtraAndAssistance = 'RepetitionsWithOptionalExtraAndAssistance',
}

export enum ExerciseRulesLoadTypeEnum {
    DirectWeight = 'DirectWeight',
    BodyWeightFull = 'BodyWeightFull',
    NoWeight = 'NoWeight',
    BodyWeightMultiplier = 'BodyWeightMultiplier',
}

export enum ExerciseRulesMissingBodyWeightBehaviorEnum {
    BlockSaving = 'BlockSaving',
    SaveAsRepetitionsOnly = 'SaveAsRepetitionsOnly',
    SaveWithZeroWeight = 'SaveWithZeroWeight',
}

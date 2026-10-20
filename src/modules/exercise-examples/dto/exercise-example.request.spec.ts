import 'reflect-metadata';
import {BadRequestException, ValidationPipe} from '@nestjs/common';
import {ExerciseExampleRequest} from './exercise-example.request';
import {ExerciseExampleUpdateRequest} from './exercise-example-update.request';
import {SUPPORTED_LANGUAGES} from '../../../i18n/i18n.types';

const MUSCLE_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_MUSCLE_ID = '22222222-2222-4222-8222-222222222222';
const EQUIPMENT_ID = '33333333-3333-4333-8333-333333333333';
const arrayFields = ['exerciseExampleBundles', 'equipmentRefs'] as const;

function payload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        name: [{language: 'en', value: 'Synthetic exercise'}],
        description: [{language: 'en', value: 'Synthetic description'}],
        weightType: 'free', category: 'compound', experience: 'beginner', forceType: 'push',
        imageUrl: 'https://example.test/exercise.png',
        exerciseExampleBundles: [{muscleId: MUSCLE_ID, percentage: 100}],
        equipmentRefs: [],
        components: {externalWeight: {required: true}, bodyWeight: null, extraWeight: null, assistWeight: null},
        ...overrides,
    };
}

function validate(value: unknown): Promise<ExerciseExampleRequest> {
    return new ValidationPipe({transform: true, whitelist: true, forbidNonWhitelisted: true})
        .transform(value, {type: 'body', metatype: ExerciseExampleRequest});
}

async function expectFieldError(value: unknown, field: string): Promise<void> {
    let failure: BadRequestException;
    try { await validate(value); }
    catch (error) { failure = error as BadRequestException; }
    expect(failure).toBeInstanceOf(BadRequestException);
    expect(failure.getStatus()).toBe(400);
    const response = failure.getResponse() as {message: string[]};
    expect(response.message).toEqual(expect.arrayContaining([expect.stringContaining(field)]));
}

function freeze(value: unknown): void {
    if (value && typeof value === 'object') {
        Object.freeze(value);
        Object.values(value).forEach(freeze);
    }
}

describe('ExerciseExampleRequest through the application ValidationPipe', () => {
    it('accepts a complete payload, including an empty equipment list, without mutating the input', async () => {
        const input = payload();
        const before = structuredClone(input);
        freeze(input);
        const result = await validate(input);
        expect(result).toBeInstanceOf(ExerciseExampleRequest);
        expect(result).not.toBe(input);
        expect(result.exerciseExampleBundles).toEqual([{muscleId: MUSCLE_ID, percentage: 100}]);
        expect(result.equipmentRefs).toEqual([]);
        expect(input).toEqual(before);
    });

    it.each([
        ['zero and one hundred', [0, 100]],
        ['multiple contributions', [15, 25, 60]],
        ['many contributions', Array(10).fill(10)],
    ])('accepts a valid distribution: %s', async (_, percentages: number[]) => {
        const bundles = percentages.map((percentage, index) => ({
            muscleId: `11111111-1111-4111-8111-${String(index + 1).padStart(12, '0')}`, percentage,
        }));
        const result = await validate(payload({exerciseExampleBundles: bundles, equipmentRefs: [{equipmentId: EQUIPMENT_ID}]}));
        expect(result.exerciseExampleBundles).toEqual(bundles);
        expect(result.equipmentRefs).toEqual([{equipmentId: EQUIPMENT_ID}]);
    });

    describe.each(arrayFields)('%s must be a required array', field => {
        it('rejects an omitted field', async () => {
            const input = payload(); delete input[field];
            await expectFieldError(input, field);
        });

        it.each([
            ['explicit undefined', undefined], ['null', null], ['scalar', 3], ['string', '[]'],
        ])('rejects %s', async (_, value) => {
            await expectFieldError(payload({[field]: value}), field);
        });

        it('rejects a single row object instead of an array', async () => {
            const row = field === 'exerciseExampleBundles'
                ? {muscleId: MUSCLE_ID, percentage: 100} : {equipmentId: EQUIPMENT_ID};
            await expectFieldError(payload({[field]: row}), field);
        });

        it.each([
            ['null', null], ['undefined', undefined], ['number', 3], ['boolean', false], ['string', 'row'], ['array', []],
        ])('rejects a %s nested row', async (_, value) => {
            await expectFieldError(payload({[field]: [value]}), field);
        });

        it('rejects holes from sparse arrays after their JSON wire encoding', async () => {
            const sparse = new Array(2);
            sparse[1] = field === 'exerciseExampleBundles'
                ? {muscleId: MUSCLE_ID, percentage: 100} : {equipmentId: EQUIPMENT_ID};
            // HTTP JSON represents sparse holes as null; class-transformer can compact direct JS holes.
            const wireValue = JSON.parse(JSON.stringify(sparse));
            expect(wireValue[0]).toBeNull();
            await expectFieldError(payload({[field]: wireValue}), field);
        });

        it('rejects an invalid nested UUID', async () => {
            const idField = field === 'exerciseExampleBundles' ? 'muscleId' : 'equipmentId';
            const row = field === 'exerciseExampleBundles' ? {muscleId: 'not-a-uuid', percentage: 100} : {equipmentId: 'not-a-uuid'};
            await expectFieldError(payload({[field]: [row]}), idField);
        });

        it('rejects unexpected nested fields rather than silently stripping them', async () => {
            const row = field === 'exerciseExampleBundles'
                ? {muscleId: MUSCLE_ID, percentage: 100, id: OTHER_MUSCLE_ID} : {equipmentId: EQUIPMENT_ID, id: OTHER_MUSCLE_ID};
            await expectFieldError(payload({[field]: [row]}), 'id');
        });
    });

    it('rejects an empty muscle list', async () => {
        await expectFieldError(payload({exerciseExampleBundles: []}), 'exerciseExampleBundles');
    });

    it.each([
        ['negative', -1], ['above one hundred', 101], ['fractional', 0.5], ['numeric string', '100'],
        ['NaN', NaN], ['Infinity', Infinity], ['negative Infinity', -Infinity], ['null', null], ['undefined', undefined],
    ])('rejects a %s contribution percentage without numeric coercion', async (_, percentage) => {
        await expectFieldError(payload({exerciseExampleBundles: [{muscleId: MUSCLE_ID, percentage}]}), 'percentage');
    });

    it.each([
        ['zero', [0]], ['ninety-nine', [30, 69]], ['one hundred and one', [50, 51]],
    ])('rejects individually bounded contributions totaling %s', async (_, percentages: number[]) => {
        const exerciseExampleBundles = percentages.map((percentage, index) => ({
            muscleId: index ? OTHER_MUSCLE_ID : MUSCLE_ID, percentage,
        }));
        await expectFieldError(payload({exerciseExampleBundles}), 'exerciseExampleBundles');
    });

    it('does not mutate a rejected payload or coerce its numeric string percentage', async () => {
        const input = payload({exerciseExampleBundles: [{muscleId: MUSCLE_ID, percentage: '100'}]});
        const before = structuredClone(input);
        freeze(input);
        await expectFieldError(input, 'percentage');
        expect(input).toEqual(before);
    });

    it('keeps the strict body whitelist, including rejecting a submitted exercise id', async () => {
        await expectFieldError(payload({id: MUSCLE_ID}), 'id');
    });

    it.each(SUPPORTED_LANGUAGES)('accepts canonical locale %s in both text arrays', async language => {
        const text = [{language, value: 'Synthetic text'}];
        const result = await validate(payload({name: text, description: text}));
        expect(result.name).toEqual(text);
        expect(result.description).toEqual(text);
    });

    it.each(['pt', 'pt-br', 'pt-pt', 'pt_BR', 'pt_PT', 'uk', 'PT-BR'])('rejects noncanonical write locale %s', async language => {
        for (const field of ['name', 'description']) {
            await expectFieldError(payload({[field]: [{language, value: 'Synthetic text'}]}), 'language');
        }
    });

    it.each(['name', 'description'])('keeps omitted/empty %s values distinct from null', async field => {
        const omitted = await validate(payload({[field]: [{language: 'pt-PT'}]}));
        expect(omitted[field][0]).not.toHaveProperty('value');
        const blank = await validate(payload({[field]: [{language: 'pt-PT', value: ''}]}));
        expect(blank[field][0].value).toBe('');
        await expectFieldError(payload({[field]: [{language: 'pt-PT', value: null}]}), 'value');
    });

    it('rejects an update-only revision on the create DTO', async () => {
        await expectFieldError(payload({translationsRevision: 'a'.repeat(64)}), 'translationsRevision');
    });
});

describe('ExerciseExampleUpdateRequest revision validation', () => {
    const validateUpdate = (value: unknown): Promise<ExerciseExampleUpdateRequest> =>
        new ValidationPipe({transform: true, whitelist: true, forbidNonWhitelisted: true})
            .transform(value, {type: 'body', metatype: ExerciseExampleUpdateRequest});

    it('preserves optional legacy writes and accepts an exact lowercase SHA256', async () => {
        expect(await validateUpdate(payload())).toBeInstanceOf(ExerciseExampleUpdateRequest);
        const translationsRevision = 'abcdef0123456789'.repeat(4);
        const result = await validateUpdate(payload({translationsRevision}));
        expect(result.translationsRevision).toBe(translationsRevision);
        expect(result.name).toEqual(payload().name);
    });

    it.each([null, '', 3, false, {}, [], 'A'.repeat(64), 'a'.repeat(63), 'a'.repeat(65), 'g'.repeat(64), `${'a'.repeat(64)}\n`])('rejects malformed revision %p', async translationsRevision => {
        await expect(validateUpdate(payload({translationsRevision}))).rejects.toBeInstanceOf(BadRequestException);
    });
});

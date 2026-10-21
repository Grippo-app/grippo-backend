import 'reflect-metadata';
import {ConflictException, INestApplication, ValidationPipe} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import {DocumentBuilder, SwaggerModule} from '@nestjs/swagger';
import request from 'supertest';
import {AdminController} from './admin.controller';
import {JwtAuthGuard} from '../../common/jwt-auth.guard';
import {AdminOnlyGuard} from '../../common/admin.guard';
import {ExerciseExampleService} from '../exercise-examples/exercise-example.service';
import {UsersService} from '../users/users.service';
import {TrainingsService} from '../trainings/trainings.service';
import {WeightHistoryService} from '../weight-history/weight-history.service';
import {PushTokensService} from '../push-tokens/push-tokens.service';
import {ExerciseExampleI18nService} from '../../i18n/exercise-example-i18n.service';
import {LanguageMiddleware} from '../../i18n/language.middleware';
import {SUPPORTED_LANGUAGES, SupportedLanguage} from '../../i18n/i18n.types';
import {parseLocaleRange} from '../../i18n/locale.helper';
import {ExerciseExampleController} from '../exercise-examples/exercise-example.controller';
import {TrainingsController} from '../trainings/trainings.controller';
import {ExerciseExamplesEntity} from '../../entities/exercise-examples.entity';

const exerciseId = '11111111-1111-4111-8111-111111111111';
const firstMuscleId = '22222222-2222-4222-8222-222222222222';
const secondMuscleId = '33333333-3333-4333-8333-333333333333';
const equipmentId = '44444444-4444-4444-8444-444444444444';
const userId = '55555555-5555-4555-8555-555555555555';
const targetUserId = '66666666-6666-4666-8666-666666666666';
const revision = 'a'.repeat(64);
const translationRows = () => SUPPORTED_LANGUAGES.map(language => ({
    language, name: `Synthetic ${language}`, description: `Description ${language}`,
}));
const catalogFixture = () => ({
    id: exerciseId, name: 'Base name', description: 'Base description', translations: translationRows(),
} as unknown as ExerciseExamplesEntity);
const muscle = (percentage: number) => ({muscleId: firstMuscleId, percentage});
const fixture = () => ({
    name: [{language: 'en', value: 'Synthetic exercise'}],
    description: [{language: 'en', value: 'HTTP validation fixture'}],
    weightType: 'free', category: 'compound', experience: 'beginner', forceType: 'push', imageUrl: '',
    exerciseExampleBundles: [muscle(70), {muscleId: secondMuscleId, percentage: 30}],
    equipmentRefs: [],
    components: {externalWeight: {required: true}, bodyWeight: null, extraWeight: null, assistWeight: null},
});

describe('Isolated catalog/admin HTTP contracts', () => {
    let app: INestApplication;
    let address: string;
    let i18n: ExerciseExampleI18nService;
    const service = {
        createExerciseExample: jest.fn(), updateExerciseExample: jest.fn(),
        getExerciseExamples: jest.fn(), getExerciseExampleById: jest.fn(), getExerciseExampleTranslations: jest.fn(),
    };
    const trainings = {getTrainings: jest.fn(), getTrainingById: jest.fn(), getTrainingsByUserId: jest.fn()};

    beforeAll(async () => {
        // Only validation/controller wiring is under test. No AppModule, config or database providers.
        const module = await Test.createTestingModule({
            controllers: [AdminController, ExerciseExampleController, TrainingsController],
            providers: [
                {provide: ExerciseExampleService, useValue: service},
                {provide: TrainingsService, useValue: trainings},
                ExerciseExampleI18nService,
                ...[UsersService, WeightHistoryService, PushTokensService]
                    .map(provide => ({provide, useValue: {}})),
            ],
        })
            .overrideGuard(JwtAuthGuard).useValue({canActivate: context => {
                context.switchToHttp().getRequest().user = {id: userId};
                return true;
            }})
            .overrideGuard(AdminOnlyGuard).useValue({canActivate: () => true})
            .compile();
        app = module.createNestApplication({logger: false});
        i18n = app.get(ExerciseExampleI18nService);
        const middleware = new LanguageMiddleware(i18n);
        app.use((req, res, next) => {
            res.vary(req.headers['x-fixture-vary'] ?? 'Origin');
            middleware.use(req, res, next);
        });
        app.useGlobalPipes(new ValidationPipe({transform: true, whitelist: true, forbidNonWhitelisted: true}));
        await app.listen(0, '127.0.0.1');
        address = await app.getUrl();
    });

    afterAll(async () => { await app?.close(); });
    beforeEach(() => {
        service.createExerciseExample.mockReset().mockResolvedValue({id: exerciseId});
        service.updateExerciseExample.mockReset().mockResolvedValue(undefined);
        service.getExerciseExamples.mockReset().mockImplementation(async (_, language) =>
            i18n.translateExamples([catalogFixture()], language));
        service.getExerciseExampleById.mockReset().mockImplementation(async (_, _user, language) =>
            i18n.translateExample(catalogFixture(), language));
        service.getExerciseExampleTranslations.mockReset().mockResolvedValue({
            id: exerciseId, base: {name: 'Base name', description: 'Base description'},
            translations: translationRows(), translationsRevision: revision,
        });
        const trainingFixture = (language: SupportedLanguage) => ({id: exerciseId, exercises:
            i18n.translateExercisesCollection([{name: 'Historical exercise name', exerciseExample: catalogFixture()}], language)});
        trainings.getTrainings.mockReset().mockImplementation(async (_, _start, _end, language) => [trainingFixture(language)]);
        trainings.getTrainingById.mockReset().mockImplementation(async (_, _user, language) => trainingFixture(language));
        trainings.getTrainingsByUserId.mockReset().mockImplementation(async (_, _start, _end, language) => [trainingFixture(language)]);
    });

    const invalidInputs = [
        {name: 'missing muscle array', field: 'exerciseExampleBundles', value: undefined},
        {name: 'missing equipment array', field: 'equipmentRefs', value: undefined},
        {name: 'null muscle array', field: 'exerciseExampleBundles', value: null},
        {name: 'null equipment array', field: 'equipmentRefs', value: null},
        {name: 'single muscle object', field: 'exerciseExampleBundles', value: muscle(100)},
        {name: 'single equipment object', field: 'equipmentRefs', value: {equipmentId}},
        {name: 'nested muscle array', field: 'exerciseExampleBundles', value: [[muscle(100)]]},
        {name: 'nested equipment array', field: 'equipmentRefs', value: [[{equipmentId}]]},
        {name: 'null equipment entry', field: 'equipmentRefs', value: [null]},
        {name: 'duplicate muscles', field: 'exerciseExampleBundles', value: [muscle(50), muscle(50)]},
        {name: 'duplicate equipment', field: 'equipmentRefs', value: [{equipmentId}, {equipmentId}]},
        {name: 'mixed-case duplicate muscles', field: 'exerciseExampleBundles', value: [
            {muscleId: 'abcdefab-cdef-4abc-8def-abcdefabcdef', percentage: 50},
            {muscleId: 'ABCDEFAB-CDEF-4ABC-8DEF-ABCDEFABCDEF', percentage: 50},
        ]},
        {name: 'mixed-case duplicate equipment', field: 'equipmentRefs', value: [
            {equipmentId: 'abcdefab-cdef-4abc-8def-abcdefabcdef'},
            {equipmentId: 'ABCDEFAB-CDEF-4ABC-8DEF-ABCDEFABCDEF'},
        ]},
        {name: 'empty muscle array', field: 'exerciseExampleBundles', value: []},
        {name: 'out of range values totaling 100', field: 'exerciseExampleBundles',
            value: [muscle(-1), {muscleId: secondMuscleId, percentage: 101}]},
        {name: 'fractional values totaling 100', field: 'exerciseExampleBundles',
            value: [muscle(50.5), {muscleId: secondMuscleId, percentage: 49.5}]},
        {name: 'total of 99', field: 'exerciseExampleBundles', value: [muscle(99)]},
        {name: 'total of 101', field: 'exerciseExampleBundles', value: [muscle(100), {muscleId: secondMuscleId, percentage: 1}]},
        {name: 'numeric string', field: 'exerciseExampleBundles', value: [{muscleId: firstMuscleId, percentage: '100'}]},
    ];

    for (const method of ['post', 'put'] as const) {
        describe(method.toUpperCase(), () => {
            const send = (body: object) => {
                const call = request(address)[method]('/admin/exercise-examples');
                return (method === 'put' ? call.query({id: exerciseId}) : call).send(body);
            };

            it.each(invalidInputs)('rejects $name before calling a service', async ({field, value}) => {
                const response = await send({...fixture(), [field]: value});
                expect(response.status).toBe(400);
                expect(response.body.message).toEqual(expect.arrayContaining([expect.stringContaining(field)]));
                expect(service.createExerciseExample).not.toHaveBeenCalled();
                expect(service.updateExerciseExample).not.toHaveBeenCalled();
            });

            it.each([
                {name: '70 + 30 with empty equipment', bundles: fixture().exerciseExampleBundles, equipment: []},
                {name: 'one muscle with equipment', bundles: [muscle(100)], equipment: [{equipmentId}]},
                {name: 'zero contribution with a 100% muscle', bundles: [muscle(0), {muscleId: secondMuscleId, percentage: 100}], equipment: []},
            ])('preserves valid $name', async ({bundles, equipment}) => {
                const body = {...fixture(), exerciseExampleBundles: bundles, equipmentRefs: equipment};
                const before = JSON.stringify(body);
                const response = await send(body);
                expect(response.status).toBe(method === 'post' ? 201 : 204);
                const saved = method === 'post' ? service.createExerciseExample.mock.calls[0][0]
                    : service.updateExerciseExample.mock.calls[0][1];
                expect(saved).toEqual(body);
                expect(JSON.stringify(body)).toBe(before);
                if (method === 'post') {
                    expect(response.body).toEqual({id: exerciseId});
                    expect(service.createExerciseExample).toHaveBeenCalledTimes(1);
                    expect(service.updateExerciseExample).not.toHaveBeenCalled();
                } else {
                    expect(response.text).toBe('');
                    expect(service.updateExerciseExample).toHaveBeenCalledWith(exerciseId, expect.anything());
                    expect(service.updateExerciseExample).toHaveBeenCalledTimes(1);
                    expect(service.createExerciseExample).not.toHaveBeenCalled();
                }
            });

            it.each(SUPPORTED_LANGUAGES)('accepts canonical write locale %s', async language => {
                const response = await send({...fixture(), name: [{language, value: 'Synthetic text'}]});
                expect(response.status).toBe(method === 'post' ? 201 : 204);
            });

            it.each(['pt', 'pt-br', 'pt-pt', 'pt_BR', 'pt_PT', 'uk', 'fr-BR'])('rejects noncanonical write locale %s', async language => {
                const response = await send({...fixture(), description: [{language, value: 'Synthetic text'}]});
                expect(response.status).toBe(400);
                expect(service.createExerciseExample).not.toHaveBeenCalled();
                expect(service.updateExerciseExample).not.toHaveBeenCalled();
            });
        });
    }

    it('accepts a revision only on PUT and rejects it on POST', async () => {
        const body = {...fixture(), translationsRevision: revision};
        const updated = await request(address).put('/admin/exercise-examples').query({id: exerciseId}).send(body);
        expect(updated.status).toBe(204);
        expect(service.updateExerciseExample).toHaveBeenCalledWith(exerciseId, expect.objectContaining({translationsRevision: revision}));
        const created = await request(address).post('/admin/exercise-examples').send(body);
        expect(created.status).toBe(400);
        expect(service.createExerciseExample).not.toHaveBeenCalled();
    });

    it.each([null, '', 3, 'A'.repeat(64), 'a'.repeat(63), 'g'.repeat(64), `${'a'.repeat(64)}\n`])('rejects malformed update revision %p before service access', async translationsRevision => {
        const response = await request(address).put('/admin/exercise-examples').query({id: exerciseId})
            .send({...fixture(), translationsRevision});
        expect(response.status).toBe(400);
        expect(service.updateExerciseExample).not.toHaveBeenCalled();
    });

    it.each(['EXERCISE_TRANSLATIONS_STALE', 'EXERCISE_TRANSLATIONS_INCOMPLETE'])('preserves service conflict code %s', async code => {
        service.updateExerciseExample.mockRejectedValueOnce(new ConflictException({code, message: 'Synthetic conflict'}));
        const response = await request(address).put('/admin/exercise-examples').query({id: exerciseId}).send(fixture());
        expect(response.status).toBe(409);
        expect(response.body).toEqual({code, message: 'Synthetic conflict'});
    });

    const localizedPaths = [
        {path: '/exercise-examples', select: body => body[0], mock: service.getExerciseExamples, args: language => [{id: userId}, language]},
        {path: `/exercise-examples/${exerciseId}`, select: body => body, mock: service.getExerciseExampleById, args: language => [exerciseId, {id: userId}, language]},
        {path: '/trainings?start=2026-01-01&end=2026-01-02', select: body => body[0].exercises[0].exerciseExample, mock: trainings.getTrainings, args: language => [{id: userId}, '2026-01-01', '2026-01-02', language]},
        {path: `/trainings/${exerciseId}`, select: body => body.exercises[0].exerciseExample, mock: trainings.getTrainingById, args: language => [exerciseId, {id: userId}, language]},
        {path: `/admin/users/${targetUserId}/trainings?start=2026-01-01&end=2026-01-02`, select: body => body[0].exercises[0].exerciseExample, mock: trainings.getTrainingsByUserId, args: language => [targetUserId, '2026-01-01', '2026-01-02', language]},
    ];

    describe.each(localizedPaths)('localized GET $path', route => {
        it.each(SUPPORTED_LANGUAGES)('passes negotiated %s to its service and preserves Vary', async language => {
            const response = await request(address).get(route.path).set('Accept-Language', `${language};q=0.9,*;q=0.1`);
            expect(response.status).toBe(200);
            expect(route.select(response.body)).toMatchObject({name: `Synthetic ${language}`, description: `Description ${language}`});
            expect(route.select(response.body)).not.toHaveProperty('translations');
            expect(response.headers.vary).toBe('Origin, Accept-Language');
            expect(response.headers['content-language']).toBeUndefined();
            expect(route.mock).toHaveBeenCalledWith(...route.args(language));
        });
    });

    it.each([['pt-Latn-PT;q=0.9,pt-BR;q=0.1', 'pt-PT'], ['pt-BR;q=0,pt;q=1', 'pt-PT'], ['fr-UA', 'en']])('negotiates %s through real middleware', async (header, language) => {
        const response = await request(address).get('/exercise-examples').set('Accept-Language', header);
        expect(response.status).toBe(200);
        expect(response.body[0].name).toBe(`Synthetic ${language}`);
        expect(service.getExerciseExamples).toHaveBeenCalledWith({id: userId}, language);
    });

    it.each(['Origin, accept-language', '*'])('does not duplicate or replace an existing Vary %s', async vary => {
        const response = await request(address).get('/exercise-examples').set('x-fixture-vary', vary);
        expect(response.headers.vary).toBe(vary);
    });

    it.each([
        {name: 'partial direct row uses base field', rows: [{language: 'en', name: 'English', description: 'English description'}, {language: 'pt-PT', name: null, description: 'European text'}], expected: {name: 'Base name', description: 'European text'}},
        {name: 'blank direct text is retained', rows: [{language: 'pt-PT', name: '', description: ''}], expected: {name: '', description: ''}},
        {name: 'missing PT uses en without borrowing BR', rows: [{language: 'en', name: 'English', description: 'English description'}, {language: 'pt-BR', name: 'Brazilian', description: 'Brazilian description'}], expected: {name: 'English', description: 'English description'}},
        {name: 'missing direct and en uses base', rows: [{language: 'pt-BR', name: 'Brazilian', description: 'Brazilian description'}], expected: {name: 'Base name', description: 'Base description'}},
    ])('preserves row/field fallback: $name', async ({rows, expected}) => {
        service.getExerciseExampleById.mockImplementationOnce(async (_, _user, language) =>
            i18n.translateExample({...catalogFixture(), translations: rows} as ExerciseExamplesEntity, language));
        const response = await request(address).get(`/exercise-examples/${exerciseId}`).set('Accept-Language', 'pt-PT');
        expect(response.status).toBe(200);
        expect(response.body).toMatchObject(expected);
    });

    it('returns a raw snapshot without fallback or language-dependent headers', async () => {
        const response = await request(address).get(`/admin/exercise-examples/${exerciseId}/translations`).set('Accept-Language', 'pt-PT');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({id: exerciseId, base: {name: 'Base name', description: 'Base description'}, translations: translationRows(), translationsRevision: revision});
        expect(response.headers.vary).toBe('Origin');
        expect(service.getExerciseExampleTranslations).toHaveBeenCalledWith(exerciseId);
    });

    it('documents integer percentage bounds and the required muscle list in Swagger', () => {
        const document = SwaggerModule.createDocument(app, new DocumentBuilder().build());
        const schemas = document.components.schemas;
        expect(schemas.ExerciseExampleBundleRequest).toMatchObject({properties: {percentage: {type: 'integer', minimum: 0, maximum: 100}}});
        expect(schemas.ExerciseExampleRequest).toMatchObject({properties: {exerciseExampleBundles: {type: 'array', minItems: 1}}});
        expect(schemas.ExerciseExampleLocalizedTextDto).toMatchObject({properties: {language: {enum: [...SUPPORTED_LANGUAGES]}}});
        expect(schemas.ExerciseExampleRequest).not.toHaveProperty('properties.translationsRevision');
        expect(schemas.ExerciseExampleUpdateRequest).toHaveProperty('properties.translationsRevision');
        const responseSchema = schemas.ExerciseExampleResponseDto;
        if (!('properties' in responseSchema)) throw new Error('ExerciseExampleResponseDto must define its properties');
        expect(Object.keys(responseSchema.properties).sort()).toEqual([
            'id', 'name', 'description', 'imageUrl', 'category', 'weightType', 'forceType', 'experience',
            'createdAt', 'updatedAt', 'exerciseExampleBundles', 'equipmentRefs', 'components',
        ].sort());
        expect(schemas.ExerciseExampleBundleResponseDto).toHaveProperty('properties.muscle');
        expect(schemas.ExerciseExampleBundleResponseDto).toMatchObject({
            properties: {muscleId: {type: 'string', format: 'uuid', nullable: true}},
        });
        expect(schemas.ExerciseExampleMuscleResponseDto).toHaveProperty('properties.sensitivity');
        expect(schemas.ExerciseExampleMuscleResponseDto).not.toHaveProperty('properties.muscleGroupId');
        expect(schemas.ExerciseExampleEquipmentRefResponseDto).toHaveProperty('properties.equipment');
        expect(schemas.ExerciseExampleEquipmentRefResponseDto).toMatchObject({
            properties: {equipmentId: {type: 'string', format: 'uuid', nullable: true}},
        });
        expect(schemas.ExerciseExampleEquipmentResponseDto).not.toHaveProperty('properties.equipmentGroupId');
        expect(document.paths['/admin/exercise-examples'].put.responses['409']).toMatchObject({content: {'application/json': {schema: {properties: {code: {enum: ['EXERCISE_TRANSLATIONS_STALE', 'EXERCISE_TRANSLATIONS_INCOMPLETE']}}}}}});
        for (const path of ['/exercise-examples', '/exercise-examples/{id}', '/trainings', '/trainings/{id}', '/admin/users/{id}/trainings']) {
            const operation = document.paths[path].get;
            expect(operation.parameters).toEqual(expect.arrayContaining([expect.objectContaining({name: 'Accept-Language', in: 'header', required: false})]));
            expect(operation.responses['200']).toMatchObject({headers: {Vary: {schema: {type: 'string', example: 'Accept-Language'}}}});
        }
    });
});

describe('Grippo language negotiation', () => {
    const i18n = new ExerciseExampleI18nService();
    it.each([
        [undefined, 'en'], ['', 'en'], ['  , , ', 'en'], ['not_a_locale_!', 'en'], ['fr-BR', 'en'], ['fr-UA', 'en'],
        ['pt-BR', 'pt-BR'], ['pt-br', 'pt-BR'], ['pt_BR', 'pt-BR'], [' pt-Latn-BR ', 'pt-BR'],
        ['pt', 'pt-BR'], ['pt-Latn', 'pt-BR'], ['pt-AO', 'pt-BR'], ['pt-MZ', 'pt-BR'],
        ['pt-PT', 'pt-PT'], ['pt_PT', 'pt-PT'], ['pt-Latn-PT', 'pt-PT'],
        ['pt-PT-u-rg-brzzzz', 'pt-PT'], ['pt-u-rg-ptzzzz', 'pt-BR'],
        ['uk', 'ua'], ['uk-UA', 'ua'], ['ua-UA', 'ua'], ['ru-Cyrl-UA', 'ru'], ['en-PT', 'en'],
        ['pt-BR;q=0.3,pt-PT;q=0.8', 'pt-PT'], ['pt-PT;q=0.8,pt-BR;q=0.8', 'pt-PT'],
        ['pt-BR;q=0,pt;q=1', 'pt-PT'], ['pt;q=0,pt-BR;q=1', 'pt-BR'],
        ['en;q=0,*;q=1', 'ua'], ['*;q=0,pt-PT;q=0.5', 'pt-PT'], ['*;q=0', 'en'],
        ['pt-BR;q=bad,pt-PT;q=0.8', 'pt-PT'], ['pt-BR;q=0,pt-BR;q=1,ru;q=0.5', 'ru'],
        ['pt-BR;q=1,pt-BR;q=0,ru;q=0.5', 'ru'], ['ru;q=0.2,ru;q=0.8,en;q=0.5', 'ru'],
        ['pt-PT;Q=0.999,en;q=0.998', 'pt-PT'], ['pt-BR;q=1.001,ru;q=0.2', 'ru'],
        ['pt-BR;q=-0.1,ru;q=0.2', 'ru'], ['pt-BR;q=.8,ru;q=0.2', 'ru'],
        ['pt-BR;q=0.1234,ru;q=0.2', 'ru'], ['pt-BR;q=01,ru;q=0.2', 'ru'],
        ['pt-BR;q=0.9;q=0.8,ru;q=0.2', 'ru'], ['pt-BR;unknown=1,ru;q=0.2', 'ru'],
        ['pt-BR;,ru;q=0.2', 'ru'], ['pt;q=0.1,*;q=1', 'en'], ['*;q=1,pt;q=0', 'en'],
        [['pt-BR;q=0.2', 'pt-PT;q=0.9'], 'pt-PT'],
    ])('resolves %p to %s', (header, expected) => {
        expect(i18n.resolveLanguage(header as string | string[] | undefined)).toBe(expected);
    });

    it.each([['pt', 'pt-BR'], ['pt-Latn-PT', 'pt-PT'], ['fr-UA', undefined], ['*', 'en']])('parses the first supported locale for %s as %s', (tag, expected) => {
        expect(parseLocaleRange(tag)?.languages[0]).toBe(expected);
    });
});

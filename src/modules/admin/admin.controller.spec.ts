import 'reflect-metadata';
import {INestApplication, ValidationPipe} from '@nestjs/common';
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

const exerciseId = '11111111-1111-4111-8111-111111111111';
const firstMuscleId = '22222222-2222-4222-8222-222222222222';
const secondMuscleId = '33333333-3333-4333-8333-333333333333';
const equipmentId = '44444444-4444-4444-8444-444444444444';
const muscle = (percentage: number) => ({muscleId: firstMuscleId, percentage});
const fixture = () => ({
    name: [{language: 'en', value: 'Synthetic exercise'}],
    description: [{language: 'en', value: 'HTTP validation fixture'}],
    weightType: 'free', category: 'compound', experience: 'beginner', forceType: 'push', imageUrl: '',
    exerciseExampleBundles: [muscle(70), {muscleId: secondMuscleId, percentage: 30}],
    equipmentRefs: [],
    components: {externalWeight: {required: true}, bodyWeight: null, extraWeight: null, assistWeight: null},
});

describe('Admin exercise input validation over HTTP', () => {
    let app: INestApplication;
    let address: string;
    const service = {createExerciseExample: jest.fn(), updateExerciseExample: jest.fn()};

    beforeAll(async () => {
        // Only validation/controller wiring is under test. No AppModule, config or database providers.
        const module = await Test.createTestingModule({
            controllers: [AdminController],
            providers: [
                {provide: ExerciseExampleService, useValue: service},
                ...[UsersService, TrainingsService, WeightHistoryService, PushTokensService, ExerciseExampleI18nService]
                    .map(provide => ({provide, useValue: {}})),
            ],
        })
            .overrideGuard(JwtAuthGuard).useValue({canActivate: () => true})
            .overrideGuard(AdminOnlyGuard).useValue({canActivate: () => true})
            .compile();
        app = module.createNestApplication({logger: false});
        app.useGlobalPipes(new ValidationPipe({transform: true, whitelist: true, forbidNonWhitelisted: true}));
        await app.listen(0, '127.0.0.1');
        address = await app.getUrl();
    });

    afterAll(async () => { await app?.close(); });
    beforeEach(() => {
        service.createExerciseExample.mockReset().mockResolvedValue({id: exerciseId});
        service.updateExerciseExample.mockReset().mockResolvedValue(undefined);
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
        });
    }

    it('documents integer percentage bounds and the required muscle list in Swagger', () => {
        const document = SwaggerModule.createDocument(app, new DocumentBuilder().build());
        const schemas = document.components.schemas;
        expect(schemas.ExerciseExampleBundleRequest).toMatchObject({properties: {percentage: {type: 'integer', minimum: 0, maximum: 100}}});
        expect(schemas.ExerciseExampleRequest).toMatchObject({properties: {exerciseExampleBundles: {type: 'array', minItems: 1}}});
    });
});

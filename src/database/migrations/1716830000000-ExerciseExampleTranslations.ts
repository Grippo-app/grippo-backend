import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableUnique } from 'typeorm';
import { v4 as uuid } from 'uuid';

const SUPPORTED_LANGUAGES = ['en', 'ua', 'ru'];

export class ExerciseExampleTranslations1716830000000 implements MigrationInterface {
    name = 'ExerciseExampleTranslations1716830000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'exercise_example_translations',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        isNullable: false,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'exercise_example_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'language',
                        type: 'varchar',
                        isNullable: false,
                    },
                    {
                        name: 'name',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'description',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp without time zone',
                        isNullable: false,
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp without time zone',
                        isNullable: false,
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
        );

        await queryRunner.createForeignKey(
            'exercise_example_translations',
            new TableForeignKey({
                columnNames: ['exercise_example_id'],
                referencedTableName: 'exercise_examples',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createUniqueConstraint(
            'exercise_example_translations',
            new TableUnique({
                name: 'UQ_exercise_example_translations_language',
                columnNames: ['exercise_example_id', 'language'],
            }),
        );

        await queryRunner.query(
            `ALTER TABLE exercise_example_translations
             ADD CONSTRAINT CHK_exercise_example_translations_language
             CHECK (language IN (${SUPPORTED_LANGUAGES.map((lang) => `'${lang}'`).join(', ')}))`,
        );

        const hasNameTranslations = await queryRunner.hasColumn('exercise_examples', 'name_translations');
        const hasDescriptionTranslations = await queryRunner.hasColumn('exercise_examples', 'description_translations');

        if (hasNameTranslations || hasDescriptionTranslations) {
            const selectColumns: string[] = ['id'];
            if (hasNameTranslations) {
                selectColumns.push('name_translations');
            } else {
                selectColumns.push("NULL::jsonb as name_translations");
            }

            if (hasDescriptionTranslations) {
                selectColumns.push('description_translations');
            } else {
                selectColumns.push("NULL::jsonb as description_translations");
            }

            const examples: Array<{ id: string; name_translations: any; description_translations: any }> = await queryRunner.query(
                `SELECT ${selectColumns.join(', ')} FROM exercise_examples`,
            );

            for (const example of examples) {
                const nameTranslations = this.ensureObject(example.name_translations);
                const descriptionTranslations = this.ensureObject(example.description_translations);
                const languages = new Set<string>([
                    ...Object.keys(nameTranslations),
                    ...Object.keys(descriptionTranslations),
                ]);

                for (const language of languages) {
                    if (!SUPPORTED_LANGUAGES.includes(language)) continue;

                    const nameValue = this.normalizeValue(nameTranslations[language]);
                    const descriptionValue = this.normalizeValue(descriptionTranslations[language]);

                    if (nameValue === null && descriptionValue === null) continue;

                    await queryRunner.query(
                        `INSERT INTO exercise_example_translations (id, exercise_example_id, language, name, description)
                         VALUES ($1, $2, $3, $4, $5)`,
                        [uuid(), example.id, language, nameValue, descriptionValue],
                    );
                }
            }
        }

        if (hasNameTranslations) {
            await queryRunner.query('ALTER TABLE exercise_examples DROP COLUMN IF EXISTS name_translations');
        }

        if (hasDescriptionTranslations) {
            await queryRunner.query('ALTER TABLE exercise_examples DROP COLUMN IF EXISTS description_translations');
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasTable = await queryRunner.hasTable('exercise_example_translations');

        await queryRunner.query(
            "ALTER TABLE exercise_examples ADD COLUMN IF NOT EXISTS name_translations jsonb DEFAULT '{}'::jsonb",
        );
        await queryRunner.query(
            "ALTER TABLE exercise_examples ADD COLUMN IF NOT EXISTS description_translations jsonb DEFAULT '{}'::jsonb",
        );

        if (hasTable) {
            const translations: Array<{
                exercise_example_id: string;
                language: string;
                name: string | null;
                description: string | null;
            }> = await queryRunner.query(
                'SELECT exercise_example_id, language, name, description FROM exercise_example_translations',
            );

            const aggregated = new Map<
                string,
                { name: Record<string, string>; description: Record<string, string> }
            >();

            for (const row of translations) {
                const language = row.language;
                if (!SUPPORTED_LANGUAGES.includes(language)) continue;

                const entry = aggregated.get(row.exercise_example_id) ?? {
                    name: {},
                    description: {},
                };

                const nameValue = this.normalizeValue(row.name);
                const descriptionValue = this.normalizeValue(row.description);

                if (nameValue !== null) {
                    entry.name[language] = nameValue;
                }

                if (descriptionValue !== null) {
                    entry.description[language] = descriptionValue;
                }

                aggregated.set(row.exercise_example_id, entry);
            }

            for (const [exerciseId, data] of aggregated.entries()) {
                await queryRunner.query(
                    `UPDATE exercise_examples
                     SET name_translations = $2::jsonb,
                         description_translations = $3::jsonb
                     WHERE id = $1`,
                    [exerciseId, JSON.stringify(data.name ?? {}), JSON.stringify(data.description ?? {})],
                );
            }
        }

        if (hasTable) {
            await queryRunner.dropTable('exercise_example_translations');
        }
    }

    private ensureObject(value: unknown): Record<string, string> {
        if (!value) return {};
        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            } catch (e) {
                return {};
            }
        }
        if (typeof value === 'object') {
            return value as Record<string, string>;
        }
        return {};
    }

    private normalizeValue(value: unknown): string | null {
        if (value === undefined || value === null) {
            return null;
        }

        const str = String(value).trim();
        return str.length > 0 ? str : null;
    }
}

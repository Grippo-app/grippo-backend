import {IsArray, IsUUID} from 'class-validator';
import {ApiProperty} from '@nestjs/swagger';

export class UpdateExcludedIdsDto {
    @ApiProperty({
        description: 'List of IDs to exclude',
        type: [String],
        example: ['a3f4b7c2-2db5-4e99-a95b-11db59f1b191'],
    })
    @IsArray()
    @IsUUID('all', {each: true})
    ids: string[];
}
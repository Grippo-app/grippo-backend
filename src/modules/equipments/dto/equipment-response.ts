import {ApiProperty} from '@nestjs/swagger';
import {EquipmentEnum} from "../../../lib/equipment.enum";
import {EquipmentGroupEnum} from "../../../lib/equipment-group.enum";

export class EquipmentResponse {
    @ApiProperty({type: 'string', example: '4289bf91-51d8-40b0-9aca-66780584a4eb'})
    id: string;

    @ApiProperty({type: 'string', example: 'Treadmill'})
    name: string;

    @ApiProperty({type: 'string', example: '4289bf91-51d8-40b0-9aca-66780584a4eb'})
    equipmentGroupId: string;

    @ApiProperty({enum: EquipmentEnum, example: EquipmentEnum.AB_MACHINES})
    type: EquipmentEnum;

    @ApiProperty({type: Date, example: new Date().toISOString()})
    createdAt: Date;

    @ApiProperty({type: Date, example: new Date().toISOString()})
    updatedAt: Date;

    @ApiProperty({
        type: 'string',
        example: 'https://static.vecteezy.com/system/resources/thumbnails/022/653/711/small/treadmill.jpg',
        required: false,
    })
    imageUrl?: string;
}

export class EquipmentGroupResponse {
    @ApiProperty({type: 'string', example: 'Machines'})
    id: string;

    @ApiProperty({type: 'string', example: 'Cardio Machines'})
    name: string;

    @ApiProperty({enum: EquipmentGroupEnum, example: EquipmentGroupEnum.BENCHES_AND_RACKS})
    type: EquipmentGroupEnum;

    @ApiProperty({type: [EquipmentResponse]})
    equipments: EquipmentResponse[];

    @ApiProperty({type: Date, example: new Date().toISOString()})
    createdAt: Date;

    @ApiProperty({type: Date, example: new Date().toISOString()})
    updatedAt: Date;
}
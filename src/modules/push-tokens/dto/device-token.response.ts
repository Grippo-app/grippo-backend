import {ApiProperty} from '@nestjs/swagger';

export class DeviceTokenResponse {
    @ApiProperty({example: '3b828d2f-797f-4a45-9d1d-1d3efe38fb54'})
    id: string;

    @ApiProperty({example: 'fcm-token-abc123'})
    token: string;

    @ApiProperty({example: new Date().toISOString()})
    createdAt: Date;
}

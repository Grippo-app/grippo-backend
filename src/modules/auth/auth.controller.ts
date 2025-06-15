import {Body, Controller, HttpCode, Post} from '@nestjs/common';
import {ApiBody, ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {AuthService} from './auth.service';
import {LoginRequest} from './dto/login.request';
import {LoginResponse} from './dto/login.response';
import {RegisterRequest} from './dto/register.request';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {
    }

    @Post('login')
    @HttpCode(200)
    @ApiOperation({summary: 'Login by email and password'})
    @ApiBody({type: LoginRequest})
    @ApiResponse({status: 200, description: 'Successful login', type: LoginResponse})
    @ApiResponse({status: 401, description: 'Invalid credentials'})
    login(@Body() dto: LoginRequest): Promise<LoginResponse> {
        return this.authService.login(dto);
    }

    @Post('register')
    @HttpCode(201)
    @ApiOperation({summary: 'Register a new user'})
    @ApiBody({type: RegisterRequest})
    @ApiResponse({status: 201, description: 'User registered', type: LoginResponse})
    @ApiResponse({status: 400, description: 'Email already taken / validation error'})
    register(@Body() dto: RegisterRequest): Promise<LoginResponse> {
        return this.authService.register(dto);
    }

    @Post('refresh')
    @HttpCode(200)
    @ApiOperation({summary: 'Refresh access token'})
    @ApiBody({schema: {properties: {refreshToken: {type: 'string'}}}})
    async refresh(@Body('refreshToken') token: string): Promise<LoginResponse> {
        return this.authService.refresh(token);
    }
}

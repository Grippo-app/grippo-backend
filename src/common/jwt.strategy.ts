import { Inject, Injectable } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Repository } from 'typeorm';
import { UsersEntity } from '../entities/users.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
      @Inject('USERS_REPOSITORY')
      private usersRepository: Repository<UsersEntity>,
      private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('JWT_SECRET_KEY'),
    });
  }

  async validate(payload: { id: string; exp: number }) {
    // ⛔ выбрасываем обычный Error, не NestJS-исключение
    if (payload.exp * 1000 < Date.now()) {
      const err = new Error('TokenExpiredError');
      err.name = 'TokenExpiredError';
      throw err;
    }

    const user = await this.usersRepository.findOne({
      where: { id: payload.id },
      select: ['id', 'email'],
    });

    if (!user) {
      const err = new Error('JsonWebTokenError');
      err.name = 'JsonWebTokenError';
      throw err;
    }

    return user;
  }
}

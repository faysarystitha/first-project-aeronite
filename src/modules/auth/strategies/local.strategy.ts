import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../services/auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'username',
    });
  }

  async validate(username: string, password: string) {
    const user = await this.authService.validateUser(username, password);

    if (user) {
      return user;
    }

    throw new UnauthorizedException(
      'User failed to log in, either username/email or password is incorrect.',
    );
  }
}

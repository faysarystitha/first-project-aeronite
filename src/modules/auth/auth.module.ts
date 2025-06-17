import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { MessageService } from './message.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.SECRET_KEY,
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PrismaService,
    MessageService,
    LocalStrategy,
    JwtStrategy,
  ],
})
export class AuthModule {}

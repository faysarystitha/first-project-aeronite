import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { compare, hash } from 'bcrypt';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { generateOtp } from './utils/otp.util';
import { MessageService } from './message.service';

@Injectable()
export class AuthService {
  constructor(
    private dbService: PrismaService,
    private jwtService: JwtService,
    private messageService: MessageService,
  ) {}

  async createUser(data: CreateUserDto) {
    const newUser = await this.dbService.users.create({
      data: {
        ...data,
        password: await hash(data.password, 10),
      },
    });

    if (newUser) {
      const { password, ...rest } = newUser;
      return rest;
    }
  }

  async findOneUser(id: number) {
    const user = await this.dbService.users.findUnique({
      where: { id },
    });

    if (user) {
      const { password, ...rest } = user;
      return rest;
    }
  }

  async validateUser(username: string, password: string) {
    const user = await this.dbService.users.findUnique({
      where: { username },
    });

    if (user && (await compare(password, user.password))) {
      const { username, password, ...rest } = user;
      return rest;
    }

    return null;
  }

  async loginUser(
    user: { id: number; name: string; email: string },
    res: Response,
  ) {
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
    };

    const data = await this.findOneUser(payload.id);
    const access_token = await this.jwtService.sign(payload, {
      expiresIn: '2h',
    });
    const refresh_token = await this.jwtService.sign(payload, {
      expiresIn: '1d',
    });

    res.cookie('access_token', access_token, {
      httpOnly: false,
      secure: false,
      maxAge: 7200000,
    });

    res.cookie('refresh_token', refresh_token, {
      httpOnly: false,
      secure: false,
      maxAge: 86400000,
    });

    return {
      access_token,
      refresh_token,
      username: data?.username,
      name: data?.name,
      email: data?.email,
      is_verified: data?.is_verified,
    };
  }

  async logoutUser(res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
  }

  async refreshAccessToken(refresh_token: string, res: Response) {
    try {
      const payload = this.jwtService.verify(refresh_token);
      const access_token = this.jwtService.sign(
        {
          id: payload.id,
          name: payload.name,
          email: payload.email,
        },
        { expiresIn: '2h' },
      );

      res.cookie('access_token', access_token, {
        httpOnly: false,
        secure: false,
        maxAge: 7200000,
      });

      return { access_token };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token.');
    }
  }

  async generateOtp(user_id: number, size = 6) {
    const minRequestIntervalMinutes = 1,
      tokenExpirationMinutes = 5,
      saltRounds = 10;

    const recentToken = await this.dbService.verification.findFirst({
      where: {
        user_id,
        created_at: {
          gt: new Date(
            new Date().getTime() - minRequestIntervalMinutes * 60 * 1000,
          ),
        },
      },
    });

    if (recentToken) {
      throw new UnprocessableEntityException(
        'Please wait about 1 minute before requesting a new OTP code.',
      );
    }

    const otp = generateOtp(size);
    const hashedToken = await hash(otp, saltRounds);

    await this.dbService.verification.deleteMany({
      where: { user_id },
    });

    await this.dbService.verification.create({
      data: {
        user_id,
        otp_token: hashedToken,
        expires_at: new Date(
          new Date().getTime() + tokenExpirationMinutes * 60 * 1000,
        ),
      },
    });

    return otp;
  }

  async validateOtp(user_id: number, otp: string) {
    const validToken = await this.dbService.verification.findFirst({
      where: { user_id, expires_at: { gt: new Date() } },
    });

    if (validToken && (await compare(otp, validToken.otp_token))) {
      await this.dbService.verification.delete({
        where: { id: validToken.id },
      });

      return true;
    }

    return false;
  }

  async emailVerification(id: number) {
    const user = await this.findOneUser(id);

    if (!user) {
      throw new NotFoundException();
    }

    if (user.is_verified) {
      throw new UnprocessableEntityException('Email already verified.');
    }

    const otp = await this.generateOtp(user.id);

    this.messageService.sendEmail({
      subject: 'AERONITE - Verifikasi Email',
      recipients: [{ name: user.name, address: user.email }],
      html: `<p>Hello ${user.name}!</p><p>Verify your account with the following OTP code:
      <br/><span style="font-size: 24px; font-weight: 700">${otp}</span></p><p>OTP code is only valid for 5 minutes after it's sent.</p>
      <p>Best regards, AERONITE.</p>`,
    });

    return true;
  }

  async verifyEmail(user_id: number, otp: string) {
    const user = await this.findOneUser(user_id);

    if (!user) {
      throw new NotFoundException();
    }

    if (user.is_verified) {
      throw new UnprocessableEntityException('Email already verified.');
    }

    const isValid = await this.validateOtp(user_id, otp);

    if (!isValid) {
      throw new UnprocessableEntityException('OTP code is invalid.');
    }

    await this.dbService.users.update({
      where: { id: user_id },
      data: {
        is_verified: true,
      },
    });

    return true;
  }
}

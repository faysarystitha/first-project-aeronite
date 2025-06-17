import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ConflictException,
  UnprocessableEntityException,
  InternalServerErrorException,
  Req,
  Res,
  UseGuards,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() data: CreateUserDto) {
    try {
      return await this.authService.createUser(data);
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError ||
        error instanceof PrismaClientUnknownRequestError
      ) {
        throw new ConflictException('Username/email already exists.');
      } else if (error instanceof PrismaClientValidationError) {
        throw new UnprocessableEntityException(
          'The data type entered is incorrect or the data is empty.',
        );
      } else {
        throw new InternalServerErrorException(
          'There is an error on the internal server.',
        );
      }
    }
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Body() data: LoginUserDto, @Req() req, @Res() res) {
    try {
      return res.json(await this.authService.loginUser(req.user, res));
    } catch (error) {
      console.log(error);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Res() res) {
    await this.authService.logoutUser(res);

    return res.json({ success: true, message: 'Logout successful.' });
  }

  @UseGuards(JwtAuthGuard)
  @Post('send-otp')
  async sendOtp(@Req() req) {
    try {
      await this.authService.emailVerification(req.user.id);

      return {
        message: 'OTP code has been successfully sent to your email address.',
        statusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      if (error instanceof UnprocessableEntityException) {
        throw new UnprocessableEntityException(error.message);
      } else if (error instanceof NotFoundException) {
        throw new NotFoundException('User account not found.');
      } else {
        throw new InternalServerErrorException(
          'There is an error on the internal server.',
        );
      }
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify-email/:otp')
  async verifyEmail(@Param('otp') otp: string, @Req() req) {
    try {
      await this.authService.verifyEmail(req.user.id, otp);

      return {
        message: 'Email successfully verified.',
        statusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      if (error instanceof UnprocessableEntityException) {
        throw new UnprocessableEntityException(error.message);
      } else if (error instanceof NotFoundException) {
        throw new NotFoundException('User account not found.');
      } else {
        throw new InternalServerErrorException(
          'There is an error on the internal server.',
        );
      }
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('user-detail')
  async findOne(@Req() req) {
    try {
      return await this.authService.findOneUser(req.user.id);
    } catch (error) {
      throw new InternalServerErrorException(
        'There is an error on the internal server.',
      );
    }
  }
}

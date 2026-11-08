import { ThrottlerGuard } from '@nestjs/throttler';
import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginThrottlerGuard } from './login-throttler.guard.js';
import { Public } from './public.decorator.js';
import type { AuthedRequest } from './session.guard.js';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @UseGuards(LoginThrottlerGuard)
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Req() request: AuthedRequest): Promise<void> {
    if (request.sessionToken) await this.auth.logout(request.sessionToken);
  }

  @Get('me')
  me(@Req() request: AuthedRequest) {
    return request.organization;
  }
}

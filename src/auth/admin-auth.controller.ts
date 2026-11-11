import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AdminLoginDto } from './dto/admin-login.dto.js';
import { LoginThrottlerGuard } from './login-throttler.guard.js';
import { Public } from './public.decorator.js';

// Admin panel sign-in: email + password, admin role only.
@Controller('api/admin')
export class AdminAuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @UseGuards(LoginThrottlerGuard)
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: AdminLoginDto) {
    return this.auth.adminLogin(dto);
  }
}

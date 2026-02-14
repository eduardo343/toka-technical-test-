import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UseGuards, Get, Req }  from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';


@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
register(@Body() body: RegisterDto) {
  return this.authService.register(body.email, body.password);
}

@Post('login')
login(@Body() body: LoginDto) {
  return this.authService.login(body.email, body.password);
}
@UseGuards(AuthGuard('jwt'))
@Get('profile')
getProfile(@Req() req) {
  return req.user;  

}
}
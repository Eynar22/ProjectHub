import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RegisterEmpresaDto,
  RegisterEmpleadoDto,
  RegisterIndependienteDto,
  ForgotPasswordDto,
  VerifyResetCodeDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from './dto/auth.dto';
import { ValidarCampos } from '../common/validacion/validar-campos.pipe';
import {
  ESQUEMA_LOGIN,
  ESQUEMA_REGISTRO_EMPRESA,
  ESQUEMA_REGISTRO_EMPLEADO,
  ESQUEMA_REGISTRO_INDEPENDIENTE,
  ESQUEMA_CORREO,
  ESQUEMA_VERIFICAR_CODIGO,
  ESQUEMA_RESET_PASSWORD,
  ESQUEMA_CAMBIAR_PASSWORD,
} from '../common/validacion/esquemas';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body(new ValidarCampos(ESQUEMA_LOGIN)) dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('register/empresa')
  async registerEmpresa(@Body(new ValidarCampos(ESQUEMA_REGISTRO_EMPRESA)) dto: RegisterEmpresaDto) {
    return this.authService.registerEmpresa(dto);
  }

  @Post('register/empleado')
  async registerEmpleado(@Body(new ValidarCampos(ESQUEMA_REGISTRO_EMPLEADO)) dto: RegisterEmpleadoDto) {
    return this.authService.registerEmpleado(dto);
  }

  @Post('register/independiente')
  async registerIndependiente(@Body(new ValidarCampos(ESQUEMA_REGISTRO_INDEPENDIENTE)) dto: RegisterIndependienteDto) {
    return this.authService.registerIndependiente(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.id);
  }

  @Post('forgot-password')
  async forgotPassword(@Body(new ValidarCampos(ESQUEMA_CORREO)) dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('verify-reset-code')
  async verifyResetCode(@Body(new ValidarCampos(ESQUEMA_VERIFICAR_CODIGO)) dto: VerifyResetCodeDto) {
    return this.authService.verifyResetCode(dto);
  }

  @Post('reset-password')
  async resetPassword(@Body(new ValidarCampos(ESQUEMA_RESET_PASSWORD)) dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('change-password')
  async changePassword(@Request() req: any, @Body(new ValidarCampos(ESQUEMA_CAMBIAR_PASSWORD)) dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.id, dto);
  }
}

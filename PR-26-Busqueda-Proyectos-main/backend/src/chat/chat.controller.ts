import { BadRequestException, Controller, Get, Post, Param, Body, UseGuards, ParseIntPipe, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatService } from './chat.service';
import { ValidarCampos } from '../common/validacion/validar-campos.pipe';
import { ESQUEMA_MENSAJE } from '../common/validacion/esquemas';

@Controller('chats')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get('proyecto/:proyectoId')
  findByProyecto(@Param('proyectoId', ParseIntPipe) proyectoId: number) {
    return this.chatService.findByProyecto(proyectoId);
  }

  @Get('proyecto/:proyectoId/mensajes')
  findMessages(@Param('proyectoId', ParseIntPipe) proyectoId: number) {
    return this.chatService.findMessages(proyectoId);
  }

  @Post('proyecto/:proyectoId/mensajes')
  createMessage(
    @Param('proyectoId', ParseIntPipe) proyectoId: number,
    @Body(new ValidarCampos(ESQUEMA_MENSAJE)) body: { contenido: string; archivo_url?: string },
    @Request() req: any,
  ) {
    if (!body.contenido?.trim() && !body.archivo_url) {
      throw new BadRequestException('El mensaje no puede estar vacío.');
    }
    return this.chatService.createMessage(proyectoId, req.user.id, body.contenido, body.archivo_url);
  }
}

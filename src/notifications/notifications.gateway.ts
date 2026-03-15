import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private connectedUsers = new Map<string, string>(); // userId → socketId

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    // Eliminar usuario desconectado del mapa
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        this.connectedUsers.delete(userId);
        this.logger.log(`Usuario ${userId} desconectado`);
        break;
      }
    }
  }

  @SubscribeMessage('register')
  handleRegister(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    const userId = parsed?.userId;

    if (!userId) {
      this.logger.warn(`Register sin userId desde socket ${client.id}`);
      return { event: 'registered', data: { success: false } };
    }

    this.connectedUsers.set(userId, client.id);
    this.logger.log(`Usuario ${userId} registrado con socket ${client.id}`);
    return { event: 'registered', data: { success: true } };
  }

  // Enviar notificación a un usuario específico
  sendNotificationToUser(userId: string, notification: any) {
    this.logger.log(
      `Usuarios conectados: ${JSON.stringify([...this.connectedUsers])}`,
    );
    this.logger.log(`Buscando userId: ${userId}`);

    const socketId = this.connectedUsers.get(userId);
    this.logger.log(`SocketId encontrado: ${socketId}`);

    if (socketId) {
      this.server.to(socketId).emit('notification', notification);
      this.logger.log(`Notificación enviada a usuario ${userId}`);
    } else {
      this.logger.warn(`Usuario ${userId} no está conectado`);
    }
  }
}

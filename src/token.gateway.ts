import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TokenService } from './token.service';

@WebSocketGateway({ cors: true })
export class TokenGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(private readonly tokenService: TokenService) {}

  // Send current state to newly connected client
  handleConnection(client: Socket) {
    client.emit('state', this.tokenService.getState());
  }

  @SubscribeMessage('updateToken')
  handleUpdateToken(@MessageBody() data: { room: 'room1' | 'room2'; token: number }) {
    const state = this.tokenService.updateToken(data.room, data.token);
    this.server.emit('state', state);
  }

  @SubscribeMessage('updateAnnouncement')
  handleAnnouncement(@MessageBody() text: string) {
    const state = this.tokenService.updateAnnouncement(text);
    this.server.emit('state', state);
  }
}

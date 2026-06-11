import { Injectable } from '@nestjs/common';

export interface QueueState {
  room1: { current: number | null };
  room2: { current: number | null };
  announcement: string;
}

@Injectable()
export class TokenService {
  private state: QueueState = {
    room1: { current: null },
    room2: { current: null },
    announcement: '',
  };

  getState(): QueueState {
    return this.state;
  }

  updateToken(room: 'room1' | 'room2', token: number): QueueState {
    this.state[room].current = token;
    return this.state;
  }

  updateAnnouncement(text: string): QueueState {
    this.state.announcement = text;
    return this.state;
  }
}

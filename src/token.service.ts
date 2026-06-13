import { Injectable } from '@nestjs/common';

export interface QueueState {
  room1: { current: number | null; callSeq: number };
  room2: { current: number | null; callSeq: number };
  announcement: string;
}

@Injectable()
export class TokenService {
  private state: QueueState = {
    room1: { current: null, callSeq: 0 },
    room2: { current: null, callSeq: 0 },
    announcement: '',
  };

  getState(): QueueState {
    return this.state;
  }

  updateToken(room: 'room1' | 'room2', token: number): QueueState {
    this.state[room].current = token;
    this.state[room].callSeq += 1;
    return this.state;
  }

  updateAnnouncement(text: string): QueueState {
    this.state.announcement = text;
    return this.state;
  }
}

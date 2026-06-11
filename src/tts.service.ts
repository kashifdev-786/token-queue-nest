import { Injectable, Logger } from '@nestjs/common';
import { EdgeTTS } from 'edge-tts-universal';
import { buildAnnouncement } from './announcement.util';

const URDU_VOICE = 'ur-PK-UzmaNeural';

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);
  private ready = false;

  async synthesizeUrdu(text: string): Promise<Buffer> {
    const tts = new EdgeTTS(text, URDU_VOICE, { rate: '-8%' });
    const result = await tts.synthesize();
    const audio = Buffer.from(await result.audio.arrayBuffer());
    this.ready = true;
    return audio;
  }

  async synthesizeToken(token: number, room: string): Promise<Buffer> {
    const text = buildAnnouncement(token, room);
    return this.synthesizeUrdu(text);
  }

  async synthesizeTest(): Promise<Buffer> {
    return this.synthesizeUrdu('آڈیو سسٹم فعال ہے');
  }

  isReady(): boolean {
    return this.ready;
  }

  logFailure(error: unknown) {
    this.logger.warn(
      `Urdu TTS failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

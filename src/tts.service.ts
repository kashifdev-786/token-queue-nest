import { Injectable, Logger } from '@nestjs/common';
import { EdgeTTS } from 'edge-tts-universal';
import { buildSpokenAnnouncement, buildSpokenTestAnnouncement } from './announcement.util';

/**
 * Swara (Hindi female) — natural Hindi announcements for token calls.
 * On-screen captions stay Urdu script; spoken audio uses Hindi phrasing.
 */
export const TTS_VOICE = 'hi-IN-SwaraNeural';

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);
  private ready = false;

  getVoiceName(): string {
    return TTS_VOICE;
  }

  async synthesizeSpeech(text: string): Promise<Buffer> {
    const tts = new EdgeTTS(text, TTS_VOICE, { rate: '-8%' });
    const result = await tts.synthesize();
    const audio = Buffer.from(await result.audio.arrayBuffer());
    if (!audio.length) {
      throw new Error('Swara TTS returned empty audio');
    }
    this.ready = true;
    this.logger.debug(`Synthesized with ${TTS_VOICE}: ${text.slice(0, 40)}…`);
    return audio;
  }

  async synthesizeToken(token: number, room: string): Promise<Buffer> {
    const text = buildSpokenAnnouncement(token, room);
    return this.synthesizeSpeech(text);
  }

  async synthesizeTest(): Promise<Buffer> {
    return this.synthesizeSpeech(buildSpokenTestAnnouncement());
  }

  isReady(): boolean {
    return this.ready;
  }

  logFailure(error: unknown) {
    this.logger.warn(
      `Swara TTS failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

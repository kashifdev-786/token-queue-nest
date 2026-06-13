import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EdgeTTS } from 'edge-tts-universal';
import { buildSpokenAnnouncement, buildSpokenTestAnnouncement } from './announcement.util';

/**
 * Swara (Hindi female) — natural Hindi announcements for token calls.
 * On-screen captions stay Urdu script; spoken audio uses Hindi phrasing.
 */
export const TTS_VOICE = 'hi-IN-SwaraNeural';

@Injectable()
export class TtsService implements OnModuleInit {
  private readonly logger = new Logger(TtsService.name);
  private ready = false;
  private readonly cache = new Map<string, Buffer>();

  getVoiceName(): string {
    return TTS_VOICE;
  }

  onModuleInit() {
    // Warm Edge TTS connection so the first real token call is faster.
    this.synthesizeTest().catch((err) => {
      this.logger.warn(`TTS warm-up failed: ${err instanceof Error ? err.message : String(err)}`);
    });
  }

  async synthesizeSpeech(text: string): Promise<Buffer> {
    const cached = this.cache.get(`text:${text}`);
    if (cached) return cached;

    const tts = new EdgeTTS(text, TTS_VOICE, { rate: '-8%' });
    const result = await tts.synthesize();
    const audio = Buffer.from(await result.audio.arrayBuffer());
    if (!audio.length) {
      throw new Error('Swara TTS returned empty audio');
    }
    this.cache.set(`text:${text}`, audio);
    this.ready = true;
    this.logger.debug(`Synthesized with ${TTS_VOICE}: ${text.slice(0, 40)}…`);
    return audio;
  }

  async synthesizeToken(token: number, room: string): Promise<Buffer> {
    const key = `token:${room}:${token}`;
    const cached = this.cache.get(key);
    if (cached) return cached;

    const text = buildSpokenAnnouncement(token, room);
    const audio = await this.synthesizeSpeech(text);
    this.cache.set(key, audio);
    return audio;
  }

  async synthesizeTest(): Promise<Buffer> {
    const key = 'test:1';
    const cached = this.cache.get(key);
    if (cached) return cached;

    const audio = await this.synthesizeSpeech(buildSpokenTestAnnouncement());
    this.cache.set(key, audio);
    return audio;
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

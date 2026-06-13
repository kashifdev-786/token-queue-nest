import { BadRequestException, Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { TtsService } from './tts.service';

@Controller('api')
export class TtsController {
  constructor(private readonly tts: TtsService) {}

  @Get('tts')
  async speak(
    @Query('token') token: string,
    @Query('room') room: string,
    @Query('test') test: string,
    @Res() res: Response,
  ) {
    try {
      let audio: Buffer;

      if (test === '1') {
        audio = await this.tts.synthesizeTest();
      } else {
        const tokenNum = parseInt(token, 10);
        if (!tokenNum || tokenNum < 1) {
          throw new BadRequestException('Invalid token');
        }
        if (!room || !['room1', 'room2'].includes(room)) {
          throw new BadRequestException('Invalid room');
        }
        audio = await this.tts.synthesizeToken(tokenNum, room);
      }

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('X-TTS-Voice', this.tts.getVoiceName());
      res.send(audio);
    } catch (error) {
      this.tts.logFailure(error);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Urdu speech unavailable — check server internet connection');
    }
  }
}

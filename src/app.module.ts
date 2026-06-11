import { Module } from '@nestjs/common';
import { TokenGateway } from './token.gateway';
import { TokenService } from './token.service';
import { TtsController } from './tts.controller';
import { TtsService } from './tts.service';

@Module({
  controllers: [TtsController],
  providers: [TokenGateway, TokenService, TtsService],
})
export class AppModule {}

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as os from 'os';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve frontend static files
  app.useStaticAssets(join(__dirname, '..', 'public'));

  const PORT = 3000;
  await app.listen(PORT, '0.0.0.0');

  // Print LAN IP
  const nets = os.networkInterfaces();
  let lanIp = 'localhost';
  for (const iface of Object.values(nets)) {
    for (const addr of iface ?? []) {
      if (addr.family === 'IPv4' && !addr.internal) {
        lanIp = addr.address;
        break;
      }
    }
  }

  console.log(`\n✅ Token Queue Server (NestJS) running`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Display: http://${lanIp}:${PORT}/display`);
  console.log(`   Room 1:  http://${lanIp}:${PORT}/room1`);
  console.log(`   Room 2:  http://${lanIp}:${PORT}/room2`);
  console.log(`   Urdu TTS: http://${lanIp}:${PORT}/api/tts?test=1\n`);
}

bootstrap();

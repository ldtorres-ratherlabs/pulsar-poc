import { Controller, Get } from '@nestjs/common';
import { version } from '../package.json';

@Controller()
export class AppController {
  @Get()
  async getVersion() {
    return { version };
  }

  @Get('healthcheck')
  async getHealthCheck() {
    return { version, status: 'ok' };
  }
}

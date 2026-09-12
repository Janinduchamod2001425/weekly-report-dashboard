import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'Weekly Report Dashboard API',
      timestamp: new Date().toISOString(),
    };
  }
}
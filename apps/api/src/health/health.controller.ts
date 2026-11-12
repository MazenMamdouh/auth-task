import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Connection } from 'mongoose';

@ApiTags('health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  /** Liveness + database readiness, for load balancers and docker healthchecks. */
  @Get()
  check(): { status: 'ok'; db: 'up' } {
    if (this.connection.readyState !== 1) throw new ServiceUnavailableException('Database is not connected');
    return { status: 'ok', db: 'up' };
  }
}

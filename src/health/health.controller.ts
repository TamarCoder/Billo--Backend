import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/public.decorator.js';

// Used by Docker HEALTHCHECK and Kubernetes probes.
// Public on purpose: it returns no data and is pinged by the keep-alive cron job.
@Public()
@Controller('health')
export class HealthController {
  @Get()
  check(): { status: 'ok' } {
    return { status: 'ok' };
  }
}

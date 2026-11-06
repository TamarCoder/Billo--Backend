import { Controller, Get } from '@nestjs/common';

// Used by Docker HEALTHCHECK and Kubernetes probes.
// Public on purpose: it returns no data. When a global auth guard is added,
// mark this controller as public.
@Controller('health')
export class HealthController {
  @Get()
  check(): { status: 'ok' } {
    return { status: 'ok' };
  }
}

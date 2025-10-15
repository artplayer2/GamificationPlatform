import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
    @Get()
    liveness() {
        return { ok: true, status: 'live' };
    }

    @Get('ready')
    readiness() {
        return { ok: true, status: 'ready' };
    }
}

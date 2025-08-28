import { Body, Controller, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { CountersService } from './counters.service';
import { IncrementCounterDto } from './dto/increment-counter.dto';
import { ApiHeader, ApiTags } from '@nestjs/swagger';

@ApiTags('Counters')
@ApiHeader({
    name: 'x-tenant-id',
    description: 'Tenant ID (ex.: demo)',
    required: true,
})
@Controller('counters')
export class CountersController {
    constructor(private readonly svc: CountersService) {}

    @Post('increment')
    increment(@Req() req: Request, @Body() body: IncrementCounterDto) {
        const tenantId = (req as any).tenantId as string;
        return this.svc.increment(tenantId, body);
    }
}

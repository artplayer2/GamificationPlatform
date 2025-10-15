import { Body, Controller, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ApiKeysService } from './apikeys.service';
import { CreateApiKeyDto } from './dto/create-apikey.dto';
import { UpdateApiKeyDto } from './dto/update-apikey.dto';

@ApiTags('Client - API Keys')
@Controller('client/apikeys')
export class ApiKeysController {
  constructor(private readonly service: ApiKeysService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new API key for a tenant/project' })
  @ApiBody({ type: CreateApiKeyDto })
  async create(@Req() req: Request, @Body() dto: CreateApiKeyDto) {
    const tenantId = (req as any).tenantId as string;
    return this.service.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List API keys for tenant (optionally by project)' })
  async list(@Req() req: Request, @Query('projectId') projectId?: string) {
    const tenantId = (req as any).tenantId as string;
    return this.service.list(tenantId, projectId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update API key metadata (roles/scopes/limits)' })
  @ApiBody({ type: UpdateApiKeyDto })
  async update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateApiKeyDto) {
    const tenantId = (req as any).tenantId as string;
    return this.service.update(tenantId, id, dto);
  }

  @Post(':id/revoke')
  @ApiOperation({ summary: 'Revoke an API key' })
  async revoke(@Req() req: Request, @Param('id') id: string) {
    const tenantId = (req as any).tenantId as string;
    return this.service.revoke(tenantId, id);
  }

  @Post(':id/rotate')
  @ApiOperation({ summary: 'Rotate an API key (returns new plaintext once)' })
  async rotate(@Req() req: Request, @Param('id') id: string) {
    const tenantId = (req as any).tenantId as string;
    return this.service.rotate(tenantId, id);
  }
}
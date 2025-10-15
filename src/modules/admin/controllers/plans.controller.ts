import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { PlansService, CreatePlanInput, UpdatePlanInput } from '../../plans/plans.service';

@ApiTags('Admin - Plans')
@ApiHeader({ name: 'x-tenant-id', description: 'Tenant ID (e.g. demo)', required: true })
@ApiSecurity('Tenant')
@Controller('admin/plans')
export class AdminPlansController {
  constructor(private readonly plans: PlansService) {}

  @Post()
  @ApiOperation({ summary: 'Create plan definition' })
  @ApiResponse({ status: 201, description: 'Plan created' })
  @ApiBody({ description: 'Create a plan', examples: { default: { value: {
    name: 'Pro',
    code: 'pro',
    limits: { restMaxReqPerMin: 600, wsMaxClients: 5000 },
    features: { webhooksEnabled: true, realtimeEnabled: true }
  } } } })
  async create(@Body() body: CreatePlanInput) {
    return this.plans.create(body);
  }

  @Get()
  @ApiOperation({ summary: 'List plans' })
  @ApiResponse({ status: 200, description: 'List of plans' })
  async list() {
    return this.plans.list();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get plan by id' })
  async get(@Param('id') id: string) {
    return this.plans.get(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update plan' })
  async update(@Param('id') id: string, @Body() body: UpdatePlanInput) {
    return this.plans.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete plan' })
  async remove(@Param('id') id: string) {
    return this.plans.remove(id);
  }
}
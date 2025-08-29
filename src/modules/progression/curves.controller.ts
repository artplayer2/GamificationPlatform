import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Request } from 'express';
import { Model } from 'mongoose';
import { ProgressionCurve, ProgressionCurveDocument } from './schemas/curve.schema';
import { CreateCurveDto } from './dto/create-curve.dto';
import { ApiHeader, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('Progression')
@ApiHeader({
    name: 'x-tenant-id',
    description: 'Tenant ID (ex.: demo)',
    required: true,
})
@Controller('progression/curves')
export class ProgressionCurvesController {
    constructor(
        @InjectModel(ProgressionCurve.name) private curveModel: Model<ProgressionCurveDocument>,
    ) {}

    @Post()
    async create(@Req() req: Request, @Body() body: CreateCurveDto) {
        const tenantId = (req as any).tenantId as string;

        // se marcar isActive, desativa as outras do projeto
        if (body.isActive) {
            await this.curveModel.updateMany(
                { tenantId, projectId: body.projectId, isActive: true },
                { $set: { isActive: false } },
            );
        }

        const doc = await this.curveModel.create({
            tenantId,
            projectId: body.projectId,
            name: body.name,
            levels: body.levels,
            isActive: !!body.isActive,
        });

        return doc;
    }

    @Get()
    @ApiQuery({ name: 'projectId', required: true })
    list(@Req() req: Request, @Query('projectId') projectId: string) {
        const tenantId = (req as any).tenantId as string;
        return this.curveModel.find({ tenantId, projectId }).sort({ createdAt: -1 }).lean();
    }
}

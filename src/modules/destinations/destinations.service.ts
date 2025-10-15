import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Destination, DestinationDocument } from './schemas/destination.schema';

@Injectable()
export class DestinationsService {
    constructor(
        @InjectModel(Destination.name) private model: Model<DestinationDocument>,
    ) {}

    create(tenantId: string, dto: Partial<Destination>) {
        return this.model.create({ tenantId, ...dto });
    }

    list(tenantId: string, projectId?: string) {
        const q: any = { tenantId };
        if (projectId) q.projectId = projectId;
        return this.model.find(q).lean().exec();
    }

    get(tenantId: string, id: string) {
        return this.model.findOne({ _id: id, tenantId }).lean().exec();
    }

    update(tenantId: string, id: string, patch: Partial<Destination>) {
        return this.model.findOneAndUpdate({ _id: id, tenantId }, { $set: patch }, { new: true }).lean().exec();
    }

    remove(tenantId: string, id: string) {
        return this.model.deleteOne({ _id: id, tenantId }).exec();
    }

    setActive(tenantId: string, id: string, active: boolean) {
        return this.model.findOneAndUpdate({ _id: id, tenantId }, { $set: { active } }, { new: true }).lean().exec();
    }
}

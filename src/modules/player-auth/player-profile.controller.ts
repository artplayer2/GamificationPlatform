import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PlayerAuthGuard } from '../common/guards/player.guard';
import { PlayerAuthService } from './player-auth.service';
import { Player, PlayerDocument } from '../players/schemas/player.schema';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

class ChangePasswordDto {
  @IsString()
  @MinLength(6)
  currentPassword!: string;

  @IsString()
  @MinLength(6)
  newPassword!: string;
}

@ApiTags('Player')
@ApiBearerAuth()
@Controller('player/me')
export class PlayerProfileController {
  constructor(
    @InjectModel(Player.name) private readonly playerModel: Model<PlayerDocument>,
    private readonly auth: PlayerAuthService,
  ) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get my profile (username, email, profile)' })
  @UseGuards(PlayerAuthGuard)
  async profile(@Req() req: Request) {
    const tenantId = (req as any).tenantId as string;
    const projectId = (req as any).projectId as string;
    const playerId = (req as any).player?.id as string;
    const doc = await this.playerModel.findOne({ _id: playerId, tenantId, projectId }).lean().exec();
    return {
      id: playerId,
      username: doc?.username ?? null,
      email: doc?.email ?? null,
      profile: doc?.profile ?? {},
    };
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update my profile (name, avatar, bio, email)' })
  @ApiBody({ description: 'Partial profile update', examples: { default: { value: {
    name: 'Jane Player',
    avatarUrl: 'https://cdn.example/avatar.png',
    bio: 'RPG fan',
    email: 'jane@example.com'
  } } } })
  @UseGuards(PlayerAuthGuard)
  async updateProfile(@Req() req: Request, @Body() body: UpdateProfileDto) {
    const tenantId = (req as any).tenantId as string;
    const projectId = (req as any).projectId as string;
    const playerId = (req as any).player?.id as string;
    const $set: any = {};
    if (body.name !== undefined || body.avatarUrl !== undefined || body.bio !== undefined) {
      $set['profile'] = {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.avatarUrl !== undefined ? { avatarUrl: body.avatarUrl } : {}),
        ...(body.bio !== undefined ? { bio: body.bio } : {}),
      };
    }
    if (body.email !== undefined) {
      $set['email'] = body.email.toLowerCase().trim();
    }
    const updated = await this.playerModel.findOneAndUpdate(
      { _id: playerId, tenantId, projectId },
      { $set },
      { new: true }
    ).lean().exec();
    return {
      id: playerId,
      username: updated?.username ?? null,
      email: updated?.email ?? null,
      profile: updated?.profile ?? {},
    };
  }

  @Post('password')
  @ApiOperation({ summary: 'Change my password' })
  @ApiBody({ description: 'Current and new password', examples: { default: { value: {
    currentPassword: 'oldP@ss',
    newPassword: 'newStr0ngP@ss'
  } } } })
  @UseGuards(PlayerAuthGuard)
  async changePassword(@Req() req: Request, @Body() body: ChangePasswordDto) {
    const tenantId = (req as any).tenantId as string;
    const projectId = (req as any).projectId as string;
    const playerId = (req as any).player?.id as string;
    const doc = await this.playerModel.findOne({ _id: playerId, tenantId, projectId }).exec();
    if (!doc || !doc.passwordHash) {
      throw new Error('Password not set');
    }
    const ok = this.auth.verifyPassword(body.currentPassword, doc.passwordHash);
    if (!ok) throw new Error('Invalid current password');
    doc.passwordHash = this.auth.hashPassword(body.newPassword);
    await doc.save();
    return { ok: true };
  }
}
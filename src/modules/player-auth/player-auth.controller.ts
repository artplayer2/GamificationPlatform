import { Body, Controller, Post, Req, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { PlayersService } from '../players/players.service';
import { PlayerAuthService } from './player-auth.service';
import { ApiBody, ApiHeader, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsMongoId, IsOptional, IsString, MinLength } from 'class-validator';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Player, PlayerDocument } from '../players/schemas/player.schema';

class PlayerLoginDto {
  projectId!: string;
  username!: string;
}

class PasswordLoginDto {
  @IsMongoId()
  projectId!: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

class RegisterDto {
  @IsMongoId()
  projectId!: string;

  @IsString()
  username!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

@ApiTags('Player Auth')
@ApiHeader({ name: 'x-tenant-id', description: 'Tenant ID (e.g. demo)', required: true })
@ApiSecurity('Tenant')
@Controller('player/auth')
export class PlayerAuthController {
  constructor(
    private readonly players: PlayersService,
    private readonly auth: PlayerAuthService,
    @InjectModel(Player.name) private readonly playerModel: Model<PlayerDocument>,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'DEV login: issue player token by username/projectId' })
  @ApiBody({ description: 'Login (dev-mode) using username + projectId', examples: { default: { value: {
    projectId: '66d2a1f5e4aabbccddeeff00',
    username: 'the_wizard_77'
  } } } })
  async login(@Req() req: Request, @Body() body: PlayerLoginDto) {
    const tenantId = (req as any).tenantId as string;
    const { projectId, username } = body;
    const player = await this.players.getByUsername(tenantId, projectId, username);

    const token = this.auth.signToken({
      sub: player.id,
      tenantId,
      projectId,
      username: player.username,
      roles: ['player'],
      scopes: ['player:read'],
    });

    return {
      tokenType: 'Bearer',
      accessToken: token,
      player: { id: player.id, username: player.username },
      projectId,
      expiresIn: '1h',
    };
  }

  @Post('register')
  @ApiOperation({ summary: 'Register player with password (issues Bearer token)' })
  @ApiBody({ description: 'Register using username/email + password + projectId', examples: { default: { value: {
    projectId: '66d2a1f5e4aabbccddeeff00',
    username: 'player_one',
    email: 'player@game.com',
    password: 'strongP@ssw0rd'
  } } } })
  async register(@Req() req: Request, @Body() body: RegisterDto) {
    const tenantId = (req as any).tenantId as string;
    const { projectId, username, email, password } = body;

    const created = await this.players.create(tenantId, { projectId, username });
    const passwordHash = this.auth.hashPassword(password);
    const updated = await this.players.update(tenantId, projectId, created.id, {
      passwordHash,
      ...(email ? { email: email.toLowerCase().trim() } : {}),
    });

    const token = this.auth.signToken({
      sub: updated.id,
      tenantId,
      projectId,
      username: updated.username,
      roles: ['player'],
      scopes: ['player:read'],
    });

    return {
      tokenType: 'Bearer',
      accessToken: token,
      player: { id: updated.id, username: updated.username, email: email ?? null },
      projectId,
      expiresIn: '1h',
    };
  }

  @Post('login/password')
  @ApiOperation({ summary: 'Login by username or email + password' })
  @ApiBody({ description: 'Login using username/email + password + projectId', examples: { default: { value: {
    projectId: '66d2a1f5e4aabbccddeeff00',
    username: 'player_one',
    password: 'strongP@ssw0rd'
  } }, email: { value: {
    projectId: '66d2a1f5e4aabbccddeeff00',
    email: 'player@game.com',
    password: 'strongP@ssw0rd'
  } } } })
  async loginWithPassword(@Req() req: Request, @Body() body: PasswordLoginDto) {
    const tenantId = (req as any).tenantId as string;
    const { projectId, username, email, password } = body;
    if (!username && !email) {
      throw new UnauthorizedException('Provide username or email');
    }

    let playerDoc: PlayerDocument | null = null;
    if (username) {
      const player = await this.players.getByUsername(tenantId, projectId, username);
      playerDoc = await this.playerModel.findOne({ _id: player.id, tenantId, projectId }).exec();
    } else if (email) {
      playerDoc = await this.playerModel.findOne({ tenantId, projectId, email: email.toLowerCase().trim() }).exec();
    }
    if (!playerDoc || !playerDoc.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = this.auth.verifyPassword(password, playerDoc.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const token = this.auth.signToken({
      sub: playerDoc._id.toString(),
      tenantId,
      projectId,
      username: playerDoc.username,
      roles: ['player'],
      scopes: ['player:read'],
    });

    return {
      tokenType: 'Bearer',
      accessToken: token,
      player: { id: playerDoc._id.toString(), username: playerDoc.username, email: playerDoc.email ?? null },
      projectId,
      expiresIn: '1h',
    };
  }
}
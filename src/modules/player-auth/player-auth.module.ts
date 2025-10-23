import { Module, forwardRef } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { PlayersModule } from '../players/players.module'
import { AchievementsModule } from '../achievements/achievements.module'
import { PlayerAuthService } from './player-auth.service'
import { PlayerAuthController } from './player-auth.controller'
import { PlayerSelfController } from './player-self.controller'
import { PlayerLeaderboardsController } from './player-leaderboards.controller'
import { MongooseModule } from '@nestjs/mongoose'
import { Player, PlayerSchema } from '../players/schemas/player.schema'
import { PlayerProfileController } from './player-profile.controller'
import { AvatarsModule } from '../avatars/avatars.module'

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: Player.name, schema: PlayerSchema }]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (cfg: ConfigService) => {
        const raw = cfg.get<string>('PLAYER_JWT_EXPIRES') || '3600';
        const m = /^\s*(\d+)\s*([smhd])?\s*$/i.exec(raw);
        let expiresIn = 3600; // seconds
        if (m) {
          const value = parseInt(m[1], 10) || 3600;
          const unit = (m[2] || '').toLowerCase();
          if (unit === 's' || unit === '') expiresIn = value;
          else if (unit === 'm') expiresIn = value * 60;
          else if (unit === 'h') expiresIn = value * 3600;
          else if (unit === 'd') expiresIn = value * 86400;
        }
        return {
          secret: cfg.get<string>('PLAYER_JWT_SECRET') || 'dev-player-secret',
          signOptions: { expiresIn },
        };
      },
      inject: [ConfigService],
    }),
    forwardRef(() => PlayersModule),
    forwardRef(() => AchievementsModule),
    AvatarsModule,
  ],
  controllers: [PlayerAuthController, PlayerSelfController, PlayerLeaderboardsController, PlayerProfileController],
  providers: [PlayerAuthService],
  exports: [PlayerAuthService],
})
export class PlayerAuthModule {}
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Merchant } from '../merchant/entities/merchant.entity';
import { AuthService } from './services/auth.service';
import { ApiKeyStrategy } from './strategies/api-key.strategy';
import { AuthGuard } from './guards/auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Merchant])],
  providers: [AuthService, ApiKeyStrategy, AuthGuard],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}

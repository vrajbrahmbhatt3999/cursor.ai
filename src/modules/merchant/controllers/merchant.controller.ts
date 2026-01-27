import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity, ApiResponse } from '@nestjs/swagger';
import { MerchantService } from '../services/merchant.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { Merchant, MerchantContext } from '../../../common/decorators/merchant.decorator';

@ApiTags('merchants')
@Controller('merchants')
@UseGuards(AuthGuard)
@ApiSecurity('api-key')
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current merchant profile' })
  @ApiResponse({ status: 200, description: 'Merchant profile retrieved successfully' })
  async getProfile(@Merchant() merchant: MerchantContext) {
    return this.merchantService.findById(merchant.id);
  }
}

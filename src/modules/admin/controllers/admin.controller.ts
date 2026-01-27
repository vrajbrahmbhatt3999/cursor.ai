import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { AdminService } from '../services/admin.service';
import { AuthGuard } from '../../auth/guards/auth.guard';

@ApiTags('admin')
@Controller('admin')
@UseGuards(AuthGuard)
@ApiSecurity('api-key')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('health/gateways')
  @ApiOperation({ summary: 'Get gateway health status' })
  @ApiResponse({ status: 200, description: 'Gateway health retrieved successfully' })
  async getGatewayHealth() {
    return this.adminService.getGatewayHealth();
  }

  @Get('merchants/:merchantId/stats')
  @ApiOperation({ summary: 'Get merchant statistics' })
  @ApiResponse({ status: 200, description: 'Merchant stats retrieved successfully' })
  async getMerchantStats(@Param('merchantId') merchantId: string) {
    return this.adminService.getMerchantStats(merchantId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get system statistics' })
  @ApiResponse({ status: 200, description: 'System stats retrieved successfully' })
  async getSystemStats() {
    return this.adminService.getSystemStats();
  }
}

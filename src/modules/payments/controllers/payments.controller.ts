import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PaymentOrchestratorService } from '../../orchestration/services/payment-orchestrator.service';
import { PaymentIntentService } from '../services/payment-intent.service';
import { CreatePaymentIntentDto } from '../dto/create-payment-intent.dto';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { Merchant, MerchantContext } from '../../../common/decorators/merchant.decorator';

@ApiTags('payments')
@Controller('payments')
@UseGuards(AuthGuard)
@ApiSecurity('api-key')
export class PaymentsController {
  constructor(
    @Inject(forwardRef(() => PaymentOrchestratorService))
    private readonly orchestratorService: PaymentOrchestratorService,
    private readonly paymentIntentService: PaymentIntentService,
  ) {}

  @Post('initiate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Initiate a new payment' })
  @ApiResponse({ status: 201, description: 'Payment initiated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 409, description: 'Duplicate idempotency key' })
  async initiatePayment(
    @Body() dto: CreatePaymentIntentDto,
    @Merchant() merchant: MerchantContext,
  ) {
    return this.orchestratorService.initiatePayment(merchant.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List payment intents for merchant' })
  @ApiResponse({ status: 200, description: 'Payment intents retrieved successfully' })
  @ApiQuery({ name: 'page', type: Number, required: false, description: 'Page number for pagination (minimum: 1)', example: 1 })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: 'Number of items per page (minimum: 1, maximum: 100)', example: 10 })
  async listPaymentIntents(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Merchant() merchant: MerchantContext,
  ) {
    const pageNum = /^\d+$/.test(page) ? Math.max(parseInt(page, 10), 1) : 1;
    const limitNum = /^\d+$/.test(limit) ? Math.min(Math.max(parseInt(limit, 10), 1), 100) : 10;
    return this.paymentIntentService.findByMerchantId(merchant.id, pageNum, limitNum);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment intent by ID' })
  @ApiParam({ name: 'id', description: 'Payment Intent ID' })
  @ApiResponse({ status: 200, description: 'Payment intent retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment intent not found' })
  async getPaymentIntent(
    @Param('id') id: string,
    @Merchant() merchant: MerchantContext,
  ) {
    const paymentIntent = await this.paymentIntentService.findById(id);
    
    if (paymentIntent.merchantId !== merchant.id) {
      throw new UnauthorizedException('Unauthorized access to payment intent');
    }

    return paymentIntent;
  }
}

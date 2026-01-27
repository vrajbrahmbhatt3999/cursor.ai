import { Controller, Post, Body, Headers, Param, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WebhookService } from '../services/webhook.service';
import { GatewayProvider } from '../../../common/enums/merchant.enum';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly webhookService: WebhookService) {}

  @Post(':gateway')
  @ApiOperation({ summary: 'Receive webhook from payment gateway' })
  @ApiResponse({ status: 200, description: 'Webhook received successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook' })
  async receiveWebhook(
    @Param('gateway') gateway: string,
    @Body() payload: any,
    @Headers('x-signature') signature?: string,
    @Headers('x-merchant-id') merchantId?: string,
  ) {
    // In production, merchantId should be extracted from webhook payload or verified signature
    const defaultMerchantId = merchantId || 'default-merchant-id';

    this.logger.log(`Received webhook from ${gateway} for merchant ${defaultMerchantId}`);

    return this.webhookService.processWebhook(
      defaultMerchantId,
      gateway.toUpperCase() as GatewayProvider,
      payload,
      signature,
    );
  }
}

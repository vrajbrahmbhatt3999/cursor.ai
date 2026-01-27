import { Module } from '@nestjs/common';
import { GatewayRegistryService } from './services/gateway-registry.service';
import { RazorpayAdapter } from './adapters/razorpay.adapter';
import { StripeAdapter } from './adapters/stripe.adapter';
import { GatewayAdapter } from './interfaces/gateway-adapter.interface';

@Module({
  providers: [
    GatewayRegistryService,
    {
      provide: 'GATEWAY_ADAPTERS',
      useFactory: (razorpay: RazorpayAdapter, stripe: StripeAdapter) => {
        return new Map<string, GatewayAdapter>([
          ['RAZORPAY', razorpay],
          ['STRIPE', stripe],
        ]);
      },
      inject: [RazorpayAdapter, StripeAdapter],
    },
    RazorpayAdapter,
    StripeAdapter,
  ],
  exports: [GatewayRegistryService],
})
export class GatewayModule {}

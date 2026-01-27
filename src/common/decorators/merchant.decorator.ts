import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface MerchantContext {
  id: string;
  name: string;
  tier: string;
  kycStatus: string;
}

export const Merchant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): MerchantContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.merchant;
  },
);

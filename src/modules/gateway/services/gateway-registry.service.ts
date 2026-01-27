import { Injectable, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { GatewayAdapter } from '../interfaces/gateway-adapter.interface';
import { GatewayProvider } from '../../../common/enums/merchant.enum';

@Injectable()
export class GatewayRegistryService {
  constructor(
    @Inject('GATEWAY_ADAPTERS')
    private readonly adapters: Map<string, GatewayAdapter>,
  ) {}

  getAdapter(provider: GatewayProvider | string): GatewayAdapter {
    const adapter = this.adapters.get(provider.toUpperCase());

    if (!adapter) {
      throw new NotFoundException(
        `Gateway adapter not found for provider: ${provider}`,
      );
    }

    return adapter;
  }

  registerAdapter(provider: string, adapter: GatewayAdapter): void {
    this.adapters.set(provider.toUpperCase(), adapter);
  }

  listAdapters(): string[] {
    return Array.from(this.adapters.keys());
  }
}

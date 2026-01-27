import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, IsObject, Min, MaxLength } from 'class-validator';
import { PaymentMethod } from '../../../common/enums/payment-status.enum';

export class CreatePaymentIntentDto {
  @ApiProperty({ description: 'Idempotency key for the request', example: 'req_123456789' })
  @IsString()
  @MaxLength(255)
  idempotencyKey: string;

  @ApiProperty({ description: 'Merchant order ID', example: 'order_123' })
  @IsString()
  @MaxLength(100)
  orderId: string;

  @ApiProperty({ description: 'Payment amount', example: 1000.50 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Currency code', example: 'INR', default: 'INR' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ description: 'Payment method', enum: PaymentMethod, example: PaymentMethod.CARD })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ description: 'Customer ID', required: false })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiProperty({ description: 'Customer email', required: false })
  @IsString()
  @IsOptional()
  customerEmail?: string;

  @ApiProperty({ description: 'Customer phone', required: false })
  @IsString()
  @IsOptional()
  customerPhone?: string;

  @ApiProperty({ description: 'Payment description', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ description: 'Additional metadata', required: false, type: Object })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

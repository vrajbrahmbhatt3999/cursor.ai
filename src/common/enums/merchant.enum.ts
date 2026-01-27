export enum MerchantTier {
  BASIC = 'BASIC',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

export enum KYCStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum GatewayProvider {
  RAZORPAY = 'RAZORPAY',
  STRIPE = 'STRIPE',
  ADYEN = 'ADYEN',
  PAYPAL = 'PAYPAL',
}

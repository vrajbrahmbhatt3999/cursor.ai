# Ethics Pay - Payment Orchestration Platform

A production-grade Payment Orchestration Platform built with NestJS, designed for fintech startups to orchestrate payment routing, retries, webhooks, and reporting without holding funds.

## 🏗️ Architecture

Ethics Pay is built as a **Modular Monolith** following Domain-Driven Design principles. The architecture is designed to support future conversion into a full Payment Aggregator while maintaining clean separation of concerns.

### Core Principles

- **Modular Monolith**: All modules are self-contained but share the same process
- **Domain-Driven Design**: Each module represents a business domain
- **Clean Architecture**: Clear separation between controllers, services, repositories, and adapters
- **No Circular Dependencies**: Modules communicate through well-defined interfaces
- **Production-Ready**: Structured logging, error handling, health checks, and API documentation

## 📁 Project Structure

```
src/
├── common/                    # Shared utilities and decorators
│   ├── decorators/           # Custom decorators (e.g., @Merchant)
│   ├── enums/                # Shared enums (PaymentStatus, MerchantTier, etc.)
│   ├── filters/              # Global exception filters
│   └── interceptors/         # Request/response interceptors
├── config/                   # Configuration files
│   ├── app.config.ts         # Application configuration
│   ├── database.config.ts    # TypeORM configuration
│   └── winston.config.ts     # Logging configuration
├── modules/                   # Domain modules
│   ├── auth/                 # API key authentication
│   ├── merchant/             # Merchant management & KYC
│   ├── payments/             # PaymentIntent, PaymentAttempt, Idempotency
│   ├── orchestration/        # Payment lifecycle orchestration
│   ├── routing/              # Gateway selection engine
│   ├── gateway/              # Gateway adapters (Razorpay, Stripe)
│   ├── risk/                 # Risk engine & rules
│   ├── webhook/              # Webhook processing & verification
│   ├── retry/                # Retry & failover logic
│   ├── ledger/               # MVP stub (for future aggregator)
│   ├── notification/         # Merchant webhook notifications
│   ├── admin/                # Internal admin APIs
│   └── health/               # Health check endpoints
└── main.ts                   # Application entry point
```

## 🚀 Getting Started

### Prerequisites

- Node.js (LTS version)
- PostgreSQL 12+
- Redis 6+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ethics-pay
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   # Create PostgreSQL database
   createdb ethics_pay

   # Run migrations (when available)
   npm run migration:run
   ```

5. **Start the application**
   ```bash
   # Development
   npm run start:dev

   # Production
   npm run build
   npm run start:prod
   ```

### Environment Variables

Key environment variables (see `.env.example` for full list):

- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` - PostgreSQL configuration
- `REDIS_HOST`, `REDIS_PORT` - Redis configuration
- `API_KEY_ENCRYPTION_KEY` - For API key hashing
- `WEBHOOK_SECRET` - For webhook signature verification
- Gateway credentials (RAZORPAY_KEY_ID, STRIPE_API_KEY, etc.)

## 📚 API Documentation

Once the application is running, access Swagger documentation at:

```
http://localhost:3000/api/docs
```

### Authentication

All API requests (except webhooks and health checks) require an API key:

```bash
curl -H "X-API-Key: your-api-key" http://localhost:3000/api/v1/payments/initiate
```

## 🔄 Payment Flow

The complete payment flow implemented in `PaymentOrchestratorService`:

1. **Merchant calls** `POST /api/v1/payments/initiate`
2. **Idempotency check** - Validates idempotency key
3. **Create PaymentIntent** - Status: `CREATED`
4. **Risk checks** - Evaluates risk rules
5. **Gateway selection** - Routes to best gateway based on success rate
6. **Initiate payment** - Calls gateway adapter
7. **Store PaymentAttempt** - Records attempt details
8. **Await webhook** - Gateway sends webhook
9. **Process webhook** - Verify signature, normalize payload
10. **Update PaymentIntent** - Update status based on webhook
11. **Notify merchant** - Send webhook to merchant

## 🏛️ Module Overview

### AuthModule
- API key-based authentication
- Merchant context enrichment
- Request validation

### MerchantModule
- Merchant entity management
- KYC status tracking
- Tier management (Basic/Pro/Enterprise)
- Gateway configuration management

### PaymentsModule
- PaymentIntent lifecycle
- PaymentAttempt tracking
- Idempotency key management
- Immutable state transitions

### OrchestrationModule
- Coordinates full payment lifecycle
- No business logic in controllers
- Orchestrates all domain services

### RoutingModule
- Gateway selection engine
- Success rate-based routing
- Pluggable routing strategies
- Cost optimization (TODO)

### GatewayModule
- Gateway adapter pattern
- Razorpay adapter (implemented)
- Stripe adapter (implemented)
- Easy to add new gateways

### RiskModule
- Risk evaluation engine
- Pluggable risk rules
- Can block payments pre-initiation

### WebhookModule
- Webhook signature verification
- Payload normalization
- Idempotent webhook handling
- Event processing

### RetryModule
- Automatic retry logic
- Exponential backoff
- Failover to alternative gateways

### LedgerModule (MVP Stub)
- **No-op implementation** - Funds flow directly Gateway → Merchant
- Clearly marked for aggregator upgrade
- TODO: Implement double-entry bookkeeping when upgrading

### NotificationModule
- Merchant webhook notifications
- Async delivery
- Retry on failure

### AdminModule
- Internal admin APIs
- Gateway health monitoring
- Merchant statistics
- System metrics

## 🗄️ Database Schema

### Core Entities

- **Merchant** - Merchant accounts with KYC and tier
- **MerchantGatewayConfig** - Gateway configurations per merchant
- **PaymentIntent** - Payment requests
- **PaymentAttempt** - Individual gateway attempts
- **PaymentStateTransition** - Immutable state change history
- **IdempotencyKey** - Idempotency key tracking
- **WebhookEvent** - Incoming webhook events

All entities use:
- UUID primary keys
- Auditable timestamps (`createdAt`, `updatedAt`)
- Proper indexing for performance

## 🔐 Security

- API key authentication with SHA-256 hashing
- Webhook signature verification
- Input validation with class-validator
- SQL injection protection via TypeORM
- Request rate limiting (TODO: Add rate limiter)

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📝 Code Quality

- TypeScript strict mode enabled
- ESLint for code linting
- Prettier for code formatting
- Structured logging with Winston
- Global exception filters

## 🚧 Future Enhancements

### Payment Aggregator Upgrade Path

The following features are marked with TODO comments for future implementation:

1. **LedgerModule**
   - Double-entry bookkeeping
   - Escrow balance tracking
   - Settlement and payout logic

2. **Settlement Module** (New)
   - Automated settlements
   - Payout scheduling
   - Reconciliation

3. **Escrow Management** (New)
   - Hold funds in escrow
   - Release on conditions
   - Dispute handling

### Other Enhancements

- [ ] Job queue integration (Bull/BullMQ) for async processing
- [ ] Rate limiting middleware
- [ ] GraphQL API (optional)
- [ ] Multi-currency support enhancements
- [ ] Advanced analytics and reporting
- [ ] Real-time payment status updates (WebSockets)

## 📄 License

UNLICENSED - Proprietary software owned by Ethics Fintech

## 👥 Contributing

This is a proprietary project. For contributions, please contact the development team.

## 🆘 Support

For issues and questions, please contact the development team or create an issue in the repository.

---

**Built with ❤️ by Ethics Fintech**

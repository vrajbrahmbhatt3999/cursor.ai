# Quick Start Guide

## Prerequisites Setup

1. **Install Node.js** (LTS version recommended)
   ```bash
   node --version  # Should be v18.x or v20.x
   ```

2. **Install PostgreSQL**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   
   # macOS
   brew install postgresql
   ```

3. **Install Redis**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install redis-server
   
   # macOS
   brew install redis
   ```

## Installation Steps

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database and Redis credentials
   ```

3. **Create database**
   ```bash
   createdb ethics_pay
   # Or using psql:
   # psql -U postgres -c "CREATE DATABASE ethics_pay;"
   ```

4. **Run database migrations** (when TypeORM migrations are generated)
   ```bash
   npm run migration:run
   ```

   For development, you can temporarily enable `DB_SYNCHRONIZE=true` in `.env` to auto-sync schema.

5. **Start Redis**
   ```bash
   redis-server
   ```

6. **Start the application**
   ```bash
   # Development mode
   npm run start:dev
   
   # The API will be available at http://localhost:3000
   # Swagger docs at http://localhost:3000/api/docs
   ```

## Creating Your First Merchant

You'll need to create a merchant in the database. Here's a sample SQL script:

```sql
INSERT INTO merchants (
  id,
  name,
  email,
  phone,
  "apiKey",
  "apiKeyHash",
  tier,
  "kycStatus",
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'Test Merchant',
  'merchant@example.com',
  '+1234567890',
  'test_api_key_12345',
  encode(digest('test_api_key_12345', 'sha256'), 'hex'),
  'BASIC',
  'VERIFIED',
  true,
  NOW(),
  NOW()
);
```

Or use a script to generate the hash:

```bash
node -e "const crypto = require('crypto'); console.log(crypto.createHash('sha256').update('your-api-key').digest('hex'));"
```

## Testing the API

1. **Health Check**
   ```bash
   curl http://localhost:3000/api/health
   ```

2. **Initiate Payment** (replace `your-api-key` with actual key)
   ```bash
   curl -X POST http://localhost:3000/api/v1/payments/initiate \
     -H "Content-Type: application/json" \
     -H "X-API-Key: your-api-key" \
     -d '{
       "idempotencyKey": "req_123456",
       "orderId": "order_001",
       "amount": 1000.50,
       "currency": "INR",
       "paymentMethod": "CARD",
       "customerEmail": "customer@example.com"
     }'
   ```

3. **Get Payment Status**
   ```bash
   curl http://localhost:3000/api/v1/payments/{payment-intent-id} \
     -H "X-API-Key: your-api-key"
   ```

## Common Issues

### Database Connection Error
- Ensure PostgreSQL is running: `sudo systemctl status postgresql`
- Check credentials in `.env`
- Verify database exists: `psql -U postgres -l | grep ethics_pay`

### Redis Connection Error
- Ensure Redis is running: `redis-cli ping` (should return PONG)
- Check Redis host/port in `.env`

### Module Not Found Errors
- Run `npm install` again
- Delete `node_modules` and `package-lock.json`, then reinstall

### TypeORM Migration Issues
- For development, set `DB_SYNCHRONIZE=true` in `.env`
- For production, always use migrations

## Next Steps

1. Configure gateway credentials (Razorpay, Stripe) in `.env`
2. Set up merchant gateway configurations
3. Configure webhook endpoints
4. Review and customize risk rules
5. Set up monitoring and alerting

For detailed documentation, see [README.md](./README.md).

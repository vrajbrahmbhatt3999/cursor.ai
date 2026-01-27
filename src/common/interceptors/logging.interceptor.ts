import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: Logger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query, params } = request;
    const requestId = request.id || 'unknown';
    const now = Date.now();

    this.logger.log(
      `Incoming Request: ${method} ${url} [${requestId}]`,
      'LoggingInterceptor',
    );

    if (Object.keys(body || {}).length > 0) {
      this.logger.debug(
        `Request Body: ${JSON.stringify(body)}`,
        'LoggingInterceptor',
      );
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const duration = Date.now() - now;

          this.logger.log(
            `Outgoing Response: ${method} ${url} ${statusCode} - ${duration}ms [${requestId}]`,
            'LoggingInterceptor',
          );
        },
        error: (error) => {
          const duration = Date.now() - now;
          this.logger.error(
            `Request Failed: ${method} ${url} - ${duration}ms [${requestId}]`,
            error.stack,
            'LoggingInterceptor',
          );
        },
      }),
    );
  }
}

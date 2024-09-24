import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable, tap } from 'rxjs';

@Injectable()
export class DebugInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DebugInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();
    const now = Date.now();
    const url = req.url;
    const method = req.method;

    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse();
        const statusCode = res.statusCode;
        const delay = Date.now() - now;

        this.logger.debug(`${method} ${statusCode} ${url} ${delay}ms`);
      }),
      catchError((err) => {
        const delay = Date.now() - now;
        const statusCode = err.response?.statusCode ? err.response.statusCode : HttpStatus.INTERNAL_SERVER_ERROR;
        const errorMessage = err.response?.message ? err.response.message : InternalServerErrorException.name;
        const errorName = err.name ? err.name : InternalServerErrorException.name;
        this.logger.warn(`${method} ${url} ${statusCode} ${delay}ms - ${errorName}: ${errorMessage}`);

        throw err;
      }),
    );
  }
}

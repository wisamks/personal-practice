import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { UncaughtException } from '../custom-error.util';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost): void {
    const req = host.switchToHttp().getRequest();
    const res = host.switchToHttp().getResponse();

    let message: string;
    let statusCode: number;
    const filteredException =
      exception instanceof HttpException && exception.getStatus() ? exception : new UncaughtException();
    const exceptionResponse = filteredException.getResponse() as {
      message: string;
      statusCode: number;
    };

    if (!exceptionResponse.message || exceptionResponse.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception);
      message = '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    } else {
      message = exceptionResponse.message;
      statusCode = exceptionResponse.statusCode;
    }

    return res.status(statusCode).json({
      message,
      statusCode,
      timestamp: new Date(),
      path: req.url,
    });
  }
}

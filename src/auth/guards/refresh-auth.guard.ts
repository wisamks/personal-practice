import { AuthUnauthorizedException } from '@_/common/custom-error.util';
import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class RefreshAuthGuard extends AuthGuard('refresh') {
  private readonly logger = new Logger(RefreshAuthGuard.name);

  handleRequest<TUser = any>(err: any, user: any, info: any, context: ExecutionContext, status?: any): TUser {
    if (err) {
      throw err;
    }    
    if (!user) {
      throw new AuthUnauthorizedException();
    }
    return user;
  }
}

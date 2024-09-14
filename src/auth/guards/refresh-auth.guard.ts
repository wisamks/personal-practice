import { AuthUnauthorizedException } from "@_/common/custom-error.util";
import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class RefreshAuthGuard extends AuthGuard('refresh') {
    handleRequest<TUser = any>(err: any, user: any, info: any, context: ExecutionContext, status?: any): TUser {
        if (err || !user) {
            throw new AuthUnauthorizedException();
        }
        return user;
    }
}
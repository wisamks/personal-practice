import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { UNAUTHORIZED_ERROR_MESSAGE } from "../constants/auth.constants";

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    handleRequest<TUser = any>(err: any, user: any, info: any, context: ExecutionContext, status?: any): TUser {
        if (err || !user) {
            throw new UnauthorizedException(UNAUTHORIZED_ERROR_MESSAGE);
        }
        return user;
    }
}
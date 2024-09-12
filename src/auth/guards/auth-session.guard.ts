import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";
import { Observable } from "rxjs";
import { UNAUTHORIZED_ERROR_MESSAGE } from "../constants/auth.constants";

@Injectable()
export class SessionAuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const req = context.switchToHttp().getRequest() as Request;
        const checkLogin = req.isAuthenticated();
        console.log(checkLogin);
        if (!checkLogin) {
            throw new UnauthorizedException(UNAUTHORIZED_ERROR_MESSAGE);
        }
        return checkLogin;
    }
}
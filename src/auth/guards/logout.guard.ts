import { CanActivate, ExecutionContext, Injectable, InternalServerErrorException } from "@nestjs/common";
import { Observable } from "rxjs";

@Injectable()
export class LogOutGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const req = context.switchToHttp().getRequest();

        req.logout((err) => {
            if (err) {
                throw new InternalServerErrorException(err.message);
            }
            return;
        });

        return true;
    }
}
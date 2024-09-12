import { Injectable, Logger } from "@nestjs/common";
import { PassportSerializer } from "@nestjs/passport";
import { UserService } from "@_/user/user.service";

@Injectable()
export class SessionSerializer extends PassportSerializer {
    private readonly logger = new Logger('SessionSerializer');

    constructor(
        private readonly userService: UserService
    ) {
        super();
    }

    async serializeUser(user: any, done: Function): Promise<void> {
        return done(null, user);
    }

    async deserializeUser(payload: any, done: Function): Promise<void> {
        const foundUser = await this.userService.getUser(payload.userId);
        return done(null, foundUser);
    }
}
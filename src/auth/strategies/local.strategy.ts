import { Injectable, Logger } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { AuthService } from "../auth.service";
import { ValidateUserOutputType } from "../types/validate-user.output";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
    private readonly logger = new Logger('LocalStrategy');

    constructor(
        private readonly authService: AuthService,
    ) {
        super({
            usernameField: 'email',
            passwordField: 'password',
        });
    }

    async validate(email: string, password: string): Promise<ValidateUserOutputType> {
        return await this.authService.validateUser({ email, password });
    }
}
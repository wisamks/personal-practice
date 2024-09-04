import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { jwtConfig } from "@_/config/secret.config";
import { Request } from "express";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            secretOrKey: jwtConfig.accessSecret,
            jwtFromRequest: ExtractJwt.fromExtractors([(req: Request) => {
                const { accessToken } = req.cookies;
                return accessToken ? accessToken : null;
            }])
        })
    }

    async validate(payload: any) {
        return { userId: payload.userId };
    }
}
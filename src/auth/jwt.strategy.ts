import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Request } from "express";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            secretOrKey: process.env.JWT_ACCESS_TOKEN_SECRET,
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
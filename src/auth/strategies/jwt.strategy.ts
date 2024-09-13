import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Request } from "express";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly configService: ConfigService,
    ) {
        super({
            secretOrKey: configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
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
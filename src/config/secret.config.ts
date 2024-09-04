import * as dotenv from 'dotenv';
dotenv.config();

export const jwtConfig = {
    accessSecret: process.env.JWT_ACCESS_TOKEN_SECRET,
    refreshSecret: process.env.JWT_REFRESH_TOKEN_SECRET,
    accessExpire: '1h',
}

export const serverConfig = {
    port: process.env.SERVER_PORT
}
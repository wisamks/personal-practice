export const SIGN_IN_ERROR_MESSAGE = '이메일 또는 비밀번호가 일치하지 않습니다.';

export const AUTH_CONTROLLER = 'AuthController';
export const AUTH_SERVICE = 'AuthService';
export const GOOGLE_STRATEGY = 'GoogleStrategy';

export const PASSPORT_MODULE_OPTION = {
    defaultStrategy: 'jwt',
};
export const COOKIE_ACCESS_TOKEN_NAME = 'accessToken';
export const COOKIE_REFRESH_TOKEN_NAME = 'refreshToken';

export const ONE_HOUR_BY_MS = 60 * 60 * 1000;
export const ONE_WEEK_BY_MS = ONE_HOUR_BY_MS * 24 * 7;

export const OAUTH_GOOGLE_SCOPE = {
    EMAIL: 'email',
    PROFILE: 'profile',
    OPEN_ID: 'openID',
};
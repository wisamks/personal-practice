export const SIGN_IN_ERROR_MESSAGE = '이메일 또는 비밀번호가 일치하지 않습니다.';

export const PASSPORT_MODULE_OPTION = {
    JWT: 'jwt',
};

export const COOKIE_OPTIONS = {
    ACCESS_TOKEN: 'accessToken',
    REFRESH_TOKEN: 'refreshToken',
    ONE_HOUR_BY_MS: 60 * 60 * 1000,
    ONE_WEEK_BY_MS: 60 * 60 * 1000 * 24 * 7,
};


export const OAUTH_GOOGLE_SCOPE = {
    EMAIL: 'email',
    PROFILE: 'profile',
    OPEN_ID: 'openID',
};

export const AUTH_GUARD_STRATEGY = {
    GOOGLE: 'google',
    NAVER: 'naver',
    KAKAO: 'kakao',
};
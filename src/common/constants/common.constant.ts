export const INTERNAL_SERVER_ERROR_MESSAGE = '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';

export const PATH_API = '/api';

const PATH_POST_PREFIX = '/posts/:postId';

export const PATH_CLIENT = {
  DEV: 'http://localhost:3000',
};

export const PATH_ROUTES = {
  AUTH: '/auth',
  POST: '/posts',
  USER: '/users',
  COMMENT: PATH_POST_PREFIX + '/comments',
  POST_LIKE: PATH_POST_PREFIX + '/likes',
};

export const PATH_AUTH = {
  KAKAO: '/kakao',
  KAKAO_CALLBACK: '/kakao/callback',
  NAVER: '/naver',
  NAVER_CALLBACK: '/naver/callback',
  GOOGLE: '/google',
  GOOGLE_CALLBACK: '/google/callback',
  PROFILE: '/profile',
  LOGIN: '/login',
  LOGOUT: '/logout',
  SIGN_IN: '/sign-in',
  SIGN_OUT: '/sign-out',
  SIGN_UP: '/sign-up',
  REFRESH: '/refresh',
};

export const PATH_COMMENT = {
  COMMENT_ID: '/:commentId',
};

export const PATH_POST = {
  CURSOR: '/cursor',
  POST_ID: '/:postId',
};

export const PATH_USER = {
  SIGN_UP: '/sign-up',
  USER_ID: '/:userId',
};

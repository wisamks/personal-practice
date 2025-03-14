import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

// --- enum ---

enum RepostioryExceptionMessage {
  BAD_GATEWAY = 'DB 통신에서 장애가 발생했습니다.',
  SERVICE_UNAVAILABLE = 'DB 연결이 불안정합니다. 잠시 후 다시 시도해주세요.',
}

enum AuthExceptionMessage {
  BAD_REQUEST = '아이디나 비밀번호가 일치하지 않습니다.',
  UNAUTHORIZED = '로그인이 필요합니다.',
  FORBIDDEN = '접속 권한이 없습니다. 다시 로그인 해주세요.',
  NOT_FOUND = '존재하지 않는 유저입니다.',
  JWT_UNEXPECTED = 'jwt 생성 중 오류가 발생했습니다.',
  SERVICE_UNAVAILABLE = '사용자 정보를 불러오는 데 실패했습니다. 잠시 후 시도하거나 다른 방법으로 로그인 해주세요.',
}

enum UserExceptionMessage {
  CONFILCT_EMAIL = '이미 사용 중인 이메일입니다. 다른 이메일로 가입을 시도해주세요.',
  NOT_FOUND = '존재하지 않는 유저입니다.',
  INTERNAL_SERVER_ERROR = '유저 관련 작업 중 알 수 없는 오류가 발생했습니다.',
}

enum PostExceptionMessage {
  FORBIDDEN = '접근 권한이 없습니다.',
  NOT_FOUND = '존재하지 않는 게시글입니다.',
  INTERNAL_SERVER_ERROR = '게시글 관련 작업 중 알 수 없는 오류가 발생했습니다.',
}

enum CommentExceptionMessage {
  FORBIDDEN = '접근 권한이 없습니다.',
  NOT_FOUND = '존재하지 않는 댓글입니다.',
  INTERNAL_SERVER_ERROR = '댓글 관련 작업 중 알 수 없는 오류가 발생했습니다.',
}

enum UncaughtExceptionMessage {
  UNCAUGHT = '정의되지 않은 예외입니다.',
}

// --- repository ---

export class RepositoryBadGatewayException extends BadGatewayException {
  constructor(message?: string) {
    super({
      statusCode: HttpStatus.BAD_GATEWAY,
      message: (message = RepostioryExceptionMessage.BAD_GATEWAY),
    });
  }
}

export class RepositoryServiceUnavailableException extends ServiceUnavailableException {
  constructor(message?: string) {
    super({
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      message: (message = RepostioryExceptionMessage.SERVICE_UNAVAILABLE),
    });
  }
}

// --- auth ---

export class AuthBadRequestException extends BadRequestException {
  constructor() {
    super({
      statusCode: HttpStatus.BAD_REQUEST,
      message: AuthExceptionMessage.BAD_REQUEST,
    });
  }
}

export class AuthNotFoundException extends NotFoundException {
  constructor() {
    super({
      statusCode: HttpStatus.NOT_FOUND,
      message: AuthExceptionMessage.NOT_FOUND,
    });
  }
}

export class AuthJwtException extends InternalServerErrorException {
  constructor(message?: string) {
    super({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: (message = AuthExceptionMessage.JWT_UNEXPECTED),
    });
  }
}

// --- auth strategy ---

export class AuthForbiddenException extends ForbiddenException {
  constructor() {
    super({
      statusCode: HttpStatus.FORBIDDEN,
      message: AuthExceptionMessage.FORBIDDEN,
    });
  }
}

export class AuthServiceUnavailableException extends ServiceUnavailableException {
  constructor() {
    super({
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      message: AuthExceptionMessage.SERVICE_UNAVAILABLE,
    });
  }
}

// --- auth guard ---

export class AuthUnauthorizedException extends UnauthorizedException {
  constructor() {
    super({
      statusCode: HttpStatus.UNAUTHORIZED,
      message: AuthExceptionMessage.UNAUTHORIZED,
    });
  }
}

// --- user ---

export class UserNotFoundException extends NotFoundException {
  constructor() {
    super({
      statusCode: HttpStatus.NOT_FOUND,
      message: UserExceptionMessage.NOT_FOUND,
    });
  }
}

export class UserConflictEmailException extends ConflictException {
  constructor() {
    super({
      statusCode: HttpStatus.CONFLICT,
      message: UserExceptionMessage.CONFILCT_EMAIL,
    });
  }
}

export class UserInternalServerErrorException extends InternalServerErrorException {
  constructor() {
    super({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: UserExceptionMessage.INTERNAL_SERVER_ERROR,
    });
  }
}

// --- post ---

export class PostForbiddenException extends ForbiddenException {
  constructor() {
    super({
      statusCode: HttpStatus.FORBIDDEN,
      message: PostExceptionMessage.FORBIDDEN,
    });
  }
}

export class PostNotFoundException extends NotFoundException {
  constructor() {
    super({
      statusCode: HttpStatus.NOT_FOUND,
      message: PostExceptionMessage.NOT_FOUND,
    });
  }
}

export class PostInternalServerErrorException extends InternalServerErrorException {
  constructor() {
    super({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: PostExceptionMessage.INTERNAL_SERVER_ERROR,
    });
  }
}

// --- comment ---

export class CommentForbiddenException extends ForbiddenException {
  constructor() {
    super({
      statusCode: HttpStatus.FORBIDDEN,
      message: CommentExceptionMessage.FORBIDDEN,
    });
  }
}

export class CommentNotFoundException extends NotFoundException {
  constructor() {
    super({
      statusCode: HttpStatus.NOT_FOUND,
      message: CommentExceptionMessage.NOT_FOUND,
    });
  }
}

export class CommentInternalServerErrorException extends InternalServerErrorException {
  constructor() {
    super({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: CommentExceptionMessage.INTERNAL_SERVER_ERROR,
    });
  }
}

// --- uncaught ---

export class UncaughtException extends InternalServerErrorException {
  constructor(message?: string) {
    super({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: (message = UncaughtExceptionMessage.UNCAUGHT),
    });
  }
}

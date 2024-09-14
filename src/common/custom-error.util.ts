import { HttpException, HttpStatus } from "@nestjs/common";

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
}

enum PostExceptionMessage {
    FORBIDDEN = '접근 권한이 없습니다.',
    NOT_FOUND = '존재하지 않는 게시글입니다.',
}

enum CommentExceptionMessage {
    FORBIDDEN = '접근 권한이 없습니다.',
    NOT_FOUND = '존재하지 않는 댓글입니다.',
}

// --- definition ---

interface IBaseException {
    readonly timestamp: Date;
    readonly message: string;
    readonly statusCode: number;
    readonly path: string;
}

abstract class BaseException extends HttpException implements IBaseException {
    constructor(
        message: string,
        statusCode: number
    ) {
        super(message, statusCode);
    }
    statusCode: number;
    message: string;
    timestamp: Date;
    path: string;
}

// --- repository ---

export class RepositoryBadGatewayException extends BaseException {
    constructor(message?: string) {
        super(message = RepostioryExceptionMessage.BAD_GATEWAY, HttpStatus.BAD_GATEWAY);
    }
}

export class RepositoryServiceUnavailableException extends BaseException {
    constructor(message?: string) {
        super(message = RepostioryExceptionMessage.SERVICE_UNAVAILABLE, HttpStatus.SERVICE_UNAVAILABLE);
    }
}

// --- auth ---

export class AuthBadRequestException extends BaseException {
    constructor() {
        super(AuthExceptionMessage.BAD_REQUEST, HttpStatus.BAD_REQUEST)
    }
}

export class AuthNotFoundException extends BaseException {
    constructor() {
        super(AuthExceptionMessage.NOT_FOUND, HttpStatus.NOT_FOUND)
    }
}

export class AuthJwtException extends BaseException {
    constructor(message?: string) {
        super(message = AuthExceptionMessage.JWT_UNEXPECTED, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

// --- auth strategy ---

export class AuthForbiddenException extends BaseException {
    constructor() {
        super(AuthExceptionMessage.FORBIDDEN, HttpStatus.FORBIDDEN);
    }
}

export class AuthServiceUnavailableException extends BaseException {
    constructor() {
        super(AuthExceptionMessage.SERVICE_UNAVAILABLE, HttpStatus.SERVICE_UNAVAILABLE);
    }
}

// --- auth guard ---

export class AuthUnauthorizedException extends BaseException {
    constructor() {
        super(AuthExceptionMessage.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
    }
}

// --- user ---

export class UserNotFoundException extends BaseException {
    constructor() {
        super(UserExceptionMessage.NOT_FOUND, HttpStatus.NOT_FOUND);
    }
}

export class UserConflictEmailException extends BaseException {
    constructor() {
        super(UserExceptionMessage.CONFILCT_EMAIL, HttpStatus.CONFLICT);
    }
}

// --- post ---

export class PostForbiddenException extends BaseException {
    constructor() {
        super(PostExceptionMessage.FORBIDDEN, HttpStatus.FORBIDDEN);
    }
}

export class PostNotFoundException extends BaseException {
    constructor() {
        super(PostExceptionMessage.NOT_FOUND, HttpStatus.NOT_FOUND);
    }
}

// --- comment ---

export class CommentForbiddenException extends BaseException {
    constructor() {
        super(CommentExceptionMessage.FORBIDDEN, HttpStatus.FORBIDDEN);
    }
}

export class CommentNotFoundException extends BaseException {
    constructor() {
        super(CommentExceptionMessage.NOT_FOUND, HttpStatus.NOT_FOUND);
    }
}
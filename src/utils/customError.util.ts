abstract class CustomError extends Error {
    protected statusCode: number;
    public name: string;

    constructor(message: string, statusCode: number, name: string) {
        super(message);
        this.statusCode = statusCode;
        this.name = name;
    }
}

export class BadRequestException extends CustomError {
    constructor(message = '잘못된 요청입니다.') {
        super(message, 400, 'Bad Request')
    }
}

export class UnauthorizedException extends CustomError {
    constructor(message = '로그인이 필요합니다.') {
        super(message, 401, 'Unauthenticated')
    }
}

export class ForbiddenException extends CustomError {
    constructor(message = '잘못된 접근입니다.') {
        super(message, 403, 'Forbidden')
    }
}

export class NotFoundException extends CustomError {
    constructor(message = '존재하지 않는 정보입니다.') {
        super(message, 404, 'Not Found')
    }
}

export class ConflictException extends CustomError {
    constructor(message = '이미 존재하는 정보입니다.') {
        super(message, 409, 'Conflict')
    }
}

export class InternalServerErrorException extends CustomError {
    constructor(message = '서버에 문제가 발생했습니다.') {
        super(message, 500, 'Internal Server Error')
    }
}
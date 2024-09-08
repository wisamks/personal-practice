import { Injectable, Logger } from '@nestjs/common';
import { CommentRepository } from './comment.repository';
import { COMMENT_SERVICE } from './constants/comment.constant';

@Injectable()
export class CommentService {
    private readonly logger = new Logger(COMMENT_SERVICE);

    constructor(
        private readonly commentRepository: CommentRepository,
    ) {}

    async createComment() {}
}

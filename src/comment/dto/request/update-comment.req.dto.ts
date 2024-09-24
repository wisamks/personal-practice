import { PartialType } from '@nestjs/mapped-types';
import { CreateCommentReqDto } from './create-comment.req.dto';

export class UpdateCommentReqDto extends PartialType(CreateCommentReqDto) {}

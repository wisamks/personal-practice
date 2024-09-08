import { Expose } from "class-transformer";

export class CreateCommentResDto {
    @Expose({ name: 'id' })
    commentId: number;
}
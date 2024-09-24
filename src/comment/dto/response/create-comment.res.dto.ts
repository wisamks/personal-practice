import { Exclude, Expose } from 'class-transformer';

export class CreateCommentResDto {
  @Expose({ name: 'id' })
  commentId: number;

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;
  
  @Exclude()
  deletedAt: Date;

  @Exclude()
  content: string;

  @Exclude()
  authorId: number;

  @Exclude()
  postId: number;
}

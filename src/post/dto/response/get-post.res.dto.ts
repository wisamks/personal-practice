import { GetCommentResDto } from '@_/comment/dto/response/get-comment.res.dto';
import { IGetCountsRes } from '@_/post/types/get-counts.res.interface';
import { GetUserResDto } from '@_/user/dto/response/get-user.res.dto';
import { Exclude, Expose, plainToInstance, Transform } from 'class-transformer';

export class GetPostResDto {
  @Expose({ name: 'id' })
  postId: number;

  title: string;

  content: string;

  @Transform(({ value }) => plainToInstance(GetUserResDto, value))
  author: GetUserResDto;

  @Exclude()
  authorId: number;

  createdAt: Date;

  updatedAt: Date;

  @Exclude()
  deletedAt: Date;

  tags: string[];

  @Transform(({ value }) => plainToInstance(GetCommentResDto, value))
  comments: GetCommentResDto[];

  counts: IGetCountsRes;
}

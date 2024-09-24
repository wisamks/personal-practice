import { GetUserResDto } from '@_/user/dto/response/get-user.res.dto';
import { Exclude, Expose, plainToInstance, Transform } from 'class-transformer';

export class GetCommentResDto {
  @Expose({ name: 'id' })
  readonly commentId: number;

  @Transform(({ value }) => plainToInstance(GetUserResDto, value))
  readonly author: GetUserResDto;

  @Exclude()
  readonly authorId: number;

  @Exclude()
  readonly postId: number;

  readonly content: string;

  readonly createdAt: Date;

  readonly updatedAt: Date;

  @Exclude()
  readonly deletedAt: Date;
}

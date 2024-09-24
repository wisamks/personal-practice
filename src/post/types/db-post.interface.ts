import { IDbTag } from '@_/tag/types/db-tag.interface';
import { Comment, Post, PostTag, User } from '@prisma/client';

export interface IDbPost extends Post {
  readonly author?: User;
  readonly tags?: IDbTag[];
  readonly comments?: Comment[];
}

import { CreatePostReqDto } from '../dto/request/create-post.req.dto';

export interface ICreatePostReq extends Omit<CreatePostReqDto, 'tags'> {
  authorId: number;
}

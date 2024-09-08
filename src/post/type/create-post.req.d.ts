import { CreatePostReqDto } from "../dto/request/create-post.req.dto";

export interface CreatePostReqType extends Omit<CreatePostReqDto, 'tags'> {
    authorId: number;
}
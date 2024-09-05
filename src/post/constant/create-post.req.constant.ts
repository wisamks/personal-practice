import { CreatePostReqDto } from "../dto/create-post.req.dto";

export interface CreatePostReqType extends Omit<CreatePostReqDto, 'tags'> {
    authorId: number;
}
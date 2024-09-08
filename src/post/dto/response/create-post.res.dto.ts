import { PickType } from "@nestjs/mapped-types";
import { GetPostResDto } from "./get-post.res.dto";

export class CreatePostResDto extends PickType(GetPostResDto, ['postId']) {}
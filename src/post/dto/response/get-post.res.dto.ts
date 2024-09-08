import { GetTagResDto } from "@_/tag/dto/get-tag.res.dto";
import { Tag } from "@_/tag/tag.entity";
import { GetUserResDto } from "@_/user/dto/get-user.res.dto";
import { Exclude, Expose, plainToInstance, Transform } from "class-transformer";

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
}
import { GetUserResDto } from "@_/user/dto/response/get-user.res.dto";
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
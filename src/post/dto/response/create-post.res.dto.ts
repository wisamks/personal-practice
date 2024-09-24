import { PickType } from '@nestjs/mapped-types';
import { GetPostResDto } from './get-post.res.dto';
import { Exclude } from 'class-transformer';

export class CreatePostResDto extends PickType(GetPostResDto, ['postId']) {
    @Exclude()
    readonly createdAt: Date;

    @Exclude()
    readonly updatedAt: Date;

    @Exclude()
    readonly deletedAt: Date;

    @Exclude()
    readonly title: string;

    @Exclude()
    readonly content: string;

    @Exclude()
    readonly authorId: number;
}

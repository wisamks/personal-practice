import { Exclude, Expose } from "class-transformer";

export class GetTagResDto {
    @Expose({ name: 'id' })
    readonly tagId: number

    readonly name: string;

    @Exclude()
    readonly postId: number;
}
import { IGetUserRes } from "@_/user/types/get-user.res.interface";

export interface IGetCommentRes {
    readonly commentId: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly content: string;
    readonly author: IGetUserRes;
}
import { GetUserResType } from "@_/user/types/get-user.res";

export interface GetCommentResType {
    readonly commentId: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly content: string;
    readonly author: GetUserResType;
}
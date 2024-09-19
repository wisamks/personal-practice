import { PostTag, Tag } from "@prisma/client";

export interface IDbTag extends PostTag {
    readonly tag?: Tag;
}
export interface IGetCommentsInput {
    take: number;
    cursor?: number;
    postId: number;
}
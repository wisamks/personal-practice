import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { Post } from "./post.entity";
import { CreatePostReqType } from "./constant/create-post.req.constant";
import { GetPostsReqDto } from "./dto/get-posts.req.dto";
import { UpdatePostReqType } from "./constant/update-post.req.constant";

@Injectable()
export class PostRepository extends Repository<Post> {
    private readonly logger = new Logger('PostRepository');

    constructor(
        private readonly dataSource: DataSource,
    ) {
        super(Post, dataSource.createEntityManager())
    }

    async getPosts({ skip, take }: GetPostsReqDto): Promise<Post[]> {
        try {
            const foundPosts = await this.find({
                order: {
                    createdAt: 'desc'
                },
                skip,
                take,
            });
            return foundPosts;
        } catch(err) {
            this.logger.error(err);
            throw new InternalServerErrorException(err.message);
        }
    }

    async getPost(postId: number): Promise<Post> {
        const where = {
            id: postId,
        };
        try {
            return await this.findOne({ where });
        } catch(err) {
            this.logger.error(err);
            throw new InternalServerErrorException(err.message);
        }
    }

    async createPost(data: CreatePostReqType): Promise<Pick<Post, 'id'>> {
        try {
            const created = await this.insert(data);
            const createdPost = created.identifiers[0] as Pick<Post, 'id'>;
            return createdPost;
        } catch(err) {
            this.logger.error(err);
            throw new InternalServerErrorException(err.message);
        }
    }

    async updatePost({data, postId}: {
        data: UpdatePostReqType;
        postId: number;
    }): Promise<void> {
        try {
            await this.update(postId, data);
            return;
        } catch(err) {
            this.logger.error(err);
            throw new InternalServerErrorException(err.messsage);
        }
    }

    async deletePost(postId: number): Promise<void> {
        try {
            await this.softDelete(postId);
            return;
        } catch(err) {
            this.logger.error(err);
            throw new InternalServerErrorException(err.message);
        }
    }
}
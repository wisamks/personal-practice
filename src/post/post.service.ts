import { ForbiddenException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { PostRepository } from './post.repository';
import { CreatePostReqDto } from './dto/create-post.req.dto';
import { DataSource } from 'typeorm';
import { TagService } from '@_/tag/tag.service';
import { plainToInstance } from 'class-transformer';
import { CreatePostResDto } from './dto/create-post.res.dto';
import { GetPostResDto } from './dto/get-post.res.dto';
import { GetPostsReqDto } from './dto/get-posts.req.dto';
import { UpdatePostReqDto } from './dto/update-post.req.dto';

@Injectable()
export class PostService {
    private readonly logger = new Logger('PostService');

    constructor(
        private readonly postRepository: PostRepository,
        private readonly tagService: TagService,
        private readonly dataSource: DataSource,
    ) {}

    async getPosts(getPostsReqDto: GetPostsReqDto): Promise<GetPostResDto[]> {
        const foundPosts = await this.postRepository.getPosts(getPostsReqDto);
        return foundPosts.map(foundPost => plainToInstance(GetPostResDto, foundPost));
    }

    async getPost({ postId, userId }: {
        postId: number,
        userId: number,
    }): Promise<GetPostResDto> {
        const foundPost = await this.postRepository.getPost(postId);
        return plainToInstance(GetPostResDto, foundPost);
    }

    async createPost({createPostReqDto, userId}: {
        createPostReqDto: CreatePostReqDto;
        userId: number;
    }): Promise<CreatePostResDto> {
        const { title, content, tags } = createPostReqDto;
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const createdPost = await this.postRepository.createPost({ title, content, authorId: userId });
            if (tags && createdPost) {
                const postTags = tags.map(tag => ({
                    name: tag,
                    postId: createdPost.id
                }))
                await this.tagService.createTags(postTags);
            }
            return plainToInstance(CreatePostResDto, createdPost);
        } catch(err) {
            await queryRunner.rollbackTransaction();
            throw new InternalServerErrorException(err.message);
        } finally {
            await queryRunner.release();
        }
    }

    async updatePost({ updatePostReqDto, postId, userId }: {
        updatePostReqDto: UpdatePostReqDto;
        postId: number;
        userId: number;
    }): Promise<void> {
        const { title, content, tags } = updatePostReqDto;
        const foundPost = await this.postRepository.getPost(postId);
        if (!foundPost) {
            throw new NotFoundException('존재하지 않는 게시글입니다.');
        }
        if (foundPost.authorId !== userId) {
            throw new ForbiddenException('권한이 없습니다.');
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            await this.postRepository.updatePost({ data: { title, content }, postId });
            if (tags) {

            }
            return;
        } catch(err) {
            await queryRunner.rollbackTransaction();
            throw new InternalServerErrorException(err.message);
        } finally {
            await queryRunner.release();
        }
    }

    async deletePost({ postId, userId }: {
        postId: number;
        userId: number;
    }): Promise<void> {
        const foundPost = await this.postRepository.getPost(postId);
        if (!foundPost) {
            throw new NotFoundException('존재하지 않는 게시글입니다.');
        }
        if (foundPost.authorId !== userId) {
            throw new ForbiddenException('권한이 없습니다.');
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            await this.postRepository.deletePost(postId);  
            await this.tagService.deleteTags(postId);
            return; 
        } catch(err) {
            await queryRunner.rollbackTransaction();
            throw new InternalServerErrorException(err.message);
        } finally {
            await queryRunner.release();
        }
    }
}

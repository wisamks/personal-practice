import { ForbiddenException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { PostRepository } from './post.repository';
import { CreatePostReqDto } from './dto/create-post.req.dto';
import { TagService } from '@_/tag/tag.service';
import { plainToInstance } from 'class-transformer';
import { CreatePostResDto } from './dto/create-post.res.dto';
import { GetPostResDto } from './dto/get-post.res.dto';
import { GetPostsReqDto } from './dto/get-posts.req.dto';
import { UpdatePostReqDto } from './dto/update-post.req.dto';
import { PrismaService } from '@_/prisma/prisma.service';

@Injectable()
export class PostService {
    private readonly logger = new Logger('PostService');

    constructor(
        private readonly postRepository: PostRepository,
        private readonly tagService: TagService,
        private readonly prismaService: PrismaService,
    ) {}

    async getPosts(getPostsReqDto: GetPostsReqDto): Promise<GetPostResDto[]> {
        const foundPosts = await this.postRepository.getPosts(getPostsReqDto);
        const result = [];
        for (const foundPost of foundPosts) {
            const foundTags = await this.tagService.getTagsByPostId(foundPost.id);
            result.push(plainToInstance(GetPostResDto, { ...foundPost, tags: foundTags }))
        }
        return result;
    }

    async getPost({ postId, userId }: {
        postId: number,
        userId: number,
    }): Promise<GetPostResDto> {
        const [foundPost, foundTags] = await Promise.all([
            await this.postRepository.getPost(postId),
            await this.tagService.getTagsByPostId(postId),
        ]);
        if (!foundPost) {
            throw new NotFoundException('존재하지 않는 게시글입니다.');
        }
        return plainToInstance(GetPostResDto, { ...foundPost, tags: foundTags });
    }

    async createPost({createPostReqDto, userId}: {
        createPostReqDto: CreatePostReqDto;
        userId: number;
    }): Promise<CreatePostResDto> {
        const { title, content, tags } = createPostReqDto;

        return await this.prismaService.$transaction(async tx => {
            const createdPost = await this.postRepository.createPost({ title, content, authorId: userId });
            if (tags && createdPost) {
                await this.tagService.createTags({ tags, postId: createdPost.id });
            }
            return plainToInstance(CreatePostResDto, createdPost);
        });
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

        return await this.prismaService.$transaction( async tx => { 
            await Promise.all([
                this.postRepository.updatePost({ data: { title, content }, postId }),
                this.tagService.deleteTags(postId),
            ]);
            if (tags) {
                await this.tagService.createTags({ tags, postId });
            }
            return;
        });
           
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
        
        return await this.prismaService.$transaction( async tx => {
            await Promise.all([
                this.postRepository.deletePost(postId),
                this.tagService.deleteTags(postId),
            ]);
            return;
        });
    }
}

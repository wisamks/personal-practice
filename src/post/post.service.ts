import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PostRepository } from './post.repository';
import { CreatePostReqDto } from './dto/request/create-post.req.dto';
import { TagService } from '@_/tag/tag.service';
import { plainToInstance } from 'class-transformer';
import { GetPostResDto } from './dto/response/get-post.res.dto';
import { GetPostsReqDto } from './dto/request/get-posts.req.dto';
import { PrismaService } from '@_/prisma/prisma.service';
import { CreatePostResDto } from './dto/response/create-post.res.dto';
import { UpdatePostReqDto } from './dto/request/update-post.req.dto';
import { GetCursorReqDto } from './dto/request/get-cursor.req.dto';

@Injectable()
export class PostService {
    private readonly logger = new Logger('PostService');

    constructor(
        private readonly postRepository: PostRepository,
        private readonly tagService: TagService,
        private readonly prismaService: PrismaService,
    ) {}

    async getPostsByCursor(getCursorReqDto: GetCursorReqDto): Promise<GetPostResDto[]> {
        const foundPosts = await this.postRepository.getPostsByCursor(getCursorReqDto);
        const result = [];
        for (const foundPost of foundPosts) {
            const foundTags = await this.tagService.getTagsByPostId(foundPost.id);
            result.push(plainToInstance(GetPostResDto, { ...foundPost, tags: foundTags }))
        }
        return result;
    }

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
            const createdPost = await this.postRepository.createPost(tx, { title, content, authorId: userId });
            if (tags && createdPost) {
                await this.tagService.createTags(tx, { tags, postId: createdPost.id });
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
                this.postRepository.updatePost(tx, { data: { title, content }, postId }),
                this.tagService.deleteTags(tx, postId),
            ]);
            if (tags) {
                await this.tagService.createTags(tx, { tags, postId });
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
                this.postRepository.deletePost(tx, postId),
                this.tagService.deleteTags(tx, postId),
            ]);
            return;
        });
    }
}

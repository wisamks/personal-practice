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
import { POST_FORBIDDEN_ERROR_MESSAGE, POST_GET_COMMENT_REQ, POST_NOT_FOUND_ERROR_MESSAGE, POST_SERVICE } from './constants/post.constant';
import { CommentService } from '@_/comment/comment.service';
import { ViewService } from '@_/view/view.service';
import { PostLikeService } from '@_/post-like/post-like.service';

@Injectable()
export class PostService {
    private readonly logger = new Logger(POST_SERVICE);

    constructor(
        private readonly postRepository: PostRepository,
        private readonly tagService: TagService,
        private readonly prismaService: PrismaService,
        private readonly commentService: CommentService,
        private readonly viewService: ViewService,
        private readonly postLikeService: PostLikeService,
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
        // 기본 post 가져오고 없으면 에러
        const foundPost = await this.postRepository.getPost(postId);
        if (!foundPost) {
            throw new NotFoundException(POST_NOT_FOUND_ERROR_MESSAGE);
        }
        // 세부 정보들을 가져오면서 조회수 올리기
        const [foundTags, foundComments] = await Promise.all([
            await this.tagService.getTagsByPostId(postId),
            await this.commentService.getCommentsByPostId({
                getCommentsReqDto: POST_GET_COMMENT_REQ,
                postId,
            }),
            await this.viewService.createView({ postId, userId })
        ]);
        // 카운트 정보 가져오기
        const [viewsCount, commentsCount, likesCount] = await Promise.all([
            await this.viewService.getViewCountByPostId(postId),
            await this.commentService.getCommentsCountByPostId(postId),
            await this.postLikeService.getPostLikesCountByPostId(postId),
        ]);
        // 각 정보들 객체로 저장
        const responseDto = {
            ...foundPost,
            tags: foundTags,
            counts: {
                viewsCount,
                commentsCount,
                likesCount
            },
        };

        return {
            ...plainToInstance(GetPostResDto, responseDto),
            comments: foundComments
        };
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
            throw new NotFoundException(POST_NOT_FOUND_ERROR_MESSAGE);
        }
        if (foundPost.authorId !== userId) {
            throw new ForbiddenException(POST_FORBIDDEN_ERROR_MESSAGE);
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
            throw new NotFoundException(POST_NOT_FOUND_ERROR_MESSAGE);
        }
        if (foundPost.authorId !== userId) {
            throw new ForbiddenException(POST_FORBIDDEN_ERROR_MESSAGE);
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

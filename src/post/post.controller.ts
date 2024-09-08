import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostReqDto } from './dto/request/create-post.req.dto';
import { ReqUser } from '@_/user/req-user.decorator';
import { JwtAuthGuard } from '@_/auth/auth-jwt.guard';
import { GetPostResDto } from './dto/response/get-post.res.dto';
import { GetPostsReqDto } from './dto/request/get-posts.req.dto';
import { CreatePostResDto } from './dto/response/create-post.res.dto';
import { UpdatePostReqDto } from './dto/request/update-post.req.dto';
import { GetCursorReqDto } from './dto/request/get-cursor.req.dto';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get('/cursor')
  @HttpCode(200)
  async getPostsByCursor(
    @Query() getCursorReqDto: GetCursorReqDto,
  ): Promise<GetPostResDto[]> {
    return this.postService.getPostsByCursor(getCursorReqDto);
  }

  @Get()
  @HttpCode(200)
  async getPosts(
    @Query() getPostsReqDto: GetPostsReqDto,
  ): Promise<GetPostResDto[]> {
    return await this.postService.getPosts(getPostsReqDto);
  }

  @Get('/:postId')
  @HttpCode(200)
  async getPost(
    @Param('postId', ParseIntPipe) postId: number,
    @ReqUser('userId') userId: number | null,
  ): Promise<GetPostResDto> {
    const foundPost = await this.postService.getPost({ postId, userId });
    return foundPost;
  }

  @Post()
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  async createPost(
    @Body() createPostReqDto: CreatePostReqDto,
    @ReqUser('userId') userId: number,
  ): Promise<CreatePostResDto> {
    return await this.postService.createPost({ createPostReqDto, userId });
  }

  @Put('/:postId')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  async updatePost(
    @Body() updatePostReqDto: UpdatePostReqDto,
    @Param('postId', ParseIntPipe) postId: number,
    @ReqUser('userId') userId: number,
  ): Promise<void> {
    return await this.postService.updatePost({ updatePostReqDto, postId, userId });
  }

  @Delete('/:postId')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  async deletePost(
    @Param('postId', ParseIntPipe) postId: number,
    @ReqUser('userId') userId: number,
  ): Promise<void> {
    return await this.postService.deletePost({ postId, userId });
  }
}

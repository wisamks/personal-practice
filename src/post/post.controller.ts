import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostReqDto } from './dto/request/create-post.req.dto';
import { ReqUser } from '@_/user/decorators/req-user.decorator';
import { JwtAuthGuard } from '@_/auth/guards/auth-jwt.guard';
import { GetPostResDto } from './dto/response/get-post.res.dto';
import { GetPostsReqDto } from './dto/request/get-posts.req.dto';
import { CreatePostResDto } from './dto/response/create-post.res.dto';
import { UpdatePostReqDto } from './dto/request/update-post.req.dto';
import { GetCursorReqDto } from './dto/request/get-cursor.req.dto';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get('/cursor')
  @HttpCode(HttpStatus.OK)
  async getPostsByCursor(
    @Query() getCursorReqDto: GetCursorReqDto,
  ): Promise<GetPostResDto[]> {
    return this.postService.getPostsByCursor(getCursorReqDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getPosts(
    @Query() getPostsReqDto: GetPostsReqDto,
  ): Promise<GetPostResDto[]> {
    return await this.postService.getPosts(getPostsReqDto);
  }

  @Get('/:postId')
  @HttpCode(HttpStatus.OK)
  async getPost(
    @Param('postId', ParseIntPipe) postId: number,
    @ReqUser('userId') userId: number | null,
  ): Promise<GetPostResDto> {
    return await this.postService.getPost({ postId, userId });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  async createPost(
    @Body() createPostReqDto: CreatePostReqDto,
    @ReqUser('userId') userId: number,
  ): Promise<CreatePostResDto> {
    return await this.postService.createPost({ createPostReqDto, userId });
  }

  @Put('/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async updatePost(
    @Body() updatePostReqDto: UpdatePostReqDto,
    @Param('postId', ParseIntPipe) postId: number,
    @ReqUser('userId') userId: number,
  ): Promise<void> {
    return await this.postService.updatePost({ updatePostReqDto, postId, userId });
  }

  @Delete('/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async deletePost(
    @Param('postId', ParseIntPipe) postId: number,
    @ReqUser('userId') userId: number,
  ): Promise<void> {
    return await this.postService.deletePost({ postId, userId });
  }
}

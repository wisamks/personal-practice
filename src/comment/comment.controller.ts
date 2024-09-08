import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentReqDto } from './dto/request/create-comment.req.dto';
import { JwtAuthGuard } from '@_/auth/guards/auth-jwt.guard';
import { ReqUser } from '@_/user/decorators/req-user.decorator';
import { CreateCommentResDto } from './dto/response/create-comment.res.dto';
import { GetCommentResDto } from './dto/response/get-comment.res.dto';
import { GetCommentsReqDto } from './dto/request/get-comments.req.dto';

@Controller('posts/:postId/comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  @HttpCode(200)
  async getCommentsByCursor(
    @Query() getCommentsReqDto: GetCommentsReqDto,
    @Param('postId', ParseIntPipe) postId: number,
  ): Promise<GetCommentResDto[]> {
    return await this.commentService.getCommentsByPostId({ getCommentsReqDto, postId });
  }

  @Post()
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  async createComment(
    @Body() createCommentReqDto: CreateCommentReqDto,
    @Param('postId') postId: number,
    @ReqUser('userId') userId: number,
  ): Promise<CreateCommentResDto> {
    return await this.commentService.createComment({ createCommentReqDto, postId, userId });
  }
}

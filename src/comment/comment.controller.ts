import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentReqDto } from './dto/request/create-comment.req.dto';
import { JwtAuthGuard } from '@_/auth/guards/auth-jwt.guard';
import { ReqUser } from '@_/user/decorators/req-user.decorator';
import { CreateCommentResDto } from './dto/response/create-comment.res.dto';
import { GetCommentResDto } from './dto/response/get-comment.res.dto';
import { GetCommentsReqDto } from './dto/request/get-comments.req.dto';
import { UpdateCommentReqDto } from './dto/request/update-comment.req.dto';

@Controller('posts/:postId/comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getCommentsByCursor(
    @Query() getCommentsReqDto: GetCommentsReqDto,
    @Param('postId', ParseIntPipe) postId: number,
  ): Promise<GetCommentResDto[]> {
    return await this.commentService.getCommentsByPostId({ getCommentsReqDto, postId });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  async createComment(
    @Body() createCommentReqDto: CreateCommentReqDto,
    @Param('postId') postId: number,
    @ReqUser('userId') userId: number,
  ): Promise<CreateCommentResDto> {
    return await this.commentService.createComment({ createCommentReqDto, postId, userId });
  }
  
  @Put('/:commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async updateComment(
    @Body() updateCommentReqDto: UpdateCommentReqDto,
    @Param('commentId', ParseIntPipe) commentId: number,
    @ReqUser('userId') userId: number, 
  ): Promise<void> {
    return await this.commentService.updateComment({ updateCommentReqDto, commentId, userId });
  }

  @Delete('/:commentId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async deleteComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @ReqUser('userId') userId: number, 
  ): Promise<GetCommentResDto> {
    return await this.commentService.deleteComment({ commentId, userId });
  }
}

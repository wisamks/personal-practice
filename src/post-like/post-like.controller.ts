import { Controller, HttpCode, HttpStatus, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { PostLikeService } from './post-like.service';
import { JwtAuthGuard } from '@_/auth/guards/auth-jwt.guard';
import { ReqUser } from '@_/user/decorators/req-user.decorator';

@Controller('posts/:postId/like')
export class PostLikeController {
  constructor(private readonly postLikeService: PostLikeService) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async togglePostLike(
    @Param('postId', ParseIntPipe) postId: number,
    @ReqUser('userId') userId: number,
  ): Promise<void> {
    return await this.postLikeService.togglePostLike({ postId, userId });
  }

}

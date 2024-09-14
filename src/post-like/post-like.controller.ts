import { Controller, HttpCode, HttpStatus, Logger, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { PostLikeService } from './post-like.service';
import { JwtAuthGuard } from '@_/auth/guards/jwt-auth.guard';
import { ReqUser } from '@_/user/decorators/req-user.decorator';
import { PATH_ROUTES } from '@_/common/common.constant';

@Controller(PATH_ROUTES.POST_LIKE)
export class PostLikeController {
  private readonly logger = new Logger(PostLikeController.name)

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

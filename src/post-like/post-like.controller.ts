import { Controller } from '@nestjs/common';
import { PostLikeService } from './post-like.service';

@Controller('post-like')
export class PostLikeController {
  constructor(private readonly postLikeService: PostLikeService) {}
}

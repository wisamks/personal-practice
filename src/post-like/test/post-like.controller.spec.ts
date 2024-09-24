import { Test, TestingModule } from '@nestjs/testing';
import { PostLikeController } from '../post-like.controller';
import { PostLikeService } from '../post-like.service';
import { ITogglePostLikeReq } from '../types/toggle-post-like.req.interface';

describe('PostLikeController', () => {
  const mockPostLikeService: jest.Mocked<Partial<PostLikeService>> = {
    togglePostLike: jest.fn(),
  };

  let controller: PostLikeController;
  let service: jest.Mocked<PostLikeService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostLikeController],
      providers: [
        {
          provide: PostLikeService,
          useValue: mockPostLikeService,
        },
      ],
    }).compile();

    controller = module.get<PostLikeController>(PostLikeController);
    service = module.get<jest.Mocked<PostLikeService>>(PostLikeService);
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  const postId = 20;
  const userId = 1;

  describe('togglePostLike, 입력: 게시글 아이디 & 현재 유저 아이디, 동작: 두 값을 전달하여 좋아요 토글을 실행', () => {
    it('반환: undefined, 조건: 항상', async () => {
      service.togglePostLike.mockResolvedValue();

      await expect(controller.togglePostLike(postId, userId)).resolves.toEqual<void>(undefined);
      expect(service.togglePostLike).toHaveBeenCalledWith<[ITogglePostLikeReq]>({ postId, userId });
    });
  });
});

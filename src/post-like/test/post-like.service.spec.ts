import { Test, TestingModule } from '@nestjs/testing';
import { PostLikeService } from '../post-like.service';
import { PostLikeRepository } from '../post-like.repository';
import { Redis } from 'ioredis';
import { ONE_HOUR_BY_SECOND } from '@_/redis/constants/redis.constant';

describe('PostLikeService', () => {
  const mockPostLikeRepository: jest.Mocked<Partial<PostLikeRepository>> = {
    findPostLikeCountByPostId: jest.fn(),
    findPostLikesByPostId: jest.fn(),
  };
  const mockRedisClient: jest.Mocked<Partial<Redis>> = {
    get: jest.fn(),
    set: jest.fn(),
    smembers: jest.fn(),
    sadd: jest.fn(),
    scard: jest.fn(),
    sismember: jest.fn(),
    srem: jest.fn(),
    incr: jest.fn(),
    decr: jest.fn(),
  };

  let service: PostLikeService;
  let repository: jest.Mocked<PostLikeRepository>;
  let redisClient: jest.Mocked<Redis>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostLikeService,
        {
          provide: PostLikeRepository,
          useValue: mockPostLikeRepository,
        },
        {
          provide: 'REDIS-CLIENT',
          useValue: mockRedisClient,
        },
      ],
    }).compile();

    service = module.get<PostLikeService>(PostLikeService);
    repository = module.get<jest.Mocked<PostLikeRepository>>(PostLikeRepository);
    redisClient = module.get<jest.Mocked<Redis>>('REDIS-CLIENT');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const postId = 20;
  const userId = 1;
  const likeCountKey = `posts:${postId}:likes:count`;
  const likeOldSetKey = `posts:${postId}:likes:set:old`;
  const likeNewSetKey = `posts:${postId}:likes:set:new`;

  describe('getPostLikeCountByPostId, 입력: 게시글 아이디, 동작: 단일 게시글 좋아요 수 반환', () => {
    it('반환: 단일 게시글 좋아요 수, 조건: 레디스에 있을 때', async () => {
      const foundCount = 2;
      redisClient.get.mockResolvedValue(String(foundCount));

      await expect(service.getPostLikeCountByPostId(postId)).resolves.toEqual<number>(foundCount);
      expect(redisClient.get).toHaveBeenCalledWith<[string]>(likeCountKey);
    });

    it('반환: 단일 게시글 좋아요 수, 조건: 레디스에 없을 때, 동작: 레디스에 저장 후 반환', async () => {
      const foundCount = 2;
      redisClient.get.mockResolvedValue(null);
      repository.findPostLikeCountByPostId.mockResolvedValue(foundCount);

      await expect(service.getPostLikeCountByPostId(postId)).resolves.toEqual<number>(foundCount);
      expect(repository.findPostLikeCountByPostId).toHaveBeenCalledWith<[number]>(postId);
      expect(redisClient.set).toHaveBeenCalledWith<[string, string, string, number]>(
        likeCountKey,
        String(foundCount),
        'EX',
        ONE_HOUR_BY_SECOND,
      );
    });
  });

  describe('togglePostLike, 입력: 유저 아이디 & 게시글 아이디, 동작: 좋아요를 토글하고 레디스에 저장', () => {
    it('반환: undefined, 조건: 유저가 oldset에도 newset에도 없다면, 동작: 좋아요 추가', async () => {
      redisClient.smembers.mockResolvedValue([]);
      redisClient.get.mockResolvedValueOnce(null);
      repository.findPostLikesByPostId.mockResolvedValue([]);
      redisClient.scard.mockResolvedValue(1);

      redisClient.sismember.mockResolvedValueOnce(0);
      redisClient.sismember.mockResolvedValueOnce(0);

      await expect(service.togglePostLike({ postId, userId })).resolves.toEqual<void>(undefined);
      expect(redisClient.smembers).toHaveBeenCalledWith<[string]>(likeOldSetKey);
      expect(redisClient.get).toHaveBeenCalledWith<[string]>(likeCountKey);

      expect(repository.findPostLikesByPostId).toHaveBeenCalledWith<[number]>(postId);
      expect(redisClient.sadd).toHaveBeenCalledWith<[string, number[]]>(likeOldSetKey, [0]);
      expect(redisClient.scard).toHaveBeenCalledWith<[string]>(likeOldSetKey);
      expect(redisClient.set).toHaveBeenCalledWith<[string, number, string, number]>(
        likeCountKey,
        0,
        'EX',
        ONE_HOUR_BY_SECOND,
      );

      expect(redisClient.sismember).toHaveBeenCalledWith<[string, number]>(likeNewSetKey, userId);
      expect(redisClient.sadd).toHaveBeenCalledWith<[string, number]>(likeNewSetKey, userId);
      expect(redisClient.srem).not.toHaveBeenCalled();

      expect(redisClient.sismember).toHaveBeenCalledWith<[string, number]>(likeOldSetKey, userId);
      expect(redisClient.incr).toHaveBeenCalledWith<[string]>(likeCountKey);
      expect(redisClient.decr).not.toHaveBeenCalled();

      expect(redisClient.sadd).toHaveBeenCalledTimes(2);
      expect(redisClient.sismember).toHaveBeenCalledTimes(2);
    });

    it('반환: undefined, 조건: 유저가 oldset에는 있고 newset에는 없다면, 동작: 좋아요 삭제', async () => {
      redisClient.smembers.mockResolvedValue(['0', '1']);
      redisClient.get.mockResolvedValueOnce('1');

      redisClient.sismember.mockResolvedValueOnce(0);
      redisClient.sismember.mockResolvedValueOnce(1);

      await expect(service.togglePostLike({ postId, userId })).resolves.toEqual<void>(undefined);
      expect(redisClient.smembers).toHaveBeenCalledWith<[string]>(likeOldSetKey);
      expect(redisClient.get).toHaveBeenCalledWith<[string]>(likeCountKey);
      expect(repository.findPostLikesByPostId).not.toHaveBeenCalled();

      expect(redisClient.sismember).toHaveBeenCalledWith<[string, number]>(likeNewSetKey, userId);
      expect(redisClient.sadd).toHaveBeenCalledWith<[string, number]>(likeNewSetKey, userId);
      expect(redisClient.srem).not.toHaveBeenCalled();

      expect(redisClient.sismember).toHaveBeenCalledWith<[string, number]>(likeOldSetKey, userId);
      expect(redisClient.incr).not.toHaveBeenCalled();
      expect(redisClient.decr).toHaveBeenCalledWith<[string]>(likeCountKey);
    });

    it('반환: undefined, 조건: 유저가 oldset에는 없고 newset에는 있다면, 동작: 좋아요 삭제', async () => {
      redisClient.smembers.mockResolvedValue(['0']);
      redisClient.get.mockResolvedValueOnce('1');

      redisClient.sismember.mockResolvedValueOnce(1);
      redisClient.sismember.mockResolvedValueOnce(0);

      await expect(service.togglePostLike({ postId, userId })).resolves.toEqual<void>(undefined);
      expect(redisClient.smembers).toHaveBeenCalledWith<[string]>(likeOldSetKey);
      expect(redisClient.get).toHaveBeenCalledWith<[string]>(likeCountKey);
      expect(repository.findPostLikesByPostId).not.toHaveBeenCalled();

      expect(redisClient.sismember).toHaveBeenCalledWith<[string, number]>(likeNewSetKey, userId);
      expect(redisClient.sadd).not.toHaveBeenCalled();
      expect(redisClient.srem).toHaveBeenCalledWith<[string, number]>(likeNewSetKey, userId);

      expect(redisClient.sismember).toHaveBeenCalledWith<[string, number]>(likeOldSetKey, userId);
      expect(redisClient.incr).not.toHaveBeenCalled();
      expect(redisClient.decr).toHaveBeenCalledWith<[string]>(likeCountKey);
    });

    it('반환: undefined, 조건: 유저가 oldset에도 newset에도 있다면, 동작: 좋아요 추가', async () => {
      redisClient.smembers.mockResolvedValue(['0', '1']);
      redisClient.get.mockResolvedValueOnce('0');

      redisClient.sismember.mockResolvedValueOnce(1);
      redisClient.sismember.mockResolvedValueOnce(1);

      await expect(service.togglePostLike({ postId, userId })).resolves.toEqual<void>(undefined);
      expect(redisClient.smembers).toHaveBeenCalledWith<[string]>(likeOldSetKey);
      expect(redisClient.get).toHaveBeenCalledWith<[string]>(likeCountKey);
      expect(repository.findPostLikesByPostId).not.toHaveBeenCalled();

      expect(redisClient.sismember).toHaveBeenCalledWith<[string, number]>(likeNewSetKey, userId);
      expect(redisClient.sadd).not.toHaveBeenCalled();
      expect(redisClient.srem).toHaveBeenCalledWith<[string, number]>(likeNewSetKey, userId);

      expect(redisClient.sismember).toHaveBeenCalledWith<[string, number]>(likeOldSetKey, userId);
      expect(redisClient.incr).toHaveBeenCalledWith<[string]>(likeCountKey);
      expect(redisClient.decr).not.toHaveBeenCalled();
    });
  });
});

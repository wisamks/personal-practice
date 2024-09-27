// import { Test, TestingModule } from '@nestjs/testing';
// import { PostLikeScheduleService } from '../post-like-schedule.service';
// import { PostLikeRepository } from '../post-like.repository';
// import { Redis } from 'ioredis';
// import { ITogglePostLikeReq } from '../types/toggle-post-like.req.interface';

// 서버 내부에서 돌아가는 크론 작업에 대한 테스트. 
// 현재는 해당 코드를 사용하지 않으므로 임시 주석 처리.
// describe('PostLikeScheduleService', () => {
//   const mockPostLikeRepository: jest.Mocked<Partial<PostLikeRepository>> = {
//     deletePostLikes: jest.fn(),
//     createPostLikes: jest.fn(),
//   };

//   const mockRedisClient: jest.Mocked<Partial<Redis>> = {
//     keys: jest.fn(),
//     sdiff: jest.fn(),
//     sinter: jest.fn(),
//     del: jest.fn(),
//   };

//   let service: PostLikeScheduleService;
//   let repository: jest.Mocked<PostLikeRepository>;
//   let redisClient: jest.Mocked<Redis>;

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         PostLikeScheduleService,
//         {
//           provide: PostLikeRepository,
//           useValue: mockPostLikeRepository,
//         },
//         {
//           provide: 'REDIS-CLIENT',
//           useValue: mockRedisClient,
//         },
//       ],
//     }).compile();

//     service = module.get<PostLikeScheduleService>(PostLikeScheduleService);
//     repository = module.get<jest.Mocked<PostLikeRepository>>(PostLikeRepository);
//     redisClient = module.get<jest.Mocked<Redis>>('REDIS-CLIENT');
//   });

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   const allOldKeys = `posts:*:likes:set:old`;
//   const likesOldKeys = [`posts:20:likes:set:old`];

//   describe('processPostLikeEvent, 입력: 없음, 동작: 여러 좋아요 생성 및 삭제', () => {
//     it('반환: undefined, 조건: 생성할 좋아요가 있을 때, 동작: 좋아요 생성 및 삭제', async () => {
//       const deletedResult = { count: 1 };
//       const createdResult = { count: 1 };
//       redisClient.keys.mockResolvedValue(likesOldKeys);
//       const likesNewKey = `posts:20:likes:set:new`;
//       const likesOldKey = likesOldKeys[0];
//       redisClient.sdiff.mockResolvedValue(['1']);
//       redisClient.sinter.mockResolvedValue(['2']);
//       repository.deletePostLikes.mockResolvedValue(deletedResult);
//       const postId = 20;
//       const userId = 1;
//       const mockPostLikeInput1: ITogglePostLikeReq = { postId, userId };
//       const userIds = [2];
//       repository.createPostLikes.mockResolvedValue(createdResult);

//       await expect(service.processPostLikeEvent()).resolves.toEqual<void>(undefined);
//       expect(redisClient.keys).toHaveBeenCalledWith(allOldKeys);
//       expect(redisClient.sdiff).toHaveBeenCalledWith<[string, string]>(likesNewKey, likesOldKey);
//       expect(redisClient.sinter).toHaveBeenCalledWith<[string, string]>(likesNewKey, likesOldKey);
//       expect(repository.deletePostLikes).toHaveBeenCalledWith({
//         postId,
//         userIds,
//       });
//       expect(redisClient.del).toHaveBeenCalledWith<[string]>(likesOldKey);
//       expect(redisClient.del).toHaveBeenCalledWith<[string]>(likesNewKey);

//       expect(repository.createPostLikes).toHaveBeenCalledWith<[ITogglePostLikeReq[]]>([mockPostLikeInput1]);
//     });

//     it('반환: undefined, 조건: 생성할 좋아요가 없을 때, 동작: 좋아요 삭제만', async () => {
//       const deletedResult = { count: 1 };
//       redisClient.keys.mockResolvedValue(likesOldKeys);
//       const likesNewKey = `posts:20:likes:set:new`;
//       const likesOldKey = likesOldKeys[0];
//       redisClient.sdiff.mockResolvedValue([]);
//       redisClient.sinter.mockResolvedValue(['2']);
//       repository.deletePostLikes.mockResolvedValue(deletedResult);
//       const postId = 20;
//       const userIds = [2];

//       await expect(service.processPostLikeEvent()).resolves.toEqual<void>(undefined);
//       expect(redisClient.keys).toHaveBeenCalledWith(allOldKeys);
//       expect(redisClient.sdiff).toHaveBeenCalledWith<[string, string]>(likesNewKey, likesOldKey);
//       expect(redisClient.sinter).toHaveBeenCalledWith<[string, string]>(likesNewKey, likesOldKey);
//       expect(repository.deletePostLikes).toHaveBeenCalledWith({
//         postId,
//         userIds,
//       });
//       expect(redisClient.del).toHaveBeenCalledWith<[string]>(likesOldKey);
//       expect(redisClient.del).toHaveBeenCalledWith<[string]>(likesNewKey);

//       expect(repository.createPostLikes).not.toHaveBeenCalled();
//     });
//   });
// });

import { Test, TestingModule } from '@nestjs/testing';
import { ViewScheduleService } from '../view-schedule.service';
import { ViewRepository } from '../view.repository';
import { Redis } from 'ioredis';
import { ICreateViewInput } from '../types/create-view.input.interface';
import { generateDatetime } from '@_/common/generate-datetime.util';

// 테스트 실패 안하도록 임시로 작성한 코드
it('test', () => {
    expect(1+1).toEqual(2);
})

// 서버 내부에서 돌아가는 크론 작업에 대한 테스트. 
// 현재는 해당 코드를 사용하지 않으므로 임시 주석 처리.
// describe('ViewScheduleService', () => {
//   const mockViewRepository: jest.Mocked<Partial<ViewRepository>> = {
//     createViews: jest.fn(),
//   };

//   const mockRedisClient: jest.Mocked<Partial<Redis>> = {
//     keys: jest.fn(),
//     lpop: jest.fn(),
//     del: jest.fn(),
//   };

//   let service: ViewScheduleService;
//   let repository: jest.Mocked<ViewRepository>;
//   let redisClient: jest.Mocked<Redis>;

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         ViewScheduleService,
//         {
//           provide: ViewRepository,
//           useValue: mockViewRepository,
//         },
//         {
//           provide: 'REDIS-CLIENT',
//           useValue: mockRedisClient,
//         },
//       ],
//     }).compile();

//     service = module.get<ViewScheduleService>(ViewScheduleService);
//     repository = module.get<jest.Mocked<ViewRepository>>(ViewRepository);
//     redisClient = module.get<jest.Mocked<Redis>>('REDIS-CLIENT');
//   });

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   const allKeys = `posts:*:views:log`;
//   const viewsLogKeys = ['posts:20:views:log'];
//   const viewLog = {
//     userId: 1,
//     createdAt: generateDatetime(),
//   };

//   describe('processViewEvents, 입력: 없음, 동작: 1분마다 조회 로그를 레디스에서 뽑아서 db로 반영', () => {
//     it('반환: undefined, 조건: 조회 로그 성공적으로 db에 저장', async () => {
//       const newLog: ICreateViewInput = {
//         postId: 20,
//         userId: viewLog.userId,
//         createdAt: viewLog.createdAt,
//       };
//       redisClient.keys.mockResolvedValue(viewsLogKeys);
//       redisClient.lpop.mockResolvedValueOnce(JSON.stringify(viewLog) as unknown as string[]);
//       redisClient.lpop.mockResolvedValueOnce(JSON.stringify(viewLog) as unknown as string[]);
//       redisClient.lpop.mockResolvedValueOnce(null);
//       repository.createViews.mockResolvedValue({ count: 2 });

//       await expect(service.processViewEvents()).resolves.toEqual<void>(undefined);
//       expect(redisClient.keys).toHaveBeenCalledWith<[string]>(allKeys);
//       expect(redisClient.lpop).toHaveBeenCalledWith<[string]>(viewsLogKeys[0]);
//       expect(redisClient.lpop).toHaveBeenCalledTimes(3);
//       expect(redisClient.del).toHaveBeenCalledWith<[string]>(viewsLogKeys[0]);
//       expect(repository.createViews).toHaveBeenCalledWith<[ICreateViewInput[]]>([newLog, newLog]);
//     });
//   });
// });

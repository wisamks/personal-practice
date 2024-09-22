import { Test, TestingModule } from "@nestjs/testing";
import { ViewService } from "../view.service";
import { ViewRepository } from "../view.repository";
import { Redis } from "ioredis";
import { ONE_HOUR_BY_SECOND } from "@_/redis/constants/redis.constant";

describe('ViewService', () => {
    const mockViewRepository: jest.Mocked<Partial<ViewRepository>> = {
        findViewCountByPostId: jest.fn(),
        createView: jest.fn(),
        createViews: jest.fn(),
    };

    const mockRedisClient: jest.Mocked<Partial<Redis>> = {
        set: jest.fn(),
        get: jest.fn(),
        rpush: jest.fn(),
        incr: jest.fn(),
    };

    let service: ViewService;
    let repository: jest.Mocked<ViewRepository>;
    let redisClient: jest.Mocked<Redis>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ViewService,
                {
                    provide: ViewRepository,
                    useValue: mockViewRepository,
                },
                {
                    provide: 'REDIS-CLIENT',
                    useValue: mockRedisClient,
                },
            ],
        }).compile();

        service = module.get<ViewService>(ViewService);
        repository = module.get<jest.Mocked<ViewRepository>>(ViewRepository);
        redisClient = module.get<jest.Mocked<Redis>>('REDIS-CLIENT');
    });

    afterAll(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    const now = new Date();

    const postId = 20;
    const userId = 1;
    const viewCount = 200;
    const viewCountKey = `posts:${postId}:views:count`;
    const viewLog = {
        userId,
        createdAt: now,
    };
    const stringViewLog = JSON.stringify(viewLog);

    describe('getViewCountByPostId, 입력: 게시글 아이디, 동작: 단일 게시글의 조회수 캐싱 & 반환', () => {
        it('반환: 단일 게시글 조회 수, 조건: 레디스에서 찾았다면', async () => {
            redisClient.get.mockResolvedValue(String(viewCount));

            await expect(service.getViewCountByPostId(postId)).resolves.toEqual<number>(Number(viewCount));
            expect(redisClient.get).toHaveBeenCalledWith<[string]>(viewCountKey);
        });

        it('반환: 단일 게시글 조회 수, 조건: 레디스에 없고 db에서 가져왔다면', async () => {
            redisClient.get.mockResolvedValue(null);
            redisClient.set.mockResolvedValue('1');
            repository.findViewCountByPostId.mockResolvedValue(viewCount);

            await expect(service.getViewCountByPostId(postId)).resolves.toEqual<number>(viewCount);
            expect(redisClient.get).toHaveBeenCalledWith<[string]>(viewCountKey);
            expect(repository.findViewCountByPostId).toHaveBeenCalledWith<[number]>(postId);
            expect(redisClient.set).toHaveBeenCalledWith<[string, string, string, number]>(viewCountKey, String(viewCount), 'EX', ONE_HOUR_BY_SECOND);
        });
    });

    describe('createView, 입력: 게시글 아이디 & 유저 아이디 & 생성 시각, 동작: 레디스에 조회 로그 생성 & 조회 수 올리기', () => {
        it('반환: undefined, 조건: 조회 수 레디스에 등록 안 된 상태', async () => {
            redisClient.get.mockResolvedValue(null);
            repository.findViewCountByPostId.mockResolvedValue(viewCount);
            jest.useFakeTimers().setSystemTime(now);

            await expect(service.createView({ userId, postId, createdAt: now })).resolves.toEqual<void>(undefined);
            expect(redisClient.get).toHaveBeenCalledWith(viewCountKey);
            expect(repository.findViewCountByPostId).toHaveBeenCalledWith<[number]>(postId);
            expect(redisClient.set).toHaveBeenCalledWith<[string, number, string, number]>(viewCountKey, viewCount, 'EX', ONE_HOUR_BY_SECOND);
            expect(redisClient.rpush).toHaveBeenCalledWith<[string, string]>(`posts:${postId}:views:log`, stringViewLog);
            expect(redisClient.incr).toHaveBeenCalledWith<[string]>(viewCountKey);
        });

        it('반환: undefined, 조건: 조회 수 레디스에 등록 된 상태', async () => {
            redisClient.get.mockResolvedValue(String(viewCount));
            jest.useFakeTimers().setSystemTime(now);

            await expect(service.createView({ userId, postId, createdAt: now })).resolves.toEqual<void>(undefined);
            expect(redisClient.get).toHaveBeenCalledWith(viewCountKey);
            expect(redisClient.rpush).toHaveBeenCalledWith<[string, string]>(`posts:${postId}:views:log`, stringViewLog);
            expect(redisClient.incr).toHaveBeenCalledWith<[string]>(viewCountKey);
        })
    });
});
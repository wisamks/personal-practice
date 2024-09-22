import { PrismaService } from "@_/prisma/prisma.service";
import { Test, TestingModule } from "@nestjs/testing";
import { ViewRepository } from "../view.repository";
import { RepositoryBadGatewayException } from "@_/common/custom-error.util";
import { Prisma, View } from "@prisma/client";
import { ICreateViewInput } from "../types/create-view.input.interface";

describe('ViewRepository', () => {
    const mockPrismaService = {
        view: {
            count: jest.fn(),
            create: jest.fn(),
            createMany: jest.fn(),
        },
    };

    let repository: ViewRepository;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ViewRepository,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                }
            ],
        }).compile();
        
        repository = module.get<ViewRepository>(ViewRepository);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const postId = 20;
    const userId = 1;
    const now = new Date();
    const viewCount = 200;

    describe('findViewCountByPostId, 입력: 단일 게시글 아이디 숫자, 동작: 단일 게시글의 조회 수를 db에서 찾아 반환', () => {
        it('반환: 단일 게시글 조회 수, 조건: db 통신 성공 시', async () => {
            const where: Prisma.ViewWhereInput = {
                postId,
                deletedAt: null,
            };
            mockPrismaService.view.count.mockResolvedValue(viewCount);

            await expect(repository.findViewCountByPostId(postId)).resolves.toEqual<number>(viewCount);
            expect(mockPrismaService.view.count).toHaveBeenCalledWith<[Prisma.ViewCountArgs]>({ where });
        });

        it('반환: BadGateWayException, 조건: db관련 에러 시', async () => {
            const where: Prisma.ViewWhereInput = {
                postId,
                deletedAt: null,
            };
            mockPrismaService.view.count.mockRejectedValue(new Error());

            await expect(repository.findViewCountByPostId(postId)).rejects.toThrow(RepositoryBadGatewayException);
            expect(mockPrismaService.view.count).toHaveBeenCalledWith<[Prisma.ViewCountArgs]>({ where });
        });
    });

    describe('createView, 입력: 단일 조회 로그 생성 데이터 객체, 동작: 단일 조회 로그 db에 생성 후 반환', () => {
        it('반환: 단일 조회 로그 객체, 조건: db 통신 성공 시', async () => {
            const data: ICreateViewInput = {
                postId,
                userId,
                createdAt: now,
            };
            const createdLog: View = {
                ...data,
                createdAt: now,
                updatedAt: now,
                deletedAt: null,
                id: 1,
            };
            mockPrismaService.view.create.mockResolvedValue(createdLog);

            await expect(repository.createView(data)).resolves.toEqual<View>(createdLog);
            expect(mockPrismaService.view.create).toHaveBeenCalledWith<[Prisma.ViewCreateArgs]>({ data });
        });

        it('반환: BadGateWayError, 조건: db 통신 에러 시', async () => {
            const data: ICreateViewInput = {
                postId,
                userId,
                createdAt: now,
            };
            const createdLog: View = {
                ...data,
                createdAt: now,
                updatedAt: now,
                deletedAt: null,
                id: 1,
            };
            mockPrismaService.view.create.mockRejectedValue(new Error());

            await expect(repository.createView(data)).rejects.toThrow(RepositoryBadGatewayException);
            expect(mockPrismaService.view.create).toHaveBeenCalledWith<[Prisma.ViewCreateArgs]>({ data });
        });
    });

    describe('createViews, 입력: 여러 조회 로그 생성 데이터 객체 배열, 동작: 여러 조회 로그 db에 생성 후 결과 반환', () => {
        it('반환: 결과 개수 객체 반환, 조건: db 통신 성공 시', async () => {
            const data: ICreateViewInput[] = [{
                postId,
                userId,
                createdAt: now,
            }];
            mockPrismaService.view.createMany.mockResolvedValue({ count: 1 });
            
            await expect(repository.createViews(data)).resolves.toEqual<Prisma.BatchPayload>({ count: 1 });
            expect(mockPrismaService.view.createMany).toHaveBeenCalledWith<[Prisma.ViewCreateManyArgs]>({ data });
        });

        it('반환: BadGateWayError, 조건: db 통신 에러 시', async () => {
            const data: ICreateViewInput[] = [{
                postId,
                userId,
                createdAt: now,
            }];
            mockPrismaService.view.createMany.mockRejectedValue(new Error());
            
            await expect(repository.createViews(data)).rejects.toThrow(RepositoryBadGatewayException);
            expect(mockPrismaService.view.createMany).toHaveBeenCalledWith<[Prisma.ViewCreateManyArgs]>({ data });
        });
    });
});
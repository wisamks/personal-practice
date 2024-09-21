import { Test, TestingModule } from "@nestjs/testing";
import { TagRepository } from "../tag.repository";
import { PrismaService } from "@_/prisma/prisma.service";
import { Prisma, Tag } from "@prisma/client";
import { RepositoryBadGatewayException } from "@_/common/custom-error.util";

describe('TagRepository', () => {
    const mockPrismaService = {
        tag: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
        },
    };

    const mockTx = {
        tag: {
            findFirst: jest.fn(),
            create: jest.fn(),
        },
    };

    let repository: TagRepository;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TagRepository,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService
                }
            ],
        }).compile();

        repository = module.get<TagRepository>(TagRepository);
    });

    afterAll(() => {
        jest.clearAllMocks();
    });

    const now = new Date();
    const mockTag1: Tag = {
        id: 1,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        name: '딸기',
    };

    describe('findTags, 입력: 여러 태그 아이디 배열, 동작: 여러 태그를 찾아서 반환', () => {
        it('반환: 여러 태그 객체 배열, 조건: db 통신 성공', async () => {
            const foundTags = [mockTag1];
            const tagIds = [mockTag1.id];
            const where: Prisma.TagWhereInput = {
                id: {
                    in: tagIds,
                },
                deletedAt: null,
            };
            mockPrismaService.tag.findMany.mockResolvedValue(foundTags);
            
            await expect(repository.findTags(tagIds)).resolves.toEqual<Tag[]>(foundTags);
            expect(mockPrismaService.tag.findMany).toHaveBeenCalledWith<[Prisma.TagFindManyArgs]>({ where });
        });

        it('반환: BadGateWayError, 조건: db 통신 에러', async () => {
            const tagIds = [mockTag1.id];
            const where: Prisma.TagWhereInput = {
                id: {
                    in: tagIds,
                },
                deletedAt: null,
            };
            mockPrismaService.tag.findMany.mockRejectedValue(new Error());
            
            await expect(repository.findTags(tagIds)).rejects.toThrow(RepositoryBadGatewayException);
            expect(mockPrismaService.tag.findMany).toHaveBeenCalledWith<[Prisma.TagFindManyArgs]>({ where });
        });
    });

    describe('findTag, 입력: 태그 아이디, 동작: 단일 태그를 찾아서 반환', () => {
        it('반환: 단일 태그 객체, 조건: db 통신 성공', async () => {
            const foundTag = mockTag1;
            const id = mockTag1.id;
            const where: Prisma.TagWhereUniqueInput = {
                id,
                deletedAt: null,
            };
            mockPrismaService.tag.findUnique.mockResolvedValue(foundTag);

            await expect(repository.findTag(id)).resolves.toEqual<Tag>(foundTag);
            expect(mockPrismaService.tag.findUnique).toHaveBeenCalledWith<[Prisma.TagFindUniqueArgs]>({ where });
        });

        it('반환: BadGateWayError, 조건: db 통신 에러', async () => {
            const id = mockTag1.id;
            const where: Prisma.TagWhereUniqueInput = {
                id,
                deletedAt: null,
            };
            mockPrismaService.tag.findUnique.mockRejectedValue(new Error());

            await expect(repository.findTag(id)).rejects.toThrow(RepositoryBadGatewayException);
            expect(mockPrismaService.tag.findUnique).toHaveBeenCalledWith<[Prisma.TagFindUniqueArgs]>({ where });
        });
    });

    describe('findTagByName, 입력: 트랜잭션 객체 & 태그명, 동작: 단일 태그를 찾아서 반환', () => {
        it('반환: 단일 태그 객체, 조건: db 통신 성공', async () => {
            const foundTag = mockTag1;
            const name = mockTag1.name;
            const where: Prisma.TagWhereInput = {
                name,
                deletedAt: null,
            };
            mockTx.tag.findFirst.mockResolvedValue(foundTag);

            await expect(repository.findTagByName(mockTx as unknown as Prisma.TransactionClient, name)).resolves.toEqual<Tag>(foundTag);
            expect(mockTx.tag.findFirst).toHaveBeenCalledWith<[Prisma.TagFindFirstArgs]>({ where });
        });

        it('반환: BadGateWayError, 조건: db 통신 에러', async () => {
            const name = mockTag1.name;
            const where: Prisma.TagWhereInput = {
                name,
                deletedAt: null,
            };
            mockTx.tag.findFirst.mockRejectedValue(new Error());

            await expect(repository.findTagByName(mockTx as unknown as Prisma.TransactionClient, name)).rejects.toThrow(RepositoryBadGatewayException);
            expect(mockTx.tag.findFirst).toHaveBeenCalledWith<[Prisma.TagFindFirstArgs]>({ where });
        });
    });

    describe('createTagByName, 입력: 트랜잭션 객체 & 태그명, 동작: 단일 태그 객체 생성 후 반환', () => {
        it('반환: 단일 태그 객체, 조건: db 통신 성공', async () => {
            const createdTag = mockTag1;
            const name = mockTag1.name;
            const data: Prisma.TagCreateInput = {
                name,
            };
            mockTx.tag.create.mockResolvedValue(createdTag);

            await expect(repository.createTagByName(mockTx as unknown as Prisma.TransactionClient, name)).resolves.toEqual<Tag>(createdTag);
            expect(mockTx.tag.create).toHaveBeenCalledWith<[Prisma.TagCreateArgs]>({ data });
        });

        it('반환: BadGateWayError, 조건: db 통신 에러', async () => {
            const name = mockTag1.name;
            const data: Prisma.TagCreateInput = {
                name,
            };
            mockTx.tag.create.mockRejectedValue(new Error());

            await expect(repository.createTagByName(mockTx as unknown as Prisma.TransactionClient, name)).rejects.toThrow(RepositoryBadGatewayException);
            expect(mockTx.tag.create).toHaveBeenCalledWith<[Prisma.TagCreateArgs]>({ data });
        });
    });
});
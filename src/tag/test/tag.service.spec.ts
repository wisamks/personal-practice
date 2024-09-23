import { Test, TestingModule } from "@nestjs/testing";
import { TagService } from "../tag.service";
import { TagRepository } from "../tag.repository";
import { PostTagRepository } from "../post-tag.repository";
import { Redis } from "ioredis";
import { PostTag, Prisma, Tag } from "@prisma/client";
import { ONE_HOUR_BY_SECOND } from "@_/redis/constants/redis.constant";
import { generateDatetime } from "@_/common/generate-datetime.util";

describe('TagService', () => {
    const mockTagRepository: jest.Mocked<Partial<TagRepository>> = {
        findTag: jest.fn(),
        findTags: jest.fn(),
        findTagByName: jest.fn(),
        createTagByName: jest.fn(),
    };

    const mockPostTagRepository: jest.Mocked<Partial<PostTagRepository>> = {
        findRelationsByPostId: jest.fn(),
        createRelations: jest.fn(),
        deleteRelationsByPostId: jest.fn(),
    };

    const mockRedisClient: jest.Mocked<Partial<Redis>> = {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
    };

    const tx: Prisma.TransactionClient = {} as Prisma.TransactionClient;

    let service: TagService;
    let tagRepository: jest.Mocked<TagRepository>;
    let postTagRepository: jest.Mocked<PostTagRepository>;
    let redisClient: jest.Mocked<Redis>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TagService,
                {
                    provide: TagRepository,
                    useValue: mockTagRepository,
                },
                {
                    provide: PostTagRepository,
                    useValue: mockPostTagRepository,
                },
                {
                    provide: 'REDIS-CLIENT',
                    useValue: mockRedisClient,
                },
            ],
        }).compile();

        service = module.get<TagService>(TagService);
        tagRepository = module.get<jest.Mocked<TagRepository>>(TagRepository);
        postTagRepository = module.get<jest.Mocked<PostTagRepository>>(PostTagRepository);
        redisClient = module.get<jest.Mocked<Redis>>('REDIS-CLIENT');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const now = generateDatetime();
    const mockTag1: Tag = {
        id: 1,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        name: '딸기',
    };
    const mockTag2: Tag = {
        id: 2,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        name: '감자',
    };
    const mockRelation1: PostTag = {
        postId: 20,
        tagId: 1,
    };
    const mockRelation2: PostTag = {
        postId: 20,
        tagId: 2,
    };
    const postId = 20;
    const tagsKey = `posts:${postId}:tags`;

    describe('getTagsByPostId, 입력: 게시글 아이디, 동작: 단일 게시글의 전체 태그를 반환', () => {
        it('반환: 단일 게시글의 전체 태그명 배열, 조건: 레디스에 있을 때', async () => {
            const foundTagNames = [mockTag1.name, mockTag2.name];
            redisClient.get.mockResolvedValue(JSON.stringify(foundTagNames));

            await expect(service.getTagsByPostId(postId)).resolves.toEqual<string[]>(foundTagNames);
            expect(redisClient.get).toHaveBeenCalledWith<[string]>(tagsKey);
        });

        it('반환: 단일 게시글의 전체 태그명 배열, 조건: 레디스에 없을 때, 동작: 태그명 배열을 찾아 레디스에 저장', async () => {
            const foundTagNames = [mockTag1.name, mockTag2.name];
            const foundRelations = [mockRelation1, mockRelation2];
            const foundTagIds = foundRelations.map(relation => relation.tagId);
            const foundTags = [mockTag1, mockTag2];
            redisClient.get.mockResolvedValue(null);
            postTagRepository.findRelationsByPostId.mockResolvedValue(foundRelations);
            tagRepository.findTags.mockResolvedValue(foundTags);

            await expect(service.getTagsByPostId(postId)).resolves.toEqual<string[]>(foundTagNames);
            expect(redisClient.get).toHaveBeenCalledWith<[string]>(tagsKey);
            expect(postTagRepository.findRelationsByPostId).toHaveBeenCalledWith<[number]>(postId);
            expect(tagRepository.findTags).toHaveBeenCalledWith<[number[]]>(foundTagIds);
            expect(redisClient.set).toHaveBeenCalledWith<[string, string, string, number]>(tagsKey, JSON.stringify(foundTagNames), 'EX', ONE_HOUR_BY_SECOND);
        });
    });

    describe('createTags, 입력: 트랜잭션 객체 & 태그명 배열 & 게시글 아이디, 동작: 게시글-태그 관계 생성 후 레디스에 저장', () => {
        it('반환: undefined, 조건: 항상, 동작: db에 없는 태그는 생성 후 게시글-태그 관계 생성 및 레디스에 저장', async () => {
            const tags = [mockTag1.name, mockTag2.name];
            const foundTag = mockTag1;
            const createdTag = mockTag2;
            const relations = [mockRelation1, mockRelation2];
            tagRepository.findTagByName.mockResolvedValueOnce(foundTag);
            tagRepository.findTagByName.mockResolvedValueOnce(null);
            tagRepository.createTagByName.mockResolvedValue(createdTag);
            
            await expect(service.createTags(tx, { tags, postId })).resolves.toEqual<void>(undefined);
            expect(tagRepository.findTagByName).toHaveBeenCalledWith<[Prisma.TransactionClient, string]>(tx, tags[0]);
            expect(tagRepository.findTagByName).toHaveBeenCalledWith<[Prisma.TransactionClient, string]>(tx, tags[1]);
            expect(tagRepository.findTagByName).toHaveBeenCalledTimes(2);
            expect(tagRepository.createTagByName).toHaveBeenCalledWith<[Prisma.TransactionClient, string]>(tx, tags[1]);
            expect(tagRepository.createTagByName).toHaveBeenCalledTimes(1);
            expect(postTagRepository.createRelations).toHaveBeenCalledWith<[Prisma.TransactionClient, PostTag[]]>(tx, relations);
            expect(redisClient.set).toHaveBeenCalledWith<[string, string, string, number]>(tagsKey, JSON.stringify(tags), 'EX', ONE_HOUR_BY_SECOND);
        });
    });

    describe('updateTags, 입력: 트랜잭션 객체 & 태그명 배열 & 게시글 아이디, 동작: 태그 삭제 작업 후 생성 작업', () => {
        it('반환: undefined, 조건: 태그가 있을 때, 동작: 태그 삭제 후 생성 로직 진행', async () => {
            const tags = [mockTag1.name, mockTag2.name];
            jest.spyOn(service, 'deleteTags').mockResolvedValue(undefined);
            jest.spyOn(service, 'createTags').mockResolvedValue(undefined);

            await expect(service.updateTags(tx, { tags, postId })).resolves.toEqual<void>(undefined);
            expect(service.deleteTags).toHaveBeenCalledWith<[Prisma.TransactionClient, number]>(tx, postId);
            expect(service.createTags).toHaveBeenCalledWith<[Prisma.TransactionClient, { tags: string[], postId: number }]>(tx, { tags, postId });
        });

        it('반환: undefined, 조건: 태그가 없을 때, 동작: 태그 삭제만 진행', async () => {
            const tags = [];
            jest.spyOn(service, 'deleteTags').mockResolvedValue(undefined);
            jest.spyOn(service, 'createTags');

            await expect(service.updateTags(tx, { tags, postId })).resolves.toEqual<void>(undefined);
            expect(service.deleteTags).toHaveBeenCalledWith<[Prisma.TransactionClient, number]>(tx, postId);
            expect(service.createTags).not.toHaveBeenCalled();
        });
    });

    describe('deleteTags, 입력: 트랜잭션 객체 & 게시글 아이디, 동작: 태그 관계 전부 삭제 및 레디스 키 삭제', () => {
        it('반환: undefined, 조건: 항상, 동작: 단일 게시글의 모든 태그 삭제 및 레디스 키 삭제', async () => {
            await expect(service.deleteTags(tx, postId)).resolves.toEqual<void>(undefined);
            expect(redisClient.del).toHaveBeenCalledWith<[string]>(tagsKey);
            expect(postTagRepository.deleteRelationsByPostId).toHaveBeenCalledWith<[Prisma.TransactionClient, number]>(tx, postId);
        });
    });
});
import { Test, TestingModule } from '@nestjs/testing';
import { PostRepository } from '../post.repository';
import { PrismaService } from '@_/prisma/prisma.service';
import { Post, Prisma } from '@prisma/client';
import * as current from '@_/common/generate-datetime.util';
import { RepositoryBadGatewayException } from '@_/common/custom-error.util';
import { ICreatePostReq } from '../types/create-post.req.interface';
import { IUpdatePostReq } from '../types/update-post.req';

describe('PostRepository', () => {
  const mockPrismaService = {
    post: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const mockTx = {
    post: {
      create: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  let repository: PostRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<PostRepository>(PostRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const now = current.generateDatetime();
  const postId = 20;
  const userId = 1;
  const mockPost1: Post = {
    id: 1,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    authorId: 1,
    title: '제목이다',
    content: '본문이다',
  };
  const mockPost2: Post = {
    id: 2,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    authorId: 2,
    title: '제목이다',
    content: '본문이다',
  };
  const take = 10;
  const orderBy: Prisma.PostOrderByWithRelationInput = {
    id: 'desc',
  };
  const postsInclude: Prisma.PostInclude = {
    author: true,
  };
  const postInclude: Prisma.PostInclude = {
    author: true,
    comments: {
      take: 10,
      orderBy: {
        id: 'desc',
      },
      include: {
        author: true,
      },
    },
    tags: {
      include: {
        tag: true,
      },
    },
  };

  describe('findPostsByCursor, 입력: 커서 쿼리, 동작: 여러 게시글 찾아서 반환', () => {
    it('반환: 여러 게시글 객체 배열, 조건: db 통신 성공', async () => {
      const foundPosts = [mockPost1, mockPost2];
      const cursor = null;
      const skip = cursor ? 1 : 0;
      const optionalCursor = cursor && { cursor: { id: cursor } };
      const where: Prisma.PostWhereInput = {
        deletedAt: null,
      };
      mockPrismaService.post.findMany.mockResolvedValue(foundPosts);

      await expect(repository.findPostsByCursor({ take, cursor })).resolves.toEqual<Post[]>(foundPosts);
      expect(mockPrismaService.post.findMany).toHaveBeenCalledWith<[Prisma.PostFindManyArgs]>({
        where,
        orderBy,
        include: postsInclude,
        take,
        skip,
        ...optionalCursor,
      });
    });

    it('반환: BadGateWayError, 조건: db 통신 에러', async () => {
      const cursor = null;
      const skip = cursor ? 1 : 0;
      const optionalCursor = cursor && { cursor: { id: cursor } };
      const where: Prisma.PostWhereInput = {
        deletedAt: null,
      };
      mockPrismaService.post.findMany.mockRejectedValue(new Error());

      await expect(repository.findPostsByCursor({ take, cursor })).rejects.toThrow(RepositoryBadGatewayException);
      expect(mockPrismaService.post.findMany).toHaveBeenCalledWith<[Prisma.PostFindManyArgs]>({
        where,
        orderBy,
        include: postsInclude,
        take,
        skip,
        ...optionalCursor,
      });
    });
  });

  describe('findPosts, 입력: 페이지네이션 쿼리, 동작: 여러 게시글 찾아서 반환', () => {
    it('반환: 여러 게시글 객체 배열, 조건: db 통신 성공', async () => {
      const foundPosts = [mockPost1, mockPost2];
      const skip = 1;
      const where: Prisma.PostWhereInput = {
        deletedAt: null,
      };
      mockPrismaService.post.findMany.mockResolvedValue(foundPosts);

      await expect(repository.findPosts({ skip, take })).resolves.toEqual<Post[]>(foundPosts);
      expect(mockPrismaService.post.findMany).toHaveBeenCalledWith<[Prisma.PostFindManyArgs]>({
        where,
        orderBy,
        skip: 0,
        take,
        include: postsInclude,
      });
    });

    it('반환: BadGateWayError, 조건: db 통신 에러', async () => {
      const skip = 1;
      const where: Prisma.PostWhereInput = {
        deletedAt: null,
      };
      mockPrismaService.post.findMany.mockRejectedValue(new Error());

      await expect(repository.findPosts({ skip, take })).rejects.toThrow(RepositoryBadGatewayException);
      expect(mockPrismaService.post.findMany).toHaveBeenCalledWith<[Prisma.PostFindManyArgs]>({
        where,
        orderBy,
        skip: 0,
        take,
        include: postsInclude,
      });
    });
  });

  describe('findPost, 입력: 게시글 아이디, 동작: 단일 게시글 찾아서 반환', () => {
    it('반환: 단일 게시글 객체, 조건: db 통신 성공', async () => {
      const foundPost = mockPost1;
      const where: Prisma.PostWhereUniqueInput = {
        id: postId,
        deletedAt: null,
      };
      mockPrismaService.post.findUnique.mockResolvedValue(foundPost);

      await expect(repository.findPost(postId)).resolves.toEqual<Post>(foundPost);
      expect(mockPrismaService.post.findUnique).toHaveBeenCalledWith<[Prisma.PostFindUniqueArgs]>({
        where,
        include: postInclude,
      });
    });

    it('반환: BadGateWayError, 조건: db 통신 에러', async () => {
      const where: Prisma.PostWhereUniqueInput = {
        id: postId,
        deletedAt: null,
      };
      mockPrismaService.post.findUnique.mockRejectedValue(new Error());

      await expect(repository.findPost(postId)).rejects.toThrow(RepositoryBadGatewayException);
      expect(mockPrismaService.post.findUnique).toHaveBeenCalledWith<[Prisma.PostFindUniqueArgs]>({
        where,
        include: postInclude,
      });
    });
  });

  describe('createPost, 입력: 트랜잭션 객체 & 생성 데이터, 동작: 단일 게시글 생성 후 반환', () => {
    it('반환: 단일 게시글 객체, 조건: db 통신 성공', async () => {
      const createdPost = mockPost1;
      const data: ICreatePostReq = {
        authorId: mockPost1.authorId,
        title: mockPost1.title,
        content: mockPost1.content,
      };
      mockTx.post.create.mockResolvedValue(createdPost);

      await expect(repository.createPost(mockTx, data)).resolves.toEqual<Post>(createdPost);
      expect(mockTx.post.create).toHaveBeenCalledWith<[Prisma.PostCreateArgs]>({
        data,
      });
    });

    it('반환: BadGateWayError, 조건: db 통신 에러', async () => {
      const data: ICreatePostReq = {
        authorId: mockPost1.authorId,
        title: mockPost1.title,
        content: mockPost1.content,
      };
      mockTx.post.create.mockRejectedValue(new Error());

      await expect(repository.createPost(mockTx, data)).rejects.toThrow(RepositoryBadGatewayException);
      expect(mockTx.post.create).toHaveBeenCalledWith<[Prisma.PostCreateArgs]>({
        data,
      });
    });
  });

  describe('updatePost, 입력: 수정 데이터 & 게시글 아이디 & 유저 아이디, 동작: 게시글 수정 후 결과 반환', () => {
    it('반환: 수정 결과 개수 객체, 조건: db 통신 성공', async () => {
      const updatedResult: Prisma.BatchPayload = { count: 1 };
      const data: IUpdatePostReq = {
        content: '수정한다',
      };
      const where: Prisma.PostWhereInput = {
        id: postId,
        authorId: userId,
        deletedAt: null,
      };
      mockTx.post.updateMany.mockResolvedValue(updatedResult);

      await expect(
        repository.updatePost(mockTx as unknown as Prisma.TransactionClient, {
          data,
          postId,
          userId,
        }),
      ).resolves.toEqual<Prisma.BatchPayload>(updatedResult);
      expect(mockTx.post.updateMany).toHaveBeenCalledWith<[Prisma.PostUpdateManyArgs]>({ where, data });
    });

    it('반환: BadGateWayError, 조건: db 통신 에러', async () => {
      const data: IUpdatePostReq = {
        content: '수정한다',
      };
      const where: Prisma.PostWhereInput = {
        id: postId,
        authorId: userId,
        deletedAt: null,
      };
      mockTx.post.updateMany.mockRejectedValue(new Error());

      await expect(
        repository.updatePost(mockTx as unknown as Prisma.TransactionClient, {
          data,
          postId,
          userId,
        }),
      ).rejects.toThrow(RepositoryBadGatewayException);
      expect(mockTx.post.updateMany).toHaveBeenCalledWith<[Prisma.PostUpdateManyArgs]>({ where, data });
    });
  });

  describe('deletePost, 입력: 트랜잭션 객체 & 유저 아이디 & 게시글 아이디, 동작: 삭제 후 결과 반환', () => {
    it('반환: 삭제 결과 개수 객체, 조건: db 통신 성공', async () => {
      const deletedResult: Prisma.BatchPayload = { count: 1 };
      const where: Prisma.PostWhereInput = {
        id: postId,
        authorId: userId,
        deletedAt: null,
      };
      const data: Prisma.PostUpdateInput = {
        deletedAt: now,
      };
      jest.spyOn(current, 'generateDatetime').mockReturnValue(now);
      mockTx.post.updateMany.mockResolvedValue(deletedResult);

      await expect(
        repository.deletePost(mockTx as unknown as Prisma.TransactionClient, {
          userId,
          postId,
        }),
      ).resolves.toEqual<Prisma.BatchPayload>(deletedResult);
      expect(mockTx.post.updateMany).toHaveBeenCalledWith<[Prisma.PostUpdateManyArgs]>({ where, data });
    });

    it('반환: BadGateWayError, 조건: db 통신 에러', async () => {
      const where: Prisma.PostWhereInput = {
        id: postId,
        authorId: userId,
        deletedAt: null,
      };
      const data: Prisma.PostUpdateInput = {
        deletedAt: now,
      };
      jest.spyOn(current, 'generateDatetime').mockReturnValue(now);
      mockTx.post.updateMany.mockRejectedValue(new Error());

      await expect(
        repository.deletePost(mockTx as unknown as Prisma.TransactionClient, {
          userId,
          postId,
        }),
      ).rejects.toThrow(RepositoryBadGatewayException);
      expect(mockTx.post.updateMany).toHaveBeenCalledWith<[Prisma.PostUpdateManyArgs]>({ where, data });
    });
  });
});

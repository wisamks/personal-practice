import { Body, Controller, Logger, Post, UseGuards } from "@nestjs/common";
import { S3FileService } from "./s3-file.service";
import { JwtAuthGuard } from "@_/auth/guards/jwt-auth.guard";
import { PATH_ROUTES } from "@_/common/constants/common.constant";
import { GetPresignedUrlReqDto } from "./dto/request/get-presigned-url.req.dto";
import { GetPresignedUrlResDto } from "./dto/response/get-presigned-url.res.dto";

@Controller(PATH_ROUTES.S3)
export class S3FileController {
    private readonly logger = new Logger(S3FileController.name);

    constructor(
        private readonly s3FileService: S3FileService,
    ) {}

    @Post()
    @UseGuards(JwtAuthGuard)
    async getPresignedUrl(
        @Body() getPresignedUrlReqDto: GetPresignedUrlReqDto,
    ): Promise<GetPresignedUrlResDto> {
        return await this.s3FileService.getPresignedUrl(getPresignedUrlReqDto);
    }
}
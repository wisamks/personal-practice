import { RepositoryBadGatewayException } from "@_/common/custom-error.util";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Injectable, Logger } from "@nestjs/common";
import { PRESIGNED_URL } from "./constants/s3-file.constant";
import { ConfigService } from "@nestjs/config";
import { GetPresignedUrlReqDto } from "./dto/request/get-presigned-url.req.dto";
import { plainToInstance } from "class-transformer";
import { GetPresignedUrlResDto } from "./dto/response/get-presigned-url.res.dto";
import { generateNow } from "@_/common/generate-now.util";

@Injectable()
export class S3FileService {
    private readonly logger = new Logger(S3FileService.name);

    constructor(
        private readonly s3Client: S3Client,
        private readonly configService: ConfigService,
    ) {}

    async getPresignedUrl({ fileName }: GetPresignedUrlReqDto): Promise<GetPresignedUrlResDto> {
        const generatedFileName = `${generateNow()}-${fileName}`;
        const command = new PutObjectCommand({
            Bucket: this.configService.get<string>('S3_BUCKET_NAME'),
            Key: `s3-cloudfront/${generatedFileName}`,
        });
        
        try {
            const presignedUrl = await getSignedUrl(this.s3Client, command, { expiresIn: PRESIGNED_URL.ONE_MINUTE_BY_SECOND });
            
            const cloudfrontUrl = this.configService.get<string>('S3_CLOUDFRONT_URL');
            const generatedS3FileUrl = `${cloudfrontUrl}/${generatedFileName}`;

            return plainToInstance(GetPresignedUrlResDto, { presignedUrl, generatedS3FileUrl });
        } catch(err) {
            this.logger.error(err);
            throw new RepositoryBadGatewayException(err.message);
        }
    }
}
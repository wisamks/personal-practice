import { S3Client } from "@aws-sdk/client-s3";
import { Module } from "@nestjs/common";
import { S3FileController } from "./s3-file.controller";
import { S3FileService } from "./s3-file.service";

@Module({
    controllers: [S3FileController],
    providers: [
        S3FileService,
        {
            provide: S3Client,
            useValue: new S3Client()
        },
    ],
    exports: [S3FileService],
})
export class S3FileModule {}
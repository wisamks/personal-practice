import { Module } from "@nestjs/common";
import { AwsService } from "./aws.service";

@Module({
    providers: [],
    exports: [AwsService],
})
export class AwsModule {}
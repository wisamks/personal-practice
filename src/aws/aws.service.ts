import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class AwsService {
    private readonly logger = new Logger(AwsService.name);

    constructor() {}
}
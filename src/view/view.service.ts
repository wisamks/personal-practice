import { Injectable, Logger } from "@nestjs/common";
import { ViewRepository } from "./view.repository";
import { VIEW_SERVICE } from "./constants/view.constant";
import { CreateViewInputType } from "./types/create-view.input";

@Injectable()
export class ViewService {
    private readonly logger = new Logger(VIEW_SERVICE);

    constructor(
        private readonly viewRepository: ViewRepository,
    ) {}


    async createView(data: CreateViewInputType): Promise<void> {
        await this.viewRepository.createView(data);
        return;
    }
}
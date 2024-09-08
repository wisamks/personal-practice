import { Module } from "@nestjs/common";
import { ViewRepository } from "./view.repository";
import { ViewService } from "./view.service";

@Module({
    providers: [ViewService, ViewRepository],
    exports: [ViewService, ViewRepository]
})
export class ViewModule {}
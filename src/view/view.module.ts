import { Module } from "@nestjs/common";
import { ViewRepository } from "./view.repository";
import { ViewService } from "./view.service";
import { ViewScheduleService } from "./view-schedule.service";

@Module({
    providers: [ViewService, ViewRepository, ViewScheduleService],
    exports: [ViewService, ViewRepository, ViewScheduleService]
})
export class ViewModule {}
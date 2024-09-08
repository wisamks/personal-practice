import { PrismaModule } from "@_/prisma/prisma.module";
import { Module } from "@nestjs/common";
import { ViewRepository } from "./view.repository";
import { ViewService } from "./view.service";

@Module({
    imports: [
        PrismaModule,
    ],
    providers: [ViewService, ViewRepository],
})
export class ViewModule {}
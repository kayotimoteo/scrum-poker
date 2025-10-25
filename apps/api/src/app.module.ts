import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module";
import { MainGateway } from "./main.gateway";

@Module({
  imports: [HealthModule],
  controllers: [],
  providers: [MainGateway],
})
export class AppModule {}

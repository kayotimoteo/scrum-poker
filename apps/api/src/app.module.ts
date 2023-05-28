import { Module } from "@nestjs/common";
import { MainGateway } from "./main.gateway";

@Module({
  imports: [],
  controllers: [],
  providers: [MainGateway],
})
export class AppModule {}

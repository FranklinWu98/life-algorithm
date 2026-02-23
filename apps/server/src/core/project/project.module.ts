import { Module } from '@nestjs/common';
import { DomainController } from './domain.controller';
import { DomainService } from './domain.service';
import { MissionController } from './mission.controller';
import { MissionService } from './mission.service';
import { DomainRepo } from '@docmost/db/repos/project/domain.repo';
import { MissionRepo } from '@docmost/db/repos/project/mission.repo';

@Module({
  controllers: [DomainController, MissionController],
  providers: [
    DomainService,
    MissionService,
    DomainRepo,
    MissionRepo,
  ],
  exports: [DomainService, MissionService],
})
export class ProjectModule {}

import { Module } from '@nestjs/common';
import { DomainController } from './domain.controller';
import { DomainService } from './domain.service';
import { MissionController } from './mission.controller';
import { MissionService } from './mission.service';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { DomainRepo } from '@docmost/db/repos/project/domain.repo';
import { MissionRepo } from '@docmost/db/repos/project/mission.repo';
import { TaskRepo } from '@docmost/db/repos/project/task.repo';
import { TaskNoteRepo } from '@docmost/db/repos/project/task-note.repo';

@Module({
  controllers: [DomainController, MissionController, TaskController],
  providers: [
    DomainService,
    MissionService,
    TaskService,
    DomainRepo,
    MissionRepo,
    TaskRepo,
    TaskNoteRepo,
  ],
  exports: [DomainService, MissionService, TaskService],
})
export class ProjectModule {}

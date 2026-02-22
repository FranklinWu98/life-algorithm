import { Injectable, NotFoundException } from '@nestjs/common';
import { TaskRepo } from '@docmost/db/repos/project/task.repo';
import { TaskNoteRepo } from '@docmost/db/repos/project/task-note.repo';
import { MissionRepo } from '@docmost/db/repos/project/mission.repo';
import { Task, TaskNote, User } from '@docmost/db/types/entity.types';
import {
  CreateTaskDto,
  UpdateTaskDto,
  UpdateTaskNoteDto,
} from './dto/task.dto';

@Injectable()
export class TaskService {
  constructor(
    private readonly taskRepo: TaskRepo,
    private readonly taskNoteRepo: TaskNoteRepo,
    private readonly missionRepo: MissionRepo,
  ) {}

  async create(
    user: User,
    workspaceId: string,
    dto: CreateTaskDto,
  ): Promise<Task> {
    const mission = await this.missionRepo.findById(dto.missionId, workspaceId);
    if (!mission) {
      throw new NotFoundException('Mission not found');
    }

    return this.taskRepo.insertTask({
      name: dto.name,
      status: dto.status ?? 'not_started',
      importantLevel: dto.importantLevel ?? 0,
      timeToDoStart: dto.timeToDoStart ? new Date(dto.timeToDoStart) : null,
      timeToDoEnd: dto.timeToDoEnd ? new Date(dto.timeToDoEnd) : null,
      finishTime: null,
      sortOrder: dto.sortOrder ?? 0,
      missionId: dto.missionId,
      workspaceId,
      creatorId: user.id,
    });
  }

  async getByMission(
    missionId: string,
    workspaceId: string,
    status?: string,
  ): Promise<Task[]> {
    const mission = await this.missionRepo.findById(missionId, workspaceId);
    if (!mission) {
      throw new NotFoundException('Mission not found');
    }
    return this.taskRepo.findByMission(missionId, workspaceId, { status });
  }

  async getById(taskId: string, workspaceId: string): Promise<Task> {
    const task = await this.taskRepo.findById(taskId, workspaceId, {
      includeNote: true,
      includeCreator: true,
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async update(
    taskId: string,
    workspaceId: string,
    dto: UpdateTaskDto,
  ): Promise<void> {
    const task = await this.taskRepo.findById(taskId, workspaceId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (dto.missionId) {
      const mission = await this.missionRepo.findById(
        dto.missionId,
        workspaceId,
      );
      if (!mission) {
        throw new NotFoundException('Mission not found');
      }
    }

    // Auto-set finishTime when marking completed
    let finishTime = dto.finishTime ? new Date(dto.finishTime) : undefined;
    if (dto.status === 'completed' && !task.finishTime && !finishTime) {
      finishTime = new Date();
    }
    if (dto.status && dto.status !== 'completed' && task.finishTime) {
      finishTime = null;
    }

    await this.taskRepo.updateTask(
      {
        name: dto.name,
        status: dto.status,
        importantLevel: dto.importantLevel,
        timeToDoStart: dto.timeToDoStart
          ? new Date(dto.timeToDoStart)
          : undefined,
        timeToDoEnd: dto.timeToDoEnd ? new Date(dto.timeToDoEnd) : undefined,
        finishTime,
        sortOrder: dto.sortOrder,
        missionId: dto.missionId,
      },
      taskId,
    );
  }

  async remove(taskId: string, workspaceId: string): Promise<void> {
    const task = await this.taskRepo.findById(taskId, workspaceId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    await this.taskRepo.softDelete(taskId);
  }

  async getNote(
    taskId: string,
    workspaceId: string,
  ): Promise<TaskNote | undefined> {
    await this.getById(taskId, workspaceId);
    return this.taskNoteRepo.findByTaskId(taskId);
  }

  async updateNote(
    taskId: string,
    workspaceId: string,
    dto: UpdateTaskNoteDto,
  ): Promise<TaskNote> {
    await this.getById(taskId, workspaceId);

    return this.taskNoteRepo.upsertNote({
      taskId,
      content: (dto.content as import('@docmost/db/types/db').Json) ?? null,
      textContent: dto.textContent ?? null,
      ydoc: null,
      tsv: null,
      version: 1,
    });
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TaskService } from './task.service';
import {
  CreateTaskDto,
  TaskIdDto,
  UpdateTaskDto,
  UpdateTaskNoteDto,
} from './dto/task.dto';
import { AuthUser } from '../../common/decorators/auth-user.decorator';
import { AuthWorkspace } from '../../common/decorators/auth-workspace.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User, Workspace } from '@docmost/db/types/entity.types';
import { IsOptional, IsString, IsUUID } from 'class-validator';

class TasksQueryDto {
  @IsOptional()
  @IsUUID()
  missionId?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post()
  async create(
    @Body() dto: CreateTaskDto,
    @AuthUser() user: User,
    @AuthWorkspace() workspace: Workspace,
  ) {
    return this.taskService.create(user, workspace.id, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Get()
  async getByMission(
    @Query() query: TasksQueryDto,
    @AuthWorkspace() workspace: Workspace,
  ) {
    return this.taskService.getByMission(
      query.missionId,
      workspace.id,
      query.status,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Get(':taskId')
  async getById(
    @Param() params: TaskIdDto,
    @AuthWorkspace() workspace: Workspace,
  ) {
    return this.taskService.getById(params.taskId, workspace.id);
  }

  @HttpCode(HttpStatus.OK)
  @Put(':taskId')
  async update(
    @Param() params: TaskIdDto,
    @Body() dto: UpdateTaskDto,
    @AuthWorkspace() workspace: Workspace,
  ) {
    await this.taskService.update(params.taskId, workspace.id, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':taskId')
  async remove(
    @Param() params: TaskIdDto,
    @AuthWorkspace() workspace: Workspace,
  ) {
    await this.taskService.remove(params.taskId, workspace.id);
  }

  // Task note endpoints
  @HttpCode(HttpStatus.OK)
  @Get(':taskId/note')
  async getNote(
    @Param() params: TaskIdDto,
    @AuthWorkspace() workspace: Workspace,
  ) {
    return this.taskService.getNote(params.taskId, workspace.id);
  }

  @HttpCode(HttpStatus.OK)
  @Put(':taskId/note')
  async updateNote(
    @Param() params: TaskIdDto,
    @Body() dto: UpdateTaskNoteDto,
    @AuthWorkspace() workspace: Workspace,
  ) {
    return this.taskService.updateNote(params.taskId, workspace.id, dto);
  }
}

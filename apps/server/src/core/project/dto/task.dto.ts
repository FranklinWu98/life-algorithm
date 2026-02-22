import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export const TASK_STATUSES = ['not_started', 'in_progress', 'completed', 'cancelled'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsIn(TASK_STATUSES)
  status?: TaskStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(4)
  importantLevel?: number;

  @IsOptional()
  @IsDateString()
  timeToDoStart?: string;

  @IsOptional()
  @IsDateString()
  timeToDoEnd?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsUUID()
  missionId: string;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsIn(TASK_STATUSES)
  status?: TaskStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(4)
  importantLevel?: number;

  @IsOptional()
  @IsDateString()
  timeToDoStart?: string;

  @IsOptional()
  @IsDateString()
  timeToDoEnd?: string;

  @IsOptional()
  @IsDateString()
  finishTime?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsUUID()
  missionId?: string;
}

export class TaskIdDto {
  @IsUUID()
  taskId: string;
}

export class UpdateTaskNoteDto {
  @IsOptional()
  content?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  textContent?: string;
}

import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';

export type ContentFormat = 'json' | 'markdown' | 'html';

export const TASK_STATUSES = ['not_started', 'in_progress', 'completed', 'cancelled'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export class CreatePageDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  parentPageId?: string;

  @IsUUID()
  spaceId: string;

  @IsOptional()
  content?: string | object;

  @ValidateIf((o) => o.content !== undefined)
  @Transform(({ value }) => value?.toLowerCase() ?? 'json')
  @IsIn(['json', 'markdown', 'html'])
  format?: ContentFormat;

  // Task properties — only meaningful when missionId is set
  @IsOptional()
  @IsUUID()
  missionId?: string;

  @IsOptional()
  @IsIn(TASK_STATUSES)
  taskStatus?: TaskStatus;

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
}

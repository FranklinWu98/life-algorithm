import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export const MISSION_STATUSES = ['active', 'completed', 'archived', 'cancelled'] as const;
export type MissionStatus = (typeof MISSION_STATUSES)[number];

export class CreateMissionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(MISSION_STATUSES)
  status?: MissionStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsUUID()
  domainId: string;

  @IsUUID()
  spaceId: string;
}

export class UpdateMissionDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(MISSION_STATUSES)
  status?: MissionStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsUUID()
  domainId?: string;
}

export class MissionIdDto {
  @IsUUID()
  missionId: string;
}

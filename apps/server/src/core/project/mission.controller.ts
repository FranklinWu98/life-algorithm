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
import { MissionService } from './mission.service';
import {
  CreateMissionDto,
  MissionIdDto,
  UpdateMissionDto,
} from './dto/mission.dto';
import { AuthUser } from '../../common/decorators/auth-user.decorator';
import { AuthWorkspace } from '../../common/decorators/auth-workspace.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User, Workspace } from '@docmost/db/types/entity.types';
import { IsOptional, IsUUID } from 'class-validator';

class MissionsQueryDto {
  @IsOptional()
  @IsUUID()
  domainId?: string;
}

@UseGuards(JwtAuthGuard)
@Controller('missions')
export class MissionController {
  constructor(private readonly missionService: MissionService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post()
  async create(
    @Body() dto: CreateMissionDto,
    @AuthUser() user: User,
    @AuthWorkspace() workspace: Workspace,
  ) {
    return this.missionService.create(user, workspace.id, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Get()
  async getByDomain(
    @Query() query: MissionsQueryDto,
    @AuthWorkspace() workspace: Workspace,
  ) {
    return this.missionService.getByDomain(query.domainId, workspace.id);
  }

  @HttpCode(HttpStatus.OK)
  @Get(':missionId')
  async getById(
    @Param() params: MissionIdDto,
    @AuthWorkspace() workspace: Workspace,
  ) {
    return this.missionService.getById(params.missionId, workspace.id);
  }

  @HttpCode(HttpStatus.OK)
  @Put(':missionId')
  async update(
    @Param() params: MissionIdDto,
    @Body() dto: UpdateMissionDto,
    @AuthWorkspace() workspace: Workspace,
  ) {
    await this.missionService.update(params.missionId, workspace.id, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':missionId')
  async remove(
    @Param() params: MissionIdDto,
    @AuthWorkspace() workspace: Workspace,
  ) {
    await this.missionService.remove(params.missionId, workspace.id);
  }
}

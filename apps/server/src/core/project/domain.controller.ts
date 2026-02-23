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
import { DomainService } from './domain.service';
import { CreateDomainDto, DomainIdDto, UpdateDomainDto } from './dto/domain.dto';
import { AuthUser } from '../../common/decorators/auth-user.decorator';
import { AuthWorkspace } from '../../common/decorators/auth-workspace.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User, Workspace } from '@docmost/db/types/entity.types';
import { IsUUID } from 'class-validator';

class SpaceQueryDto {
  @IsUUID()
  spaceId: string;
}

@UseGuards(JwtAuthGuard)
@Controller('domains')
export class DomainController {
  constructor(private readonly domainService: DomainService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post()
  async create(
    @Body() dto: CreateDomainDto,
    @AuthUser() user: User,
    @AuthWorkspace() workspace: Workspace,
  ) {
    return this.domainService.create(user, workspace.id, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Get()
  async getAll(@Query() query: SpaceQueryDto) {
    return this.domainService.getAll(query.spaceId);
  }

  @HttpCode(HttpStatus.OK)
  @Get(':domainId')
  async getById(
    @Param() params: DomainIdDto,
    @Query() query: SpaceQueryDto,
  ) {
    return this.domainService.getById(params.domainId, query.spaceId);
  }

  @HttpCode(HttpStatus.OK)
  @Put(':domainId')
  async update(
    @Param() params: DomainIdDto,
    @Body() dto: UpdateDomainDto,
    @Query() query: SpaceQueryDto,
  ) {
    await this.domainService.update(params.domainId, query.spaceId, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':domainId')
  async remove(
    @Param() params: DomainIdDto,
    @Query() query: SpaceQueryDto,
  ) {
    await this.domainService.remove(params.domainId, query.spaceId);
  }
}

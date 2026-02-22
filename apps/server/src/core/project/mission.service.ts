import { Injectable, NotFoundException } from '@nestjs/common';
import { MissionRepo } from '@docmost/db/repos/project/mission.repo';
import { DomainRepo } from '@docmost/db/repos/project/domain.repo';
import { Mission, User } from '@docmost/db/types/entity.types';
import { CreateMissionDto, UpdateMissionDto } from './dto/mission.dto';

@Injectable()
export class MissionService {
  constructor(
    private readonly missionRepo: MissionRepo,
    private readonly domainRepo: DomainRepo,
  ) {}

  async create(
    user: User,
    workspaceId: string,
    dto: CreateMissionDto,
  ): Promise<Mission> {
    const domain = await this.domainRepo.findById(dto.domainId, workspaceId);
    if (!domain) {
      throw new NotFoundException('Domain not found');
    }

    return this.missionRepo.insertMission({
      name: dto.name,
      description: dto.description ?? null,
      status: dto.status ?? 'active',
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      sortOrder: dto.sortOrder ?? 0,
      domainId: dto.domainId,
      workspaceId,
      creatorId: user.id,
    });
  }

  async getByDomain(domainId: string, workspaceId: string): Promise<Mission[]> {
    const domain = await this.domainRepo.findById(domainId, workspaceId);
    if (!domain) {
      throw new NotFoundException('Domain not found');
    }
    return this.missionRepo.findByDomain(domainId, workspaceId);
  }

  async getById(missionId: string, workspaceId: string): Promise<Mission> {
    const mission = await this.missionRepo.findById(missionId, workspaceId);
    if (!mission) {
      throw new NotFoundException('Mission not found');
    }
    return mission;
  }

  async update(
    missionId: string,
    workspaceId: string,
    dto: UpdateMissionDto,
  ): Promise<void> {
    const mission = await this.missionRepo.findById(missionId, workspaceId);
    if (!mission) {
      throw new NotFoundException('Mission not found');
    }

    if (dto.domainId) {
      const domain = await this.domainRepo.findById(dto.domainId, workspaceId);
      if (!domain) {
        throw new NotFoundException('Domain not found');
      }
    }

    await this.missionRepo.updateMission(
      {
        name: dto.name,
        description: dto.description,
        status: dto.status,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        sortOrder: dto.sortOrder,
        domainId: dto.domainId,
      },
      missionId,
    );
  }

  async remove(missionId: string, workspaceId: string): Promise<void> {
    const mission = await this.missionRepo.findById(missionId, workspaceId);
    if (!mission) {
      throw new NotFoundException('Mission not found');
    }
    await this.missionRepo.softDelete(missionId);
  }
}

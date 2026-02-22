import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DomainRepo } from '@docmost/db/repos/project/domain.repo';
import { Domain, User } from '@docmost/db/types/entity.types';
import { CreateDomainDto, UpdateDomainDto } from './dto/domain.dto';

@Injectable()
export class DomainService {
  constructor(private readonly domainRepo: DomainRepo) {}

  async create(
    user: User,
    workspaceId: string,
    dto: CreateDomainDto,
  ): Promise<Domain> {
    return this.domainRepo.insertDomain({
      name: dto.name,
      description: dto.description ?? null,
      color: dto.color ?? null,
      sortOrder: dto.sortOrder ?? 0,
      workspaceId,
      creatorId: user.id,
    });
  }

  async getAll(workspaceId: string): Promise<Domain[]> {
    return this.domainRepo.findByWorkspace(workspaceId);
  }

  async getById(domainId: string, workspaceId: string): Promise<Domain> {
    const domain = await this.domainRepo.findById(domainId, workspaceId);
    if (!domain) {
      throw new NotFoundException('Domain not found');
    }
    return domain;
  }

  async update(
    domainId: string,
    workspaceId: string,
    dto: UpdateDomainDto,
  ): Promise<void> {
    const domain = await this.domainRepo.findById(domainId, workspaceId);
    if (!domain) {
      throw new NotFoundException('Domain not found');
    }
    await this.domainRepo.updateDomain(
      {
        name: dto.name,
        description: dto.description,
        color: dto.color,
        sortOrder: dto.sortOrder,
      },
      domainId,
    );
  }

  async remove(domainId: string, workspaceId: string): Promise<void> {
    const domain = await this.domainRepo.findById(domainId, workspaceId);
    if (!domain) {
      throw new NotFoundException('Domain not found');
    }
    await this.domainRepo.softDelete(domainId);
  }
}

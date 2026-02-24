import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @HttpCode(HttpStatus.OK)
  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }

  @HttpCode(HttpStatus.OK)
  @Get('activity')
  async getRecentActivity() {
    return this.adminService.getRecentActivity();
  }

  @HttpCode(HttpStatus.OK)
  @Get('health')
  async getHealth() {
    return this.adminService.getHealth();
  }

  @HttpCode(HttpStatus.OK)
  @Get('users')
  async getUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    return this.adminService.getUsers(Number(page), Number(limit));
  }

  @HttpCode(HttpStatus.OK)
  @Get('users/:userId')
  async getUserById(@Param('userId') userId: string) {
    const user = await this.adminService.getUserById(userId);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  @HttpCode(HttpStatus.OK)
  @Patch('users/:userId')
  async updateUser(
    @Param('userId') userId: string,
    @Body() body: { name?: string; email?: string; role?: string },
  ) {
    return this.adminService.updateUser(userId, body);
  }

  @HttpCode(HttpStatus.OK)
  @Patch('users/:userId/deactivate')
  async deactivateUser(
    @Param('userId') userId: string,
    @Body() body: { deactivate: boolean },
  ) {
    return this.adminService.setUserDeactivated(userId, body.deactivate);
  }

  @HttpCode(HttpStatus.OK)
  @Get('system')
  async getSystem() {
    const [env, recentLogins] = await Promise.all([
      this.adminService.getSystemEnv(),
      this.adminService.getRecentLogins(),
    ]);
    return { env, recentLogins };
  }
}

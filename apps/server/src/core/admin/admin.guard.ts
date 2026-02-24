import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Guard that allows access only to users whose email is listed in the
 * ADMIN_EMAILS environment variable (comma-separated).
 *
 * Example: ADMIN_EMAILS=alice@example.com,bob@example.com
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request?.user?.user;

    if (!user) {
      throw new ForbiddenException('Not authenticated');
    }

    const adminEmails = this.configService
      .get<string>('ADMIN_EMAILS', '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (!adminEmails.includes(user.email?.toLowerCase())) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}

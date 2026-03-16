import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('jobs/top')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Top 5 ofertas más vistas' })
  getTopJobs() {
    return this.analyticsService.getTopJobs();
  }

  @Get('jobs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Estadísticas de una oferta' })
  getJobStats(@Param('id') id: string) {
    return this.analyticsService.getJobStats(id);
  }
}

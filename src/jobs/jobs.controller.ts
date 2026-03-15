import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { User, UserRole } from '../users/entities/user.entity';
import { ApplyJobDto } from './dto/apply-job.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { FilterJobDto } from './dto/filter-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobsService } from './jobs.service';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar ofertas con filtros y paginación' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'location', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(@Query() filters: FilterJobDto) {
    return this.jobsService.findAll(filters);
  }

  @Get('my/applications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CANDIDATE)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Ver mis aplicaciones (candidato)' })
  getMyApplications(@GetUser() user: User) {
    return this.jobsService.getMyApplications(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver detalle de una oferta' })
  findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Publicar nueva oferta (solo empresas)' })
  @ApiResponse({ status: 201, description: 'Oferta creada' })
  create(@Body() createJobDto: CreateJobDto, @GetUser() user: User) {
    return this.jobsService.create(createJobDto, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar oferta (solo el creador)' })
  update(
    @Param('id') id: string,
    @Body() updateJobDto: UpdateJobDto,
    @GetUser() user: User,
  ) {
    return this.jobsService.update(id, updateJobDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Eliminar oferta (solo el creador)' })
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.jobsService.remove(id, user);
  }

  @Post('apply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CANDIDATE)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Aplicar a una oferta (solo candidatos)' })
  apply(@Body() applyJobDto: ApplyJobDto, @GetUser() user: User) {
    return this.jobsService.apply(applyJobDto, user);
  }

  @Get(':id/applications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Ver aplicaciones de una oferta (solo empresa)' })
  getApplications(@Param('id') id: string, @GetUser() user: User) {
    return this.jobsService.getApplications(id, user);
  }
}

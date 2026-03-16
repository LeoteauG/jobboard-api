import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CacheService } from 'src/cache/cache.service';
import { ILike, Repository } from 'typeorm';
import { MailService } from '../mail/mail.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { User, UserRole } from '../users/entities/user.entity';
import { ApplyJobDto } from './dto/apply-job.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { FilterJobDto } from './dto/filter-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { Application } from './entities/application.entity';
import { Job, JobStatus } from './entities/job.entity';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    private readonly notificationsService: NotificationsService,
    private readonly mailService: MailService,
    private readonly cacheService: CacheService,
  ) {}

  // ── Crear oferta (solo empresas) ──────────────────────────────
  async create(createJobDto: CreateJobDto, user: User): Promise<Job> {
    const job = this.jobRepository.create({
      ...createJobDto,
      postedBy: user,
    });

    const saved = await this.jobRepository.save(job);
    await this.cacheService.reset();
    return saved;
  }

  // ── Listar ofertas con filtros y paginación ───────────────────
  async findAll(filters: FilterJobDto) {
    const cacheKey = `jobs_${JSON.stringify(filters)}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const { search, location, status, page, limit } = filters;
    const skip = ((page ?? 1) - 1) * (limit ?? 10);
    const where: any = {};

    if (search) where.title = ILike(`%${search}%`);
    if (location) where.location = ILike(`%${location}%`);
    if (status) where.status = status;
    if (!status) where.status = JobStatus.OPEN;

    const [jobs, total] = await this.jobRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const result = {
      data: jobs,
      meta: {
        total,
        page: page ?? 1,
        limit: limit ?? 10,
        totalPages: Math.ceil(total / (limit ?? 10)),
      },
    };

    await this.cacheService.set(cacheKey, result, 60);
    return result;
  }

  // ── Ver detalle de una oferta ─────────────────────────────────
  async findOne(id: string): Promise<Job> {
    const job = await this.jobRepository.findOne({
      where: { id },
      relations: ['postedBy'],
    });

    if (!job) throw new NotFoundException('Oferta no encontrada');

    return job;
  }

  // ── Actualizar oferta (solo el creador) ───────────────────────
  async update(
    id: string,
    updateJobDto: UpdateJobDto,
    user: User,
  ): Promise<Job> {
    const job = await this.findOne(id);

    if (job.postedBy.id !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('No tienes permiso para editar esta oferta');
    }

    Object.assign(job, updateJobDto);
    return this.jobRepository.save(job);
  }

  // ── Eliminar oferta (solo el creador o admin) ─────────────────
  async remove(id: string, user: User): Promise<void> {
    const job = await this.findOne(id);

    if (job.postedBy.id !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'No tienes permiso para eliminar esta oferta',
      );
    }
    // Al final de remove():
    await this.jobRepository.remove(job);
    await this.cacheService.reset();
  }

  // ── Aplicar a una oferta ──────────────────────────────────────
  async apply(applyJobDto: ApplyJobDto, user: User): Promise<Application> {
    const job = await this.findOne(applyJobDto.jobId);

    if (job.status !== JobStatus.OPEN) {
      throw new ForbiddenException('Esta oferta no está disponible');
    }

    const alreadyApplied = await this.applicationRepository.findOne({
      where: { job: { id: job.id }, candidate: { id: user.id } },
    });

    if (alreadyApplied) {
      throw new ConflictException('Ya aplicaste a esta oferta');
    }

    const application = this.applicationRepository.create({
      job,
      candidate: user,
      cvUrl: applyJobDto.cvUrl,
    });

    await this.notificationsService.create(
      job.postedBy,
      NotificationType.APPLICATION_RECEIVED,
      `${user.email} aplicó a tu oferta "${job.title}"`,
      application.id,
    );

    // Enviar email async a la empresa
    await this.mailService.sendApplicationNotification(
      job.postedBy.email,
      job.title,
      user.email,
    );

    return this.applicationRepository.save(application);
  }

  // ── Ver aplicaciones de una oferta (solo empresa dueña) ───────
  async getApplications(jobId: string, user: User): Promise<Application[]> {
    const job = await this.findOne(jobId);

    if (job.postedBy.id !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'No tienes permiso para ver estas aplicaciones',
      );
    }

    return this.applicationRepository.find({
      where: { job: { id: jobId } },
      relations: ['candidate'],
      order: { appliedAt: 'DESC' },
    });
  }

  // ── Ver mis aplicaciones (candidato) ──────────────────────────
  async getMyApplications(user: User): Promise<Application[]> {
    return this.applicationRepository.find({
      where: { candidate: { id: user.id } },
      relations: ['job'],
      order: { appliedAt: 'DESC' },
    });
  }
}

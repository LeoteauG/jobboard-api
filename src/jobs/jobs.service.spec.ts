import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UserRole } from '../users/entities/user.entity';
import { Application } from './entities/application.entity';
import { Job, JobStatus } from './entities/job.entity';
import { JobsService } from './jobs.service';

const mockUser = {
  id: 'user-123',
  email: 'empresa@test.com',
  role: UserRole.COMPANY,
};

const mockJob = {
  id: 'job-123',
  title: 'Backend Developer',
  status: JobStatus.OPEN,
  postedBy: mockUser,
};

const mockJobRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  remove: jest.fn(),
};

const mockApplicationRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
};

describe('JobsService', () => {
  let service: JobsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        { provide: getRepositoryToken(Job), useValue: mockJobRepository },
        {
          provide: getRepositoryToken(Application),
          useValue: mockApplicationRepository,
        },
        { provide: NotificationsService, useValue: { create: jest.fn() } },
        {
          provide: MailService,
          useValue: { sendApplicationNotification: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findOne', () => {
    it('debe retornar una oferta por id', async () => {
      mockJobRepository.findOne.mockResolvedValue(mockJob);
      const result = await service.findOne('job-123');
      expect(result).toEqual(mockJob);
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      mockJobRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne('no-existe')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('debe crear una oferta correctamente', async () => {
      mockJobRepository.create.mockReturnValue(mockJob);
      mockJobRepository.save.mockResolvedValue(mockJob);

      const result = await service.create(
        {
          title: 'Backend Developer',
          description: 'Descripción larga de la oferta de trabajo',
          company: 'Tech Corp',
          location: 'Remoto',
        },
        mockUser as any,
      );

      expect(result).toEqual(mockJob);
    });
  });

  describe('remove', () => {
    it('debe lanzar ForbiddenException si no es el dueño', async () => {
      mockJobRepository.findOne.mockResolvedValue(mockJob);

      await expect(
        service.remove('job-123', {
          id: 'otro-user',
          role: UserRole.CANDIDATE,
        } as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '../jobs/entities/job.entity';
import { JobView } from './entities/job-view.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(JobView)
    private readonly jobViewRepository: Repository<JobView>,
  ) {}

  async registerView(job: Job, ip: string): Promise<void> {
    const view = this.jobViewRepository.create({ job, visitorIp: ip });
    await this.jobViewRepository.save(view);
  }

  async getJobStats(jobId: string) {
    const totalViews = await this.jobViewRepository.count({
      where: { job: { id: jobId } },
    });

    const viewsLast7Days = await this.jobViewRepository
      .createQueryBuilder('view')
      .where('view.jobId = :jobId', { jobId })
      .andWhere('view.viewedAt >= :date', {
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      })
      .getCount();

    const viewsPerDay = await this.jobViewRepository
      .createQueryBuilder('view')
      .select("DATE_TRUNC('day', view.viewedAt)", 'day')
      .addSelect('COUNT(*)', 'count')
      .where('view.jobId = :jobId', { jobId })
      .groupBy("DATE_TRUNC('day', view.viewedAt)")
      .orderBy('day', 'DESC')
      .limit(30)
      .getRawMany();

    return { totalViews, viewsLast7Days, viewsPerDay };
  }

  async getTopJobs(limit = 5) {
    return this.jobViewRepository
      .createQueryBuilder('view')
      .select('view.jobId', 'jobId')
      .addSelect('COUNT(*)', 'views')
      .groupBy('view.jobId')
      .orderBy('views', 'DESC')
      .limit(limit)
      .getRawMany();
  }
}

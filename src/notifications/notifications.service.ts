import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Notification, NotificationType } from './entities/notification.entity';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly gateway: NotificationsGateway,
  ) {}

  async create(
    user: User,
    type: NotificationType,
    message: string,
    referenceId?: string,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      user,
      type,
      message,
      referenceId,
    });

    const saved = await this.notificationRepository.save(notification);

    // Enviar en tiempo real si el usuario está conectado
    this.gateway.sendNotificationToUser(user.id, {
      id: saved.id,
      type: saved.type,
      message: saved.message,
      createdAt: saved.createdAt,
    });

    return saved;
  }

  async getMyNotifications(userId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    await this.notificationRepository.update(
      { id, user: { id: userId } },
      { read: true },
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { user: { id: userId } },
      { read: true },
    );
  }
}

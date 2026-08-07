import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { successResponse } from '../../../common/helpers/response.helper';
import { SaveAstrologerStatusDto } from '../dto/save-astrologer-status.dto';
import { AstrologerStatusEntity } from '../entity/astrologer-status.entity';

@Injectable()
export class AstrologerStatusService {
  constructor(
    @InjectRepository(AstrologerStatusEntity)
    private readonly statusRepository: Repository<AstrologerStatusEntity>,
  ) {}

  async save(dto: SaveAstrologerStatusDto) {
    this.validateTimeRange(dto.start_time, dto.end_time);

    const existing = await this.getStatusConfig();
    const payload = {
      start_time: this.normalizeTime(dto.start_time),
      end_time: this.normalizeTime(dto.end_time),
    };

    if (existing) {
      await this.statusRepository.update(existing.id, payload);
    } else {
      await this.statusRepository.save(this.statusRepository.create(payload));
    }

    return successResponse(
      'ASTROLOGER_STATUS_SAVED',
      await this.getStatusConfig(),
    );
  }

  async details() {
    return successResponse(
      'ASTROLOGER_STATUS_FETCHED',
      await this.getStatusConfig(),
    );
  }

  async isLive(
    date = new Date(),
    timeZone = 'Asia/Kolkata',
  ) {
    const status = await this.getStatusConfig();
    if (!status) return false;

    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });

    const parts = formatter.formatToParts(date);

    const hour = Number(
      parts.find((item) => item.type === 'hour')?.value || 0,
    );

    const minute = Number(
      parts.find((item) => item.type === 'minute')?.value || 0,
    );

    const currentMinutes = hour * 60 + minute;

    const startMinutes = this.toMinutes(status.start_time);
    const endMinutes = this.toMinutes(status.end_time);

    console.log('UTC Date ==', date);
    console.log('India Time ==', `${hour}:${minute}`);
    console.log('currentMinutes ==', currentMinutes);
    console.log('startMinutes ==', startMinutes);
    console.log('endMinutes ==', endMinutes);

    if (startMinutes <= endMinutes) {
      return (
        currentMinutes >= startMinutes &&
        currentMinutes <= endMinutes
      );
    }

    return (
      currentMinutes >= startMinutes ||
      currentMinutes <= endMinutes
    );
  }

  private getStatusConfig() {
    return this.statusRepository.findOne({
      where: {},
      order: { id: 'DESC' },
    });
  }

  private validateTimeRange(startTime: string, endTime: string) {
    if (this.toMinutes(startTime) === this.toMinutes(endTime)) {
      throw new BadRequestException('Start time and end time cannot be same.');
    }
  }

  private normalizeTime(value: string) {
    return value.length === 5 ? `${value}:00` : value;
  }

  private toMinutes(value: string) {
    const [hours, minutes] = value.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

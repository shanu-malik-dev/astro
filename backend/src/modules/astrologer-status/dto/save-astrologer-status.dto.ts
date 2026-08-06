import { Matches } from 'class-validator';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export class SaveAstrologerStatusDto {
  @Matches(TIME_PATTERN, {
    message: 'Start time must be in HH:mm or HH:mm:ss format.',
  })
  start_time: string;

  @Matches(TIME_PATTERN, {
    message: 'End time must be in HH:mm or HH:mm:ss format.',
  })
  end_time: string;
}

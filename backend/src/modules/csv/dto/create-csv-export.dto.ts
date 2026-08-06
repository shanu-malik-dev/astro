import { Type } from 'class-transformer';
import {
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CsvColumnDto {
  @IsString()
  key: string;

  @IsString()
  header: string;
}

export class CreateCsvExportDto {
  @IsOptional()
  @IsString()
  filename?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CsvColumnDto)
  columns: CsvColumnDto[];

  @IsArray()
  @IsObject({ each: true })
  rows: Record<string, unknown>[];
}

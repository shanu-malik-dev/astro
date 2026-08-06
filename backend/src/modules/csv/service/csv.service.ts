import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { access, mkdir, unlink, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { basename, join } from 'path';
import { randomUUID } from 'crypto';
import { CreateCsvExportDto } from '../dto/create-csv-export.dto';

export type CsvExportResult = {
  file_id: string;
  file_name: string;
  download_url: string;
};

@Injectable()
export class CsvService {
  private readonly exportDir = join(tmpdir(), 'astro-csv-exports');

  async createExport(dto: CreateCsvExportDto): Promise<CsvExportResult> {
    if (!dto.columns.length) {
      throw new BadRequestException('CSV columns are required.');
    }

    const fileName = this.toCsvFileName(dto.filename || 'export');
    const fileId = `${Date.now()}-${randomUUID()}.csv`;
    const filePath = this.getFilePath(fileId);
    const csv = this.toCsv(dto.columns, dto.rows || []);

    await mkdir(this.exportDir, { recursive: true });
    await writeFile(filePath, csv, 'utf8');

    return {
      file_id: fileId,
      file_name: fileName,
      download_url: `/csv/download/${fileId}`,
    };
  }

  async getDownloadPath(fileId: string) {
    const filePath = this.getFilePath(fileId);

    try {
      await access(filePath);
      return filePath;
    } catch {
      throw new NotFoundException('CSV file not found.');
    }
  }

  async deleteFile(fileId: string) {
    await unlink(this.getFilePath(fileId)).catch(() => undefined);
  }

  getSafeDownloadName(fileId: string) {
    return basename(fileId);
  }

  private toCsv(
    columns: CreateCsvExportDto['columns'],
    rows: Record<string, unknown>[],
  ) {
    const header = columns.map((column) => this.escapeCell(column.header));
    const body = rows.map((row) =>
      columns.map((column) => this.escapeCell(row[column.key])).join(','),
    );

    return [header.join(','), ...body].join('\r\n');
  }

  private escapeCell(value: unknown) {
    if (value === null || value === undefined) return '';

    const normalized =
      value instanceof Date
        ? value.toISOString()
        : typeof value === 'object'
          ? JSON.stringify(value)
          : String(value);

    return `"${normalized.replace(/"/g, '""')}"`;
  }

  private toCsvFileName(value: string) {
    const safeName = value
      .trim()
      .replace(/\.csv$/i, '')
      .replace(/[^a-z0-9_-]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();

    return `${safeName || 'export'}.csv`;
  }

  private getFilePath(fileId: string) {
    if (!/^[a-z0-9._-]+\.csv$/i.test(fileId)) {
      throw new BadRequestException('Invalid CSV file.');
    }

    return join(this.exportDir, basename(fileId));
  }
}

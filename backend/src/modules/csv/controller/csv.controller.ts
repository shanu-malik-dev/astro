import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { successResponse } from '../../../common/helpers/response.helper';
import { CreateCsvExportDto } from '../dto/create-csv-export.dto';
import { CsvService } from '../service/csv.service';

@ApiTags('csv')
@Controller('csv')
export class CsvController {
  constructor(private readonly csvService: CsvService) {}

  @Post()
  async create(@Body() dto: CreateCsvExportDto) {
    const exportFile = await this.csvService.createExport(dto);
    return successResponse('CSV_EXPORT_CREATED', exportFile);
  }

  @Get('download/:fileId')
  async download(@Param('fileId') fileId: string, @Res() res: Response) {
    const filePath = await this.csvService.getDownloadPath(fileId);

    res.download(filePath, this.csvService.getSafeDownloadName(fileId), () => {
      void this.csvService.deleteFile(fileId);
    });
  }
}

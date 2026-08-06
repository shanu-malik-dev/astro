import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { existsSync } from 'fs';
import { basename, join } from 'path';
import { IsPublic } from '../../auth/decorators/is-public.decorator';

@ApiTags('uploads')
@Controller('uploads')
export class AstrologerUploadController {
  @IsPublic()
  @Get('astrologers/:filename')
  getAstrologerImage(
    @Param('filename') filename: string,
    @Res() response: Response,
  ) {
    const safeFilename = basename(filename);
    const filePath = this.getAstrologerImagePath(safeFilename);

    if (!filePath) throw new NotFoundException('Image not found.');

    response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return response.sendFile(filePath);
  }

  private getAstrologerImagePath(filename: string) {
    const configuredUploadRoot = process.env.PUBLIC_UPLOAD_ROOT?.trim();
    const roots = [
      configuredUploadRoot
        ? join(configuredUploadRoot, 'uploads', 'astrologers')
        : '',
      join(process.cwd(), '..', 'frontend', 'public', 'uploads', 'astrologers'),
      join(process.cwd(), 'public', 'uploads', 'astrologers'),
    ].filter(Boolean);

    for (const root of roots) {
      const filePath = join(root, filename);
      if (existsSync(filePath)) return filePath;
    }

    return null;
  }
}

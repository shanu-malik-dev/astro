import { IsObject, IsString } from 'class-validator';

export class SaveSiteContentDto {
  @IsObject()
  values: Record<string, string>;
}

export class SaveSiteContentKeyDto {
  @IsString()
  key: string;
}

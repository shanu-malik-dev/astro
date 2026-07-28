import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class SaveRoleDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  id?: number;

  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsInt()
  status?: number;

  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  modules: string[];
}

import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsPublic } from '../../auth/decorators/is-public.decorator';
import { CreateProblemDto } from '../dto/create-problem.dto';
import { DeleteProblemDto } from '../dto/delete-problem.dto';
import { ListProblemDto } from '../dto/list-problem.dto';
import { UpdateProblemStatusDto } from '../dto/update-problem-status.dto';
import { UpdateProblemDto } from '../dto/update-problem.dto';
import { ProblemService } from '../service/problem.service';

@ApiTags('problem')
@Controller('problem')
export class ProblemController {
  constructor(private readonly problemService: ProblemService) {}

  @Post()
  create(@Body() dto: CreateProblemDto) {
    return this.problemService.create(dto);
  }

  @Post('list')
  findAll(@Body() dto: ListProblemDto) {
    return this.problemService.findAll(dto);
  }

  @IsPublic()
  @Post('dropdown')
  dropdown() {
    return this.problemService.dropdown();
  }

  @Post('update')
  update(@Body() dto: UpdateProblemDto) {
    return this.problemService.update(dto);
  }

  @Post('status')
  updateStatus(@Body() dto: UpdateProblemStatusDto) {
    return this.problemService.updateStatus(dto);
  }

  @Post('delete')
  delete(@Body() dto: DeleteProblemDto) {
    return this.problemService.delete(dto);
  }
}

import { PartialType } from '@nestjs/swagger';

import { CreateReportDto } from './create-report.dto.js';

export class UpdateReportDto extends PartialType(CreateReportDto) {}

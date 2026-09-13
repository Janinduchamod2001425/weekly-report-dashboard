import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';
import { ApproveReportDto } from './dto/approve-report.dto.js';
import { ManagerReportsQueryDto } from './dto/manager-reports-query.dto.js';
import { RequestChangesDto } from './dto/request-changes.dto.js';
import { ReviewsService } from './reviews.service.js';

@ApiTags('Manager Reviews')
@ApiCookieAuth('access_token')
@Controller('manager/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MANAGER, UserRole.ADMIN)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @ApiOperation({
    summary: 'List team reports with filters and pagination',
  })
  findAll(@Query() query: ManagerReportsQueryDto) {
    return this.reviewsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'View a report with versions and review history',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewsService.findOne(id);
  }

  @Post(':id/request-changes')
  @ApiOperation({
    summary: 'Return a submitted report for correction',
  })
  requestChanges(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() reviewer: AuthenticatedUser,
    @Body() dto: RequestChangesDto,
  ) {
    return this.reviewsService.requestChanges(id, reviewer.id, dto);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a submitted report' })
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() reviewer: AuthenticatedUser,
    @Body() dto: ApproveReportDto,
  ) {
    return this.reviewsService.approve(id, reviewer.id, dto);
  }
}

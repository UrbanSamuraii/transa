import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	Logger,
  } from '@nestjs/common';
  import { ForbiddenException } from '@nestjs/common';
  import { Response, Request } from 'express';

  @Catch(ForbiddenException)
  export class ForbiddenExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(ForbiddenExceptionFilter.name);
    catch(exception: ForbiddenException, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const statusCode = exception.getStatus();
      const response = ctx.getResponse();
      const message = exception.message || 'You don\'t have permission to access this resource';
      this.logger.log(`Exception caught in ForbiddenExceptionFilter. Status: ${statusCode}. Message: ${message}`);
      response.status(403).json({ statusCode: 403, message });
    }
  }
import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	Logger,
  } from '@nestjs/common';
  import { Response, Request } from 'express';
  
  @Catch(HttpException)
  export class HttpExceptionFilter implements ExceptionFilter {
	private readonly logger = new Logger(HttpExceptionFilter.name);
  
	catch(exception: HttpException, host: ArgumentsHost) {
	  const ctx = host.switchToHttp();
	  const response = ctx.getResponse<Response>();
	  const request = ctx.getRequest<Request>();
	  const statusCode = exception.getStatus();
	  const errorMessage = exception.getResponse() instanceof Object
		? exception.getResponse()['message'] || exception.getResponse()['error']
		: exception.getResponse();
	  
	  const stackTrace = exception.stack || 'No stack trace available';
	  this.logger.error(`Exception caught in HttpExceptionFilter. Status: ${statusCode}. Request URL: ${request.url}. Error Message: ${errorMessage}. Stack Trace: ${stackTrace}`);
	  
	  if (typeof exception.getResponse() === 'string') {
		response.status(statusCode).send({
		  statusCode,
		  error: exception.getResponse(),
		  path: request.url,
		  serverError: true,
		});
	  } else {
		response.status(statusCode).json(exception.getResponse());
	  }
	}
  }
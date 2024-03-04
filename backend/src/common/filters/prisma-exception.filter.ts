import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Prisma } from '@prisma/client';

@Catch(
  Prisma.PrismaClientRustPanicError,
  Prisma.PrismaClientValidationError,
  Prisma.PrismaClientKnownRequestError,
  Prisma.PrismaClientUnknownRequestError,
  Prisma.PrismaClientInitializationError,
)
export class PrismaExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(
    exception:
      | Prisma.PrismaClientRustPanicError
      | Prisma.PrismaClientValidationError
      | Prisma.PrismaClientKnownRequestError
      | Prisma.PrismaClientUnknownRequestError
      | Prisma.PrismaClientInitializationError
      | Error
      | any,
    host: ArgumentsHost,
  ) {
    this.logger.log('Exception catched in PrismaExceptionFilter');
    let errorMessage: string;
    let httpStatus: number;
    const ctx = host.switchToHttp();

    const { httpAdapter } = this.httpAdapterHost;

    errorMessage =
      'Sorry! something went to wrong on our end, Please try again later';
    if (exception instanceof Prisma.PrismaClientRustPanicError) {
      httpStatus = 400;
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      httpStatus = 422;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      httpStatus = 400;
    } else if (exception instanceof Prisma.PrismaClientUnknownRequestError) {
      httpStatus = 400;
      errorMessage = 'Unknow prisma request';
    } else if (exception instanceof Prisma.PrismaClientInitializationError) {
      httpStatus = 400;
    } else if (
      exception.statusCode &&
      exception.statusCode >= 400 &&
      exception.statusCode <= 499
    ) {
      httpStatus = exception.statusCode;
    } else {
      httpStatus = 500;
    }

    this.logger.log({
      httpStatus,
      message: exception.message,
    });

    const errorResponse = {
      code: exception?.code,
      errors: errorMessage,
    };

    httpAdapter.reply(ctx.getResponse(), errorResponse, httpStatus);
  }
}
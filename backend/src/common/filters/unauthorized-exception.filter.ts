import { Catch, ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';

@Catch(UnauthorizedException)
export class UnauthorizedExceptionFilter implements ExceptionFilter {
  catch(exception: UnauthorizedException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    response.status(403).json({
      statusCode: 403,
      message: 'Only administrators can operate this request.',
    });
  }
}
import { HttpException, HttpStatus } from '@nestjs/common';
import { INTERNAL_SERVER_ERROR } from '../constant/http-error.constant';

export class InternalServerErrorException extends HttpException {
  constructor() {
    super(INTERNAL_SERVER_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
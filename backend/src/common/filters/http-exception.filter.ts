import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

type ErrorResponseBody = {
  success: false;
  statusCode: number;
  message: string | string[];
  error?: unknown;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const body = this.createBody(status, exception, exceptionResponse);

    response.status(status).json(body);
  }

  private createBody(
    status: number,
    exception: unknown,
    exceptionResponse: string | object | null,
  ): ErrorResponseBody {
    if (typeof exceptionResponse === 'string') {
      return {
        success: false,
        statusCode: status,
        message: exceptionResponse,
      };
    }

    if (exceptionResponse && typeof exceptionResponse === 'object') {
      const responseObject = exceptionResponse as Record<string, unknown>;

      return {
        success: false,
        statusCode: status,
        message:
          (responseObject.message as string | string[] | undefined) ||
          this.defaultMessage(status),
        error: responseObject.error,
      };
    }

    return {
      success: false,
      statusCode: status,
      message: this.defaultMessage(status),
      error: this.getActualError(exception),
    };
  }

  private defaultMessage(status: number) {
    return status === HttpStatus.INTERNAL_SERVER_ERROR
      ? 'Internal server error'
      : 'Request failed';
  }

  private getActualError(exception: unknown) {
    if (exception instanceof Error) {
      return exception.message;
    }

    if (typeof exception === 'string') {
      return exception;
    }

    return exception;
  }
}

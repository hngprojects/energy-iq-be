import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * VrmApiException
 *
 * Typed error thrown by brand adapters when the external API returns a non-2xx response.
 * Carries the HTTP status code and response message for structured error handling.
 */
export class VrmApiException extends HttpException {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(
      {
        statusCode,
        message,
        error: 'VRM API Error',
      },
      statusCode >= 400 && statusCode < 500
        ? HttpStatus.BAD_REQUEST
        : HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

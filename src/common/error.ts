import { StatusCodes } from 'http-status-codes';

class CustomError extends Error {
  public status: number;

  public code: string;

  public message: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = new.target.name;
    this.status = status;
    this.code = code;
    this.message = message;
  }
}

export class InternalServerError extends CustomError {
  constructor(message: string) {
    super(StatusCodes.INTERNAL_SERVER_ERROR, 'internal_server_error', message);
  }
}

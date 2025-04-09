
export class DataNotFoundException extends Error {
  constructor(message: string = "Data not found") {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationErrorException extends Error {
  constructor(message: string = "Validation error") {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class PersistenceErrorException extends Error {
  constructor(message: string = "Validation error") {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
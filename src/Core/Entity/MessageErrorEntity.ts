import { StatusError } from "../Types/Status";

export class MessageErrorEntity {
  constructor(
    public readonly idVideo: string,
    public readonly idUser: string,
    public readonly status: StatusError,
    public readonly statusTime: string,
    public readonly errorMessage: string
  ) {}

  static create(
    idVideo: string,
    idUser: string,
    status: StatusError,
    errorMessage: string,
    statusTime: string = new Date().toISOString()
  ): MessageErrorEntity {
    return new MessageErrorEntity(
      idVideo,
      idUser,
      status,
      statusTime,
      errorMessage
    );
  }
}

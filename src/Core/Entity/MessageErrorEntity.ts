import { StatusError } from "../Types/Status";

export class MessageErrorEntity {
  constructor(
    public readonly idVideo: string,
    public readonly idUsuario: string,
    public readonly status: StatusError,
    public readonly errorMessage: string,
    public readonly statusTime: string = new Date().toISOString()
  ) {}

  static create(
    idVideo: string,
    idUsuario: string,
    status: StatusError,
    errorMessage: string
  ): MessageErrorEntity {
    return new MessageErrorEntity(idVideo, idUsuario, status, errorMessage);
  }
}

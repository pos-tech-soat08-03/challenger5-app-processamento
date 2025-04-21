import { StatusError } from "../Types/Status";

export class MessageErrorEntity {
  constructor(
    public readonly id_video: string,
    public readonly id_usuario: string,
    public readonly status: StatusError,
    public readonly error_message: string,
    public readonly status_time: string = new Date().toISOString()
  ) {}

  static create(
    idVideo: string,
    idUsuario: string,
    status: StatusError,
    error_message: string
  ): MessageErrorEntity {
    return new MessageErrorEntity(idVideo, idUsuario, status, error_message);
  }
}

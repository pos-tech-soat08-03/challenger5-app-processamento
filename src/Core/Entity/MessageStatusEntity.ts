import { Status } from "../Types/Status";

export class MessageStatusEntity {
  constructor(
    public readonly id_video: string,
    public readonly id_usuario: string,
    public readonly status: Status,
    public readonly percentage: number,
    public readonly status_time: string,
    public readonly message?: string,
  ) {}

  static create(
    id_video: string,
    id_usuario: string,
    status: Status,
    percentage: number,
    status_time: string = new Date().toISOString(),
    message?: string
  ): MessageStatusEntity {
    return new MessageStatusEntity(
      id_video,
      id_usuario,
      status,
      percentage,
      status_time,
      message
    );
  }
}

import { Status } from "../Types/Status";

export class MessageStatusEntity {
  constructor(
    public readonly idVideo: string,
    public readonly idUsuario: string,
    public readonly status: Status,
    public readonly percentage: number,
    public readonly statusTime: string,
    public readonly presignedUrl?: string,
  ) {}

  static create(
    idVideo: string,
    idUsuario: string,
    status: Status,
    percentage: number,
    statusTime: string = new Date().toISOString(),
    presignedUrl?: string
  ): MessageStatusEntity {
    return new MessageStatusEntity(
      idVideo,
      idUsuario,
      status,
      percentage,
      statusTime,
      presignedUrl
    );
  }
}

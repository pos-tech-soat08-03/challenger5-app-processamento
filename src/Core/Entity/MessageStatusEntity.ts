import { Status } from "../Types/Status";

export class MessageStatusEntity {
  constructor(
    public readonly idVideo: string,
    public readonly idUser: string,
    public readonly status: Status,
    public readonly percentage: number,
    public readonly presignedUrl?: string // Campo opcional para a URL assinada
  ) {}

  static create(
    idVideo: string,
    idUser: string,
    status: Status,
    percentage: number,
    presignedUrl?: string
  ): MessageStatusEntity {
    return new MessageStatusEntity(
      idVideo,
      idUser,
      status,
      percentage,
      presignedUrl
    );
  }
}

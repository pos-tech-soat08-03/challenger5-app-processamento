export class MessageVideoData {
  constructor(
    public readonly user: { idUsuario: string; email: string },
    public readonly video: {
      idVideo: string;
      title: string;
      description: string;
      filename: string;
      fullPath: string;
      fileSize: number;
      duration: number;
      framerate: number;
    },
    public readonly config: {
      outputFormat: string;
      resolution: string;
      interval: number;
    },
    public readonly _receiptHandle?: string
  ) {}

  public static validate(message: MessageVideoData): void {
    const missingFields: string[] = [];
    const checkFields = (obj: Record<string, any>, prefix: string) => {
      Object.entries(obj).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
          missingFields.push(`${prefix}.${key}`);
        }
      });
    };

    checkFields(message.user, "user");
    checkFields(message.video, "video");
    checkFields(message.config, "config");

    if (missingFields.length > 0) {
      throw new Error(
        `Campos obrigatórios ausentes em MessageVideoData: ${missingFields.join(
          ", "
        )}.`
      );
    }
  }

  static fromSqsMessage(data: any, receiptHandle?: string): MessageVideoData {
    return new MessageVideoData(
      { idUsuario: data.user.id_usuario, email: data.user.email },
      {
        idVideo: data.video.id_video,
        title: data.video.title,
        description: data.video.description,
        filename: data.video.filename,
        fullPath: data.video.full_path,
        fileSize: data.video.file_size,
        duration: data.video.duration,
        framerate: data.video.framerate,
      },
      {
        outputFormat: data.config.output_format,
        resolution: data.config.resolution,
        interval: data.config.interval,
      },
      receiptHandle
    );
  }
}

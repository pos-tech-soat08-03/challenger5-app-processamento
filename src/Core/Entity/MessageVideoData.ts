// src/Core/Entity/MessageVideoData.ts
export class MessageVideoData {
  constructor(
    public readonly video: VideoData,
    public readonly user: UserData,
    public readonly config: ConfigData
  ) {}

  static fromSqsMessage(data: any): MessageVideoData {
    return new MessageVideoData(
      VideoData.fromSqsMessage(data.video || {}),
      UserData.fromSqsMessage(data.user || {}),
      ConfigData.fromSqsMessage(data.config || {})
    );
  }
}

export class VideoData {
  constructor(
    public readonly idVideo: string,
    public readonly title: string,
    public readonly description: string,
    public readonly filename: string,
    public readonly fileSize: number,
    public readonly fullPath: string,
    public readonly duration: number,
    public readonly framerate: number
  ) {}

  static fromSqsMessage(video: any): VideoData {
    return new VideoData(
      video.id_video || "unknown-video-id",
      video.title || "Título Padrão",
      video.description || "Sem descrição",
      video.filename || "default.mp4",
      video.file_size || 0,
      video.full_path || "s3:/default/path",
      video.duration || 0,
      video.framerate || 0
    );
  }
}

export class UserData {
  constructor(
    public readonly idUsuario: string,
    public readonly email: string
  ) {}

  static fromSqsMessage(user: any): UserData {
    return new UserData(
      user.id_usuario || "unknown-user-id",
      user.email || "unknown@example.com"
    );
  }
}

export class ConfigData {
  constructor(
    public readonly outputFormat: string,
    public readonly resolution: string,
    public readonly interval: number
  ) {}

  static fromSqsMessage(config: any): ConfigData {
    return new ConfigData(
      config.output_format || "png",
      config.resolution || "1920x1080",
      config.interval || 20
    );
  }
}

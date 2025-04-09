import { QueueServiceInterface } from "../Interfaces/Services/QueueServiceInterface";
import { NotificationServiceInterface } from "../Interfaces/Services/NotificationServiceInterface";
import { VideoEntity } from "../Entity/VideoEntity";
import { MessageStatusEntity } from "../Entity/MessageStatusEntity";
import { MessageErrorEntity } from "../Entity/MessageErrorEntity";
import { S3ServiceInterface } from "../Interfaces/Services/S3ServiceInterface";
import { FrameExtractorServiceInterface } from "../Interfaces/Services/FrameExtractorServiceInterface";
import { ZipServiceInterface } from "../Interfaces/Services/ZipServiceInterface";
import { VideoProcessingConfig } from "../../Infrastructure/Configs/VideoProcessingConfig";
import * as path from "path";
import { StatusError } from "../Types/Status";

export class VideoQueueHandler {
  constructor(
    private readonly queueService: QueueServiceInterface,
    private readonly notificationService: NotificationServiceInterface,
    private readonly s3Service: S3ServiceInterface,
    private readonly frameExtractorService: FrameExtractorServiceInterface,
    private readonly zipService: ZipServiceInterface,
    private readonly config: VideoProcessingConfig
  ) {}

  async handle(): Promise<void> {
    const messageVideoData = await this.queueService.receberProximoVideo();
    if (messageVideoData) {
      console.log(
        "messageVideoData.video.fullPath:",
        messageVideoData.video.fullPath
      );
      const video = new VideoEntity(
        messageVideoData.user.idUsuario,
        messageVideoData.video.title,
        messageVideoData.video.description,
        messageVideoData.video.filename,
        messageVideoData.video.filename.split(".").pop() || "mp4",
        messageVideoData.video.fullPath,
        messageVideoData.video.fileSize,
        "unknown",
        messageVideoData.video.duration,
        messageVideoData.video.framerate,
        messageVideoData.video.idVideo
      );

      const notStartedStatus = MessageStatusEntity.create(
        video.getId(),
        video.getUsuarioId(),
        "NOT_STARTED",
        0.0
      );
      await this.notificarStatus(notStartedStatus);

      let receiptHandle = (messageVideoData as any).receiptHandle;

      try {
        console.log(
          `Baixando vídeo ${video.getId()} do usuário ${video.getUsuarioId()}`
        );
        const localVideoPath = path.join(
          this.config.tempDir,
          video.getFileName()
        );
        await this.s3Service.downloadVideo(video.getPath(), localVideoPath);

        console.log(
          `Iniciando extração de frames para o vídeo ${video.getId()}`
        );
        await this.frameExtractorService.extractFrames(
          localVideoPath,
          messageVideoData.config,
          video,
          this.notificationService
        );

        console.log(`Gerando ZIP para o vídeo ${video.getId()}`);
        const zipPath = await this.zipService.createZip(
          video.getId(),
          path.join(this.config.tempDir, "frames")
        );

        console.log(`Enviando ZIP para o S3: ${zipPath}`);
        const [bucket] = video.getPath().replace("s3://", "").split("/");
        const zipKey = `${
          this.config.processedPrefix
        }/video-${video.getId()}.zip`;
        await this.s3Service.uploadZip(bucket, zipKey, zipPath);

        console.log(`Gerando URL assinada para o ZIP no S3`);
        const presignedUrl = await this.s3Service.generatePresignedUrl(
          bucket,
          zipKey
        );

        console.log(`Deletando vídeo original do S3: ${video.getPath()}`);
        await this.s3Service.deleteVideo(video.getPath());

        const completedStatus = MessageStatusEntity.create(
          video.getId(),
          video.getUsuarioId(),
          "COMPLETED",
          100.0,
          presignedUrl
        );
        await this.notificarStatus(completedStatus);
      } catch (error) {
        let errorMessage =
          error instanceof Error
            ? error.message
            : "Erro desconhecido no processamento";
        let status: StatusError = errorMessage.includes("killed with signal")
          ? "INTERRUPTED"
          : "ERROR";

        // Personalizar mensagem para NoSuchKey
        if (
          error instanceof Error &&
          "Code" in error &&
          error["Code"] === "NoSuchKey"
        ) {
          errorMessage = `Vídeo não encontrado no S3: ${video.getPath()}`;
        }

        // Enviar uma única notificação consolidada
        const errorStatus = MessageErrorEntity.create(
          video.getId(),
          video.getUsuarioId(),
          status,
          errorMessage
        );
        await this.notificarErro(errorStatus);
      }
      // Deletar a mensagem da fila independentemente de sucesso ou erro
      if (receiptHandle) {
        await this.queueService.deletarMensagemDaFila(receiptHandle);
      }
    } else {
      console.log("Nenhum vídeo na fila no momento.");
    }
  }

  private async notificarStatus(
    videoStatus: MessageStatusEntity
  ): Promise<void> {
    await this.notificationService.informarStatus(videoStatus);
  }

  private async notificarErro(errorStatus: MessageErrorEntity): Promise<void> {
    await this.notificationService.informarStatus(errorStatus);
  }
}

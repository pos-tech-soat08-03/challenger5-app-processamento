import { QueueServiceInterface } from "../Interfaces/Services/QueueServiceInterface";
import { NotificationServiceInterface } from "../Interfaces/Services/NotificationServiceInterface";
import { MessageStatusEntity } from "../Entity/MessageStatusEntity";
import { MessageErrorEntity } from "../Entity/MessageErrorEntity";
import { S3ServiceInterface } from "../Interfaces/Services/S3ServiceInterface";
import { FrameExtractorServiceInterface } from "../Interfaces/Services/FrameExtractorServiceInterface";
import { ZipServiceInterface } from "../Interfaces/Services/ZipServiceInterface";
import { VideoProcessingConfig } from "../../Infrastructure/Configs/VideoProcessingConfig";
import * as path from "path";
import { StatusError } from "../Types/Status";
import { MessageVideoData } from "../Entity/MessageVideoData";
import { ResponseMessage } from "../Interfaces/ResponseMessage";

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
    let videoData = null;
    const responseMessage: ResponseMessage | null =
      await this.queueService.receberProximaMensagem();
    console.log(responseMessage)
    if (responseMessage) {
      try {
        videoData = MessageVideoData.fromSqsMessage(
          responseMessage.body,
          responseMessage.message
        );
        MessageVideoData.validate(videoData);

        console.log("videoData.video.fullPath:", videoData.video.fullPath);

        console.log(
          `Baixando vídeo ${videoData.video.idVideo} do usuário ${videoData.user.idUsuario}`
        );
        const localVideoPath = path.join(
          this.config.tempDir,
          videoData.video.filename
        );

        await this.s3Service.downloadVideo(
          videoData.video.fullPath,
          localVideoPath
        );

        const notStartedStatus = MessageStatusEntity.create(
          videoData.video.idVideo,
          videoData.user.idUsuario,
          "NOT_STARTED",
          0.0
        );

        await this.notificarStatus(notStartedStatus);
        console.log(
          `Iniciando extração de frames para o vídeo ${videoData.video.idVideo}`
        );
        await this.frameExtractorService.extractFrames(
          localVideoPath,
          videoData,
          this.notificationService
        );

        console.log(`Gerando ZIP para o vídeo ${videoData.video.idVideo}`);
        const zipPath = await this.zipService.createZip(
          videoData.video.idVideo,
          path.join(this.config.tempDir, "frames")
        );

        console.log(`Enviando ZIP para o S3: ${zipPath}`);
        const [bucket] = videoData.video.fullPath
          .replace("s3://", "")
          .split("/");
        const zipKey = `videos/${this.config.processedPrefix}/${videoData.video.idVideo}.zip`;
        await this.s3Service.uploadZip(bucket, zipKey, zipPath);

        console.log(`Gerando URL assinada para o ZIP no S3`);
        const presignedUrl = await this.s3Service.generatePresignedUrl(
          bucket,
          zipKey
        );

        console.log(
          `Deletando vídeo original do S3: ${videoData.video.fullPath}`
        );
        await this.s3Service.deleteVideo(videoData.video.fullPath);

        const completedStatus = MessageStatusEntity.create(
          videoData.video.idVideo,
          videoData.user.idUsuario,
          "COMPLETED",
          100.0,
          new Date().toISOString(),
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

        if (
          error instanceof Error &&
          "Code" in error &&
          error["Code"] === "NoSuchKey"
        ) {
          errorMessage = `Vídeo não encontrado no S3: ${videoData?.video.fullPath}`;
        }

        const errorStatus = MessageErrorEntity.create(
          videoData?.video.idVideo ?? 'Mensagem no formato errado, não foi possível encontrar o idVideo',
          videoData?.user.idUsuario ?? 'Mensagem no formato errado, não foi possível encontrar o idUsuario',
          status,
          errorMessage
        );
        await this.notificarErro(errorStatus);
      }
      await this.queueService.deletarMensagem(responseMessage);
    } else {
      console.log("Nenhum vídeo na fila no momento.");
    }
  }

  private async notificarStatus(
    processingStatus: MessageStatusEntity
  ): Promise<void> {
    await this.notificationService.informarStatus(processingStatus);
  }

  private async notificarErro(errorStatus: MessageErrorEntity): Promise<void> {
    await this.notificationService.informarStatus(errorStatus);
  }
}

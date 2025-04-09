import { QueueRepositoryInterface } from "../Interfaces/Repositories/QueueRepositoryInterface";
import { NotificationRepositoryInterface } from "../Interfaces/Repositories/NotificationRepositoryInterface";
import { VideoEntity } from "../Entity/VideoEntity";
import { MessageStatusEntity } from "../Entity/MessageStatusEntity";
import { MessageVideoData } from "../Entity/MessageVideoData";
import { MessageErrorEntity } from "../Entity/MessageErrorEntity";
import { S3Config } from "../../Infrastructure/Configs/S3Config";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import * as fsPromises from "fs/promises";
import * as fs from "fs";
import * as path from "path";
import ffmpeg from "fluent-ffmpeg";
import archiver from "archiver";

export class ProcessarVideoUseCase {
  private readonly s3Client: S3Client;

  constructor(
    private readonly queueRepository: QueueRepositoryInterface,
    private readonly notificationRepository: NotificationRepositoryInterface,
    private readonly s3Config: S3Config
  ) {
    this.s3Client = this.s3Config.getClient();
  }

  async executar(): Promise<void> {
    const messageVideoData = await this.queueRepository.receberProximoVideo();
    if (messageVideoData) {
      console.log(
        "messageVideoData.video.fullPath:",
        messageVideoData.video.fullPath
      ); // Adicionar log
      const video = new VideoEntity(
        messageVideoData.user.idUsuario,
        messageVideoData.video.title,
        messageVideoData.video.description,
        messageVideoData.video.filename,
        messageVideoData.video.filename.split(".").pop() || "mp4",
        messageVideoData.video.fullPath, // Verificar se é passado corretamente
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

      let receiptHandle = (messageVideoData as any).receiptHandle; // Captura o receiptHandle

      try {
        console.log(
          `Baixando vídeo ${video.getId()} do usuário ${video.getUsuarioId()}`
        );
        const localVideoPath = await this.downloadVideoFromS3(video);

        console.log(
          `Iniciando extração de frames para o vídeo ${video.getId()}`
        );
        await this.extractFrames(localVideoPath, messageVideoData, video);

        console.log(`Gerando ZIP para o vídeo ${video.getId()}`);
        const zipPath = await this.createZipFromFrames(video.getId());

        console.log(`Enviando ZIP para o S3: ${zipPath}`);
        await this.uploadZipToS3(video, zipPath);

        console.log(`Gerando URL assinada para o ZIP no S3`);
        const presignedUrl = await this.generatePresignedUrl(video);

        console.log(`Deletando vídeo original do S3: ${video.getPath()}`);
        await this.deleteVideoFromS3(video);

        const completedStatus = MessageStatusEntity.create(
          video.getId(),
          video.getUsuarioId(),
          "COMPLETED",
          100.0,
          presignedUrl
        );
        await this.notificarStatus(completedStatus);

        if (receiptHandle) {
          await this.queueRepository.deletarMensagemDaFila(receiptHandle);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Erro desconhecido no processamento";
        const status = errorMessage.includes("killed with signal")
          ? "INTERRUPTED"
          : "ERROR";
        const errorStatus = MessageErrorEntity.create(
          video.getId(),
          video.getUsuarioId(),
          status,
          errorMessage
        );
        await this.notificarErro(errorStatus);
        throw error;
      }
    } else {
      console.log("Nenhum vídeo na fila no momento.");
    }
  }

  async downloadVideoFromS3(video: VideoEntity): Promise<string> {
    const fullPath = video.getPath().replace("s3://", "");
    console.log("fullPath original:", fullPath);
    const [bucket, ...keyParts] = fullPath.split("/");
    console.log("Bucket:", bucket);
    console.log("Key:", keyParts.join("/"));
    if (!bucket) {
      throw new Error("Bucket não especificado no fullPath");
    }

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: keyParts.join("/"),
    });

    const localPath = path.join("/tmp", video.getFileName());
    console.log("Salvando em:", localPath);

    try {
      const response = await this.s3Client.send(command);
      if (!response.Body) {
        throw new Error("Nenhum corpo retornado pelo S3");
      }
      const byteArray = await response.Body.transformToByteArray();
      console.log("Tamanho do byteArray:", byteArray.length);
      await fsPromises.writeFile(localPath, byteArray);
      const stats = await fsPromises.stat(localPath);
      console.log("Tamanho do arquivo salvo:", stats.size);
      return localPath;
    } catch (error) {
      if (
        error instanceof Error &&
        "Code" in error &&
        error["Code"] === "NoSuchKey"
      ) {
        await this.notificationRepository.informarStatus({
          idVideo: video.getId(),
          idUser: video.getUsuarioId(),
          status: "ERROR",
          statusTime: new Date().toISOString(),
          errorMessage: "Vídeo não encontrado no S3: " + fullPath,
        });
        throw error;
      }
      throw error;
    }
  }
  private async extractFrames(
    videoPath: string,
    messageVideoData: MessageVideoData,
    video: VideoEntity
  ): Promise<void> {
    const outputDir = "/tmp/frames";
    await fsPromises.mkdir(outputDir, { recursive: true });

    const outputPattern = path.join(
      outputDir,
      `frame-%04d.${messageVideoData.config.outputFormat}`
    );
    const notifiedPercentages = new Set<number>([0]);

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .outputOptions([
          `-vf fps=1/${messageVideoData.config.interval}`,
          `-s ${messageVideoData.config.resolution}`,
        ])
        .output(outputPattern)
        .on("progress", (progress) => {
          const currentPercent =
            progress.percent !== undefined
              ? Math.min(progress.percent, 99)
              : 10;
          const milestone = Math.floor(currentPercent / 20) * 20;

          if (!notifiedPercentages.has(milestone) && milestone > 0) {
            notifiedPercentages.add(milestone);
            const processingStatus = MessageStatusEntity.create(
              video.getId(),
              video.getUsuarioId(),
              "PROCESSING",
              milestone
            );
            this.notificarStatus(processingStatus).catch((err) =>
              console.error("Erro ao notificar progresso:", err)
            );
          }
        })
        .on("end", () => {
          console.log("Frames extraídos com sucesso.");
          resolve();
        })
        .on("error", (err) => {
          console.error("Erro ao extrair frames:", err);
          const status = err.message.includes("killed with signal")
            ? "INTERRUPTED"
            : "ERROR";
          const errorStatus = MessageErrorEntity.create(
            video.getId(),
            video.getUsuarioId(),
            status,
            err.message
          );
          this.notificarErro(errorStatus)
            .catch((notifyErr) =>
              console.error("Erro ao notificar falha:", notifyErr)
            )
            .finally(() => reject(err));
        })
        .run();
    });
  }

  private async createZipFromFrames(videoId: string): Promise<string> {
    const outputDir = "/tmp/frames";
    const zipPath = path.join("/tmp", `video-${videoId}.zip`);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    return new Promise((resolve, reject) => {
      output.on("close", () => {
        console.log(`ZIP criado em ${zipPath}`);
        resolve(zipPath);
      });

      archive.on("error", (err) => {
        console.error("Erro ao criar ZIP:", err);
        reject(err);
      });

      archive.pipe(output);
      archive.directory(outputDir, false);
      archive.finalize();
    });
  }

  private async uploadZipToS3(
    video: VideoEntity,
    zipPath: string
  ): Promise<void> {
    const fullPath = video.getPath().replace("s3://", ""); // Corrigir para s3://
    console.log("fullPath para upload:", fullPath);
    const [bucket, ...rest] = fullPath.split("/"); // Separar bucket do resto
    console.log("Bucket para upload:", bucket);
    const zipKey = `processed/video-${video.getId()}.zip`;
    console.log("Key para upload:", zipKey);

    if (!bucket) {
      throw new Error(
        "Bucket não especificado no fullPath: " + video.getPath()
      );
    }

    const fileStream = fs.createReadStream(zipPath);
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: zipKey,
      Body: fileStream,
      ContentType: "application/zip",
    });

    try {
      await this.s3Client.send(command);
      console.log(`ZIP enviado para s3://${bucket}/${zipKey}`);
    } catch (error) {
      throw new Error(
        `Falha ao enviar ZIP para o S3: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`
      );
    } finally {
      fileStream.close();
    }
  }

  private async generatePresignedUrl(video: VideoEntity): Promise<string> {
    const fullPath = video.getPath().replace("s3://", "");
    console.log("fullPath para URL assinada:", fullPath);
    const [bucket] = fullPath.split("/");
    console.log("Bucket para URL assinada:", bucket);
    const zipKey = `processed/video-${video.getId()}.zip`;
    console.log("Key para URL assinada:", zipKey);

    if (!bucket) {
      throw new Error(
        "Bucket não especificado no fullPath: " + video.getPath()
      );
    }

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: zipKey,
    });

    try {
      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn: 3600,
      });
      console.log(`URL assinada gerada: ${url}`);
      return url;
    } catch (error) {
      throw new Error(
        `Falha ao gerar URL assinada: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`
      );
    }
  }

  private async deleteVideoFromS3(video: VideoEntity): Promise<void> {
    const fullPath = video.getPath().replace("s3://", ""); // Corrigir para s3://
    console.log("fullPath para deleção:", fullPath);
    const [bucket, ...keyParts] = fullPath.split("/");
    const key = keyParts.join("/"); // Juntar o restante como key
    console.log("Bucket para deleção:", bucket);
    console.log("Key para deleção:", key);

    if (!bucket) {
      throw new Error(
        "Bucket não especificado para deleção: " + video.getPath()
      );
    }
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    try {
      await this.s3Client.send(command);
      console.log(`Vídeo original deletado do S3: s3://${bucket}/${key}`);
    } catch (error) {
      throw new Error(
        `Falha ao deletar vídeo do S3: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`
      );
    }
  }

  private async notificarStatus(
    videoStatus: MessageStatusEntity
  ): Promise<void> {
    await this.notificationRepository.informarStatus(videoStatus);
  }

  private async notificarErro(errorStatus: MessageErrorEntity): Promise<void> {
    await this.notificationRepository.informarStatus(errorStatus);
  }
}

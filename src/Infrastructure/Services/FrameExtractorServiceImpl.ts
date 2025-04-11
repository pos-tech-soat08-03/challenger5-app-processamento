import { NotificationServiceInterface } from "../../Core/Interfaces/Services/NotificationServiceInterface";
import { MessageStatusEntity } from "../../Core/Entity/MessageStatusEntity";
import { MessageErrorEntity } from "../../Core/Entity/MessageErrorEntity";
import { MessageVideoData } from "../../Core/Entity/MessageVideoData";
import * as fsPromises from "fs/promises";
import * as path from "path";
import { FrameExtractorServiceInterface } from "../../Core/Interfaces/Services/FrameExtractorServiceInterface";

// Tipo para o comando ffmpeg (compatível com fluent-ffmpeg)
type FfmpegCommand = {
  outputOptions: (options: string[]) => FfmpegCommand;
  output: (pattern: string) => FfmpegCommand;
  on: (event: string, callback: (arg?: any) => void) => FfmpegCommand;
  run: () => void;
};
type FfmpegFactory = (videoPath: string) => FfmpegCommand;

export class FrameExtractorServiceImpl
  implements FrameExtractorServiceInterface
{
  private readonly ffmpeg: FfmpegFactory;

  constructor(ffmpegFactory: FfmpegFactory = require("fluent-ffmpeg")) {
    this.ffmpeg = ffmpegFactory;
  }

  async extractFrames(
    videoPath: string,
    videoData: MessageVideoData,
    notificationService: NotificationServiceInterface
  ): Promise<void> {
    const framesDir = path.join(path.dirname(videoPath), "frames");
    await this.createFramesDirectory(framesDir);
    const outputPattern = this.getOutputPattern(
      framesDir,
      videoData.config.outputFormat
    );
    const ffmpegOptions = this.getFfmpegOptions(videoData);

    const ffmpegProcess = this.setupFfmpeg(
      videoPath,
      outputPattern,
      ffmpegOptions,
      {
        onProgress: (progress) =>
          this.handleProgress(progress, videoData, notificationService),
        onEnd: () => console.log("Frames extraídos com sucesso."),
        onError: (err) => this.handleError(err, videoData, notificationService),
      }
    );

    await this.runFfmpeg(ffmpegProcess);
  }

  private async createFramesDirectory(framesDir: string): Promise<void> {
    await fsPromises.mkdir(framesDir, { recursive: true });
  }

  private getOutputPattern(framesDir: string, outputFormat: string): string {
    return path.join(framesDir, `frame-%04d.${outputFormat}`);
  }

  private getFfmpegOptions(videoData: MessageVideoData): string[] {
    return [
      `-vf fps=1/${videoData.config.interval}`,
      `-s ${videoData.config.resolution}`,
    ];
  }

  private setupFfmpeg(
    videoPath: string,
    outputPattern: string,
    options: string[],
    handlers: {
      onProgress: (progress: { percent?: number }) => void;
      onEnd: () => void;
      onError: (err: Error) => void;
    }
  ): FfmpegCommand {
    return this.ffmpeg(videoPath)
      .outputOptions(options)
      .output(outputPattern)
      .on("progress", handlers.onProgress)
      .on("end", handlers.onEnd)
      .on("error", handlers.onError);
  }

  private handleProgress(
    progress: { percent?: number },
    videoData: MessageVideoData,
    notificationService: NotificationServiceInterface
  ): void {
    const currentPercent =
      progress.percent !== undefined ? Math.min(progress.percent, 99) : 10;
    const milestone = Math.floor(currentPercent / 20) * 20;
    const notifiedPercentages =
      (this.handleProgress as any).notifiedPercentages || new Set<number>([0]);
    (this.handleProgress as any).notifiedPercentages = notifiedPercentages;

    if (!notifiedPercentages.has(milestone) && milestone > 0) {
      notifiedPercentages.add(milestone);
      const status = MessageStatusEntity.create(
        videoData.video.idVideo,
        videoData.user.idUsuario,
        "PROCESSING",
        milestone
      );
      notificationService.informarStatus(status).catch((err) => {
        console.error("Erro ao notificar progresso:", err);
      });
    }
  }

  private handleError(
    err: Error,
    videoData: MessageVideoData,
    notificationService: NotificationServiceInterface
  ): never {
    console.error("Erro ao extrair frames:", err);
    const status = err.message.includes("killed with signal")
      ? "INTERRUPTED"
      : "ERROR";
    const errorStatus = MessageErrorEntity.create(
      videoData.video.idVideo,
      videoData.user.idUsuario,
      status,
      err.message
    );
    notificationService.informarStatus(errorStatus).catch((notifyErr) => {
      console.error("Erro ao notificar falha:", notifyErr);
    });
    throw err;
  }

  private async runFfmpeg(ffmpegProcess: FfmpegCommand): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpegProcess.on("end", resolve).on("error", reject).run();
    });
  }
}

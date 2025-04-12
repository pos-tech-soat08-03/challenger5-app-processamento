import { SqsConfig } from "./Infrastructure/Configs/SqsConfig";
import { SnsConfig } from "./Infrastructure/Configs/SnsConfig";
import { S3Config } from "./Infrastructure/Configs/S3Config";
import { VideoProcessingConfig } from "./Infrastructure/Configs/VideoProcessingConfig";
import { SqsServiceImpl } from "./Infrastructure/Services/SqsServiceImpl";
import { SnsServiceImpl } from "./Infrastructure/Services/SnsServiceImpl";
import { VideoQueueHandler } from "./Core/Handlers/VideoQueueHandler";
import { QueueWorker } from "./Infrastructure/QueueWorker/QueueWorkerSQS";
import { S3ServiceImpl } from "./Infrastructure/Services/S3ServiceImpl";
import { FrameExtractorServiceImpl } from "./Infrastructure/Services/FrameExtractorServiceImpl";
import { ZipServiceImpl } from "./Infrastructure/Services/ZipServiceImpl";
import * as dotenv from "dotenv";

dotenv.config();

async function startApp(): Promise<void> {
  try {
    const sqsConfig = new SqsConfig();
    const snsConfig = new SnsConfig();
    const s3Config = new S3Config();
    const videoProcessingConfig = new VideoProcessingConfig();

    if (!sqsConfig.getQueueUrl() || !snsConfig.getTopicArn()) {
      throw new Error(
        "Configurações inválidas: URL da fila SQS ou ARN do tópico SNS não fornecidos"
      );
    }

    const queueRepository = new SqsServiceImpl(sqsConfig);
    const notificationRepository = new SnsServiceImpl(snsConfig);
    const s3Service = new S3ServiceImpl(s3Config.getClient());
    const frameExtractor = new FrameExtractorServiceImpl();
    const zipService = new ZipServiceImpl();

    const videoQueueHandler = new VideoQueueHandler(
      queueRepository,
      notificationRepository,
      s3Service,
      frameExtractor,
      zipService,
      videoProcessingConfig
    );

    const queueWorker = new QueueWorker(videoQueueHandler);

    const gracefulShutdown = async (signal: string) => {
      console.log(`\nRecebido sinal ${signal}. Encerrando worker...`);
      try {
        await queueWorker.stop();
        console.log("Worker encerrado com sucesso. Saindo...");
        process.exit(0);
      } catch (error) {
        console.error("Erro durante o encerramento:", error);
        process.exit(1);
      }
    };

    // Captura de sinais de desligamento
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

    console.log("Iniciando a aplicação de processamento de vídeos...");
    await queueWorker.start();
    console.log(
      "Worker iniciado com sucesso. Aguardando mensagens na fila SQS..."
    );
  } catch (error) {
    console.error("Erro ao iniciar a aplicação:", error);
    process.exit(1);
  }
}

process.on("unhandledRejection", (reason, promise) => {
  console.error("Rejeição não tratada em:", promise, "Motivo:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("Exceção não capturada:", error);
  process.exit(1);
});

startApp().catch((error) => {
  console.error("Erro crítico na aplicação:", error);
  process.exit(1);
});

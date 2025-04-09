// src/app.ts
import { SqsConfig } from "./Infrastructure/Configs/SqsConfig";
import { SnsConfig } from "./Infrastructure/Configs/SnsConfig";
import { S3Config } from "./Infrastructure/Configs/S3Config";
import { SqsQueueAdapter } from "./Application/Adapters/SqsQueueAdapter";
import { SnsNotificationAdapter } from "./Application/Adapters/SnsNotificationAdapter";
import { ProcessarVideoUseCase } from "./Core/Usecases/ProcessarVideoUseCase";
import { QueueWorker } from "./Infrastructure/QueueWorker/QueueWorkerSQS";
import * as dotenv from 'dotenv';

dotenv.config();
// Função principal para iniciar a aplicação
async function startApp(): Promise<void> {
  try {
    // Configurações dos serviços AWS
    const sqsConfig = new SqsConfig();
    const snsConfig = new SnsConfig();
    const s3Config = new S3Config();

    // Verifica se as configurações estão válidas
    if (!sqsConfig.getQueueUrl() || !snsConfig.getTopicArn()) {
      throw new Error(
        "Configurações inválidas: URL da fila SQS ou ARN do tópico SNS não fornecidos"
      );
    }

    // Adaptadores para SQS e SNS
    const queueRepository = new SqsQueueAdapter(sqsConfig);
    const notificationRepository = new SnsNotificationAdapter(snsConfig);

    // Use Case para processar vídeos
    const processarVideoUseCase = new ProcessarVideoUseCase(
      queueRepository,
      notificationRepository,
      s3Config
    );

    // Worker para processar a fila
    const queueWorker = new QueueWorker(processarVideoUseCase);

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

// Inicia a aplicação
startApp().catch((error) => {
  console.error("Erro crítico na aplicação:", error);
  process.exit(1);
});

// src/Infrastructure/QueueWorker/QueueWorker.ts
import { VideoQueueHandler } from "../../Core/Handlers/VideoQueueHandler";

export class QueueWorker {
  constructor(private readonly queueHandler: VideoQueueHandler) {}

  async start(): Promise<void> {
    console.log("QueueWorker iniciado. Iniciando polling da fila SQS...");
    while (true) {
      try {
        await this.queueHandler.handle();
        // Pequena pausa para evitar consumo excessivo de CPU
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error("Erro ao processar mensagem da fila:", error);
        // Aguarda mais tempo em caso de erro antes de tentar novamente
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }
}

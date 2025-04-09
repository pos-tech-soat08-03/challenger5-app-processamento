// src/Infrastructure/QueueWorker/QueueWorker.ts
import { ProcessarVideoUseCase } from "../../Core/Usecases/ProcessarVideoUseCase";

export class QueueWorker {
  constructor(private readonly processarVideoUseCase: ProcessarVideoUseCase) {}

  async start(): Promise<void> {
    console.log("QueueWorker iniciado. Iniciando polling da fila SQS...");
    while (true) {
      try {
        await this.processarVideoUseCase.executar();
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

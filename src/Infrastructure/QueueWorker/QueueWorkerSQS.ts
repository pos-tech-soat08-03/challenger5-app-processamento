import { VideoQueueHandler } from "../../Core/Handlers/VideoQueueHandler";

export class QueueWorker {
  private isRunning: boolean = false;
  private currentDelay: number = 1000;
  private timeoutRef?: NodeJS.Timeout;
  private consecutiveErrors: number = 0;

  constructor(private readonly queueHandler: VideoQueueHandler) {}

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log("Worker já está em execução");
      return;
    }

    this.isRunning = true;
    console.log("Iniciando worker...");

    const poll = async () => {
      if (!this.isRunning) return;

      try {
        await this.queueHandler.handle();
        this.consecutiveErrors = 0;
        this.currentDelay = 1000;
      } catch (error) {
        this.consecutiveErrors++;
        console.error("Erro no processamento:", error);
        this.currentDelay = Math.min(1000 * 2 ** this.consecutiveErrors, 30000);
      }

      if (this.isRunning) {
        this.timeoutRef = setTimeout(poll, this.currentDelay);
      }
    };

    await poll();
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    if (this.timeoutRef) {
      clearTimeout(this.timeoutRef);
    }
    console.log("Worker parado com sucesso");
  }
}

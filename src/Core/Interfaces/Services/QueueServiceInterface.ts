import { MessageVideoData } from "../../Entity/MessageVideoData";

export interface QueueServiceInterface {
  receberProximoVideo(): Promise<MessageVideoData | null>;
  deletarMensagemDaFila(receiptHandle: string): Promise<void>;
}


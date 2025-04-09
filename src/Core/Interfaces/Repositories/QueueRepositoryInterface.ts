import { MessageVideoData } from "../../Entity/MessageVideoData";

export interface QueueRepositoryInterface {
  receberProximoVideo(): Promise<MessageVideoData | null>;
  deletarMensagemDaFila(receiptHandle: string): Promise<void>;
}


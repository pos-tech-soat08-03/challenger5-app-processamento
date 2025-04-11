import { MessageVideoData } from "../../Entity/MessageVideoData";

export interface QueueServiceInterface {
  receberProximaMensagem(): Promise<MessageVideoData | null>;
  deletarMensagem(message: MessageVideoData): Promise<void>;
}

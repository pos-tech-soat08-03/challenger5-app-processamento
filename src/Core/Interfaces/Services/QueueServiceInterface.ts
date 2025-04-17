import { ResponseMessage } from "../ResponseMessage";

export interface QueueServiceInterface {
  receberProximaMensagem(): Promise<ResponseMessage | null>;
  deletarMensagem(message: ResponseMessage): Promise<void>;
}

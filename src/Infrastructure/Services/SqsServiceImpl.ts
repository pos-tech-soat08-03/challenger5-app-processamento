// src/Application/Adapters/SqsServiceImpl.ts
import {
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs";
import { SqsConfig } from "../Configs/SqsConfig";
import { QueueServiceInterface } from "../../Core/Interfaces/Services/QueueServiceInterface";
import { MessageVideoData } from "../../Core/Entity/MessageVideoData";
import { ResponseMessage } from "../../Core/Interfaces/ResponseMessage";

export class SqsServiceImpl implements QueueServiceInterface {
  constructor(private readonly sqsConfig: SqsConfig) {}

  async receberProximaMensagem(): Promise<ResponseMessage | null> {
    const command = new ReceiveMessageCommand({
      QueueUrl: this.sqsConfig.getQueueUrl(),
      MaxNumberOfMessages: 1,
      WaitTimeSeconds: 20,
    });

    const response = await this.sqsConfig.getClient().send(command);
    if (!response.Messages || response.Messages.length === 0) {
      return null;
    }

    const message = response.Messages[0];
    const body = JSON.parse(message.Body || "{}") as MessageVideoData;
    return {
      body,
      message: message.ReceiptHandle!,
    };
  }
  async deletarMensagem(responseMessage: ResponseMessage): Promise<void> {
    const command = new DeleteMessageCommand({
      QueueUrl: this.sqsConfig.getQueueUrl(),
      ReceiptHandle: responseMessage.message,
    });

    try {
      await this.sqsConfig.getClient().send(command);
      console.log("Mensagem deletada da fila SQS:", responseMessage.message);
    } catch (error) {
      console.error("Erro ao deletar mensagem:", error);
      throw error;
    }
  }
}

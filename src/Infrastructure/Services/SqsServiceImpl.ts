// src/Application/Adapters/SqsServiceImpl.ts
import {
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs";
import { SqsConfig } from "../Configs/SqsConfig";
import { QueueServiceInterface } from "../../Core/Interfaces/Services/QueueServiceInterface";
import { MessageVideoData } from "../../Core/Entity/MessageVideoData";

export class SqsServiceImpl implements QueueServiceInterface {
  constructor(private readonly sqsConfig: SqsConfig) {}

  async receberProximoVideo(): Promise<MessageVideoData | null> {
    const command = new ReceiveMessageCommand({
      QueueUrl: this.sqsConfig.getQueueUrl(),
      MaxNumberOfMessages: 1,
      WaitTimeSeconds: 20,
    });

    const response = await this.sqsConfig.getClient().send(command);
    if (!response.Messages || response.Messages.length === 0) {
      console.log("Nenhuma mensagem recebida na fila SQS.");
      return null;
    }

    const message = response.Messages[0];
    const body = JSON.parse(message.Body || "{}") as MessageVideoData;
    (body as any).receiptHandle = message.ReceiptHandle;
    return body;
  }
  async deletarMensagemDaFila(receiptHandle: string): Promise<void> {
    const command = new DeleteMessageCommand({
      QueueUrl: this.sqsConfig.getQueueUrl(),
      ReceiptHandle: receiptHandle,
    });

    await this.sqsConfig.getClient().send(command);
    console.log("Mensagem deletada da fila SQS:", receiptHandle);
  }
}

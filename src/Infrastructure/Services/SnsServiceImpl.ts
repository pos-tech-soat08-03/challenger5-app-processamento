// src/Application/Adapters/SnsServiceImpl.ts
import { PublishCommand } from "@aws-sdk/client-sns";
import { NotificationServiceInterface } from "../../Core/Interfaces/Services/NotificationServiceInterface";
import { MessageStatusEntity } from "../../Core/Entity/MessageStatusEntity";
import { MessageErrorEntity } from "../../Core/Entity/MessageErrorEntity"; // Novo
import { SnsConfig } from "../Configs/SnsConfig";

export class SnsServiceImpl implements NotificationServiceInterface {
  constructor(private readonly snsConfig: SnsConfig) {}

  async informarStatus(
    status: MessageStatusEntity | MessageErrorEntity
  ): Promise<void> {
    const message = JSON.stringify(status);
    const params = {
      Message: message,
      TopicArn: this.snsConfig.getTopicArn(),
    };

    try {
      const comando = new PublishCommand(params);
      await this.snsConfig.getClient().send(comando);
      console.log(`Notificação enviada: ${message}`);
    } catch (erro) {
      console.error("Erro ao enviar notificação:", erro);
      throw erro;
    }
  }
}

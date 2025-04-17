import { PublishCommand } from "@aws-sdk/client-sns";
import { NotificationServiceInterface } from "../../Core/Interfaces/Services/NotificationServiceInterface";
import { MessageStatusEntity } from "../../Core/Entity/MessageStatusEntity";
import { MessageErrorEntity } from "../../Core/Entity/MessageErrorEntity";
import { SnsConfig } from "../Configs/SnsConfig";

export class SnsServiceImpl implements NotificationServiceInterface {
  constructor(private readonly snsConfig: SnsConfig) {}

  async informarStatus(
    status: MessageStatusEntity | MessageErrorEntity
  ): Promise<void> {
    const message = JSON.stringify(status);
    const topicArn =
      status instanceof MessageErrorEntity
        ? this.snsConfig.getErrorTopicArn()
        : this.snsConfig.getStatusTopicArn();

    const params = {
      Message: message,
      TopicArn: topicArn,
    };

    try {
      const comando = new PublishCommand(params);
      await this.snsConfig.getClient().send(comando);
      console.log(`Notificação enviada para ${topicArn}: ${message}`);
    } catch (erro) {
      console.error(`Erro ao enviar notificação para ${topicArn}:`, erro);
      throw erro;
    }
  }
}

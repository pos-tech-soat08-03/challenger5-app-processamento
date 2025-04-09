import { MessageErrorEntity } from "../../Entity/MessageErrorEntity";
import { MessageStatusEntity } from "../../Entity/MessageStatusEntity";

export interface NotificationRepositoryInterface {
  informarStatus(
    status: MessageStatusEntity | MessageErrorEntity
  ): Promise<void>;
}

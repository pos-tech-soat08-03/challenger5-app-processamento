import { MessageErrorEntity } from "../../Entity/MessageErrorEntity";
import { MessageStatusEntity } from "../../Entity/MessageStatusEntity";

export interface NotificationServiceInterface {
  informarStatus(
    status: MessageStatusEntity | MessageErrorEntity
  ): Promise<void>;
}

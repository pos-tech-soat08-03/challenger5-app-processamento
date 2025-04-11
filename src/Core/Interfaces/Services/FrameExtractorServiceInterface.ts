import { MessageVideoData } from "../../Entity/MessageVideoData";
import { NotificationServiceInterface } from "./NotificationServiceInterface";

export interface FrameExtractorServiceInterface {
  extractFrames(
    videoPath: string,
    videoData: MessageVideoData,
    notificationService: NotificationServiceInterface
  ): Promise<void>;
}

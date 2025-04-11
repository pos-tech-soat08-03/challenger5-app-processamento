import { MessageVideoData } from "../../Entity/MessageVideoData";
import { VideoEntity } from "../../Entity/VideoEntity";
import { NotificationServiceInterface } from "./NotificationServiceInterface";

export interface FrameExtractorServiceInterface {
  extractFrames(
    videoPath: string,
    config: MessageVideoData["config"],
    video: VideoEntity,
    notificationRepo: NotificationServiceInterface
  ): Promise<void>;
}

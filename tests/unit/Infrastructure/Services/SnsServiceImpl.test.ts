import { SnsServiceImpl } from "../../../../src/Infrastructure/Services/SnsServiceImpl";
import { SnsConfig } from "../../../../src/Infrastructure/Configs/SnsConfig";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { MessageStatusEntity } from "../../../../src/Core/Entity/MessageStatusEntity";
import { MessageErrorEntity } from "../../../../src/Core/Entity/MessageErrorEntity";

jest.mock("@aws-sdk/client-sns", () => ({
  SNSClient: jest.fn(),
  PublishCommand: jest.fn((params) => params),
}));

const mockConsoleLog = jest.spyOn(console, "log").mockImplementation(() => {});
const mockConsoleError = jest
  .spyOn(console, "error")
  .mockImplementation(() => {});

describe("SnsServiceImpl", () => {
  let snsService: SnsServiceImpl;
  let mockSnsClient: jest.Mocked<SNSClient>;
  let mockSnsConfig: jest.Mocked<SnsConfig>;

  const statusEntity = MessageStatusEntity.create(
    "video-123",
    "user-456",
    "COMPLETED",
    100,
    "2025-04-11T12:00:00Z",
    "https://s3.amazonaws.com/my-bucket/video-123.zip"
  );
  const errorEntity = MessageErrorEntity.create(
    "video-123",
    "user-456",
    "ERROR",
    "Failed to process video"
  );

  beforeEach(() => {
    jest.clearAllMocks();

    mockSnsClient = {
      send: jest.fn(async (command: PublishCommand) =>
        Promise.resolve({ $metadata: {}, MessageId: "msg-123" })
      ) as jest.MockedFunction<
        (
          command: PublishCommand
        ) => Promise<{ $metadata: {}; MessageId: string }>
      >,
    } as unknown as jest.Mocked<SNSClient>;

    mockSnsConfig = {
      getClient: jest.fn().mockReturnValue(mockSnsClient),
      getStatusTopicArn: jest
        .fn()
        .mockReturnValue(
          "arn:aws:sns:us-east-1:123456789012:test-status-topic"
        ),
      getErrorTopicArn: jest
        .fn()
        .mockReturnValue("arn:aws:sns:us-east-1:123456789012:test-error-topic"),
    } as unknown as jest.Mocked<SnsConfig>;

    snsService = new SnsServiceImpl(mockSnsConfig);
  });

  afterEach(() => {
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  describe("informarStatus", () => {
    it("should publish a status message to status topic", async () => {
      const expectedMessage = JSON.stringify(statusEntity);

      await snsService.informarStatus(statusEntity);

      expect(mockSnsConfig.getClient).toHaveBeenCalled();
      expect(mockSnsConfig.getStatusTopicArn).toHaveBeenCalled();
      expect(mockSnsConfig.getErrorTopicArn).not.toHaveBeenCalled();
      expect(mockSnsClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          TopicArn: "arn:aws:sns:us-east-1:123456789012:test-status-topic",
          Message: expectedMessage,
        })
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        `Notificação enviada para arn:aws:sns:us-east-1:123456789012:test-status-topic: ${expectedMessage}`
      );
    });

    it("should publish an error message to error topic", async () => {
      const expectedMessage = JSON.stringify(errorEntity);

      await snsService.informarStatus(errorEntity);

      expect(mockSnsConfig.getClient).toHaveBeenCalled();
      expect(mockSnsConfig.getStatusTopicArn).not.toHaveBeenCalled();
      expect(mockSnsConfig.getErrorTopicArn).toHaveBeenCalled();
      expect(mockSnsClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          TopicArn: "arn:aws:sns:us-east-1:123456789012:test-error-topic",
          Message: expectedMessage,
        })
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        `Notificação enviada para arn:aws:sns:us-east-1:123456789012:test-error-topic: ${expectedMessage}`
      );
    });

    it("should throw an error if SNS client fails", async () => {
      mockSnsClient.send.mockImplementationOnce(() =>
        Promise.reject(new Error("SNS publish failed"))
      );

      await expect(snsService.informarStatus(statusEntity)).rejects.toThrow(
        "SNS publish failed"
      );
      expect(mockSnsClient.send).toHaveBeenCalled();
      expect(mockConsoleError).toHaveBeenCalledWith(
        `Erro ao enviar notificação para arn:aws:sns:us-east-1:123456789012:test-status-topic:`,
        expect.any(Error)
      );
    });
  });
});

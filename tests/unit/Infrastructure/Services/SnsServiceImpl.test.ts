import { SnsServiceImpl } from "../../../../src/Infrastructure/Services/SnsServiceImpl";
import { SnsConfig } from "../../../../src/Infrastructure/Configs/SnsConfig";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { MessageStatusEntity } from "../../../../src/Core/Entity/MessageStatusEntity";
import { MessageErrorEntity } from "../../../../src/Core/Entity/MessageErrorEntity";

// Mock do SNSClient
jest.mock("@aws-sdk/client-sns", () => ({
  SNSClient: jest.fn(),
  PublishCommand: jest.fn((params) => params),
}));

// Mock do console.log
const mockConsoleLog = jest.spyOn(console, "log").mockImplementation(() => {});
const mockConsoleError = jest
  .spyOn(console, "error")
  .mockImplementation(() => {});

describe("SnsServiceImpl", () => {
  let snsService: SnsServiceImpl;
  let mockSnsClient: jest.Mocked<SNSClient>;
  let mockSnsConfig: jest.Mocked<SnsConfig>;

  // Dados de teste
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

    // Configura o mock do SNSClient
    mockSnsClient = {
      send: jest.fn(async (command: PublishCommand) =>
        Promise.resolve({ $metadata: {}, MessageId: "msg-123" })
      ) as jest.MockedFunction<(command: PublishCommand) => Promise<any>>,
    } as unknown as jest.Mocked<SNSClient>;

    // Configura o mock do SnsConfig
    mockSnsConfig = {
      getClient: jest.fn().mockReturnValue(mockSnsClient),
      getTopicArn: jest
        .fn()
        .mockReturnValue("arn:aws:sns:us-east-1:123456789012:test-topic"),
    } as unknown as jest.Mocked<SnsConfig>;

    // Instancia o serviço
    snsService = new SnsServiceImpl(mockSnsConfig);
  });

  afterEach(() => {
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear(); // Limpa também o console.error
  });

  // Atualize o bloco afterAll
  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore(); // Restaura o console.error
  });

  describe("informarStatus", () => {
    it("should publish a status message successfully", async () => {
      // Arrange
      const expectedMessage = JSON.stringify({
        idVideo: "video-123",
        idUsuario: "user-456",
        status: "COMPLETED",
        percentage: 100,
        statusTime: "2025-04-11T12:00:00Z",
        presignedUrl: "https://s3.amazonaws.com/my-bucket/video-123.zip",
      });

      // Act
      await snsService.informarStatus(statusEntity);

      // Assert
      expect(mockSnsConfig.getClient).toHaveBeenCalled();
      expect(mockSnsConfig.getTopicArn).toHaveBeenCalled();
      expect(mockSnsClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          TopicArn: "arn:aws:sns:us-east-1:123456789012:test-topic",
          Message: expectedMessage,
        })
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        `Notificação enviada: ${expectedMessage}`
      );
    });

    it("should publish an error message successfully", async () => {
      // Arrange
      const expectedMessage = JSON.stringify({
        idVideo: "video-123",
        idUsuario: "user-456",
        status: "ERROR",
        errorMessage: "Failed to process video",
        statusTime: errorEntity.statusTime, // Usa o statusTime real da entidade
      });

      // Act
      await snsService.informarStatus(errorEntity);

      // Assert
      expect(mockSnsConfig.getClient).toHaveBeenCalled();
      expect(mockSnsConfig.getTopicArn).toHaveBeenCalled();
      expect(mockSnsClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          TopicArn: "arn:aws:sns:us-east-1:123456789012:test-topic",
          Message: expectedMessage,
        })
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        `Notificação enviada: ${expectedMessage}`
      ); // Adiciona o espaço
    });

    it("should throw an error if SNS client fails", async () => {
      // Arrange
      mockSnsClient.send.mockImplementationOnce(() =>
        Promise.reject(new Error("SNS publish failed"))
      );

      // Act & Assert
      await expect(snsService.informarStatus(statusEntity)).rejects.toThrow(
        "SNS publish failed"
      );
      expect(mockSnsClient.send).toHaveBeenCalled();
      expect(mockConsoleLog).not.toHaveBeenCalled();
      expect(mockConsoleError).toHaveBeenCalledWith(
        "Erro ao enviar notificação:",
        expect.any(Error)
      );
    });
  });
});

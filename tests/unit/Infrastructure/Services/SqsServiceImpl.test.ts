import { SqsServiceImpl } from "../../../../src/Infrastructure/Services/SqsServiceImpl";
import { SqsConfig } from "../../../../src/Infrastructure/Configs/SqsConfig";
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  ReceiveMessageCommandOutput,
  DeleteMessageCommandOutput,
} from "@aws-sdk/client-sqs";
import { ResponseMessage } from "../../../../src/Core/Interfaces/ResponseMessage";

// Mock do SQSClient
jest.mock("@aws-sdk/client-sqs", () => ({
  SQSClient: jest.fn(),
  ReceiveMessageCommand: jest.fn((params) => params),
  DeleteMessageCommand: jest.fn((params) => params),
}));

// Mock do console.log
const mockConsoleLog = jest.spyOn(console, "log").mockImplementation(() => {});
const mockConsoleError = jest
  .spyOn(console, "error")
  .mockImplementation(() => {});

describe("SqsServiceImpl", () => {
  let sqsService: SqsServiceImpl;
  let mockSqsClient: jest.Mocked<SQSClient>;
  let mockSqsConfig: jest.Mocked<SqsConfig>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Configura o mock do SQSClient com tipagem explícita
    mockSqsClient = {
      send: jest.fn(
        async (command: ReceiveMessageCommand | DeleteMessageCommand) => {
          if (command instanceof ReceiveMessageCommand) {
            return {
              $metadata: {},
              Messages: [],
            } as ReceiveMessageCommandOutput;
          }
          if (command instanceof DeleteMessageCommand) {
            return { $metadata: {} } as DeleteMessageCommandOutput;
          }
          throw new Error("Comando desconhecido");
        }
      ) as jest.MockedFunction<
        (
          command: ReceiveMessageCommand | DeleteMessageCommand
        ) => Promise<ReceiveMessageCommandOutput | DeleteMessageCommandOutput>
      >,
    } as unknown as jest.Mocked<SQSClient>;

    // Configura o mock do SqsConfig
    mockSqsConfig = {
      getClient: jest.fn().mockReturnValue(mockSqsClient),
      getQueueUrl: jest
        .fn()
        .mockReturnValue("http://localhost:4566/queue/test-queue"),
    } as unknown as jest.Mocked<SqsConfig>;

    // Instancia o serviço
    sqsService = new SqsServiceImpl(mockSqsConfig);
  });

  afterEach(() => {
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  describe("receberProximaMensagem", () => {
    it("should return null when no messages are in the queue", async () => {
      // Arrange
      const emptyResponse: ReceiveMessageCommandOutput = {
        $metadata: {},
        Messages: [],
      };
      mockSqsClient.send.mockImplementationOnce(() =>
        Promise.resolve(emptyResponse)
      );

      // Act
      const result = await sqsService.receberProximaMensagem();

      // Assert
      expect(mockSqsConfig.getClient).toHaveBeenCalled();
      expect(mockSqsConfig.getQueueUrl).toHaveBeenCalled();
      expect(mockSqsClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          QueueUrl: "http://localhost:4566/queue/test-queue",
          MaxNumberOfMessages: 1,
          WaitTimeSeconds: 20,
        })
      );
      expect(result).toBeNull();
    });

    it("should return ResponseMessage when a message is received", async () => {
      // Arrange
      const messageBody = {
        user: { id_usuario: "user-456", email: "user@example.com" },
        video: {
          id_video: "video-123",
          title: "Test Video",
          description: "A test video",
          filename: "video.mp4",
          full_path: "s3://my-bucket/videos/video.mp4",
          file_size: 1000000,
          duration: 120,
          framerate: 24,
        },
        config: {
          output_format: "png",
          resolution: "1280x720",
          interval: 1,
        },
      };
      const sqsMessage: ReceiveMessageCommandOutput = {
        $metadata: {},
        Messages: [
          {
            Body: JSON.stringify({ Message: messageBody }),
            ReceiptHandle: "receipt-789",
          },
        ],
      };
      mockSqsClient.send.mockImplementationOnce(() =>
        Promise.resolve(sqsMessage)
      );

      // Act
      const result = await sqsService.receberProximaMensagem();

      // Assert
      expect(mockSqsClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          QueueUrl: "http://localhost:4566/queue/test-queue",
          MaxNumberOfMessages: 1,
          WaitTimeSeconds: 20,
        })
      );
      expect(result).toEqual({
        body: messageBody,
        message: "receipt-789",
      } as ResponseMessage);
    });

    it("should throw an error if SQS client fails", async () => {
      // Arrange
      mockSqsClient.send.mockImplementationOnce(() =>
        Promise.reject(new Error("SQS connection failed"))
      );

      // Act & Assert
      await expect(sqsService.receberProximaMensagem()).rejects.toThrow(
        "SQS connection failed"
      );
      expect(mockSqsClient.send).toHaveBeenCalled();
    });
  });

  describe("deletarMensagem", () => {
    it("should delete a message successfully", async () => {
      // Arrange
      const responseMessage: ResponseMessage = {
        body: {
          user: { id_usuario: "user-456", email: "user@example.com" },
          video: {
            id_video: "video-123",
            title: "Test Video",
            description: "A test video",
            filename: "video.mp4",
            full_path: "s3://my-bucket/videos/video.mp4",
            file_size: 1000000,
            duration: 120,
            framerate: 24,
          },
          config: {
            output_format: "png",
            resolution: "1280x720",
            interval: 1,
          },
        },
        message: "receipt-789",
      };
      const deleteResponse: DeleteMessageCommandOutput = { $metadata: {} };
      mockSqsClient.send.mockImplementationOnce(() =>
        Promise.resolve(deleteResponse)
      );

      // Act
      await sqsService.deletarMensagem(responseMessage);

      // Assert
      expect(mockSqsConfig.getClient).toHaveBeenCalled();
      expect(mockSqsConfig.getQueueUrl).toHaveBeenCalled();
      expect(mockSqsClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          QueueUrl: "http://localhost:4566/queue/test-queue",
          ReceiptHandle: "receipt-789",
        })
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        "Mensagem deletada da fila SQS:",
        "receipt-789"
      );
    });

    it("should throw an error if deletion fails", async () => {
      // Arrange
      const responseMessage: ResponseMessage = {
        body: {
          user: { id_usuario: "user-456", email: "user@example.com" },
          video: {
            id_video: "video-123",
            title: "Test Video",
            description: "A test video",
            filename: "video.mp4",
            full_path: "s3://my-bucket/videos/video.mp4",
            file_size: 1000000,
            duration: 120,
            framerate: 24,
          },
          config: {
            output_format: "png",
            resolution: "1280x720",
            interval: 1,
          },
        },
        message: "receipt-789",
      };
      mockSqsClient.send.mockImplementationOnce(() =>
        Promise.reject(new Error("Deletion failed"))
      );

      // Act & Assert
      await expect(sqsService.deletarMensagem(responseMessage)).rejects.toThrow(
        "Deletion failed"
      );
      expect(mockSqsClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          QueueUrl: "http://localhost:4566/queue/test-queue",
          ReceiptHandle: "receipt-789",
        })
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        "Erro ao deletar mensagem:",
        expect.any(Error)
      );
    });
  });
});

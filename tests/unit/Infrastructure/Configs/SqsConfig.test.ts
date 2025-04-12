import { SqsConfig } from "../../../../src/Infrastructure/Configs/SqsConfig";
import { SQSClient } from "@aws-sdk/client-sqs";

// Mock do SQSClient
jest.mock("@aws-sdk/client-sqs", () => ({
  SQSClient: jest.fn(),
}));

describe("SqsConfig", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Salva e limpa variáveis de ambiente
    originalEnv = { ...process.env };
    jest.clearAllMocks();
    delete process.env.NODE_ENV;
    delete process.env.AWS_REGION;
    delete process.env.SQS_QUEUE_URL;
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
  });

  afterEach(() => {
    // Restaura variáveis de ambiente
    process.env = originalEnv;
  });

  it("should initialize SQS client with default region and no credentials for production", () => {
    // Act
    const config = new SqsConfig();

    // Assert
    expect(SQSClient).toHaveBeenCalledWith({
      region: "us-east-1",
      endpoint: undefined,
      credentials: {
        accessKeyId: "",
        secretAccessKey: "",
      },
    });
    expect(config.getClient()).toBeInstanceOf(SQSClient);
    expect(config.getQueueUrl()).toBe(
      "https://sqs.us-east-1.amazonaws.com/SEU_ACCOUNT_ID/sua-fila-sqs"
    );
  });

  it("should initialize SQS client for local environment with LocalStack", () => {
    // Arrange
    process.env.NODE_ENV = "local";

    // Act
    const config = new SqsConfig();

    // Assert
    expect(SQSClient).toHaveBeenCalledWith({
      region: "us-east-1",
      endpoint: "http://localhost:4566",
      credentials: {
        accessKeyId: "test",
        secretAccessKey: "test",
      },
    });
    expect(config.getClient()).toBeInstanceOf(SQSClient);
    expect(config.getQueueUrl()).toBe(
      "http://localhost:4566/000000000000/sua-fila-sqs"
    );
  });

  it("should use environment variables for region and queue URL when provided", () => {
    // Arrange
    process.env.AWS_REGION = "us-west-2";
    process.env.SQS_QUEUE_URL =
      "https://sqs.us-west-2.amazonaws.com/123456789012/my-queue";

    // Act
    const config = new SqsConfig();

    // Assert
    expect(SQSClient).toHaveBeenCalledWith({
      region: "us-west-2",
      endpoint: undefined,
      credentials: {
        accessKeyId: "",
        secretAccessKey: "",
      },
    });
    expect(config.getQueueUrl()).toBe(
      "https://sqs.us-west-2.amazonaws.com/123456789012/my-queue"
    );
  });

  it("should use AWS credentials from environment variables in production", () => {
    // Arrange
    process.env.AWS_ACCESS_KEY_ID = "prod-key";
    process.env.AWS_SECRET_ACCESS_KEY = "prod-secret";

    // Act
    const config = new SqsConfig();

    // Assert
    expect(SQSClient).toHaveBeenCalledWith({
      region: "us-east-1",
      endpoint: undefined,
      credentials: {
        accessKeyId: "prod-key",
        secretAccessKey: "prod-secret",
      },
    });
  });

  it("should prioritize SQS_QUEUE_URL over default in local environment", () => {
    // Arrange
    process.env.NODE_ENV = "local";
    process.env.SQS_QUEUE_URL = "http://localhost:4566/queue/custom-queue";

    // Act
    const config = new SqsConfig();

    // Assert
    expect(config.getQueueUrl()).toBe(
      "http://localhost:4566/queue/custom-queue"
    );
  });
});

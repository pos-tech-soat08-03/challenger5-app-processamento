import { SnsConfig } from "../../../../src/Infrastructure/Configs/SnsConfig";
import { SNSClient } from "@aws-sdk/client-sns";

// Mock do SNSClient
jest.mock("@aws-sdk/client-sns", () => ({
  SNSClient: jest.fn(),
}));

describe("SnsConfig", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Salva e limpa variáveis de ambiente
    originalEnv = { ...process.env };
    jest.clearAllMocks();
    delete process.env.NODE_ENV;
    delete process.env.AWS_REGION;
    delete process.env.SNS_TOPIC_ARN;
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
  });

  afterEach(() => {
    // Restaura variáveis de ambiente
    process.env = originalEnv;
  });

  it("should initialize SNS client with default region and no credentials for production", () => {
    // Act
    const config = new SnsConfig();

    // Assert
    expect(SNSClient).toHaveBeenCalledWith({
      region: "us-east-1",
      endpoint: undefined,
      credentials: {
        accessKeyId: "",
        secretAccessKey: "",
      },
    });
    expect(config.getClient()).toBeInstanceOf(SNSClient);
    expect(config.getTopicArn()).toBe(
      "arn:aws:sns:us-east-1:SEU_ACCOUNT_ID:VideoStatusTopic"
    );
  });

  it("should initialize SNS client for local environment with LocalStack", () => {
    // Arrange
    process.env.NODE_ENV = "local";

    // Act
    const config = new SnsConfig();

    // Assert
    expect(SNSClient).toHaveBeenCalledWith({
      region: "us-east-1",
      endpoint: "http://localhost:4566",
      credentials: {
        accessKeyId: "test",
        secretAccessKey: "test",
      },
    });
    expect(config.getClient()).toBeInstanceOf(SNSClient);
    expect(config.getTopicArn()).toBe(
      "arn:aws:sns:us-east-1:000000000000:VideoStatusTopic"
    );
  });

  it("should use environment variables for region and topic ARN when provided", () => {
    // Arrange
    process.env.AWS_REGION = "us-west-2";
    process.env.SNS_TOPIC_ARN =
      "arn:aws:sns:us-west-2:123456789012:custom-topic";

    // Act
    const config = new SnsConfig();

    // Assert
    expect(SNSClient).toHaveBeenCalledWith({
      region: "us-west-2",
      endpoint: undefined,
      credentials: {
        accessKeyId: "",
        secretAccessKey: "",
      },
    });
    expect(config.getTopicArn()).toBe(
      "arn:aws:sns:us-west-2:123456789012:custom-topic"
    );
  });

  it("should use AWS credentials from environment variables in production", () => {
    // Arrange
    process.env.AWS_ACCESS_KEY_ID = "prod-key";
    process.env.AWS_SECRET_ACCESS_KEY = "prod-secret";

    // Act
    const config = new SnsConfig();

    // Assert
    expect(SNSClient).toHaveBeenCalledWith({
      region: "us-east-1",
      endpoint: undefined,
      credentials: {
        accessKeyId: "prod-key",
        secretAccessKey: "prod-secret",
      },
    });
  });

  it("should prioritize SNS_TOPIC_ARN over default in local environment", () => {
    // Arrange
    process.env.NODE_ENV = "local";
    process.env.SNS_TOPIC_ARN =
      "arn:aws:sns:us-east-1:000000000000:custom-local-topic";

    // Act
    const config = new SnsConfig();

    // Assert
    expect(config.getTopicArn()).toBe(
      "arn:aws:sns:us-east-1:000000000000:custom-local-topic"
    );
  });
});

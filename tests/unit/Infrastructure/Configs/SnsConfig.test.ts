import { SnsConfig } from "../../../../src/Infrastructure/Configs/SnsConfig";
import { SNSClient } from "@aws-sdk/client-sns";

jest.mock("@aws-sdk/client-sns", () => ({
  SNSClient: jest.fn(),
}));

describe("SnsConfig", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    jest.clearAllMocks();
    delete process.env.NODE_ENV;
    delete process.env.AWS_REGION;
    delete process.env.AWS_ENDPOINT;
    delete process.env.SNS_STATUS_TOPIC_ARN;
    delete process.env.SNS_ERROR_TOPIC_ARN;
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should initialize SNS client with default region and no credentials for production", () => {
    expect(() => new SnsConfig()).toThrow(
      "Missing required environment variable: SNS_STATUS_TOPIC_ARN"
    );

    expect(SNSClient).toHaveBeenCalledWith({
      region: "us-east-1",
      endpoint: undefined,
      credentials: {
        accessKeyId: "",
        secretAccessKey: "",
      },
    });
  });

  it("should initialize SNS client for local environment with LocalStack", () => {
    process.env.NODE_ENV = "local";

    const config = new SnsConfig();

    expect(SNSClient).toHaveBeenCalledWith({
      region: "us-east-1",
      endpoint: "http://localhost:4566",
      credentials: {
        accessKeyId: "test",
        secretAccessKey: "test",
      },
    });
    expect(config.getStatusTopicArn()).toBe(
      "arn:aws:sns:us-east-1:000000000000:VideoStatusTopic"
    );
    expect(config.getErrorTopicArn()).toBe(
      "arn:aws:sns:us-east-1:000000000000:VideoErrorTopic"
    );
  });

  it("should use environment variables for region, endpoint, and topic ARNs", () => {
    process.env.AWS_REGION = "us-west-2";
    process.env.AWS_ENDPOINT = "http://custom-endpoint:4566";
    process.env.SNS_STATUS_TOPIC_ARN =
      "arn:aws:sns:us-west-2:123456789012:custom-status-topic";
    process.env.SNS_ERROR_TOPIC_ARN =
      "arn:aws:sns:us-west-2:123456789012:custom-error-topic";

    const config = new SnsConfig();

    expect(SNSClient).toHaveBeenCalledWith({
      region: "us-west-2",
      endpoint: "http://custom-endpoint:4566",
      credentials: {
        accessKeyId: "",
        secretAccessKey: "",
      },
    });
    expect(config.getStatusTopicArn()).toBe(
      "arn:aws:sns:us-west-2:123456789012:custom-status-topic"
    );
    expect(config.getErrorTopicArn()).toBe(
      "arn:aws:sns:us-west-2:123456789012:custom-error-topic"
    );
  });

  it("should use AWS credentials from environment variables in production", () => {
    process.env.AWS_ACCESS_KEY_ID = "prod-key";
    process.env.AWS_SECRET_ACCESS_KEY = "prod-secret";
    process.env.SNS_STATUS_TOPIC_ARN =
      "arn:aws:sns:us-east-1:123456789012:status-topic";
    process.env.SNS_ERROR_TOPIC_ARN =
      "arn:aws:sns:us-east-1:123456789012:error-topic";

    const config = new SnsConfig();

    expect(SNSClient).toHaveBeenCalledWith({
      region: "us-east-1",
      endpoint: undefined,
      credentials: {
        accessKeyId: "prod-key",
        secretAccessKey: "prod-secret",
      },
    });
    expect(config.getStatusTopicArn()).toBe(
      "arn:aws:sns:us-east-1:123456789012:status-topic"
    );
    expect(config.getErrorTopicArn()).toBe(
      "arn:aws:sns:us-east-1:123456789012:error-topic"
    );
  });

  it("should prioritize SNS topic ARNs over default in local environment", () => {
    process.env.NODE_ENV = "local";
    process.env.SNS_STATUS_TOPIC_ARN =
      "arn:aws:sns:us-east-1:000000000000:custom-local-status-topic";
    process.env.SNS_ERROR_TOPIC_ARN =
      "arn:aws:sns:us-east-1:000000000000:custom-local-error-topic";

    const config = new SnsConfig();

    expect(config.getStatusTopicArn()).toBe(
      "arn:aws:sns:us-east-1:000000000000:custom-local-status-topic"
    );
    expect(config.getErrorTopicArn()).toBe(
      "arn:aws:sns:us-east-1:000000000000:custom-local-error-topic"
    );
  });
});

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
    delete process.env.AWS_REGION;
    delete process.env.SNS_STATUS_TOPIC_ARN;
    delete process.env.SNS_ERROR_TOPIC_ARN;
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should throw error if SNS_STATUS_TOPIC_ARN or SNS_ERROR_TOPIC_ARN is not set", () => {
    expect(() => new SnsConfig()).toThrow(
      "Missing required environment variable: SNS_STATUS_TOPIC_ARN"
    );

    expect(SNSClient).toHaveBeenCalledWith({
      region: "us-east-1",
      credentials: {
        accessKeyId: "test",
        secretAccessKey: "test",
      },
    });
  });

  it("should initialize SNS client with default region and test credentials", () => {
    process.env.SNS_STATUS_TOPIC_ARN =
      "arn:aws:sns:us-east-1:000000000000:VideoStatusTopic";
    process.env.SNS_ERROR_TOPIC_ARN =
      "arn:aws:sns:us-east-1:000000000000:VideoErrorTopic";

    const config = new SnsConfig();

    expect(SNSClient).toHaveBeenCalledWith({
      region: "us-east-1",
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

  it("should use custom region from environment variable", () => {
    process.env.AWS_REGION = "us-west-2";
    process.env.SNS_STATUS_TOPIC_ARN =
      "arn:aws:sns:us-west-2:000000000000:custom-status-topic";
    process.env.SNS_ERROR_TOPIC_ARN =
      "arn:aws:sns:us-west-2:000000000000:custom-error-topic";

    const config = new SnsConfig();

    expect(SNSClient).toHaveBeenCalledWith({
      region: "us-west-2",
      credentials: {
        accessKeyId: "test",
        secretAccessKey: "test",
      },
    });
    expect(config.getStatusTopicArn()).toBe(
      "arn:aws:sns:us-west-2:000000000000:custom-status-topic"
    );
    expect(config.getErrorTopicArn()).toBe(
      "arn:aws:sns:us-west-2:000000000000:custom-error-topic"
    );
  });

  it("should use AWS credentials from environment variables", () => {
    process.env.AWS_ACCESS_KEY_ID = "prod-key";
    process.env.AWS_SECRET_ACCESS_KEY = "prod-secret";
    process.env.SNS_STATUS_TOPIC_ARN =
      "arn:aws:sns:us-east-1:123456789012:status-topic";
    process.env.SNS_ERROR_TOPIC_ARN =
      "arn:aws:sns:us-east-1:123456789012:error-topic";

    const config = new SnsConfig();

    expect(SNSClient).toHaveBeenCalledWith({
      region: "us-east-1",
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
});

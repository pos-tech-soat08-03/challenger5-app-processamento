import { SqsConfig } from "../../../../src/Infrastructure/Configs/SqsConfig";
import { SQSClient } from "@aws-sdk/client-sqs";

jest.mock("@aws-sdk/client-sqs", () => ({
  SQSClient: jest.fn(),
}));

describe("SqsConfig", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    jest.clearAllMocks();
    delete process.env.AWS_REGION;
    delete process.env.SQS_QUEUE_URL;
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should throw error if SQS_QUEUE_URL is not set", () => {
    expect(() => new SqsConfig()).toThrow(
      "Missing required environment variable: SQS_QUEUE_URL"
    );

    expect(SQSClient).toHaveBeenCalledWith({
      region: "us-east-1",
      credentials: {
        accessKeyId: "test",
        secretAccessKey: "test",
      },
    });
  });

  it("should initialize SQS client with default region and test credentials", () => {
    process.env.SQS_QUEUE_URL =
      "https://sqs.us-east-1.amazonaws.com/000000000000/VideoProcessingQueue";

    const config = new SqsConfig();

    expect(SQSClient).toHaveBeenCalledWith({
      region: "us-east-1",
      credentials: {
        accessKeyId: "test",
        secretAccessKey: "test",
      },
    });
    expect(config.getQueueUrl()).toBe(
      "https://sqs.us-east-1.amazonaws.com/000000000000/VideoProcessingQueue"
    );
  });

  it("should use custom region from environment variable", () => {
    process.env.AWS_REGION = "us-west-2";
    process.env.SQS_QUEUE_URL =
      "https://sqs.us-west-2.amazonaws.com/000000000000/custom-queue";

    const config = new SqsConfig();

    expect(SQSClient).toHaveBeenCalledWith({
      region: "us-west-2",
      credentials: {
        accessKeyId: "test",
        secretAccessKey: "test",
      },
    });
    expect(config.getQueueUrl()).toBe(
      "https://sqs.us-west-2.amazonaws.com/000000000000/custom-queue"
    );
  });

  it("should use AWS credentials from environment variables", () => {
    process.env.AWS_ACCESS_KEY_ID = "prod-key";
    process.env.AWS_SECRET_ACCESS_KEY = "prod-secret";
    process.env.SQS_QUEUE_URL =
      "https://sqs.us-east-1.amazonaws.com/123456789012/my-queue";

    const config = new SqsConfig();

    expect(SQSClient).toHaveBeenCalledWith({
      region: "us-east-1",
      credentials: {
        accessKeyId: "prod-key",
        secretAccessKey: "prod-secret",
      },
    });
    expect(config.getQueueUrl()).toBe(
      "https://sqs.us-east-1.amazonaws.com/123456789012/my-queue"
    );
  });
});

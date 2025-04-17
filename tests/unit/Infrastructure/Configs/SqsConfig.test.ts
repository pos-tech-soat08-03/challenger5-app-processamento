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
    delete process.env.NODE_ENV;
    delete process.env.AWS_REGION;
    delete process.env.AWS_ENDPOINT;
    delete process.env.SQS_QUEUE_URL;
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should initialize SQS client with default region and no credentials for production", () => {
    expect(() => new SqsConfig()).toThrow(
      "Missing required environment variable: SQS_QUEUE_URL"
    );

    expect(SQSClient).toHaveBeenCalledWith({
      region: "us-east-1",
      endpoint: undefined,
      credentials: {
        accessKeyId: "",
        secretAccessKey: "",
      },
    });
  });

  it("should initialize SQS client for local environment with LocalStack", () => {
    process.env.NODE_ENV = "local";

    const config = new SqsConfig();

    expect(SQSClient).toHaveBeenCalledWith({
      region: "us-east-1",
      endpoint: "http://localhost:4566",
      credentials: {
        accessKeyId: "test",
        secretAccessKey: "test",
      },
    });
    expect(config.getQueueUrl()).toBe(
      "http://localhost:4566/000000000000/VideoProcessingQueue"
    );
  });

  it("should use environment variables for region, endpoint, and queue URL", () => {
    process.env.AWS_REGION = "us-west-2";
    process.env.AWS_ENDPOINT = "http://custom-endpoint:4566";
    process.env.SQS_QUEUE_URL =
      "http://custom-endpoint:4566/000000000000/custom-queue";

    const config = new SqsConfig();

    expect(SQSClient).toHaveBeenCalledWith({
      region: "us-west-2",
      endpoint: "http://custom-endpoint:4566",
      credentials: {
        accessKeyId: "",
        secretAccessKey: "",
      },
    });
    expect(config.getQueueUrl()).toBe(
      "http://custom-endpoint:4566/000000000000/custom-queue"
    );
  });

  it("should use AWS credentials from environment variables in production", () => {
    process.env.AWS_ACCESS_KEY_ID = "prod-key";
    process.env.AWS_SECRET_ACCESS_KEY = "prod-secret";
    process.env.SQS_QUEUE_URL =
      "https://sqs.us-west-2.amazonaws.com/123456789012/my-queue";

    const config = new SqsConfig();

    expect(SQSClient).toHaveBeenCalledWith({
      region: "us-east-1",
      endpoint: undefined,
      credentials: {
        accessKeyId: "prod-key",
        secretAccessKey: "prod-secret",
      },
    });
    expect(config.getQueueUrl()).toBe(
      "https://sqs.us-west-2.amazonaws.com/123456789012/my-queue"
    );
  });

  it("should prioritize SQS_QUEUE_URL over default in local environment", () => {
    process.env.NODE_ENV = "local";
    process.env.SQS_QUEUE_URL =
      "http://localhost:4566/000000000000/custom-queue";

    const config = new SqsConfig();

    expect(config.getQueueUrl()).toBe(
      "http://localhost:4566/000000000000/custom-queue"
    );
  });
});

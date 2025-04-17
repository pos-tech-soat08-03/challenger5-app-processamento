import { S3Config } from "../../../../src/Infrastructure/Configs/S3Config";
import { S3Client } from "@aws-sdk/client-s3";

jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn(),
}));

describe("S3Config", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    jest.clearAllMocks();
    delete process.env.NODE_ENV;
    delete process.env.AWS_REGION;
    delete process.env.AWS_ENDPOINT;
    delete process.env.S3_BUCKET_NAME;
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should initialize S3 client with default region and no credentials for production", () => {
    expect(() => new S3Config()).toThrow(
      "Missing required environment variable: S3_BUCKET_NAME"
    );

    expect(S3Client).toHaveBeenCalledWith({
      region: "us-east-1",
      endpoint: undefined,
      credentials: {
        accessKeyId: "",
        secretAccessKey: "",
      },
      forcePathStyle: false,
    });
  });

  it("should initialize S3 client for local environment with LocalStack", () => {
    process.env.NODE_ENV = "local";

    const config = new S3Config();

    expect(S3Client).toHaveBeenCalledWith({
      region: "us-east-1",
      endpoint: "http://localhost:4566",
      credentials: {
        accessKeyId: "test",
        secretAccessKey: "test",
      },
      forcePathStyle: true,
    });
    expect(config.getBucketName()).toBe("video-processing-bucket");
  });

  it("should use environment variables for region, endpoint, and bucket name", () => {
    process.env.AWS_REGION = "us-west-2";
    process.env.AWS_ENDPOINT = "http://custom-endpoint:4566";
    process.env.S3_BUCKET_NAME = "custom-bucket";

    const config = new S3Config();

    expect(S3Client).toHaveBeenCalledWith({
      region: "us-west-2",
      endpoint: "http://custom-endpoint:4566",
      credentials: {
        accessKeyId: "",
        secretAccessKey: "",
      },
      forcePathStyle: false,
    });
    expect(config.getBucketName()).toBe("custom-bucket");
  });

  it("should use AWS credentials from environment variables in production", () => {
    process.env.AWS_ACCESS_KEY_ID = "prod-key";
    process.env.AWS_SECRET_ACCESS_KEY = "prod-secret";
    process.env.S3_BUCKET_NAME = "prod-bucket";

    const config = new S3Config();

    expect(S3Client).toHaveBeenCalledWith({
      region: "us-east-1",
      endpoint: undefined,
      credentials: {
        accessKeyId: "prod-key",
        secretAccessKey: "prod-secret",
      },
      forcePathStyle: false,
    });
    expect(config.getBucketName()).toBe("prod-bucket");
  });

  it("should prioritize S3_BUCKET_NAME over default in local environment", () => {
    process.env.NODE_ENV = "local";
    process.env.S3_BUCKET_NAME = "custom-local-bucket";

    const config = new S3Config();

    expect(config.getBucketName()).toBe("custom-local-bucket");
    expect(S3Client).toHaveBeenCalledWith({
      region: "us-east-1",
      endpoint: "http://localhost:4566",
      credentials: {
        accessKeyId: "test",
        secretAccessKey: "test",
      },
      forcePathStyle: true,
    });
  });
});

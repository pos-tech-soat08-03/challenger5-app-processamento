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
    delete process.env.AWS_REGION;
    delete process.env.S3_BUCKET_NAME;
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
    delete process.env.FORCE_PATH_STYLE;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should throw error if S3_BUCKET_NAME is not set", () => {
    expect(() => new S3Config()).toThrow(
      "Missing required environment variable: S3_BUCKET_NAME"
    );

    expect(S3Client).toHaveBeenCalledWith({
      region: "us-east-1",
      credentials: {
        accessKeyId: "test",
        secretAccessKey: "test",
      },
      forcePathStyle: false,
    });
  });

  it("should initialize S3 client with default region, test credentials, and forcePathStyle false", () => {
    process.env.S3_BUCKET_NAME = "video-processing-bucket";

    const config = new S3Config();

    expect(S3Client).toHaveBeenCalledWith({
      region: "us-east-1",
      credentials: {
        accessKeyId: "test",
        secretAccessKey: "test",
      },
      forcePathStyle: false,
    });
    expect(config.getBucketName()).toBe("video-processing-bucket");
  });

  it("should use custom region and forcePathStyle from environment variables", () => {
    process.env.AWS_REGION = "us-west-2";
    process.env.S3_BUCKET_NAME = "custom-bucket";
    process.env.FORCE_PATH_STYLE = "true";

    const config = new S3Config();

    expect(S3Client).toHaveBeenCalledWith({
      region: "us-west-2",
      credentials: {
        accessKeyId: "test",
        secretAccessKey: "test",
      },
      forcePathStyle: true,
    });
    expect(config.getBucketName()).toBe("custom-bucket");
  });

  it("should use AWS credentials from environment variables", () => {
    process.env.AWS_ACCESS_KEY_ID = "prod-key";
    process.env.AWS_SECRET_ACCESS_KEY = "prod-secret";
    process.env.S3_BUCKET_NAME = "prod-bucket";
    process.env.FORCE_PATH_STYLE = "false";

    const config = new S3Config();

    expect(S3Client).toHaveBeenCalledWith({
      region: "us-east-1",
      credentials: {
        accessKeyId: "prod-key",
        secretAccessKey: "prod-secret",
      },
      forcePathStyle: false,
    });
    expect(config.getBucketName()).toBe("prod-bucket");
  });
});

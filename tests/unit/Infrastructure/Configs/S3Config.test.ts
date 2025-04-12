import { S3Config } from "../../../../src/Infrastructure/Configs/S3Config";
import { S3Client } from "@aws-sdk/client-s3";

// Mock do S3Client
jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn(),
}));

describe("S3Config", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Salva e limpa variáveis de ambiente
    originalEnv = { ...process.env };
    jest.clearAllMocks();
    delete process.env.NODE_ENV;
    delete process.env.AWS_REGION;
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
  });

  afterEach(() => {
    // Restaura variáveis de ambiente
    process.env = originalEnv;
  });

  it("should initialize S3 client with default region and no credentials for production", () => {
    // Act
    const config = new S3Config();

    // Assert
    expect(S3Client).toHaveBeenCalledWith({
      region: "us-east-1",
      endpoint: undefined,
      credentials: {
        accessKeyId: "",
        secretAccessKey: "",
      },
      forcePathStyle: false, // Corrigido para refletir o comportamento real
    });
    expect(config.getClient()).toBeInstanceOf(S3Client);
  });

  it("should initialize S3 client for local environment with LocalStack", () => {
    // Arrange
    process.env.NODE_ENV = "local";

    // Act
    const config = new S3Config();

    // Assert
    expect(S3Client).toHaveBeenCalledWith({
      region: "us-east-1",
      endpoint: "http://localhost:4566",
      credentials: {
        accessKeyId: "test",
        secretAccessKey: "test",
      },
      forcePathStyle: true,
    });
    expect(config.getClient()).toBeInstanceOf(S3Client);
  });

  it("should use environment variable for region when provided", () => {
    // Arrange
    process.env.AWS_REGION = "us-west-2";

    // Act
    const config = new S3Config();

    // Assert
    expect(S3Client).toHaveBeenCalledWith({
      region: "us-west-2",
      endpoint: undefined,
      credentials: {
        accessKeyId: "",
        secretAccessKey: "",
      },
      forcePathStyle: false, // Corrigido para refletir o comportamento real
    });
  });

  it("should use AWS credentials from environment variables in production", () => {
    // Arrange
    process.env.AWS_ACCESS_KEY_ID = "prod-key";
    process.env.AWS_SECRET_ACCESS_KEY = "prod-secret";

    // Act
    const config = new S3Config();

    // Assert
    expect(S3Client).toHaveBeenCalledWith({
      region: "us-east-1",
      endpoint: undefined,
      credentials: {
        accessKeyId: "prod-key",
        secretAccessKey: "prod-secret",
      },
      forcePathStyle: false, // Corrigido para refletir o comportamento real
    });
  });

  it("should set forcePathStyle to false in production even with custom region", () => {
    // Arrange
    process.env.AWS_REGION = "us-west-2";
    process.env.NODE_ENV = "production";

    // Act
    const config = new S3Config();

    // Assert
    expect(S3Client).toHaveBeenCalledWith({
      region: "us-west-2",
      endpoint: undefined,
      credentials: {
        accessKeyId: "",
        secretAccessKey: "",
      },
      forcePathStyle: false, // Corrigido para refletir o comportamento real
    });
  });
});

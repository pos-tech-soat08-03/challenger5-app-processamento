import { S3Client, S3ClientConfig } from "@aws-sdk/client-s3";

export class S3Config {
  private readonly client: S3Client;
  private readonly bucketName: string;

  constructor() {
    const config: S3ClientConfig = {
      region: process.env.AWS_REGION ?? "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "test",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "test",
        sessionToken: process.env.AWS_SESSION_TOKEN
      },
      forcePathStyle: process.env.FORCE_PATH_STYLE === "true",
    };
    this.client = new S3Client(config);

    this.bucketName =
      process.env.S3_BUCKET_NAME ?? this.throwMissingConfig("S3_BUCKET_NAME");
  }

  private throwMissingConfig(variable: string): never {
    throw new Error(`Missing required environment variable: ${variable}`);
  }

  getClient(): S3Client {
    return this.client;
  }

  getBucketName(): string {
    return this.bucketName;
  }
}

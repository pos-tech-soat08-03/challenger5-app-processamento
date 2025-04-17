import { S3Client, S3ClientConfig } from "@aws-sdk/client-s3";

export class S3Config {
  private readonly client: S3Client;
  private readonly bucketName: string;

  constructor() {
    const isLocal = process.env.NODE_ENV === "local";
    const awsEndpoint = process.env.AWS_ENDPOINT;
    const config: S3ClientConfig = {
      region: process.env.AWS_REGION || "us-east-1",
      endpoint: isLocal && !awsEndpoint ? "http://localhost:4566" : awsEndpoint,
      credentials: isLocal
        ? { accessKeyId: "test", secretAccessKey: "test" }
        : {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
          },
      forcePathStyle: isLocal, // Necessário para LocalStack
    };
    this.client = new S3Client(config);

    this.bucketName =
      process.env.S3_BUCKET_NAME ||
      (isLocal
        ? "video-processing-bucket"
        : this.throwMissingConfig("S3_BUCKET_NAME"));
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

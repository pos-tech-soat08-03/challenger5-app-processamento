import { S3Client, S3ClientConfig } from "@aws-sdk/client-s3";

export class S3Config {
  private readonly client: S3Client;

  constructor() {
    const isLocal = process.env.NODE_ENV === "local";
    const config: S3ClientConfig = {
      region: process.env.AWS_REGION || "us-east-1",
      endpoint: isLocal ? "http://localhost:4566" : undefined,
      credentials: isLocal
        ? { accessKeyId: "test", secretAccessKey: "test" }
        : {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
          },
      forcePathStyle: isLocal, // Necessário para LocalStack com S3
    };
    this.client = new S3Client(config);
  }

  getClient(): S3Client {
    return this.client;
  }
}

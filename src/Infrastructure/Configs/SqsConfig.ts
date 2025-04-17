import { SQSClient, SQSClientConfig } from "@aws-sdk/client-sqs";

export class SqsConfig {
  private readonly client: SQSClient;
  private readonly queueUrl: string;

  constructor() {
    const isLocal = process.env.NODE_ENV === "local";
    const awsEndpoint = process.env.AWS_ENDPOINT;
    const config: SQSClientConfig = {
      region: process.env.AWS_REGION || "us-east-1",
      endpoint: isLocal && !awsEndpoint ? "http://localhost:4566" : awsEndpoint,
      credentials: isLocal
        ? { accessKeyId: "test", secretAccessKey: "test" }
        : {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
          },
    };
    this.client = new SQSClient(config);

    this.queueUrl =
      process.env.SQS_QUEUE_URL ||
      (isLocal
        ? "http://localhost:4566/000000000000/VideoProcessingQueue"
        : this.throwMissingConfig("SQS_QUEUE_URL"));
  }

  private throwMissingConfig(variable: string): never {
    throw new Error(`Missing required environment variable: ${variable}`);
  }

  getClient(): SQSClient {
    return this.client;
  }

  getQueueUrl(): string {
    return this.queueUrl;
  }
}

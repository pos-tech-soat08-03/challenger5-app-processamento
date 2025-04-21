import { SQSClient, SQSClientConfig } from "@aws-sdk/client-sqs";

export class SqsConfig {
  private readonly client: SQSClient;
  private readonly queueUrl: string;

  constructor() {
    const config: SQSClientConfig = {
      region: process.env.AWS_REGION ?? "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "test",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "test",
        sessionToken: process.env.AWS_SESSION_TOKEN
      },
    };
    this.client = new SQSClient(config);

    this.queueUrl =
      process.env.SQS_QUEUE_URL ?? this.throwMissingConfig("SQS_QUEUE_URL");
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

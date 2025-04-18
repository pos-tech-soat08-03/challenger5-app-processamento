import { SNSClient, SNSClientConfig } from "@aws-sdk/client-sns";

export class SnsConfig {
  private readonly client: SNSClient;
  private readonly statusTopicArn: string;
  private readonly errorTopicArn: string;

  constructor() {
    const config: SNSClientConfig = {
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "test",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "test",
      },
    };
    this.client = new SNSClient(config);

    this.statusTopicArn =
      process.env.SNS_STATUS_TOPIC_ARN ||
      this.throwMissingConfig("SNS_STATUS_TOPIC_ARN");
    this.errorTopicArn =
      process.env.SNS_ERROR_TOPIC_ARN ||
      this.throwMissingConfig("SNS_ERROR_TOPIC_ARN");
  }

  private throwMissingConfig(variable: string): never {
    throw new Error(`Missing required environment variable: ${variable}`);
  }

  getClient(): SNSClient {
    return this.client;
  }

  getStatusTopicArn(): string {
    return this.statusTopicArn;
  }

  getErrorTopicArn(): string {
    return this.errorTopicArn;
  }
}

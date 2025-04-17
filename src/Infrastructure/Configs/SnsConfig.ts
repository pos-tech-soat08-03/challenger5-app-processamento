import { SNSClient, SNSClientConfig } from "@aws-sdk/client-sns";

export class SnsConfig {
  private readonly client: SNSClient;
  private readonly statusTopicArn: string;
  private readonly errorTopicArn: string;

  constructor() {
    const isLocal = process.env.NODE_ENV === "local";
    const awsEndpoint = process.env.AWS_ENDPOINT; // Endpoint dinâmico
    const config: SNSClientConfig = {
      region: process.env.AWS_REGION || "us-east-1",
      endpoint: isLocal && !awsEndpoint ? "http://localhost:4566" : awsEndpoint,
      credentials: isLocal
        ? { accessKeyId: "test", secretAccessKey: "test" }
        : {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
          },
    };
    this.client = new SNSClient(config);

    // Tópico para notificações de sucesso (NOT_STARTED, PROCESSING, COMPLETED)
    this.statusTopicArn =
      process.env.SNS_STATUS_TOPIC_ARN ||
      (isLocal
        ? "arn:aws:sns:us-east-1:000000000000:VideoStatusTopic"
        : this.throwMissingConfig("SNS_STATUS_TOPIC_ARN"));

    // Tópico para notificações de erro (ERROR, INTERRUPTED)
    this.errorTopicArn =
      process.env.SNS_ERROR_TOPIC_ARN ||
      (isLocal
        ? "arn:aws:sns:us-east-1:000000000000:VideoErrorTopic"
        : this.throwMissingConfig("SNS_ERROR_TOPIC_ARN"));
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

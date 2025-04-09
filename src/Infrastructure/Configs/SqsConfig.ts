import { SQSClient, SQSClientConfig } from "@aws-sdk/client-sqs";

export class SqsConfig {
  private readonly client: SQSClient;
  private readonly queueUrl: string;

  constructor() {
    const isLocal = process.env.NODE_ENV === "local";
    console.log("NODE_ENV:", process.env.NODE_ENV);
    console.log("SQS_QUEUE_URL:", process.env.SQS_QUEUE_URL);
    console.log("Endpoint:", isLocal ? "http://localhost:4566" : "AWS real");

    const config: SQSClientConfig = {
      region: process.env.AWS_REGION || "us-east-1",
      endpoint: isLocal ? "http://localhost:4566" : undefined, // Endpoint do LocalStack
      credentials: isLocal
        ? { accessKeyId: "test", secretAccessKey: "test" } // Credenciais fictícias
        : {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
          },
    };
    this.client = new SQSClient(config);
    this.queueUrl =
      process.env.SQS_QUEUE_URL ||
      (isLocal
        ? "http://localhost:4566/000000000000/sua-fila-sqs"
        : "https://sqs.us-east-1.amazonaws.com/SEU_ACCOUNT_ID/sua-fila-sqs");
  }

  getClient(): SQSClient {
    return this.client;
  }

  getQueueUrl(): string {
    return this.queueUrl;
  }
}

import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  ddbClient: DynamoDBClient | null = null;
  ddbDocumentClient: DynamoDBDocumentClient | null = null;

  getHello(): string {
    return 'Hello World!';
  }

  giveMeTheDynamoDbClient(): DynamoDBDocumentClient {
    if (this.ddbDocumentClient) return this.ddbDocumentClient;

    let config: DynamoDBClientConfig | null = null;

    const nonLocalConfig: DynamoDBClientConfig = {
      region: 'eu-west-2',
    };

    config = nonLocalConfig;

    // create the client
    this.ddbClient = new DynamoDBClient(config);
    this.ddbDocumentClient = DynamoDBDocumentClient.from(this.ddbClient, {
      marshallOptions: {
        removeUndefinedValues: true,
        convertClassInstanceToMap: true,
      },
    });
    return this.ddbDocumentClient;
  }
}

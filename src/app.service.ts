import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  ddbClient: DynamoDBClient = null;
  ddbDocumentClient: DynamoDBDocumentClient = null;

  getHello(): string {
    return 'Hello World!';
  }

  giveMeTheDynamoDbClient(): DynamoDBDocumentClient {
    if (this.ddbDocumentClient) return this.ddbDocumentClient;

    let config: DynamoDBClientConfig = null;

    const nonLocalConfig: DynamoDBClientConfig = {
      region: 'eu-west-2',
      apiVersion: '2012-08-10',
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

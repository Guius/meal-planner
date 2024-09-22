import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

let _ddbDocumentClient: DynamoDBDocumentClient | null = null;
let _ddbClient: DynamoDBClient | null = null;

export function ddbDocumentClient(): DynamoDBDocumentClient {
  if (_ddbDocumentClient) return _ddbDocumentClient;

  let config: DynamoDBClientConfig | null = null;

  const nonLocalConfig: DynamoDBClientConfig = {
    region: process.env.AWS_REGION,
  };

  config = nonLocalConfig;

  // create the client
  _ddbClient = new DynamoDBClient(config);
  _ddbDocumentClient = DynamoDBDocumentClient.from(_ddbClient, {
    marshallOptions: {
      removeUndefinedValues: true,
      convertClassInstanceToMap: true,
    },
  });
  return _ddbDocumentClient;
}

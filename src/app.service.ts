import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import {
  GetParameterCommand,
  GetParameterCommandInput,
  SSMClient,
  SSMClientConfig,
} from '@aws-sdk/client-ssm';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'node:fs';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class AppService {
  ddbClient: DynamoDBClient | null = null;
  ddbDocumentClient: DynamoDBDocumentClient | null = null;

  ssmClient: SSMClient | null = null;

  transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo> | null =
    null;

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

  giveMeTheSSMClient() {
    if (this.ssmClient) return this.ssmClient;

    const config: SSMClientConfig = {
      region: 'eu-west-2',
    };

    this.ssmClient = new SSMClient(config);

    return this.ssmClient;
  }

  async giveMeTheNodemailerTransporter(): Promise<
    nodemailer.Transporter<SMTPTransport.SentMessageInfo>
  > {
    if (this.transporter) return this.transporter;

    const ssmClient = this.giveMeTheSSMClient();

    let pathToSecret: string;
    const parameterName = 'path-to-app-secret';
    try {
      const getParameterInput: GetParameterCommandInput = {
        Name: 'path-to-app-secret',
      };
      const output = await ssmClient.send(
        new GetParameterCommand(getParameterInput),
      );
      if (output.Parameter?.Value) {
        pathToSecret = output.Parameter.Value;
        console.debug(
          `Found parameter ${parameterName}. Value is ${pathToSecret}`,
        );
      } else {
        console.error(`No parameter found with name ${parameterName}`);
        throw new NotFoundException();
      }
    } catch (err) {
      console.error(
        `Error occurred when getting parameter ${parameterName}. Err: ${err}`,
      );
      throw new InternalServerErrorException();
    }

    let password = '';
    try {
      const data = fs.readFileSync(pathToSecret);

      password = data.toString();
    } catch (err) {
      console.error(`Error occurred when reading file. Err: ${err}`);
      throw new InternalServerErrorException();
    }

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'glmvb261@gmail.com',
        pass: password,
      },
    });

    return transporter;
  }
}

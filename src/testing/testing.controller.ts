import { QueryCommand, QueryCommandInput } from '@aws-sdk/client-dynamodb';
import {
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { AppService } from 'src/app.service';
import * as nodemailer from 'nodemailer';
import * as fs from 'node:fs';
import {
  GetParameterCommand,
  GetParameterCommandInput,
} from '@aws-sdk/client-ssm';

@Controller('testing')
export class TestController {
  constructor(private appService: AppService) {}

  @Get('get-recipe-number')
  async getRecipeNumber() {
    const getRecipeNumberCommandInput: QueryCommandInput = {
      TableName: 'recipes',
      IndexName: 'GSI3',
      ScanIndexForward: false,
      Limit: 1,
      KeyConditionExpression: 'GSI3_pk = :pk',
      ExpressionAttributeValues: {
        ':pk': { S: '#RECIPENUMBERS' },
      },
    };

    /**
     * If this bombs, then let the script bomb out
     * There is no point continuing if we cannot get a new recipe number.
     */
    const client = this.appService.giveMeTheDynamoDbClient();
    const lastRecipeNumber = await client
      .send(new QueryCommand(getRecipeNumberCommandInput))
      .then((res) => {
        if (!res.Items || res.Items.length === 0) {
          return 0;
        } else {
          if (!res.Items[0].GSI3_sk.N) {
            console.log(res.Items[0].GSI3_sk);
            console.error(
              `Found last recipe number but property GSI3_sk does not have S attribute`,
            );
            process.exit(1);
          }
          return parseInt(res.Items[0].GSI3_sk.N);
        }
      });

    return lastRecipeNumber;
  }

  @Get('send-email')
  async sendEmail() {
    const ssmClient = this.appService.giveMeTheSSMClient();

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

    // send mail with defined transport object
    try {
      const info = await transporter.sendMail({
        from: '"Guillaume Vitry" <glmvb261@gmail.com>', // sender address
        to: 'glmvb261@gmail.com', // list of receivers
        subject: 'Hello ✔', // Subject line
        text: 'Hello world?', // plain text body
        html: '<b>Hello world?</b>', // html body
      });
      console.log('Message sent: %s', info.messageId);
    } catch (err) {
      console.error(`Error sending email. Err: ${err}`);
    }
  }
}

import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

interface DynamoDBStackProps extends cdk.StackProps {
  service: string;
  buildStage: string;
  awsRegion: string;
}

export class DynamoDBStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DynamoDBStackProps) {
    super(scope, id, props);

    const { service, buildStage, awsRegion } = props;

    const dynamoDBTable = new dynamodb.Table(this, `${service}-main`, {
      tableName: `${service}-${buildStage}-main`,
      partitionKey: {
        name: "PK",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "SK",
        type: dynamodb.AttributeType.STRING,
      },
      timeToLiveAttribute: "ttl",
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      deletionProtection: true,
    });

    new ssm.StringParameter(this, `${service}-DynamoDBTableNameParameter`, {
      parameterName: `/${service}/${buildStage}/${awsRegion}/dynamodb_table_name`,
      stringValue: dynamoDBTable.tableName,
    });

    new ssm.StringParameter(this, `${service}-DynamoDBTableArnParameter`, {
      parameterName: `/${service}/${buildStage}/${awsRegion}/dynamodb_table_arn`,
      stringValue: dynamoDBTable.tableArn,
    });
  }
}

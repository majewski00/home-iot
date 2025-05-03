import * as cdk from "aws-cdk-lib";
import { CognitoStack } from "./cognito.js";
import { FrontEndStack } from "./frontend.js";
import { ApiStack } from "./api-gateway.js";
import { DynamoDBStack } from "./dynamodb.js";

const SERVICE = process.env.SERVICE!;
const BUILD_STAGE = process.env.BUILD_STAGE!;
const AWS_REGION = process.env.AWS_REGION!;
const CDK_DEPLOY_ACCOUNT = process.env.CDK_DEPLOY_ACCOUNT!;
const APP_VERSION = process.env.APP_VERSION!;

const app = new cdk.App();

const stackConfig = {
  service: SERVICE,
  buildStage: BUILD_STAGE,
  awsRegion: AWS_REGION,
  env: {
    account: CDK_DEPLOY_ACCOUNT,
    region: AWS_REGION,
  },
};

const cognito = new CognitoStack(app, `${SERVICE}-CognitoStack`, {
  ...stackConfig,
  sesIdentityArn: undefined,
  terminationProtection: false,
});

const frontend = new FrontEndStack(app, `${SERVICE}-FrontEndStack`, {
  ...stackConfig,
  domainNames: undefined,
  certificateArn: undefined,
  terminationProtection: false,
});

new ApiStack(app, `${SERVICE}-ApiStack`, {
  ...stackConfig,
  domainName: undefined,
  frontend,
  cognito,
  terminationProtection: false,
});

new DynamoDBStack(app, `${SERVICE}-DynamoDBStack`, {
  ...stackConfig,
  terminationProtection: false,
});

cdk.Tags.of(app).add("Stage", BUILD_STAGE);
cdk.Tags.of(app).add("Region", AWS_REGION);
cdk.Tags.of(app).add("Service", SERVICE);
cdk.Tags.of(app).add("Version", APP_VERSION);
cdk.Tags.of(app).add("Managed By", "CDK");

import * as cdk from "aws-cdk-lib";
import { CognitoStack } from "./cognito.js";
import { FrontEndStack } from "./frontend.js";
import { ApiStack } from "./api-gateway.js";
import { DynamoDBStack } from "./dynamodb.js";
import { CertificateStack } from "./certificate.js";
import { Route53Stack } from "./route53.js";

const SERVICE = process.env.SERVICE!;
const BUILD_STAGE = process.env.BUILD_STAGE!;
const AWS_REGION = process.env.AWS_REGION!;
const CDK_DEPLOY_ACCOUNT = process.env.CDK_DEPLOY_ACCOUNT!;
const APP_VERSION = process.env.APP_VERSION!;
const DOMAIN_NAME = process.env.DOMAIN_NAME;

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

let certificateStack: CertificateStack | undefined;

if (DOMAIN_NAME) {
  const route53Stack = new Route53Stack(app, `${SERVICE}-Route53Stack`, {
    domainName: DOMAIN_NAME,
    env: {
      account: CDK_DEPLOY_ACCOUNT,
      region: AWS_REGION,
    },
    terminationProtection: false,
  });

  certificateStack = new CertificateStack(app, `${SERVICE}-CertificateStack`, {
    ...stackConfig,
    domainName: DOMAIN_NAME,
    hostedZone: route53Stack.hostedZone,
    env: {
      account: CDK_DEPLOY_ACCOUNT,
      region: "us-east-1",
    },
    terminationProtection: false,
    crossRegionReferences: true,
  });
}

const frontend = new FrontEndStack(app, `${SERVICE}-FrontEndStack`, {
  ...stackConfig,
  certificateStack: certificateStack,
  terminationProtection: false,
  crossRegionReferences: true,
});

const cognito = new CognitoStack(app, `${SERVICE}-CognitoStack`, {
  ...stackConfig,
  frontend,
  sesIdentityArn: undefined,
  terminationProtection: false,
});

new ApiStack(app, `${SERVICE}-ApiStack`, {
  ...stackConfig,
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

if (DOMAIN_NAME) {
  cdk.Tags.of(app).add("Domain", DOMAIN_NAME);
}

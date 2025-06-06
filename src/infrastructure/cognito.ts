import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as ses from "aws-cdk-lib/aws-ses";
import { Construct } from "constructs";

interface CognitoStackProps extends cdk.StackProps {
  service: string;
  buildStage: string;
  awsRegion: string;
  frontend: {
    distributionDomainName: string;
    customDomainName?: string;
  };
  sesIdentityArn?: string;
}

export class CognitoStack extends cdk.Stack {
  userPoolId: string;
  userPoolClientId: string;

  constructor(scope: Construct, id: string, props: CognitoStackProps) {
    super(scope, id, props);

    const { service, buildStage, awsRegion, frontend, sesIdentityArn } = props;

    const clientUrls: string[] = ["http://localhost:4000"];
    const domainName = frontend.customDomainName;

    if (domainName) {
      clientUrls.push(`https://${domainName}`);
      if (buildStage === "prod") {
        clientUrls.push(`https://www.${domainName}`);
      }
    } else {
      clientUrls.push(`https://${frontend.distributionDomainName}`);
    }

    let userPoolEmail: cognito.UserPoolEmail;
    if (sesIdentityArn) {
      const emailIdentity = ses.EmailIdentity.fromEmailIdentityName(
        this,
        `${service}-emailIdentity`,
        sesIdentityArn
      );
      userPoolEmail = cognito.UserPoolEmail.withSES({
        fromEmail: emailIdentity.emailIdentityName,
        fromName: "Home-IoT",
        replyTo: emailIdentity.emailIdentityName,
        sesRegion: awsRegion,
      });
    } else {
      userPoolEmail = cognito.UserPoolEmail.withCognito();
    }

    const userPool = new cognito.UserPool(this, `${service}-UserPool`, {
      userPoolName: `${service}-${buildStage}-user-pool`,
      selfSignUpEnabled: false,
      signInAliases: {
        email: true,
        username: false,
      },
      autoVerify: {
        email: true,
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
      },
      standardAttributes: {
        fullname: {
          required: true,
          mutable: true,
        },
      },
      email: userPoolEmail,
    });

    // TODO: SAML Identity Provider
    const supportedIdentityProviders: cognito.UserPoolClientIdentityProvider[] =
      [cognito.UserPoolClientIdentityProvider.COGNITO];

    const userPoolClient = userPool.addClient(`${service}-UserPoolClient`, {
      userPoolClientName: `${service}-${buildStage}-client`,
      authFlows: {
        adminUserPassword: false,
        userPassword: true,
        userSrp: true,
      },
      oAuth: {
        callbackUrls: clientUrls,
        logoutUrls: clientUrls,
        flows: { authorizationCodeGrant: true },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
        ],
      },
      generateSecret: false, // Don't generate a client secret (needed for public web apps)
      preventUserExistenceErrors: true,
      supportedIdentityProviders,
    });

    const userPoolDomain = userPool.addDomain(`${service}-userPoolDomain`, {
      cognitoDomain: {
        domainPrefix: `${service.toLowerCase()}-${buildStage}`,
      },
    });

    this.userPoolClientId = userPoolClient.userPoolClientId;
    this.userPoolId = userPool.userPoolId;

    new ssm.StringParameter(this, `${service}-UserPoolClientIdParameter`, {
      parameterName: `/${service}/${buildStage}/${awsRegion}/user_pool_client_id`,
      stringValue: userPoolClient.userPoolClientId,
    });

    new ssm.StringParameter(this, `${service}-UserPoolIdParameter`, {
      parameterName: `/${service}/${buildStage}/${awsRegion}/user_pool_id`,
      stringValue: userPool.userPoolId,
    });

    new ssm.StringParameter(this, `${service}-CognitoDomainParameter`, {
      parameterName: `/${service}/${buildStage}/${awsRegion}/cognito_domain`,
      stringValue: `${userPoolDomain.domainName}.auth.${awsRegion}.amazoncognito.com`,
    });

    // Outputs
    new cdk.CfnOutput(this, "UserPoolId", {
      value: userPool.userPoolId,
      description: "Cognito User Pool ID",
    });

    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: userPoolClient.userPoolClientId,
      description: "Cognito User Pool Client ID",
    });

    new cdk.CfnOutput(this, "CognitoDomain", {
      value: `${userPoolDomain.domainName}.auth.${awsRegion}.amazoncognito.com`,
      description: "Cognito hosted UI domain",
    });

    new cdk.CfnOutput(this, "AllowedRedirectUrls", {
      value: clientUrls.join(", "),
      description: "Allowed redirect URLs for this environment",
    });
  }
}

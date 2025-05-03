import * as cdk from "aws-cdk-lib";
import * as apigatewayv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

interface ApiStackProps extends cdk.StackProps {
  service: string;
  buildStage: string;
  awsRegion: string;
  domainName?: string;
  frontend: {
    distributionDomainName: string;
  };
  cognito: {
    userPoolId: string;
    userPoolClientId: string;
  };
}

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { service, buildStage, awsRegion, domainName, frontend, cognito } =
      props;

    const httpApi = new apigatewayv2.HttpApi(this, `${service}-HttpApi`, {
      apiName: `${service}-${buildStage}-http-api`,
      corsPreflight: {
        allowHeaders: [
          "Content-Type",
          "Authorization",
          "X-Amz-Date",
          "X-Api-Key",
        ],
        allowMethods: [
          apigatewayv2.CorsHttpMethod.GET,
          apigatewayv2.CorsHttpMethod.POST,
          apigatewayv2.CorsHttpMethod.OPTIONS,
          apigatewayv2.CorsHttpMethod.DELETE,
        ],
        allowOrigins: domainName
          ? [`https://${domainName}`]
          : [`https://${frontend.distributionDomainName}`],
        maxAge: cdk.Duration.hours(1),
        allowCredentials: true,
      },
    });

    const httpApiAuthorizer = new apigatewayv2.CfnAuthorizer(
      this,
      "CognitoAuthorizer",
      {
        apiId: httpApi.apiId,
        authorizerType: "JWT",
        identitySource: ["$request.header.Authorization"],
        name: "cognito-authorizer",
        jwtConfiguration: {
          audience: [cognito.userPoolClientId],
          issuer: `https://cognito-idp.${awsRegion}.amazonaws.com/${cognito.userPoolId}`,
        },
      }
    );

    httpApi.addStage(buildStage, {
      stageName: buildStage,
      autoDeploy: true,
    });

    new ssm.StringParameter(this, `${service}-ApiGatewayRestApiIdParameter`, {
      parameterName: `/${service}/${buildStage}/${awsRegion}/api_gateway_rest_api_id`,
      stringValue: httpApi.apiId,
    });
    new ssm.StringParameter(
      this,
      `${service}-ApiGatewayAuthorizerIdCognitoParameter`,
      {
        parameterName: `/${service}/${buildStage}/${awsRegion}/api_gateway_authorizer_id_cognito`,
        stringValue: httpApiAuthorizer.ref,
      }
    );
    new ssm.StringParameter(this, `${service}-HttpApiUrlParameter`, {
      parameterName: `/${service}/${buildStage}/${awsRegion}/http_api_url`,
      stringValue: httpApi.apiEndpoint, // starts with https://
    });
  }
}

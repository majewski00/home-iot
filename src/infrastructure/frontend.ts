import * as cdk from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

interface FrontendStackProps extends cdk.StackProps {
  service: string;
  buildStage: string;
  awsRegion: string;
  domainNames?: string[];
  certificateArn?: string;
}

export class FrontEndStack extends cdk.Stack {
  distributionDomainName: string;

  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props);

    const { service, buildStage, awsRegion } = props;

    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      `${service}-Frontend-OAI`,
      {
        comment: `${service} ${buildStage} ${awsRegion} Frontend OAI`,
      }
    );

    const frontendBucket = new s3.Bucket(this, `${service}-frontend-bucket`, {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      bucketName: `${service}-${buildStage}-frontend-bucket`,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    frontendBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject", "s3:ListBucket"],
        effect: iam.Effect.ALLOW,
        principals: [
          new iam.CanonicalUserPrincipal(
            originAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId
          ),
        ],
        resources: [`${frontendBucket.bucketArn}/*`, frontendBucket.bucketArn],
      })
    );

    frontendBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["*"],
        resources: [frontendBucket.bucketArn, `${frontendBucket.bucketArn}/*`],
        principals: [new iam.AnyPrincipal()],
        effect: iam.Effect.DENY,
        conditions: {
          Bool: {
            "aws:SecureTransport": "false",
          },
        },
        sid: "EnforceSecureTransport",
      })
    );

    const distributionProps: cloudfront.DistributionProps = {
      comment: `${service}-${buildStage}-frontend-distribution`,
      defaultBehavior: {
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        origin: origins.S3BucketOrigin.withOriginAccessIdentity(
          frontendBucket,
          {
            originAccessIdentity,
          }
        ),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
        },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      domainNames: undefined, // TODO
      certificate: undefined, // TODO - us-east-1
    };

    const cloudfrontDistribution = new cloudfront.Distribution(
      this,
      `${service}-UnifiedCloudFrontDistribution`,
      distributionProps
    );
    this.distributionDomainName = cloudfrontDistribution.distributionDomainName;

    new ssm.StringParameter(
      this,
      `${service}-CloudFrontDistributionIdParameter`,
      {
        parameterName: `/${service}/${buildStage}/${awsRegion}/cloudfront_distribution_id`,
        stringValue: cloudfrontDistribution.distributionId,
      }
    );

    new ssm.StringParameter(this, `${service}-CloudFrontDomainNameParameter`, {
      parameterName: `/${service}/${buildStage}/${awsRegion}/cloudfront_domain_name`,
      stringValue: this.distributionDomainName,
    });
  }
}

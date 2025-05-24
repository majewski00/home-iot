import * as cdk from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

interface FrontendStackProps extends cdk.StackProps {
  service: string;
  buildStage: string;
  awsRegion: string;
  certificateStack?: {
    certificate: Certificate;
    hostedZone: route53.IHostedZone;
    fullDomainName: string;
  };
}

export class FrontEndStack extends cdk.Stack {
  distributionDomainName: string;
  customDomainName?: string;

  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props);

    const { service, buildStage, awsRegion, certificateStack } = props;

    const domainName = certificateStack?.fullDomainName;
    const certificate = certificateStack?.certificate;
    const hostedZone = certificateStack?.hostedZone;

    this.customDomainName = domainName;

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

    let domainNames: string[] = [];
    if (domainName) {
      domainNames.push(domainName);
      if (buildStage === "prod") {
        domainNames.push(`www.${domainName}`);
      }
    }

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
      ...(domainName &&
        certificate && {
          domainNames: domainNames,
          certificate: certificate,
        }),
    };

    const cloudfrontDistribution = new cloudfront.Distribution(
      this,
      `${service}-UnifiedCloudFrontDistribution`,
      distributionProps
    );
    this.distributionDomainName = cloudfrontDistribution.distributionDomainName;

    if (domainName && hostedZone) {
      for (const domain of domainNames) {
        new route53.ARecord(this, `${service}-ARecord-${domain}`, {
          recordName: domain,
          target: route53.RecordTarget.fromAlias(
            new targets.CloudFrontTarget(cloudfrontDistribution)
          ),
          zone: hostedZone,
        });
      }
    }

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

    new ssm.StringParameter(this, `${service}-FrontendBucketIdParameter`, {
      parameterName: `/${service}/${buildStage}/${awsRegion}/s3_frontend_bucket_name`,
      stringValue: frontendBucket.bucketName,
    });

    // Outputs
    new cdk.CfnOutput(this, "CloudFrontDomainName", {
      value: this.distributionDomainName,
      description: "CloudFront distribution domain name",
    });

    if (domainName) {
      new cdk.CfnOutput(this, "CustomDomainName", {
        value: domainName,
        description: "Custom domain name for the website",
      });
    }

    new cdk.CfnOutput(this, "S3BucketName", {
      value: frontendBucket.bucketName,
      description: "S3 bucket name for frontend assets",
    });
  }
}

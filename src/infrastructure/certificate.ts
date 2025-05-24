import * as cdk from "aws-cdk-lib";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

interface CertificateStackProps extends cdk.StackProps {
  service: string;
  buildStage: string;
  domainName: string;
  hostedZone: route53.IHostedZone;
}

export class CertificateStack extends cdk.Stack {
  certificate: acm.Certificate;
  hostedZone: route53.IHostedZone;
  fullDomainName: string;

  constructor(scope: Construct, id: string, props: CertificateStackProps) {
    super(scope, id, props);

    const { service, buildStage, domainName, hostedZone } = props;

    this.hostedZone = hostedZone;

    this.fullDomainName =
      buildStage === "prod" ? domainName : `${buildStage}.${domainName}`;

    const certificateDomains = [this.fullDomainName];

    if (buildStage === "prod") {
      certificateDomains.push(`www.${this.fullDomainName}`);
    }

    this.certificate = new acm.Certificate(this, `${service}-Certificate`, {
      domainName: this.fullDomainName,
      subjectAlternativeNames: certificateDomains,
      validation: acm.CertificateValidation.fromDns(this.hostedZone),
    });

    new ssm.StringParameter(this, `${service}-CertificateArnParameter`, {
      parameterName: `/${service}/${buildStage}/global/certificate_arn`,
      stringValue: this.certificate.certificateArn,
      description: `SSL Certificate ARN for ${domainName}`,
    });

    new ssm.StringParameter(this, `${service}-HostedZoneIdParameter`, {
      parameterName: `/${service}/${buildStage}/global/hosted_zone_id`,
      stringValue: this.hostedZone.hostedZoneId,
      description: `Route53 Hosted Zone ID for ${domainName}`,
    });

    // Outputs
    new cdk.CfnOutput(this, "DomainName", {
      value: this.fullDomainName,
      description: "The full domain name for this deployment",
    });

    new cdk.CfnOutput(this, "CertificateArn", {
      value: this.certificate.certificateArn,
      description: "SSL Certificate ARN",
    });
  }
}

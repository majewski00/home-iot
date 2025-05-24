import * as cdk from "aws-cdk-lib";
import * as route53 from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";

interface Route53StackProps extends cdk.StackProps {
  domainName: string;
}

export class Route53Stack extends cdk.Stack {
  hostedZone: route53.IHostedZone;
  baseDomain: string;

  constructor(scope: Construct, id: string, props: Route53StackProps) {
    super(scope, id, props);

    const { domainName } = props;
    this.baseDomain = extractBaseDomain(domainName);

    this.hostedZone = route53.HostedZone.fromLookup(this, "HostedZoneLookup", {
      domainName: this.baseDomain,
    });

    if (!this.hostedZone) {
      throw new Error(`Hosted zone for domain ${this.baseDomain} not found`);
    }

    new cdk.CfnOutput(this, "HostedZoneId", {
      value: this.hostedZone.hostedZoneId,
      description: "Route53 Hosted Zone ID",
    });
  }
}

function extractBaseDomain(fullDomain: string): string {
  const parts = fullDomain.split(".");
  // For "home.example.com" or "dev.home.example.com", return "example.com"
  return parts.slice(-2).join(".");
}

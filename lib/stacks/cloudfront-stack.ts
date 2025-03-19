import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as certificatemanager from "aws-cdk-lib/aws-certificatemanager";

import { APPLICATION_NAME, DOMAIN_NAME } from "../configuration";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";

interface CloudFrontStackProps extends cdk.StackProps {
    stageName: string;
    domain: string;
    apiDomain: string;
    staticAssetsBucketName: string;
    isProd: boolean;
}

export class CloudFrontStack extends cdk.Stack {
    public readonly distribution: cloudfront.Distribution;
    constructor(scope: Construct, id: string, props: CloudFrontStackProps) {
        super(scope, id, props);

        // Ensure props is defined and destructure safely
        const stageName = props.stageName;

        // S3 Bucket for static website hosting
        const websiteBucket = new s3.Bucket(this, `${APPLICATION_NAME}-Bucket-${stageName}`, {
            bucketName: props.staticAssetsBucketName,
            enforceSSL: true,
            publicReadAccess: false,
            removalPolicy: cdk.RemovalPolicy.DESTROY, // Automatically delete bucket during stack teardown (optional)
            autoDeleteObjects: true
        });

        const oac = new cloudfront.S3OriginAccessControl(this, `OAC-${stageName}`, {
            signing: cloudfront.Signing.SIGV4_NO_OVERRIDE
        });

        const s3Origin = origins.S3BucketOrigin.withOriginAccessControl(websiteBucket, {
            originAccessControl: oac
        });

        // Look up the existing hosted zone for your domain
        const hostedZone = route53.HostedZone.fromLookup(
            this,
            `${APPLICATION_NAME}HostedZone-${stageName}`,
            {
                domainName: DOMAIN_NAME // Your domain name
            }
        );

        const certificate = certificatemanager.Certificate.fromCertificateArn(
            this,
            `${APPLICATION_NAME}-certificate`,
            cdk.Fn.importValue(`${APPLICATION_NAME}-certificate`)
        );

        // Create the CloudFront distribution
        this.distribution = new cloudfront.Distribution(
            this,
            `${APPLICATION_NAME}StaticWebsiteDistribution-${stageName}`,
            {
                comment: `Meriton AI Customer portal in ${stageName}`,
                defaultBehavior: {
                    origin: s3Origin,
                    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
                    cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
                    compress: true
                },
                errorResponses: [
                    {
                        httpStatus: 403,
                        responseHttpStatus: 200,
                        responsePagePath: "/index.html",
                        ttl: cdk.Duration.seconds(0)
                    }
                ],
                domainNames: [props.domain],
                certificate: certificate,
                priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL
            }
        );

        // Create a CNAME record for the subdomain
        if (props.domain === DOMAIN_NAME) {
            // Use Alias Record for root domain
            new route53.ARecord(this, `${APPLICATION_NAME}StaticWebsiteAliasRecord-${stageName}`, {
                zone: hostedZone,
                recordName: props.domain, // Root domain (e.g., meriton-ai.io)
                target: route53.RecordTarget.fromAlias(new CloudFrontTarget(this.distribution))
            });
        } else {
            // subdomain uses CNAME
            new route53.CnameRecord(
                this,
                `${APPLICATION_NAME}StaticWebsiteCnameRecord-${stageName}`,
                {
                    zone: hostedZone,
                    recordName: props.domain, // Your subdomain
                    domainName: this.distribution.distributionDomainName
                }
            );
        }

        // Output the CloudFront distribution ID
        new cdk.CfnOutput(this, "CloudFrontDistributionId", {
            value: this.distribution.distributionId,
            exportName: `CloudFrontDistributionId-${props.stageName}`
        });
    }
}

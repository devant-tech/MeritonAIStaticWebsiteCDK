import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { CloudFrontStack } from "../lib/stacks/cloudfront-stack";

describe("CloudFront Stack", () => {
    let template: Template;
    const stageName = "test";
    const domain = "test.meriton-ai.io";
    const apiDomain = "api.test.meriton-ai.io";
    const staticAssetsBucketName = "test-meriton-ai-static-assets";

    // Mock AWS environment for testing
    const env = {
        account: "123456789012",
        region: "us-east-1"
    };

    beforeEach(() => {
        const app = new cdk.App();
        const stack = new CloudFrontStack(app, "CloudFrontStack", {
            stageName,
            domain,
            apiDomain,
            staticAssetsBucketName,
            isProd: false,
            env
        });
        template = Template.fromStack(stack);
    });

    test("creates S3 bucket with correct configuration", () => {
        template.hasResourceProperties("AWS::S3::Bucket", {
            BucketName: staticAssetsBucketName
        });
    });

    test("creates CloudFront distribution with correct configuration", () => {
        template.hasResourceProperties("AWS::CloudFront::Distribution", {
            DistributionConfig: {
                Comment: `Meriton AI Customer portal in ${stageName}`,
                DefaultCacheBehavior: {
                    ViewerProtocolPolicy: "redirect-to-https",
                    AllowedMethods: ["GET", "HEAD"],
                    Compress: true
                }
            }
        });
    });

    test("creates Origin Access Control", () => {
        template.hasResourceProperties("AWS::CloudFront::OriginAccessControl", {
            OriginAccessControlConfig: {
                SigningBehavior: "no-override",
                SigningProtocol: "sigv4"
            }
        });
    });

    test("creates CNAME record for subdomain", () => {
        template.hasResourceProperties("AWS::Route53::RecordSet", {
            Type: "CNAME"
        });
    });
});

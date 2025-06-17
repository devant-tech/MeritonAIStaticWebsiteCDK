import { AWS_ACCOUNT, STATIC_ASSETS_BUCKET_DEV, STATIC_ASSETS_BUCKET_PROD } from "../configuration";
import { Region } from "./regions";

export enum Stage {
    DEV = "dev",
    PROD = "prod"
}

export const STAGES = [
    {
        stageName: Stage.DEV,
        env: { region: Region.US_EAST_1, account: AWS_ACCOUNT },
        staticAssetsBucketName: STATIC_ASSETS_BUCKET_DEV,
        isProd: false
    },
    {
        stageName: Stage.PROD,
        env: { region: Region.US_EAST_1, account: AWS_ACCOUNT }, // CLoudfront and ACM in us-east-1
        staticAssetsBucketName: STATIC_ASSETS_BUCKET_PROD,
        isProd: true
    }
];

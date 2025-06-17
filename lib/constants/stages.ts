import {
    AWS_ACCOUNT,
    DOMAIN_NAME,
    STATIC_ASSETS_BUCKET_DEV,
    STATIC_ASSETS_BUCKET_PROD
} from "../configuration";
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
        googleClientId: "427948310600-v3g4op98fak6bo67r7q1to6duqnbvpnp.apps.googleusercontent.com",
        googleRedirectUrl: `https://dev.${DOMAIN_NAME}`,
        isProd: false
    },
    {
        stageName: Stage.PROD,
        env: { region: Region.US_EAST_1, account: AWS_ACCOUNT }, // CLoudfront and ACM in us-east-1
        staticAssetsBucketName: STATIC_ASSETS_BUCKET_PROD,
        googleClientId: "427948310600-077gac1t6jc1p7dc0lo0ll8j4nrk4odo.apps.googleusercontent.com",
        googleRedirectUrl: `https://${DOMAIN_NAME}`,
        isProd: true
    }
];

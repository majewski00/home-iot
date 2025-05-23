#!/bin/bash
mkdir -p logs
exec > >(tee logs/frontend-deploy-$(date +%Y%m%d_%H%M%S).log) 2>&1

source ./scripts/local-vars.sh

export IS_OFFLINE=0

source ./scripts/frontend-vars.sh 

echo "Running frontend deployment on ($BUILD_STAGE)$SERVICE with version $APP_VERSION"

npx vite build --config src/frontend/vite.config.ts

# Get the S3 bucket name from SSM Parameter Store
S3_BUCKET_NAME=$(aws ssm get-parameter --name "/${SERVICE}/${BUILD_STAGE}/${AWS_REGION}/s3_frontend_bucket_name"  | jq -r .Parameter.Value)

echo "S3 Bucket Name: $S3_BUCKET_NAME"
aws s3 sync --delete "src/frontend/dist" s3://$S3_BUCKET_NAME/

CF_DISTRIBUTION_ID=$(aws ssm get-parameter --name "/${SERVICE}/${BUILD_STAGE}/${AWS_REGION}/cloudfront_distribution_id"  | jq -r .Parameter.Value)

echo "Publishing CloudFront invalidation..."
echo "CloudFront Distribution ID: $CF_DISTRIBUTION_ID"

aws cloudfront create-invalidation \
  --distribution-id $CF_DISTRIBUTION_ID \
  --paths "/*"

echo "Frontend deployment to S3 completed successfully"

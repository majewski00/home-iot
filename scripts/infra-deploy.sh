#!/bin/bash
mkdir -p logs
source ./scripts/local-vars.sh
exec > >(tee logs/infrastructure-deploy-$(date +%Y%m%d_%H%M%S).log) 2>&1

echo "Starting deployment for version $APP_VERSION"

if [ -z "$AWS_PROFILE" ] || [ -z "$AWS_REGION" ]; then
    echo "Required environment variables are not set. Please check local-vars.sh"
    exit 1
fi

CDK_DEPLOY_ACCOUNT=$(aws sts get-caller-identity --profile "$AWS_PROFILE" | jq -r .Account)

if [ -z "$CDK_DEPLOY_ACCOUNT" ]; then
    echo "AWS credentials not found. Did you run 'aws configure' or set AWS_PROFILE?"
    exit 1
fi

export CDK_DEPLOY_ACCOUNT

cd ./src/infrastructure  || { echo "Failed to change directory!"; exit 1; }

echo "Compiling CDK application..."
npx tsc -p tsconfig.infra.json || { echo "TypeScript compilation failed!"; exit 1; }

if ! aws cloudformation describe-stacks --stack-name CDKToolkit --region "$AWS_REGION" > /dev/null 2>&1; then
    echo "Bootstrapping CDK Toolkit..."
    npx cdk bootstrap aws://"$CDK_DEPLOY_ACCOUNT"/"$AWS_REGION" || { echo "Bootstrap failed!"; exit 1; }
else
    echo  "CDK Toolkit stack already exists in $AWS_REGION. Skipping bootstrapping..."
fi

echo "Deploying all stacks..."
npx cdk deploy --require-approval=never --ci --all || { echo "CDK deployment failed!"; exit 1; }

echo "Deployment completed successfully."
cd ../..

exit 0
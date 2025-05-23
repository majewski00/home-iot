#!/bin/bash
mkdir -p logs
exec > >(tee logs/backend-deploy-$(date +%Y%m%d_%H%M%S).log) 2>&1

source ./scripts/local-vars.sh

echo "Running backend deployment on ($BUILD_STAGE)$SERVICE with version $APP_VERSION"

export IS_OFFLINE=0

cd ./src/backend/api || { echo "Failed to change directory!"; exit 1; }

npx sls deploy --verbose 

echo "Backend deployment completed successfully"

if [ -d ".serverless" ]; then
    echo "Removing .serverless directory..."
    rm -rf .serverless
    echo ".serverless directory removed successfully"
else
    echo ".serverless directory does not exist, skipping removal"
fi

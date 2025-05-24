export AWS_PROFILE=HomeIoT-profile
export AWS_REGION=eu-central-1
export SERVICE=home-iot-kg8odn4c
export BUILD_STAGE=dev
export IS_OFFLINE=1
export SES_IDENTITY_ARN
export DOMAIN_NAME=home.themajewski.com

export APP_VERSION=$(jq -r '.version' ./package.json)

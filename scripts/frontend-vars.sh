if [ -z "$SERVICE" ] || [ -z "$BUILD_STAGE" ] || [ -z "$AWS_REGION" ] || [ -z "$IS_OFFLINE" ]; then
  echo "Required environment variables are not set. Please check local-vars.sh"
  exit 1
fi

export_ssm() {
  local placeholder_name=$1
  local parameter_name=$2

  local parameter_value
  parameter_value=$(aws ssm get-parameter --name "$parameter_name" | jq -r .Parameter.Value)
  if [ -z "$parameter_value" ]; then
    echo "SSM parameter $placeholder_name from $parameter_name is missing or inaccessible."
    exit 1
  fi
  export "$placeholder_name"="$parameter_value"
}

export_ssm VITE_COGNITO_USER_POOL_CLIENT_ID "/${SERVICE}/${BUILD_STAGE}/${AWS_REGION}/user_pool_client_id"
export_ssm VITE_COGNITO_USER_POOL_ID "/${SERVICE}/${BUILD_STAGE}/${AWS_REGION}/user_pool_id"
export_ssm VITE_COGNITO_DOMAIN "/${SERVICE}/${BUILD_STAGE}/${AWS_REGION}/cognito_domain"
export_ssm VITE_HTTP_API_URL "/${SERVICE}/${BUILD_STAGE}/${AWS_REGION}/http_api_url"

export VITE_AWS_REGION=$AWS_REGION
export VITE_IS_OFFLINE=$IS_OFFLINE

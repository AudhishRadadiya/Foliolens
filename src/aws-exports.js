/* eslint-disable */
// WARNING: DO NOT EDIT. This file is automatically generated by AWS Amplify. It will be overwritten.

const awsmobile = {
  aws_project_region: "us-east-1",
  aws_cognito_identity_pool_id: "us-east-1:8455153c-4fa8-4c2f-bf93-f7a44eb86b01",
  aws_cognito_region: "us-east-1",
  aws_user_pools_id: "us-east-1_adGELM195",
  aws_user_pools_web_client_id: "5dd8s0ik0133nuf76vd3ovkuv7",
  oauth: {
    domain: "cognitodevapp.foliolens.com",
    scope: ["phone", "email", "openid", "profile", "aws.cognito.signin.user.admin"],
    redirectSignIn: "https://portal-devnew.foliolens.com/",
    redirectSignOut: "https://portal-devnew.foliolens.com/",
    responseType: "code",
  },
  federationTarget: "COGNITO_USER_POOLS",
  aws_cognito_username_attributes: ["EMAIL"],
  aws_cognito_social_providers: ["GOOGLE", "APPLE"],
  aws_cognito_signup_attributes: ["EMAIL"],
  aws_cognito_mfa_configuration: "OFF",
  aws_cognito_mfa_types: ["SMS"],
  aws_cognito_password_protection_settings: {
    passwordPolicyMinLength: 8,
    passwordPolicyCharacters: [],
  },
  aws_cognito_verification_mechanisms: ["EMAIL"],
  aws_user_files_s3_bucket: "foliolens171558-master",
  aws_user_files_s3_bucket_region: "us-east-1",
  aws_appsync_graphqlEndpoint: "https://wi3bqcnnurakpbpcgpolkt2jge.appsync-api.us-east-1.amazonaws.com/graphql",
  aws_appsync_region: "us-east-1",
  aws_appsync_authenticationType: "AMAZON_COGNITO_USER_POOLS",
};

export default awsmobile;

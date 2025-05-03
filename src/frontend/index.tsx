import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Amplify } from "aws-amplify";
import { Authenticator, View } from "@aws-amplify/ui-react";
import {
  COGNITO_USER_POOL_CLIENT_ID,
  COGNITO_DOMAIN,
  COGNITO_USER_POOL_ID,
} from "@config";
import AppRoutes from "./routes";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolClientId: COGNITO_USER_POOL_CLIENT_ID,
      loginWith: {
        oauth: {
          domain: COGNITO_DOMAIN,
          responseType: "code",
          scopes: [
            "email",
            "openid",
            "aws.cognito.signin.user.admin",
            "profile",
          ],
          redirectSignIn: ["/"], // TODO: Verify
          redirectSignOut: ["/"], // TODO: Verify
        },
      },
      userPoolId: COGNITO_USER_POOL_ID,
    },
  },
});

const root = createRoot(document.getElementById("root")!);
root.render(
  <BrowserRouter>
    <Authenticator.Provider>
      <View>
        <AppRoutes />
      </View>
    </Authenticator.Provider>
  </BrowserRouter>
);

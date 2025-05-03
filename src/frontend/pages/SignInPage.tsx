import {
  Authenticator,
  AuthenticatorProps,
  Heading,
  useTheme,
  View,
} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

const components: AuthenticatorProps["components"] = {
  Header() {
    const { tokens } = useTheme();

    return (
      <View textAlign="center" padding={tokens.space.large}>
        {/*{logo && <Image alt="App logo" src={logo} />}*/}
        <Heading level={3} padding={`${tokens.space.xl} 0`}>
          Welcome to Home-IoT
        </Heading>
      </View>
    );
  },
};

const SignInPage = () => {
  return (
    <View className="auth-wrapper">
      <Authenticator
        initialState="signIn"
        components={components}
        loginMechanisms={["email"]}
        hideSignUp={true}
      />
    </View>
  );
};

export default SignInPage;

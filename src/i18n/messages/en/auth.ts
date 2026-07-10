const auth = {
  auth: {
    loginTitle: "Log in",
    loginSubtitle: "Welcome back to Masrofaty",
    loading: "Loading...",
    forgotPassword: "Forgot password?",
    noAccount: "Don't have an account?",
    registerLink: "Create account",
    registerTitle: "Create account",
    registerSubtitle: "Start tracking your money in two minutes",
    hasAccount: "Already have an account?",
    loginLink: "Log in",
    signOut: "Sign out",
    fields: {
      email: "Email",
      password: "Password",
      name: "Name",
      newPassword: "New password",
    },
    submit: {
      login: "Log in",
      loggingIn: "Signing in...",
      register: "Create account",
      creating: "Creating...",
      sendReset: "Send reset link",
      sending: "Sending...",
      savePassword: "Save new password",
      resendVerification: "Resend verification email",
    },
    google: {
      continue: "Continue with Google",
      register: "Sign up with Google",
    },
    divider: {
      or: "or",
    },
    alerts: {
      verified: "Your email is verified — you can sign in now.",
      resetSuccess: "Password changed successfully — please sign in.",
      verifyEmailLink: "Verify email",
    },
    errors: {
      invalidCredentials: "Invalid email or password",
      userNotFound: "No account found with this email.",
      createAccountInstead: "Create an account instead",
      registerFailed: "Could not create account, please try again",
      resetSendFailed: "Could not send reset link",
      resetFailed: "Could not reset password",
      verificationSendFailed: "Could not send verification email",
    },
    forgot: {
      title: "Forgot password?",
      description: "We'll send a reset link to your email address",
      backToLogin: "Back to login",
      resetMessage:
        "If the email exists in our system, you'll receive a reset link. In local development, check the terminal for the link.",
    },
    reset: {
      title: "New password",
      description: "Choose a strong password (at least 8 characters)",
      invalidToken: "This link has expired or is invalid.",
      invalidLink: "This link is invalid or has expired.",
      requestNewLink: "Request a new link",
    },
    verify: {
      title: "Verify email",
      description: "You must verify your email before signing in. If you didn't receive the message, send it again.",
      resendMessage:
        "If the email exists and is unverified, you'll receive a verification link. In development, check the terminal.",
    },
    oauth: {
      accountNotLinked:
        "An account with this email uses a password. Sign in with email first, then try Google again.",
      unableToLink: "Could not link Google account. Try again or contact support.",
      signupDisabled: "New sign-ups are currently disabled.",
      emailMismatch: "The Google email does not match your current account.",
      accessDenied: "Google sign-in was cancelled.",
      internalError: "An error occurred during sign-in. Please try again.",
      generic: "Could not sign in with Google.",
    },
    suspended: {
      title: "Account suspended",
      body: "Your account has been temporarily suspended. Contact support if you need help.",
      backToLogin: "Back to login",
    },
  },
} as const;

export default auth;

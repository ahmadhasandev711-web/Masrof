type OAuthTranslationKey = |"accountNotLinked"|"unableToLink"|"signupDisabled"|"emailMismatch"|"accessDenied"|"internalError"|"generic"; const OAUTH_ERROR_KEYS: Record<string, OAuthTranslationKey> = { account_not_linked:"accountNotLinked", unable_to_link_account:"unableToLink", signup_disabled:"signupDisabled", email_doesnt_match:"emailMismatch", access_denied:"accessDenied", internal_server_error:"internalError",
}; export function getOAuthErrorMessage( code: string | null | undefined, t: (key: OAuthTranslationKey) => string, description?: string | null,
): string | null { if (!code) return null; const mappedKey = OAUTH_ERROR_KEYS[code]; return mappedKey ? t(mappedKey) : description ?? t("generic");
}

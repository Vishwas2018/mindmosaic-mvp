export type AuthView = "sign-in" | "sign-up";

export interface SignInFields {
  readonly email:    string;
  readonly password: string;
}

export interface SignUpFields {
  readonly displayName:     string;
  readonly email:           string;
  readonly password:        string;
  readonly confirmPassword: string;
}

export type AuthResult<T> =
  | { readonly success: true;  readonly data: T }
  | { readonly success: false; readonly error: string; readonly field?: string };

export interface PasswordRuleSet {
  readonly len:     boolean;
  readonly upper:   boolean;
  readonly lower:   boolean;
  readonly num:     boolean;
  readonly special: boolean;
}

/// <reference types="vite/client" />

interface Window {
  google: google
}

declare namespace google {
  namespace accounts {
    namespace id {
      type CredentialResponse = { credential?: string }
      type PromptMomentNotification = {
        isDisplayed: boolean
        isNotDisplayed: boolean
      }
      interface IdentityOptions {
        client_id: string
        callback: (response: CredentialResponse) => void
        auto_select?: boolean
        cancel_on_tap_outside?: boolean
      }
      function initialize(options: IdentityOptions): void
      function prompt(callback?: (notification: PromptMomentNotification) => void): void
      function renderButton(element: HTMLElement, options: Record<string, unknown>): void
    }

    namespace oauth2 {
      type TokenResponse = {
        access_token?: string
        expires_in?: number
        error?: string
        error_description?: string
      }
      interface TokenClientConfig {
        client_id: string
        scope: string
        callback: (response: TokenResponse) => void
      }
      interface AccessTokenRequest {
        prompt?: 'consent' | 'none'
      }
      interface TokenClient {
        requestAccessToken(request?: AccessTokenRequest): void
      }
      function initTokenClient(config: TokenClientConfig): TokenClient
    }
  }
}

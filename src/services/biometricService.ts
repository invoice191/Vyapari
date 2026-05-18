import { supabase } from "../lib/supabase";

export const biometricService = {
  /**
   * Checks if biometrics are supported on this device
   */
  isSupported: (): boolean => {
    return !!(window.PublicKeyCredential && 
             window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable);
  },

  /**
   * Registers a new biometric credential for the current user
   */
  register: async (userId: string, email: string): Promise<boolean> => {
    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const createCredentialOptions: any = {
        publicKey: {
          challenge: challenge,
          rp: {
            name: "Vyapari Enterprise",
            id: window.location.hostname === "localhost" ? undefined : window.location.hostname,
          },
          user: {
            id: new TextEncoder().encode(userId),
            name: email,
            displayName: email.split('@')[0],
          },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
          },
          timeout: 60000,
          attestation: "direct",
        },
      };

      const credential: any = await navigator.credentials.create(createCredentialOptions);
      
      if (credential) {
        // In a production app, we would send the attestation to the server to verify
        // For this demo, we store the credential ID to simulate the link
        const { error } = await supabase
          .from('profiles')
          .update({
            biometric_credential_id: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
            biometric_enabled: true,
            biometric_public_key: 'verified_via_webauthn'
          })
          .eq('id', userId);

        return !error;
      }
      return false;
    } catch (err) {
      console.error("Biometric Registration Error:", err);
      return false;
    }
  },

  /**
   * Authenticates the user using registered biometrics
   */
  authenticate: async (userId: string): Promise<boolean> => {
    try {
      // 1. Get stored credential ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('biometric_credential_id')
        .eq('id', userId)
        .single();

      if (!profile?.biometric_credential_id) return false;

      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const credentialId = new Uint8Array(
        atob(profile.biometric_credential_id).split("").map(c => c.charCodeAt(0))
      );

      const assertionOptions: any = {
        publicKey: {
          challenge: challenge,
          allowCredentials: [{
            id: credentialId,
            type: 'public-key',
            transports: ['internal'],
          }],
          userVerification: "required",
          timeout: 60000,
        },
      };

      const assertion = await navigator.credentials.get(assertionOptions);
      
      // If the hardware prompt completes successfully, the user is verified
      return !!assertion;
    } catch (err) {
      console.error("Biometric Auth Error:", err);
      return false;
    }
  }
};

import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
for (const scope of SCOPES) {
  provider.addScope(scope);
}
provider.setCustomParameters({
  prompt: 'select_account',
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;
let cachedUserEmail: string | null = null;

// Initialize auth state listener
export const initGoogleAuth = (
  onSuccess?: (user: { email: string; displayName?: string }, token: string) => void,
  onFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onSuccess) onSuccess({ email: user.email || 'tac@itaeb.cat', displayName: user.displayName || 'Coordinador ITAEB' }, cachedAccessToken);
    } else if (cachedUserEmail && cachedAccessToken) {
      if (onSuccess) onSuccess({ email: cachedUserEmail, displayName: 'Coordinador ITAEB' }, cachedAccessToken);
    } else if (!isSigningIn) {
      if (onFailure) onFailure();
    }
  });
};

/**
 * Sign in with Google Identity Services (GIS token client).
 * This works universally across all web origins without Firebase's authorized-domain restrictions.
 */
export const signInWithGoogleIdentityServices = (clientId: string): Promise<{
  accessToken: string;
  email: string;
}> => {
  return new Promise((resolve, reject) => {
    const google = (window as unknown as { google?: { accounts?: { oauth2?: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (resp: { access_token?: string; error?: string; error_description?: string }) => void;
      }) => { requestAccessToken: (opts?: { prompt?: string }) => void };
    } } } }).google;

    if (!google?.accounts?.oauth2) {
      reject(new Error("L'script de Google Identity Services encara no s'ha carregat. Reintenta-ho en uns segons."));
      return;
    }

    try {
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES.join(' '),
        callback: (tokenResponse) => {
          if (tokenResponse.error) {
            reject(new Error(tokenResponse.error_description || tokenResponse.error));
            return;
          }
          if (!tokenResponse.access_token) {
            reject(new Error("No s'ha rebut token d'accés de Google."));
            return;
          }

          cachedAccessToken = tokenResponse.access_token;
          cachedUserEmail = 'tac@itaeb.cat';

          // Store in window for instant availability
          if (typeof window !== 'undefined') {
            (window as unknown as { __GOOGLE_ACCESS_TOKEN__?: string }).__GOOGLE_ACCESS_TOKEN__ = cachedAccessToken;
          }

          resolve({
            accessToken: tokenResponse.access_token,
            email: 'tac@itaeb.cat',
          });
        },
      });

      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Combined authentication strategy:
 * 1. Tries Google Identity Services token flow (bypasses Firebase auth/unauthorized-domain completely)
 * 2. Fallback to Firebase signInWithPopup
 */
export const signInWithGoogleSheets = async (): Promise<{
  user: { email: string; displayName?: string };
  accessToken: string;
} | null> => {
  isSigningIn = true;

  // 1. Prefer Google Identity Services if available (direct OAuth client, no domain block)
  if (firebaseConfig.oAuthClientId && typeof window !== 'undefined') {
    try {
      const gisResult = await signInWithGoogleIdentityServices(firebaseConfig.oAuthClientId);
      cachedAccessToken = gisResult.accessToken;
      cachedUserEmail = gisResult.email;
      return {
        user: { email: gisResult.email, displayName: 'Coordinador ITAEB' },
        accessToken: gisResult.accessToken,
      };
    } catch (gisError) {
      console.warn('GIS Token client attempt failed, falling back to Firebase popup:', gisError);
    }
  }

  // 2. Fallback to Firebase Auth popup
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("No s'ha pogut obtenir el token d'accés de Google.");
    }
    cachedAccessToken = credential.accessToken;
    cachedUserEmail = result.user.email || 'tac@itaeb.cat';
    return {
      user: { email: result.user.email || 'tac@itaeb.cat', displayName: result.user.displayName || 'Coordinador ITAEB' },
      accessToken: cachedAccessToken,
    };
  } catch (error: unknown) {
    console.error('Firebase Auth sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getCachedGoogleAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const setCachedGoogleAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const googleSignOut = async () => {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('Sign out notice:', e);
  }
  cachedAccessToken = null;
  cachedUserEmail = null;
  if (typeof window !== 'undefined') {
    delete (window as unknown as { __GOOGLE_ACCESS_TOKEN__?: string }).__GOOGLE_ACCESS_TOKEN__;
  }
};

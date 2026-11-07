// Free Path: Firebase bridge. Load it AFTER the game, as a module:  <script type="module" src="firebase-bridge.js"></script>
// Adds OTP login, weekly leaderboard, cloud save and account deletion to the game through window.FREEPATH_* hooks.
// If the phone is offline or Firebase is missing, nothing is defined and the game keeps working offline.
// NOTE: written from the plugin docs and not run against a live Firebase project. Test every step (see SETUP.md).
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, PhoneAuthProvider, signInWithCredential, signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js';

const FIREBASE_CONFIG = { /* paste the web app config from Firebase console: apiKey, authDomain, projectId, appId ... */ };
const REGION = 'asia-south1';

try {
  const C = window.Capacitor;
  if (!C || !C.isNativePlatform || !C.isNativePlatform()) throw new Error('native only');
  const app = initializeApp(FIREBASE_CONFIG);
  const auth = getAuth(app);
  const fn = getFunctions(app, REGION);
  const call = (n) => httpsCallable(fn, n);
  const FA = C.registerPlugin('FirebaseAuthentication');   // @capacitor-firebase/authentication, set skipNativeAuth:true in capacitor.config.json
  let verificationId = null;

  window.FREEPATH_SEND_OTP = (phone) => new Promise(async (resolve, reject) => {
    try {
      const h1 = await FA.addListener('phoneCodeSent', (e) => { verificationId = e.verificationId; h1.remove(); h2.remove(); resolve(); });
      const h2 = await FA.addListener('phoneVerificationFailed', (e) => { h1.remove(); h2.remove(); reject(new Error(e && e.message)); });
      await FA.signInWithPhoneNumber({ phoneNumber: phone });
    } catch (e) { reject(e); }
  });
  window.FREEPATH_VERIFY_OTP = async (phone, code) => {
    if (!verificationId) return false;
    await signInWithCredential(auth, PhoneAuthProvider.credential(verificationId, code));
    return true;
  };
  // Every server call needs a signed-in (OTP verified) user. Same phone number = same uid on any phone.
  window.FREEPATH_LB_SUBMIT = async (p) => { await call('submitScore')(p); };
  window.FREEPATH_LB_FETCH = async (week) => (await call('getLeaderboard')({ week })).data.rows;
  window.FREEPATH_CLOUD_SAVE = async (phone, data) => { await call('saveProgress')({ data }); };
  window.FREEPATH_CLOUD_LOAD = async () => (await call('loadProgress')()).data.data || null;
  window.FREEPATH_DELETE_ACCOUNT = async () => { await call('deleteAccount')(); await signOut(auth); try { await FA.signOut(); } catch (e) {} };
  window.dispatchEvent(new Event('fp-bridge'));
} catch (e) { console.warn('Firebase bridge not active:', e && e.message); }

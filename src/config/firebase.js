import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBbm2Xm-YypkNMDN5xFlbG1JxyA9Dn9zIc",
  authDomain: "locksy-notification.firebaseapp.com",
  projectId: "locksy-notification",
  storageBucket: "locksy-notification.firebasestorage.app",
  messagingSenderId: "778063785687",
  appId: "1:778063785687:android:3b1e05a93ca0456b478a92"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;

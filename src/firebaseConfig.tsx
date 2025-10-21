// Contributors:
//  Luke Arvey - 1 Hour
//  Ridley Wills - 1 Hour
//  Tristan Van - 3 Hours

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCPnbvwi6E9cfN96yKjCYPOj5RlvwcUZtQ",
  authDomain: "resume-reviewer-d6d4b.firebaseapp.com",
  projectId: "resume-reviewer-d6d4b",
  storageBucket: "resume-reviewer-d6d4b.firebasestorage.app",
  messagingSenderId: "980681427071",
  appId: "1:980681427071:web:911d9b559695d7045c174a",
  measurementId: "G-3PDWLXGSLV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export default app;
import firebase from 'firebase/app';
import 'firebase/analytics';
import 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC17JfGlIYgic4alZQwJQ3w0d0DWEYNscY",
  authDomain: "gaetalk-dc0e6.firebaseapp.com",
  projectId: "gaetalk-dc0e6",
  storageBucket: "gaetalk-dc0e6.appspot.com",
  messagingSenderId: "578915040528",
  appId: "1:578915040528:web:e1a25643f31ef150a7f995",
  measurementId: "G-F341D86F1Y"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();

export default firebase;
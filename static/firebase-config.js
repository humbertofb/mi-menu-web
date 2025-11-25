// Firebase Configuration
// REEMPLAZA ESTOS VALORES CON LOS DE TU PROYECTO DE FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyBtf--tWrqRVItAGJGQ6hEk81iggP4I-SU",
    authDomain: "my-humber-project-319815.firebaseapp.com",
    databaseURL: "https://my-humber-project-319815-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "my-humber-project-319815",
    storageBucket: "my-humber-project-319815.firebasestorage.app",
    messagingSenderId: "110994378936",
    appId: "1:110994378936:web:60b20c16ce5f40b47e644d"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

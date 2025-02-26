require("dotenv").config();
const admin = require("firebase-admin");

const requiredEnvVars = ["FB_PROJECTID", "FB_PRIVATEKEY", "FB_CLIENTEMAIL", "FB_DATABASEURI"];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}. Check your .env file.`);
    }
}
const privateKey = process.env.FB_PRIVATEKEY.replace(/\\n/g, "\n");

const serviceAccount = {
    projectId: process.env.FB_PROJECTID,
    privateKey,
    clientEmail: process.env.FB_CLIENTEMAIL,
};

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FB_DATABASEURI,
    });
}

const db = admin.database();

module.exports = { admin, db };
const admin = require('firebase-admin');
const fetch = require('node-fetch');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function scanGeral() {
    console.log("🕵️ MODO SCAN TOTAL ATIVADO...");
    
    try {
        // 1. Listar todas as coleções existentes
        const collections = await db.listCollections();
        console.log(`📂 Coleções encontradas: [${collections.map(c => c.id).join(', ')}]`);

        if (collections.length === 0) {
            console.log("❌ Nenhuma coleção encontrada. O banco está REALMENTE vazio para esta chave JSON.");
            return;
        }

        // 2. Tentar ler a coleção 'users'
        const usersSnap = await db.collection('users').get();
        console.log(`👤 Documentos em 'users': ${usersSnap.size}`);

        usersSnap.forEach(doc => {
            console.log(`   ID: ${doc.id} | Dados: ${JSON.stringify(doc.data()).substring(0, 50)}...`);
        });

    } catch (e) {
        console.error("❌ ERRO NO SCAN:", e.message);
    }
}

scanGeral().then(() => process.exit(0));

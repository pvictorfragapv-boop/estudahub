const admin = require('firebase-admin');
const fetch = require('node-fetch');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// Inicialização com o banco de dados explícito
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
    });
}

const db = admin.firestore();

async function dispararRevisoes() {
    console.log("🚀 Iniciando varredura forçada...");
    
    try {
        // Tenta ler qualquer documento na coleção users
        const usersRef = db.collection('users');
        const snap = await usersRef.limit(5).get();

        if (snap.empty) {
            console.log("❌ O banco retornou VAZIO. Possíveis causas:");
            console.log("1. A coleção não se chama 'users' (case sensitive).");
            console.log("2. A chave JSON não tem permissão 'Cloud Datastore Viewer'.");
            console.log("3. Você está usando o Firestore em modo 'Datastore' (menos provável).");
            return;
        }

        console.log(`✅ Sucesso! Encontrei ${snap.size} usuários.`);
        
        for (const userDoc of snap.docs) {
            console.log(`👤 Processando usuário: ${userDoc.id}`);
            // ... lógica de envio aqui ...
            // (vou omitir o resto para focarmos no erro de conexão)
        }

    } catch (e) {
        console.error("❌ ERRO DE CONEXÃO:", e.message);
    }
}

dispararRevisoes().then(() => process.exit(0));

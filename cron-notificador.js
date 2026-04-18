const admin = require('firebase-admin');
const fetch = require('node-fetch');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// Inicialização robusta
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = admin.firestore();

async function diagnostico() {
  console.log("🛠️ INICIANDO DIAGNÓSTICO...");
  
  try {
    // 1. Tentar listar todas as coleções do banco
    const collections = await db.listCollections();
    const nomes = collections.map(c => c.id);
    console.log("📂 Coleções encontradas no seu banco:", nomes);

    if (nomes.length === 0) {
       console.error("❌ ERRO: O banco parece estar vazio ou a chave não tem permissão de leitura.");
       return;
    }

    // 2. Tentar ler a coleção 'users' (ou o que estiver lá)
    const colName = nomes.includes('users') ? 'users' : nomes[0];
    console.log(`🔍 Lendo a coleção: ${colName}...`);
    
    const snap = await db.collection(colName).get();
    console.log(`👤 Documentos encontrados em '${colName}': ${snap.size}`);

    snap.forEach(doc => {
      console.log(`   - ID do documento: ${doc.id}`);
      // Aqui vamos ver se existe a subcoleção data
    });

    if (snap.size > 0) {
        console.log("✅ Conexão com Firebase funcionando!");
        console.log("⚠️ Verifique se hoje há temas com data de estudo de ONTEM (17/04/2026).");
    }

  } catch (error) {
    console.error("❌ ERRO FATAL:", error.message);
  }
}

diagnostico().then(() => process.exit(0));

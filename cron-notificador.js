const admin = require('firebase-admin');
const fetch = require('node-fetch');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function dispararRevisoes() {
  console.log("🚀 Iniciando busca...");
  const hoje = new Date().toISOString().split('T')[0];
  
  // Pegamos todos os documentos da coleção users
  const usersSnap = await db.collection('users').get();
  
  if (usersSnap.empty) {
    console.log("❌ NENHUM DOCUMENTO encontrado na coleção 'users'.");
    console.log("👉 Certifique-se de que você fez login no site e salvou pelo menos um tema.");
    return;
  }

  for (const userDoc of usersSnap.docs) {
    // Tentamos ler a subcoleção data/state
    const stateSnap = await db.collection('users').doc(userDoc.id).collection('data').doc('state').get();
    
    if (stateSnap.exists()) {
      const data = stateSnap.data();
      if (!data.tgChatId || !data.temas) continue;

      const revisoesHoje = data.temas.filter(t => {
        if (!t.estudado || !t.dataEstudo) return false;
        
        // Ajuste de fuso horário manual para bater com o Brasil
        const d = t.dataEstudo;
        const r24 = somarDias(d, 1);
        const r1s = somarDias(d, 7);
        const r1m = somarDias(d, 30);
        
        return (r24 === hoje && !t.rev24h) || 
               (r1s === hoje && !t.rev1s) || 
               (r1m === hoje && !t.rev1m);
      });

      if (revisoesHoje.length > 0) {
        console.log(`✅ Enviando para ${data.tgChatId}`);
        await enviarTelegram(data.tgChatId, revisoesHoje);
      }
    }
  }
}

function somarDias(dataStr, n) {
  const partes = dataStr.split('-');
  const d = new Date(partes[0], partes[1] - 1, partes[2]);
  d.setDate(d.getDate() + n);
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

async function enviarTelegram(chatId, revisoes) {
  let msg = `🚀 *ESTUDAHUB: REVISÕES DE HOJE*\n\n`;
  revisoes.forEach(r => msg += `• *${r.materia}*: ${r.tema}\n`);
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' })
  });
}

dispararRevisoes().then(() => process.exit(0));

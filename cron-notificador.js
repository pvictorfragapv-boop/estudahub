const admin = require('firebase-admin');
const fetch = require('node-fetch');

// 1. Inicializa o Firebase
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function dispararRevisoes() {
  const hoje = new Date().toISOString().split('T')[0];
  const usersSnap = await db.collection('users').get();

  for (const userDoc of usersSnap.docs) {
    const stateSnap = await db.collection('users').doc(userDoc.id).collection('data').doc('state').get();
    
    if (stateSnap.exists()) {
      const data = stateSnap.data();
      if (!data.tgChatId || !data.temas) continue;

      // Lógica de filtro (mesma que você usa no site)
      const revisoesHoje = data.temas.filter(t => {
        if (!t.estudado || !t.dataEstudo) return false;
        const d = t.dataEstudo;
        const r24 = somarDias(d, 1);
        const r1s = somarDias(d, 7);
        const r1m = somarDias(d, 30);
        
        return (r24 === hoje && !t.rev24h) || 
               (r1s === hoje && !t.rev1s) || 
               (r1m === hoje && !t.rev1m);
      });

      if (revisoesHoje.length > 0) {
        await enviarTelegram(data.tgChatId, revisoesHoje);
      }
    }
  }
}

function somarDias(dataStr, n) {
  const d = new Date(dataStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
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
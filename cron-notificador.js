const admin = require('firebase-admin');
const fetch = require('node-fetch');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function dispararRevisoes() {
  const hoje = new Date().toISOString().split('T')[0];
  console.log(`📅 Data de hoje no servidor: ${hoje}`);

  // Tenta buscar TODOS os documentos, sem filtrar por coleção primeiro
  const usersSnap = await db.collection('users').get();
  
  if (usersSnap.empty) {
    console.log("❌ ERRO: A coleção 'users' continua aparecendo como vazia.");
    return;
  }

  for (const userDoc of usersSnap.docs) {
    console.log(`👤 Verificando usuário: ${userDoc.id}`);
    
    // O seu código do site salva em: users > ID > data > state
    const stateSnap = await db.collection('users').doc(userDoc.id).collection('data').doc('state').get();
    
    if (stateSnap.exists()) {
      const data = stateSnap.data();
      console.log(`✅ Documento 'state' encontrado para ${userDoc.id}`);
      
      if (!data.tgChatId) { console.log("⚠️ Usuário sem Chat ID do Telegram."); continue; }
      if (!data.temas) { console.log("⚠️ Usuário sem temas cadastrados."); continue; }

      const revisoesHoje = data.temas.filter(t => {
        if (!t.estudado || !t.dataEstudo) return false;
        // Cálculo de datas
        const d = t.dataEstudo;
        const r24 = somarDias(d, 1);
        const r1s = somarDias(d, 7);
        const r1m = somarDias(d, 30);
        return (r24 === hoje && !t.rev24h) || (r1s === hoje && !t.rev1s) || (r1m === hoje && !t.rev1m);
      });

      if (revisoesHoje.length > 0) {
        console.log(`🚀 Disparando ${revisoesHoje.length} temas para o Telegram!`);
        await enviarTelegram(data.tgChatId, revisoesHoje);
      } else {
        console.log("ℹ️ Temas encontrados, mas nenhum vence hoje.");
      }
    } else {
      console.log(`❌ Subcoleção 'data/state' NÃO encontrada para ${userDoc.id}. Verifique a estrutura no Firebase.`);
    }
  }
}

function somarDias(dataStr, n) {
  const partes = dataStr.split('-');
  const d = new Date(partes[0], partes[1] - 1, partes[2]);
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

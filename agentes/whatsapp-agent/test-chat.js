import 'dotenv/config';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { handleMessage, clearHistory, getStats } from './claude-handler.js';

const userId = process.argv[2] || 'test-user@local';
const userName = process.argv[3] || 'Usuario de prueba';

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ Falta ANTHROPIC_API_KEY en .env');
  process.exit(1);
}

const rl = readline.createInterface({ input, output });

console.log('\n🧪 Test de chat — Hotel Paraíso Encantado');
console.log(`👤 Usuario de prueba: ${userName} (${userId})`);
console.log('Escribe tu mensaje y presiona Enter.');
console.log('Comandos: /reset, /stats, /salir\n');

try {
  while (true) {
    const message = (await rl.question('Tú: ')).trim();

    if (!message) continue;

    const command = message.toLowerCase();

    if (command === '/salir' || command === 'exit') {
      console.log('👋 Cerrando prueba de chat...');
      break;
    }

    if (command === '/reset' || command === '/clear') {
      clearHistory(userId);
      console.log('🧹 Historial limpiado.\n');
      continue;
    }

    if (command === '/stats') {
      const stats = getStats();
      console.log(`📊 Conversaciones activas: ${stats.active_conversations}\n`);
      continue;
    }

    try {
      const result = await handleMessage(userId, message, userName);
      const response = typeof result === 'string' ? result : result?.text;
      const needsHuman = typeof result === 'object' && result?.requiresHumanIntervention;
      console.log(`\nBot: ${response}\n`);
      if (needsHuman) {
        console.log('🏷️ Etiqueta: REQUIERE_INTERVENCION_HUMANA\n');
      }
    } catch (error) {
      console.error(`\n❌ Error probando el chat: ${error.message}\n`);
    }
  }
} finally {
  rl.close();
}

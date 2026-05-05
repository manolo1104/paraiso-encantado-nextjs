import 'dotenv/config';
import { TRAINING_SCENARIOS } from './training-scenarios.js';
import { handleMessage, clearHistory } from './claude-handler.js';

function toRegexArray(patterns = []) {
  return patterns.map((p) => new RegExp(p, 'i'));
}

function evaluateResponse(response, step) {
  const text = (response || '').trim();
  const expectAll = toRegexArray(step.expectAll || []);
  const expectAny = toRegexArray(step.expectAny || []);
  const forbid = toRegexArray(step.forbid || []);

  const allOk = expectAll.every((rx) => rx.test(text));
  const anyOk = expectAny.length === 0 ? true : expectAny.some((rx) => rx.test(text));
  const forbidOk = forbid.every((rx) => !rx.test(text));

  return {
    passed: allOk && anyOk && forbidOk,
    allOk,
    anyOk,
    forbidOk,
    text
  };
}

async function runScenario(scenario) {
  clearHistory(scenario.userId);

  const stepResults = [];

  for (const step of scenario.steps) {
    const result = await handleMessage(scenario.userId, step.user, scenario.userName);
    const botText = typeof result === 'string' ? result : result?.text || '';
    const evalResult = evaluateResponse(botText, step);

    stepResults.push({
      user: step.user,
      bot: botText,
      ...evalResult
    });
  }

  const passed = stepResults.every((s) => s.passed);
  return { ...scenario, passed, stepResults };
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ Falta ANTHROPIC_API_KEY en .env');
    process.exit(1);
  }

  const selectedId = process.argv[2];
  const scenarios = selectedId
    ? TRAINING_SCENARIOS.filter((s) => s.id === selectedId)
    : TRAINING_SCENARIOS;

  if (scenarios.length === 0) {
    console.error('❌ No encontré ese escenario. Revisa training-scenarios.js');
    process.exit(1);
  }

  console.log(`\n🧠 Entrenamiento WhatsApp Agent (${scenarios.length} escenario${scenarios.length === 1 ? '' : 's'})\n`);

  const results = [];
  for (const scenario of scenarios) {
    console.log(`▶️  ${scenario.title} [${scenario.id}]`);
    const scenarioResult = await runScenario(scenario);
    results.push(scenarioResult);

    for (const [idx, step] of scenarioResult.stepResults.entries()) {
      const status = step.passed ? '✅' : '❌';
      console.log(`  ${status} Paso ${idx + 1}: ${step.user}`);
      if (!step.passed) {
        console.log(`     └─ Respuesta: ${step.bot}`);
      }
    }

    console.log('');
  }

  const passedCount = results.filter((r) => r.passed).length;
  const total = results.length;

  console.log(`📊 Resultado final: ${passedCount}/${total} escenarios aprobados`);

  if (passedCount !== total) {
    console.log('⚠️ Hay escenarios fallando. Ajusta hotel-knowledge.js y vuelve a correr.');
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('❌ Error en entrenamiento:', err.message);
  process.exit(1);
});

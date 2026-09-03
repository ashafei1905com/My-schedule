import fs from 'fs';

const code = fs.readFileSync('worker.js', 'utf8');

function extractFunction(name, isAsync = false) {
  const prefix = (isAsync ? "async function " : "function ") + name;
  const start = code.indexOf(prefix);
  if (start === -1) return null;
  
  let braceCount = 0;
  let end = -1;
  let started = false;
  
  for (let i = start; i < code.length; i++) {
    if (code[i] === '{') {
      braceCount++;
      started = true;
    } else if (code[i] === '}') {
      braceCount--;
    }
    
    if (started && braceCount === 0) {
      end = i + 1;
      break;
    }
  }
  
  return code.slice(start, end);
}

const funcsToExtract = [
  {name: 'handleSaveSubscription', async: true},
  {name: 'dispatchDueReminders', async: true},
  {name: 'handleNutritionLookup', async: true},
  {name: 'normalizeFoodKey', async: false},
  {name: 'toFirestoreValue', async: false},
  {name: 'fromFirestoreValue', async: false},
  {name: 'importServiceAccountKey', async: true},
  {name: 'getFirestoreAccessToken', async: true},
  {name: 'firestoreGetFood', async: true},
  {name: 'firestoreSetFood', async: true},
  {name: 'usdaNormalizeForScore', async: false},
  {name: 'usdaRelevanceScoreDetailed', async: false},
  {name: 'usdaRelevanceScore', async: false},
  {name: 'usdaPickBestResult', async: false},
  {name: 'usdaExtractPer100g', async: false},
  {name: 'usdaSearchRaw', async: true},
  {name: 'needsDecomposition', async: false},
  {name: 'decomposeDish', async: true},
  {name: 'translateToArabic', async: true},
  {name: 'usdaNormalizeAndRetry', async: true},
  {name: 'usdaLookupFood', async: true},
  {name: 'tier3EstimateMacro', async: true},
];

const extracted = {};
for (const f of funcsToExtract) {
  extracted[f.name] = extractFunction(f.name, f.async);
}

fs.writeFileSync('extracted.json', JSON.stringify(extracted, null, 2));
console.log("Functions extracted to extracted.json");

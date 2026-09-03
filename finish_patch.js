import fs from 'fs';

let content = fs.readFileSync('worker.js', 'utf8');

// Imports to add
const imports = `
import { handleNutritionLookup } from './src/features/nutrition/controllers/nutritionController.js';
import { handleSaveSubscription, dispatchDueReminders } from './src/features/notifications/controllers/notificationController.js';
`;

// Insert imports at the top (after import { handleBuildSchedule })
const insertionPoint = content.indexOf('import { handleBuildSchedule }');
if (insertionPoint !== -1) {
  content = content.slice(0, insertionPoint) + imports + content.slice(insertionPoint);
} else {
  const allowOriginIndex = content.indexOf('const ALLOWED_ORIGIN');
  content = content.slice(0, allowOriginIndex) + imports + content.slice(allowOriginIndex);
}

// Remove the old functions by taking everything before the first one we extract
// Wait, the functions are scattered. The easiest way to strip them is by searching for them.
function removeFunction(name, isAsync = false) {
  const prefix = (isAsync ? "async function " : "function ") + name;
  const start = content.indexOf(prefix);
  if (start === -1) return;
  
  let braceCount = 0;
  let end = -1;
  let started = false;
  
  for (let i = start; i < content.length; i++) {
    if (content[i] === '{') {
      braceCount++;
      started = true;
    } else if (content[i] === '}') {
      braceCount--;
    }
    
    if (started && braceCount === 0) {
      end = i + 1;
      break;
    }
  }
  
  content = content.slice(0, start) + content.slice(end);
}

const funcsToRemove = [
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

for (const f of funcsToRemove) {
  removeFunction(f.name, f.async);
}

fs.writeFileSync('worker.js', content, 'utf8');
console.log("Worker.js fully pruned and modularized.");

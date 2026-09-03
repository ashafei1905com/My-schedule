
export let _fbTokenCache = { token: null, expiresAt: 0 };

export function base64url(bytes) {
  let str = typeof bytes === 'string' ? bytes : String.fromCharCode(...new Uint8Array(bytes));
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export async function importServiceAccountKey(pem) {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    // Strips LITERAL two-character backslash-n sequences, not just real newline
    // characters. This is the actual fix for the production `atob() called with
    // invalid base64-encoded data` error: when a service-account JSON key's
    // private_key field (which is stored JSON-escaped, e.g. "...\nMIIEvQ...\n...")
    // is copied out of the JSON file and pasted into `wrangler secret put`, it is
    // extremely easy for the escape sequence to survive as the literal two
    // characters `\` + `n` rather than becoming a real newline byte — `\s+` below
    // only matches real whitespace, so those literal backslash-n pairs previously
    // survived straight into the base64 body, and `\`/`n`-as-text are not valid
    // base64 alphabet characters, hence atob() throwing InvalidCharacterError.
    .replace(/\\n/g, '')
    .replace(/\s+/g, '');
  // Validate the cleaned string is plausible base64 BEFORE calling atob(), so a
  // still-malformed secret produces a clear, actionable error message (naming the
  // actual cause) instead of atob()'s opaque InvalidCharacterError with no context —
  // this is what let the original failure reach production silently as a generic
  // "foods cache lookup failed" catch-all instead of pointing at the secret itself.
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(body)) {
    throw new Error('FIREBASE_PRIVATE_KEY does not decode as valid base64 after cleanup — re-check the secret was pasted correctly (the full PEM body between BEGIN/END PRIVATE KEY, either as real newlines or a single unbroken line)');
  }
  const der = Uint8Array.from(atob(body), c => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'pkcs8',
    der.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

export async function getFirestoreAccessToken(env) {
  const now = Math.floor(Date.now() / 1000);
  if (_fbTokenCache.token && _fbTokenCache.expiresAt - now > 60) {
    return _fbTokenCache.token;
  }

  if (!env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
    throw new Error('Firebase service account secrets not configured (FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY)');
  }

  const header = { alg: 'RS256', typ: 'JWT' };
  const claims = {
    iss: env.FIREBASE_CLIENT_EMAIL,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  };
  const encHeader = base64url(JSON.stringify(header));
  const encClaims = base64url(JSON.stringify(claims));
  const signingInput = `${encHeader}.${encClaims}`;

  const key = await importServiceAccountKey(env.FIREBASE_PRIVATE_KEY);
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signingInput)
  );
  const jwt = `${signingInput}.${base64url(sig)}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text().catch(() => '');
    throw new Error(`Firebase OAuth token exchange failed: ${tokenRes.status} ${errText}`);
  }

  const tokenData = await tokenRes.json();
  _fbTokenCache = { token: tokenData.access_token, expiresAt: now + (tokenData.expires_in || 3600) };
  return _fbTokenCache.token;
}

export function toFirestoreValue(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toFirestoreValue) } };
  if (typeof v === 'object') {
    const fields = {};
    for (const k of Object.keys(v)) fields[k] = toFirestoreValue(v[k]);
    return { mapValue: { fields } };
  }
  return { stringValue: String(v) };
}

export function fromFirestoreValue(v) {
  if (!v) return null;
  if ('nullValue' in v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return parseInt(v.integerValue, 10);
  if ('doubleValue' in v) return v.doubleValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(fromFirestoreValue);
  if ('mapValue' in v) {
    const out = {};
    const fields = v.mapValue.fields || {};
    for (const k of Object.keys(fields)) out[k] = fromFirestoreValue(fields[k]);
    return out;
  }
  return null;
}

export async function firestoreGetFood(env, docId) {
  const token = await getFirestoreAccessToken(env);
  const res = await fetch(`${FIRESTORE_BASE(env)}/foods/${encodeURIComponent(docId)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Firestore get failed: ${res.status} ${errText}`);
  }
  const data = await res.json();
  const fields = data.fields || {};
  const out = {};
  for (const k of Object.keys(fields)) out[k] = fromFirestoreValue(fields[k]);
  return out;
}

export async function firestoreSetFood(env, docId, fieldsObj) {
  try {
    const token = await getFirestoreAccessToken(env);
    const fields = {};
    for (const k of Object.keys(fieldsObj)) fields[k] = toFirestoreValue(fieldsObj[k]);
    const res = await fetch(`${FIRESTORE_BASE(env)}/foods/${encodeURIComponent(docId)}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('firestoreSetFood failed', res.status, errText);
    }
  } catch (e) {
    console.error('firestoreSetFood threw', e);
  }
}


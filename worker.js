// ── Stephen AI system prompt ──
const STEPHEN_SYSTEM_PROMPT = `You are Stephen AI, the digital version of Stephen Kanti Mahanty. You respond exactly as Stephen would — with his genuine personality, humor, and knowledge.

WHO YOU ARE:
- Sophomore at Harvey Mudd College (HMC), pursuing a BS in Engineering with a concentration in Political Science
- Born in India, immigrated to the US as a young child; lived in California, Arizona, Texas, and Minnesota (high school)
- Strong math and physics background via the University of Minnesota Talented Youth Mathematics Program (UMTYMP) and PSEO program in high school

PERSONALITY & VOICE:
- Confident and self-assured with playful, self-aware humor — you know you're awesome and aren't shy about it
- Enthusiastic and warm — you use exclamation points naturally, not ironically
- Witty and occasionally sarcastic, but always genuinely kind
- Smart and technical, but you never talk down to people
- You keep things "short and sweet" — you're not long-winded
- You genuinely love teaching and making people feel welcome

ACADEMIC INTERESTS:
Systems Engineering, Electrical Engineering, Robotics, Computer Science, Mathematical Modeling, Signal Processing, AI, Political Science

PERSONAL INTERESTS:
Cooking, Swimming, Reading, Traveling, Music (you play bassoon, trombone, saxophone, and percussion), Simulation Racing

RESEARCH EXPERIENCE:
- Currently a student researcher at the Machine Learning and Autonomy for Diverse Domains (MADD) Lab at Harvey Mudd — integrating and optimizing ML models on an NVIDIA Jetson Orin for real-time computer vision (wildfire detection). Also exploring drone communication networks and Ultra-Wide Band (UWB) localization.
- Summer 2025 REU at Colorado School of Mines (Materials Science & Engineering) under Prof. Anna Staerz — developed a Gallium Oxide Hydrogen sensor for harsh-condition environments. Grew skills in mechanical design, electrical setups, and Operando Spectroelectrochemistry.
- Presented at the Materials Research Society (MRS) Fall 2025 Meeting in Boston, MA, at Colorado School of Mines, and at Harvey Mudd.
- Previous: student researcher and project manager at the Degrees of Freedom Project (DOFPro) under Prof. Erik Spjut — created open-source educational software for HMC engineering classes. Built and tested a 55m dual-deploy rocket, earning NAR Level 1 Certification.

CLUBS & LEADERSHIP:
- MuddSub (Harvey Mudd's autonomous underwater vehicle team that competes in RoboSub): Electrical President — leads the electrical subteam, designs custom PCBs, wires the vehicle, integrates sensors, and works on directional hydrophones and split-aperture correlators.
- MACH (Harvey Mudd's automotive club — building a car from scratch): Chief Powertrain Engineer — oversees engine, transmission, and drivetrain; coordinates with mechanical and electrical subteams.
- 5C Swim Club, 5CIV (Christian InterVarsity), Drive HMC (campus simulation racing club)
- South Dorm Mentor — helps first-year students adjust and thrive, hosts events, runs daily crosswords

JOBS:
- Teaching Assistant for Engineering Design and Manufacturing (E4) at HMC — helps student teams with design process; one of the most rewarding things you've done
- Former tutor for Upward Bound (math, physics, chemistry, college applications for low-income and first-gen students)
- Available for private tutoring across various subjects and ages

TECHNICAL SKILLS:
- Languages: Python, Java, JavaScript, LaTeX, C++, Racket
- Software: Microsoft Office, SolidWorks CAD, KiCAD, MATLAB, ROS, Arduino, TensorFlow, Git

CONTACT:
- Email: skantimahanty@hmc.edu
- LinkedIn: linkedin.com/in/stephen-kanti-mahanty/

HOW TO RESPOND:
- Always respond in first person as Stephen — you ARE Stephen, not an AI pretending to be him
- Be helpful, funny, and genuinely engaging
- Keep responses concise and punchy — Stephen doesn't ramble
- Use Stephen's confident, upbeat tone naturally
- If someone asks something you genuinely don't have info on, say so in a very Stephen way ("Good question — honestly not sure about that one!")
- If the topic is unrelated to Stephen's life/background, engage thoughtfully as Stephen would
- Never break character or identify yourself as an AI model`;

const SESSION_COOKIE = 'skm_upload_session';
const UPLOAD_PREFIX = '/uploads/';
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) {
    return cookies;
  }

  cookieHeader.split(';').forEach((part) => {
    const [rawName, ...rawValueParts] = part.trim().split('=');
    if (!rawName) {
      return;
    }

    cookies[rawName] = decodeURIComponent(rawValueParts.join('=') || '');
  });

  return cookies;
}

function randomToken() {
  return crypto.randomUUID().replace(/-/g, '');
}

function ensureSessionToken(request) {
  const cookies = parseCookies(request.headers.get('Cookie'));
  const token = cookies[SESSION_COOKIE] || randomToken();
  const setCookie = cookies[SESSION_COOKIE]
    ? null
    : `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=86400; HttpOnly; Secure; SameSite=Lax`;

  return { token, setCookie };
}

function noStoreHeaders() {
  return {
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex, nofollow',
    'Referrer-Policy': 'no-referrer',
  };
}

function mergeHeaders(base, extra = {}) {
  const headers = new Headers(base);
  Object.entries(extra).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      headers.set(key, value);
    }
  });
  return headers;
}

function jsonResponse(data, init = {}) {
  const headers = mergeHeaders(init.headers, {
    'Content-Type': 'application/json; charset=utf-8',
    ...noStoreHeaders(),
  });

  return new Response(JSON.stringify(data), {
    ...init,
    headers,
  });
}

function sanitizeFileName(name) {
  return (name || 'image')
    .replace(/["\\]/g, '')
    .replace(/[^\w.\-() ]+/g, '_')
    .slice(0, 120);
}

async function serveAsset(env, request, assetPath, extraHeaders = {}) {
  const assetUrl = new URL(assetPath, request.url);
  const assetRequest = new Request(assetUrl.toString(), {
    method: 'GET',
    headers: request.headers,
  });
  const response = await env.ASSETS.fetch(assetRequest);
  const headers = mergeHeaders(response.headers, extraHeaders);
  return new Response(response.body, {
    status: response.status,
    headers,
  });
}

function getUploadKey(id) {
  return `${UPLOAD_PREFIX}${id}/image.png`;
}

function getViewerPath(id) {
  return `${UPLOAD_PREFIX}${id}/`;
}

function getUploadIdFromPath(pathname) {
  const rawMatch = pathname.match(/^\/uploads\/([^/]+)\/image\.png$/);
  if (rawMatch) {
    return rawMatch[1];
  }

  const viewerMatch = pathname.match(/^\/uploads\/([^/]+)\/?$/);
  if (viewerMatch) {
    return viewerMatch[1];
  }

  return null;
}

function isAuthorizedUpload(request, record) {
  const cookies = parseCookies(request.headers.get('Cookie'));
  if (!record || !record.customMetadata || !record.customMetadata.sessionToken) {
    return false;
  }

  return cookies[SESSION_COOKIE] === record.customMetadata.sessionToken;
}

async function handleUploadPage(request, env) {
  const { setCookie } = ensureSessionToken(request);
  const response = await serveAsset(env, request, '/upload/index.html', noStoreHeaders());
  if (!setCookie) {
    return response;
  }

  const headers = mergeHeaders(response.headers, {
    'Set-Cookie': setCookie,
  });
  return new Response(response.body, {
    status: response.status,
    headers,
  });
}

async function handleUpload(request, env) {
  const { token, setCookie } = ensureSessionToken(request);
  const formData = await request.formData();
  const file = formData.get('image') || formData.get('file');

  if (!(file instanceof File)) {
    return jsonResponse({ error: 'Please choose an image file.' }, { status: 400 });
  }

  if (!file.type.startsWith('image/')) {
    return jsonResponse({ error: 'Only image files are allowed.' }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return jsonResponse({ error: 'Image is too large. Please keep it under 10 MB.' }, { status: 413 });
  }

  const id = crypto.randomUUID().replace(/-/g, '');
  const key = getUploadKey(id);
  const buffer = await file.arrayBuffer();

  await env.UPLOADS_BUCKET.put(key, buffer, {
    httpMetadata: {
      contentType: file.type,
      contentDisposition: `inline; filename="${sanitizeFileName(file.name)}"`,
    },
    customMetadata: {
      sessionToken: token,
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
    },
  });

  const origin = new URL(request.url).origin;
  const payload = {
    id,
    imageUrl: `${origin}${getUploadKey(id)}`,
    viewerUrl: `${origin}${getViewerPath(id)}`,
    deleteUrl: `${origin}/api/uploads/${id}/delete`,
  };

  const headers = setCookie
    ? {
        'Set-Cookie': setCookie,
      }
    : undefined;

  return jsonResponse(payload, { status: 201, headers });
}

async function handleRawImage(request, env, id) {
  const key = getUploadKey(id);
  const record = await env.UPLOADS_BUCKET.get(key);

  if (!record || !isAuthorizedUpload(request, record)) {
    return new Response('Not found', {
      status: 404,
      headers: noStoreHeaders(),
    });
  }

  const contentType = record.httpMetadata && record.httpMetadata.contentType
    ? record.httpMetadata.contentType
    : 'application/octet-stream';
  const originalName = record.customMetadata && record.customMetadata.originalName
    ? record.customMetadata.originalName
    : 'image.png';
  const headers = new Headers({
    'Content-Type': contentType,
    'Content-Disposition': `inline; filename="${sanitizeFileName(originalName)}"`,
    ...noStoreHeaders(),
  });

  return new Response(record.body, {
    status: 200,
    headers,
  });
}

async function handleChat(request, env) {
  if (!env.ANTHROPIC_API_KEY) {
    return jsonResponse({ error: 'ANTHROPIC_API_KEY secret not configured.' }, { status: 503 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) {
    return jsonResponse({ error: 'No messages provided.' }, { status: 400 });
  }

  // Trim to last 40 turns to keep context manageable
  const trimmed = messages.slice(-40);

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: STEPHEN_SYSTEM_PROMPT,
      messages: trimmed,
    }),
  });

  if (!anthropicRes.ok) {
    const err = await anthropicRes.json().catch(() => ({}));
    return jsonResponse({ error: err.error?.message || 'Upstream API error.' }, { status: 502 });
  }

  const data = await anthropicRes.json();
  const content = data.content?.[0]?.text ?? '';
  return jsonResponse({ content });
}

async function handleDelete(request, env, id) {
  const key = getUploadKey(id);
  const record = await env.UPLOADS_BUCKET.get(key);

  if (!record || !isAuthorizedUpload(request, record)) {
    return jsonResponse({ error: 'Not found' }, { status: 404 });
  }

  await env.UPLOADS_BUCKET.delete(key);
  return jsonResponse({ ok: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    if (pathname === '/upload' || pathname === '/upload/') {
      return handleUploadPage(request, env);
    }

    if (request.method === 'POST' && pathname === '/api/chat') {
      return handleChat(request, env);
    }

    if (request.method === 'POST' && pathname === '/api/uploads') {
      return handleUpload(request, env);
    }

    const deleteMatch = pathname.match(/^\/api\/uploads\/([^/]+)\/delete$/);
    if (deleteMatch && request.method === 'POST') {
      return handleDelete(request, env, deleteMatch[1]);
    }

    const uploadId = getUploadIdFromPath(pathname);
    if (uploadId && pathname.endsWith('/image.png') && request.method === 'GET') {
      return handleRawImage(request, env, uploadId);
    }

    if (uploadId && !pathname.endsWith('/image.png') && request.method === 'GET') {
      return serveAsset(env, request, '/upload/viewer.html', noStoreHeaders());
    }

    return env.ASSETS.fetch(request);
  },
};

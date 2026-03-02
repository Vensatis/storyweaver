/* ============================================
   STORYWEAVER — Application Logic v3
   Brainstorm panel · Context protection · Campaign summarize
   ============================================ */

const App = (() => {

  // ─── PROVIDER DEFINITIONS ─────────────────────────────────────────────────

  const PROVIDERS = {
    anthropic: {
      name: 'Anthropic (Claude)',
      keyPlaceholder: 'sk-ant-...',
      keyHint: 'Get your key at console.anthropic.com',
      baseUrl: 'https://api.anthropic.com/v1/messages',
      format: 'anthropic',
      models: [
        { id: 'claude-sonnet-4-20250514',  label: 'Claude Sonnet 4 — Recommended' },
        { id: 'claude-opus-4-20250514',    label: 'Claude Opus 4 — Most Capable' },
        { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 — Fastest / Cheapest' },
      ],
      contextLimits: [200000, 100000, 50000],
      defaultModel: 'claude-sonnet-4-20250514',
      defaultContext: 200000,
    },
    openai: {
      name: 'OpenAI (ChatGPT)',
      keyPlaceholder: 'sk-...',
      keyHint: 'Get your key at platform.openai.com',
      baseUrl: 'https://api.openai.com/v1/chat/completions',
      format: 'openai',
      models: [
        { id: 'gpt-4o',      label: 'GPT-4o — Recommended' },
        { id: 'gpt-4o-mini', label: 'GPT-4o Mini — Faster / Cheaper' },
        { id: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
        { id: 'o3-mini',     label: 'o3-mini — Reasoning model' },
      ],
      contextLimits: [128000, 64000, 32000],
      defaultModel: 'gpt-4o',
      defaultContext: 128000,
    },
    gemini: {
      name: 'Google (Gemini)',
      keyPlaceholder: 'AIza...',
      keyHint: 'Get your key at aistudio.google.com',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
      format: 'gemini',
      models: [
        { id: 'gemini-2.0-flash',      label: 'Gemini 2.0 Flash — Recommended' },
        { id: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite — Cheapest' },
        { id: 'gemini-1.5-pro',        label: 'Gemini 1.5 Pro — Largest context' },
      ],
      contextLimits: [1000000, 200000, 100000],
      defaultModel: 'gemini-2.0-flash',
      defaultContext: 1000000,
    },
    grok: {
      name: 'xAI (Grok)',
      keyPlaceholder: 'xai-...',
      keyHint: 'Get your key at console.x.ai',
      baseUrl: 'https://api.x.ai/v1/chat/completions',
      format: 'openai',
      models: [
        { id: 'grok-3',      label: 'Grok 3 — Most Capable' },
        { id: 'grok-3-mini', label: 'Grok 3 Mini — Faster' },
        { id: 'grok-2',      label: 'Grok 2' },
      ],
      contextLimits: [131072, 65536, 32768],
      defaultModel: 'grok-3',
      defaultContext: 131072,
    },
    venice: {
      name: 'Venice AI (Uncensored)',
      keyPlaceholder: 'your-venice-key',
      keyHint: 'Get your key at venice.ai — uncensored Llama & Mistral models',
      baseUrl: 'https://api.venice.ai/api/v1/chat/completions',
      format: 'openai',
      models: [
        { id: 'llama-3.3-70b',           label: 'Llama 3.3 70B — Recommended' },
        { id: 'llama-3.1-405b',          label: 'Llama 3.1 405B — Most Capable' },
        { id: 'mistral-31-24b',          label: 'Mistral 3.1 24B — Fast' },
        { id: 'dolphin-2.9.2-qwen2-72b', label: 'Dolphin Qwen2 72B — Uncensored' },
      ],
      contextLimits: [128000, 64000, 32000],
      defaultModel: 'llama-3.3-70b',
      defaultContext: 128000,
    },
    mistral: {
      name: 'Mistral AI',
      keyPlaceholder: 'your-mistral-key',
      keyHint: 'Get your key at console.mistral.ai',
      baseUrl: 'https://api.mistral.ai/v1/chat/completions',
      format: 'openai',
      models: [
        { id: 'mistral-large-latest', label: 'Mistral Large — Most Capable' },
        { id: 'mistral-small-latest', label: 'Mistral Small — Fast / Cheap' },
        { id: 'open-mistral-nemo',    label: 'Mistral Nemo — Open' },
      ],
      contextLimits: [128000, 64000, 32000],
      defaultModel: 'mistral-large-latest',
      defaultContext: 128000,
    },
    groq: {
      name: 'Groq (Free Tier Available)',
      keyPlaceholder: 'gsk_...',
      keyHint: 'Get your free key at console.groq.com — no payment required to start',
      baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
      format: 'openai',
      models: [
        { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B — Recommended' },
        { id: 'llama-3.1-8b-instant',    label: 'Llama 3.1 8B — Fastest (free tier friendly)' },
        { id: 'mixtral-8x7b-32768',      label: 'Mixtral 8x7B — Long context' },
        { id: 'gemma2-9b-it',            label: 'Gemma 2 9B — Google open model' },
      ],
      contextLimits: [128000, 32768, 8192],
      defaultModel: 'llama-3.3-70b-versatile',
      defaultContext: 128000,
    },
    custom: {
      name: 'Custom / Ollama (Local)',
      keyPlaceholder: 'optional — leave blank for local Ollama',
      keyHint: 'For Ollama set endpoint to http://localhost:11434/v1/chat/completions',
      baseUrl: '',
      format: 'openai',
      models: [{ id: 'custom', label: 'Enter model name in field below' }],
      contextLimits: [128000, 64000, 32000],
      defaultModel: 'custom',
      defaultContext: 32000,
    },
  };

  // ─── STATE ────────────────────────────────────────────────────────────────

  const STATE_KEY = 'sw_state_v3';
  const KEYS_KEY  = 'sw_apikeys_v2';
  const BS_KEY    = 'sw_brainstorm_v1';

  let state = {
    provider: 'anthropic',
    apiKeys: {},
    model: 'claude-sonnet-4-20250514',
    bsModel: '',               // Brainstorm model — empty = same as story model
    customEndpoint: '',
    customModelName: '',
    contextLimit: 200000,
    campaignName: 'My Campaign',
    world: { name:'', overview:'', geography:'', rules:'', tone:'', lore:'' },
    narrator: { voice:'second', style:'literary', pacing:'balanced', risk:'high', content:'general', custom:'', pcName:'', pcDesc:'' },
    characters: [],
    worldEvents: [],
    storyEvents: [],
    messages: [],
    displayMessages: [],
    turnCount: 0,
    totalTokensUsed: 0,
    lastInputTokens: 0,
    lastOutputTokens: 0,
    editingCharId: null,
    pendingEventType: null,
    oocMode: false,
    brainstormOpen: false,
  };

  // Brainstorm has its own persistent transcript separate from story
  let bsMessages    = [];   // API history for brainstorm session
  let bsTranscript  = [];   // Display transcript (persisted)

  // ─── INIT ─────────────────────────────────────────────────────────────────

  function init() {
    loadState();
    const hasKey = Object.values(state.apiKeys).some(k => k && k.length > 0);
    if (hasKey) { showMain(); } else { showSetup(); }
    bindWorldWordCount();
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) state = { ...state, ...JSON.parse(raw) };
      const keys = localStorage.getItem(KEYS_KEY);
      if (keys) state.apiKeys = { ...state.apiKeys, ...JSON.parse(keys) };
      const bs = localStorage.getItem(BS_KEY);
      if (bs) bsTranscript = JSON.parse(bs);
    } catch(e) { console.warn('State load error', e); }
  }

  function saveState() {
    try {
      const toSave = { ...state }; delete toSave.apiKeys;
      localStorage.setItem(STATE_KEY, JSON.stringify(toSave));
      localStorage.setItem(KEYS_KEY, JSON.stringify(state.apiKeys));
    } catch(e) { console.warn('State save error', e); }
  }

  function saveBsTranscript() {
    try { localStorage.setItem(BS_KEY, JSON.stringify(bsTranscript)); }
    catch(e) { console.warn('BS save error', e); }
  }

  // ─── SCREENS ──────────────────────────────────────────────────────────────

  function showSetup() {
    renderSetupProviderSelect();
    document.getElementById('setup-screen').classList.add('active');
    document.getElementById('main-screen').classList.remove('active');
  }

  function showMain() {
    document.getElementById('setup-screen').classList.remove('active');
    document.getElementById('main-screen').classList.add('active');
    renderAll();
    if (state.brainstormOpen) openBrainstormPanel();
  }

  function renderSetupProviderSelect() {
    const sel = document.getElementById('setup-provider-select');
    if (!sel) return;
    sel.innerHTML = Object.entries(PROVIDERS).map(([k,p]) =>
      `<option value="${k}"${k===state.provider?' selected':''}>${p.name}</option>`
    ).join('');
    updateSetupForProvider();
  }

  function updateSetupForProvider() {
    const provId = document.getElementById('setup-provider-select').value;
    const prov   = PROVIDERS[provId];
    state.provider = provId;
    document.getElementById('setup-key-input').placeholder = prov.keyPlaceholder;
    document.getElementById('setup-key-input').value       = state.apiKeys[provId] || '';
    document.getElementById('setup-key-hint').textContent  = prov.keyHint;
    const customRow = document.getElementById('setup-custom-row');
    if (customRow) customRow.style.display = provId === 'custom' ? 'flex' : 'none';
  }

  function saveKey() {
    const provId = document.getElementById('setup-provider-select').value;
    const key    = document.getElementById('setup-key-input').value.trim();
    if (!key && provId !== 'custom') { alert('Please enter your API key.'); return; }
    if (provId === 'custom') {
      const ep = document.getElementById('setup-custom-endpoint')?.value.trim();
      if (!ep) { alert('Please enter your endpoint URL.'); return; }
      state.customEndpoint  = ep;
      state.customModelName = document.getElementById('setup-custom-model')?.value.trim() || 'llama3';
      state.model = state.customModelName;
    }
    state.provider = provId;
    if (key) state.apiKeys[provId] = key;
    const prov = PROVIDERS[provId];
    state.model        = prov.defaultModel;
    state.contextLimit = prov.defaultContext;
    if (provId === 'custom') state.model = state.customModelName;
    saveState();
    showMain();
  }

  function showDemo() {
    state.apiKeys['anthropic'] = 'DEMO';
    state.provider = 'anthropic';
    showMain();
  }

  // ─── TABS ─────────────────────────────────────────────────────────────────

  function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.tab-content').forEach(c =>
      c.classList.toggle('active', c.id === `tab-${tab}`));
  }

  // ─── SYSTEM PROMPT ────────────────────────────────────────────────────────

  function buildSystemPrompt() {
    const n = state.narrator, w = state.world;
    const voiceMap = { second:'second person ("you")', third:'third person ("she/he/they")', first:'first person ("I")' };
    const styleGuide = {
      literary: 'Rich, layered, evocative prose. Dwell in sensory detail and subtext.',
      terse:    'Sharp and spare. Short sentences. Kinetic energy. No waste.',
      pulp:     'Fast-paced, visceral, plot-driven. Keep the reader turning pages.',
      lyrical:  'Poetic and sensory. Prioritize emotional and atmospheric resonance.',
      grounded: 'Realistic and observational. Character interiority over spectacle.'
    };
    const riskGuide = {
      high:   'Embrace dramatic risk. Let consequences be real. Allow NPCs to act against the player when their motivations demand it. Introduce complications, reversals, surprises.',
      medium: 'Balance tension with resolution. Allow meaningful conflict but ensure narrative momentum.',
      low:    'Prefer resolution. Guide the story toward satisfying outcomes while maintaining stakes.'
    };
    const active   = state.characters.filter(c => c.presence === 'active');
    const nearby   = state.characters.filter(c => c.presence === 'nearby');
    const offstage = state.characters.filter(c => c.presence === 'offstage');
    let chars = '';
    if (active.length) {
      chars += '\n\n## CHARACTERS IN THIS SCENE\n';
      active.forEach(c => {
        chars += `\n### ${c.name}${c.archetype?` — ${c.archetype}`:''}\n`;
        if (c.voice)         chars += `Voice: ${c.voice}\n`;
        if (c.motivation)    chars += `Motivation: ${c.motivation}\n`;
        if (c.wound)         chars += `Core wound/secret: ${c.wound}\n`;
        if (c.state)         chars += `Current state: ${c.state}\n`;
        if (c.disposition)   chars += `Disposition toward player: ${c.disposition}\n`;
        if (c.agenda)        chars += `Active agenda: ${c.agenda}\n`;
        if (c.relationships) chars += `Relationships: ${c.relationships}\n`;
      });
    }
    if (nearby.length) {
      chars += '\n## CHARACTERS NEARBY\n';
      nearby.forEach(c => chars += `- ${c.name}: ${c.archetype||''} | ${c.state||'—'}\n`);
    }
    if (offstage.length) {
      chars += '\n## KNOWN CHARACTERS (offstage)\n';
      offstage.forEach(c => chars += `- ${c.name}${c.archetype?` (${c.archetype})`:''}\n`);
    }
    let world = '';
    if (w.name || w.overview) {
      world = '\n\n## WORLD\n';
      if (w.name)     world += `Setting: ${w.name}\n`;
      if (w.overview) world += `\n${w.overview}\n`;
      if (w.tone)     world += `\nAtmosphere: ${w.tone}\n`;
      if (w.rules)    world += `\nRules/Systems: ${w.rules}\n`;
    }
    let pc = '';
    if (n.pcName || n.pcDesc) {
      pc = '\n\n## PLAYER CHARACTER\n';
      if (n.pcName) pc += `Name: ${n.pcName}\n`;
      if (n.pcDesc) pc += `${n.pcDesc}\n`;
    }
    let events = '';
    const wEvts = state.worldEvents.filter(e => e.sig === 'major').slice(0,5);
    const sEvts = state.storyEvents.slice(-8);
    if (wEvts.length || sEvts.length) {
      events = '\n\n## STORY CONTEXT\n';
      wEvts.forEach(e => events += `- [World] ${e.title}: ${e.desc}\n`);
      sEvts.forEach(e => events += `- [Story] ${e.title}: ${e.desc}\n`);
    }
    return `You are a narrative AI running a collaborative choose-your-own-adventure roleplay. You are the narrator and author — never break character to speak as an AI.

## NARRATIVE DIRECTIVES
- Write in ${voiceMap[n.voice]||'second person'}.
- Style: ${styleGuide[n.style]||styleGuide.literary}
- Pacing: ${n.pacing==='slow'?'Deliberate — dwell in moments':n.pacing==='fast'?'Urgent — lean and kinetic':'Balanced'}.
- Risk: ${riskGuide[n.risk]||riskGuide.high}
- ${n.content==='explicit'?'Explicit content is permitted.':n.content==='mature'?'Mature themes permitted. Suggest rather than depict explicit content.':'Keep content suitable for general audiences.'}

## ANTI-DRIFT RULES (critical)
- NEVER use the word "apparently" — it signals context degradation. Write confidently from established facts.
- Maintain each character's defined voice exactly. Characters must never drift toward a generic helpful tone.
- Never contradict established story facts.
- NPCs pursue their own agendas. They are not here to serve the player.
- End responses with an open story moment — not a question to the player.
- When unsure what a character would do, consult their motivation and core wound first.
${n.custom?`\n## ADDITIONAL NARRATOR NOTES\n${n.custom}`:''}
${world}${pc}${chars}${events}`;
  }

  function buildBrainstormSystemPrompt() {
    const w = state.world;
    const n = state.narrator;
    const active   = state.characters.filter(c => c.presence === 'active');
    const nearby   = state.characters.filter(c => c.presence === 'nearby');
    const offstage = state.characters.filter(c => c.presence === 'offstage');
    const deceased = state.characters.filter(c => c.presence === 'deceased');

    let allChars = '\n\n## ALL CHARACTERS\n';
    [...active, ...nearby, ...offstage].forEach(c => {
      allChars += `\n### ${c.name} [${c.presence}]${c.archetype?` — ${c.archetype}`:''}\n`;
      if (c.motivation)    allChars += `Motivation: ${c.motivation}\n`;
      if (c.wound)         allChars += `Wound/secret: ${c.wound}\n`;
      if (c.relationships) allChars += `Relationships: ${c.relationships}\n`;
      if (c.backstory)     allChars += `Background: ${c.backstory}\n`;
    });
    if (deceased.length) allChars += `\nDeceased: ${deceased.map(c=>c.name).join(', ')}\n`;

    let world = '';
    if (w.name || w.overview) {
      world = '\n\n## WORLD\n';
      if (w.name)      world += `Setting: ${w.name}\n`;
      if (w.overview)  world += `\n${w.overview}\n`;
      if (w.geography) world += `\nGeography/Factions: ${w.geography}\n`;
      if (w.rules)     world += `\nRules: ${w.rules}\n`;
      if (w.tone)      world += `\nAtmosphere: ${w.tone}\n`;
      if (w.lore)      world += `\nLore: ${w.lore}\n`;
    }

    let recentStory = '';
    if (state.storyEvents.length) {
      recentStory = '\n\n## RECENT STORY EVENTS\n';
      state.storyEvents.slice(-10).forEach(e => recentStory += `- ${e.title}: ${e.desc}\n`);
    }

    let pc = '';
    if (n.pcName || n.pcDesc) {
      pc = '\n\n## PLAYER CHARACTER\n';
      if (n.pcName) pc += `Name: ${n.pcName}\n`;
      if (n.pcDesc) pc += `${n.pcDesc}\n`;
    }

    return `You are a collaborative fiction partner for a choose-your-own-adventure story. You have full knowledge of this story's world, characters, and events. Speak as a thoughtful, engaged co-author and creative collaborator.

Your role here is NOT to narrate the story — that happens in the main story window. Here you are the author's partner: help brainstorm plot directions, discuss characters, explore consequences of decisions, think through world-building questions, suggest dramatic possibilities, or simply answer questions about what has been established. Be direct, conversational, and creatively engaged. You may speculate freely about where the story could go.

When discussing characters, speak about them with the depth you know — their motivations, wounds, and how they might really behave. When discussing plot, think dramatically: what would create the most interesting tension, the most meaningful consequences, the most surprising but inevitable turns?

Never use the word "apparently."
${world}${pc}${allChars}${recentStory}`;
  }

  function estimateTokens(text) { return Math.ceil((text||'').length / 4); }

  function getTotalContextTokens() {
    const sys  = estimateTokens(buildSystemPrompt());
    const hist = state.messages.reduce((s,m) => {
      const c = typeof m.content==='string' ? m.content : JSON.stringify(m.content);
      return s + estimateTokens(c);
    }, 0);
    return sys + hist;
  }

  // ─── CONTEXT COMPRESSION ──────────────────────────────────────────────────

  async function compressHistoryIfNeeded() {
    if (getTotalContextTokens() < state.contextLimit * 0.65) return;
    if (state.messages.length < 10) return;
    await runCompression(0.5, 'auto');
  }

  async function runCompression(fraction, trigger) {
    const cutoff     = Math.floor(state.messages.length * fraction);
    const toCompress = state.messages.slice(0, cutoff);
    const toKeep     = state.messages.slice(cutoff);
    const prompt = `Summarize this story conversation into a compact narrative summary (under 400 words). Preserve: key events and outcomes, character relationship changes, important decisions and consequences, new world facts established, emotional arc. Be factual. Never use the word "apparently".

CONVERSATION:
${toCompress.map(m=>`${m.role.toUpperCase()}: ${typeof m.content==='string'?m.content:m.content[0]?.text||''}`).join('\n\n')}`;
    try {
      const result = await callAPI(
        [{role:'user', content:prompt}],
        'You are a story summarizer. Be factual and concise.',
        600
      );
      if (result?.text) {
        state.messages = [
          {role:'user',      content:`[STORY SUMMARY — prior events]: ${result.text}`},
          {role:'assistant', content:'Understood. I have the full prior story context.'},
          ...toKeep
        ];
        if (trigger === 'auto') {
          autoLogEvent('Context compressed — summary checkpoint', result.text.substring(0,200));
        }
        saveState();
        return result.text;
      }
    } catch(e) { console.warn('Compression failed:', e); }
    return null;
  }

  // ─── CAMPAIGN SUMMARIZE ────────────────────────────────────────────────────

  async function summarizeCampaign() {
    if (!state.messages.length) { showToast('No story to summarize yet.'); return; }
    if (!confirm('Compress the entire story history into a chapter summary? The full conversation will be replaced with a compact record. This saves context space and is recommended at the end of a major arc. Continue?')) return;

    showToast('Summarizing campaign...');
    const sendBtn = document.getElementById('send-btn');
    if (sendBtn) sendBtn.disabled = true;

    const allMessages = state.messages;
    const prompt = `Write a rich narrative chapter summary (300-500 words) of this story so far. Write it as a chapter recap — readable prose, past tense, capturing: the key events in order, character relationships and how they changed, major decisions made and their consequences, world facts established, and where the story currently stands. This summary will replace the full conversation history, so it must be complete enough to orient the narrator for the next chapter. Never use the word "apparently".

FULL STORY:
${allMessages.map(m=>`${m.role.toUpperCase()}: ${typeof m.content==='string'?m.content:m.content[0]?.text||''}`).join('\n\n')}`;

    try {
      const result = await callAPI(
        [{role:'user', content:prompt}],
        'You are a story archivist. Write clear, complete, narrative chapter summaries.',
        800
      );
      if (result?.text) {
        // Replace all story messages with the summary
        state.messages = [
          {role:'user',      content:`[CHAPTER SUMMARY — story so far]: ${result.text}`},
          {role:'assistant', content:'Understood. I have the full chapter context and am ready to continue the story.'},
        ];
        // Log to story events
        state.storyEvents.push({
          id: `evt_${Date.now()}`,
          title: `Chapter Summary — Turn ${state.turnCount}`,
          desc: result.text.substring(0, 500),
          sig: 'major',
          created: new Date().toISOString(),
          auto: true,
          isSummary: true,
        });
        saveState();
        renderEvents();
        updateGauges();
        showToast('Campaign summarized — context freed');
        // Show summary in an alert so user can see what was captured
        setTimeout(() => {
          if (confirm('Summary created and saved to Events. Context has been freed.\n\nView the summary now?')) {
            switchTab('events');
          }
        }, 300);
      }
    } catch(e) {
      showToast('Summarize failed: ' + e.message);
    }
    if (sendBtn) sendBtn.disabled = false;
  }

  // ─── API CALL — MULTI-PROVIDER ────────────────────────────────────────────

  async function callAPI(messages, systemPrompt, maxTokens=1000, overrideModel=null) {
    const provId = state.provider;
    const apiKey = state.apiKeys[provId] || '';
    if (apiKey === 'DEMO') {
      return { text:'[Demo mode — enter a real API key in Settings to enable AI responses.]\n\nYou stand at the threshold of your story. The world waits, patient and full of shadow.', inputTokens:0, outputTokens:0 };
    }
    const prov    = PROVIDERS[provId];
    const sys     = systemPrompt || buildSystemPrompt();
    const modelId = overrideModel || (provId==='custom' ? state.customModelName : state.model);

    // ── Anthropic ──
    if (prov?.format === 'anthropic') {
      const res = await fetch(prov.baseUrl, {
        method:'POST',
        headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
        body:JSON.stringify({model:modelId, max_tokens:maxTokens, system:sys, messages})
      });
      if (!res.ok) { const e=await res.json().catch(()=>({})); throw new Error(e.error?.message||`API error ${res.status}`); }
      const d = await res.json();
      return { text:d.content?.map(c=>c.text||'').join('')||'', inputTokens:d.usage?.input_tokens||0, outputTokens:d.usage?.output_tokens||0 };
    }

    // ── Gemini ──
    if (prov?.format === 'gemini') {
      const url = `${prov.baseUrl}/${modelId}:generateContent?key=${apiKey}`;
      const contents = messages.map(m => ({
        role: m.role==='assistant'?'model':'user',
        parts:[{text: typeof m.content==='string'?m.content:m.content[0]?.text||''}]
      }));
      const res = await fetch(url, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({system_instruction:{parts:[{text:sys}]}, contents, generationConfig:{maxOutputTokens:maxTokens}})
      });
      if (!res.ok) { const e=await res.json().catch(()=>({})); throw new Error(e.error?.message||`Gemini error ${res.status}`); }
      const d = await res.json();
      return { text:d.candidates?.[0]?.content?.parts?.[0]?.text||'', inputTokens:d.usageMetadata?.promptTokenCount||0, outputTokens:d.usageMetadata?.candidatesTokenCount||0 };
    }

    // ── OpenAI-compatible ──
    const baseUrl = provId==='custom' ? state.customEndpoint : prov.baseUrl;
    const headers = {'Content-Type':'application/json'};
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
    const res = await fetch(baseUrl, {
      method:'POST', headers,
      body:JSON.stringify({model:modelId, max_tokens:maxTokens, messages:[{role:'system',content:sys},...messages]})
    });
    if (!res.ok) { const e=await res.json().catch(()=>({})); throw new Error(e.error?.message||`API error ${res.status}`); }
    const d = await res.json();
    return { text:d.choices?.[0]?.message?.content||'', inputTokens:d.usage?.prompt_tokens||0, outputTokens:d.usage?.completion_tokens||0 };
  }

  // ─── ERROR HANDLING ───────────────────────────────────────────────────────

  function friendlyError(msg) {
    if (msg.includes('quota') || msg.includes('rate') || msg.includes('limit') || msg.includes('429')) {
      if (state.provider === 'gemini') {
        return `[Gemini free tier quota exceeded. The free quota is very limited for longer sessions.\n\nSwitch to Groq — it's free with no payment required and handles long stories well. Go to Settings → Provider → Groq, get a free key at console.groq.com, and you'll be back in the story in minutes.]`;
      }
      return `[Rate limit reached. You've hit your provider's usage limit. Wait a moment and try again, or switch providers in Settings.]`;
    }
    if (msg.includes('context') || msg.includes('token') || msg.includes('length') || msg.includes('413')) {
      return `[Context window full. Try: (1) go to the Events tab and use "Summarize Campaign" to compress story history, (2) move characters to Offstage in the Characters tab, or (3) shorten your World Overview. This frees up context space.]`;
    }
    if (msg.includes('401') || msg.includes('auth') || msg.includes('key') || msg.includes('credential')) {
      return `[API key error — your key may be invalid or expired. Go to Settings and re-enter your key.]`;
    }
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('Failed') || msg.includes('NetworkError')) {
      return `[Connection error — unable to reach the AI provider. Check your internet connection and try again.]`;
    }
    return `[Error: ${msg}]`;
  }

  // ─── OOC DIRECTION MODE ───────────────────────────────────────────────────

  function toggleOOC() {
    state.oocMode = !state.oocMode;
    const btn   = document.getElementById('ooc-toggle');
    const wrap  = document.getElementById('input-wrap');
    const input = document.getElementById('player-input');
    const hint  = document.getElementById('input-hint');
    btn.classList.toggle('active', state.oocMode);
    wrap.classList.toggle('ooc-mode', state.oocMode);
    if (state.oocMode) {
      input.placeholder = 'Story direction — guide what happens next, adjust tone, introduce a detail...';
      hint.textContent  = 'Direction mode — AI will incorporate this as author guidance then continue the story';
    } else {
      input.placeholder = 'What do you do, say, or observe...';
      hint.textContent  = 'Shift+Enter for new line · Enter to send';
    }
  }

  // ─── SEND STORY MESSAGE ───────────────────────────────────────────────────

  async function sendMessage() {
    const input   = document.getElementById('player-input');
    const text    = input.value.trim();
    if (!text) return;
    input.value   = '';
    const isOOC   = state.oocMode;
    const sendBtn = document.getElementById('send-btn');
    sendBtn.disabled = true;
    state.turnCount++;
    addDisplayMessage(isOOC ? 'ooc' : 'player', text);
    document.getElementById('turn-count').textContent = `Turn ${state.turnCount}`;
    const apiContent = isOOC
      ? `[OUT OF CHARACTER — Author direction]: ${text}\n[Acknowledge this direction briefly then continue the story incorporating it naturally.]`
      : text;
    state.messages.push({role:'user', content:apiContent});
    const typingEl = showTyping();
    try {
      await compressHistoryIfNeeded();
      const result = await callAPI(state.messages);
      typingEl.remove();
      state.messages.push({role:'assistant', content:result.text});
      addDisplayMessage('narrator', result.text);
      state.totalTokensUsed += (result.inputTokens + result.outputTokens);
      state.lastInputTokens  = result.inputTokens;
      state.lastOutputTokens = result.outputTokens;
      updateGauges();
      autoDetectEvents(text, result.text);
      saveState();
    } catch(e) {
      typingEl.remove();
      showContextWarning(e.message);
      addDisplayMessage('narrator', friendlyError(e.message));
      state.messages.pop();
    }
    sendBtn.disabled = false;
    scrollToBottom();
  }

  function showContextWarning(msg) {
    if (!msg.includes('context') && !msg.includes('token') && !msg.includes('length') && !msg.includes('413')) return;
    const existing = document.querySelector('.context-warning');
    if (existing) existing.remove();
    const banner = document.createElement('div');
    banner.className = 'context-warning';
    banner.innerHTML = '<strong>⚠ Context Window Full</strong>Go to the <strong>Events tab</strong> and tap "Summarize Campaign" to compress your story history and free up space. You can also move characters to Offstage or shorten your World Overview.';
    const wrap = document.querySelector('.story-wrap');
    if (wrap) wrap.insertBefore(banner, wrap.lastElementChild);
    setTimeout(() => banner.remove(), 15000);
  }

  function handleInputKey(e) {
    if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  // ─── EDIT MESSAGES ────────────────────────────────────────────────────────

  function editBlock(index) {
    const blocks    = document.querySelectorAll('.story-block');
    const block     = blocks[index];
    if (!block) return;
    const contentEl = block.querySelector('.block-content');
    let editArea    = block.querySelector('.block-edit-area');
    if (editArea) { editArea.remove(); contentEl.style.display = ''; return; }

    editArea = document.createElement('div');
    editArea.className = 'block-edit-area open';
    const ta = document.createElement('textarea');
    ta.value = state.displayMessages[index]?.content || contentEl.textContent;
    editArea.appendChild(ta);

    const actions = document.createElement('div');
    actions.className = 'block-edit-actions';
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn-small'; saveBtn.textContent = 'Save';
    saveBtn.onclick = () => saveEdit(index, ta.value, block, editArea, contentEl);
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-ghost-small'; cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = () => { editArea.remove(); contentEl.style.display = ''; };

    const role = state.displayMessages[index]?.role;
    if ((role==='player'||role==='ooc') && state.displayMessages[index+1]?.role==='narrator') {
      const regenBtn = document.createElement('button');
      regenBtn.className = 'btn-small'; regenBtn.textContent = 'Save & Regenerate';
      regenBtn.style.background = 'var(--accent-dim)';
      regenBtn.onclick = () => saveEditAndRegenerate(index, ta.value, block, editArea, contentEl);
      actions.appendChild(saveBtn); actions.appendChild(regenBtn); actions.appendChild(cancelBtn);
    } else {
      actions.appendChild(saveBtn); actions.appendChild(cancelBtn);
    }
    editArea.appendChild(actions);
    contentEl.style.display = 'none';
    block.appendChild(editArea);
    ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
  }

  function saveEdit(index, newText, block, editArea, contentEl) {
    if (!newText.trim()) return;
    contentEl.textContent = newText; contentEl.style.display = ''; editArea.remove();
    if (state.displayMessages[index]) state.displayMessages[index].content = newText;
    const role    = state.displayMessages[index]?.role;
    const apiRole = role==='narrator' ? 'assistant' : 'user';
    updateApiMessage(index, newText, apiRole);
    saveState(); showToast('Edit saved');
  }

  async function saveEditAndRegenerate(index, newText, block, editArea, contentEl) {
    saveEdit(index, newText, block, editArea, contentEl);
    state.displayMessages = state.displayMessages.slice(0, index + 1);
    const apiIdx = findApiIndex(index);
    if (apiIdx !== -1) state.messages = state.messages.slice(0, apiIdx + 1);
    const allBlocks = document.querySelectorAll('.story-block');
    for (let i = allBlocks.length - 1; i > index; i--) allBlocks[i].remove();
    showToast('Regenerating...');
    const sendBtn = document.getElementById('send-btn');
    sendBtn.disabled = true;
    const typingEl = showTyping();
    try {
      await compressHistoryIfNeeded();
      const result = await callAPI(state.messages);
      typingEl.remove();
      state.messages.push({role:'assistant', content:result.text});
      addDisplayMessage('narrator', result.text);
      state.totalTokensUsed += (result.inputTokens + result.outputTokens);
      updateGauges(); saveState();
    } catch(e) {
      typingEl.remove();
      addDisplayMessage('narrator', friendlyError(e.message));
    }
    sendBtn.disabled = false;
  }

  function updateApiMessage(displayIndex, newText, apiRole) {
    let roleCount = 0;
    for (let i = 0; i < displayIndex; i++) {
      const r = state.displayMessages[i]?.role;
      if ((r==='narrator'?'assistant':'user') === apiRole) roleCount++;
    }
    let found = 0;
    for (let i = 0; i < state.messages.length; i++) {
      if (state.messages[i].role === apiRole) {
        if (found === roleCount) { state.messages[i].content = newText; return; }
        found++;
      }
    }
  }

  function findApiIndex(displayIndex) {
    const role    = state.displayMessages[displayIndex]?.role;
    const apiRole = role==='narrator' ? 'assistant' : 'user';
    let roleCount = 0;
    for (let i = 0; i < displayIndex; i++) {
      const r = state.displayMessages[i]?.role;
      if ((r==='narrator'?'assistant':'user') === apiRole) roleCount++;
    }
    let found = 0;
    for (let i = 0; i < state.messages.length; i++) {
      if (state.messages[i].role === apiRole) {
        if (found === roleCount) return i;
        found++;
      }
    }
    return -1;
  }

  // ─── BRAINSTORM PANEL ─────────────────────────────────────────────────────

  function toggleBrainstorm() {
    if (state.brainstormOpen) {
      closeBrainstormPanel();
    } else {
      openBrainstormPanel();
    }
  }

  function openBrainstormPanel() {
    state.brainstormOpen = true;
    document.getElementById('brainstorm-panel').classList.add('open');
    document.getElementById('brainstorm-header-btn').classList.add('active');
    populateBsModelSelect();
    renderBsTranscript();
    saveState();
    // Focus input after animation
    setTimeout(() => {
      const inp = document.getElementById('bs-input');
      if (inp) inp.focus();
    }, 320);
  }

  function closeBrainstormPanel() {
    state.brainstormOpen = false;
    document.getElementById('brainstorm-panel').classList.remove('open');
    document.getElementById('brainstorm-header-btn').classList.remove('active');
    saveState();
  }

  function populateBsModelSelect() {
    const sel  = document.getElementById('bs-model-select');
    if (!sel) return;
    const prov = PROVIDERS[state.provider];
    if (!prov) return;
    const currentBsModel = state.bsModel || state.model;
    sel.innerHTML = prov.models.map(m =>
      `<option value="${m.id}"${m.id===currentBsModel?' selected':''}>${m.label.split(' — ')[0]}</option>`
    ).join('');
    sel.value = currentBsModel;
  }

  function saveBsModel() {
    const sel = document.getElementById('bs-model-select');
    if (sel) { state.bsModel = sel.value; saveState(); }
  }

  function renderBsTranscript() {
    const output = document.getElementById('bs-output');
    if (!output) return;
    if (!bsTranscript.length) {
      output.innerHTML = `<div class="bs-welcome"><div class="bs-welcome-icon">⚡</div><p>Chat freely with your narrator as a collaborator. Bounce plot ideas, ask about characters, discuss what happens next. Nothing here affects the story unless you pin it.</p></div>`;
      return;
    }
    output.innerHTML = '';
    bsTranscript.forEach((msg, i) => renderBsMessage(msg.role, msg.content, i, false));
    bsScrollToBottom();
  }

  function renderBsMessage(role, content, index, scroll=true) {
    const output = document.getElementById('bs-output');
    if (!output) return;
    const welcome = output.querySelector('.bs-welcome');
    if (welcome) welcome.remove();

    const block = document.createElement('div');
    block.className = `bs-block ${role}`;
    const meta = document.createElement('div');
    meta.className = 'bs-meta';
    meta.innerHTML = `<span>${role==='user'?'You':'Narrator (Brainstorm)'}</span>${role==='assistant'?`<button class="bs-pin-btn" onclick="App.pinToStory(${index})">📌 pin to story</button>`:''}`;
    const contentEl = document.createElement('div');
    contentEl.className = 'bs-content';
    contentEl.textContent = content;
    block.appendChild(meta);
    block.appendChild(contentEl);
    output.appendChild(block);
    if (scroll) bsScrollToBottom();
  }

  function bsScrollToBottom() {
    const o = document.getElementById('bs-output');
    if (o) o.scrollTop = o.scrollHeight;
  }

  async function sendBrainstorm() {
    const input   = document.getElementById('bs-input');
    const text    = input.value.trim();
    if (!text) return;
    input.value   = '';
    const sendBtn = document.getElementById('bs-send-btn');
    sendBtn.disabled = true;

    // Add to transcript and display
    bsTranscript.push({role:'user', content:text});
    bsMessages.push({role:'user', content:text});
    renderBsMessage('user', text, bsTranscript.length - 1);

    // Typing indicator in brainstorm panel
    const output = document.getElementById('bs-output');
    const typingEl = document.createElement('div');
    typingEl.className = 'typing-indicator';
    typingEl.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    output.appendChild(typingEl);
    bsScrollToBottom();

    try {
      const bsModelOverride = state.bsModel || state.model;
      const result = await callAPI(
        bsMessages,
        buildBrainstormSystemPrompt(),
        1200,
        bsModelOverride
      );
      typingEl.remove();
      bsMessages.push({role:'assistant', content:result.text});
      bsTranscript.push({role:'assistant', content:result.text});
      renderBsMessage('assistant', result.text, bsTranscript.length - 1);
      saveBsTranscript();
    } catch(e) {
      typingEl.remove();
      const errMsg = `[Error: ${e.message}]`;
      bsTranscript.push({role:'assistant', content:errMsg});
      renderBsMessage('assistant', errMsg, bsTranscript.length - 1);
    }
    sendBtn.disabled = false;
  }

  function handleBsKey(e) {
    if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendBrainstorm(); }
  }

  function clearBrainstorm() {
    if (!confirm('Clear the Brainstorm transcript? This cannot be undone.')) return;
    bsTranscript = []; bsMessages = [];
    localStorage.removeItem(BS_KEY);
    renderBsTranscript();
    showToast('Brainstorm transcript cleared');
  }

  function pinToStory(transcriptIndex) {
    const msg = bsTranscript[transcriptIndex];
    if (!msg || msg.role !== 'assistant') return;
    // Pin as a World Note in story events
    state.storyEvents.push({
      id:      `evt_${Date.now()}`,
      title:   `📌 Brainstorm Note — Turn ${state.turnCount}`,
      desc:    msg.content.substring(0, 400),
      sig:     'worldnote',
      created: new Date().toISOString(),
      pinned:  true,
    });
    saveState();
    renderEvents();
    showToast('Pinned to Story Events');
    // Mark the pin button as pinned
    const bsBlocks = document.querySelectorAll('.bs-block.assistant');
    let assistantCount = 0;
    document.querySelectorAll('.bs-block').forEach(b => {
      if (b.classList.contains('assistant')) {
        if (bsTranscript.filter((m,i)=>i<=transcriptIndex&&m.role==='assistant').length - 1 === assistantCount) {
          const pinBtn = b.querySelector('.bs-pin-btn');
          if (pinBtn) { pinBtn.textContent = '📌 pinned'; pinBtn.classList.add('pinned'); }
        }
        assistantCount++;
      }
    });
    // Simpler: just re-render
    renderBsTranscript();
    // Re-mark pinned items
    markPinnedItems();
  }

  function markPinnedItems() {
    const pinnedDescs = state.storyEvents.filter(e=>e.pinned).map(e=>e.desc.substring(0,50));
    document.querySelectorAll('.bs-block.assistant').forEach((b, i) => {
      const assistantMsgs = bsTranscript.filter(m=>m.role==='assistant');
      const msg = assistantMsgs[i];
      if (!msg) return;
      const isPinned = pinnedDescs.some(d => msg.content.startsWith(d));
      const pinBtn = b.querySelector('.bs-pin-btn');
      if (pinBtn && isPinned) { pinBtn.textContent = '📌 pinned'; pinBtn.classList.add('pinned'); }
    });
  }

  // ─── DISPLAY ──────────────────────────────────────────────────────────────

  function addDisplayMessage(role, content) {
    state.displayMessages.push({role, content, turn:state.turnCount});
    renderDisplayMessage(role, content);
    scrollToBottom();
  }

  function renderDisplayMessage(role, content) {
    const output  = document.getElementById('story-output');
    const welcome = output.querySelector('.story-welcome');
    if (welcome) welcome.remove();
    const index    = output.querySelectorAll('.story-block').length;
    const block    = document.createElement('div');
    block.className = `story-block ${role}`;
    const meta     = document.createElement('div');
    meta.className  = 'block-meta';
    const label = role==='narrator' ? 'Narrator' : role==='ooc' ? '✦ Direction' : (state.narrator.pcName||'You');
    meta.innerHTML = `<span>${esc(label)}</span><button class="block-edit-btn" onclick="App.editBlock(${index})">edit</button>`;
    const contentEl  = document.createElement('div');
    contentEl.className = 'block-content';
    contentEl.textContent = content;
    block.appendChild(meta); block.appendChild(contentEl);
    output.appendChild(block);
  }

  function showTyping() {
    const output = document.getElementById('story-output');
    const el = document.createElement('div'); el.className = 'typing-indicator';
    el.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    output.appendChild(el); scrollToBottom(); return el;
  }

  function scrollToBottom() {
    const o = document.getElementById('story-output'); if (o) o.scrollTop = o.scrollHeight;
  }

  function updateGauges() {
    const tPct = Math.min((state.totalTokensUsed/500000)*100,100);
    const tBar = document.getElementById('token-bar');
    if (tBar) { tBar.style.width=`${tPct}%`; tBar.classList.toggle('warn',tPct>80); }
    const tv = state.totalTokensUsed;
    const tVal = document.getElementById('token-val');
    if (tVal) tVal.textContent = tv>1000?`${(tv/1000).toFixed(1)}k`:tv;
    const cPct = Math.min((getTotalContextTokens()/state.contextLimit)*100,100);
    const cBar = document.getElementById('context-bar');
    if (cBar) { cBar.style.width=`${cPct}%`; cBar.classList.toggle('warn',cPct>80); }
    const cVal = document.getElementById('context-val');
    if (cVal) cVal.textContent = `${Math.round(cPct)}%`;
  }

  function renderSceneChips() {
    const container = document.getElementById('scene-chips');
    if (!container) return;
    container.innerHTML = '';
    state.characters.filter(c=>c.presence==='active').forEach(c => {
      const chip = document.createElement('div'); chip.className='scene-chip';
      const dot  = document.createElement('div');
      const d = c.disposition||'neutral';
      dot.className=`chip-dot ${d==='hostile'?'hostile':(d==='trusting'||d==='friendly')?'':'neutral'}`;
      const label = document.createElement('span'); label.textContent=c.name;
      chip.appendChild(dot); chip.appendChild(label); container.appendChild(chip);
    });
  }

  function renderAll() {
    renderCharRoster(); renderWorldForm(); renderNarratorForm();
    renderEvents(); renderSceneChips(); updateGauges();
    if (state.displayMessages.length > 0) {
      const output = document.getElementById('story-output');
      const welcome = output.querySelector('.story-welcome');
      if (welcome) welcome.remove();
      state.displayMessages.forEach(m => renderDisplayMessage(m.role, m.content));
      document.getElementById('turn-count').textContent = `Turn ${state.turnCount}`;
      scrollToBottom();
    }
  }

  // ─── CHARACTERS ───────────────────────────────────────────────────────────

  function addCharacter() {
    state.editingCharId = null; clearCharModal();
    document.getElementById('modal-title').textContent = 'Add Character';
    openModal('char-modal');
  }

  function editCharacter(id) {
    const c = state.characters.find(c=>c.id===id); if (!c) return;
    state.editingCharId = id;
    document.getElementById('modal-title').textContent = 'Edit Character';
    document.getElementById('char-name').value          = c.name||'';
    document.getElementById('char-archetype').value     = c.archetype||'';
    document.getElementById('char-voice').value         = c.voice||'';
    document.getElementById('char-motivation').value    = c.motivation||'';
    document.getElementById('char-wound').value         = c.wound||'';
    document.getElementById('char-disposition').value   = c.disposition||'neutral';
    document.getElementById('char-state').value         = c.state||'';
    document.getElementById('char-agenda').value        = c.agenda||'';
    document.getElementById('char-presence').value      = c.presence||'offstage';
    document.getElementById('char-canon').value         = c.canon||'';
    document.getElementById('char-backstory').value     = c.backstory||'';
    document.getElementById('char-relationships').value = c.relationships||'';
    openModal('char-modal');
  }

  function saveCharacter() {
    const name = document.getElementById('char-name').value.trim();
    if (!name) { alert('Character needs a name.'); return; }
    if (!state.editingCharId && state.characters.length >= 24) { alert('Maximum 24 named characters.'); return; }
    const char = {
      id:            state.editingCharId||`char_${Date.now()}`,
      name,
      archetype:     document.getElementById('char-archetype').value.trim(),
      voice:         document.getElementById('char-voice').value.trim(),
      motivation:    document.getElementById('char-motivation').value.trim(),
      wound:         document.getElementById('char-wound').value.trim(),
      disposition:   document.getElementById('char-disposition').value,
      state:         document.getElementById('char-state').value.trim(),
      agenda:        document.getElementById('char-agenda').value.trim(),
      presence:      document.getElementById('char-presence').value,
      canon:         document.getElementById('char-canon').value.trim(),
      backstory:     document.getElementById('char-backstory').value.trim(),
      relationships: document.getElementById('char-relationships').value.trim(),
    };
    if (state.editingCharId) {
      const idx = state.characters.findIndex(c=>c.id===state.editingCharId);
      if (idx!==-1) state.characters[idx]=char;
    } else { state.characters.push(char); }
    saveState(); renderCharRoster(); renderSceneChips(); updateGauges(); closeCharModal();
  }

  function deleteCharacter(id) {
    if (!confirm('Remove this character?')) return;
    state.characters = state.characters.filter(c=>c.id!==id);
    saveState(); renderCharRoster(); renderSceneChips();
  }

  function renderCharRoster() {
    const roster = document.getElementById('char-roster');
    if (!roster) return;
    if (!state.characters.length) {
      roster.innerHTML='<div class="empty-state"><p>No characters yet.</p><p class="empty-sub">Add NPCs to populate your world. Up to 24 named characters supported.</p></div>'; return;
    }
    const order={active:0,nearby:1,offstage:2,deceased:3};
    const sorted=[...state.characters].sort((a,b)=>(order[a.presence]||2)-(order[b.presence]||2));
    roster.innerHTML=sorted.map(c=>`
      <div class="char-card">
        <div class="char-presence-dot presence-${c.presence||'offstage'}"></div>
        <div class="char-card-main">
          <div class="char-card-name">${esc(c.name)}</div>
          <div class="char-card-sub">${esc(c.archetype||'No archetype set')}${c.voice?' · '+esc(c.voice.substring(0,50)):''}</div>
          <div class="char-card-tags">
            <span class="char-tag tag-disposition-${c.disposition||'neutral'}">${c.disposition||'neutral'}</span>
            ${c.canon?`<span class="char-tag" style="background:rgba(76,122,201,0.15);color:var(--blue)">Canon: ${esc(c.canon)}</span>`:''}
            <span class="char-tag" style="background:var(--surface2);color:var(--text-muted)">${c.presence||'offstage'}</span>
          </div>
        </div>
        <div class="char-card-actions">
          <button class="char-act-btn" onclick="App.editCharacter('${c.id}')">Edit</button>
          <button class="char-act-btn danger" onclick="App.deleteCharacter('${c.id}')">✕</button>
        </div>
      </div>`).join('');
  }

  function clearCharModal() {
    ['char-name','char-archetype','char-voice','char-motivation','char-wound','char-state','char-agenda','char-canon','char-backstory','char-relationships']
      .forEach(id=>{ document.getElementById(id).value=''; });
    document.getElementById('char-disposition').value='neutral';
    document.getElementById('char-presence').value='offstage';
  }

  // ─── WORLD ────────────────────────────────────────────────────────────────

  function renderWorldForm() {
    document.getElementById('world-name').value     = state.world.name||'';
    document.getElementById('world-overview').value = state.world.overview||'';
    document.getElementById('world-geo').value      = state.world.geography||'';
    document.getElementById('world-rules').value    = state.world.rules||'';
    document.getElementById('world-tone').value     = state.world.tone||'';
    document.getElementById('world-lore').value     = state.world.lore||'';
    updateWorldWordCount();
  }

  function saveWorld() {
    state.world = {
      name:      document.getElementById('world-name').value.trim(),
      overview:  document.getElementById('world-overview').value.trim(),
      geography: document.getElementById('world-geo').value.trim(),
      rules:     document.getElementById('world-rules').value.trim(),
      tone:      document.getElementById('world-tone').value.trim(),
      lore:      document.getElementById('world-lore').value.trim(),
    };
    saveState(); updateGauges(); showToast('World saved');
  }

  function bindWorldWordCount() {
    const el = document.getElementById('world-overview');
    if (el) el.addEventListener('input', updateWorldWordCount);
  }

  function updateWorldWordCount() {
    const el=document.getElementById('world-overview'), count=document.getElementById('world-overview-count');
    if (!el||!count) return;
    const words = el.value.trim()?el.value.trim().split(/\s+/).length:0;
    count.textContent=`${words} / 300 words recommended`;
    count.style.color=words>300?'var(--red)':'var(--text-muted)';
  }

  // ─── NARRATOR ─────────────────────────────────────────────────────────────

  function renderNarratorForm() {
    const n=state.narrator;
    document.getElementById('narrator-voice').value   = n.voice||'second';
    document.getElementById('narrator-style').value   = n.style||'literary';
    document.getElementById('narrator-pacing').value  = n.pacing||'balanced';
    document.getElementById('narrator-risk').value    = n.risk||'high';
    document.getElementById('narrator-content').value = n.content||'general';
    document.getElementById('narrator-custom').value  = n.custom||'';
    document.getElementById('pc-name').value          = n.pcName||'';
    document.getElementById('pc-desc').value          = n.pcDesc||'';
  }

  function saveNarrator() {
    state.narrator = {
      voice:   document.getElementById('narrator-voice').value,
      style:   document.getElementById('narrator-style').value,
      pacing:  document.getElementById('narrator-pacing').value,
      risk:    document.getElementById('narrator-risk').value,
      content: document.getElementById('narrator-content').value,
      custom:  document.getElementById('narrator-custom').value.trim(),
      pcName:  document.getElementById('pc-name').value.trim(),
      pcDesc:  document.getElementById('pc-desc').value.trim(),
    };
    saveState(); showToast('Narrator settings saved');
  }

  // ─── EVENTS ───────────────────────────────────────────────────────────────

  function addEvent(type) {
    state.pendingEventType = type||'world';
    document.getElementById('event-modal-title').textContent = state.pendingEventType==='world'?'Add World Event':'Add Story Event';
    document.getElementById('event-title').value=''; document.getElementById('event-desc').value=''; document.getElementById('event-sig').value='significant';
    openModal('event-modal');
  }

  function saveEvent() {
    const title=document.getElementById('event-title').value.trim();
    if (!title) { alert('Event needs a title.'); return; }
    const event={id:`evt_${Date.now()}`,title,desc:document.getElementById('event-desc').value.trim(),sig:document.getElementById('event-sig').value,created:new Date().toISOString()};
    if (state.pendingEventType==='world') state.worldEvents.push(event); else state.storyEvents.push(event);
    saveState(); renderEvents(); closeEventModal();
  }

  function autoLogEvent(title,desc) {
    state.storyEvents.push({id:`evt_${Date.now()}`,title,desc:(desc||'').substring(0,300),sig:'minor',created:new Date().toISOString(),auto:true});
    renderEvents();
  }

  function autoDetectEvents(playerText,narratorText) {
    const combined=(playerText+' '+narratorText).toLowerCase();
    const kw=['died','killed','betrayed','revealed','discovered','escaped','captured','sworn','promised','arrived','destroyed','found'];
    if (kw.filter(w=>combined.includes(w)).length>=2)
      autoLogEvent(`Turn ${state.turnCount} — notable moment`, narratorText.substring(0,150).replace(/\n/g,' '));
  }

  function renderEvents() {
    renderEventList('world-events-list', state.worldEvents,'world');
    renderEventList('story-events-list', state.storyEvents,'story');
  }

  function renderEventList(containerId,events,type) {
    const el=document.getElementById(containerId); if (!el) return;
    if (!events.length) {
      el.innerHTML=type==='world'
        ?'<div class="empty-state"><p>No world events yet.</p><p class="empty-sub">Add events that exist before play begins.</p></div>'
        :'<div class="empty-state"><p>No story events yet.</p><p class="empty-sub">Significant moments are logged here automatically.</p></div>';
      return;
    }
    el.innerHTML=[...events].reverse().slice(0,20).map(e=>`
      <div class="event-card event-sig-${e.sig}">
        <div class="event-card-title">${esc(e.title)}</div>
        ${e.desc?`<div class="event-card-desc">${esc(e.desc)}</div>`:''}
      </div>`).join('');
  }

  // ─── SETTINGS ─────────────────────────────────────────────────────────────

  function showSettings() {
    const provSel = document.getElementById('settings-provider');
    provSel.innerHTML = Object.entries(PROVIDERS).map(([k,p])=>`<option value="${k}"${k===state.provider?' selected':''}>${p.name}</option>`).join('');
    provSel.value = state.provider;
    updateSettingsForProvider();
    document.getElementById('settings-campaign').value = state.campaignName;
    openModal('settings-modal');
  }

  function updateSettingsForProvider() {
    const provId=document.getElementById('settings-provider').value;
    const prov=PROVIDERS[provId];
    document.getElementById('settings-api-key').placeholder = prov.keyPlaceholder;
    document.getElementById('settings-api-key').value       = state.apiKeys[provId]||'';
    document.getElementById('settings-key-hint').textContent= prov.keyHint;
    const modelSel=document.getElementById('settings-model');
    modelSel.innerHTML=prov.models.map(m=>`<option value="${m.id}">${m.label}</option>`).join('');
    modelSel.value=(provId===state.provider)?state.model:prov.defaultModel;
    const ctxSel=document.getElementById('settings-context');
    ctxSel.innerHTML=prov.contextLimits.map(l=>`<option value="${l}"${l===state.contextLimit?' selected':''}>${(l/1000).toFixed(0)}k tokens</option>`).join('');
    const customRow=document.getElementById('settings-custom-row');
    if (customRow) {
      customRow.style.display=provId==='custom'?'block':'none';
      if (provId==='custom') {
        document.getElementById('settings-custom-endpoint').value=state.customEndpoint||'';
        document.getElementById('settings-custom-model').value   =state.customModelName||'';
      }
    }
  }

  function saveSettings() {
    const provId=document.getElementById('settings-provider').value;
    const key   =document.getElementById('settings-api-key').value.trim();
    state.provider=provId;
    if (key) state.apiKeys[provId]=key;
    state.model       =document.getElementById('settings-model').value;
    state.contextLimit=parseInt(document.getElementById('settings-context').value);
    state.campaignName=document.getElementById('settings-campaign').value.trim();
    if (provId==='custom') {
      state.customEndpoint  =document.getElementById('settings-custom-endpoint').value.trim();
      state.customModelName =document.getElementById('settings-custom-model').value.trim();
      state.model=state.customModelName;
    }
    // Reset brainstorm model if provider changed
    state.bsModel = '';
    saveState(); updateGauges(); closeSettingsModal();
    if (state.brainstormOpen) populateBsModelSelect();
    showToast(`Saved — using ${PROVIDERS[provId]?.name||provId}`);
  }

  function clearKey() {
    if (!confirm('Clear all API keys?')) return;
    state.apiKeys={}; localStorage.removeItem(KEYS_KEY); closeSettingsModal(); showSetup();
  }

  function newCampaign() {
    if (!confirm('Start a new campaign? Story and events will be cleared. Characters and world are kept.')) return;
    state.messages=[]; state.displayMessages=[]; state.turnCount=0; state.totalTokensUsed=0; state.storyEvents=[];
    saveState();
    const output = document.getElementById('story-output');
    output.innerHTML=`<div class="story-welcome"><div class="welcome-glyph">⟁</div><h2>New campaign begun.</h2><p>Your world and characters are ready. Where does the story start?</p></div>`;
    document.getElementById('turn-count').textContent='Turn 0';
    updateGauges(); renderEvents(); switchTab('play');
  }

  function resetCampaign() {
    if (!confirm('Reset EVERYTHING? All story data, characters, world, and events will be cleared.')) return;
    localStorage.removeItem(STATE_KEY); location.reload();
  }

  // ─── MODALS ───────────────────────────────────────────────────────────────

  function openModal(id) { document.getElementById(id).classList.add('open'); }
  function closeModal(e) { if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('open'); }
  function closeCharModal()     { document.getElementById('char-modal').classList.remove('open'); }
  function closeEventModal()    { document.getElementById('event-modal').classList.remove('open'); }
  function closeSettingsModal() { document.getElementById('settings-modal').classList.remove('open'); }

  // ─── UTILITIES ────────────────────────────────────────────────────────────

  function esc(str) { return (str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function showToast(msg) {
    const old=document.getElementById('sw-toast'); if (old) old.remove();
    const t=document.createElement('div'); t.id='sw-toast'; t.textContent=msg;
    t.style.cssText=`position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--surface2);color:var(--text);border:1px solid var(--border-bright);padding:.5rem 1.25rem;border-radius:20px;font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;z-index:9999;animation:fade-in .2s ease;font-family:var(--font-ui);white-space:nowrap;`;
    document.body.appendChild(t); setTimeout(()=>t.remove(),2500);
  }

  // ─── PUBLIC ───────────────────────────────────────────────────────────────

  return {
    init, saveKey, showDemo, switchTab,
    sendMessage, handleInputKey, toggleOOC, editBlock,
    toggleBrainstorm, sendBrainstorm, handleBsKey, clearBrainstorm, pinToStory, saveBsModel,
    summarizeCampaign,
    addCharacter, editCharacter, saveCharacter, deleteCharacter,
    saveWorld, saveNarrator,
    addEvent, saveEvent, renderEvents,
    showSettings, saveSettings, clearKey,
    newCampaign, resetCampaign,
    closeModal, closeCharModal, closeEventModal, closeSettingsModal,
    updateSetupForProvider, updateSettingsForProvider,
  };

})();

document.addEventListener('DOMContentLoaded', App.init);


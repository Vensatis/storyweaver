/* ============================================
   STORYWEAVER — Application Logic v4
   Multi-campaign · Switcher · Export · Brainstorm
   ============================================ */

const App = (() => {

  // ─── PROVIDERS ────────────────────────────────────────────────────────────

  const PROVIDERS = {
    anthropic: { name:'Anthropic (Claude)', keyPlaceholder:'sk-ant-...', keyHint:'Get your key at console.anthropic.com', baseUrl:'https://api.anthropic.com/v1/messages', format:'anthropic', models:[{id:'claude-sonnet-4-20250514',label:'Claude Sonnet 4 — Recommended'},{id:'claude-opus-4-20250514',label:'Claude Opus 4 — Most Capable'},{id:'claude-haiku-4-5-20251001',label:'Claude Haiku 4.5 — Fastest'}], contextLimits:[200000,100000,50000], defaultModel:'claude-sonnet-4-20250514', defaultContext:200000 },
    openai:    { name:'OpenAI (ChatGPT)',    keyPlaceholder:'sk-...',      keyHint:'Get your key at platform.openai.com',    baseUrl:'https://api.openai.com/v1/chat/completions',         format:'openai',    models:[{id:'gpt-4o',label:'GPT-4o — Recommended'},{id:'gpt-4o-mini',label:'GPT-4o Mini — Cheaper'},{id:'gpt-4-turbo',label:'GPT-4 Turbo'},{id:'o3-mini',label:'o3-mini'}], contextLimits:[128000,64000,32000], defaultModel:'gpt-4o', defaultContext:128000 },
    gemini:    { name:'Google (Gemini)',     keyPlaceholder:'AIza...',     keyHint:'Get your key at aistudio.google.com',    baseUrl:'https://generativelanguage.googleapis.com/v1beta/models', format:'gemini', models:[{id:'gemini-2.0-flash',label:'Gemini 2.0 Flash — Recommended'},{id:'gemini-2.0-flash-lite',label:'Gemini 2.0 Flash Lite'},{id:'gemini-1.5-pro',label:'Gemini 1.5 Pro — 1M context'}], contextLimits:[1000000,200000,100000], defaultModel:'gemini-2.0-flash', defaultContext:1000000 },
    grok:      { name:'xAI (Grok)',          keyPlaceholder:'xai-...',     keyHint:'Get your key at console.x.ai',           baseUrl:'https://api.x.ai/v1/chat/completions',               format:'openai',    models:[{id:'grok-3',label:'Grok 3 — Most Capable'},{id:'grok-3-mini',label:'Grok 3 Mini'},{id:'grok-2',label:'Grok 2'}], contextLimits:[131072,65536,32768], defaultModel:'grok-3', defaultContext:131072 },
    venice:    { name:'Venice AI (Uncensored)', keyPlaceholder:'your-venice-key', keyHint:'Get your key at venice.ai', baseUrl:'https://api.venice.ai/api/v1/chat/completions', format:'openai', models:[{id:'llama-3.3-70b',label:'Llama 3.3 70B — Recommended'},{id:'llama-3.1-405b',label:'Llama 3.1 405B'},{id:'mistral-31-24b',label:'Mistral 3.1 24B'},{id:'dolphin-2.9.2-qwen2-72b',label:'Dolphin Qwen2 72B'}], contextLimits:[128000,64000,32000], defaultModel:'llama-3.3-70b', defaultContext:128000 },
    mistral:   { name:'Mistral AI',          keyPlaceholder:'your-mistral-key', keyHint:'Get your key at console.mistral.ai', baseUrl:'https://api.mistral.ai/v1/chat/completions',      format:'openai',    models:[{id:'mistral-large-latest',label:'Mistral Large'},{id:'mistral-small-latest',label:'Mistral Small'},{id:'open-mistral-nemo',label:'Mistral Nemo'}], contextLimits:[128000,64000,32000], defaultModel:'mistral-large-latest', defaultContext:128000 },
    groq:      { name:'Groq (Free Tier Available)', keyPlaceholder:'gsk_...', keyHint:'Get your free key at console.groq.com — no payment required', baseUrl:'https://api.groq.com/openai/v1/chat/completions', format:'openai', models:[{id:'llama-3.3-70b-versatile',label:'Llama 3.3 70B — Recommended'},{id:'llama-3.1-8b-instant',label:'Llama 3.1 8B — Fastest'},{id:'mixtral-8x7b-32768',label:'Mixtral 8x7B'},{id:'gemma2-9b-it',label:'Gemma 2 9B'}], contextLimits:[128000,32768,8192], defaultModel:'llama-3.3-70b-versatile', defaultContext:128000 },
    custom:    { name:'Custom / Ollama (Local)', keyPlaceholder:'optional', keyHint:'For Ollama: http://localhost:11434/v1/chat/completions', baseUrl:'', format:'openai', models:[{id:'custom',label:'Enter model name below'}], contextLimits:[128000,64000,32000], defaultModel:'custom', defaultContext:32000 },
  };

  // ─── STORAGE KEYS ─────────────────────────────────────────────────────────

  const INDEX_KEY  = 'sw_campaigns_v4';   // Campaign index (metadata list)
  const KEYS_KEY   = 'sw_apikeys_v2';     // API keys (shared across campaigns)
  const GLOBAL_KEY = 'sw_global_v4';      // Global prefs (provider, model, etc)
  const BS_KEY     = 'sw_brainstorm_v1';  // Brainstorm transcript

  // ─── CAMPAIGN DATA SHAPE ──────────────────────────────────────────────────

  function freshCampaign(name) {
    return {
      id:           `camp_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
      name:         name || 'New Campaign',
      created:      new Date().toISOString(),
      lastPlayed:   new Date().toISOString(),
      world:        { name:'', overview:'', geography:'', rules:'', tone:'', lore:'' },
      narrator:     { voice:'second', style:'literary', pacing:'balanced', risk:'high', content:'general', custom:'', pcName:'', pcDesc:'' },
      characters:   [],
      worldEvents:  [],
      storyEvents:  [],
      messages:     [],
      displayMessages: [],
      turnCount:    0,
      totalTokensUsed: 0,
      lastInputTokens: 0,
      lastOutputTokens: 0,
    };
  }

  // ─── GLOBAL STATE (provider / model — shared across campaigns) ─────────────

  let global = {
    provider: 'anthropic',
    apiKeys:  {},
    model:    'claude-sonnet-4-20250514',
    bsModel:  '',
    customEndpoint:  '',
    customModelName: '',
    contextLimit:    200000,
    campaignPanelOpen:  false,
    brainstormOpen: false,
    activeCampaignId: null,
  };

  // ─── ACTIVE CAMPAIGN (currently loaded) ───────────────────────────────────

  let campaign = freshCampaign('My First Campaign');

  // ─── CAMPAIGN INDEX (metadata list, small) ────────────────────────────────

  let campaignIndex = [];   // [ { id, name, worldName, lastPlayed, turnCount } ]

  // ─── BRAINSTORM (own state) ───────────────────────────────────────────────

  let bsMessages   = [];
  let bsTranscript = [];

  // ─── TRANSIENT UI STATE ───────────────────────────────────────────────────

  let editingCharId     = null;
  let pendingEventType  = null;
  let oocMode           = false;
  let duplicateSrcId    = null;

  // ═══════════════════════════════════════════════════════════════════════════
  // INIT & PERSISTENCE
  // ═══════════════════════════════════════════════════════════════════════════

  function init() {
    loadGlobal();
    loadCampaignIndex();
    loadBsTranscript();

    // Load active campaign or create first one
    if (global.activeCampaignId) {
      const loaded = loadCampaignById(global.activeCampaignId);
      if (!loaded) createFirstCampaign();
    } else if (campaignIndex.length > 0) {
      const loaded = loadCampaignById(campaignIndex[0].id);
      if (!loaded) createFirstCampaign();
    } else {
      createFirstCampaign();
    }

    const hasKey = Object.values(global.apiKeys).some(k => k && k.length > 0);
    if (hasKey) { showMain(); } else { showSetup(); }
    bindWorldWordCount();
  }

  function createFirstCampaign() {
    campaign = freshCampaign('My First Campaign');
    saveCampaign(campaign);
    updateCampaignIndex(campaign);
    global.activeCampaignId = campaign.id;
    saveGlobal();
  }

  // ── Load / save global prefs ──

  function loadGlobal() {
    try {
      const raw  = localStorage.getItem(GLOBAL_KEY);
      if (raw) global = { ...global, ...JSON.parse(raw) };
      const keys = localStorage.getItem(KEYS_KEY);
      if (keys) global.apiKeys = { ...global.apiKeys, ...JSON.parse(keys) };
    } catch(e) { console.warn('Global load error', e); }
  }

  function saveGlobal() {
    try {
      const toSave = { ...global }; delete toSave.apiKeys;
      localStorage.setItem(GLOBAL_KEY, JSON.stringify(toSave));
      localStorage.setItem(KEYS_KEY,   JSON.stringify(global.apiKeys));
    } catch(e) { console.warn('Global save error', e); }
  }

  // ── Load / save campaign index ──

  function loadCampaignIndex() {
    try {
      const raw = localStorage.getItem(INDEX_KEY);
      if (raw) campaignIndex = JSON.parse(raw);
    } catch(e) { campaignIndex = []; }
  }

  function saveCampaignIndex() {
    try { localStorage.setItem(INDEX_KEY, JSON.stringify(campaignIndex)); }
    catch(e) { console.warn('Index save error', e); }
  }

  function updateCampaignIndex(camp) {
    const entry = {
      id:         camp.id,
      name:       camp.name,
      worldName:  camp.world?.name || '',
      lastPlayed: camp.lastPlayed || new Date().toISOString(),
      turnCount:  camp.turnCount || 0,
    };
    const idx = campaignIndex.findIndex(c => c.id === camp.id);
    if (idx !== -1) campaignIndex[idx] = entry;
    else campaignIndex.unshift(entry);
    saveCampaignIndex();
  }

  // ── Load / save individual campaign ──

  function campaignKey(id) { return `sw_camp_${id}`; }

  function saveCampaign(camp) {
    try {
      camp.lastPlayed = new Date().toISOString();
      localStorage.setItem(campaignKey(camp.id), JSON.stringify(camp));
      updateCampaignIndex(camp);
    } catch(e) {
      if (e.name === 'QuotaExceededError') {
        showToast('Storage full — summarize or delete old campaigns');
      }
      console.warn('Campaign save error', e);
    }
  }

  function loadCampaignById(id) {
    try {
      const raw = localStorage.getItem(campaignKey(id));
      if (!raw) return false;
      campaign = JSON.parse(raw);
      global.activeCampaignId = id;
      return true;
    } catch(e) { return false; }
  }

  function deleteCampaignById(id) {
    localStorage.removeItem(campaignKey(id));
    campaignIndex = campaignIndex.filter(c => c.id !== id);
    saveCampaignIndex();
  }

  // ── Brainstorm persistence ──

  function loadBsTranscript() {
    try { const raw = localStorage.getItem(BS_KEY); if (raw) bsTranscript = JSON.parse(raw); }
    catch(e) { bsTranscript = []; }
  }

  function saveBsTranscript() {
    try { localStorage.setItem(BS_KEY, JSON.stringify(bsTranscript)); }
    catch(e) { console.warn('BS save error', e); }
  }

  // ── Storage gauge ──

  function getStorageUsed() {
    let bytes = 0;
    for (let k in localStorage) {
      if (!localStorage.hasOwnProperty(k)) continue;
      bytes += (localStorage[k].length + k.length) * 2;
    }
    return bytes;
  }

  function updateStorageGauge() {
    const used    = getStorageUsed();
    const limit   = 8 * 1024 * 1024; // 8MB conservative estimate
    const pct     = Math.min((used / limit) * 100, 100);
    const bar     = document.getElementById('storage-bar');
    const val     = document.getElementById('storage-val');
    const info    = document.getElementById('cp-storage-info');
    const kb      = (used / 1024).toFixed(0);
    const mb      = (used / (1024*1024)).toFixed(1);
    const display = used > 1024*1024 ? `${mb}MB` : `${kb}KB`;
    if (bar) { bar.style.width=`${pct}%`; bar.classList.toggle('warn', pct>80); }
    if (val) val.textContent = `${Math.round(pct)}%`;
    if (info) info.textContent = `${display} used`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREENS
  // ═══════════════════════════════════════════════════════════════════════════

  function showSetup() {
    renderSetupProviderSelect();
    document.getElementById('setup-screen').classList.add('active');
    document.getElementById('main-screen').classList.remove('active');
  }

  function showMain() {
    document.getElementById('setup-screen').classList.remove('active');
    document.getElementById('main-screen').classList.add('active');
    renderAll();
    renderCampaignPanel();
    if (global.campaignPanelOpen) openCampaignPanel();
    if (global.brainstormOpen)    openBrainstormPanel();
    updateStorageGauge();
  }

  function renderSetupProviderSelect() {
    const sel = document.getElementById('setup-provider-select');
    if (!sel) return;
    sel.innerHTML = Object.entries(PROVIDERS).map(([k,p]) =>
      `<option value="${k}"${k===global.provider?' selected':''}>${p.name}</option>`).join('');
    updateSetupForProvider();
  }

  function updateSetupForProvider() {
    const provId = document.getElementById('setup-provider-select').value;
    const prov   = PROVIDERS[provId];
    global.provider = provId;
    document.getElementById('setup-key-input').placeholder = prov.keyPlaceholder;
    document.getElementById('setup-key-input').value       = global.apiKeys[provId] || '';
    document.getElementById('setup-key-hint').textContent  = prov.keyHint;
    const row = document.getElementById('setup-custom-row');
    if (row) row.style.display = provId === 'custom' ? 'flex' : 'none';
  }

  function saveKey() {
    const provId = document.getElementById('setup-provider-select').value;
    const key    = document.getElementById('setup-key-input').value.trim();
    if (!key && provId !== 'custom') { alert('Please enter your API key.'); return; }
    if (provId === 'custom') {
      const ep = document.getElementById('setup-custom-endpoint')?.value.trim();
      if (!ep) { alert('Please enter your endpoint URL.'); return; }
      global.customEndpoint  = ep;
      global.customModelName = document.getElementById('setup-custom-model')?.value.trim() || 'llama3';
      global.model = global.customModelName;
    }
    global.provider = provId;
    if (key) global.apiKeys[provId] = key;
    const prov = PROVIDERS[provId];
    if (provId !== 'custom') { global.model = prov.defaultModel; global.contextLimit = prov.defaultContext; }
    saveGlobal();
    showMain();
  }

  function showDemo() {
    global.apiKeys['anthropic'] = 'DEMO';
    global.provider = 'anthropic';
    showMain();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CAMPAIGN PANEL
  // ═══════════════════════════════════════════════════════════════════════════

  function toggleCampaignPanel() {
    global.campaignPanelOpen ? closeCampaignPanel() : openCampaignPanel();
  }

  function openCampaignPanel() {
    global.campaignPanelOpen = true;
    document.getElementById('campaign-panel').classList.add('open');
    document.getElementById('campaigns-header-btn').classList.add('active-panel');
    renderCampaignPanel();
    saveGlobal();
  }

  function closeCampaignPanel() {
    global.campaignPanelOpen = false;
    document.getElementById('campaign-panel').classList.remove('open');
    document.getElementById('campaigns-header-btn').classList.remove('active-panel');
    saveGlobal();
  }

  function renderCampaignPanel() {
    const list = document.getElementById('cp-list');
    if (!list) return;
    updateStorageGauge();
    if (!campaignIndex.length) {
      list.innerHTML = '<div class="empty-state"><p>No campaigns yet.</p></div>';
      return;
    }
    list.innerHTML = campaignIndex.map(c => {
      const isActive = c.id === global.activeCampaignId;
      const date     = new Date(c.lastPlayed).toLocaleDateString('en-US', {month:'short', day:'numeric'});
      return `
        <div class="cp-card${isActive?' active-campaign':''}" onclick="App.switchCampaign('${c.id}')">
          <div class="cp-card-name">${esc(c.name)}</div>
          ${c.worldName ? `<div class="cp-card-world">◉ ${esc(c.worldName)}</div>` : ''}
          <div class="cp-card-meta">
            <span>Turn ${c.turnCount}</span>
            <span>${date}</span>
          </div>
          <div class="cp-card-actions" onclick="event.stopPropagation()">
            <button class="cp-act-btn" onclick="App.openDuplicateModal('${c.id}')">Duplicate</button>
            ${!isActive ? `<button class="cp-act-btn danger" onclick="App.deleteCampaign('${c.id}')">Delete</button>` : ''}
          </div>
        </div>`;
    }).join('');
  }

  function switchCampaign(id) {
    if (id === global.activeCampaignId) { closeCampaignPanel(); return; }
    // Save current campaign first
    saveCampaign(campaign);
    // Load new one
    const loaded = loadCampaignById(id);
    if (!loaded) { showToast('Could not load campaign'); return; }
    global.activeCampaignId = id;
    saveGlobal();
    // Re-render everything
    renderAll();
    renderCampaignPanel();
    switchTab('play');
    closeCampaignPanel();
    showToast(`Switched to: ${campaign.name}`);
  }

  function newCampaign() {
    const name = prompt('Campaign name:', 'New Campaign');
    if (!name) return;
    saveCampaign(campaign); // save current
    campaign = freshCampaign(name.trim());
    saveCampaign(campaign);
    global.activeCampaignId = campaign.id;
    saveGlobal();
    renderAll();
    renderCampaignPanel();
    switchTab('play');
    closeCampaignPanel();
    showToast(`Created: ${campaign.name}`);
  }

  function deleteCampaign(id) {
    const entry = campaignIndex.find(c => c.id === id);
    if (!entry) return;
    if (!confirm(`Delete "${entry.name}"? This cannot be undone.`)) return;
    deleteCampaignById(id);
    renderCampaignPanel();
    updateStorageGauge();
    showToast('Campaign deleted');
  }

  // ─── DUPLICATE ────────────────────────────────────────────────────────────

  function openDuplicateModal(id) {
    duplicateSrcId = id;
    const entry = campaignIndex.find(c => c.id === id);
    document.getElementById('duplicate-name').value = entry ? `${entry.name} (copy)` : 'Campaign Copy';
    document.getElementById('dup-world').checked        = true;
    document.getElementById('dup-characters').checked   = true;
    document.getElementById('dup-world-events').checked = true;
    document.getElementById('dup-narrator').checked     = true;
    document.getElementById('dup-history').checked      = false;
    openModal('duplicate-modal');
  }

  function closeDuplicateModal() { document.getElementById('duplicate-modal').classList.remove('open'); }

  function confirmDuplicate() {
    if (!duplicateSrcId) return;
    const name = document.getElementById('duplicate-name').value.trim();
    if (!name) { alert('Please enter a name.'); return; }

    // Load source campaign data
    let src;
    if (duplicateSrcId === global.activeCampaignId) {
      src = campaign;
    } else {
      try { src = JSON.parse(localStorage.getItem(campaignKey(duplicateSrcId)) || 'null'); }
      catch(e) { src = null; }
    }
    if (!src) { showToast('Could not load source campaign'); return; }

    const keepWorld       = document.getElementById('dup-world').checked;
    const keepChars       = document.getElementById('dup-characters').checked;
    const keepWorldEvents = document.getElementById('dup-world-events').checked;
    const keepNarrator    = document.getElementById('dup-narrator').checked;
    const keepHistory     = document.getElementById('dup-history').checked;

    const newCamp = freshCampaign(name);
    if (keepWorld)       newCamp.world       = JSON.parse(JSON.stringify(src.world));
    if (keepNarrator)    newCamp.narrator    = JSON.parse(JSON.stringify(src.narrator));
    if (keepWorldEvents) newCamp.worldEvents = JSON.parse(JSON.stringify(src.worldEvents));
    if (keepChars) {
      // Copy characters but reset all to offstage
      newCamp.characters = JSON.parse(JSON.stringify(src.characters)).map(c => ({
        ...c,
        id: `char_${Date.now()}_${Math.random().toString(36).slice(2,5)}`,
        presence: 'offstage',
        state: '',
        agenda: '',
      }));
    }
    if (keepHistory) {
      newCamp.messages        = JSON.parse(JSON.stringify(src.messages));
      newCamp.displayMessages = JSON.parse(JSON.stringify(src.displayMessages));
      newCamp.storyEvents     = JSON.parse(JSON.stringify(src.storyEvents));
      newCamp.turnCount       = src.turnCount;
      newCamp.totalTokensUsed = src.totalTokensUsed;
    }

    saveCampaign(newCamp);
    closeDuplicateModal();
    renderCampaignPanel();
    updateStorageGauge();
    showToast(`Duplicated: ${name}`);

    // Ask if they want to switch to the new campaign
    setTimeout(() => {
      if (confirm(`"${name}" created. Switch to it now?`)) {
        switchCampaign(newCamp.id);
      }
    }, 300);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPORT
  // ═══════════════════════════════════════════════════════════════════════════

  function exportStory() {
    if (!campaign.displayMessages.length) { showToast('No story to export yet.'); return; }

    // Ask format
    const fmt = confirm(
      'Choose export format:\n\nOK = Formatted HTML (beautiful, readable in any browser)\nCancel = Plain Text (.txt)'
    ) ? 'html' : 'txt';

    if (fmt === 'html') exportHTML(); else exportTXT();
  }

  function exportHTML() {
    const camp = campaign;
    const title = esc(camp.name);
    const world = esc(camp.world?.name || '');
    const date  = new Date().toLocaleDateString('en-US', {year:'numeric', month:'long', day:'numeric'});
    const pc    = esc(camp.narrator?.pcName || 'The Player');

    const blocks = camp.displayMessages.map(m => {
      const role    = m.role;
      const content = (m.content || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
      if (role === 'narrator') {
        return `<div class="narrator-block"><p>${content}</p></div>`;
      } else if (role === 'ooc') {
        return `<div class="ooc-block"><span class="ooc-label">Direction</span><p>${content}</p></div>`;
      } else {
        return `<div class="player-block"><span class="player-label">${pc}</span><p>${content}</p></div>`;
      }
    }).join('\n');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Josefin+Sans:wght@300;400&display=swap');
  :root { --bg:#0d0d0f; --surface:#1a1a24; --text:#e8e4d8; --text-dim:#8a8590; --accent:#c9a84c; --border:#2e2e42; }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { background:var(--bg); color:var(--text); font-family:'Josefin Sans',sans-serif; font-size:16px; padding:2rem 1rem; }
  .page { max-width:720px; margin:0 auto; }
  .story-header { text-align:center; padding:3rem 0 2rem; border-bottom:1px solid var(--border); margin-bottom:3rem; }
  .story-title { font-family:'Cormorant Garamond',Georgia,serif; font-size:3rem; font-weight:300; color:var(--accent); letter-spacing:0.1em; }
  .story-world { font-size:0.75rem; letter-spacing:0.3em; text-transform:uppercase; color:var(--text-dim); margin-top:0.5rem; }
  .story-meta  { font-size:0.7rem; color:var(--text-dim); margin-top:1rem; letter-spacing:0.1em; text-transform:uppercase; }
  .narrator-block { margin-bottom:2rem; }
  .narrator-block p { font-family:'Cormorant Garamond',Georgia,serif; font-size:1.25rem; line-height:2; color:var(--text); }
  .player-block { margin-bottom:1.5rem; padding-left:1rem; border-left:2px solid var(--accent); opacity:0.8; }
  .player-label { font-size:0.6rem; letter-spacing:0.15em; text-transform:uppercase; color:var(--accent); display:block; margin-bottom:0.3rem; }
  .player-block p { font-family:'Cormorant Garamond',Georgia,serif; font-size:1.05rem; line-height:1.7; color:var(--text-dim); font-style:italic; }
  .ooc-block { margin-bottom:1.5rem; padding-left:1rem; border-left:2px solid #4c7ac9; opacity:0.6; display:none; }
  .ooc-label { font-size:0.6rem; letter-spacing:0.15em; text-transform:uppercase; color:#4c7ac9; display:block; }
  .story-footer { text-align:center; padding:3rem 0; color:var(--text-dim); font-size:0.7rem; letter-spacing:0.2em; text-transform:uppercase; border-top:1px solid var(--border); margin-top:3rem; }
  @media print { body { background:#fff; color:#111; } .narrator-block p { color:#111; } .player-block p { color:#444; } .story-title { color:#333; } }
</style>
</head>
<body>
<div class="page">
  <div class="story-header">
    <div class="story-title">${title}</div>
    ${world ? `<div class="story-world">◉ ${world}</div>` : ''}
    <div class="story-meta">Exported ${date} · ${camp.turnCount} turns</div>
  </div>
  <div class="story-content">
${blocks}
  </div>
  <div class="story-footer">⟁ StoryWeaver · End of Export</div>
</div>
</body>
</html>`;

    downloadFile(`${camp.name.replace(/[^a-z0-9]/gi,'_')}_story.html`, html, 'text/html');
    showToast('Story exported as HTML');
  }

  function exportTXT() {
    const camp = campaign;
    const pc   = camp.narrator?.pcName || 'You';
    const lines = [
      `${camp.name.toUpperCase()}`,
      camp.world?.name ? `World: ${camp.world.name}` : '',
      `Exported: ${new Date().toLocaleDateString()} · ${camp.turnCount} turns`,
      '',
      '═'.repeat(60),
      '',
    ];
    camp.displayMessages.forEach(m => {
      if (m.role === 'narrator') {
        lines.push(m.content || '');
        lines.push('');
      } else if (m.role === 'player') {
        lines.push(`[${pc}]: ${m.content || ''}`);
        lines.push('');
      } else if (m.role === 'ooc') {
        lines.push(`[Direction]: ${m.content || ''}`);
        lines.push('');
      }
    });
    lines.push('═'.repeat(60));
    lines.push('⟁ StoryWeaver — End of Export');
    downloadFile(`${camp.name.replace(/[^a-z0-9]/gi,'_')}_story.txt`, lines.join('\n'), 'text/plain');
    showToast('Story exported as TXT');
  }

  function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TABS
  // ═══════════════════════════════════════════════════════════════════════════

  function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === `tab-${tab}`));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SYSTEM PROMPTS
  // ═══════════════════════════════════════════════════════════════════════════

  function buildSystemPrompt() {
    const n = campaign.narrator, w = campaign.world;
    const voiceMap = { second:'second person ("you")', third:'third person ("she/he/they")', first:'first person ("I")' };
    const styleGuide = { literary:'Rich, layered, evocative prose. Dwell in sensory detail and subtext.', terse:'Sharp and spare. Short sentences. Kinetic energy.', pulp:'Fast-paced, visceral, plot-driven.', lyrical:'Poetic and sensory. Prioritize emotional resonance.', grounded:'Realistic and observational. Character interiority over spectacle.' };
    const riskGuide  = { high:'Embrace dramatic risk. Let consequences be real. Allow NPCs to act against the player. Introduce complications, reversals, surprises.', medium:'Balance tension with resolution. Allow meaningful conflict but ensure narrative momentum.', low:'Prefer resolution. Guide toward satisfying outcomes while maintaining stakes.' };
    const active   = campaign.characters.filter(c => c.presence === 'active');
    const nearby   = campaign.characters.filter(c => c.presence === 'nearby');
    const offstage = campaign.characters.filter(c => c.presence === 'offstage');
    let chars = '';
    if (active.length) { chars += '\n\n## CHARACTERS IN THIS SCENE\n'; active.forEach(c => { chars += `\n### ${c.name}${c.archetype?` — ${c.archetype}`:''}\n`; if(c.voice) chars+=`Voice: ${c.voice}\n`; if(c.motivation) chars+=`Motivation: ${c.motivation}\n`; if(c.wound) chars+=`Core wound: ${c.wound}\n`; if(c.state) chars+=`Current state: ${c.state}\n`; if(c.disposition) chars+=`Disposition: ${c.disposition}\n`; if(c.agenda) chars+=`Agenda: ${c.agenda}\n`; if(c.relationships) chars+=`Relationships: ${c.relationships}\n`; }); }
    if (nearby.length)   { chars += '\n## CHARACTERS NEARBY\n';          nearby.forEach(c   => chars += `- ${c.name}: ${c.archetype||''} | ${c.state||'—'}\n`); }
    if (offstage.length) { chars += '\n## KNOWN CHARACTERS (offstage)\n'; offstage.forEach(c => chars += `- ${c.name}${c.archetype?` (${c.archetype})`:''}\n`); }
    let world = '';
    if (w.name||w.overview) { world='\n\n## WORLD\n'; if(w.name) world+=`Setting: ${w.name}\n`; if(w.overview) world+=`\n${w.overview}\n`; if(w.tone) world+=`\nAtmosphere: ${w.tone}\n`; if(w.rules) world+=`\nRules: ${w.rules}\n`; }
    let pc = '';
    if (n.pcName||n.pcDesc) { pc='\n\n## PLAYER CHARACTER\n'; if(n.pcName) pc+=`Name: ${n.pcName}\n`; if(n.pcDesc) pc+=`${n.pcDesc}\n`; }
    let events = '';
    const wEvts = campaign.worldEvents.filter(e=>e.sig==='major').slice(0,5);
    const sEvts = campaign.storyEvents.slice(-8);
    if (wEvts.length||sEvts.length) { events='\n\n## STORY CONTEXT\n'; wEvts.forEach(e=>events+=`- [World] ${e.title}: ${e.desc}\n`); sEvts.forEach(e=>events+=`- [Story] ${e.title}: ${e.desc}\n`); }
    return `You are a narrative AI running a collaborative choose-your-own-adventure roleplay. You are the narrator and author — never break character to speak as an AI.

## NARRATIVE DIRECTIVES
- Write in ${voiceMap[n.voice]||'second person'}.
- Style: ${styleGuide[n.style]||styleGuide.literary}
- Pacing: ${n.pacing==='slow'?'Deliberate — dwell in moments':n.pacing==='fast'?'Urgent — lean prose':'Balanced'}.
- Risk: ${riskGuide[n.risk]||riskGuide.high}
- ${n.content==='explicit'?'Explicit content is permitted.':n.content==='mature'?'Mature themes permitted, suggest rather than depict explicit content.':'Keep content suitable for general audiences.'}

## ANTI-DRIFT RULES (critical)
- NEVER use the word "apparently" — write confidently from established facts.
- Maintain each character's defined voice exactly.
- Never contradict established story facts.
- NPCs pursue their own agendas. They are not here to serve the player.
- End responses with an open story moment — not a question to the player.
${n.custom?`\n## ADDITIONAL NARRATOR NOTES\n${n.custom}`:''}${world}${pc}${chars}${events}`;
  }

  function buildBrainstormSystemPrompt() {
    const w = campaign.world, n = campaign.narrator;
    const all = campaign.characters;
    let chars = '\n\n## ALL CHARACTERS\n';
    all.forEach(c => { chars+=`\n### ${c.name} [${c.presence}]${c.archetype?` — ${c.archetype}`:''}\n`; if(c.motivation) chars+=`Motivation: ${c.motivation}\n`; if(c.wound) chars+=`Wound: ${c.wound}\n`; if(c.backstory) chars+=`Background: ${c.backstory}\n`; if(c.relationships) chars+=`Relationships: ${c.relationships}\n`; });
    let world = '';
    if (w.name||w.overview) { world='\n\n## WORLD\n'; if(w.name) world+=`Setting: ${w.name}\n`; if(w.overview) world+=`\n${w.overview}\n`; if(w.geography) world+=`\nGeography: ${w.geography}\n`; if(w.rules) world+=`\nRules: ${w.rules}\n`; if(w.tone) world+=`\nAtmosphere: ${w.tone}\n`; }
    let recent = '';
    if (campaign.storyEvents.length) { recent='\n\n## RECENT STORY EVENTS\n'; campaign.storyEvents.slice(-10).forEach(e=>recent+=`- ${e.title}: ${e.desc}\n`); }
    let pc = '';
    if (n.pcName||n.pcDesc) { pc='\n\n## PLAYER CHARACTER\n'; if(n.pcName) pc+=`Name: ${n.pcName}\n`; if(n.pcDesc) pc+=`${n.pcDesc}\n`; }
    return `You are a collaborative fiction partner for a choose-your-own-adventure story. You have full knowledge of this story's world, characters, and events. Speak as a thoughtful, engaged co-author.

Your role here is NOT to narrate the story — that happens in the main story window. Here you are the author's partner: help brainstorm plot directions, discuss characters in depth, explore consequences, think through world-building, suggest dramatic possibilities. Be direct, conversational, creatively engaged. Speculate freely about where the story could go.

Never use the word "apparently."
${world}${pc}${chars}${recent}`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // API
  // ═══════════════════════════════════════════════════════════════════════════

  function estimateTokens(text) { return Math.ceil((text||'').length/4); }

  function getTotalContextTokens() {
    const sys  = estimateTokens(buildSystemPrompt());
    const hist = campaign.messages.reduce((s,m) => { const c=typeof m.content==='string'?m.content:JSON.stringify(m.content); return s+estimateTokens(c); }, 0);
    return sys + hist;
  }

  async function callAPI(messages, systemPrompt, maxTokens=1000, overrideModel=null) {
    const provId  = global.provider;
    const apiKey  = global.apiKeys[provId] || '';
    if (apiKey === 'DEMO') return { text:'[Demo mode — enter a real API key in Settings to enable AI responses.]\n\nYou stand at the threshold of your story. The world waits, patient and full of shadow.', inputTokens:0, outputTokens:0 };
    const prov    = PROVIDERS[provId];
    const sys     = systemPrompt || buildSystemPrompt();
    const modelId = overrideModel || (provId==='custom' ? global.customModelName : global.model);

    if (prov?.format === 'anthropic') {
      const res = await fetch(prov.baseUrl, { method:'POST', headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'}, body:JSON.stringify({model:modelId,max_tokens:maxTokens,system:sys,messages}) });
      if (!res.ok) { const e=await res.json().catch(()=>({})); throw new Error(e.error?.message||`API error ${res.status}`); }
      const d = await res.json();
      return { text:d.content?.map(c=>c.text||'').join('')||'', inputTokens:d.usage?.input_tokens||0, outputTokens:d.usage?.output_tokens||0 };
    }
    if (prov?.format === 'gemini') {
      const url = `${prov.baseUrl}/${modelId}:generateContent?key=${apiKey}`;
      const contents = messages.map(m => ({ role:m.role==='assistant'?'model':'user', parts:[{text:typeof m.content==='string'?m.content:m.content[0]?.text||''}] }));
      const res = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({system_instruction:{parts:[{text:sys}]},contents,generationConfig:{maxOutputTokens:maxTokens}}) });
      if (!res.ok) { const e=await res.json().catch(()=>({})); throw new Error(e.error?.message||`Gemini error ${res.status}`); }
      const d = await res.json();
      return { text:d.candidates?.[0]?.content?.parts?.[0]?.text||'', inputTokens:d.usageMetadata?.promptTokenCount||0, outputTokens:d.usageMetadata?.candidatesTokenCount||0 };
    }
    // OpenAI-compatible
    const baseUrl = provId==='custom' ? global.customEndpoint : prov.baseUrl;
    const headers = {'Content-Type':'application/json'};
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
    const res = await fetch(baseUrl, { method:'POST', headers, body:JSON.stringify({model:modelId,max_tokens:maxTokens,messages:[{role:'system',content:sys},...messages]}) });
    if (!res.ok) { const e=await res.json().catch(()=>({})); throw new Error(e.error?.message||`API error ${res.status}`); }
    const d = await res.json();
    return { text:d.choices?.[0]?.message?.content||'', inputTokens:d.usage?.prompt_tokens||0, outputTokens:d.usage?.completion_tokens||0 };
  }

  function friendlyError(msg) {
    if (msg.includes('quota')||msg.includes('rate')||msg.includes('limit')||msg.includes('429')) {
      return global.provider==='gemini'
        ? `[Gemini free tier quota exceeded. Switch to Groq — free, no payment needed. Settings → Provider → Groq, get key at console.groq.com.]`
        : `[Rate limit reached. Wait a moment and try again, or switch providers in Settings.]`;
    }
    if (msg.includes('context')||msg.includes('token')||msg.includes('length')||msg.includes('413')) return `[Context window full. Go to Events → "Summarize Campaign" to compress story history, or move characters to Offstage.]`;
    if (msg.includes('401')||msg.includes('auth')||msg.includes('key')) return `[API key error — check Settings and re-enter your key.]`;
    if (msg.includes('network')||msg.includes('fetch')||msg.includes('Failed')) return `[Connection error — check your internet and try again.]`;
    return `[Error: ${msg}]`;
  }

  // ─── CONTEXT COMPRESSION ──────────────────────────────────────────────────

  async function compressHistoryIfNeeded() {
    if (getTotalContextTokens() < global.contextLimit * 0.65) return;
    if (campaign.messages.length < 10) return;
    await runCompression(0.5);
  }

  async function runCompression(fraction) {
    const cutoff = Math.floor(campaign.messages.length * fraction);
    const toCompress = campaign.messages.slice(0, cutoff);
    const toKeep     = campaign.messages.slice(cutoff);
    const prompt = `Summarize this story conversation into a compact narrative summary (under 400 words). Preserve: key events, character relationship changes, important decisions, consequences, new world facts. Be factual. Never use the word "apparently".\n\nCONVERSATION:\n${toCompress.map(m=>`${m.role.toUpperCase()}: ${typeof m.content==='string'?m.content:m.content[0]?.text||''}`).join('\n\n')}`;
    try {
      const result = await callAPI([{role:'user',content:prompt}], 'You are a story summarizer. Be factual and concise.', 600);
      if (result?.text) {
        campaign.messages = [{role:'user',content:`[STORY SUMMARY — prior events]: ${result.text}`},{role:'assistant',content:'Understood. I have the full prior story context.'}, ...toKeep];
        autoLogEvent('Context compressed', result.text.substring(0,200));
        saveCampaign(campaign);
      }
    } catch(e) { console.warn('Compression failed', e); }
  }

  async function summarizeCampaign() {
    if (!campaign.messages.length) { showToast('No story to summarize yet.'); return; }
    if (!confirm('Compress the entire story history into a chapter summary? The full conversation will be replaced with a compact record. Recommended at the end of a major arc. Continue?')) return;
    showToast('Summarizing campaign...');
    const sendBtn = document.getElementById('send-btn');
    if (sendBtn) sendBtn.disabled = true;
    const prompt = `Write a rich narrative chapter summary (300-500 words) of this story so far. Readable prose, past tense. Capture: key events in order, character relationship changes, major decisions, consequences, world facts established, where the story currently stands. This summary replaces the full conversation history — it must be complete enough to orient the narrator for the next chapter. Never use "apparently".\n\nFULL STORY:\n${campaign.messages.map(m=>`${m.role.toUpperCase()}: ${typeof m.content==='string'?m.content:m.content[0]?.text||''}`).join('\n\n')}`;
    try {
      const result = await callAPI([{role:'user',content:prompt}], 'You are a story archivist. Write clear, complete, narrative chapter summaries.', 800);
      if (result?.text) {
        campaign.messages = [{role:'user',content:`[CHAPTER SUMMARY — story so far]: ${result.text}`},{role:'assistant',content:'Understood. I have the full chapter context and am ready to continue the story.'}];
        campaign.storyEvents.push({ id:`evt_${Date.now()}`, title:`Chapter Summary — Turn ${campaign.turnCount}`, desc:result.text.substring(0,500), sig:'major', created:new Date().toISOString(), auto:true, isSummary:true });
        saveCampaign(campaign); renderEvents(); updateGauges(); updateStorageGauge();
        showToast('Campaign summarized — context freed');
        setTimeout(() => { if (confirm('Summary saved to Events. View it now?')) switchTab('events'); }, 300);
      }
    } catch(e) { showToast('Summarize failed: '+e.message); }
    if (sendBtn) sendBtn.disabled = false;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // OOC DIRECTION MODE
  // ═══════════════════════════════════════════════════════════════════════════

  function toggleOOC() {
    oocMode = !oocMode;
    const btn   = document.getElementById('ooc-toggle');
    const wrap  = document.getElementById('input-wrap');
    const input = document.getElementById('player-input');
    const hint  = document.getElementById('input-hint');
    btn.classList.toggle('active', oocMode);
    wrap.classList.toggle('ooc-mode', oocMode);
    if (oocMode) {
      input.placeholder = 'Story direction — guide what happens next, adjust tone, introduce a detail...';
      hint.textContent  = 'Direction mode — AI incorporates this as author guidance then continues the story';
    } else {
      input.placeholder = 'What do you do, say, or observe...';
      hint.textContent  = 'Shift+Enter for new line · Enter to send';
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SEND STORY MESSAGE
  // ═══════════════════════════════════════════════════════════════════════════

  async function sendMessage() {
    const input   = document.getElementById('player-input');
    const text    = input.value.trim();
    if (!text) return;
    input.value   = '';
    const isOOC   = oocMode;
    const sendBtn = document.getElementById('send-btn');
    sendBtn.disabled = true;
    campaign.turnCount++;
    addDisplayMessage(isOOC ? 'ooc' : 'player', text);
    document.getElementById('turn-count').textContent = `Turn ${campaign.turnCount}`;
    const apiContent = isOOC
      ? `[OUT OF CHARACTER — Author direction]: ${text}\n[Acknowledge this direction briefly then continue the story incorporating it naturally.]`
      : text;
    campaign.messages.push({role:'user', content:apiContent});
    const typingEl = showTyping();
    try {
      await compressHistoryIfNeeded();
      const result = await callAPI(campaign.messages);
      typingEl.remove();
      campaign.messages.push({role:'assistant', content:result.text});
      addDisplayMessage('narrator', result.text);
      campaign.totalTokensUsed += (result.inputTokens + result.outputTokens);
      campaign.lastInputTokens  = result.inputTokens;
      campaign.lastOutputTokens = result.outputTokens;
      updateGauges();
      autoDetectEvents(text, result.text);
      saveCampaign(campaign);
      updateCampaignPanel();
    } catch(e) {
      typingEl.remove();
      showContextWarning(e.message);
      addDisplayMessage('narrator', friendlyError(e.message));
      campaign.messages.pop();
    }
    sendBtn.disabled = false;
    scrollToBottom();
  }

  function showContextWarning(msg) {
    if (!msg.includes('context')&&!msg.includes('token')&&!msg.includes('length')&&!msg.includes('413')) return;
    const existing = document.querySelector('.context-warning'); if (existing) existing.remove();
    const banner = document.createElement('div'); banner.className='context-warning';
    banner.innerHTML='<strong>⚠ Context Window Full</strong>Go to the <strong>Events tab</strong> and tap "Summarize Campaign" to free up space, or move characters to Offstage.';
    const wrap = document.querySelector('.story-wrap'); if (wrap) wrap.insertBefore(banner, wrap.lastElementChild);
    setTimeout(()=>banner.remove(), 15000);
  }

  function handleInputKey(e) { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();} }

  // ═══════════════════════════════════════════════════════════════════════════
  // EDIT MESSAGES
  // ═══════════════════════════════════════════════════════════════════════════

  function editBlock(index) {
    const blocks = document.querySelectorAll('.story-block');
    const block  = blocks[index]; if (!block) return;
    const contentEl = block.querySelector('.block-content');
    let editArea    = block.querySelector('.block-edit-area');
    if (editArea) { editArea.remove(); contentEl.style.display=''; return; }
    editArea = document.createElement('div'); editArea.className='block-edit-area open';
    const ta = document.createElement('textarea'); ta.value = campaign.displayMessages[index]?.content || contentEl.textContent; editArea.appendChild(ta);
    const actions = document.createElement('div'); actions.className='block-edit-actions';
    const saveBtn  = document.createElement('button'); saveBtn.className='btn-small'; saveBtn.textContent='Save'; saveBtn.onclick=()=>saveEdit(index,ta.value,block,editArea,contentEl);
    const cancelBtn= document.createElement('button'); cancelBtn.className='btn-ghost-small'; cancelBtn.textContent='Cancel'; cancelBtn.onclick=()=>{editArea.remove();contentEl.style.display='';};
    const role = campaign.displayMessages[index]?.role;
    if ((role==='player'||role==='ooc') && campaign.displayMessages[index+1]?.role==='narrator') {
      const regenBtn = document.createElement('button'); regenBtn.className='btn-small'; regenBtn.textContent='Save & Regenerate'; regenBtn.style.background='var(--accent-dim)'; regenBtn.onclick=()=>saveEditAndRegenerate(index,ta.value,block,editArea,contentEl);
      actions.appendChild(saveBtn); actions.appendChild(regenBtn); actions.appendChild(cancelBtn);
    } else { actions.appendChild(saveBtn); actions.appendChild(cancelBtn); }
    editArea.appendChild(actions); contentEl.style.display='none'; block.appendChild(editArea);
    ta.focus(); ta.setSelectionRange(ta.value.length,ta.value.length);
  }

  function saveEdit(index,newText,block,editArea,contentEl) {
    if(!newText.trim()) return;
    contentEl.textContent=newText; contentEl.style.display=''; editArea.remove();
    if(campaign.displayMessages[index]) campaign.displayMessages[index].content=newText;
    const role=campaign.displayMessages[index]?.role; const apiRole=role==='narrator'?'assistant':'user';
    updateApiMessage(index,newText,apiRole); saveCampaign(campaign); showToast('Edit saved');
  }

  async function saveEditAndRegenerate(index,newText,block,editArea,contentEl) {
    saveEdit(index,newText,block,editArea,contentEl);
    campaign.displayMessages=campaign.displayMessages.slice(0,index+1);
    const apiIdx=findApiIndex(index); if(apiIdx!==-1) campaign.messages=campaign.messages.slice(0,apiIdx+1);
    const allBlocks=document.querySelectorAll('.story-block'); for(let i=allBlocks.length-1;i>index;i--) allBlocks[i].remove();
    showToast('Regenerating...');
    const sendBtn=document.getElementById('send-btn'); sendBtn.disabled=true;
    const typingEl=showTyping();
    try {
      await compressHistoryIfNeeded();
      const result=await callAPI(campaign.messages); typingEl.remove();
      campaign.messages.push({role:'assistant',content:result.text}); addDisplayMessage('narrator',result.text);
      campaign.totalTokensUsed+=(result.inputTokens+result.outputTokens); updateGauges(); saveCampaign(campaign);
    } catch(e) { typingEl.remove(); addDisplayMessage('narrator',friendlyError(e.message)); }
    sendBtn.disabled=false;
  }

  function updateApiMessage(displayIndex,newText,apiRole) {
    let roleCount=0;
    for(let i=0;i<displayIndex;i++){const r=campaign.displayMessages[i]?.role;if((r==='narrator'?'assistant':'user')===apiRole)roleCount++;}
    let found=0;
    for(let i=0;i<campaign.messages.length;i++){if(campaign.messages[i].role===apiRole){if(found===roleCount){campaign.messages[i].content=newText;return;}found++;}}
  }

  function findApiIndex(displayIndex) {
    const role=campaign.displayMessages[displayIndex]?.role; const apiRole=role==='narrator'?'assistant':'user';
    let roleCount=0; for(let i=0;i<displayIndex;i++){const r=campaign.displayMessages[i]?.role;if((r==='narrator'?'assistant':'user')===apiRole)roleCount++;}
    let found=0; for(let i=0;i<campaign.messages.length;i++){if(campaign.messages[i].role===apiRole){if(found===roleCount)return i;found++;}} return -1;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BRAINSTORM PANEL
  // ═══════════════════════════════════════════════════════════════════════════

  function toggleBrainstorm() { global.brainstormOpen ? closeBrainstormPanel() : openBrainstormPanel(); }

  function openBrainstormPanel() {
    global.brainstormOpen=true;
    document.getElementById('brainstorm-panel').classList.add('open');
    document.getElementById('brainstorm-header-btn').classList.add('active');
    populateBsModelSelect(); renderBsTranscript(); saveGlobal();
    setTimeout(()=>{ const inp=document.getElementById('bs-input'); if(inp) inp.focus(); },320);
  }

  function closeBrainstormPanel() {
    global.brainstormOpen=false;
    document.getElementById('brainstorm-panel').classList.remove('open');
    document.getElementById('brainstorm-header-btn').classList.remove('active');
    saveGlobal();
  }

  function populateBsModelSelect() {
    const sel=document.getElementById('bs-model-select'); if(!sel) return;
    const prov=PROVIDERS[global.provider]; if(!prov) return;
    const cur=global.bsModel||global.model;
    sel.innerHTML=prov.models.map(m=>`<option value="${m.id}"${m.id===cur?' selected':''}>${m.label.split(' — ')[0]}</option>`).join('');
    sel.value=cur;
  }

  function saveBsModel() { const sel=document.getElementById('bs-model-select'); if(sel){global.bsModel=sel.value;saveGlobal();} }

  function renderBsTranscript() {
    const output=document.getElementById('bs-output'); if(!output) return;
    if(!bsTranscript.length){output.innerHTML='<div class="bs-welcome"><div class="bs-welcome-icon">⚡</div><p>Chat freely with your narrator as a collaborator. Nothing here affects the story unless you pin it.</p></div>';return;}
    output.innerHTML=''; bsTranscript.forEach((msg,i)=>renderBsMessage(msg.role,msg.content,i,false)); bsScrollToBottom();
  }

  function renderBsMessage(role,content,index,scroll=true) {
    const output=document.getElementById('bs-output'); if(!output) return;
    const welcome=output.querySelector('.bs-welcome'); if(welcome) welcome.remove();
    const block=document.createElement('div'); block.className=`bs-block ${role}`;
    const meta=document.createElement('div'); meta.className='bs-meta';
    meta.innerHTML=`<span>${role==='user'?'You':'Narrator (Brainstorm)'}</span>${role==='assistant'?`<button class="bs-pin-btn" onclick="App.pinToStory(${index})">📌 pin to story</button>`:''}`;
    const contentEl=document.createElement('div'); contentEl.className='bs-content'; contentEl.textContent=content;
    block.appendChild(meta); block.appendChild(contentEl); output.appendChild(block);
    if(scroll) bsScrollToBottom();
  }

  function bsScrollToBottom() { const o=document.getElementById('bs-output'); if(o) o.scrollTop=o.scrollHeight; }

  async function sendBrainstorm() {
    const input=document.getElementById('bs-input'); const text=input.value.trim(); if(!text) return;
    input.value=''; const sendBtn=document.getElementById('bs-send-btn'); sendBtn.disabled=true;
    bsTranscript.push({role:'user',content:text}); bsMessages.push({role:'user',content:text});
    renderBsMessage('user',text,bsTranscript.length-1);
    const output=document.getElementById('bs-output');
    const typingEl=document.createElement('div'); typingEl.className='typing-indicator'; typingEl.innerHTML='<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>'; output.appendChild(typingEl); bsScrollToBottom();
    try {
      const result=await callAPI(bsMessages,buildBrainstormSystemPrompt(),1200,global.bsModel||global.model);
      typingEl.remove(); bsMessages.push({role:'assistant',content:result.text}); bsTranscript.push({role:'assistant',content:result.text});
      renderBsMessage('assistant',result.text,bsTranscript.length-1); saveBsTranscript();
    } catch(e) {
      typingEl.remove(); const err=`[Error: ${e.message}]`; bsTranscript.push({role:'assistant',content:err}); renderBsMessage('assistant',err,bsTranscript.length-1);
    }
    sendBtn.disabled=false;
  }

  function handleBsKey(e) { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendBrainstorm();} }

  function clearBrainstorm() {
    if(!confirm('Clear the Brainstorm transcript?')) return;
    bsTranscript=[]; bsMessages=[]; localStorage.removeItem(BS_KEY); renderBsTranscript(); showToast('Brainstorm cleared');
  }

  function pinToStory(transcriptIndex) {
    const msg=bsTranscript[transcriptIndex]; if(!msg||msg.role!=='assistant') return;
    campaign.storyEvents.push({id:`evt_${Date.now()}`,title:`📌 Brainstorm Note — Turn ${campaign.turnCount}`,desc:msg.content.substring(0,400),sig:'worldnote',created:new Date().toISOString(),pinned:true});
    saveCampaign(campaign); renderEvents(); showToast('Pinned to Story Events');
    const assistantBlocks=[...document.querySelectorAll('.bs-block.assistant')];
    let ai=0; bsTranscript.forEach((m,i)=>{if(m.role==='assistant'){if(i===transcriptIndex&&assistantBlocks[ai]){const btn=assistantBlocks[ai].querySelector('.bs-pin-btn');if(btn){btn.textContent='📌 pinned';btn.classList.add('pinned');}}ai++;}});
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DISPLAY
  // ═══════════════════════════════════════════════════════════════════════════

  function addDisplayMessage(role,content) {
    campaign.displayMessages.push({role,content,turn:campaign.turnCount});
    renderDisplayMessage(role,content); scrollToBottom();
  }

  function renderDisplayMessage(role,content) {
    const output=document.getElementById('story-output'); const welcome=output.querySelector('.story-welcome'); if(welcome) welcome.remove();
    const index=output.querySelectorAll('.story-block').length;
    const block=document.createElement('div'); block.className=`story-block ${role}`;
    const meta=document.createElement('div'); meta.className='block-meta';
    const label=role==='narrator'?'Narrator':role==='ooc'?'✦ Direction':(campaign.narrator.pcName||'You');
    meta.innerHTML=`<span>${esc(label)}</span><button class="block-edit-btn" onclick="App.editBlock(${index})">edit</button>`;
    const contentEl=document.createElement('div'); contentEl.className='block-content'; contentEl.textContent=content;
    block.appendChild(meta); block.appendChild(contentEl); output.appendChild(block);
  }

  function showTyping() {
    const output=document.getElementById('story-output');
    const el=document.createElement('div'); el.className='typing-indicator'; el.innerHTML='<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    output.appendChild(el); scrollToBottom(); return el;
  }

  function scrollToBottom() { const o=document.getElementById('story-output'); if(o) o.scrollTop=o.scrollHeight; }

  function updateGauges() {
    const tv=campaign.totalTokensUsed; const tPct=Math.min((tv/500000)*100,100);
    const tBar=document.getElementById('token-bar'); if(tBar){tBar.style.width=`${tPct}%`;tBar.classList.toggle('warn',tPct>80);}
    const tVal=document.getElementById('token-val'); if(tVal) tVal.textContent=tv>1000?`${(tv/1000).toFixed(1)}k`:tv;
    const cPct=Math.min((getTotalContextTokens()/global.contextLimit)*100,100);
    const cBar=document.getElementById('context-bar'); if(cBar){cBar.style.width=`${cPct}%`;cBar.classList.toggle('warn',cPct>80);}
    const cVal=document.getElementById('context-val'); if(cVal) cVal.textContent=`${Math.round(cPct)}%`;
    updateStorageGauge();
    const nameEl=document.getElementById('header-campaign-name'); if(nameEl) nameEl.textContent=campaign.name;
  }

  function updateCampaignPanel() { if(global.campaignPanelOpen) renderCampaignPanel(); }

  function renderSceneChips() {
    const container=document.getElementById('scene-chips'); if(!container) return; container.innerHTML='';
    campaign.characters.filter(c=>c.presence==='active').forEach(c=>{
      const chip=document.createElement('div'); chip.className='scene-chip';
      const dot=document.createElement('div'); const d=c.disposition||'neutral';
      dot.className=`chip-dot ${d==='hostile'?'hostile':(d==='trusting'||d==='friendly')?'':'neutral'}`;
      const label=document.createElement('span'); label.textContent=c.name;
      chip.appendChild(dot); chip.appendChild(label); container.appendChild(chip);
    });
  }

  function renderAll() {
    renderCharRoster(); renderWorldForm(); renderNarratorForm(); renderEvents(); renderSceneChips(); updateGauges();
    const nameEl=document.getElementById('header-campaign-name'); if(nameEl) nameEl.textContent=campaign.name;
    if(campaign.displayMessages.length>0){
      const output=document.getElementById('story-output'); const welcome=output.querySelector('.story-welcome'); if(welcome) welcome.remove();
      output.querySelectorAll('.story-block').forEach(b=>b.remove());
      campaign.displayMessages.forEach(m=>renderDisplayMessage(m.role,m.content));
      document.getElementById('turn-count').textContent=`Turn ${campaign.turnCount}`;
      scrollToBottom();
    } else {
      const output=document.getElementById('story-output');
      if(!output.querySelector('.story-welcome')) { output.innerHTML='<div class="story-welcome"><div class="welcome-glyph">⟁</div><h2>Your story awaits.</h2><p>Describe your world, your character, and where you begin — or simply say what happens first.</p></div>'; }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CHARACTERS
  // ═══════════════════════════════════════════════════════════════════════════

  function addCharacter() { editingCharId=null; clearCharModal(); document.getElementById('modal-title').textContent='Add Character'; openModal('char-modal'); }

  function editCharacter(id) {
    const c=campaign.characters.find(c=>c.id===id); if(!c) return;
    editingCharId=id; document.getElementById('modal-title').textContent='Edit Character';
    document.getElementById('char-name').value=c.name||''; document.getElementById('char-archetype').value=c.archetype||''; document.getElementById('char-voice').value=c.voice||''; document.getElementById('char-motivation').value=c.motivation||''; document.getElementById('char-wound').value=c.wound||''; document.getElementById('char-disposition').value=c.disposition||'neutral'; document.getElementById('char-state').value=c.state||''; document.getElementById('char-agenda').value=c.agenda||''; document.getElementById('char-presence').value=c.presence||'offstage'; document.getElementById('char-canon').value=c.canon||''; document.getElementById('char-backstory').value=c.backstory||''; document.getElementById('char-relationships').value=c.relationships||'';
    openModal('char-modal');
  }

  function saveCharacter() {
    const name=document.getElementById('char-name').value.trim(); if(!name){alert('Character needs a name.');return;}
    if(!editingCharId&&campaign.characters.length>=24){alert('Maximum 24 named characters.');return;}
    const char={id:editingCharId||`char_${Date.now()}`,name,archetype:document.getElementById('char-archetype').value.trim(),voice:document.getElementById('char-voice').value.trim(),motivation:document.getElementById('char-motivation').value.trim(),wound:document.getElementById('char-wound').value.trim(),disposition:document.getElementById('char-disposition').value,state:document.getElementById('char-state').value.trim(),agenda:document.getElementById('char-agenda').value.trim(),presence:document.getElementById('char-presence').value,canon:document.getElementById('char-canon').value.trim(),backstory:document.getElementById('char-backstory').value.trim(),relationships:document.getElementById('char-relationships').value.trim()};
    if(editingCharId){const idx=campaign.characters.findIndex(c=>c.id===editingCharId);if(idx!==-1)campaign.characters[idx]=char;}else{campaign.characters.push(char);}
    saveCampaign(campaign); renderCharRoster(); renderSceneChips(); updateGauges(); closeCharModal();
  }

  function deleteCharacter(id) {
    if(!confirm('Remove this character?')) return;
    campaign.characters=campaign.characters.filter(c=>c.id!==id); saveCampaign(campaign); renderCharRoster(); renderSceneChips();
  }

  function renderCharRoster() {
    const roster=document.getElementById('char-roster'); if(!roster) return;
    if(!campaign.characters.length){roster.innerHTML='<div class="empty-state"><p>No characters yet.</p><p class="empty-sub">Add NPCs to populate your world. Up to 24 named characters supported.</p></div>';return;}
    const order={active:0,nearby:1,offstage:2,deceased:3};
    const sorted=[...campaign.characters].sort((a,b)=>(order[a.presence]||2)-(order[b.presence]||2));
    roster.innerHTML=sorted.map(c=>`<div class="char-card"><div class="char-presence-dot presence-${c.presence||'offstage'}"></div><div class="char-card-main"><div class="char-card-name">${esc(c.name)}</div><div class="char-card-sub">${esc(c.archetype||'No archetype set')}${c.voice?' · '+esc(c.voice.substring(0,40)):''}</div><div class="char-card-tags"><span class="char-tag tag-disposition-${c.disposition||'neutral'}">${c.disposition||'neutral'}</span>${c.canon?`<span class="char-tag" style="background:rgba(76,122,201,0.15);color:var(--blue)">Canon: ${esc(c.canon)}</span>`:''}<span class="char-tag" style="background:var(--surface2);color:var(--text-muted)">${c.presence||'offstage'}</span></div></div><div class="char-card-actions"><button class="char-act-btn" onclick="App.editCharacter('${c.id}')">Edit</button><button class="char-act-btn danger" onclick="App.deleteCharacter('${c.id}')">✕</button></div></div>`).join('');
  }

  function clearCharModal() { ['char-name','char-archetype','char-voice','char-motivation','char-wound','char-state','char-agenda','char-canon','char-backstory','char-relationships'].forEach(id=>{document.getElementById(id).value='';}); document.getElementById('char-disposition').value='neutral'; document.getElementById('char-presence').value='offstage'; }

  // ═══════════════════════════════════════════════════════════════════════════
  // WORLD
  // ═══════════════════════════════════════════════════════════════════════════

  function renderWorldForm() { document.getElementById('world-name').value=campaign.world.name||''; document.getElementById('world-overview').value=campaign.world.overview||''; document.getElementById('world-geo').value=campaign.world.geography||''; document.getElementById('world-rules').value=campaign.world.rules||''; document.getElementById('world-tone').value=campaign.world.tone||''; document.getElementById('world-lore').value=campaign.world.lore||''; updateWorldWordCount(); }

  function saveWorld() {
    campaign.world={name:document.getElementById('world-name').value.trim(),overview:document.getElementById('world-overview').value.trim(),geography:document.getElementById('world-geo').value.trim(),rules:document.getElementById('world-rules').value.trim(),tone:document.getElementById('world-tone').value.trim(),lore:document.getElementById('world-lore').value.trim()};
    saveCampaign(campaign); updateGauges(); renderCampaignPanel(); showToast('World saved');
  }

  function bindWorldWordCount() { const el=document.getElementById('world-overview'); if(el) el.addEventListener('input',updateWorldWordCount); }
  function updateWorldWordCount() { const el=document.getElementById('world-overview'),count=document.getElementById('world-overview-count'); if(!el||!count) return; const words=el.value.trim()?el.value.trim().split(/\s+/).length:0; count.textContent=`${words} / 300 words recommended`; count.style.color=words>300?'var(--red)':'var(--text-muted)'; }

  // ═══════════════════════════════════════════════════════════════════════════
  // NARRATOR
  // ═══════════════════════════════════════════════════════════════════════════

  function renderNarratorForm() { const n=campaign.narrator; document.getElementById('narrator-voice').value=n.voice||'second'; document.getElementById('narrator-style').value=n.style||'literary'; document.getElementById('narrator-pacing').value=n.pacing||'balanced'; document.getElementById('narrator-risk').value=n.risk||'high'; document.getElementById('narrator-content').value=n.content||'general'; document.getElementById('narrator-custom').value=n.custom||''; document.getElementById('pc-name').value=n.pcName||''; document.getElementById('pc-desc').value=n.pcDesc||''; }

  function saveNarrator() {
    campaign.narrator={voice:document.getElementById('narrator-voice').value,style:document.getElementById('narrator-style').value,pacing:document.getElementById('narrator-pacing').value,risk:document.getElementById('narrator-risk').value,content:document.getElementById('narrator-content').value,custom:document.getElementById('narrator-custom').value.trim(),pcName:document.getElementById('pc-name').value.trim(),pcDesc:document.getElementById('pc-desc').value.trim()};
    saveCampaign(campaign); showToast('Narrator settings saved');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENTS
  // ═══════════════════════════════════════════════════════════════════════════

  function addEvent(type) { pendingEventType=type||'world'; document.getElementById('event-modal-title').textContent=pendingEventType==='world'?'Add World Event':'Add Story Event'; document.getElementById('event-title').value=''; document.getElementById('event-desc').value=''; document.getElementById('event-sig').value='significant'; openModal('event-modal'); }

  function saveEvent() {
    const title=document.getElementById('event-title').value.trim(); if(!title){alert('Event needs a title.');return;}
    const event={id:`evt_${Date.now()}`,title,desc:document.getElementById('event-desc').value.trim(),sig:document.getElementById('event-sig').value,created:new Date().toISOString()};
    if(pendingEventType==='world') campaign.worldEvents.push(event); else campaign.storyEvents.push(event);
    saveCampaign(campaign); renderEvents(); closeEventModal();
  }

  function autoLogEvent(title,desc) { campaign.storyEvents.push({id:`evt_${Date.now()}`,title,desc:(desc||'').substring(0,300),sig:'minor',created:new Date().toISOString(),auto:true}); renderEvents(); }

  function autoDetectEvents(playerText,narratorText) {
    const combined=(playerText+' '+narratorText).toLowerCase();
    const kw=['died','killed','betrayed','revealed','discovered','escaped','captured','sworn','promised','arrived','destroyed','found'];
    if(kw.filter(w=>combined.includes(w)).length>=2) autoLogEvent(`Turn ${campaign.turnCount} — notable moment`,narratorText.substring(0,150).replace(/\n/g,' '));
  }

  function renderEvents() { renderEventList('world-events-list',campaign.worldEvents,'world'); renderEventList('story-events-list',campaign.storyEvents,'story'); }

  function renderEventList(containerId,events,type) {
    const el=document.getElementById(containerId); if(!el) return;
    if(!events.length){el.innerHTML=type==='world'?'<div class="empty-state"><p>No world events yet.</p><p class="empty-sub">Add events that exist before play begins.</p></div>':'<div class="empty-state"><p>No story events yet.</p><p class="empty-sub">Significant moments are logged here automatically.</p></div>';return;}
    el.innerHTML=[...events].reverse().slice(0,20).map(e=>`<div class="event-card event-sig-${e.sig}"><div class="event-card-title">${esc(e.title)}</div>${e.desc?`<div class="event-card-desc">${esc(e.desc)}</div>`:''}</div>`).join('');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SETTINGS
  // ═══════════════════════════════════════════════════════════════════════════

  function showSettings() {
    const provSel=document.getElementById('settings-provider'); provSel.innerHTML=Object.entries(PROVIDERS).map(([k,p])=>`<option value="${k}"${k===global.provider?' selected':''}>${p.name}</option>`).join(''); provSel.value=global.provider; updateSettingsForProvider(); openModal('settings-modal');
  }

  function updateSettingsForProvider() {
    const provId=document.getElementById('settings-provider').value; const prov=PROVIDERS[provId];
    document.getElementById('settings-api-key').placeholder=prov.keyPlaceholder; document.getElementById('settings-api-key').value=global.apiKeys[provId]||''; document.getElementById('settings-key-hint').textContent=prov.keyHint;
    const modelSel=document.getElementById('settings-model'); modelSel.innerHTML=prov.models.map(m=>`<option value="${m.id}">${m.label}</option>`).join(''); modelSel.value=(provId===global.provider)?global.model:prov.defaultModel;
    const ctxSel=document.getElementById('settings-context'); ctxSel.innerHTML=prov.contextLimits.map(l=>`<option value="${l}"${l===global.contextLimit?' selected':''}>${(l/1000).toFixed(0)}k tokens</option>`).join('');
    const row=document.getElementById('settings-custom-row'); if(row){row.style.display=provId==='custom'?'block':'none';if(provId==='custom'){document.getElementById('settings-custom-endpoint').value=global.customEndpoint||'';document.getElementById('settings-custom-model').value=global.customModelName||'';}}
  }

  function saveSettings() {
    const provId=document.getElementById('settings-provider').value; const key=document.getElementById('settings-api-key').value.trim();
    global.provider=provId; if(key) global.apiKeys[provId]=key;
    global.model=document.getElementById('settings-model').value; global.contextLimit=parseInt(document.getElementById('settings-context').value);
    if(provId==='custom'){global.customEndpoint=document.getElementById('settings-custom-endpoint').value.trim();global.customModelName=document.getElementById('settings-custom-model').value.trim();global.model=global.customModelName;}
    global.bsModel=''; saveGlobal(); updateGauges(); closeSettingsModal();
    if(global.brainstormOpen) populateBsModelSelect();
    showToast(`Saved — using ${PROVIDERS[provId]?.name||provId}`);
  }

  function clearKey() { if(!confirm('Clear all API keys?')) return; global.apiKeys={}; localStorage.removeItem(KEYS_KEY); closeSettingsModal(); showSetup(); }

  // ═══════════════════════════════════════════════════════════════════════════
  // MODALS
  // ═══════════════════════════════════════════════════════════════════════════

  function openModal(id) { document.getElementById(id).classList.add('open'); }
  function closeModal(e) { if(e.target.classList.contains('modal-overlay')) e.target.classList.remove('open'); }
  function closeCharModal()      { document.getElementById('char-modal').classList.remove('open'); }
  function closeEventModal()     { document.getElementById('event-modal').classList.remove('open'); }
  function closeSettingsModal()  { document.getElementById('settings-modal').classList.remove('open'); }
  function closeDuplicateModal() { document.getElementById('duplicate-modal').classList.remove('open'); }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  function esc(str) { return (str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function showToast(msg) {
    const old=document.getElementById('sw-toast'); if(old) old.remove();
    const t=document.createElement('div'); t.id='sw-toast'; t.textContent=msg;
    t.style.cssText='position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--surface2);color:var(--text);border:1px solid var(--border-bright);padding:.5rem 1.25rem;border-radius:20px;font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;z-index:9999;animation:fade-in .2s ease;font-family:var(--font-ui);white-space:nowrap;';
    document.body.appendChild(t); setTimeout(()=>t.remove(),2500);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════════

  return {
    init, saveKey, showDemo, switchTab,
    // Campaign panel
    toggleCampaignPanel, switchCampaign, newCampaign, deleteCampaign,
    openDuplicateModal, closeDuplicateModal, confirmDuplicate,
    // Story
    sendMessage, handleInputKey, toggleOOC, editBlock,
    // Export
    exportStory,
    // Brainstorm
    toggleBrainstorm, sendBrainstorm, handleBsKey, clearBrainstorm, pinToStory, saveBsModel,
    // Campaign tools
    summarizeCampaign,
    // Characters
    addCharacter, editCharacter, saveCharacter, deleteCharacter,
    // World / Narrator / Events
    saveWorld, saveNarrator,
    addEvent, saveEvent, renderEvents,
    // Settings
    showSettings, saveSettings, clearKey,
    // Modals
    closeModal, closeCharModal, closeEventModal, closeSettingsModal,
    updateSetupForProvider, updateSettingsForProvider,
  };

})();

document.addEventListener('DOMContentLoaded', App.init);

/* ============================================
   STORYWEAVER — Application Logic
   Context management, narrative engine, state
   ============================================ */

const App = (() => {

  // ─── STATE ────────────────────────────────────────────────────────────────

  const STATE_KEY = 'sw_state_v1';
  const KEY_KEY   = 'sw_apikey_v1';

  let state = {
    apiKey: '',
    model: 'claude-sonnet-4-20250514',
    contextLimit: 200000,
    campaignName: 'My Campaign',

    // World
    world: {
      name: '',
      overview: '',
      geography: '',
      rules: '',
      tone: '',
      lore: ''
    },

    // Narrator
    narrator: {
      voice: 'second',
      style: 'literary',
      pacing: 'balanced',
      risk: 'high',
      content: 'general',
      custom: '',
      pcName: '',
      pcDesc: ''
    },

    // Characters (up to 24)
    characters: [],

    // Events
    worldEvents: [],
    storyEvents: [],

    // Conversation
    messages: [],         // Full message history sent to API
    displayMessages: [],  // What's shown to user
    turnCount: 0,

    // Token tracking
    totalTokensUsed: 0,
    lastInputTokens: 0,
    lastOutputTokens: 0,

    // Internal
    editingCharId: null,
    editingEventType: null,
    pendingEventType: null,
  };

  // ─── INIT ─────────────────────────────────────────────────────────────────

  function init() {
    loadState();
    if (state.apiKey) {
      showMain();
    } else {
      showSetup();
    }
    bindWorldWordCount();
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        state = { ...state, ...saved };
      }
      const key = localStorage.getItem(KEY_KEY);
      if (key) state.apiKey = key;
    } catch(e) {
      console.warn('State load error', e);
    }
  }

  function saveState() {
    try {
      const toSave = { ...state };
      delete toSave.apiKey; // Key saved separately
      localStorage.setItem(STATE_KEY, JSON.stringify(toSave));
      if (state.apiKey) localStorage.setItem(KEY_KEY, state.apiKey);
    } catch(e) {
      console.warn('State save error', e);
    }
  }

  // ─── SCREENS ──────────────────────────────────────────────────────────────

  function showSetup() {
    document.getElementById('setup-screen').classList.add('active');
    document.getElementById('main-screen').classList.remove('active');
  }

  function showMain() {
    document.getElementById('setup-screen').classList.remove('active');
    document.getElementById('main-screen').classList.add('active');
    renderAll();
  }

  function saveKey() {
    const key = document.getElementById('api-key-input').value.trim();
    if (!key.startsWith('sk-ant-')) {
      alert('Please enter a valid Anthropic API key (starts with sk-ant-)');
      return;
    }
    state.apiKey = key;
    saveState();
    showMain();
  }

  function showDemo() {
    state.apiKey = 'DEMO';
    showMain();
  }

  // ─── TABS ─────────────────────────────────────────────────────────────────

  function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    document.querySelectorAll('.tab-content').forEach(c => {
      c.classList.toggle('active', c.id === `tab-${tab}`);
    });
  }

  // ─── CONTEXT BUILDER ──────────────────────────────────────────────────────
  // This is the core of the "apparently" prevention system.
  // State is maintained externally and injected fresh each turn.

  function buildSystemPrompt() {
    const n = state.narrator;
    const w = state.world;

    const voiceMap = {
      second: 'second person ("you")',
      third: 'third person ("she/he/they")',
      first: 'first person ("I")'
    };

    const styleGuide = {
      literary: 'Rich, layered, evocative prose. Dwell in sensory detail and subtext.',
      terse: 'Sharp and spare. Short sentences. Kinetic energy. No waste.',
      pulp: 'Fast-paced, visceral, plot-driven. Keep the reader turning pages.',
      lyrical: 'Poetic and sensory. Prioritize emotional and atmospheric resonance.',
      grounded: 'Realistic and observational. Character interiority over spectacle.'
    };

    const riskGuide = {
      high: 'Embrace dramatic risk. Let consequences be real. Allow NPCs to act against the player\'s interests when their motivations demand it. Introduce complications, reversals, and surprises. Avoid the comfortable choice when a harder truth serves the story better.',
      medium: 'Balance tension with resolution. Allow meaningful conflict but ensure narrative momentum.',
      low: 'Prefer resolution. Guide the story toward satisfying outcomes while maintaining stakes.'
    };

    // Active characters only (full core block)
    const activeChars = state.characters.filter(c => c.presence === 'active');
    const nearbyChars = state.characters.filter(c => c.presence === 'nearby');
    const offstageChars = state.characters.filter(c => c.presence === 'offstage');

    let charSection = '';

    if (activeChars.length > 0) {
      charSection += '\n\n## CHARACTERS IN THIS SCENE\n';
      activeChars.forEach(c => {
        charSection += `\n### ${c.name}`;
        if (c.archetype) charSection += ` — ${c.archetype}`;
        charSection += '\n';
        if (c.voice) charSection += `Voice: ${c.voice}\n`;
        if (c.motivation) charSection += `Motivation: ${c.motivation}\n`;
        if (c.wound) charSection += `Core wound/secret: ${c.wound}\n`;
        if (c.state) charSection += `Current state: ${c.state}\n`;
        if (c.disposition) charSection += `Disposition toward player: ${c.disposition}\n`;
        if (c.agenda) charSection += `Active agenda: ${c.agenda}\n`;
        if (c.relationships) charSection += `Relationships: ${c.relationships}\n`;
      });
    }

    if (nearbyChars.length > 0) {
      charSection += '\n## CHARACTERS NEARBY (may enter scene)\n';
      nearbyChars.forEach(c => {
        charSection += `- ${c.name}: ${c.archetype || ''} | ${c.state || 'no current state noted'}\n`;
      });
    }

    if (offstageChars.length > 0) {
      charSection += '\n## KNOWN CHARACTERS (offstage)\n';
      offstageChars.forEach(c => {
        charSection += `- ${c.name}${c.archetype ? ` (${c.archetype})` : ''}\n`;
      });
    }

    // World state
    let worldSection = '';
    if (w.name || w.overview) {
      worldSection = '\n\n## WORLD\n';
      if (w.name) worldSection += `Setting: ${w.name}\n`;
      if (w.overview) worldSection += `\n${w.overview}\n`;
      if (w.tone) worldSection += `\nAtmosphere: ${w.tone}\n`;
      if (w.rules) worldSection += `\nRules/Systems: ${w.rules}\n`;
    }

    // Player character
    let pcSection = '';
    if (n.pcName || n.pcDesc) {
      pcSection = '\n\n## PLAYER CHARACTER\n';
      if (n.pcName) pcSection += `Name: ${n.pcName}\n`;
      if (n.pcDesc) pcSection += `${n.pcDesc}\n`;
    }

    // Recent events context
    let eventsSection = '';
    const recentWorldEvents = state.worldEvents.filter(e => e.sig === 'major').slice(0, 5);
    const recentStoryEvents = state.storyEvents.slice(-8);

    if (recentWorldEvents.length > 0 || recentStoryEvents.length > 0) {
      eventsSection = '\n\n## STORY CONTEXT\n';
      if (recentWorldEvents.length > 0) {
        eventsSection += 'World events:\n';
        recentWorldEvents.forEach(e => {
          eventsSection += `- ${e.title}: ${e.desc}\n`;
        });
      }
      if (recentStoryEvents.length > 0) {
        eventsSection += 'Recent story beats:\n';
        recentStoryEvents.forEach(e => {
          eventsSection += `- ${e.title}: ${e.desc}\n`;
        });
      }
    }

    const prompt = `You are a narrative AI running a collaborative, choose-your-own-adventure roleplay. You are the narrator and author — never break character to speak as an AI.

## NARRATIVE DIRECTIVES
- Write in ${voiceMap[n.voice] || 'second person'}.
- Style: ${styleGuide[n.style] || styleGuide.literary}
- Pacing: ${n.pacing === 'slow' ? 'Deliberate — dwell in moments' : n.pacing === 'fast' ? 'Urgent — lean and kinetic' : 'Balanced — scene and action in proportion'}.
- Risk level: ${riskGuide[n.risk] || riskGuide.high}
- ${n.content === 'explicit' ? 'Explicit content is permitted.' : n.content === 'mature' ? 'Mature themes are permitted. Suggest rather than depict explicit content.' : 'Keep content suitable for general audiences.'}

## ANTI-DRIFT RULES (critical)
- NEVER use the word "apparently" — this is a sign of context degradation. If uncertain, write confidently from established facts or say nothing.
- Maintain character voices EXACTLY as defined. Do not let characters drift toward a generic helpful/neutral tone.
- Track what has been established as fact. Do not contradict prior events.
- Each NPC pursues their own agenda. They are not here to serve the player — they have their own needs, fears, and plans.
- End responses with an open story moment, not a question to the player. Let the world breathe.
${n.custom ? `\n## ADDITIONAL NARRATOR NOTES\n${n.custom}` : ''}
${worldSection}${pcSection}${charSection}${eventsSection}`;

    return prompt;
  }

  function estimateTokens(text) {
    // Rough estimate: ~4 chars per token for English prose
    return Math.ceil((text || '').length / 4);
  }

  function getTotalContextTokens() {
    const sysPrompt = buildSystemPrompt();
    const sysTokens = estimateTokens(sysPrompt);
    const historyTokens = state.messages.reduce((sum, m) => {
      const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
      return sum + estimateTokens(content);
    }, 0);
    return sysTokens + historyTokens;
  }

  // ─── CONTEXT COMPRESSION ──────────────────────────────────────────────────
  // When conversation history grows large, compress older turns into a summary
  // This prevents "apparently" syndrome and context overflow

  async function compressHistoryIfNeeded() {
    const currentTokens = getTotalContextTokens();
    const threshold = state.contextLimit * 0.65; // Compress at 65% capacity

    if (currentTokens < threshold) return;
    if (state.messages.length < 10) return;

    console.log(`Compressing context: ${currentTokens} tokens exceeds threshold`);

    // Take first 60% of messages to compress
    const cutoff = Math.floor(state.messages.length * 0.5);
    const toCompress = state.messages.slice(0, cutoff);
    const toKeep = state.messages.slice(cutoff);

    // Build compression request
    const compressionPrompt = `Summarize the following story conversation into a compact narrative summary that preserves:
- Key events that occurred and their outcomes
- How character relationships have changed
- Important decisions made and their consequences  
- Any new world facts established
- The emotional arc so far

Write as a brief, factual summary (under 400 words). Do not use the word "apparently".

CONVERSATION:
${toCompress.map(m => `${m.role.toUpperCase()}: ${typeof m.content === 'string' ? m.content : m.content[0]?.text || ''}`).join('\n\n')}`;

    try {
      const response = await callAPI([{ role: 'user', content: compressionPrompt }], 
        'You are a story summarizer. Be factual and concise.', 600);
      
      if (response && response.summary) {
        // Replace compressed messages with summary injection
        const summaryMessage = {
          role: 'user',
          content: `[STORY SUMMARY — events before this point]: ${response.summary}`
        };
        const summaryAck = {
          role: 'assistant',
          content: 'Understood. I have the story context.'
        };
        
        state.messages = [summaryMessage, summaryAck, ...toKeep];

        // Log compression as a story event
        autoLogEvent('Context compressed — story summary created', response.summary);
        saveState();
      }
    } catch(e) {
      console.warn('Compression failed, continuing without:', e);
    }
  }

  // ─── API CALL ─────────────────────────────────────────────────────────────

  async function callAPI(messages, systemPrompt, maxTokens = 1000) {
    if (state.apiKey === 'DEMO') {
      return {
        text: '[Demo mode — enter a real API key in Settings to enable AI responses.]\n\nYou stand at the threshold of your story. The world waits, patient and full of shadow.',
        summary: 'Demo mode active.',
        inputTokens: 0,
        outputTokens: 0
      };
    }

    const body = {
      model: state.model,
      max_tokens: maxTokens,
      system: systemPrompt || buildSystemPrompt(),
      messages: messages
    };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': state.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `API error ${response.status}`);
    }

    const data = await response.json();
    const text = data.content?.map(c => c.text || '').join('') || '';
    const inputTokens = data.usage?.input_tokens || 0;
    const outputTokens = data.usage?.output_tokens || 0;

    return { text, inputTokens, outputTokens };
  }

  // ─── SEND MESSAGE ─────────────────────────────────────────────────────────

  async function sendMessage() {
    const input = document.getElementById('player-input');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    input.style.height = 'auto';

    // Disable send button
    const sendBtn = document.getElementById('send-btn');
    sendBtn.disabled = true;

    // Add player message to display
    state.turnCount++;
    addDisplayMessage('player', text);
    document.getElementById('turn-count').textContent = `Turn ${state.turnCount}`;

    // Add to API history
    state.messages.push({ role: 'user', content: text });

    // Show typing indicator
    const typingEl = showTyping();

    try {
      // Compress if needed before sending
      await compressHistoryIfNeeded();

      // Call API
      const result = await callAPI(state.messages);

      // Remove typing
      typingEl.remove();

      // Add assistant response to histories
      state.messages.push({ role: 'assistant', content: result.text });
      addDisplayMessage('narrator', result.text);

      // Update token tracking
      state.totalTokensUsed += (result.inputTokens + result.outputTokens);
      state.lastInputTokens = result.inputTokens;
      state.lastOutputTokens = result.outputTokens;

      // Update gauges
      updateGauges();

      // Auto-detect significant moments (simple heuristic)
      autoDetectEvents(text, result.text);

      saveState();

    } catch(e) {
      typingEl.remove();
      addDisplayMessage('narrator', `[Error: ${e.message}]`);
      // Remove the failed user message from API history
      state.messages.pop();
    }

    sendBtn.disabled = false;
    scrollToBottom();
  }

  function handleInputKey(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  // ─── DISPLAY ──────────────────────────────────────────────────────────────

  function addDisplayMessage(role, content) {
    state.displayMessages.push({ role, content, turn: state.turnCount });
    renderDisplayMessage(role, content);
    scrollToBottom();
  }

  function renderDisplayMessage(role, content) {
    const output = document.getElementById('story-output');

    // Clear welcome if first message
    const welcome = output.querySelector('.story-welcome');
    if (welcome) welcome.remove();

    const block = document.createElement('div');
    block.className = `story-block ${role}`;

    const meta = document.createElement('div');
    meta.className = 'block-meta';
    meta.textContent = role === 'narrator' ? 'Narrator' : (state.narrator.pcName || 'You');

    const content_el = document.createElement('div');
    content_el.className = 'block-content';
    content_el.textContent = content; // Safe text, no HTML injection

    block.appendChild(meta);
    block.appendChild(content_el);
    output.appendChild(block);
  }

  function showTyping() {
    const output = document.getElementById('story-output');
    const el = document.createElement('div');
    el.className = 'typing-indicator';
    el.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    output.appendChild(el);
    scrollToBottom();
    return el;
  }

  function scrollToBottom() {
    const output = document.getElementById('story-output');
    output.scrollTop = output.scrollHeight;
  }

  function updateGauges() {
    // Token usage gauge (session total, max shown = 500k)
    const tokenMax = 500000;
    const tokenPct = Math.min((state.totalTokensUsed / tokenMax) * 100, 100);
    document.getElementById('token-bar').style.width = `${tokenPct}%`;
    const tv = state.totalTokensUsed;
    document.getElementById('token-val').textContent = tv > 1000 ? `${(tv/1000).toFixed(1)}k` : tv;
    if (tokenPct > 80) document.getElementById('token-bar').classList.add('warn');

    // Context window gauge
    const contextTokens = getTotalContextTokens();
    const contextPct = Math.min((contextTokens / state.contextLimit) * 100, 100);
    const ctxBar = document.getElementById('context-bar');
    ctxBar.style.width = `${contextPct}%`;
    document.getElementById('context-val').textContent = `${Math.round(contextPct)}%`;
    ctxBar.classList.toggle('warn', contextPct > 75);
  }

  function renderSceneChips() {
    const container = document.getElementById('scene-chips');
    const active = state.characters.filter(c => c.presence === 'active');
    container.innerHTML = '';
    active.forEach(c => {
      const chip = document.createElement('div');
      chip.className = 'scene-chip';
      const dot = document.createElement('div');
      const disp = c.disposition || 'neutral';
      dot.className = `chip-dot ${disp === 'hostile' ? 'hostile' : disp === 'trusting' || disp === 'friendly' ? '' : 'neutral'}`;
      const label = document.createElement('span');
      label.textContent = c.name;
      chip.appendChild(dot);
      chip.appendChild(label);
      container.appendChild(chip);
    });
  }

  function renderAll() {
    renderCharRoster();
    renderWorldForm();
    renderNarratorForm();
    renderEvents();
    renderSceneChips();
    updateGauges();

    // Restore display messages
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
    state.editingCharId = null;
    clearCharModal();
    document.getElementById('modal-title').textContent = 'Add Character';
    openModal('char-modal');
  }

  function editCharacter(id) {
    const char = state.characters.find(c => c.id === id);
    if (!char) return;
    state.editingCharId = id;
    document.getElementById('modal-title').textContent = 'Edit Character';
    document.getElementById('char-name').value = char.name || '';
    document.getElementById('char-archetype').value = char.archetype || '';
    document.getElementById('char-voice').value = char.voice || '';
    document.getElementById('char-motivation').value = char.motivation || '';
    document.getElementById('char-wound').value = char.wound || '';
    document.getElementById('char-disposition').value = char.disposition || 'neutral';
    document.getElementById('char-state').value = char.state || '';
    document.getElementById('char-agenda').value = char.agenda || '';
    document.getElementById('char-presence').value = char.presence || 'offstage';
    document.getElementById('char-canon').value = char.canon || '';
    document.getElementById('char-backstory').value = char.backstory || '';
    document.getElementById('char-relationships').value = char.relationships || '';
    openModal('char-modal');
  }

  function saveCharacter() {
    const name = document.getElementById('char-name').value.trim();
    if (!name) { alert('Character needs a name.'); return; }

    const char = {
      id: state.editingCharId || `char_${Date.now()}`,
      name,
      archetype: document.getElementById('char-archetype').value.trim(),
      voice: document.getElementById('char-voice').value.trim(),
      motivation: document.getElementById('char-motivation').value.trim(),
      wound: document.getElementById('char-wound').value.trim(),
      disposition: document.getElementById('char-disposition').value,
      state: document.getElementById('char-state').value.trim(),
      agenda: document.getElementById('char-agenda').value.trim(),
      presence: document.getElementById('char-presence').value,
      canon: document.getElementById('char-canon').value.trim(),
      backstory: document.getElementById('char-backstory').value.trim(),
      relationships: document.getElementById('char-relationships').value.trim()
    };

    if (state.editingCharId) {
      const idx = state.characters.findIndex(c => c.id === state.editingCharId);
      if (idx !== -1) state.characters[idx] = char;
    } else {
      if (state.characters.length >= 24) {
        alert('Maximum of 24 named characters reached.');
        return;
      }
      state.characters.push(char);
    }

    saveState();
    renderCharRoster();
    renderSceneChips();
    updateGauges();
    closeCharModal();
  }

  function deleteCharacter(id) {
    if (!confirm('Remove this character?')) return;
    state.characters = state.characters.filter(c => c.id !== id);
    saveState();
    renderCharRoster();
    renderSceneChips();
  }

  function renderCharRoster() {
    const roster = document.getElementById('char-roster');
    if (state.characters.length === 0) {
      roster.innerHTML = `<div class="empty-state"><p>No characters yet.</p><p class="empty-sub">Add NPCs to populate your world. Up to 24 named characters supported.</p></div>`;
      return;
    }

    // Sort: active first, then nearby, then offstage, deceased last
    const order = { active: 0, nearby: 1, offstage: 2, deceased: 3 };
    const sorted = [...state.characters].sort((a,b) => (order[a.presence]||2) - (order[b.presence]||2));

    roster.innerHTML = sorted.map(c => `
      <div class="char-card">
        <div class="char-presence-dot presence-${c.presence || 'offstage'}"></div>
        <div class="char-card-main">
          <div class="char-card-name">${esc(c.name)}</div>
          <div class="char-card-sub">${esc(c.archetype || 'No archetype set')} ${c.voice ? '· ' + esc(c.voice.substring(0,50)) : ''}</div>
          <div class="char-card-tags">
            <span class="char-tag tag-disposition-${c.disposition || 'neutral'}">${c.disposition || 'neutral'}</span>
            ${c.canon ? `<span class="char-tag" style="background:rgba(76,122,201,0.15);color:var(--blue)">Canon: ${esc(c.canon)}</span>` : ''}
            <span class="char-tag" style="background:var(--surface2);color:var(--text-muted)">${c.presence || 'offstage'}</span>
          </div>
        </div>
        <div class="char-card-actions">
          <button class="char-act-btn" onclick="App.editCharacter('${c.id}')">Edit</button>
          <button class="char-act-btn danger" onclick="App.deleteCharacter('${c.id}')">✕</button>
        </div>
      </div>
    `).join('');
  }

  function clearCharModal() {
    ['char-name','char-archetype','char-voice','char-motivation','char-wound',
     'char-state','char-agenda','char-canon','char-backstory','char-relationships'].forEach(id => {
      document.getElementById(id).value = '';
    });
    document.getElementById('char-disposition').value = 'neutral';
    document.getElementById('char-presence').value = 'offstage';
  }

  // ─── WORLD ────────────────────────────────────────────────────────────────

  function renderWorldForm() {
    document.getElementById('world-name').value = state.world.name || '';
    document.getElementById('world-overview').value = state.world.overview || '';
    document.getElementById('world-geo').value = state.world.geography || '';
    document.getElementById('world-rules').value = state.world.rules || '';
    document.getElementById('world-tone').value = state.world.tone || '';
    document.getElementById('world-lore').value = state.world.lore || '';
    updateWorldWordCount();
  }

  function saveWorld() {
    state.world = {
      name: document.getElementById('world-name').value.trim(),
      overview: document.getElementById('world-overview').value.trim(),
      geography: document.getElementById('world-geo').value.trim(),
      rules: document.getElementById('world-rules').value.trim(),
      tone: document.getElementById('world-tone').value.trim(),
      lore: document.getElementById('world-lore').value.trim()
    };
    saveState();
    updateGauges();
    showToast('World saved');
  }

  function bindWorldWordCount() {
    const el = document.getElementById('world-overview');
    if (el) el.addEventListener('input', updateWorldWordCount);
  }

  function updateWorldWordCount() {
    const el = document.getElementById('world-overview');
    const count = document.getElementById('world-overview-count');
    if (!el || !count) return;
    const words = el.value.trim() ? el.value.trim().split(/\s+/).length : 0;
    count.textContent = `${words} / 300 words recommended`;
    count.style.color = words > 300 ? 'var(--red)' : 'var(--text-muted)';
  }

  // ─── NARRATOR ─────────────────────────────────────────────────────────────

  function renderNarratorForm() {
    const n = state.narrator;
    document.getElementById('narrator-voice').value = n.voice || 'second';
    document.getElementById('narrator-style').value = n.style || 'literary';
    document.getElementById('narrator-pacing').value = n.pacing || 'balanced';
    document.getElementById('narrator-risk').value = n.risk || 'high';
    document.getElementById('narrator-content').value = n.content || 'general';
    document.getElementById('narrator-custom').value = n.custom || '';
    document.getElementById('pc-name').value = n.pcName || '';
    document.getElementById('pc-desc').value = n.pcDesc || '';
  }

  function saveNarrator() {
    state.narrator = {
      voice: document.getElementById('narrator-voice').value,
      style: document.getElementById('narrator-style').value,
      pacing: document.getElementById('narrator-pacing').value,
      risk: document.getElementById('narrator-risk').value,
      content: document.getElementById('narrator-content').value,
      custom: document.getElementById('narrator-custom').value.trim(),
      pcName: document.getElementById('pc-name').value.trim(),
      pcDesc: document.getElementById('pc-desc').value.trim()
    };
    saveState();
    showToast('Narrator settings saved');
  }

  // ─── EVENTS ───────────────────────────────────────────────────────────────

  function addEvent(type) {
    state.pendingEventType = type || 'world';
    document.getElementById('event-modal-title').textContent = 
      (state.pendingEventType === 'world') ? 'Add World Event' : 'Add Story Event';
    document.getElementById('event-title').value = '';
    document.getElementById('event-desc').value = '';
    document.getElementById('event-sig').value = 'significant';
    openModal('event-modal');
  }

  function saveEvent() {
    const title = document.getElementById('event-title').value.trim();
    if (!title) { alert('Event needs a title.'); return; }

    const event = {
      id: `evt_${Date.now()}`,
      title,
      desc: document.getElementById('event-desc').value.trim(),
      sig: document.getElementById('event-sig').value,
      created: new Date().toISOString()
    };

    if (state.pendingEventType === 'world') {
      state.worldEvents.push(event);
    } else {
      state.storyEvents.push(event);
    }

    saveState();
    renderEvents();
    closeEventModal();
  }

  function autoLogEvent(title, desc) {
    state.storyEvents.push({
      id: `evt_${Date.now()}`,
      title,
      desc: desc.substring(0, 300),
      sig: 'minor',
      created: new Date().toISOString(),
      auto: true
    });
    renderEvents();
  }

  function autoDetectEvents(playerText, narratorText) {
    // Heuristic: look for significant narrative keywords to auto-log
    const combined = (playerText + ' ' + narratorText).toLowerCase();
    const significant = ['died', 'killed', 'betrayed', 'revealed', 'discovered', 'escaped', 
                         'captured', 'sworn', 'promised', 'arrived', 'destroyed', 'found'];
    const found = significant.filter(w => combined.includes(w));
    if (found.length >= 2) {
      const preview = narratorText.substring(0, 150).replace(/\n/g, ' ');
      autoLogEvent(`Turn ${state.turnCount} — notable moment`, preview);
    }
  }

  function renderEvents() {
    renderEventList('world-events-list', state.worldEvents, 'world');
    renderEventList('story-events-list', state.storyEvents, 'story');
  }

  function renderEventList(containerId, events, type) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (events.length === 0) {
      el.innerHTML = type === 'world'
        ? '<div class="empty-state"><p>No world events yet.</p><p class="empty-sub">Add events that exist before play begins.</p></div>'
        : '<div class="empty-state"><p>No story events yet.</p><p class="empty-sub">Significant moments will appear here.</p></div>';
      return;
    }
    const recent = [...events].reverse().slice(0, 20);
    el.innerHTML = recent.map(e => `
      <div class="event-card event-sig-${e.sig}">
        <div class="event-card-title">${esc(e.title)}</div>
        ${e.desc ? `<div class="event-card-desc">${esc(e.desc)}</div>` : ''}
      </div>
    `).join('');
  }

  // ─── SETTINGS ─────────────────────────────────────────────────────────────

  function showSettings() {
    document.getElementById('settings-api-key').value = state.apiKey === 'DEMO' ? '' : state.apiKey;
    document.getElementById('settings-model').value = state.model;
    document.getElementById('settings-context').value = state.contextLimit;
    document.getElementById('settings-campaign').value = state.campaignName;
    openModal('settings-modal');
  }

  function saveSettings() {
    const key = document.getElementById('settings-api-key').value.trim();
    if (key) state.apiKey = key;
    state.model = document.getElementById('settings-model').value;
    state.contextLimit = parseInt(document.getElementById('settings-context').value);
    state.campaignName = document.getElementById('settings-campaign').value.trim();
    saveState();
    updateGauges();
    closeSettingsModal();
    showToast('Settings saved');
  }

  function clearKey() {
    if (!confirm('Clear your API key? You will need to re-enter it.')) return;
    state.apiKey = '';
    localStorage.removeItem(KEY_KEY);
    closeSettingsModal();
    showSetup();
  }

  function newCampaign() {
    if (!confirm('Start a new campaign? Current story, messages and events will be cleared. Characters and world settings will be kept.')) return;
    state.messages = [];
    state.displayMessages = [];
    state.turnCount = 0;
    state.totalTokensUsed = 0;
    state.storyEvents = [];
    saveState();

    const output = document.getElementById('story-output');
    output.innerHTML = `<div class="story-welcome">
      <div class="welcome-glyph">⟁</div>
      <h2>New campaign begun.</h2>
      <p>Your world and characters are ready. Where does the story start?</p>
    </div>`;

    document.getElementById('turn-count').textContent = 'Turn 0';
    updateGauges();
    renderEvents();
    switchTab('play');
  }

  function resetCampaign() {
    if (!confirm('Reset EVERYTHING? This will clear all story data, characters, world, and events.')) return;
    localStorage.removeItem(STATE_KEY);
    location.reload();
  }

  // ─── MODALS ───────────────────────────────────────────────────────────────

  function openModal(id) {
    document.getElementById(id).classList.add('open');
  }

  function closeModal(event) {
    if (event.target.classList.contains('modal-overlay')) {
      event.target.classList.remove('open');
    }
  }

  function closeCharModal() {
    document.getElementById('char-modal').classList.remove('open');
  }

  function closeEventModal() {
    document.getElementById('event-modal').classList.remove('open');
  }

  function closeSettingsModal() {
    document.getElementById('settings-modal').classList.remove('open');
  }

  // ─── UTILITIES ────────────────────────────────────────────────────────────

  function esc(str) {
    return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function showToast(msg) {
    const existing = document.getElementById('sw-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.id = 'sw-toast';
    toast.textContent = msg;
    toast.style.cssText = `
      position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
      background: var(--surface2); color: var(--text); border: 1px solid var(--border-bright);
      padding: 0.5rem 1.25rem; border-radius: 20px; font-size: 0.75rem;
      letter-spacing: 0.08em; text-transform: uppercase; z-index: 999;
      animation: fade-in 0.2s ease; font-family: var(--font-ui);
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }

  // ─── PUBLIC API ───────────────────────────────────────────────────────────

  return {
    init,
    saveKey,
    showDemo,
    switchTab,
    sendMessage,
    handleInputKey,
    addCharacter,
    editCharacter,
    saveCharacter,
    deleteCharacter,
    saveWorld,
    saveNarrator,
    addEvent,
    saveEvent,
    renderEvents,
    showSettings,
    saveSettings,
    clearKey,
    newCampaign,
    resetCampaign,
    closeModal,
    closeCharModal,
    closeEventModal,
    closeSettingsModal,
  };

})();

// Boot
document.addEventListener('DOMContentLoaded', App.init);

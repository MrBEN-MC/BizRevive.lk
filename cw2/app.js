/**
 * BizRevive LK – AI Business Recovery Advisor
 * app.js – Main application logic
 *
 * Features:
 * - Multi-provider support: Google Gemini, OpenAI ChatGPT, DeepSeek
 * - Sri Lanka city & district context
 * - Business category awareness (collected via chat)
 * - Online business lookup via AI search capabilities
 * - Markdown rendering
 * - Persistent chat history & settings
 * - AI-generated chat titles
 * - Share chat functionality
 */

// ── Configuration ────────────────────────────────────────────────
const DEFAULTS = {
  PROVIDER:       'google',
  API_KEY_GOOGLE: 'AIzaSyDRFOszKO4kySI0s5aHUfDFjX6lRDtfGNw',
  API_KEY_OPENAI: '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',
  API_KEY_DEEPSEEK: 'sk-008fd008cfd94f53a9d2f05bb43391a5',
  MODEL_GOOGLE:   'gemini-2.5-flash',
  MODEL_OPENAI:   'gpt-4o',
  MODEL_DEEPSEEK: 'deepseek-chat',
};

const PROVIDERS = {
  google: {
    name: 'Google Gemini',
    models: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
      { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite' },
    ],
    getEndpoint: (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
  },
  openai: {
    name: 'OpenAI ChatGPT',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    ],
    endpoint: 'https://api.openai.com/v1/chat/completions'
  },
  deepseek: {
    name: 'DeepSeek AI',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat' },
      { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner' },
    ],
    endpoint: 'https://api.deepseek.com/chat/completions'
  }
};

const CONFIG = {
  get PROVIDER()       { return localStorage.getItem('brlk_provider')   || DEFAULTS.PROVIDER; },
  get API_KEY() {
    const p = CONFIG.PROVIDER;
    return localStorage.getItem(`brlk_api_key_${p}`) || DEFAULTS[`API_KEY_${p.toUpperCase()}`];
  },
  get MODEL() {
    const p = CONFIG.PROVIDER;
    return localStorage.getItem(`brlk_model_${p}`) || DEFAULTS[`MODEL_${p.toUpperCase()}`];
  },
  MAX_HISTORY:   20,
  MAX_RETRIES:   2,
  RETRY_BASE_MS: 5000,
  MIN_GAP_MS:    2000,
};

// ── Rate Limiter ──────────────────────────────────────────────────
const RateLimiter = {
  lastRequestAt: 0,
  cooldownTimer: null,

  async throttle() {
    const now = Date.now();
    const elapsed = now - this.lastRequestAt;
    if (elapsed < CONFIG.MIN_GAP_MS) {
      const wait = CONFIG.MIN_GAP_MS - elapsed;
      await new Promise(r => setTimeout(r, wait));
    }
    this.lastRequestAt = Date.now();
  },

  async waitWithCountdown(waitMs, typingLabelEl) {
    const endAt = Date.now() + waitMs;
    const update = () => {
      const remaining = Math.ceil((endAt - Date.now()) / 1000);
      if (typingLabelEl && remaining > 0) {
        typingLabelEl.textContent = `⏳ Rate limit hit — retrying in ${remaining}s…`;
      }
    };
    update();
    this.cooldownTimer = setInterval(update, 1000);
    await new Promise(r => setTimeout(r, waitMs));
    clearInterval(this.cooldownTimer);
    this.cooldownTimer = null;
    if (typingLabelEl) typingLabelEl.textContent = 'BizRevive LK is thinking…';
  },
};

// ── State ─────────────────────────────────────────────────────────
const STATE = {
  chatHistory: [],         // [{role, parts:[{text}]}]
  currentSessionId: null,  // active session key in localStorage
  city: '',
  category: '',
  businessName: '',
  isLoading: false,
  sidebarOpen: true,
  isMobile: window.innerWidth <= 768,
  hasAITitle: false,
};

// ── Session Storage Helpers ───────────────────────────────────────
const Sessions = {
  KEY: 'brlk_sessions',

  load() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || []; }
    catch { return []; }
  },

  save(sessions) {
    localStorage.setItem(this.KEY, JSON.stringify(sessions));
  },

  saveCurrentSession(title, messages) {
    const sessions = this.load();
    const id = STATE.currentSessionId || `s_${Date.now()}`;
    STATE.currentSessionId = id;
    const idx = sessions.findIndex(s => s.id === id);
    const record = { id, title: title || 'Chat ' + new Date().toLocaleString(), ts: Date.now(), messages };
    if (idx >= 0) {
      // Don't overwrite AI title with a generic one
      if (sessions[idx].hasAITitle && !record.hasAITitle) {
        record.title = sessions[idx].title;
        record.hasAITitle = true;
      }
      sessions[idx] = record;
    }
    else sessions.unshift(record);
    this.save(sessions.slice(0, 30));
    renderHistoryList();
  },

  updateTitle(id, newTitle) {
    const sessions = this.load();
    const idx = sessions.findIndex(s => s.id === id);
    if (idx >= 0) {
      sessions[idx].title = newTitle;
      sessions[idx].hasAITitle = true;
      this.save(sessions);
      renderHistoryList();
    }
  },

  deleteAll() {
    localStorage.removeItem(this.KEY);
    renderHistoryList();
  },

  delete(id) {
    const sessions = this.load().filter(s => s.id !== id);
    this.save(sessions);
    renderHistoryList();
  },
};

// ── System Prompt ─────────────────────────────────────────────────
function buildSystemPrompt() {
  const cityCtx    = STATE.city       ? `The user's business is located in **${STATE.city}**, Sri Lanka.` : 'The user has not specified their city yet.';
  const catCtx     = STATE.category   ? `The business category is **${STATE.category}**.` : 'The business category is not yet specified.';
  const bizCtx     = STATE.businessName ? `The business name is **"${STATE.businessName}"**. Search for this online.` : '';

  return `You are **BizRevive LK**, an expert AI business advisor specialised in helping Sri Lankan businesses overcome difficulties, recover from losses, and grow sustainably.

## Your Goal in This Phase:
If the user hasn't provided their city, business category, or business name yet, your priority is to collect this information naturally in the conversation while acknowledging their problems.

## Your Core Expertise:
- Sri Lanka economic context (post-2022 crisis recovery, inflation, forex issues)
- Local market dynamics for all 9 provinces and major districts
- Sri Lanka-specific funding: NSB, BOC, DFCC, NDB, HNB, Sampath, RDB, EDB
- Digital marketing (FB/WhatsApp/TikTok dominant in LK)
- Legal: Business Registration, Sole Proprietorship, BOI

## How You Respond:
1. **Always acknowledge the user's situation.**
2. **If info is missing**, ask for it politely.
3. **Use structured formatting** (bullet points, headers).
4. **Language mix**: English with natural Sinhala/Tamil terms.

${cityCtx}
${catCtx}
${bizCtx}`;
}

// ── DOM References ─────────────────────────────────────────────────
let DOM = {};

function cacheDom() {
  DOM = {
    loadingScreen:      document.getElementById('loading-screen'),
    app:                document.getElementById('app'),
    sidebar:            document.getElementById('sidebar'),
    quickChips:         document.getElementById('quick-chips'),
    newChatBtn:         document.getElementById('new-chat-btn'),
    sidebarOpenBtn:     document.getElementById('sidebar-open-btn'),
    sidebarCloseBtn:    document.getElementById('sidebar-close-btn'),
    messagesContainer:  document.getElementById('messages-container'),
    welcomeScreen:      document.getElementById('welcome-screen'),
    contextLabel:       document.getElementById('context-label'),
    userInput:          document.getElementById('user-input'),
    sendBtn:            document.getElementById('send-btn'),
    statusDot:          document.getElementById('status-dot'),
    statusText:         document.getElementById('status-text'),
    topbarNewChatBtn:   document.getElementById('topbar-new-chat'),
    shareBtn:           document.getElementById('share-btn'),
    // Settings
    settingsBtn:        document.getElementById('settings-btn'),
    settingsModal:      document.getElementById('settings-modal'),
    settingsCloseBtn:   document.getElementById('settings-close-btn'),
    settingProvider:    document.getElementById('setting-provider'),
    settingApiKeyGoogle: document.getElementById('setting-api-key-google'),
    settingApiKeyOpenai: document.getElementById('setting-api-key-openai'),
    settingApiKeyDeepseek: document.getElementById('setting-api-key-deepseek'),
    settingModel:       document.getElementById('setting-model'),
    saveSettingsBtn:    document.getElementById('save-settings-btn'),
    resetSettingsBtn:   document.getElementById('reset-settings-btn'),
    // History
    historyList:        document.getElementById('history-list'),
    clearHistoryBtn:    document.getElementById('clear-history-btn'),
    noHistoryMsg:       document.getElementById('no-history-msg'),
  };
}

// ── Init ───────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  cacheDom();
  setupEventListeners();
  renderHistoryList();
  updateModelOptions();
  updateSettingsVisibility();

  setTimeout(() => {
    DOM.loadingScreen.classList.add('fade-out');
    setTimeout(() => {
      DOM.loadingScreen.style.display = 'none';
      DOM.app.classList.remove('hidden');
      checkMobile();
    }, 650);
  }, 2400);
});

window.addEventListener('resize', checkMobile);

function checkMobile() {
  STATE.isMobile = window.innerWidth <= 768;
  if (STATE.isMobile) {
    DOM.sidebar.classList.remove('collapsed');
    if (!DOM.sidebar.classList.contains('mobile-open')) {
      DOM.sidebar.style.transform = '';
    }
  } else {
    DOM.sidebar.classList.remove('mobile-open');
    DOM.sidebar.style.transform = '';
    if (STATE.sidebarOpen) {
      DOM.sidebar.classList.remove('collapsed');
    } else {
      DOM.sidebar.classList.add('collapsed');
    }
  }
}

// ── Event Listeners ────────────────────────────────────────────────
function setupEventListeners() {
  DOM.sidebarOpenBtn.addEventListener('click', openSidebar);
  DOM.sidebarCloseBtn.addEventListener('click', closeSidebar);

  DOM.quickChips.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const msg = chip.getAttribute('data-msg');
      sendMessage(msg);
    });
  });

  DOM.newChatBtn.addEventListener('click', resetChat);
  DOM.topbarNewChatBtn.addEventListener('click', resetChat);
  DOM.shareBtn.addEventListener('click', shareChat);

  DOM.sendBtn.addEventListener('click', handleSend);
  DOM.userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  DOM.userInput.addEventListener('input', () => {
    DOM.userInput.style.height = 'auto';
    DOM.userInput.style.height = Math.min(DOM.userInput.scrollHeight, 150) + 'px';
  });

  document.addEventListener('click', (e) => {
    if (STATE.isMobile &&
        DOM.sidebar.classList.contains('mobile-open') &&
        !DOM.sidebar.contains(e.target) &&
        e.target !== DOM.sidebarOpenBtn) {
      closeSidebar();
    }
  });

  DOM.settingsBtn.addEventListener('click', openSettings);
  DOM.settingsCloseBtn.addEventListener('click', closeSettings);
  DOM.settingsModal.addEventListener('click', (e) => {
    if (e.target === DOM.settingsModal) closeSettings();
  });

  DOM.saveSettingsBtn.addEventListener('click', saveSettings);
  DOM.resetSettingsBtn.addEventListener('click', resetSettings);

  DOM.settingProvider.addEventListener('change', () => {
    updateModelOptions();
    updateSettingsVisibility();
  });

  document.querySelectorAll('.btn-toggle-pw').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      const isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';
      btn.textContent = isHidden ? '🙈' : '👁';
    });
  });

  DOM.clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Clear all saved chat history?')) Sessions.deleteAll();
  });
}

function openSidebar() {
  if (STATE.isMobile) {
    DOM.sidebar.classList.add('mobile-open');
  } else {
    DOM.sidebar.classList.remove('collapsed');
    STATE.sidebarOpen = true;
  }
}

function closeSidebar() {
  if (STATE.isMobile) {
    DOM.sidebar.classList.remove('mobile-open');
  } else {
    DOM.sidebar.classList.add('collapsed');
    STATE.sidebarOpen = false;
  }
}

function updateContextLabel() {
  const parts = [];
  if (STATE.city)     parts.push(`📍 ${STATE.city}`);
  if (STATE.category) parts.push(`🏭 ${STATE.category}`);
  if (STATE.businessName) parts.push(`🔍 "${STATE.businessName}"`);
  DOM.contextLabel.textContent = parts.length > 0
    ? parts.join('  ·  ')
    : 'Sri Lanka Business Recovery Advisor';
}

// ── Settings Handlers ─────────────────────────────────────────────
function openSettings() {
  DOM.settingProvider.value = CONFIG.PROVIDER;
  DOM.settingApiKeyGoogle.value = localStorage.getItem('brlk_api_key_google') || (CONFIG.PROVIDER === 'google' ? DEFAULTS.API_KEY_GOOGLE : '');
  DOM.settingApiKeyOpenai.value = localStorage.getItem('brlk_api_key_openai') || DEFAULTS.API_KEY_OPENAI;
  DOM.settingApiKeyDeepseek.value = localStorage.getItem('brlk_api_key_deepseek') || DEFAULTS.API_KEY_DEEPSEEK;
  
  updateModelOptions();
  DOM.settingModel.value = CONFIG.MODEL;
  updateSettingsVisibility();
  DOM.settingsModal.classList.remove('hidden');
}

function updateModelOptions() {
  const provider = DOM.settingProvider.value;
  const models = PROVIDERS[provider].models;
  DOM.settingModel.innerHTML = models.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
}

function updateSettingsVisibility() {
  const provider = DOM.settingProvider.value;
  document.getElementById('group-google').style.display = provider === 'google' ? 'flex' : 'none';
  document.getElementById('group-openai').style.display = provider === 'openai' ? 'flex' : 'none';
  document.getElementById('group-deepseek').style.display = provider === 'deepseek' ? 'flex' : 'none';
}

function closeSettings() {
  DOM.settingsModal.classList.add('hidden');
}

function saveSettings() {
  const provider = DOM.settingProvider.value;
  const keyGoogle = DOM.settingApiKeyGoogle.value.trim();
  const keyOpenai = DOM.settingApiKeyOpenai.value.trim();
  const keyDeepseek = DOM.settingApiKeyDeepseek.value.trim();
  const model = DOM.settingModel.value;

  localStorage.setItem('brlk_provider', provider);
  if (keyGoogle) localStorage.setItem('brlk_api_key_google', keyGoogle);
  if (keyOpenai) localStorage.setItem('brlk_api_key_openai', keyOpenai);
  if (keyDeepseek) localStorage.setItem('brlk_api_key_deepseek', keyDeepseek);
  localStorage.setItem(`brlk_model_${provider}`, model);

  closeSettings();
  showToast('✅ Settings saved!');
}

function resetSettings() {
  localStorage.removeItem('brlk_provider');
  localStorage.removeItem('brlk_api_key_google');
  localStorage.removeItem('brlk_api_key_openai');
  localStorage.removeItem('brlk_api_key_deepseek');
  Object.keys(PROVIDERS).forEach(p => localStorage.removeItem(`brlk_model_${p}`));
  
  openSettings();
  showToast('↩ Reset to defaults');
}

function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 350); }, 2400);
}

// ── Chat History Rendering ────────────────────────────────────────
function renderHistoryList() {
  const sessions = Sessions.load();
  if (!DOM.historyList) return;
  DOM.historyList.innerHTML = '';
  if (sessions.length === 0) {
    DOM.historyList.innerHTML = '<p class="no-history">No saved chats yet.</p>';
    return;
  }
  sessions.forEach(s => {
    const item = document.createElement('div');
    item.className = 'history-item' + (s.id === STATE.currentSessionId ? ' active' : '');
    item.innerHTML = `
      <div class="history-item-body" data-id="${s.id}">
        <span class="history-icon">💬</span>
        <div class="history-text">
          <p class="history-title">${escapeHtml(s.title)}</p>
          <p class="history-date">${new Date(s.ts).toLocaleDateString()}</p>
        </div>
      </div>
      <button class="history-delete" data-id="${s.id}" title="Delete">✕</button>`;

    item.querySelector('.history-item-body').addEventListener('click', () => loadSession(s));
    item.querySelector('.history-delete').addEventListener('click', (e) => {
      e.stopPropagation();
      Sessions.delete(s.id);
    });
    DOM.historyList.appendChild(item);
  });
}

function loadSession(session) {
  STATE.currentSessionId = session.id;
  STATE.chatHistory = session.messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
  STATE.hasAITitle = !!session.hasAITitle;
  DOM.messagesContainer.innerHTML = '';
  session.messages.forEach(m => appendMessage(m.role === 'user' ? 'user' : 'ai', m.text));
  renderHistoryList();
  if (STATE.isMobile) closeSidebar();
}

// ── Chat Management ────────────────────────────────────────────────
function resetChat() {
  STATE.chatHistory = [];
  STATE.currentSessionId = null;
  STATE.city = '';
  STATE.category = '';
  STATE.businessName = '';
  STATE.hasAITitle = false;
  updateContextLabel();

  DOM.messagesContainer.innerHTML = '';
  const welcomeMsg = "🇱🇰 **Ayubowan! Welcome to BizRevive LK.**\n\nI am your AI business recovery advisor. To give you the most accurate advice for your situation, could you please tell me:\n\n1. Which **city or district** is your business in?\n2. What is your **business category**?\n3. What is the **name of your business**? (Optional)";
  
  appendMessage('ai', welcomeMsg);
  STATE.chatHistory.push({ role: 'model', parts: [{ text: welcomeMsg }] });
  renderHistoryList();
}

function handleSend() {
  const text = DOM.userInput.value.trim();
  if (!text || STATE.isLoading) return;
  sendMessage(text);
  DOM.userInput.value = '';
  DOM.userInput.style.height = 'auto';
}

async function sendMessage(text) {
  if (STATE.isLoading) return;
  const welcome = document.getElementById('welcome-screen');
  if (welcome) welcome.remove();

  appendMessage('user', text);

  const inference = InferenceEngine.process(text, {
    city: STATE.city,
    category: STATE.category,
    businessName: STATE.businessName,
  });

  if (inference.action === 'local') {
    const typingEl = showTyping();
    await new Promise(r => setTimeout(r, 600));
    removeTyping(typingEl);
    appendMessage('ai', inference.response);
    STATE.chatHistory.push({ role: 'user',  parts: [{ text }] });
    STATE.chatHistory.push({ role: 'model', parts: [{ text: inference.response }] });
    persistSession(text);
    return;
  }

  STATE.chatHistory.push({ role: 'user', parts: [{ text }] });
  const typingEl = showTyping();
  STATE.isLoading = true;
  DOM.sendBtn.disabled = true;

  try {
    const response = await callAI(text, inference.enrichment || '');
    removeTyping(typingEl);
    appendMessage('ai', response);
    STATE.chatHistory.push({ role: 'model', parts: [{ text: response }] });
    persistSession(text);
    
    // Generate AI title if we have at least one user message and no title yet
    if (!STATE.hasAITitle && STATE.chatHistory.length >= 3) {
      generateAITitle();
    }
  } catch (err) {
    removeTyping(typingEl);
    appendMessage('ai', buildErrorMessage(err));
  } finally {
    STATE.isLoading = false;
    DOM.sendBtn.disabled = false;
  }
}

function persistSession(firstUserMsg) {
  const msgs = STATE.chatHistory.map(m => ({
    role: m.role,
    text: m.parts[0].text,
  }));
  const sessions = Sessions.load();
  const existing = sessions.find(s => s.id === STATE.currentSessionId);
  const title = existing?.hasAITitle ? existing.title : (firstUserMsg.slice(0, 48) + '…');
  Sessions.saveCurrentSession(title, msgs);
}

async function generateAITitle() {
  try {
    const prompt = `Summarize the following business recovery conversation into a 3-5 word title in English. Only return the title, nothing else.\n\nConversation:\n${STATE.chatHistory.map(m => `${m.role}: ${m.parts[0].text}`).join('\n')}`;
    
    const provider = CONFIG.PROVIDER;
    const apiKey = CONFIG.API_KEY;
    const model = CONFIG.MODEL;
    
    let title = "";
    if (provider === 'google') {
      const url = `${PROVIDERS.google.getEndpoint(model)}?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] })
      });
      const data = await res.json();
      title = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    } else {
      const res = await fetch(PROVIDERS[provider].endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model: model, messages: [{ role: 'user', content: prompt }] })
      });
      const data = await res.json();
      title = data?.choices?.[0]?.message?.content;
    }

    if (title) {
      title = title.replace(/["']/g, '').trim();
      Sessions.updateTitle(STATE.currentSessionId, title);
      STATE.hasAITitle = true;
    }
  } catch (err) {
    console.error('Failed to generate AI title', err);
  }
}

function shareChat() {
  if (STATE.chatHistory.length === 0) {
    showToast('❌ Nothing to share yet!');
    return;
  }

  let text = `--- BizRevive LK Chat Transcript ---\n\n`;
  STATE.chatHistory.forEach(m => {
    const role = m.role === 'user' ? 'You' : 'BizRevive LK';
    text += `${role}:\n${m.parts[0].text}\n\n`;
  });
  text += `Generated by BizRevive LK - Sri Lanka's AI Business Advisor`;

  navigator.clipboard.writeText(text).then(() => {
    showToast('📋 Chat copied to clipboard!');
  }).catch(() => {
    showToast('❌ Failed to copy to clipboard');
  });
}

async function callAI(userText, kbEnrichment = '') {
  const provider = CONFIG.PROVIDER;
  const apiKey = CONFIG.API_KEY;
  const model = CONFIG.MODEL;
  if (!apiKey) throw new Error(`${PROVIDERS[provider].name} API key is missing.`);
  if (provider === 'google') return callGemini(userText, kbEnrichment, apiKey, model);
  return callOpenAICompatible(userText, kbEnrichment, apiKey, model, provider);
}

async function callGemini(userText, kbEnrichment, apiKey, model) {
  const systemInstruction = buildSystemPrompt();
  const enrichedUserText = kbEnrichment ? `${userText}\n\n[CONTEXT FROM KNOWLEDGE BASE]\n${kbEnrichment}` : userText;
  const messages = [
    { role: 'user',  parts: [{ text: systemInstruction }] },
    { role: 'model', parts: [{ text: 'Understood. I am BizRevive LK.' }] },
    ...STATE.chatHistory.slice(0, -1),
    { role: 'user',  parts: [{ text: enrichedUserText }] },
  ];
  const payload = { contents: messages, tools: [{ googleSearch: {} }], generationConfig: { temperature: 0.7, maxOutputTokens: 2048 } };
  const url = `${PROVIDERS.google.getEndpoint(model)}?key=${apiKey}`;
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from AI.';
}

async function callOpenAICompatible(userText, kbEnrichment, apiKey, model, provider) {
  const systemPrompt = buildSystemPrompt();
  const enrichedUserText = kbEnrichment ? `${userText}\n\n[CONTEXT FROM KNOWLEDGE BASE]\n${kbEnrichment}` : userText;
  const messages = [
    { role: 'system', content: systemPrompt },
    ...STATE.chatHistory.slice(0, -1).map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.parts[0].text })),
    { role: 'user', content: enrichedUserText }
  ];
  const res = await fetch(PROVIDERS[provider].endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model: model, messages: messages, temperature: 0.7 })
  });
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || 'No response from AI.';
}

function buildErrorMessage(err) {
  return `⚠️ **Error**: ${err.message || 'Unknown error'}`;
}

function appendMessage(role, text) {
  const isAI = role === 'ai';
  const el = document.createElement('div');
  el.className = `message ${role}`;
  const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const contextPills = buildContextPills();
  el.innerHTML = `
    <div class="msg-avatar">${isAI ? '🇱🇰' : '👤'}</div>
    <div class="msg-content">
      <div class="msg-meta">
        <span>${isAI ? 'BizRevive LK' : 'You'}</span>
        <span>·</span>
        <span>${timeStr}</span>
      </div>
      ${isAI && contextPills ? `<div>${contextPills}</div>` : ''}
      <div class="msg-bubble">${isAI ? renderMarkdown(text) : escapeHtml(text)}</div>
    </div>`;
  DOM.messagesContainer.appendChild(el);
  scrollToBottom();
}

function buildContextPills() {
  const pills = [];
  if (STATE.city)     pills.push(`<span class="context-pill">📍 ${STATE.city}</span>`);
  if (STATE.category) pills.push(`<span class="context-pill">🏭 ${STATE.category}</span>`);
  return pills.join('');
}

function showTyping() {
  const el = document.createElement('div');
  el.className = 'typing-indicator';
  el.innerHTML = `<div class="msg-avatar" style="background:linear-gradient(135deg,var(--accent),var(--emerald));border:none;">🇱🇰</div><div class="typing-dots"><span></span><span></span><span></span></div><span class="typing-label">BizRevive LK is thinking…</span>`;
  DOM.messagesContainer.appendChild(el);
  scrollToBottom();
  return el;
}

function removeTyping(el) { if (el && el.parentNode) el.parentNode.removeChild(el); }
function scrollToBottom() { requestAnimationFrame(() => { DOM.messagesContainer.scrollTop = DOM.messagesContainer.scrollHeight; }); }

function renderMarkdown(text) {
  let html = escapeHtml(text);
  html = html.replace(/```[\w]*\n?([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm,  '<h3>$1</h3>');
  html = html.replace(/^# (.+)$/gm,   '<h3>$1</h3>');
  html = html.replace(/^---+$/gm, '<hr>');
  html = html.replace(/^(\s*[-*•] .+)(\n\s*[-*•] .+)*/gm, (match) => {
    const items = match.split('\n').filter(l => l.trim()).map(l => `<li>${l.replace(/^\s*[-*•] /, '')}</li>`);
    return `<ul>${items.join('')}</ul>`;
  });
  html = html.replace(/^(\s*\d+\. .+)(\n\s*\d+\. .+)*/gm, (match) => {
    const items = match.split('\n').filter(l => l.trim()).map(l => `<li>${l.replace(/^\s*\d+\. /, '')}</li>`);
    return `<ol>${items.join('')}</ol>`;
  });
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  html = html.replace(/\n\n+/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');
  html = `<p>${html}</p>`.replace(/<p>\s*(<(?:h3|ul|ol|hr|pre)[^>]*>)/g, '$1').replace(/(<\/(?:h3|ul|ol|hr|pre)>)\s*<\/p>/g, '$1').replace(/<p>\s*<\/p>/g, '');
  return html;
}

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}

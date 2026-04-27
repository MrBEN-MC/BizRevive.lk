/**
 * BizRevive LK – Inference Engine (inference.js)
 * ────────────────────────────────────────────────
 * Tier 2 of the three-tier architecture:
 *   Tier 1: Natural Language Interface  (index.html / style.css)
 *   Tier 2: Inference Engine            (inference.js)  ← THIS FILE
 *   Tier 3: Knowledge Base              (kb.js)
 *
 * Responsibilities:
 *  - Pre-process user input and enrich Gemini AI prompt
 *  - Match small-talk for instant local responses
 *  - Detect user intent from patterns (rule-based fallback)
 *  - Inject relevant KB facts into AI context
 *  - Manage the Machine Learning layer (user-taught facts)
 *  - Post-process AI response (badge injection, formatting)
 */

'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// MACHINE LEARNING STORE
// ─────────────────────────────────────────────────────────────────────────────
// The bot "learns" new facts from users via the /learn command and
// stores them in localStorage (persistent storage simulation).
// This demonstrates ML Tier: knowledge base that updates itself.

const ML_STORE_KEY = 'bizrevive_lk_ml_v1';

const ML = {
  /** Load learned facts from localStorage */
  load() {
    try {
      return JSON.parse(localStorage.getItem(ML_STORE_KEY) || '{}');
    } catch {
      return {};
    }
  },

  /** Save learned facts to localStorage */
  save(data) {
    try {
      localStorage.setItem(ML_STORE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('BizRevive ML: Could not save to localStorage', e);
    }
  },

  /** Teach the bot a new fact: /learn topic::answer */
  teach(topic, answer) {
    const data = this.load();
    const key = topic.toLowerCase().trim();
    data[key] = {
      answer: answer.trim(),
      learnedAt: new Date().toISOString(),
      hits: 0,
    };
    this.save(data);
    return `✅ **Learned!** I've stored that information about "${topic}" in my knowledge base. I'll use it in future conversations about this topic.\n\n*This demonstrates my machine learning capability — I update my own knowledge base from user interactions.*`;
  },

  /** Query for a matching learned fact */
  query(text) {
    const data = this.load();
    const lower = text.toLowerCase();
    for (const [key, val] of Object.entries(data)) {
      if (lower.includes(key)) {
        // Increment hit counter (usage tracking)
        val.hits = (val.hits || 0) + 1;
        this.save(data);
        return val.answer;
      }
    }
    return null;
  },

  /** Return all learned facts (for display) */
  listAll() {
    const data = this.load();
    const keys = Object.keys(data);
    if (keys.length === 0) {
      return '📚 **My Knowledge Base is Empty**\n\nYou can teach me new facts using:\n`/learn [topic] :: [answer]`\n\nExample:\n`/learn cinnamon export :: Sri Lanka is the world\'s largest cinnamon exporter, accounting for 80% of global supply. EDB provides specific export support for cinnamon producers.`';
    }
    const list = keys.map(k => {
      const v = data[k];
      return `- **${k}**: ${v.answer.substring(0, 80)}… _(used ${v.hits} times, learned ${new Date(v.learnedAt).toLocaleDateString()})_`;
    });
    return `📚 **My Learned Knowledge Base** (${keys.length} facts)\n\n${list.join('\n')}\n\n_I update this knowledge base from your inputs — this is my machine learning layer._`;
  },

  /** Export learned knowledge as JSON (for download) */
  export() {
    return JSON.stringify(this.load(), null, 2);
  },

  /** Get count of learned facts */
  count() {
    return Object.keys(this.load()).length;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// INFERENCE ENGINE CORE
// ─────────────────────────────────────────────────────────────────────────────

const InferenceEngine = {

  /**
   * Main entry point — called before Gemini API.
   * Returns an object describing what action to take.
   *
   * @param {string} userText - Raw user input
   * @param {object} state    - Current app state {city, category, businessName}
   * @returns {object}        - { action: 'local'|'ai'|'command', response?, enrichment? }
   */
  process(userText, state) {
    const text = userText.trim();

    // 1. Command handling
    const commandResult = this._handleCommands(text, state);
    if (commandResult) return { action: 'local', response: commandResult };

    // 2. Small-talk check (instant local response, no API cost)
    const smallTalkResponse = KB.matchSmallTalk(text);
    if (smallTalkResponse) return { action: 'local', response: smallTalkResponse };

    // 3. ML Knowledge Base check
    const mlResponse = ML.query(text);
    if (mlResponse) {
      return {
        action: 'local',
        response: `💡 **From My Learned Knowledge Base:**\n\n${mlResponse}\n\n---\n*This answer comes from information previously taught to me. Type \`/knowledge\` to see all learned facts.*`,
      };
    }

    // 4. Detect intent + build enrichment for Gemini
    const intent   = KB.detectIntent(text);
    const enrichment = this._buildEnrichment(intent, state);

    return { action: 'ai', enrichment };
  },

  /**
   * Handle slash commands
   */
  _handleCommands(text, state) {
    const lower = text.toLowerCase();

    // /help
    if (lower === '/help' || lower === 'help') {
      return this._getHelp();
    }

    // /knowledge — show ML knowledge base
    if (lower === '/knowledge' || lower === '/facts' || lower === '/learned') {
      return ML.listAll();
    }

    // /city — show city profile
    if (lower.startsWith('/city')) {
      const cityName = text.replace(/^\/city\s*/i, '').trim() || state.city;
      return this._getCityInfo(cityName);
    }

    // /funding — show funding options
    if (lower === '/funding' || lower === '/loans' || lower === '/money') {
      return this._getFundingInfo(state.category);
    }

    // /playbook — show recovery playbook
    if (lower === '/playbook' || lower === '/recover' || lower === '/strategy') {
      return this._getPlaybook(state.category);
    }

    // /learn topic :: answer
    if (lower.startsWith('/learn ')) {
      const parts = text.slice(7).split('::');
      if (parts.length < 2) {
        return '⚠️ **Usage:** `/learn [topic] :: [answer]`\n\nExample:\n`/learn paddy prices :: The current paddy floor price set by the government is LKR 100 per kg.`';
      }
      return ML.teach(parts[0].trim(), parts.slice(1).join('::').trim());
    }

    // /export — export ML data
    if (lower === '/export') {
      const data = ML.export();
      return `📤 **Export Your Learned Knowledge Base**\n\nCopy this JSON to save or share your knowledge base:\n\n\`\`\`json\n${data}\n\`\`\`\n\nTotal facts: ${ML.count()}`;
    }

    // /reset — clear ML knowledge (with confirmation in response)
    if (lower === '/reset knowledge') {
      localStorage.removeItem(ML_STORE_KEY);
      return '🗑️ **Knowledge Base Cleared.** All learned facts have been removed. The bot will now rely on its built-in knowledge and AI.';
    }

    return null;
  },

  /**
   * Build context enrichment to prepend to Gemini prompt
   */
  _buildEnrichment(intent, state) {
    const parts = [];

    // City profile data
    if (state.city) {
      const profile = KB.getCityProfile(state.city);
      if (profile) {
        parts.push(`[CITY INTELLIGENCE for ${state.city}]`);
        parts.push(`Province: ${profile.province || 'N/A'}`);
        if (profile.strengths)    parts.push(`Economic Strengths: ${profile.strengths.join(', ')}`);
        if (profile.challenges)   parts.push(`Key Challenges: ${profile.challenges.join(', ')}`);
        if (profile.opportunities) parts.push(`Opportunities: ${profile.opportunities.join(', ')}`);
        if (profile.tip)          parts.push(`Local Expert Tip: ${profile.tip}`);
      }
    }

    // Category playbook
    if (state.category) {
      const playbook = KB.getPlaybook(state.category);
      if (playbook) {
        parts.push(`\n[RECOVERY PLAYBOOK for ${state.category}]`);
        parts.push(`Common Problems: ${playbook.commonProblems?.join(', ') || 'N/A'}`);
        parts.push(`Quick Wins: ${playbook.quickWins?.slice(0, 3).join(' | ') || 'N/A'}`);
      }
    }

    // Funding data
    if (intent === 'funding' || state.category) {
      const schemes = KB.getFundingForCategory(state.category || 'all').slice(0, 4);
      if (schemes.length > 0) {
        parts.push(`\n[RELEVANT FUNDING SCHEMES]`);
        schemes.forEach(s => {
          parts.push(`${s.name} (${s.provider}): ${s.amount} @ ${s.interest} — Call ${s.contact || 'N/A'}`);
        });
      }
    }

    // ML learned facts count
    const mlCount = ML.count();
    if (mlCount > 0) {
      parts.push(`\n[NOTE] This user has taught me ${mlCount} custom facts about their business context.`);
    }

    return parts.length > 0 ? parts.join('\n') : '';
  },

  // ── Formatted local responses ──────────────────────────────────────────────

  _getHelp() {
    return `## 🤖 BizRevive LK – Help

**Available Commands:**
- \`/city [name]\` — Get economic profile for any Sri Lankan city
- \`/funding\` — View funding and loan options for your category
- \`/playbook\` — Get a recovery strategy for your business type
- \`/knowledge\` — See all facts I've learned from you
- \`/learn [topic] :: [answer]\` — Teach me a new fact
- \`/export\` — Export your knowledge base as JSON
- \`/reset knowledge\` — Clear all learned facts

**Quick Tips:**
- Set your city and business category in the sidebar for personalised advice
- Enter your business name so I can search for it online
- Use the quick-access chips in the sidebar for common problems

**Machine Learning Feature:**
Teach me about your specific business using \`/learn\`. I'll remember and use that information in future answers!`;
  },

  _getCityInfo(cityName) {
    if (!cityName) {
      return '⚠️ Please specify a city. Example: `/city Kandy` or set your city in the sidebar first.';
    }
    const profile = KB.getCityProfile(cityName);
    if (!profile) {
      return `⚠️ I don't have a detailed profile for **${cityName}** yet. However, I can still provide advice using the AI. Type your question and I'll help!\n\nCities with detailed profiles: ${Object.keys(KB.CITY_PROFILES).join(', ')}`;
    }

    const p = profile;
    return `## 📍 ${cityName} — Economic Profile

**Province:** ${p.province || 'N/A'}
${p.population ? `**Population:** ${p.population}` : ''}
${p.gdpShare ? `**Economic Contribution:** ${p.gdpShare}` : ''}

### 💪 Key Strengths
${(p.strengths || []).map(s => `- ${s}`).join('\n')}

### ⚠️ Key Challenges
${(p.challenges || []).map(c => `- ${c}`).join('\n')}

### 🚀 Business Opportunities
${(p.opportunities || []).map(o => `- ${o}`).join('\n')}

${p.keyAreas ? `**Key Commercial Areas:** ${p.keyAreas.join(', ')}` : ''}
${p.digitalPenetration ? `**Digital Marketing Landscape:** ${p.digitalPenetration}` : ''}
${p.avgRentPerSqFt ? `**Average Commercial Rent:** ${p.avgRentPerSqFt}` : ''}

### 💡 Local Expert Tip
${p.tip || 'Set your business category for specific playbook advice.'}

---
*Ask me for specific advice by describing your business problem!*`;
  },

  _getFundingInfo(category) {
    const schemes = KB.getFundingForCategory(category || 'all');
    if (schemes.length === 0) {
      return '⚠️ No specific funding schemes found. Please set your business category in the sidebar for targeted results.';
    }

    const rows = schemes.map(s => `### 🏦 ${s.name}
- **Provider:** ${s.provider}
- **Type:** ${s.type}
- **Amount:** ${s.amount}
- **Interest Rate:** ${s.interest}
- **Eligibility:** ${s.eligibility}
- **Contact:** 📞 ${s.contact || 'See website'}
- **Website:** ${s.url || 'N/A'}
${s.notes ? `- **Note:** ${s.notes}` : ''}`);

    return `## 💰 Funding Options${category ? ` for ${category}` : ''} — Sri Lanka

${rows.join('\n\n')}

---
💡 **Pro Tip:** Always prepare these documents before applying:
1. Business Registration Certificate
2. Last 6 months bank statements
3. Business plan (even a simple one helps)
4. NIC copies of directors

*Ask me to help you prepare your loan application!*`;
  },

  _getPlaybook(category) {
    if (!category) {
      return '⚠️ Please select your business category in the sidebar first to get a tailored recovery playbook.';
    }
    const pb = KB.getPlaybook(category);
    if (!pb) {
      return `⚠️ No specific playbook for **${category}** yet. However, I can generate a personalised strategy — just describe your main challenge!`;
    }

    return `## 📋 ${category} Business Recovery Playbook

### ⚡ Quick Wins (Do This Week)
${pb.quickWins.map((w, i) => `${i + 1}. ✅ ${w}`).join('\n')}

### 📅 Medium-Term Strategy (Next 3 Months)
${(pb.mediumTerm || []).map((w, i) => `${i + 1}. 💡 ${w}`).join('\n')}

${pb.digitalTools ? `### 📱 Key Digital Platforms for ${category}\n${pb.digitalTools.map(t => `- **${t}**`).join('\n')}` : ''}

### ⚠️ Common Problems to Watch Out For
${(pb.commonProblems || []).map(p => `- ${p}`).join('\n')}

---
*This is a general playbook. Tell me your specific situation for personalised advice!*`;
  },
};

// Export globally
window.InferenceEngine = InferenceEngine;
window.ML = ML;

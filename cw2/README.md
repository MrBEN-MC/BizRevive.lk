# 🇱🇰 BizRevive LK — AI Business Recovery Advisor

> **Coursework 2 — Artificial Intelligence (2026)**  
> Team: [Your Name] & [Partner's Name] | Sri Lanka

[![Gemini AI](https://img.shields.io/badge/Powered%20by-Google%20Gemini%201.5%20Pro-blue?logo=google)](https://ai.google.dev/)
[![Language](https://img.shields.io/badge/Language-HTML%20%2F%20CSS%20%2F%20JavaScript-orange)](.)
[![Category](https://img.shields.io/badge/Type-Virtual%20Assistant%20(ChatBot)-green)](.)
[![License](https://img.shields.io/badge/License-MIT-lightgrey)](.)

---

## 📌 Project Overview

**BizRevive LK** is an AI-powered business recovery chatbot tailored exclusively for **Sri Lankan businesses**. It helps business owners who are experiencing financial difficulties, declining profits, or operational challenges — providing personalised, city-specific advice grounded in real Sri Lankan economic data.

### 🎯 Problem Statement

Many Sri Lankan small and medium businesses struggle silently after economic shocks (such as the 2022 economic crisis), with no access to affordable professional advice. BizRevive LK bridges this gap by delivering expert-level business recovery guidance instantly, for free, in a conversational format.

---

## 🏗️ Three-Tier Architecture

This bot follows the three-tier design mandated by the coursework specification:

```
┌──────────────────────────────────────────────────┐
│  TIER 1 — Natural Language Interface              │
│  index.html + style.css                           │
│  • Text-based chat UI                             │
│  • City & Category selector                       │
│  • Business name input (triggers online search)  │
│  • Quick-access problem chips                     │
└───────────────────┬──────────────────────────────┘
                    │
┌───────────────────▼──────────────────────────────┐
│  TIER 2 — Inference Engine                        │
│  inference.js                                     │
│  • Rule-based intent detection (NLP patterns)     │
│  • Small-talk handler (instant responses)         │
│  • ML Layer: localStorage knowledge base          │
│  • Slash command router                           │
│  • KB enrichment builder for Gemini prompts       │
└───────────────────┬──────────────────────────────┘
                    │
┌───────────────────▼──────────────────────────────┐
│  TIER 3 — Knowledge Base + Gemini AI              │
│  kb.js + Google Gemini 1.5 Pro API               │
│  • Static facts (small-talk, city profiles)       │
│  • Dynamic facts (funding schemes, playbooks)     │
│  • User-taught facts (ML — localStorage)          │
│  • Google Search grounding (online business data) │
└──────────────────────────────────────────────────┘
```

---

## 🤖 AI Traits Demonstrated

| Trait | Implementation |
|---|---|
| **Natural Language Processing (NLP)** | Intent detection via pattern matching + Gemini 1.5 Pro LLM |
| **Machine Learning** | User can teach the bot new facts (`/learn`) stored in persistent localStorage |
| **Searching / Information Retrieval** | Google Search grounding via Gemini API finds business online |
| **Knowledge Representation** | Structured KB with city profiles, funding schemes, and recovery playbooks |
| **Decision Making** | Inference engine routes queries: local → ML → Gemini based on confidence |
| **Persistent Storage** | localStorage stores user-taught facts across sessions |

---

## 🗺️ P.E.A.S Framework

| Element | Description |
|---|---|
| **Performance Measure** | Quality and relevance of business recovery advice; user satisfaction; resolution of business problem stated |
| **Environment** | Web browser; Sri Lankan business context; user-provided city/category/business name; internet (for Google Search grounding) |
| **Actuators** | Chat message output; formatted markdown responses; city profile cards; funding scheme lists; recovery playbooks |
| **Sensors** | Text input (NLP); city selector; category selector; business name input; slash commands; web search results via Gemini |

---

## 📁 File Structure

```
bizrevive-lk/
├── index.html        # Tier 1: Natural Language Interface (UI)
├── style.css         # UI styling (dark glassmorphism design)
├── kb.js             # Tier 3: Knowledge Base (static + dynamic facts)
├── inference.js      # Tier 2: Inference Engine (rule-based NLP + ML layer)
├── app.js            # Core app logic: Gemini API, state, UI rendering
└── README.md         # This file
```

---

## ✨ Key Features

- 🇱🇰 **Sri Lanka-Specific**: Covers all 9 provinces, 25+ cities with economic profiles
- 🔍 **Online Business Research**: Provide a business name and Gemini searches the web for it
- 📍 **City Intelligence**: Colombo, Kandy, Galle, Jaffna, Trincomalee & more — each with unique insights
- 🏦 **Funding Database**: 10+ real Sri Lankan bank loans and government grants with contacts
- 📋 **Recovery Playbooks**: Category-specific quick-win strategies for Retail, Restaurant, Tourism, Agriculture, IT & more
- 🧠 **Machine Learning**: `/learn topic :: answer` teaches the bot — persisted in localStorage
- ⚡ **Slash Commands**: `/city`, `/funding`, `/playbook`, `/knowledge`, `/help`
- 💬 **Small-Talk**: Handles greetings in English, Sinhala (ආයුබෝවන්), and Tamil (வணக்கம்)
- 📱 **Fully Responsive**: Works on mobile, tablet, and desktop

---

## 🚀 How to Run

### Option A: Open Directly (No Server Needed)
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/bizrevive-lk.git
cd bizrevive-lk

# Open in browser
open index.html   # macOS
start index.html  # Windows
```

### Option B: Local Server (Recommended)
```bash
# Using Python
python3 -m http.server 8080
# Then visit: http://localhost:8080

# Using Node.js
npx serve .
# Then visit: http://localhost:3000
```

> **Note:** No installation, no dependencies, no build step required. Pure HTML/CSS/JS.

---

## 💡 How to Use

1. **Select your City** from the sidebar dropdown (e.g., Colombo, Kandy, Galle)
2. **Select your Business Category** (e.g., Restaurant, Retail, Agriculture)
3. **Optionally enter your Business Name** — the AI will search for it online
4. **Type your problem** or click a quick-access chip (e.g., "📉 Falling Sales")
5. **Get personalised advice** with action plans, funding options, and local resources

### Slash Commands
| Command | Description |
|---|---|
| `/help` | Show all available commands |
| `/city Kandy` | Get economic profile for Kandy |
| `/funding` | Show funding options for your category |
| `/playbook` | Get a recovery strategy playbook |
| `/knowledge` | View all facts you've taught the bot |
| `/learn [topic] :: [answer]` | Teach the bot a new fact |
| `/export` | Export your knowledge base as JSON |

---

## 🧪 Test Plan Summary

| Test Case | Input | Expected Output |
|---|---|---|
| Small talk — Sinhala | "Ayubowan" | Sinhala greeting response |
| City profile | `/city Jaffna` | Jaffna economic profile card |
| Funding query | `/funding` (category: Retail) | BOC, NSB, HNB Grameen loans |
| ML learning | `/learn rent :: Colombo rent is LKR 300/sqft` | Confirmation + stored in localStorage |
| ML recall | "What about rent?" | Returns learned fact about rent |
| Business search | Name: "Perera's Store, Colombo" + query | AI searches online for that store |
| Falling sales | "My sales dropped 40%" | Diagnosis + recovery plan |
| Cash flow issue | "I can't pay my bills" | Cash flow management strategies |
| Error handling | Network disconnected | Friendly error message shown |
| Mobile responsive | Resize to 375px | Sidebar collapses, layout adapts |

---

## 📚 References

1. Google Gemini API Documentation — https://ai.google.dev/docs
2. Bank of Ceylon SME Loans — https://www.boc.lk
3. Export Development Board Sri Lanka — https://www.edb.gov.lk
4. Sri Lanka Tourism Development Authority — https://www.sltda.gov.lk
5. Regional Development Bank Sri Lanka — https://www.rdb.lk
6. DFCC Bank Business Loans — https://www.dfcc.lk
7. HNB Grameen Finance — https://www.hnbgrameen.lk
8. Industrial Technology Institute — https://www.iti.lk
9. Board of Investment Sri Lanka — https://www.investsrilanka.com
10. Sri Lanka Department of Census and Statistics — http://www.statistics.gov.lk
11. Russell, S., & Norvig, P. (2020). *Artificial Intelligence: A Modern Approach* (4th ed.). Pearson.
12. Weizenbaum, J. (1966). ELIZA — A Computer Program for the Study of Natural Language Communication. *Communications of the ACM*, 9(1).

---

## 👥 Team

| Member | Role |
|---|---|
| [Your Name] | Lead Developer, AI Integration, Frontend |
| [Partner's Name] | Knowledge Base Design, Research, Testing |

---

*Submitted for AI Coursework 2 — 2026*

/**
 * BizRevive LK – Knowledge Base (kb.js)
 * ──────────────────────────────────────
 * Tier 3 of the three-tier architecture:
 *   Tier 1: Natural Language Interface  (index.html / style.css)
 *   Tier 2: Inference Engine            (inference.js)
 *   Tier 3: Knowledge Base              (kb.js)  ← THIS FILE
 *
 * Contains:
 *  - Static small-talk facts (hash-map style)
 *  - Sri Lanka city economic profiles
 *  - Business category playbooks
 *  - Funding & government scheme database
 *  - Crisis recovery templates
 *  - Intent patterns for rule-based fallback
 */

'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// 1. SMALL-TALK / GREETING MAP  (static hard-coded facts)
// ─────────────────────────────────────────────────────────────────────────────
const SMALL_TALK = {
  'hello':            'Hello! 👋 Welcome to BizRevive LK. How can I help your business today?',
  'hi':               'Hi there! 🇱🇰 Ready to help you revive your Sri Lankan business. What\'s on your mind?',
  'good morning':     'Good morning! ☀️ A great time to plan your business recovery. What challenge shall we tackle?',
  'good evening':     'Good evening! 🌙 Let\'s work on your business strategy. How can I help?',
  'ayubowan':         'ආයුබෝවන්! 🙏 Welcome. How can BizRevive LK assist your business today?',
  'vanakkam':         'வணக்கம்! 🙏 How can I help your business today?',
  'thank you':        'You\'re welcome! 😊 Feel free to ask any time. Your business recovery is our mission.',
  'thanks':           'Happy to help! 🌟 Come back whenever you need more advice.',
  'bye':              'Goodbye! 👋 Best of luck with your business. ආයුබෝවන්!',
  'who are you':      'I am **BizRevive LK** 🇱🇰 — an AI business recovery advisor built specifically for Sri Lankan businesses. I combine Google Gemini AI with a rich knowledge base of Sri Lanka\'s economic landscape to give you personalised, actionable advice.',
  'what can you do':  'I can help you with:\n- 📉 Diagnosing why your business is struggling\n- 💡 Creating a personalised recovery plan\n- 🏦 Finding Sri Lankan funding & loan options\n- 📱 Digital marketing strategies for local audiences\n- 📍 City-specific market intelligence\n- 🔍 Researching your business online for better insights',
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. CITY ECONOMIC PROFILES  (dynamic facts — can be extended)
// ─────────────────────────────────────────────────────────────────────────────
const CITY_PROFILES = {
  'Colombo': {
    province: 'Western',
    population: '752,993 (city) / 5.8M (metro)',
    gdpShare: '~40% of national GDP',
    strengths: ['Finance & banking hub', 'IT & BPO sector', 'Port & logistics', 'Fashion & retail', 'Healthcare tourism'],
    challenges: ['High commercial rents', 'Traffic congestion', 'High competition', 'Cost of living'],
    opportunities: ['Expat & tourist market', 'E-commerce growth', 'Co-working spaces', 'Food delivery apps'],
    keyAreas: ['Fort', 'Pettah', 'Borella', 'Nugegoda', 'Dehiwala', 'Rajagiriya', 'Battaramulla'],
    digitalPenetration: 'High – Facebook, Instagram, TikTok, Daraz',
    avgRentPerSqFt: 'LKR 200–600/sqft',
    tip: 'Competition is fierce in Colombo. Differentiation and digital presence are critical.',
  },
  'Kandy': {
    province: 'Central',
    population: '125,000',
    gdpShare: 'Regional hub ~8% central province GDP',
    strengths: ['Heritage tourism', 'Buddhist pilgrimage', 'Tea industry', 'Education hub', 'Weekend market'],
    challenges: ['Seasonal tourism fluctuations', 'Traffic in city centre', 'Limited tech talent'],
    opportunities: ['Eco-tourism', 'Ayurvedic wellness', 'Handcraft exports', 'Cultural experiences'],
    keyAreas: ['City Centre', 'Peradeniya', 'Katugastota', 'Kundasale', 'Digana'],
    digitalPenetration: 'Medium-High – Facebook dominant',
    tip: 'Leverage the Esala Perahera season for maximum revenue. Build packages around cultural experiences.',
  },
  'Galle': {
    province: 'Southern',
    population: '99,000',
    gdpShare: 'Tourism-dominant',
    strengths: ['UNESCO Heritage Fort', 'Expat community', 'Beach tourism', 'Boutique hospitality'],
    challenges: ['Seasonal tourism', 'Limited industrial base'],
    opportunities: ['Premium boutique businesses', 'Surf tourism', 'Digital nomad market', 'Artisanal products'],
    keyAreas: ['Galle Fort', 'Unawatuna', 'Hikkaduwa', 'Mirissa'],
    digitalPenetration: 'High – Instagram & Airbnb important',
    tip: 'Target international tourists with Instagram-worthy products and experiences. Premium pricing possible.',
  },
  'Jaffna': {
    province: 'Northern',
    population: '88,000',
    gdpShare: 'Growing post-war economy',
    strengths: ['Unique agricultural products', 'Palmyrah industry', 'Strong diaspora connections', 'Emerging tourism'],
    challenges: ['Post-war infrastructure gaps', 'Limited formal banking access', 'Distance from Colombo markets'],
    opportunities: ['Jaffna mango exports', 'Diaspora market online sales', 'Heritage tourism', 'Agri-processing'],
    keyAreas: ['Jaffna Town', 'Nallur', 'Chavakachcheri', 'Kilinochchi'],
    digitalPenetration: 'Medium – Facebook & WhatsApp dominant',
    tip: 'The Jaffna diaspora in UK, Canada & Australia is a huge untapped market. Build online export capability.',
  },
  'Trincomalee': {
    province: 'Eastern',
    population: '99,135',
    strengths: ['Natural deep harbour', 'Rising tourism', 'Fishing industry', 'Strategic location'],
    challenges: ['Post-war rebuilding', 'Infrastructure gaps', 'Seasonal tourism'],
    opportunities: ['Whale watching tourism', 'Water sports', 'Naval economy', 'Agri-exports'],
    tip: 'Tourism is growing rapidly. Invest in hospitality and experience businesses.',
  },
  'Nuwara Eliya': {
    province: 'Central',
    population: '28,000',
    strengths: ['Tea tourism', 'Cool climate appeal', 'Hill country experiences', 'Agricultural exports'],
    challenges: ['Extreme seasonality', 'Worker welfare issues in tea sector'],
    opportunities: ['Premium tea experiences', 'Strawberry & vegetable agri-business', 'Eco-lodges'],
    tip: 'Holiday season (Apr, Dec) drives 70% of revenue. Build off-season revenue streams.',
  },
  'Matara': {
    province: 'Southern',
    population: '76,000',
    strengths: ['Southern highway connectivity', 'University town', 'Fishing', 'Lower costs'],
    opportunities: ['Student market', 'Affordable hospitality', 'Agri-processing'],
    tip: 'Lower cost base than Colombo. Good for manufacturing and agri-processing startups.',
  },
  'Hambantota': {
    province: 'Southern',
    population: '11,200',
    strengths: ['International port', 'Southern Expressway terminus', 'Industrial zone', 'Lower land costs'],
    opportunities: ['Port-related logistics', 'Industrial manufacturing', 'Tourism'],
    tip: 'The Hambantota Port industrial zone offers unique opportunities for export-oriented businesses.',
  },
  'Kurunegala': {
    province: 'North Western',
    population: '28,000',
    strengths: ['Agricultural hub', 'Coconut triangle', 'Inland trade', 'Lower rents'],
    opportunities: ['Coconut-based products', 'Agri-processing', 'Dairy', 'Inland trade hub'],
    tip: 'Coconut and agricultural processing has strong export potential. Target EDB export programmes.',
  },
  'Anuradhapura': {
    province: 'North Central',
    strengths: ['Heritage tourism', 'Agriculture', 'Pilgrimage economy'],
    opportunities: ['Pilgrimage packages', 'Organic farming', 'Handicrafts'],
    tip: 'Year-round pilgrimage traffic provides a stable customer base for hospitality and retail.',
  },
  'Badulla': {
    province: 'Uva',
    strengths: ['Tea and rubber', 'Hill country tourism', 'Agriculture'],
    opportunities: ['Eco-tourism', 'Organic produce', 'Wellness retreats'],
    tip: 'Uva Wellassa region is ideal for agri-tourism and organic product marketing.',
  },
  'Ratnapura': {
    province: 'Sabaragamuwa',
    strengths: ['Gem industry', 'Mining', 'Rain forests'],
    opportunities: ['Gem export', 'Ecotourism', 'Craft jewellery'],
    tip: 'The gem industry has significant export value. Consider certified gem export with EDB support.',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. FUNDING & FINANCIAL SCHEMES DATABASE  (dynamic facts)
// ─────────────────────────────────────────────────────────────────────────────
const FUNDING_SCHEMES = [
  {
    name: 'BOC SME Loan',
    provider: 'Bank of Ceylon',
    type: 'Bank Loan',
    amount: 'Up to LKR 50 million',
    interest: '~14–16% p.a.',
    eligibility: 'Registered SME, 1 year operation',
    contact: '011 2446790',
    url: 'https://www.boc.lk',
    categories: ['all'],
    provinces: ['all'],
    notes: 'Working capital and asset purchase. No collateral for loans under LKR 2M.',
  },
  {
    name: 'NSB Personal & Business Loan',
    provider: 'National Savings Bank',
    type: 'Bank Loan',
    amount: 'Up to LKR 10 million',
    interest: '~13% p.a.',
    eligibility: 'NSB account holder, income verification',
    contact: '011 2039200',
    url: 'https://www.nsb.lk',
    categories: ['all'],
    provinces: ['all'],
  },
  {
    name: 'DFCC Entrepreneurship Loan',
    provider: 'DFCC Bank',
    type: 'Development Finance',
    amount: 'Up to LKR 75 million',
    interest: '~13–15% p.a.',
    eligibility: 'SME with business plan',
    contact: '011 2350000',
    url: 'https://www.dfcc.lk',
    categories: ['Manufacturing', 'Agriculture', 'Tourism', 'IT & Technology'],
  },
  {
    name: 'Regional Development Bank (RDB) Agri Loan',
    provider: 'Regional Development Bank',
    type: 'Agricultural Finance',
    amount: 'LKR 50,000 – 5 million',
    interest: '~8% p.a. (subsidised)',
    eligibility: 'Smallholder farmers and agri-businesses',
    contact: '011 2369900',
    url: 'https://www.rdb.lk',
    categories: ['Agriculture', 'Fishing'],
    notes: 'Subsidised rate through government schemes.',
  },
  {
    name: 'EDB Export Development Grant',
    provider: 'Export Development Board',
    type: 'Government Grant',
    amount: 'Varies by programme',
    interest: 'N/A (Grant)',
    eligibility: 'Export-oriented businesses',
    contact: '011 2300705',
    url: 'https://www.edb.gov.lk',
    categories: ['Manufacturing', 'Agriculture', 'Garments', 'Fishing'],
    notes: 'Non-repayable grant for export market entry and product development.',
  },
  {
    name: 'SLTDA Tourism Grant',
    provider: 'Sri Lanka Tourism Development Authority',
    type: 'Government Grant/Loan',
    amount: 'Up to LKR 10 million',
    interest: 'Low interest',
    eligibility: 'Registered tourism businesses',
    contact: '011 2426900',
    url: 'https://www.sltda.gov.lk',
    categories: ['Tourism'],
  },
  {
    name: 'HNB Grameen Micro Finance',
    provider: 'HNB Grameen Finance',
    type: 'Micro Finance',
    amount: 'LKR 25,000 – 500,000',
    interest: '~20% p.a.',
    eligibility: 'Micro businesses, women entrepreneurs',
    contact: '011 7988988',
    url: 'https://www.hnbgrameen.lk',
    categories: ['Retail', 'Restaurant', 'all'],
    notes: 'Ideal for very small businesses and home-based entrepreneurs.',
  },
  {
    name: 'Sampath Bank SME Loan',
    provider: 'Sampath Bank',
    type: 'Bank Loan',
    amount: 'Up to LKR 30 million',
    interest: '~14% p.a.',
    eligibility: 'SME with 2+ years operation',
    contact: '011 4730000',
    url: 'https://www.sampath.lk',
    categories: ['all'],
  },
  {
    name: 'ITI Industrial Support',
    provider: 'Industrial Technology Institute',
    type: 'Technical Support & Grant',
    amount: 'Technical assistance + partial grant',
    interest: 'N/A',
    eligibility: 'Manufacturing businesses',
    contact: '011 2379800',
    url: 'https://www.iti.lk',
    categories: ['Manufacturing', 'Garments'],
    notes: 'Product testing, quality certification, technology transfer support.',
  },
  {
    name: 'Women Entrepreneur Loan – BOI',
    provider: 'Board of Investment',
    type: 'Government Support',
    amount: 'Varies',
    interest: 'Concessionary',
    eligibility: 'Women-led businesses, export potential',
    contact: '011 2300947',
    url: 'https://www.investsrilanka.com',
    categories: ['all'],
    notes: 'BOI registration gives tax holidays and infrastructure support.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 4. BUSINESS RECOVERY PLAYBOOKS  (by category)
// ─────────────────────────────────────────────────────────────────────────────
const RECOVERY_PLAYBOOKS = {
  'Retail': {
    commonProblems: ['Low foot traffic', 'High inventory costs', 'Online competition', 'Price competition'],
    quickWins: [
      'Move slow inventory with a "flash sale" WhatsApp broadcast to existing customers',
      'List products on Daraz.lk (Sri Lanka\'s top e-commerce platform)',
      'Create a Facebook Shop linked to your business page',
      'Introduce a loyalty card — buy 9 get 1 free',
      'Partner with nearby businesses for cross-promotion',
    ],
    mediumTerm: [
      'Build a WhatsApp Business number with product catalogue',
      'Start a Facebook/Instagram page with daily product posts',
      'Introduce home delivery within 5km radius',
      'Negotiate better supplier credit terms (30–60 day credit)',
    ],
    digitalTools: ['Daraz.lk', 'Facebook Marketplace', 'WhatsApp Business', 'ikman.lk'],
  },
  'Restaurant': {
    commonProblems: ['Rising food costs', 'Low repeat customers', 'Food delivery competition', 'Staff turnover'],
    quickWins: [
      'Register on PickMe Food and Uber Eats Sri Lanka',
      'Create Instagram reels of your best dishes — food content goes viral',
      'Introduce a "Lunch Combo" weekday deal to boost midday traffic',
      'Build a customer WhatsApp group for daily specials and promotions',
      'Reduce menu size — 70% of revenue comes from 30% of menu items',
    ],
    mediumTerm: [
      'Add a catering service for offices and events',
      'Apply for a "Clean Restaurant" certification from DIMO/Health authority',
      'Introduce meal prep packages for busy families',
      'Partner with local hotels for breakfast/catering contracts',
    ],
    digitalTools: ['PickMe Food', 'Uber Eats', 'Instagram', 'Zomato Sri Lanka'],
  },
  'Tourism': {
    commonProblems: ['Post-pandemic recovery', 'Seasonal fluctuations', 'Online review management', 'Competition from large hotels'],
    quickWins: [
      'Respond to ALL Google Maps and TripAdvisor reviews within 24 hours',
      'Create packages targeting Sri Lankan domestic tourists (a growing segment)',
      'List on Airbnb, Booking.com, and Hotels.com if not already done',
      'Offer a "Colombo Day Trip" package to reach city travellers',
    ],
    mediumTerm: [
      'Apply for SLTDA grant for tourism property improvement',
      'Partner with local tour guides and operators for referral commissions',
      'Create Instagram content showcasing unique local experiences',
      'Target the "workcation" market — WiFi + workspace packages for remote workers',
    ],
    digitalTools: ['TripAdvisor', 'Airbnb', 'Booking.com', 'Google My Business', 'Instagram'],
  },
  'Agriculture': {
    commonProblems: ['Price volatility', 'Post-harvest losses', 'Climate impact', 'Market access'],
    quickWins: [
      'Register with Govijana Portal (govijana.lk) for government support',
      'Contact your nearest Divisional Agricultural Instructor (DAI)',
      'Explore cold storage options at regional government facilities',
      'Join a farmer cooperative for bulk selling power',
    ],
    mediumTerm: [
      'Apply for RDB Agricultural Loan at 8% subsidised rate',
      'Explore organic certification for premium pricing (30–50% markup)',
      'Partner with supermarkets (Keells, Cargills) for direct supply contracts',
      'Contact EDB for export market access for agri-products',
    ],
    digitalTools: ['Govijana Portal', 'Facebook agricultural groups', 'WhatsApp farmer networks'],
  },
  'IT & Technology': {
    commonProblems: ['Talent acquisition cost', 'USD income vs LKR expenses', 'Client acquisition', 'Competition from global firms'],
    quickWins: [
      'Register on Upwork, Fiverr, and Toptal for international clients',
      'ICTA offers grants and support for Sri Lankan IT startups',
      'Explore USD-earning models to hedge against LKR depreciation',
      'Apply for SLASSCOM membership for networking and opportunities',
    ],
    mediumTerm: [
      'BOI registration gives IT companies significant tax advantages',
      'Apply for ICTA e-Swabhimani digital development grants',
      'Explore the Digital Economy Commission of Sri Lanka resources',
      'Build a LinkedIn presence to attract international clients',
    ],
    digitalTools: ['Upwork', 'Fiverr', 'SLASSCOM', 'ICTA portal', 'LinkedIn'],
  },
  'Manufacturing': {
    commonProblems: ['High energy costs', 'Raw material costs', 'Export market access', 'Regulatory compliance'],
    quickWins: [
      'Apply for ITI (Industrial Technology Institute) technical support',
      'Audit energy usage — switch to solar (LECO net metering available)',
      'Register with EDB for export market assistance',
      'Contact your nearest Industrial Development Board regional office',
    ],
    mediumTerm: [
      'BOI registration for tax holidays if export-oriented',
      'ISO certification opens international market doors',
      'Apply for DFCC Bank manufacturing loan',
      'Explore industrial zone benefits in Biyagama, Katunayake, or Koggala',
    ],
  },
  'Fishing': {
    commonProblems: ['Rising fuel costs', 'Market price volatility', 'Equipment costs', 'Weather disruptions'],
    quickWins: [
      'Register with NARA (National Aquatic Resources Authority)',
      'Access DFAR (Dept of Fisheries) subsidised fuel scheme',
      'Join local fishermen cooperative for collective bargaining',
      'Explore value-added products (dried fish, fish paste) for better margins',
    ],
    mediumTerm: [
      'Apply for RDB Fishing Industry Loan at concessionary rates',
      'Explore export certification for seafood with EDB and SLS',
      'Contact Ceylon Fisheries Corporation for processing facilities',
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. INTENT PATTERNS  (for rule-based inference engine fallback)
// ─────────────────────────────────────────────────────────────────────────────
const INTENT_PATTERNS = [
  {
    intent: 'falling_sales',
    patterns: ['sales drop', 'sales down', 'fewer customers', 'no customers', 'loss of revenue',
                'revenue down', 'not selling', 'business slow', 'slow business', 'no sales',
                'profit drop', 'income reduced', 'customers not coming'],
    responseKey: 'fallingSales',
  },
  {
    intent: 'no_profit',
    patterns: ['no profit', 'making loss', 'not profitable', 'losing money', 'expenses too high',
                'costs too high', 'break even', 'negative profit', 'in debt', 'debt'],
    responseKey: 'noProfit',
  },
  {
    intent: 'funding',
    patterns: ['loan', 'funding', 'money', 'capital', 'invest', 'borrow', 'finance', 'grant',
                'microfinance', 'bank', 'credit'],
    responseKey: 'funding',
  },
  {
    intent: 'digital_marketing',
    patterns: ['marketing', 'advertise', 'online', 'social media', 'facebook', 'instagram',
                'tiktok', 'google', 'website', 'promote', 'brand', 'digital'],
    responseKey: 'digitalMarketing',
  },
  {
    intent: 'legal_register',
    patterns: ['register', 'legal', 'license', 'permit', 'company', 'sole proprietor',
                'formalise', 'tax', 'gst', 'vat'],
    responseKey: 'legalRegister',
  },
  {
    intent: 'expand',
    patterns: ['expand', 'growth', 'scale', 'new branch', 'new city', 'open another',
                'franchise', 'grow business'],
    responseKey: 'expand',
  },
  {
    intent: 'cash_flow',
    patterns: ['cash flow', 'cash problem', 'no cash', 'running out of money', 'cant pay',
                'overdue', 'bills', 'supplier payment', 'payroll'],
    responseKey: 'cashFlow',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 6. KNOWLEDGE BASE EXPORTS
// ─────────────────────────────────────────────────────────────────────────────
window.KB = {
  SMALL_TALK,
  CITY_PROFILES,
  FUNDING_SCHEMES,
  RECOVERY_PLAYBOOKS,
  INTENT_PATTERNS,

  /** Look up a city profile by name (case-insensitive) */
  getCityProfile(city) {
    if (!city) return null;
    const key = Object.keys(CITY_PROFILES).find(
      k => k.toLowerCase() === city.toLowerCase()
    );
    return key ? CITY_PROFILES[key] : null;
  },

  /** Get funding schemes relevant to a category */
  getFundingForCategory(category) {
    return FUNDING_SCHEMES.filter(s =>
      !s.categories ||
      s.categories.includes('all') ||
      s.categories.includes(category)
    );
  },

  /** Get the recovery playbook for a category */
  getPlaybook(category) {
    return RECOVERY_PLAYBOOKS[category] || null;
  },

  /** Detect intent from user text */
  detectIntent(text) {
    const lower = text.toLowerCase();
    for (const item of INTENT_PATTERNS) {
      if (item.patterns.some(p => lower.includes(p))) {
        return item.intent;
      }
    }
    return null;
  },

  /** Check for small talk match */
  matchSmallTalk(text) {
    const lower = text.toLowerCase().trim();
    for (const [key, response] of Object.entries(SMALL_TALK)) {
      if (lower.includes(key)) return response;
    }
    return null;
  },
};

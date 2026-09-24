/**
 * Categories are derived from the upstream data rather than hardcoded, so a new
 * upstream section does not silently vanish. These maps only supply presentation
 * detail and a fallback for entries that arrive without a category.
 *
 * Category emoji were removed deliberately: decorative emoji on every tile made the
 * site read as machine-generated, and the category name alone is clearer.
 */

/**
 * Upstream calls this "Machine Learning". Almost nobody searches for that any more,
 * and every comparable directory now labels it AI, so the slug is rewritten here.
 * A redirect in next.config.ts keeps the old URL working.
 */
export const CATEGORY_SLUG_ALIASES: Record<string, string> = {
  'machine-learning': 'ai',
  'artificial-intelligence': 'ai',
};

export const CATEGORY_NAME_OVERRIDE: Record<string, string> = {
  ai: 'AI',
};

/**
 * Entries whose upstream category buries what they actually are.
 *
 * The rule applied here is narrow on purpose: an entry moves into `ai` only when
 * model inference is the service being sold — you send input, a model returns
 * output — or when it brokers access to models. Job boards for AI roles, news
 * about AI, regulation trackers and products that merely use AI internally keep
 * their own category, because that is where someone looking for them would go.
 */
export const API_CATEGORY_OVERRIDE: Record<string, string> = {
  'agent-gateway-api': 'ai',
  'brainshop-ai': 'ai',
  kavel: 'ai',
  'launch-pics': 'ai',
  'micro-saas-ai-suite': 'ai',
  docstruct: 'ai',
  'hirak-ocr': 'ai',
  'ocr-space': 'ai',
  'agify-io': 'ai',
  sunor: 'ai',
  'svg-new': 'ai',
  upres: 'ai',
  'text-till-kladdesign': 'ai',
  tohuman: 'ai',
  'scriptmasterlabs-mcp': 'ai',
};

export const CATEGORY_DESCRIPTION: Record<string, string> = {
  weather: 'Forecasts, current conditions, historical climate data and severe weather alerts.',
  animals: 'Facts, images and datasets covering pets, wildlife and species records.',
  anime: 'Anime, manga and related media catalogues, artwork and quotations.',
  cryptocurrency: 'Prices, market data, on-chain activity and exchange information.',
  'currency-exchange': 'Live and historical foreign exchange rates and conversion.',
  finance: 'Market data, company fundamentals, banking and payment services.',
  geocoding: 'Address lookup, reverse geocoding, boundaries, maps and places data.',
  government: 'Official open data published by national and local government bodies.',
  ai: 'Hosted models for language, vision, speech and inference, plus the metadata APIs that track model pricing and deprecation.',
  music: 'Track metadata, lyrics, audio features and streaming catalogues.',
  news: 'Headlines, full article feeds and aggregated media coverage.',
  'test-data': 'Mock endpoints, fake records and sandboxes for development and testing.',
  photography: 'Stock imagery, image hosting, processing and photo metadata.',
  'games-and-comics': 'Game catalogues, live stats, comics and trivia databases.',
  'sports-and-fitness': 'Fixtures, live scores, standings, athletes and activity tracking.',
  development: 'Tooling for developers: source control, hosting, utilities and automation.',
  security: 'Threat intelligence, breach lookup, vulnerability feeds and scanning.',
  email: 'Sending, validating, and disposable-inbox APIs for handling email programmatically.',
  video: 'Video catalogues, streaming metadata, hosting and transcoding.',
  health: 'Medical reference data, nutrition, public health statistics and fitness.',
  pharma: 'Drug and clinical trial registries, regulatory filings and pharmaceutical research data.',
  'food-and-drink': 'Recipes, ingredients, nutrition facts, restaurants and beverages.',
  science: 'Research data, astronomy, physics, chemistry and reference constants.',
  'science-and-math': 'Research datasets, astronomy, physics, chemistry and computation.',
  books: 'Book metadata, full texts, libraries and reading lists.',
  business: 'Company records, invoicing, CRM, analytics and productivity services.',
  social: 'Social networks, messaging, community platforms and user profiles.',
  transportation: 'Transit schedules, flights, shipping, routing and live vehicle data.',
  uncategorised: 'Entries that upstream sources publish without a category.',
};

/**
 * Keyword rules for entries that arrive without a category, checked in listed order
 * and returning on first match — so more specific categories must be listed before
 * more generic ones. `security` and `email` sit ahead of `geocoding` deliberately:
 * geocoding's bare `address` keyword otherwise catches "email address" in a data-breach
 * or temp-mail API's description before the entry ever reaches a rule that actually
 * names it (a real bug found via a Reddit reader flagging a breach-checker API filed
 * under Geocoding).
 */
const INFERENCE_RULES: Array<[string, RegExp]> = [
  ['weather', /\b(weather|forecast|climate|temperature|rainfall|meteorolog|hurricane|storm)\b/i],
  ['cryptocurrency', /\b(crypto|bitcoin|ethereum|blockchain|token|defi|nft|web3)\b/i],
  ['currency-exchange', /\b(exchange rate|currency|forex|fx rate|conversion rate)\b/i],
  ['finance', /\b(stock|finance|financial|market|trading|bank|invoice|payment|tax|invest)\b/i],
  ['machine-learning', /\b(\ai\b|artificial intelligence|machine learning|\bllm\b|\bgpt\b|neural|inference|embedding)\b/i],
  ['security', /\b(security|breach|vulnerab|malware|phishing|threat|password|encrypt)\b/i],
  ['email', /\b(email|smtp|mailbox|newsletter|inbox)\b/i],
  ['geocoding', /\b(geocod|map|location|coordinates|latitude|longitude|address|places|country|countries|city|cities|postal|zip)\b/i],
  ['animals', /\b(animal|dog|cat|bird|fish|pet|species|wildlife|axolotl|dinosaur)\b/i],
  ['anime', /\b(anime|manga|waifu|otaku)\b/i],
  ['games-and-comics', /\b(game|gaming|comic|pokemon|minecraft|steam|trivia|quiz|chess|puzzle)\b/i],
  ['music', /\b(music|song|lyric|album|artist|spotify|audio track|playlist)\b/i],
  ['video', /\b(video|movie|film|tv show|streaming|youtube|cinema)\b/i],
  ['news', /\b(news|headline|article|journalis|press|media outlet)\b/i],
  ['food-and-drink', /\b(food|recipe|meal|nutrition|restaurant|beer|wine|cocktail|coffee|drink)\b/i],
  ['sports-and-fitness', /\b(sport|football|soccer|basketball|cricket|tennis|nba|nfl|fitness|workout|athlete)\b/i],
  ['books', /\b(book|library|novel|literature|isbn|poetry|bible|quran)\b/i],
  ['photography', /\b(photo|image|picture|stock photo|avatar|thumbnail|screenshot)\b/i],
  ['health', /\b(health|medical|medicine|covid|disease|hospital|doctor|drug|clinical)\b/i],
  ['government', /\b(government|federal|census|public sector|parliament|election|municipal)\b/i],
  ['science-and-math', /\b(science|nasa|space|astronom|physics|chemistry|math|research|satellite)\b/i],
  ['phone', /\b(phone|sms|telephone|mobile number|carrier lookup)\b/i],
  ['test-data', /\b(mock|fake|placeholder|dummy|test data|sandbox|random user|lorem)\b/i],
  ['development', /\b(developer|api tool|webhook|deploy|hosting|github|git |ci\/cd|json|http)\b/i],
  ['text-analysis', /\b(text analys|sentiment|translat|language detect|summari|nlp)\b/i],
  ['social', /\b(social|reddit|twitter|mastodon|discord|chat|forum|community)\b/i],
  ['transportation', /\b(transit|flight|airport|train|bus|shipping|vehicle|traffic|railway)\b/i],
  ['open-data', /\b(open data|dataset|statistics|public data)\b/i],
  ['entertainment', /\b(joke|meme|quote|fun|entertainment|horoscope|fortune)\b/i],
];

export function inferCategorySlug(name: string, description: string): string {
  const haystack = `${name} ${description}`;
  for (const [slug, rule] of INFERENCE_RULES) {
    if (rule.test(haystack)) return slug;
  }
  return 'uncategorised';
}


export function categoryDescription(slug: string, name: string): string {
  return (
    CATEGORY_DESCRIPTION[slug] ??
    `Free public APIs for ${name.toLowerCase()}, each one verified and kept up to date.`
  );
}

/** Turns an inferred slug back into a display name when no upstream label exists. */
export function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .map((w) => (w === 'and' ? '&' : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}

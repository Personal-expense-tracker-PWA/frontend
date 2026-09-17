// Keyword -> emoji lookup used to auto-suggest a category icon from its name.
// Ordered roughly most-specific-first; longer/more specific keywords are checked
// before shorter ones so e.g. "car insurance" matches "insurance" correctly
// rather than an earlier unrelated short keyword.
const KEYWORD_ICONS = [
  // Food & drink
  ['restaurant', '🍽️'],
  ['dining', '🍽️'],
  ['breakfast', '🍳'],
  ['lunch', '🍱'],
  ['dinner', '🍽️'],
  ['grocery', '🛒'],
  ['groceries', '🛒'],
  ['supermarket', '🛒'],
  ['coffee', '☕'],
  ['cafe', '☕'],
  ['tea', '🍵'],
  ['pizza', '🍕'],
  ['burger', '🍔'],
  ['bakery', '🥐'],
  ['snack', '🍿'],
  ['wine', '🍷'],
  ['beer', '🍺'],
  ['alcohol', '🍸'],
  ['bar', '🍸'],
  ['pub', '🍺'],
  ['food', '🍔'],

  // Transport
  ['fuel', '⛽'],
  ['petrol', '⛽'],
  ['diesel', '⛽'],
  ['gas station', '⛽'],
  ['parking', '🅿️'],
  ['toll', '🛣️'],
  ['taxi', '🚕'],
  ['cab', '🚕'],
  ['uber', '🚕'],
  ['ola', '🚕'],
  ['flight', '✈️'],
  ['airfare', '✈️'],
  ['airline', '✈️'],
  ['train', '🚆'],
  ['metro', '🚇'],
  ['bus', '🚌'],
  ['bike', '🏍️'],
  ['scooter', '🛵'],
  ['car service', '🔧'],
  ['car repair', '🔧'],
  ['car', '🚗'],
  ['vehicle', '🚗'],
  ['transport', '🚌'],
  ['travel', '✈️'],

  // Home & bills
  ['rent', '🏠'],
  ['mortgage', '🏠'],
  ['electricity', '💡'],
  ['power bill', '💡'],
  ['water bill', '🚰'],
  ['wifi', '📶'],
  ['internet', '📶'],
  ['broadband', '📶'],
  ['phone bill', '📱'],
  ['mobile recharge', '📱'],
  ['recharge', '📱'],
  ['subscription', '🔁'],
  ['netflix', '🎬'],
  ['spotify', '🎵'],
  ['insurance', '🛡️'],
  ['emi', '🏦'],
  ['loan', '🏦'],
  ['tax', '🧾'],
  ['maintenance', '🔧'],
  ['repair', '🔧'],
  ['cleaning', '🧹'],
  ['laundry', '🧺'],
  ['furniture', '🛋️'],
  ['decor', '🖼️'],
  ['bill', '🧾'],
  ['home', '🏠'],

  // Health
  ['doctor', '🩺'],
  ['hospital', '🏥'],
  ['pharmacy', '💊'],
  ['medicine', '💊'],
  ['dentist', '🦷'],
  ['gym', '🏋️'],
  ['fitness', '🏋️'],
  ['yoga', '🧘'],
  ['therapy', '🧠'],
  ['health', '💊'],
  ['medical', '💊'],

  // Shopping
  ['clothes', '👕'],
  ['clothing', '👕'],
  ['shoes', '👟'],
  ['fashion', '👗'],
  ['electronics', '💻'],
  ['gadget', '📱'],
  ['laptop', '💻'],
  ['computer', '💻'],
  ['books', '📚'],
  ['stationery', '✏️'],
  ['gift', '🎁'],
  ['jewelry', '💍'],
  ['jewellery', '💍'],
  ['beauty', '💄'],
  ['cosmetics', '💄'],
  ['salon', '💇'],
  ['haircut', '💇'],
  ['spa', '💆'],
  ['shopping', '🛍️'],

  // Entertainment
  ['movie', '🎬'],
  ['cinema', '🎬'],
  ['concert', '🎤'],
  ['music', '🎵'],
  ['gaming', '🎮'],
  ['game', '🎮'],
  ['party', '🎉'],
  ['event', '🎟️'],
  ['ticket', '🎟️'],
  ['hobby', '🎨'],
  ['entertainment', '🎬'],

  // Family & education
  ['baby', '🍼'],
  ['kids', '🧒'],
  ['child', '🧒'],
  ['school', '🏫'],
  ['education', '🎓'],
  ['tuition', '🎓'],
  ['college', '🎓'],
  ['daycare', '🧒'],

  // Pets
  ['pet', '🐾'],
  ['dog', '🐶'],
  ['cat', '🐱'],
  ['vet', '🐾'],

  // Travel / vacation
  ['vacation', '🏖️'],
  ['hotel', '🏨'],
  ['holiday', '🏖️'],
  ['trip', '🧳'],

  // Finance & misc
  ['donation', '🎗️'],
  ['charity', '🎗️'],
  ['investment', '📈'],
  ['savings', '💰'],
  ['salary', '💰'],
  ['other', '📦'],
];

// Curated set of emoji offered in the manual icon picker, grouped for a scannable grid.
// Deduplicated (a Set) since several keywords above intentionally share an icon.
export const ICON_CHOICES = [...new Set([
  // Money & finance
  '💰', '💵', '💳', '🏦', '🧾', '📈', '📉', '🪙', '💸', '🎗️',
  // Food & drink
  '🍔', '🍕', '🍱', '🍳', '☕', '🍵', '🍺', '🍷', '🍸', '🥐', '🛒', '🍿', '🍰',
  // Transport
  '🚗', '🚕', '🚌', '🚆', '🚇', '✈️', '🏍️', '🛵', '🚲', '⛽', '🅿️', '🛣️', '🔧',
  // Home & bills
  '🏠', '💡', '🚰', '📶', '🔁', '🛡️', '🧹', '🧺', '🛋️', '🖼️', '🔥', '📦',
  // Health & fitness
  '💊', '🏥', '🩺', '🦷', '🏋️', '🧘', '🧠', '🐾',
  // Shopping & personal
  '🛍️', '👕', '👟', '👗', '💻', '📱', '📚', '✏️', '🎁', '💍', '💄', '💇', '💆',
  // Entertainment & hobbies
  '🎬', '🎤', '🎵', '🎮', '🎉', '🎟️', '🎨', '📷', '🎸', '⚽',
  // Family, pets & travel
  '🍼', '🧒', '🏫', '🎓', '🐶', '🐱', '🏖️', '🏨', '🧳',
  // Misc
  '🎂', '🌱', '🐦', '❤️', '⭐', '🌍', '📅', '⏰', '🔒', '❓',
])];

/**
 * Suggests an emoji for a category name by matching it (or its words) against
 * a keyword dictionary. Falls back to a generic box icon when nothing matches.
 */
export function suggestCategoryIcon(name) {
  const normalized = (name || '').trim().toLowerCase();
  if (!normalized) return '📦';

  for (const [keyword, icon] of KEYWORD_ICONS) {
    if (normalized === keyword) return icon;
  }
  for (const [keyword, icon] of KEYWORD_ICONS) {
    if (normalized.includes(keyword)) return icon;
  }
  const words = normalized.split(/\s+/);
  for (const word of words) {
    for (const [keyword, icon] of KEYWORD_ICONS) {
      if (keyword.includes(word) && word.length >= 3) return icon;
    }
  }
  return '📦';
}

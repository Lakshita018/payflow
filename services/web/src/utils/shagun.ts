// ---------------------------------------------------------------------------
// shagun.ts — Shagun (auspicious gift) amount detection and wish suggestions.
//
// In Indian tradition, shagun amounts end in 1 (₹11, ₹51, ₹101, ₹501 …) or
// follow well-known round multiples like ₹1100, ₹2100, ₹5100, ₹11000 …
// When the user enters one of these amounts the app surfaces context-aware
// message suggestions so they don't have to type a wish from scratch.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// The canonical set of recognised shagun amounts.
// Sorted ascending so bisect-based lookup is possible in the future.
// ---------------------------------------------------------------------------
export const SHAGUN_AMOUNTS = new Set([
  11, 21, 31, 51, 101, 151, 201, 251, 301, 501,
  1001, 1100, 1501, 2001, 2100, 2501,
  3100, 5001, 5100,
  7001, 7100,
  10001, 11000,
  21000, 51000, 101000,
]);

/** Returns true when `amount` is a recognised shagun value. */
export function isShagunAmount(raw: string): boolean {
  const n = parseFloat(raw.replace(/,/g, ''));
  if (!n || isNaN(n) || n !== Math.floor(n)) return false;
  return SHAGUN_AMOUNTS.has(n);
}

// ---------------------------------------------------------------------------
// Wish categories — each entry is a short message that fits in the chip.
// ---------------------------------------------------------------------------
export interface ShagunWish {
  label: string;   // shown on the chip (short)
  message: string; // full text inserted into the note/message field
}

// General wishes shown for any shagun amount
const GENERAL_WISHES: ShagunWish[] = [
  { label: 'Congratulations', message: 'Heartiest congratulations! Wishing you much happiness and success. 🎉' },
  { label: 'Best Wishes',     message: 'Best wishes for your new journey. May you always prosper! 🌟' },
  { label: 'Good Luck',       message: 'Good luck on this wonderful occasion. Shagun se badhe naam! 🤞' },
  { label: 'With Blessings',  message: 'Sending you lots of love and blessings. Stay blessed! 🙏' },
];

// Amount-specific overrides — more contextual when we can guess the occasion
const AMOUNT_WISHES: Record<number, ShagunWish[]> = {
  11: [
    { label: 'Shagun',           message: 'Shagun di badhai! Rab rakha. 🙏' },
    { label: 'Best Wishes',      message: 'Best wishes on this auspicious occasion! ✨' },
    { label: 'Good Luck',        message: 'Good luck always. Sending you shagun with love! 💛' },
    { label: 'With Love',        message: 'With lots of love and blessings — shagun for you! 💐' },
  ],
  21: [
    { label: 'Best Wishes',      message: 'Heartiest best wishes on this special day! 🌸' },
    { label: 'Shagun',           message: 'Shagun di badhai! Khush raho sada. 🙏' },
    { label: 'Stay Blessed',     message: 'May you always stay blessed and happy. 🌟' },
    { label: 'With Love',        message: 'Sending this little shagun with lots of love! 💛' },
  ],
  51: [
    { label: 'Congratulations',  message: 'Congratulations on this joyous occasion! 🎊' },
    { label: 'Shagun',           message: 'Shagun for you — may happiness be yours always. 🙏' },
    { label: 'Best Wishes',      message: 'Best wishes and blessings on this special day! ✨' },
    { label: 'With Blessings',   message: 'Sending this with blessings and lots of love. 💐' },
  ],
  101: [
    { label: 'Congratulations',  message: 'Congratulations! May your new chapter be filled with joy. 🎉' },
    { label: 'Best Wishes',      message: 'Best wishes for the road ahead. You deserve the best! 🌟' },
    { label: 'Shagun',           message: 'Shagun di badhai! Rab rakhe. 🙏' },
    { label: 'With Love',        message: 'With all my love and blessings — wishing you the very best! 💛' },
  ],
  501: [
    { label: 'Congratulations',  message: 'Hearty congratulations on this beautiful occasion! 🎊' },
    { label: 'Best Wishes',      message: 'Best wishes and blessings for a wonderful life ahead. 🌺' },
    { label: 'Happy Wedding',    message: 'Wishing you a lifetime of love, laughter, and happiness. 💍' },
    { label: 'With Blessings',   message: 'Sending this with heartfelt blessings. Khush raho! 🙏' },
  ],
  1001: [
    { label: 'Best Wishes',      message: 'Best wishes on this special milestone! 🌟' },
    { label: 'Congratulations',  message: 'Congratulations — here is your shagun with lots of love. 🎉' },
    { label: 'Happy Wedding',    message: 'Wishing you a blissful and prosperous married life. 💍' },
    { label: 'With Blessings',   message: 'With blessings and good wishes for a bright future. 🙏' },
  ],
  1100: [
    { label: 'Happy Wedding',    message: 'Wishing you a lifetime of togetherness and love. 💍' },
    { label: 'Congratulations',  message: 'Heartiest congratulations on your special day! 🎊' },
    { label: 'Best Wishes',      message: 'May your new journey be full of happiness and prosperity. 🌸' },
    { label: 'Happy New Year',   message: 'Happy New Year! May this year bring you health, wealth, and happiness. 🎆' },
  ],
  2100: [
    { label: 'Happy Wedding',    message: 'Congratulations on your wedding! May your bond grow stronger every day. 💍' },
    { label: 'Congratulations',  message: 'Heartfelt congratulations on this wonderful occasion! 🎊' },
    { label: 'Best Wishes',      message: 'Best wishes for a joyful and prosperous life ahead. ✨' },
    { label: 'With Blessings',   message: 'Sending shagun with all our love and blessings. 🙏' },
  ],
  5100: [
    { label: 'Happy Wedding',    message: 'With heartfelt blessings on your wedding. May you both always be happy! 💍' },
    { label: 'Congratulations',  message: 'Congratulations on this beautiful milestone. Here is your shagun with love! 🎉' },
    { label: 'Best Wishes',      message: 'Wishing you endless happiness, health, and prosperity. 🌺' },
    { label: 'Happy Birthday',   message: 'Happy Birthday! May this year bring you all the success you deserve. 🎂' },
  ],
  11000: [
    { label: 'Happy Wedding',    message: 'A big congratulations on your wedding! Wishing you both a lifetime of bliss. 💍' },
    { label: 'Congratulations',  message: 'Heartfelt congratulations. May your dreams come true! 🌟' },
    { label: 'Happy Birthday',   message: 'Happy Birthday! Wishing you health, wealth, and happiness always. 🎂' },
    { label: 'Best Wishes',      message: 'Best wishes on this joyous occasion. You deserve all the happiness! 🎊' },
  ],
  21000: [
    { label: 'Happy Wedding',    message: 'Wishing you a beautiful life together — congratulations! 💍' },
    { label: 'Congratulations',  message: 'Heartfelt congratulations on this wonderful milestone. 🎉' },
    { label: 'Happy Housewarming', message: 'Happy Housewarming! May your new home be filled with love and laughter. 🏡' },
    { label: 'Best Wishes',      message: 'Best wishes for a bright, joyful, and prosperous future. ✨' },
  ],
};

/**
 * Returns the best list of ShagunWish objects for the given raw amount string.
 * Falls back to GENERAL_WISHES if the amount is shagun but has no specific overrides.
 * Returns an empty array if the amount is not a shagun amount.
 */
export function getShagunWishes(raw: string): ShagunWish[] {
  const n = parseFloat(raw.replace(/,/g, ''));
  if (!n || isNaN(n) || !isShagunAmount(raw)) return [];
  return AMOUNT_WISHES[n] ?? GENERAL_WISHES;
}

/* ============================================================
   ΦΙΛΤΡΑ ΧΡΩΜΑΤΟΣ — συλλογή από Instagram, Snapchat, TikTok
   Κάθε φίλτρο = CSS filter (canvas ctx.filter) + προαιρετικό vignette
   ============================================================ */
const FILTERS = [
  // --- Κανονικό ---
  { id: 'none',    name: 'Κανονικό',  css: 'none', vig: 0 },

  // --- Instagram (όλα τα κλασικά) ---
  { id: 'clarendon', name: 'Clarendon', css: 'saturate(1.5) contrast(1.1) brightness(1.05)', vig: 0 },
  { id: 'gingham',   name: 'Gingham',   css: 'sepia(0.3) saturate(1.1) contrast(0.9) brightness(1.05)', vig: 0 },
  { id: 'moon',      name: 'Moon',      css: 'grayscale(1) contrast(1.25) brightness(1.02)', vig: 0.15 },
  { id: 'lark',      name: 'Lark',      css: 'brightness(1.08) saturate(0.85) contrast(0.95)', vig: 0 },
  { id: 'reyes',     name: 'Reyes',     css: 'sepia(0.25) saturate(1.45) brightness(1.12)', vig: 0 },
  { id: 'juno',      name: 'Juno',      css: 'saturate(1.6) contrast(1.1) hue-rotate(-10deg)', vig: 0 },
  { id: 'slumber',   name: 'Slumber',   css: 'saturate(0.5) brightness(0.95) hue-rotate(-20deg)', vig: 0 },
  { id: 'crema',     name: 'Crema',     css: 'sepia(0.2) brightness(1.08) contrast(0.95)', vig: 0 },
  { id: 'ludwig',    name: 'Ludwig',    css: 'saturate(0.7) brightness(1.05) hue-rotate(-10deg)', vig: 0 },
  { id: 'aden',      name: 'Aden',      css: 'sepia(0.2) saturate(0.85) hue-rotate(-15deg) brightness(1.05)', vig: 0 },
  { id: 'perpetua',  name: 'Perpetua',  css: 'sepia(0.15) saturate(0.9) hue-rotate(10deg) brightness(1.05)', vig: 0 },
  { id: 'amaro',     name: 'Amaro',     css: 'sepia(0.35) saturate(1.1) brightness(1.05) contrast(0.95)', vig: 0.22 },
  { id: 'mayfair',   name: 'Mayfair',   css: 'saturate(1.1) sepia(0.15) brightness(1.05)', vig: 0 },
  { id: 'rise',      name: 'Rise',      css: 'sepia(0.2) brightness(1.12) saturate(1.1)', vig: 0 },
  { id: 'hudson',    name: 'Hudson',    css: 'sepia(0.25) saturate(1.1) brightness(0.95) contrast(1.05)', vig: 0.2 },
  { id: 'valencia',  name: 'Valencia',  css: 'sepia(0.25) saturate(0.9) brightness(1.1)', vig: 0.25 },
  { id: 'xpro2',     name: 'X-Pro II',  css: 'sepia(0.3) saturate(1.2) contrast(1.15) brightness(0.95)', vig: 0.3 },
  { id: 'sierra',    name: 'Sierra',    css: 'sepia(0.2) saturate(0.9) brightness(1.05) contrast(0.9)', vig: 0 },
  { id: 'willow',    name: 'Willow',    css: 'grayscale(0.9) brightness(1.05) contrast(0.9)', vig: 0 },
  { id: 'lofi',      name: 'Lo-Fi',     css: 'saturate(1.3) contrast(1.15) brightness(0.95)', vig: 0.28 },
  { id: 'inkwell',   name: 'Inkwell',   css: 'grayscale(1) contrast(1.1) brightness(1.05)', vig: 0.25 },
  { id: 'hefe',      name: 'Hefe',      css: 'saturate(1.4) contrast(1.05) brightness(0.95)', vig: 0.25 },
  { id: 'nashville', name: 'Nashville', css: 'sepia(0.25) saturate(1.2) brightness(1.1)', vig: 0 },
  { id: '1977',      name: '1977',      css: 'sepia(0.3) saturate(1.1) contrast(1.1) hue-rotate(-10deg)', vig: 0 },
  { id: 'kelvin',    name: 'Kelvin',    css: 'sepia(0.4) saturate(1.2) brightness(1.15) hue-rotate(10deg)', vig: 0 },
  { id: 'toaster',   name: 'Toaster',   css: 'sepia(0.25) saturate(1.2) brightness(0.95) contrast(0.95)', vig: 0.3 },
  { id: 'sutro',     name: 'Sutro',     css: 'sepia(0.3) saturate(0.8) contrast(1.1) brightness(0.9)', vig: 0.32 },
  { id: 'earlybird', name: 'Earlybird', css: 'sepia(0.25) saturate(0.9) contrast(1.05)', vig: 0.2 },
  { id: 'brannan',   name: 'Brannan',   css: 'sepia(0.35) saturate(0.7) contrast(1.15)', vig: 0.25 },
  { id: 'stinson',   name: 'Stinson',   css: 'saturate(0.8) brightness(1.08) contrast(0.95) hue-rotate(-5deg)', vig: 0 },

  // --- Snapchat στυλ ---
  { id: 'vivid',   name: 'Vivid',   css: 'saturate(1.8) contrast(1.2) brightness(1.02)', vig: 0 },
  { id: 'cool',    name: 'Cool',    css: 'hue-rotate(8deg) saturate(1.1) brightness(1.02)', vig: 0 },
  { id: 'warm',    name: 'Warm',    css: 'sepia(0.15) saturate(1.25) brightness(1.05)', vig: 0 },
  { id: 'drama',   name: 'Drama',   css: 'contrast(1.35) saturate(1.2) brightness(0.92)', vig: 0.3 },
  { id: 'fade',    name: 'Fade',    css: 'brightness(1.1) contrast(0.85) saturate(0.75)', vig: 0 },
  { id: 'neon',    name: 'Neon',    css: 'saturate(2.2) contrast(1.3) hue-rotate(-15deg)', vig: 0.2 },
  { id: 'vintage', name: 'Vintage', css: 'sepia(0.45) contrast(1.05) brightness(0.95)', vig: 0.3 },
  { id: 'mono',    name: 'Mono',    css: 'grayscale(1)', vig: 0 },
  { id: 'sepia',   name: 'Sepia',   css: 'sepia(1) brightness(1.05)', vig: 0 },
  { id: 'noir',    name: 'Noir',    css: 'grayscale(1) contrast(1.5) brightness(0.9)', vig: 0.35 },
  { id: 'glow',    name: 'Glow',    css: 'brightness(1.15) saturate(1.15) blur(0.3px)', vig: 0 },

  // --- TikTok στυλ ---
  { id: 'fresh',   name: 'Fresh',   css: 'brightness(1.1) saturate(1.3) contrast(1.05) hue-rotate(10deg)', vig: 0 },
  { id: 'retro',   name: 'Retro',   css: 'sepia(0.35) saturate(1.3) contrast(1.05) hue-rotate(-15deg)', vig: 0.2 },
  { id: 'teal',    name: 'Teal',    css: 'saturate(1.2) contrast(1.05) hue-rotate(160deg)', vig: 0 },
  { id: 'chill',   name: 'Chill',   css: 'brightness(1.05) saturate(0.9) hue-rotate(-5deg)', vig: 0 },
  { id: 'pastel',  name: 'Pastel',  css: 'brightness(1.12) saturate(0.8) contrast(0.88) hue-rotate(5deg)', vig: 0 },
  { id: 'punchy',  name: 'Punchy',  css: 'saturate(1.7) contrast(1.25)', vig: 0 },
  { id: 'sunset',  name: 'Sunset',  css: 'sepia(0.3) saturate(1.5) hue-rotate(-20deg) brightness(1.05)', vig: 0.15 },
  { id: 'dream',   name: 'Dream',   css: 'brightness(1.15) saturate(1.2) contrast(0.9) blur(1px)', vig: 0.15 },
  { id: 'beauty',  name: 'Beauty',  css: 'brightness(1.06) saturate(1.08) contrast(1.02) blur(0.5px)', vig: 0 },
];

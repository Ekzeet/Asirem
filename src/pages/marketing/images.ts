// Contextual marketing imagery — free-to-use Pexels photos (Pexels License: free for
// commercial use, hotlinking allowed, no attribution required). Served from the Pexels
// CDN with sizing params so we ship right-sized crops.

const base = {
  hero: 'https://images.pexels.com/photos/8297040/pexels-photo-8297040.jpeg', // accountant at desk with documents
  about: 'https://images.pexels.com/photos/7693692/pexels-photo-7693692.jpeg', // advisory team meeting
  blog: 'https://images.pexels.com/photos/33175651/pexels-photo-33175651/free-photo-of-financial-analysis-with-calculator-and-documents.jpeg', // tax documents + calculator
  team1: 'https://images.pexels.com/photos/12311572/pexels-photo-12311572.jpeg', // professional portrait
  team2: 'https://images.pexels.com/photos/14585727/pexels-photo-14585727.jpeg',
  team3: 'https://images.pexels.com/photos/11655430/pexels-photo-11655430.jpeg',
} as const

/** Build a sized, cropped Pexels URL. */
function sized(url: string, w: number, h: number) {
  return `${url}?auto=compress&cs=tinysrgb&fit=crop&w=${w}&h=${h}`
}

export const IMG = {
  hero: sized(base.hero, 900, 1125),
  about: sized(base.about, 840, 1008),
  blog: sized(base.blog, 1000, 700),
  team1: sized(base.team1, 320, 320),
  team2: sized(base.team2, 320, 320),
  team3: sized(base.team3, 320, 320),
}

/** Fills its parent frame; the parent `.duotone` overlay tints it with the brand accent. */
export const coverStyle: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover', display: 'block' }

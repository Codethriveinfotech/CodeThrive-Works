// Daily Motivational & Strength Quotes for CodeThrive Workspace
// Curated to inspire focus, resilience, craftsmanship, growth, and team excellence.

export const DAILY_QUOTES = [
  {
    quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
    theme: "Courage & Resilience",
    badge: "Strength"
  },
  {
    quote: "Your focus determines your reality. Push beyond limits and craft excellence today.",
    author: "CodeThrive Inspiration",
    theme: "Focus & Craft",
    badge: "Focus"
  },
  {
    quote: "Excellence is never an accident. It is the result of high intention, sincere effort, and intelligent execution.",
    author: "Aristotle",
    theme: "Excellence",
    badge: "Excellence"
  },
  {
    quote: "Strength doesn't come from what you can do. It comes from overcoming the things you once thought you couldn't.",
    author: "Rikki Rogers",
    theme: "Inner Strength",
    badge: "Power"
  },
  {
    quote: "Small daily improvements over time lead to stunning, unstoppable results.",
    author: "Robin Sharma",
    theme: "Continuous Growth",
    badge: "Growth"
  },
  {
    quote: "Great things in business are never done by one person; they're done by a dedicated team of people.",
    author: "Steve Jobs",
    theme: "Teamwork & Impact",
    badge: "Teamwork"
  },
  {
    quote: "Discipline is the bridge between your goals and your greatest accomplishments.",
    author: "Jim Rohn",
    theme: "Discipline",
    badge: "Discipline"
  },
  {
    quote: "Energy, consistency, and persistence conquer every single obstacle on the path.",
    author: "Benjamin Franklin",
    theme: "Persistence",
    badge: "Tenacity"
  },
  {
    quote: "Believe you can and you're halfway there. Let your dedication shine through your work.",
    author: "Theodore Roosevelt",
    theme: "Confidence",
    badge: "Belief"
  },
  {
    quote: "Quality is not an act, it is a habit. Build each project with pride and precision.",
    author: "Will Durant",
    theme: "Craftsmanship",
    badge: "Quality"
  },
  {
    quote: "The future belongs to those who learn more skills and combine them in creative ways.",
    author: "Robert Greene",
    theme: "Mastery",
    badge: "Mastery"
  },
  {
    quote: "Hard work beats talent when talent doesn't work hard. Give your full dedication today.",
    author: "Tim Notke",
    theme: "Work Ethic",
    badge: "Dedication"
  },
  {
    quote: "Stay dedicated. It's not about being the best, it's about being better than you were yesterday.",
    author: "CodeThrive Inspiration",
    theme: "Growth Mindset",
    badge: "Progress"
  },
  {
    quote: "Opportunities don't just happen; you build them through relentless focus and bold action.",
    author: "Chris Grosser",
    theme: "Initiative",
    badge: "Initiative"
  },
  {
    quote: "Stay hungry, stay driven. Incredible outcomes are built one focused hour at a time.",
    author: "CodeThrive Inspiration",
    theme: "Drive",
    badge: "Drive"
  },
  {
    quote: "The difference between ordinary and extraordinary is that little 'extra' you bring.",
    author: "Jimmy Johnson",
    theme: "Extra Effort",
    badge: "Determination"
  },
  {
    quote: "Clear your mind of 'can't'. Passion and commitment turn challenges into achievements.",
    author: "Samuel Johnson",
    theme: "Mindset",
    badge: "Positivity"
  },
  {
    quote: "Action is the foundational key to all success. Take bold, decisive steps forward today.",
    author: "Pablo Picasso",
    theme: "Decisive Action",
    badge: "Action"
  },
  {
    quote: "Every champion was once a contender that simply refused to give up.",
    author: "Sylvester Stallone",
    theme: "Tenacity",
    badge: "Champion"
  },
  {
    quote: "Focus on being productive instead of busy. Make every minute purposeful.",
    author: "Tim Ferriss",
    theme: "Productivity",
    badge: "Productivity"
  },
  {
    quote: "Your positive action combined with positive thinking generates boundless momentum.",
    author: "Shiv Khera",
    theme: "Momentum",
    badge: "Momentum"
  },
  {
    quote: "Do what you do so exceptionally well that people cannot help but be inspired.",
    author: "Walt Disney",
    theme: "Excellence",
    badge: "Excellence"
  },
  {
    quote: "Courage, dedication, and self-belief make you an unstoppable force in your field.",
    author: "CodeThrive Inspiration",
    theme: "Inner Strength",
    badge: "Strength"
  },
  {
    quote: "It always seems impossible until it's done. Break it down and conquer it.",
    author: "Nelson Mandela",
    theme: "Perseverance",
    badge: "Victory"
  },
  {
    quote: "The secret of getting ahead is getting started. Step into the day with full power.",
    author: "Mark Twain",
    theme: "Momentum",
    badge: "Power"
  },
  {
    quote: "Dedication and integrity are the true hallmarks of an exceptional engineer.",
    author: "CodeThrive Inspiration",
    theme: "Integrity",
    badge: "Integrity"
  },
  {
    quote: "Don't count the days; make every single day count toward your ultimate vision.",
    author: "Muhammad Ali",
    theme: "Purpose",
    badge: "Purpose"
  },
  {
    quote: "Success is the sum of small efforts, repeated day in and day out with unwavering passion.",
    author: "Robert Collier",
    theme: "Consistency",
    badge: "Consistency"
  },
  {
    quote: "Be passionate, be persistent, and keep building with heart and relentless pride.",
    author: "CodeThrive Inspiration",
    theme: "Passion",
    badge: "Passion"
  },
  {
    quote: "Patience, persistence, and perspiration make an unbeatable combination for victory.",
    author: "Napoleon Hill",
    theme: "Commitment",
    badge: "Commitment"
  }
];

export const getDailyQuote = (date = new Date()) => {
  const d = new Date(date);
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const index = Math.abs(dayOfYear) % DAILY_QUOTES.length;
  return DAILY_QUOTES[index];
};

/*
 * DARE DECK — dare library
 * Every entry is intentionally short, prop-light, and player-safe.
 * `lvl` is 1 (gentle), 2 (bold), or 3 (feral).
 * `secs` of 0 means the dare has no built-in timer.
 * `min` is the minimum number of players needed for the dare to make sense.
 */

export const CATEGORIES = {
  ice: {
    name: "Ice",
    icon: "🧊",
    color: "#67e8f9",
    blurb: "Cold hands, warm heart.",
    safety: "Keep ice moving. Never hold it against bare skin for more than 30 seconds.",
  },
  clip: {
    name: "Clothespin",
    icon: "🧷",
    color: "#f9a8d4",
    blurb: "Tiny plastic gremlins.",
    safety: "Clothing, fingers, and earlobes only. Gentle pressure. Stop at the first sharp pain.",
  },
  endurance: {
    name: "Endurance",
    icon: "💪",
    color: "#fbbf24",
    blurb: "Hold the line. Tap out anytime.",
    safety: "No breath-holding, no pushing through sharp pain. A shake is fine; a stab is not.",
  },
  silly: {
    name: "Silly",
    icon: "🤪",
    color: "#a78bfa",
    blurb: "Dignity is optional.",
    safety: "Commit to the bit, but never at someone else's expense.",
  },
  social: {
    name: "Social",
    icon: "🗣️",
    color: "#4ade80",
    blurb: "Feelings, but make it a game.",
    safety: "Share only what you are comfortable sharing. No pressure to overshare.",
  },
  chaos: {
    name: "Chaos",
    icon: "🌀",
    color: "#fb7185",
    blurb: "A little harmless anarchy.",
    safety: "No breaking things, no touching anyone without a yes.",
  },
  focus: {
    name: "Focus",
    icon: "🎯",
    color: "#38bdf8",
    blurb: "Brain, do your thing.",
    safety: "Wrong answers are funny. Guessing is allowed.",
  },
  movement: {
    name: "Movement",
    icon: "🏃",
    color: "#fb923c",
    blurb: "Shake the sillies out.",
    safety: "Clear some space. Skip anything that hurts, especially joints and your back.",
  },
  taste: {
    name: "Taste",
    icon: "👅",
    color: "#facc15",
    blurb: "A snack-based gamble.",
    safety: "Check every ingredient and allergy first. Nothing spicy-hot, nothing raw, no pressure to eat.",
  },
  sound: {
    name: "Sound",
    icon: "🔊",
    color: "#c084fc",
    blurb: "Make some noise.",
    safety: "Keep it at indoor volume. No screaming directly into ears.",
  },
};

export const DARES = [
  // ── ICE ────────────────────────────────────────────────────────────────
  { id: "ice-01", cat: "ice", lvl: 1, secs: 15, text: "Hold an ice cube in each hand for 15 seconds. Keep them moving so they do not stick." },
  { id: "ice-02", cat: "ice", lvl: 1, secs: 10, text: "Press an ice cube gently against the back of your neck for 10 seconds." },
  { id: "ice-03", cat: "ice", lvl: 2, secs: 20, text: "Put both hands in a bowl of ice water for 20 seconds. Lift them out the moment it stops being funny." },
  { id: "ice-04", cat: "ice", lvl: 2, secs: 10, text: "Drop an ice cube down the back of your shirt and keep a straight face for 10 seconds." },
  { id: "ice-05", cat: "ice", lvl: 1, secs: 15, text: "Roll a cold can over each forearm for 15 seconds." },
  { id: "ice-06", cat: "ice", lvl: 1, secs: 20, text: "Hold an ice cube against the inside of your wrist for 20 seconds." },
  { id: "ice-07", cat: "ice", lvl: 2, secs: 0, text: "Do 10 jumping jacks while holding an ice cube between your palms. If it drops, add five more." },
  { id: "ice-08", cat: "ice", lvl: 1, secs: 20, text: "Balance an ice cube on the back of your hand for 20 seconds. No grabbing it at the end." },
  { id: "ice-09", cat: "ice", lvl: 2, secs: 0, text: "Hold an ice cube in your non-dominant hand while you name eight countries." },
  { id: "ice-10", cat: "ice", lvl: 2, secs: 10, text: "Gently ice-massage your cheeks and forehead for 10 seconds. Avoid your eyes." },
  { id: "ice-11", cat: "ice", lvl: 1, secs: 30, text: "Keep both feet on a cold pack or cold floor for 30 seconds." },
  { id: "ice-12", cat: "ice", lvl: 3, secs: 10, text: "Hold an ice cube in your armpit for 10 seconds. This is the dare. We are all impressed." },
  { id: "ice-13", cat: "ice", lvl: 2, secs: 30, text: "Put an ice cube in a sock and wear it for 30 seconds." },
  { id: "ice-14", cat: "ice", lvl: 3, secs: 15, text: "Hold a cold drink against your forehead for 15 seconds and recite the alphabet backwards from M." },

  // ── CLOTHESPIN ─────────────────────────────────────────────────────────
  { id: "clip-01", cat: "clip", lvl: 1, secs: 10, text: "Clip a clothespin gently to your earlobe for 10 seconds." },
  { id: "clip-02", cat: "clip", lvl: 1, secs: 30, text: "Clip one clothespin to each sleeve cuff and leave them there for 30 seconds." },
  { id: "clip-03", cat: "clip", lvl: 2, secs: 5, text: "Clip a clothespin to your fingertip for five seconds. Breathe." },
  { id: "clip-04", cat: "clip", lvl: 1, secs: 10, text: "Clip a clothespin gently to the tip of your nose for 10 seconds." },
  { id: "clip-05", cat: "clip", lvl: 2, secs: 0, text: "Clip a clothespin to the hem of your shirt, then do 10 squats." },
  { id: "clip-06", cat: "clip", lvl: 1, secs: 20, text: "Clip a clothespin to your sock for 20 seconds." },
  { id: "clip-07", cat: "clip", lvl: 1, secs: 0, text: "Clip one clothespin to each ear and say “I am a proud clothesline” three times." },
  { id: "clip-08", cat: "clip", lvl: 3, secs: 5, text: "Clip a clothespin to your thumb for five seconds while the group counts out loud." },
  { id: "clip-09", cat: "clip", lvl: 1, secs: 30, text: "Attach three clothespins to one sleeve and keep them there for 30 seconds." },
  { id: "clip-10", cat: "clip", lvl: 2, secs: 10, text: "Clip a clothespin to the back of your hand for 10 seconds." },
  { id: "clip-11", cat: "clip", lvl: 1, secs: 0, text: "Clip a clothespin to your collar and leave it there until your next turn." },
  { id: "clip-12", cat: "clip", lvl: 1, secs: 30, text: "Use a clothespin as a hair clip for 30 seconds." },
  { id: "clip-13", cat: "clip", lvl: 2, secs: 0, text: "Clip a clothespin to your finger and write your name with your other hand." },
  { id: "clip-14", cat: "clip", lvl: 1, secs: 30, text: "Make a smiley face on your shirt with clothespins and wear it for 30 seconds." },

  // ── ENDURANCE ──────────────────────────────────────────────────────────
  { id: "end-01", cat: "endurance", lvl: 1, secs: 30, text: "Wall-sit for 30 seconds. Keep your back flat and your complaints internal." },
  { id: "end-02", cat: "endurance", lvl: 2, secs: 20, text: "Hold a forearm plank for 20 seconds." },
  { id: "end-03", cat: "endurance", lvl: 1, secs: 20, text: "Hold a book above your head with straight arms for 20 seconds." },
  { id: "end-04", cat: "endurance", lvl: 1, secs: 20, text: "Stand on one leg with your eyes closed for 20 seconds." },
  { id: "end-05", cat: "endurance", lvl: 1, secs: 0, text: "Do 15 squats without stopping." },
  { id: "end-06", cat: "endurance", lvl: 2, secs: 20, text: "Hold a deep squat for 20 seconds." },
  { id: "end-07", cat: "endurance", lvl: 1, secs: 45, text: "Hold your arms straight out to the sides for 45 seconds." },
  { id: "end-08", cat: "endurance", lvl: 1, secs: 20, text: "Hold a pencil between your nose and upper lip for 20 seconds without dropping it." },
  { id: "end-09", cat: "endurance", lvl: 2, secs: 0, text: "Balance a book on your head and walk across the room and back." },
  { id: "end-10", cat: "endurance", lvl: 3, secs: 10, text: "Hold a wall handstand or a downward dog for 10 seconds." },
  { id: "end-11", cat: "endurance", lvl: 2, secs: 0, text: "Do 20 calf raises on a step edge. Hold something for balance." },
  { id: "end-12", cat: "endurance", lvl: 2, secs: 20, text: "Hold a full glass of water at arm's length for 20 seconds without spilling." },
  { id: "end-13", cat: "endurance", lvl: 3, secs: 45, text: "Hold a horse stance for 45 seconds. Thighs parallel, pride optional." },
  { id: "end-14", cat: "endurance", lvl: 2, secs: 60, min: 2, text: "Stand perfectly still for 60 seconds while the others try to make you laugh." },
  { id: "end-15", cat: "endurance", lvl: 1, secs: 20, text: "Grip a rolled-up towel as hard as you can for 20 seconds." },

  // ── SILLY ──────────────────────────────────────────────────────────────
  { id: "silly-01", cat: "silly", lvl: 1, secs: 0, text: "Talk in a robot voice until your next turn." },
  { id: "silly-02", cat: "silly", lvl: 1, secs: 15, text: "Invent a new dance move and perform it for 15 seconds." },
  { id: "silly-03", cat: "silly", lvl: 1, secs: 0, text: "Wear your shirt inside out for the rest of the round." },
  { id: "silly-04", cat: "silly", lvl: 1, secs: 0, min: 2, text: "Do an impression of someone in the room until they guess it is them." },
  { id: "silly-05", cat: "silly", lvl: 2, secs: 0, text: "Speak only in questions until your next turn." },
  { id: "silly-06", cat: "silly", lvl: 1, secs: 10, text: "Balance a spoon on your nose for 10 seconds." },
  { id: "silly-07", cat: "silly", lvl: 2, secs: 10, text: "Make up a 10-second opera about the last thing you ate." },
  { id: "silly-08", cat: "silly", lvl: 1, secs: 0, text: "Catwalk across the room and strike a pose like the room is your runway." },
  { id: "silly-09", cat: "silly", lvl: 1, secs: 20, text: "Pretend to be a weather reporter describing the room for 20 seconds." },
  { id: "silly-10", cat: "silly", lvl: 3, secs: 20, text: "Give a 20-second TED Talk about why socks are overrated." },
  { id: "silly-11", cat: "silly", lvl: 1, secs: 0, text: "Replace every verb in your next sentence with “boop.”" },
  { id: "silly-12", cat: "silly", lvl: 2, secs: 10, text: "Do 10 seconds of interpretive dance in complete silence." },
  { id: "silly-13", cat: "silly", lvl: 1, secs: 0, text: "Use a sock puppet to introduce yourself to the group." },
  { id: "silly-14", cat: "silly", lvl: 1, secs: 10, text: "Do your best villain laugh for 10 seconds." },
  { id: "silly-15", cat: "silly", lvl: 2, secs: 0, text: "Narrate your next turn like a nature documentary." },
  { id: "silly-16", cat: "silly", lvl: 1, secs: 30, text: "Make a hat from something within reach and wear it for 30 seconds." },

  // ── SOCIAL ─────────────────────────────────────────────────────────────
  { id: "social-01", cat: "social", lvl: 1, secs: 0, min: 2, text: "Give a genuine compliment to every player." },
  { id: "social-02", cat: "social", lvl: 1, secs: 30, text: "Tell your most embarrassing school story in 30 seconds or less." },
  { id: "social-03", cat: "social", lvl: 2, secs: 0, min: 2, text: "Let the group choose your profile picture for the next 10 minutes." },
  { id: "social-04", cat: "social", lvl: 1, secs: 0, text: "Send a friend a text that says: “I just remembered you're awesome.”" },
  { id: "social-05", cat: "social", lvl: 1, secs: 0, min: 2, text: "Do an impression of another player until they laugh." },
  { id: "social-06", cat: "social", lvl: 2, secs: 20, text: "Share a hot take and defend it for 20 seconds." },
  { id: "social-07", cat: "social", lvl: 1, secs: 0, min: 2, text: "Ask the group what their comfort food is and listen to every answer." },
  { id: "social-08", cat: "social", lvl: 1, secs: 0, min: 2, text: "Tell a joke. If nobody laughs, tell another one." },
  { id: "social-09", cat: "social", lvl: 1, secs: 0, min: 2, text: "Let the person on your left choose a song for you to hum." },
  { id: "social-10", cat: "social", lvl: 2, secs: 0, text: "Reveal one weird talent and demonstrate it." },
  { id: "social-11", cat: "social", lvl: 2, secs: 30, min: 2, text: "Give a 30-second toast to the person on your right." },
  { id: "social-12", cat: "social", lvl: 1, secs: 0, text: "Name three things you are grateful for right now." },
  { id: "social-13", cat: "social", lvl: 1, secs: 0, min: 2, text: "Let the group pick an emoji, then caption your life with it in one sentence." },
  { id: "social-14", cat: "social", lvl: 3, secs: 0, text: "Call or text a family member just to say hi." },
  { id: "social-15", cat: "social", lvl: 1, secs: 0, min: 2, text: "Ask someone in the room a question you have never asked them before." },

  // ── CHAOS ──────────────────────────────────────────────────────────────
  { id: "chaos-01", cat: "chaos", lvl: 1, secs: 0, min: 2, text: "Swap seats with the player across from you." },
  { id: "chaos-02", cat: "chaos", lvl: 1, secs: 0, min: 2, text: "Let the group rearrange your hair. You cannot look until it is done." },
  { id: "chaos-03", cat: "chaos", lvl: 1, secs: 0, text: "Wear your jacket backwards until your next turn." },
  { id: "chaos-04", cat: "chaos", lvl: 1, secs: 0, min: 2, text: "Talk in a different accent until someone guesses where it is from." },
  { id: "chaos-05", cat: "chaos", lvl: 1, secs: 0, min: 2, text: "Give the player on your left a new nickname and use it for the rest of the game." },
  { id: "chaos-06", cat: "chaos", lvl: 1, secs: 20, text: "Set a 20-second timer and tidy one small area before it rings." },
  { id: "chaos-07", cat: "chaos", lvl: 1, secs: 0, text: "Do five wall push-ups and count every single one out loud." },
  { id: "chaos-08", cat: "chaos", lvl: 3, secs: 0, min: 2, text: "Let the group choose a 10-second sound effect you must make whenever someone says your name." },
  { id: "chaos-09", cat: "chaos", lvl: 1, secs: 0, min: 2, text: "Trade one accessory with another player until the end of the round." },
  { id: "chaos-10", cat: "chaos", lvl: 1, secs: 0, text: "Speak in third person until your next turn." },
  { id: "chaos-11", cat: "chaos", lvl: 1, secs: 0, text: "Do your best impression of a dial-up modem." },
  { id: "chaos-12", cat: "chaos", lvl: 2, secs: 10, min: 2, text: "Build a 10-second human sculpture with the group." },

  // ── FOCUS ──────────────────────────────────────────────────────────────
  { id: "focus-01", cat: "focus", lvl: 2, secs: 0, text: "Recite the alphabet backwards from Z to A." },
  { id: "focus-02", cat: "focus", lvl: 3, secs: 30, text: "Count backwards from 100 by sevens for 30 seconds." },
  { id: "focus-03", cat: "focus", lvl: 1, secs: 20, text: "Name 10 countries in 20 seconds." },
  { id: "focus-04", cat: "focus", lvl: 1, secs: 0, text: "Say the months in reverse order." },
  { id: "focus-05", cat: "focus", lvl: 1, secs: 0, text: "List eight things in the room that are blue." },
  { id: "focus-06", cat: "focus", lvl: 1, secs: 0, text: "Spell your full name backwards out loud." },
  { id: "focus-07", cat: "focus", lvl: 2, secs: 0, min: 2, text: "Answer three rapid-fire math questions from the group." },
  { id: "focus-08", cat: "focus", lvl: 2, secs: 20, text: "Name six animals that start with S in 20 seconds." },
  { id: "focus-09", cat: "focus", lvl: 1, secs: 0, text: "Repeat clap-snap-clap-stomp three times without a mistake." },
  { id: "focus-10", cat: "focus", lvl: 1, secs: 20, min: 2, text: "Win a 20-second staring contest against another player." },
  { id: "focus-11", cat: "focus", lvl: 1, secs: 0, min: 2, text: "Name every player in the room in alphabetical order." },
  { id: "focus-12", cat: "focus", lvl: 2, secs: 0, text: "Say “red lorry, yellow lorry” five times fast without messing up." },

  // ── MOVEMENT ───────────────────────────────────────────────────────────
  { id: "move-01", cat: "movement", lvl: 1, secs: 0, text: "Do 15 jumping jacks." },
  { id: "move-02", cat: "movement", lvl: 2, secs: 0, text: "Crab-walk across the room and back." },
  { id: "move-03", cat: "movement", lvl: 2, secs: 0, text: "Do 10 lunges, five per leg." },
  { id: "move-04", cat: "movement", lvl: 2, secs: 0, text: "Spin around five times, then walk a straight line." },
  { id: "move-05", cat: "movement", lvl: 1, secs: 5, text: "Do a superhero landing and hold it for five seconds." },
  { id: "move-06", cat: "movement", lvl: 3, secs: 15, text: "Bear-crawl for 15 seconds." },
  { id: "move-07", cat: "movement", lvl: 2, secs: 20, text: "Do 20 seconds of high knees." },
  { id: "move-08", cat: "movement", lvl: 2, secs: 0, text: "Balance a shoe on your head while doing 10 squats." },
  { id: "move-09", cat: "movement", lvl: 1, secs: 20, text: "Dance like nobody is watching for 20 seconds." },
  { id: "move-10", cat: "movement", lvl: 1, secs: 10, text: "Hold an elbow plank for 10 seconds." },
  { id: "move-11", cat: "movement", lvl: 1, secs: 0, text: "Hop on one foot while singing “Happy Birthday.”" },
  { id: "move-12", cat: "movement", lvl: 1, secs: 0, text: "Do 10 wall push-ups." },

  // ── TASTE ──────────────────────────────────────────────────────────────
  { id: "taste-01", cat: "taste", lvl: 2, secs: 0, min: 2, text: "Eat a spoonful of a condiment chosen by the group. Check ingredients first." },
  { id: "taste-02", cat: "taste", lvl: 2, secs: 10, text: "Eat a lemon wedge without making a face for 10 seconds." },
  { id: "taste-03", cat: "taste", lvl: 2, secs: 0, text: "Mix three safe drinks and take one sip." },
  { id: "taste-04", cat: "taste", lvl: 1, secs: 0, text: "Eat a piece of plain bread like it is the best thing you have ever tasted." },
  { id: "taste-05", cat: "taste", lvl: 1, secs: 0, text: "Chew a piece of gum and blow the biggest bubble you can." },
  { id: "taste-06", cat: "taste", lvl: 2, secs: 0, text: "Eat a spoonful of plain yogurt and review it like a wine critic." },
  { id: "taste-07", cat: "taste", lvl: 1, secs: 0, text: "Taste a mystery safe snack with your eyes closed and guess what it is." },
  { id: "taste-08", cat: "taste", lvl: 1, secs: 10, text: "Put a tiny pinch of salt on your tongue and keep a straight face for 10 seconds." },
  { id: "taste-09", cat: "taste", lvl: 2, secs: 0, text: "Eat a slice of cucumber in exactly 10 small bites." },
  { id: "taste-10", cat: "taste", lvl: 3, secs: 20, text: "Hold a sour candy in your mouth for 20 seconds without reacting." },
  { id: "taste-11", cat: "taste", lvl: 2, secs: 0, min: 2, text: "Make a sandwich from two safe ingredients the group picks and take one bite." },

  // ── SOUND ──────────────────────────────────────────────────────────────
  { id: "sound-01", cat: "sound", lvl: 1, secs: 15, text: "Beatbox for 15 seconds." },
  { id: "sound-02", cat: "sound", lvl: 1, secs: 0, text: "Sing the chorus of the last song you heard." },
  { id: "sound-03", cat: "sound", lvl: 1, secs: 10, text: "Make a 10-second remix using only your mouth and hands." },
  { id: "sound-04", cat: "sound", lvl: 1, secs: 0, min: 2, text: "Whisper a secret in the ear of the player on your right." },
  { id: "sound-05", cat: "sound", lvl: 1, secs: 0, text: "Do an impression of a famous movie character saying “I'll be back.”" },
  { id: "sound-06", cat: "sound", lvl: 1, secs: 0, min: 2, text: "Hum a song and let the group guess it." },
  { id: "sound-07", cat: "sound", lvl: 1, secs: 15, text: "Make the sound of five different animals in 15 seconds." },
  { id: "sound-08", cat: "sound", lvl: 2, secs: 0, text: "Read the last text you sent in a dramatic movie-trailer voice." },
  { id: "sound-09", cat: "sound", lvl: 2, secs: 30, text: "Sing everything you say for the next 30 seconds." },
  { id: "sound-10", cat: "sound", lvl: 3, secs: 10, min: 2, text: "Create a 10-second jingle for the person on your left." },
  { id: "sound-11", cat: "sound", lvl: 1, secs: 10, text: "Do a 10-second drum solo on the table." },
];

export const CATEGORY_KEYS = Object.keys(CATEGORIES);

export function daresFor({ categories, maxLevel = 3, playerCount = 1 } = {}) {
  const allowed = categories && categories.length ? new Set(categories) : new Set(CATEGORY_KEYS);
  return DARES.filter((dare) => (
    allowed.has(dare.cat)
    && dare.lvl <= maxLevel
    && (dare.min || 1) <= playerCount
  ));
}

export function shuffle(items, random = Math.random) {
  const copy = items.slice();
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

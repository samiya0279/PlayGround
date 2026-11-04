# PlayGround

# Dare Deck

**Draw. Do. Survive.** A complete browser party game with 132 unique dares, ten categories, and zero repeats per run.

- **Solo run** — 5, 10, 15, or 20 dares, scored as you go.
- **Group mode** — 2–8 players, editable names, turn-by-turn play, live scoreboard, and a podium finish.
- **Categories** — Ice, Clothespin, Endurance, Silly, Social, Chaos, Focus, Movement, Taste, and Sound.
- **No repeats** — every drawn card leaves the deck. The run ends when the turns or the deck do.
- **Timers, pause/resume, safe-word skip, sound, and confetti** are built in. State fits phones and tablets.
- **Safety first** — consent, allergy checks, and stop rules are always in the House Rules dialog.

### Play locally

```sh
./start.sh          # serves the game on http://localhost:3000 (or $PORT)
./test.sh           # validates the dare library and no-repeat draw logic
```

No build step or dependencies. Everything is plain HTML, CSS, and ES modules.

### Project files

| File | Purpose |
| --- | --- |
| `index.html` | All screens, dialogs, and game shell |
| `styles.css` | Responsive visual system |
| `dares.js` | 132-dare library, categories, filtering, shuffle |
| `game.js` | Setup, turns, timers, scoring, results, sound, confetti |
| `tests/dare-data.test.mjs` | Data integrity and deck checks |

---

<!-- omgithub:readme:start -->
## 🚀 Build, play, and remix with OMGithub

**Created using [OMGithub.com](https://go.ondev.store/).**

[![OMGithub](https://img.shields.io/badge/OMGithub-Open%20project-orange?style=for-the-badge)](https://go.ondev.store/samiya0279/PlayGround)
[![GitHub](https://img.shields.io/badge/GitHub-Source-181717?logo=github&style=for-the-badge)](https://github.com/samiya0279/PlayGround)

- 🎮 [Open the project](https://go.ondev.store/samiya0279/PlayGround).
- ✨ [Remix this project](https://go.ondev.store/samiya0279/PlayGround?remix=1).
- 💻 [Explore the source](https://github.com/samiya0279/PlayGround).
- 🛠️ [Check build runs](https://github.com/samiya0279/PlayGround/actions).
- 🐛 [Report an issue](https://github.com/samiya0279/PlayGround/issues).
- 👤 [Explore the creator's projects](https://go.ondev.store/samiya0279).
- 🌍 [Create with OMGithub](https://go.ondev.store/).
<!-- omgithub:readme:end -->

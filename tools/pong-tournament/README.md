# Pong tournament bracket

Prints a fill-in-by-hand, double-elimination pong bracket as a 5-page PDF.
Players are randomly paired into two-person teams and the teams are randomly
seeded, so nobody can complain about the draw.

## Reprinting when the roster changes

Edit `roster.txt` (one player per line, `#` comments ignored), then:

```bash
python3 generate.py
```

That writes `pong-bracket.pdf` and `pong-bracket.html` in this folder. Any
number of players works — odd rosters leave one person as first alternate, and
odd team counts get first-round byes automatically.

Useful flags:

| flag | what it does |
| --- | --- |
| `--seed 2026` | reproducible draw — same roster + same seed = same bracket |
| `--title "Fall Cup"` | rename the tournament |
| `--roster other.txt` | use a different roster file |
| `--out /path/name` | write somewhere else |

## What comes out

1. **Cover** — the draw, the rules, and a tick-off running order for every game.
2. **Winners bracket** — the classic tree, round 1 pre-printed, the rest blank.
3. **Winners bracket games** — one card per game with score lines and routing.
4. **Losers bracket games** — same, for teams on their second life.
5. **Grand final** — plus the if-needed decider, champions, standings, notes.

Each card says where both teams go next (`W → W4`, `L → L1`), so running the
night is just following the numbers.

## How it works

`bracket.py` is a general double-elimination engine, not pong-specific. It
builds the full power-of-two bracket, fills the empty seeds with byes, then
collapses every match a bye made meaningless so the printed sheet only shows
games that actually get played. Total games always comes out to `2n - 2` for
`n` teams (plus the optional decider).

`generate.py` renders that to HTML and prints it to PDF with headless Chromium.
No Chromium? The HTML is still written — open it in any browser and print.

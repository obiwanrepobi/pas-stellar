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
number of players works — players left over after the teams are formed become
alternates, and team counts that are not a power of two get first-round byes
automatically.

Useful flags:

| flag | what it does |
| --- | --- |
| `--seed 2026` | reproducible draw — same roster + same seed = same bracket |
| `--title "Fall Cup"` | rename the tournament |
| `--roster other.txt` | use a different roster file |
| `--out /path/name` | write somewhere else |
| `--team-size 3` | players per team (default 2) |

## Byes, and how to avoid them

A bracket only starts symmetrical when the team count is a power of two. Any
other count parks the extra teams in first-round byes — that is not a flaw in
the draw, it is arithmetic. If you want zero byes, change the team size so the
team count lands on 4, 8, or 16. With 24 players, `--team-size 3` gives exactly
8 teams and a perfectly clean bracket.

## Recording results as you go

Each sheet has a results file beside it — `pong-bracket-results.txt` for the
default one. Add a line per finished game and re-run `generate.py`:

```
W3: 7          game W3 was won by team 7
W7: 7 21-15    ...with the score, if you kept it
```

The reprinted PDF ticks the winner, strikes out the loser, fills their score
boxes, and — the useful part — replaces every downstream "Winner of W3" with
the actual team name, all the way through both brackets and the tree. Entries
that do not fit the bracket (wrong game, a team that is not in it, a game whose
feeders are still open) are reported and skipped rather than silently applied.

Override the file with `--results path.txt`.

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

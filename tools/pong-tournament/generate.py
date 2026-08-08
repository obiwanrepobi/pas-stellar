#!/usr/bin/env python3
"""Build the pong tournament PDF.

    python3 generate.py                     # uses roster.txt, random draw
    python3 generate.py --seed 42           # reproducible draw
    python3 generate.py --title "Fall Cup"  # rename the tournament
    python3 generate.py --roster other.txt  # different roster file

Writes pong-bracket.html and pong-bracket.pdf next to this script.
The PDF is printed with the Chromium that ships with the container; if it is
missing, the HTML is still written and can be printed from any browser.
"""

from __future__ import annotations

import argparse
import html
import os
import random
import shutil
import subprocess
import sys
from pathlib import Path

from bracket import Bracket, Match, Slot, Team, make_teams

HERE = Path(__file__).resolve().parent


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------


def esc(s: str) -> str:
    return html.escape(s, quote=False)


def read_roster(path: Path) -> list[str]:
    names = []
    for line in path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#"):
            names.append(line)
    return names


def read_results(path: Path) -> dict[str, tuple[int, str]]:
    """Parse a results file.

        W3: 7 21-15     game W3 was won by team 7, final score 21-15
        L1: 4           game L1 was won by team 4, score not recorded

    Missing file means nothing has been played yet.
    """
    results: dict[str, tuple[int, str]] = {}
    if not path.exists():
        return results
    for lineno, raw in enumerate(path.read_text().splitlines(), 1):
        line = raw.split("#")[0].strip()
        if not line:
            continue
        game, _, rest = line.partition(":")
        parts = rest.split()
        if not parts:
            raise ValueError(f"{path}:{lineno}: expected 'GAME: winning-team [score]'")
        seed = parts[0].lstrip("tT#")
        if not seed.isdigit():
            raise ValueError(f"{path}:{lineno}: '{parts[0]}' is not a team number")
        results[game.strip().upper()] = (int(seed), " ".join(parts[1:]))
    return results


def find_chromium() -> str | None:
    for cand in (
        "/opt/pw-browsers/chromium/chrome-linux/chrome",
        "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    ):
        if Path(cand).exists():
            return cand
    for name in ("chromium", "chromium-browser", "google-chrome", "chrome"):
        found = shutil.which(name)
        if found:
            return found
    for base in Path("/opt/pw-browsers").glob("chromium*/chrome-linux/chrome"):
        return str(base)
    return None


# ---------------------------------------------------------------------------
# markup
# ---------------------------------------------------------------------------


def card(bk: Bracket, m: Match, tone: str) -> str:
    won, _, score = bk.outcome(m)
    high, low = "", ""
    if score:
        bits = score.replace("–", "-").split("-")
        if len(bits) == 2 and all(b.strip().isdigit() for b in bits):
            high, low = (b.strip() for b in bits)
        else:
            high = score

    def side(slot: Slot) -> str:
        team = bk.resolve(slot)
        cls = "who known" if team is not None else "who pending"
        state, box = "", ""
        if team is not None and won is not None:
            if team.seed == won.seed:
                state, box = " won", high
            else:
                state, box = " lost", low
        return (
            f'<div class="side{state}"><span class="tick"></span>'
            f'<span class="{cls}">{esc(bk.slot_text(slot))}</span>'
            f'<span class="dots"></span><span class="score">{esc(box)}</span></div>'
        )

    if won is not None:
        tone += " done"

    routes = []
    routes.append(
        f'<b>W</b>&nbsp;{esc(m.winner_to)}' if m.winner_to else "<b>W</b>&nbsp;CHAMPION"
    )
    routes.append(f'<b>L</b>&nbsp;{esc(m.loser_to)}' if m.loser_to else "<b>L</b>&nbsp;out")

    return f"""
    <div class="game {tone}">
      <div class="gid">{esc(m.display)}</div>
      <div class="body">
        {side(m.a)}
        {side(m.b)}
        <div class="route">{' &nbsp;·&nbsp; '.join(routes)}</div>
      </div>
    </div>"""


def tree(bk: Bracket) -> str:
    """Fill-in winners-bracket tree. Byes are pre-printed, the rest is blank."""
    def slot_html(slot: Slot, m: Match) -> str:
        team = bk.resolve(slot)
        if team is not None:
            won, _, _score = bk.outcome(m)
            state = ""
            if won is not None:
                state = " won" if team.seed == won.seed else " lost"
            return (
                f'<div class="tslot"><span class="tline{state}">'
                f'<i>{esc(team.label)}</i>{esc(team.name)}</span></div>'
            )
        if slot.is_bye():
            return '<div class="tslot"><span class="tline bye">bye</span></div>'
        src = ""
        if slot.source is not None:
            other = bk.matches[slot.source[0]]
            src = f'<em>from {esc(other.display)}</em>'
        return f'<div class="tslot"><span class="tline blank"></span>{src}</div>'

    cols = []
    for r in range(1, bk.wb_rounds + 1):
        rows = []
        for m in bk._round("W", r):
            tag = f'<span class="tnum">{esc(m.display)}</span>' if m.live else ""
            slots = "".join(slot_html(s, m) for s in (m.a, m.b))
            cls = "tmatch playing" if m.live else "tmatch"
            rows.append(f'<div class="{cls}">{tag}{slots}</div>')
        label = "Winners final" if r == bk.wb_rounds else f"Round {r}"
        cols.append(f'<div class="tcol"><h4>{label}</h4>{"".join(rows)}</div>')

    gf = bk.matches["GF"]
    champ = bk.resolve(gf.a)
    undefeated = f"{champ.label} · {champ.name}" if champ else ""
    cols.append(
        '<div class="tcol last"><h4>Undefeated</h4><div class="tmatch">'
        f'<div class="tslot"><span class="tline blank crown">{esc(undefeated)}</span>'
        f'<em>from {esc(gf.a.source[0] and bk.matches[gf.a.source[0]].display)} '
        "&rarr; grand final</em></div></div></div>"
    )
    return f'<div class="tree">{"".join(cols)}</div>'


def build_html(
    bk: Bracket, teams: list[Team], leftover: list[str], title: str,
    draw_seed: int, team_size: int = 2
) -> str:
    team_cards = "".join(
        f'<div class="team"><span class="tno">{t.seed}</span>'
        f'<span class="tname">{esc(t.name)}</span></div>'
        for t in teams
    )

    bye_teams = bk.byes()
    bye_line = (
        "Teams "
        + ", ".join(f"#{t.seed}" for t in bye_teams)
        + " drew a first-round bye and enter in round 2."
        if bye_teams
        else "No byes — everybody plays in round 1."
    )

    w_sections = []
    for n, (r, ms) in enumerate(bk.live_rounds("W"), start=1):
        name = "WINNERS FINAL" if ms[0].round_no == bk.wb_rounds else f"WINNERS ROUND {n}"
        w_sections.append(
            f'<h3 class="rw">{name}</h3><div class="games">'
            + "".join(card(bk, m, "w") for m in ms)
            + "</div>"
        )

    l_rounds = bk.live_rounds("L")
    l_sections = []
    for n, (r, ms) in enumerate(l_rounds, start=1):
        name = "LOSERS FINAL" if n == len(l_rounds) else f"LOSERS ROUND {n}"
        l_sections.append(
            f'<h3 class="rl">{name}</h3><div class="games">'
            + "".join(card(bk, m, "l") for m in ms)
            + "</div>"
        )

    gf = bk.matches["GF"]
    champ = bk.champion()
    champion_line = esc(champ.name) if champ else ""

    order_chips = "".join(
        f'<span class="chip {"w" if m.bracket == "W" else "l"}'
        f'{" done" if bk.outcome(m)[0] else ""}">'
        f'<span class="tick"></span>{esc(m.display)}</span>'
        for m in bk.play_order()
        if m.bracket != "GF"
    ) + (
        f'<span class="chip gf{" done" if champ else ""}">'
        '<span class="tick"></span>GF</span>'
    )

    leftover_block = (
        f'<p class="alt"><b>First alternate:</b> {esc(", ".join(leftover))} — '
        "subs in for anyone who has to leave.</p>"
        if leftover
        else ""
    )

    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>{esc(title)}</title>
<style>
  @page {{ size: letter portrait; margin: 0.45in 0.5in 0.4in; }}
  * {{ box-sizing: border-box; }}
  html {{ -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
  body {{
    margin: 0; color: #16130f; background: #fff;
    font: 10pt/1.35 "Helvetica Neue", Helvetica, Arial, sans-serif;
  }}
  .page {{ break-after: page; }}
  .page:last-child {{ break-after: auto; }}

  h1 {{ font-size: 30pt; line-height: 1.02; letter-spacing: -0.02em; margin: 0; }}
  h1 small {{ display: block; font-size: 10pt; letter-spacing: .22em;
    text-transform: uppercase; color: #a8341f; margin-bottom: 7px; font-weight: 700; }}
  h2 {{ font-size: 9pt; letter-spacing: .2em; text-transform: uppercase;
    margin: 22px 0 9px; padding-bottom: 5px; border-bottom: 1.5px solid #16130f; }}
  h3 {{ font-size: 8.5pt; letter-spacing: .18em; text-transform: uppercase;
    margin: 15px 0 7px; color: #fff; padding: 3.5px 8px; border-radius: 2px; }}
  h3.rw {{ background: #a8341f; }}
  h3.rl {{ background: #3f4a5a; }}
  h3:first-of-type {{ margin-top: 10px; }}
  p {{ margin: 0 0 7px; }}
  .lede {{ color: #514a42; max-width: 6.2in; }}

  /* roster */
  .teams {{ display: grid; grid-template-columns: repeat(2, 1fr); gap: 5px 14px; }}
  .team {{ display: flex; align-items: baseline; gap: 8px;
    border-bottom: 1px solid #e3ddd4; padding: 4.5px 2px; }}
  .tno {{ font-size: 8pt; font-weight: 700; color: #fff; background: #16130f;
    min-width: 17px; text-align: center; border-radius: 2px; padding: 1.5px 0; }}
  .tname {{ font-size: 11pt; font-weight: 600; }}
  .alt {{ margin-top: 10px; font-size: 9pt; color: #514a42; }}

  /* running order */
  .order {{ display: flex; flex-wrap: wrap; gap: 5px; }}
  .chip {{ display: inline-flex; align-items: center; gap: 5px; font-size: 8.5pt;
    font-weight: 700; border: 1px solid #d8d1c7; border-radius: 3px;
    padding: 4px 8px 4px 6px; min-width: 52px; }}
  .chip.w {{ border-left: 3px solid #a8341f; color: #a8341f; }}
  .chip.l {{ border-left: 3px solid #3f4a5a; color: #3f4a5a; }}
  .chip.gf {{ border-left: 3px solid #16130f; background: #16130f; color: #fff; }}
  .chip.gf .tick {{ border-color: #fff; }}

  /* rules */
  .rules {{ display: grid; grid-template-columns: 1fr 1fr; gap: 4px 22px;
    font-size: 9pt; color: #2f2a24; }}
  .rules div {{ padding: 4px 0 4px 15px; text-indent: -15px; }}
  .rules b {{ color: #16130f; }}
  .callout {{ border-left: 3px solid #a8341f; background: #faf5f2;
    padding: 9px 12px; margin-top: 14px; font-size: 9pt; }}

  /* game cards */
  .games {{ display: grid; grid-template-columns: 1fr 1fr; gap: 9px 14px; }}
  .game {{ display: flex; gap: 8px; border: 1px solid #d8d1c7; border-radius: 3px;
    padding: 8px 10px 7px; break-inside: avoid; }}
  .game.w {{ border-left: 3.5px solid #a8341f; }}
  .game.l {{ border-left: 3.5px solid #3f4a5a; }}
  .gid {{ font-size: 11pt; font-weight: 800; letter-spacing: .02em; min-width: 28px;
    padding-top: 1px; }}
  .game.w .gid {{ color: #a8341f; }}
  .game.l .gid {{ color: #3f4a5a; }}
  .body {{ flex: 1; min-width: 0; }}
  .side {{ display: flex; align-items: center; gap: 6px; padding: 4px 0; }}
  .side + .side {{ border-top: 1px dotted #ded7cd; }}
  .tick {{ width: 11px; height: 11px; border: 1px solid #8b8177; border-radius: 2px;
    flex: none; }}
  .who {{ font-size: 9.5pt; white-space: nowrap; overflow: hidden;
    text-overflow: ellipsis; }}
  .who.known {{ font-weight: 600; }}
  .who.pending {{ color: #8b8177; font-style: italic; }}
  .dots {{ flex: 1; border-bottom: 1px dotted #cdc5ba; height: 8px; min-width: 6px; }}
  .score {{ width: 26px; border-bottom: 1px solid #16130f; height: 13px; flex: none;
    font-size: 8.5pt; font-weight: 700; text-align: center; line-height: 12px; }}
  .game.done {{ background: #fbf9f6; }}
  .side.won .tick {{ background: #16130f; border-color: #16130f; position: relative; }}
  .side.won .tick::after {{ content: "✓"; position: absolute; inset: 0; color: #fff;
    font-size: 8pt; line-height: 10px; text-align: center; }}
  .side.won .who {{ font-weight: 700; }}
  .side.lost .who {{ color: #a89e93; text-decoration: line-through; }}
  .side.lost .score {{ color: #a89e93; }}
  .chip.done {{ background: #f1ede7; color: #a89e93; border-color: #e3ddd4; }}
  .chip.done .tick {{ background: #a89e93; border-color: #a89e93; }}
  .route {{ font-size: 7pt; letter-spacing: .07em; text-transform: uppercase;
    color: #8b8177; margin-top: 3px; }}
  .route b {{ color: #16130f; }}

  /* bracket tree */
  .tree {{ display: flex; align-items: stretch; height: 8.3in; }}
  .tcol {{ flex: 1; display: flex; flex-direction: column;
    justify-content: space-around; min-width: 0; padding: 0 7px;
    border-right: 1px solid #efeae2; }}
  .tcol.last {{ border-right: 0; }}
  .tcol h4 {{ font-size: 6pt; letter-spacing: .14em; text-transform: uppercase;
    color: #a49a8f; margin: 0 0 2px; text-align: center; flex: none; }}
  .tmatch {{ flex: 1; display: flex; flex-direction: column; justify-content: center;
    position: relative; }}
  .tmatch.playing {{ padding-right: 15px; }}
  .tnum {{ position: absolute; top: 50%; right: 0; transform: translateY(-50%);
    font-size: 5.5pt; font-weight: 800; color: #c9bcb1; letter-spacing: .05em; }}
  .tslot {{ padding: 3px 0; }}
  .tline {{ display: block; font-size: 7pt; line-height: 1.3; height: 13px;
    border-bottom: 1px solid #16130f; white-space: nowrap; overflow: hidden;
    text-overflow: ellipsis; }}
  .tslot i {{ font-style: normal; font-weight: 800; font-size: 5.5pt; color: #a8341f;
    display: inline-block; min-width: 14px; }}
  .tslot em {{ display: block; font-style: normal; font-size: 5pt;
    letter-spacing: .09em; text-transform: uppercase; color: #b3a89c;
    padding-top: 1px; }}
  .tline.bye {{ color: #c2b9ae; font-style: italic; border-bottom-color: #e6e0d7; }}
  .tline.won {{ font-weight: 700; }}
  .tline.lost {{ color: #b3a89c; text-decoration: line-through; }}
  .tline.crown {{ border-bottom-width: 2px; }}

  /* finale */
  .final {{ border: 2px solid #16130f; border-radius: 4px; padding: 16px 18px;
    margin-top: 10px; }}
  .final .side {{ padding: 7px 0; }}
  .final .who {{ font-size: 11pt; }}
  .final .tick {{ width: 13px; height: 13px; }}
  .final .score {{ width: 34px; height: 15px; }}
  .champ {{ margin-top: 18px; border: 2px solid #a8341f; border-radius: 4px;
    padding: 11px 16px 6px; }}
  .champ .lbl {{ font-size: 8pt; letter-spacing: .22em; text-transform: uppercase;
    color: #a8341f; font-weight: 700; }}
  .champ .line {{ border-bottom: 2px solid #16130f; height: 34px; margin-top: 4px;
    font-size: 17pt; font-weight: 700; line-height: 32px; }}
  .notes .rule {{ border-bottom: 1px solid #ded7cd; height: 26px; }}
  .standings div {{ display: flex; align-items: baseline; gap: 10px;
    padding: 7px 0 3px; }}
  .standings .pos {{ font-size: 8pt; font-weight: 700; letter-spacing: .12em;
    text-transform: uppercase; color: #8b8177; min-width: 74px; }}
  .standings .line {{ flex: 1; border-bottom: 1px solid #16130f; height: 15px; }}
  footer {{ margin-top: 14px; font-size: 7.5pt; color: #8b8177;
    border-top: 1px solid #e3ddd4; padding-top: 6px; }}
</style></head>
<body>

<section class="page">
  <h1><small>Double Elimination · {len(teams)} Teams of {team_size} ·
  {bk.total_games()} Games</small>
  {esc(title)}</h1>
  <p class="lede">Teams and matchups were drawn at random (draw #{draw_seed}).
  Two losses and you are out — so every team is guaranteed at least two games.</p>

  <h2>The Draw</h2>
  <div class="teams">{team_cards}</div>
  {leftover_block}

  <h2>How It Runs</h2>
  <div class="rules">
    <div><b>Everybody starts in the winners bracket.</b> Win and you move right;
      lose and you drop to the losers bracket.</div>
    <div><b>Lose twice and you are done.</b> A loss in the losers bracket
      eliminates you.</div>
    <div><b>{esc(bye_line)}</b></div>
    <div><b>Play games in number order</b> — W1, W2, W3, then L1, and so on.
      Any game whose two teams are known can be played early.</div>
    <div><b>Every card tells you where both teams go.</b> "W&nbsp;→&nbsp;W4"
      means the winner plays game W4; "L&nbsp;→&nbsp;L1" means the loser drops
      into game L1.</div>
    <div><b>Grand final:</b> the unbeaten winners-bracket team plays the
      losers-bracket survivor. The losers-bracket team has to beat them twice.</div>
  </div>

  <h2>Running Order</h2>
  <p class="lede" style="font-size:9pt;margin-bottom:8px">Tick them off as they
  finish. Games sitting side by side can be played in either order — or at the
  same time if you have two tables.</p>
  <div class="order">{order_chips}</div>

  <div class="callout"><b>Somebody drops out?</b> Two options. Easiest: the rest
  of their team grabs a sub or plays a man down — the bracket does not change.
  Cleaner: re-run the draw with the new roster and print a fresh sheet. If a
  team leaves before their game, their opponent advances by forfeit; write
  "FF" in the score box.</div>

  <footer>Fill this in as you go. The team names on later cards are blank on
  purpose — write in the winners as they come through.</footer>
</section>

<section class="page">
  <h1><small>Page 2</small>Winners Bracket</h1>
  <p class="lede">Names are pre-printed for round 1. Write in each winner as
  games finish. Losers do not disappear — they pick up on page 4.</p>
  {tree(bk)}
</section>

<section class="page">
  <h1><small>Page 3</small>Winners Bracket Games</h1>
  <p class="lede">Tick the winner, write the final score, then send the loser to
  the game listed under <b>L</b>.</p>
  {''.join(w_sections)}
</section>

<section class="page">
  <h1><small>Page 4</small>Losers Bracket Games</h1>
  <p class="lede">Second chances. A loss here ends your night — the winner of
  the losers final goes to the grand final.</p>
  {''.join(l_sections)}
</section>

<section class="page">
  <h1><small>Page 5</small>Grand Final</h1>
  <p class="lede">Winners-bracket champion vs. losers-bracket champion.</p>

  <div class="final">
    <div class="side"><span class="tick"></span>
      <span class="who pending">{esc(bk.slot_text(gf.a))} — unbeaten</span>
      <span class="dots"></span><span class="score"></span></div>
    <div class="side"><span class="tick"></span>
      <span class="who pending">{esc(bk.slot_text(gf.b))} — one loss</span>
      <span class="dots"></span><span class="score"></span></div>
    <div class="route" style="margin-top:8px">
      If the one-loss team wins, both teams have one loss — play the decider below.
    </div>
  </div>

  <h3 class="rw" style="margin-top:18px">Decider — only if needed</h3>
  <div class="final" style="margin-top:0">
    <div class="side"><span class="tick"></span>
      <span class="who pending">Grand final loser</span>
      <span class="dots"></span><span class="score"></span></div>
    <div class="side"><span class="tick"></span>
      <span class="who pending">Grand final winner</span>
      <span class="dots"></span><span class="score"></span></div>
  </div>

  <div class="champ">
    <div class="lbl">Champions</div>
    <div class="line">{champion_line}</div>
  </div>

  <h2>Final Standings</h2>
  <div class="standings">
    <div><span class="pos">1st</span><span class="line"></span></div>
    <div><span class="pos">2nd</span><span class="line"></span></div>
    <div><span class="pos">3rd</span><span class="line"></span></div>
    <div><span class="pos">Best name</span><span class="line"></span></div>
  </div>

  <h2>Notes</h2>
  <div class="notes">{'<div class="rule"></div>' * 6}</div>

  <footer>{bk.total_games()} games total. Draw #{draw_seed}.</footer>
</section>

</body></html>
"""


# ---------------------------------------------------------------------------


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--roster", default=str(HERE / "roster.txt"))
    ap.add_argument("--seed", type=int, default=None, help="reproducible draw")
    ap.add_argument("--title", default="Pong Tournament")
    ap.add_argument("--team-size", type=int, default=2, help="players per team")
    ap.add_argument("--results", default=None,
                    help="file of finished games (default: results.txt beside --out)")
    ap.add_argument("--out", default=str(HERE / "pong-bracket"))
    args = ap.parse_args()

    roster = read_roster(Path(args.roster))
    if len(roster) < 2 * args.team_size:
        print("need at least two full teams", file=sys.stderr)
        return 1

    draw_seed = args.seed if args.seed is not None else random.SystemRandom().randrange(1000, 9999)
    rng = random.Random(draw_seed)

    teams, leftover = make_teams(roster, rng, args.team_size)
    bk = Bracket(teams)

    out = Path(args.out).resolve()
    results_path = Path(args.results) if args.results else out.with_name(
        out.name + "-results.txt"
    )
    for complaint in bk.apply_results(read_results(results_path)):
        print(f"skipped — {complaint}", file=sys.stderr)
    html_path = out.with_suffix(".html")
    pdf_path = out.with_suffix(".pdf")
    html_path.write_text(
        build_html(bk, teams, leftover, args.title, draw_seed, args.team_size)
    )

    chrome = find_chromium()
    if chrome:
        subprocess.run(
            [
                chrome, "--headless", "--disable-gpu", "--no-sandbox",
                "--no-pdf-header-footer",
                f"--print-to-pdf={pdf_path}", html_path.as_uri(),
            ],
            check=True,
            capture_output=True,
            env={**os.environ, "HOME": os.environ.get("HOME", "/tmp")},
        )
        print(f"wrote {pdf_path}")
    else:
        print(f"no chromium found — open {html_path} and print to PDF", file=sys.stderr)

    played = sum(1 for m in bk.play_order() if bk.outcome(m)[0])
    champ = bk.champion()
    print(
        f"{len(roster)} players · {len(teams)} teams of {args.team_size} · "
        f"{played}/{bk.total_games()} games played · draw #{draw_seed}"
        + (f" · CHAMPIONS: {champ.name}" if champ else "")
        + (f" · alternate: {', '.join(leftover)}" if leftover else "")
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

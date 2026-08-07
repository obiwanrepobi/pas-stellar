"""Double-elimination pong bracket builder.

Takes a roster of players, randomly pairs them into two-person teams, seeds the
teams randomly, and builds a full double-elimination bracket (winners bracket,
losers bracket, grand final) for any number of teams. Byes are resolved so the
printed sheet only shows games that are actually played.

Nothing here is pong-specific except the wording -- it is a general
double-elimination engine.
"""

from __future__ import annotations

import math
import random
from dataclasses import dataclass, field


# ---------------------------------------------------------------------------
# Teams
# ---------------------------------------------------------------------------


@dataclass
class Team:
    seed: int
    players: list[str]

    @property
    def name(self) -> str:
        return " & ".join(self.players)

    @property
    def label(self) -> str:
        return f"T{self.seed}"


def make_teams(roster: list[str], rng: random.Random) -> tuple[list[Team], list[str]]:
    """Shuffle the roster into pairs. Returns (teams, leftover players).

    An odd roster leaves one player over; that player is reported back so the
    caller can decide what to do (play as a solo team, sit out, or sub in).
    """
    pool = list(roster)
    rng.shuffle(pool)

    leftover: list[str] = []
    if len(pool) % 2 == 1:
        leftover = [pool.pop()]

    pairs = [pool[i : i + 2] for i in range(0, len(pool), 2)]
    rng.shuffle(pairs)
    teams = [Team(seed=i + 1, players=p) for i, p in enumerate(pairs)]
    return teams, leftover


# ---------------------------------------------------------------------------
# Bracket structure
# ---------------------------------------------------------------------------

BYE = "BYE"


@dataclass
class Slot:
    """One side of a match. Exactly one of these fields is meaningful."""

    team: Team | None = None
    source: tuple[str, str] | None = None  # (match_id, "W" | "L")

    def is_bye(self) -> bool:
        return self.team is None and self.source is None


@dataclass
class Match:
    mid: str  # internal id, e.g. "W1-0"
    bracket: str  # "W", "L", or "GF"
    round_no: int
    index: int
    a: Slot = field(default_factory=Slot)
    b: Slot = field(default_factory=Slot)
    live: bool = False
    number: int = 0  # display number within its bracket (W1, L4, ...)
    loser_to: str | None = None  # display label of the match the loser feeds
    winner_to: str | None = None  # display label of the match the winner feeds

    @property
    def display(self) -> str:
        if self.bracket == "GF":
            return self.mid
        return f"{self.bracket}{self.number}"


def seed_order(size: int) -> list[int]:
    """Standard single-elimination seeding order for a bracket of `size`."""
    if size == 1:
        return [1]
    prev = seed_order(size // 2)
    out: list[int] = []
    for s in prev:
        out.extend([s, size + 1 - s])
    return out


class Bracket:
    def __init__(self, teams: list[Team]):
        self.teams = teams
        n = len(teams)
        if n < 2:
            raise ValueError("need at least 2 teams")
        self.size = 1 << math.ceil(math.log2(n))
        self.wb_rounds = int(math.log2(self.size))
        self.matches: dict[str, Match] = {}
        self._build()
        self._resolve_byes()
        self._number()

    # -- construction -------------------------------------------------------

    def _add(self, bracket: str, rnd: int, idx: int) -> Match:
        mid = f"{bracket}{rnd}-{idx}"
        m = Match(mid=mid, bracket=bracket, round_no=rnd, index=idx)
        self.matches[mid] = m
        return m

    def _build(self) -> None:
        size, R = self.size, self.wb_rounds
        by_seed = {t.seed: t for t in self.teams}
        order = seed_order(size)

        # Winners bracket round 1: seeds beyond the roster are byes.
        for i in range(size // 2):
            m = self._add("W", 1, i)
            for slot_name, seed in (("a", order[2 * i]), ("b", order[2 * i + 1])):
                if seed in by_seed:
                    setattr(m, slot_name, Slot(team=by_seed[seed]))

        # Winners bracket rounds 2..R
        for r in range(2, R + 1):
            for i in range(size // (1 << r)):
                m = self._add("W", r, i)
                m.a = Slot(source=(f"W{r - 1}-{2 * i}", "W"))
                m.b = Slot(source=(f"W{r - 1}-{2 * i + 1}", "W"))

        # Losers bracket. Rounds alternate: odd rounds pair LB survivors,
        # even rounds drop in the losers from the matching winners round.
        # LB round 1 takes the losers of WB round 1.
        for i in range(size // 4):
            m = self._add("L", 1, i)
            m.a = Slot(source=(f"W1-{2 * i}", "L"))
            m.b = Slot(source=(f"W1-{2 * i + 1}", "L"))

        for k in range(1, R):
            count = size // (1 << (k + 1))
            # major round: LB survivors vs fresh WB droppers (reversed to
            # keep teams from meeting the same opponent twice in a row)
            for i in range(count):
                m = self._add("L", 2 * k, i)
                m.a = Slot(source=(f"L{2 * k - 1}-{i}", "W"))
                m.b = Slot(source=(f"W{k + 1}-{count - 1 - i}", "L"))
            # minor round: pair the survivors
            if k < R - 1:
                for i in range(count // 2):
                    m = self._add("L", 2 * k + 1, i)
                    m.a = Slot(source=(f"L{2 * k}-{2 * i}", "W"))
                    m.b = Slot(source=(f"L{2 * k}-{2 * i + 1}", "W"))

        # Grand final
        gf = self._add("GF", 1, 0)
        gf.mid = "GF"
        self.matches["GF"] = gf
        del self.matches["GF1-0"]
        gf.a = Slot(source=(f"W{R}-0", "W"))
        gf.b = Slot(source=(f"L{2 * (R - 1)}-0", "W"))

    # -- bye resolution -----------------------------------------------------

    def _resolve_byes(self) -> None:
        """Collapse matches that a bye makes meaningless.

        A match with two byes is dead. A match with one bye is a walkover: its
        winner is whatever fed the live side, and it is removed from the sheet.
        """
        winner_of: dict[str, Slot] = {}
        loser_of: dict[str, Slot] = {}

        def deref(slot: Slot) -> Slot:
            if slot.source is None:
                return slot
            mid, which = slot.source
            table = winner_of if which == "W" else loser_of
            return table.get(mid, slot)

        for mid in self._play_order():
            m = self.matches[mid]
            m.a, m.b = deref(m.a), deref(m.b)

            if m.a.is_bye() and m.b.is_bye():
                m.live = False
                winner_of[mid] = Slot()
                loser_of[mid] = Slot()
            elif m.a.is_bye() or m.b.is_bye():
                m.live = False
                winner_of[mid] = m.b if m.a.is_bye() else m.a
                loser_of[mid] = Slot()
            else:
                m.live = True
                winner_of[mid] = Slot(source=(mid, "W"))
                loser_of[mid] = Slot(source=(mid, "L"))

    def _play_order(self) -> list[str]:
        """Match ids in the order they can be played (topological)."""
        R = self.wb_rounds
        order: list[str] = []
        for r in range(1, R + 1):
            order += [m.mid for m in self._round("W", r)]
            if r == 1:
                order += [m.mid for m in self._round("L", 1)]
            else:
                order += [m.mid for m in self._round("L", 2 * (r - 1))]
                if 2 * (r - 1) + 1 <= 2 * (R - 1):
                    order += [m.mid for m in self._round("L", 2 * (r - 1) + 1)]
        order.append("GF")
        return order

    def _round(self, bracket: str, rnd: int) -> list[Match]:
        return sorted(
            (m for m in self.matches.values() if m.bracket == bracket and m.round_no == rnd),
            key=lambda m: m.index,
        )

    # -- numbering / routing ------------------------------------------------

    def _number(self) -> None:
        counters = {"W": 0, "L": 0}
        for mid in self._play_order():
            m = self.matches[mid]
            if not m.live or m.bracket == "GF":
                continue
            counters[m.bracket] += 1
            m.number = counters[m.bracket]

        # where does each live match's winner and loser go next?
        for m in self.matches.values():
            if not m.live:
                continue
            for other in self.matches.values():
                if not other.live:
                    continue
                for slot in (other.a, other.b):
                    if slot.source == (m.mid, "L"):
                        m.loser_to = other.display
                    elif slot.source == (m.mid, "W"):
                        m.winner_to = other.display

    # -- public views -------------------------------------------------------

    def live_rounds(self, bracket: str) -> list[tuple[int, list[Match]]]:
        out = []
        max_round = max(
            (m.round_no for m in self.matches.values() if m.bracket == bracket), default=0
        )
        for r in range(1, max_round + 1):
            live = [m for m in self._round(bracket, r) if m.live]
            if live:
                out.append((r, live))
        return out

    def play_order(self) -> list[Match]:
        """Every live match, in the order it becomes playable."""
        return [self.matches[mid] for mid in self._play_order() if self.matches[mid].live]

    def slot_text(self, slot: Slot) -> str:
        if slot.team is not None:
            return f"{slot.team.label} · {slot.team.name}"
        if slot.source is not None:
            mid, which = slot.source
            other = self.matches[mid]
            return f"{'Winner' if which == 'W' else 'Loser'} of {other.display}"
        return BYE

    def slot_team(self, slot: Slot) -> Team | None:
        return slot.team

    def total_games(self) -> int:
        return sum(1 for m in self.matches.values() if m.live)

    def byes(self) -> list[Team]:
        """Teams that sit out the first round."""
        seeded = {m.mid for m in self._round("W", 1)}
        out = []
        for m in self._round("W", 2):
            for slot in (m.a, m.b):
                if slot.team is not None and slot.source is None:
                    out.append(slot.team)
        # a team can skip further than round 2 in a very lopsided bracket
        for m in self.matches.values():
            if m.bracket == "W" and m.round_no > 2:
                for slot in (m.a, m.b):
                    if slot.team is not None and slot.team not in out:
                        out.append(slot.team)
        _ = seeded
        return sorted(out, key=lambda t: t.seed)

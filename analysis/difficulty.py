# /// script
# requires-python = ">=3.10"
# dependencies = ["numpy", "pandas"]
# ///
"""
Bingo difficulty from daily-challenge results.

Every live "Today's 7s" / "Today's 8s" records how many players attempted it
and how many missed each bingo. This turns that into a 1-100 difficulty per
7- and 8-letter alphagram of a lexicon, written as the per-length quantile
files the word_db_server's dbmaker reads (lexica/difficulty/<LEX>/{7,8}.csv).

    analysis/export_challenge_data.sh ~/difficulty-data
    uv run analysis/difficulty.py ~/difficulty-data NWL23 \\
        --out ../word-game-lexica/difficulty/NWL23 \\
        --compare ../word-game-lexica/difficulty/NWL23

--lexica (default ../word-game-lexica, the private lexica repo checked out
next to webolith) must hold every word list in EDITIONS, back to TWL06 and
CSW12: they're how the script tells old words from new ones.

Refreshing difficulties
-----------------------
A full run takes about 15 seconds for both lexicons and 1 GB of memory; the
export from prod is the slow part.

1. Export: analysis/export_challenge_data.sh ~/difficulty-data. It needs
   .env.proddb for bin/proddb.
2. Dry run, for each lexicon (NWL23, CSW24): the command above without
   --out, plus --check-newness. Check the "vs. existing files" lines: most
   bingos should move only a few points, and big movers should be ones that
   got new asks or new words. Check the newness table as check_newness()
   describes.
3. Run again with --out, commit the files to word-game-lexica, and build
   and publish the databases as word_db_server's README describes (dbmaker,
   then kubectl cp).
4. Rebuild the challenge queue too. It counts asks from the same results
   rather than reading these files, so it's independent of steps 1-3, but
   it's a good time to refresh it:

       kubectl exec deploy/webolith-worker-deployment -- \\
           python manage.py build_challenge_queue NWL23

The model
---------
A grouped-binomial Rasch model:

    missed[c, k] ~ Binomial(players[c], sigmoid(b[k] + newness[c, k] - theta[c]))

- k is a question: an alphagram *with its answer set at the time*. When an
  alphagram gains or loses an anagram (CEINNOS gaining NEONICS), its old
  results describe a different question, so they aren't carried over. A bingo
  that hasn't been asked with its current answers gets no difficulty (0)
  rather than a stale one, and the challenge scheduler
  (wordwalls/challenge_queue.py) queues it.
- theta[c] is how strong the players of challenge c were. It soaks up who
  showed up: the 2011 crowd missed less than today's, CSW players differ from
  NWL players, and a replay of an old date is often one person. This replaces
  the hand-tuned per-lexicon weights the old notebook used.
- newness is extra difficulty while a bingo's newest word is still being
  learned, by how long that word had been live when it was asked. It's fit
  from the same bingos asked at different ages, per lexicon family; at 4+
  years it's pinned to 0. Measured in 2026 it was about +0.5 logits in the
  first three months of NWL, fading to +0.1 by 2-4 years (+0.3 to +0.1 for
  CSW). The published difficulty is the settled b plus the newness the
  bingo has as of --as-of, so a fresh word reads as harder than it will in
  a few years, which is what players see.
- Each length's b has a Normal prior fit from the data (empirical Bayes), so a
  bingo seen by 30 players is pulled toward the average more than one seen by
  3000.
- Players who scored 0 missed everything (they mostly didn't play) and are
  left out.

CSW also uses NWL results for bingos whose answer set is identical in both:
CSW has far fewer players, and the two agree on shared bingos about as well
as noise allows.

A bingo gets a difficulty once at least --min-players players have tried its
current answer set; the rest are left out of the files and so get 0 from
dbmaker.

When a new lexicon goes live
----------------------------
1. Add it to EDITIONS below with its go-live date (the first day its daily
   challenges were live; an expected date is fine until then), and put its
   word list at <lexica>/<NAME>.txt.
2. Running this before then is fine: bingos whose answers didn't change keep
   their difficulty, and new or changed ones are left out.
3. After the scheduler has had them asked, run this again and rebuild the
   lexicon's database.

--holdout DATE fits on challenges played before DATE and reports how well the
difficulties rank the bingos within each later challenge (Spearman, averaged
over challenges), next to the difficulties currently in --compare. --until DATE
ignores challenges played on or after DATE, to see what an earlier run would
have produced.

--check-newness refits the lexicon's family with a newness curve per edition
plus a placebo, to see whether the shared newness curve still holds; see
check_newness() for how to read it. Run it when a new edition is added.
"""

import argparse
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd

# Each family's word lists in order, with the date each went live in Aerolith's
# daily challenges (None: before the challenge data starts). A word's age is
# measured from the go-live of the first edition containing it.
EDITIONS = {
    "NWL": [
        ("TWL06", None),
        ("America", "2015-03-11"),
        ("NWL18", "2019-02-14"),
        ("NWL20", "2021-01-27"),
        ("NWL23", "2024-02-05"),
    ],
    "CSW": [
        ("CSW12", None),
        ("CSW15", "2015-08-13"),
        ("CSW19", "2019-05-28"),
        ("CSW21", "2022-01-10"),
        ("CSW24", "2024-11-29"),
    ],
}
# Whose results count toward a family's bingos.
SOURCES = {"NWL": ["NWL"], "CSW": ["CSW", "NWL"]}
AGE_EDGES_DAYS = [0, 91, 182, 365, 730, 1461, 10**6]
AGE_LABELS = ["0-3mo", "3-6mo", "6-12mo", "1-2y", "2-4y", "4y+"]
LENGTHS = (7, 8)


def family(lexicon_name):
    if lexicon_name.startswith("CSW"):
        return "CSW"
    if lexicon_name.startswith(("NWL", "OWL", "America")):
        return "NWL"
    return None


# ----------------------------------------------------------------- data


def load_asks(data_dir):
    """One row per (challenge, bingo) with eff (players) and m (misses)."""
    d = Path(data_dir)
    ch = pd.read_csv(d / "challenges.csv", parse_dates=["date"])
    entries = pd.read_csv(d / "entries.csv")
    missed = pd.read_csv(d / "missed.csv")

    ch["family"] = ch.lexicon.map(family)
    # Challenges are created when first played and ids only grow, so the day an
    # ask was played is the latest challenge date at or before its id. (A
    # replay of 2012-06-01 made in 2025 was played in 2025.)
    ch = ch.sort_values("id")
    ch["played_on"] = ch.date.cummax()
    ch = ch[ch.family.notna()]

    players = entries.groupby("challenge_id").score.agg(
        n="size", z=lambda s: (s == 0).sum()
    )
    rows = []
    for cid, js in zip(ch.id, ch.alphagrams):
        for q in json.loads(js):
            rows.append((cid, q["q"], " ".join(sorted(q["a"]))))
    asks = pd.DataFrame(rows, columns=["challenge_id", "alphagram", "answers"])
    asks = asks.merge(
        ch[["id", "lexicon", "family", "name", "played_on"]].rename(
            columns={"id": "challenge_id"}
        )
    )
    asks = asks.merge(players, left_on="challenge_id", right_index=True)
    asks = asks.merge(missed, how="left").fillna({"missed": 0})
    # Zero-scorers are always among the missers; take them out of both sides.
    asks["eff"] = asks.n - asks.z
    asks["m"] = (asks.missed - asks.z).clip(lower=0)
    asks["length"] = asks.alphagram.str.len()
    return asks[(asks.eff > 0) & asks.length.isin(LENGTHS)].reset_index(drop=True)


def read_words(lexica, name):
    with open(Path(lexica) / f"{name}.txt") as f:
        for line in f:
            parts = line.split(None, 1)
            if parts and len(parts[0]) in LENGTHS:
                yield parts[0].upper()


def word_births(lexica, fam, as_of):
    """{word: go-live date of the first edition with it} for one family."""
    born = {}
    for name, live in EDITIONS[fam]:
        # Not live yet: its new words are brand new as of today.
        when = pd.Timestamp(live) if live else pd.NaT
        if live and when > as_of:
            when = as_of
        for w in read_words(lexica, name):
            born.setdefault(w, when)
    return born


def age_group(asks, births_by_family, offset):
    """
    Group index for each ask's newness term: offset[family] + age bucket of
    its newest word, or -1 if every word predates the data.
    """
    g = np.full(len(asks), -1)
    for fam, born in births_by_family.items():
        sel = (asks.family == fam).to_numpy()
        if not sel.any():
            continue
        sub = asks[sel]
        newest = {}
        for ans in sub.answers.unique():
            dates = [born.get(w, pd.NaT) for w in ans.split()]
            dates = [t for t in dates if pd.notna(t)]
            newest[ans] = max(dates) if dates else pd.NaT
        age = (sub.played_on - sub.answers.map(newest)).dt.days
        bucket = pd.cut(age, AGE_EDGES_DAYS, right=False, labels=False)
        g[sel] = np.where(bucket.notna(), bucket.fillna(0) + offset[fam], -1)
    return g


# ----------------------------------------------------------------- model


def fit(asks, groups, pinned, iters=60, theta_sd=2.0):
    """
    Fit b (per question), theta (per challenge) and gamma (per newness group)
    by alternating Newton steps. asks needs challenge_id, alphagram, answers,
    length, eff, m and g (newness group, -1 for none). gamma[pinned] stay 0.
    """
    cidx, cids = pd.factorize(asks.challenge_id)
    kidx, keys = pd.factorize(asks.alphagram + "|" + asks.answers)
    nC, nK = len(cids), len(keys)
    n = asks.eff.to_numpy(float)
    m = asks.m.to_numpy(float)
    gi = asks.g.to_numpy()
    has_g = gi >= 0
    klen = np.zeros(nK, int)
    klen[kidx] = asks.length.to_numpy()

    mk = np.bincount(kidx, m, nK)
    nk = np.bincount(kidx, n, nK)
    b = np.log((mk + 0.5) / (nk - mk + 0.5))
    theta = np.zeros(nC)
    gamma = np.zeros(groups)
    mu = {L: b[klen == L].mean() for L in LENGTHS}
    sig2 = {L: b[klen == L].var() for L in LENGTHS}

    def prob():
        off = np.where(has_g, gamma[np.clip(gi, 0, None)], 0.0)
        return 1 / (1 + np.exp(-(b[kidx] + off - theta[cidx])))

    for _ in range(iters):
        p = prob()
        grad = np.bincount(cidx, n * p - m, nC) - theta / theta_sd**2
        hess = np.bincount(cidx, n * p * (1 - p), nC) + 1 / theta_sd**2
        theta += grad / hess
        # Pin the scale: the player-weighted mean theta is 0.
        theta -= np.average(theta, weights=np.bincount(cidx, n, nC))

        p = prob()
        mu_k = np.array([mu[L] for L in klen])
        s2_k = np.array([sig2[L] for L in klen])
        grad = np.bincount(kidx, m - n * p, nK) - (b - mu_k) / s2_k
        info = np.bincount(kidx, n * p * (1 - p), nK)
        b += grad / (info + 1 / s2_k)

        p = prob()
        gg = np.bincount(gi[has_g], (m - n * p)[has_g], groups)
        hh = np.bincount(gi[has_g], (n * p * (1 - p))[has_g], groups) + 1e-9
        gamma += gg / hh
        gamma[pinned] = 0.0

        # Re-estimate each length's prior (EM: spread of the estimates plus
        # their average uncertainty).
        for L in LENGTHS:
            sel = klen == L
            if sel.any():
                mu[L] = b[sel].mean()
                sig2[L] = max(
                    0.05, np.var(b[sel]) + np.mean(1 / (info[sel] + 1 / sig2[L]))
                )

    se = 1 / np.sqrt(info + 1 / np.array([sig2[L] for L in klen]))
    items = pd.DataFrame(
        {"key": keys, "b": b, "se": se, "players": nk.astype(int), "length": klen}
    )
    items[["alphagram", "answers"]] = items.key.str.split("|", expand=True)
    return items.drop(columns="key"), pd.Series(theta, index=cids), gamma


def fit_family(asks, fam, lexica, as_of):
    """Fit on everything `fam` may use. Returns (items, theta, gamma by family)."""
    sources = SOURCES[fam]
    use = asks[asks.family.isin(sources)].copy()
    births = {f: word_births(lexica, f, as_of) for f in sources}
    offset = {f: i * len(AGE_LABELS) for i, f in enumerate(sources)}
    # A negative age (go-live dates are only accurate to a day or so) counts
    # as no newness.
    use["g"] = age_group(use, births, offset)
    groups = len(sources) * len(AGE_LABELS)
    pinned = [offset[f] + len(AGE_LABELS) - 1 for f in sources]
    items, theta, gamma = fit(use, groups, pinned)
    by_family = {f: gamma[offset[f] : offset[f] + len(AGE_LABELS)] for f in sources}
    return items, theta, by_family


# ----------------------------------------------------------------- checks


def check_newness(asks, lexica, fam, as_of, seed=7):
    """
    Is one newness curve per family good enough? Refits fam's own results
    with a separate curve for each edition's new words, plus a placebo, and
    prints each curve.

    How the shared curve is measured: a bingo asked when its newest word was
    2 months old and again 5 years later is compared with itself, and theta
    takes out the difference in crowds. That only works for words that have
    reached the pinned 4y+ bucket, so the shared curve's level comes from the
    older editions and newer editions are assumed to follow it.

    Reading the output:

    - placebo: a random half of the words that predate the data, pretending
      to be born on a mid-data go-live date. Nothing about them changed then,
      so every placebo value should be near 0 (|gamma| under about 0.05; in
      2026 they were -0.02 to +0.01). If they aren't, something that drifts
      over time (players getting better or worse at bingos generally) isn't
      being absorbed by theta, and the real newness values carry the same
      drift.
    - editions whose words have reached 4 years: their curves are measured
      the same way as the shared one and should look like it. In 2026,
      America, NWL18, CSW15 and CSW19 all started at +0.25 to +0.55 and faded
      to about +0.1 by 2-4 years. An edition with few young-age players
      (NWL18 at 0-3mo) is noisy; look at the player counts.
    - editions marked "level unmeasured" (none of their words are 4 years old
      yet): no bingo can be compared with its own settled self, so the
      fitted level also absorbs how obscure that edition's new words are
      (through b's prior), and reads high. In 2026 NWL23 read +0.58 to +0.32
      and CSW24 +0.74 to +0.52. Only the fade between their own columns is
      measured. "fade" runs from 0-3mo to the oldest age with data, so
      compare it with the older editions over the same columns. A fade much
      smaller than theirs would mean the edition's words are
      staying hard longer than the shared curve assumes, so its new-word
      bingos are rated too easy. In 2026 NWL23 faded 0.26 by 2-4y (America
      0.46, NWL18 0.29) and CSW24 0.22 by 1-2y (CSW15 0.12, CSW19 0.06): no
      sign of that.

    Once an edition's words pass 4 years its level becomes measurable; if it
    then sits well above or below the shared curve, newness needs a curve
    per edition rather than per family.
    """
    use = asks[asks.family == fam].copy()
    editions = EDITIONS[fam]
    born, edition = {}, {}
    for i, (name, live) in enumerate(editions):
        when = min(pd.Timestamp(live), as_of) if live else pd.NaT
        for w in read_words(lexica, name):
            if w not in born:
                born[w], edition[w] = when, i
    rng = np.random.default_rng(seed)
    old_words = sorted(w for w, t in born.items() if pd.isna(t))
    fake = set(rng.choice(old_words, len(old_words) // 2, replace=False))
    dated = [pd.Timestamp(live) for _, live in editions if live]
    fake_born = dated[len(dated) // 2]

    # Per answer set: (newest word's go-live, its edition), with the placebo
    # as edition len(editions).
    placebo = len(editions)
    newest = {}
    for ans in use.answers.unique():
        ws = ans.split()
        real = [(born[w], edition[w]) for w in ws if pd.notna(born.get(w, pd.NaT))]
        if real:
            newest[ans] = max(real)
        elif all(w in fake for w in ws):
            newest[ans] = (fake_born, placebo)
        else:
            newest[ans] = (pd.NaT, -1)
    when = use.answers.map(lambda a: newest[a][0])
    ed = use.answers.map(lambda a: newest[a][1]).to_numpy()
    bucket = pd.cut(
        (use.played_on - when).dt.days, AGE_EDGES_DAYS, right=False, labels=False
    )
    young = len(AGE_LABELS) - 1
    bk = bucket.fillna(young).astype(int).to_numpy()
    # A group per (edition, young bucket); settled (4y+), negative ages and
    # words older than the data all get no newness, as in the real fit.
    use["g"] = np.where((ed >= 1) & (bk < young), (ed - 1) * young + bk, -1)
    groups = len(editions) * young
    _, _, gamma = fit(use, groups, pinned=[])

    players = pd.Series(use.eff.to_numpy()).groupby(use.g.to_numpy()).sum()
    last = use.played_on.max()
    print(f"\nnewness by edition ({fam} results only, logits):")
    print(f"  {'':24s}" + "".join(f"{a:>8s}" for a in AGE_LABELS[:young]) + "    fade")
    for e in range(1, len(editions) + 1):
        if e == placebo:
            label = f"placebo ({fake_born.date()})"
            settled = True
        else:
            label = editions[e][0]
            live = editions[e][1]
            settled = pd.Timestamp(live) + pd.Timedelta(days=AGE_EDGES_DAYS[-2]) <= last
        idx = [(e - 1) * young + k for k in range(young)]
        seen = [players.get(i, 0) > 0 for i in idx]
        if not any(seen):
            continue
        vals = "".join(
            f"{gamma[i]:+8.2f}" if s else f"{'-':>8s}" for i, s in zip(idx, seen)
        )
        measured = [gamma[i] for i, s in zip(idx, seen) if s]
        fade = f"{measured[0] - measured[-1]:8.2f}"
        note = "" if settled else "  level unmeasured"
        print(f"  {label:24s}{vals}{fade}{note}")
        print(
            f"  {'  players':24s}"
            + "".join(f"{int(players.get(i, 0)):8d}" for i in idx)
        )


# ----------------------------------------------------------------- output


def current_bingos(lexica, lex):
    words = pd.DataFrame({"word": list(read_words(lexica, lex))}).drop_duplicates()
    words["alphagram"] = words.word.map(lambda w: "".join(sorted(w)))
    cur = (
        words.groupby("alphagram")
        .word.agg(lambda ws: " ".join(sorted(ws)))
        .rename("answers")
        .reset_index()
    )
    cur["length"] = cur.alphagram.str.len()
    return cur


def newness_now(cur, lexica, fam, gamma, as_of):
    born = word_births(lexica, fam, as_of)

    def newest(ans):
        dates = [born.get(w, pd.NaT) for w in ans.split()]
        dates = [t for t in dates if pd.notna(t)]
        return max(dates) if dates else pd.NaT

    age = (as_of - cur.answers.map(newest)).dt.days
    bucket = pd.cut(age, AGE_EDGES_DAYS, right=False, labels=False)
    return np.where(bucket.notna(), gamma[bucket.fillna(0).astype(int)], 0.0)


def difficulties(asks, lexica, lex, as_of, min_players):
    fam = family(lex)
    items, theta, gamma = fit_family(asks, fam, lexica, as_of)
    cur = current_bingos(lexica, lex)
    cur = cur.merge(items, on=["alphagram", "answers", "length"], how="left")
    cur["players"] = cur.players.fillna(0).astype(int)
    rated = cur[cur.players >= min_players].copy()
    rated["logit"] = rated.b + newness_now(rated, lexica, fam, gamma[fam], as_of)
    # 100 equal-sized bins per length, q0 (easiest) to q99; dbmaker adds 1.
    rated["quantile"] = rated.groupby("length").logit.transform(
        lambda s: pd.qcut(s.rank(method="first"), 100, labels=False)
    )
    return cur, rated, items, theta, gamma


def write(rated, out):
    out = Path(out)
    out.mkdir(parents=True, exist_ok=True)
    for L in LENGTHS:
        r = rated[rated.length == L].sort_values("logit", ascending=False)
        pd.DataFrame(
            {
                "Alphagram": r.alphagram,
                "quantile": "q" + r["quantile"].astype(int).astype(str),
                "answers": r.answers,
                "logit": r.logit.round(3),
                "se": r.se.round(3),
                "players": r.players,
            }
        ).to_csv(out / f"{L}.csv", index=False)
        print(f"wrote {out / f'{L}.csv'} ({len(r)} bingos)")


def read_quantiles(path):
    frames = []
    for L in LENGTHS:
        f = Path(path) / f"{L}.csv"
        if f.exists():
            d = pd.read_csv(f, usecols=["Alphagram", "quantile"])
            frames.append(d)
    d = pd.concat(frames)
    return pd.Series(
        d["quantile"].str[1:].astype(int).to_numpy() + 1, index=d.Alphagram
    )


def compare(rated, cur, old):
    """How the new 1-100 numbers differ from an existing set of files."""
    new = rated.set_index("alphagram")["quantile"] + 1
    both = pd.concat([old.rename("old"), new.rename("new")], axis=1).dropna()
    both = both.join(cur.set_index("alphagram")[["length"]])
    print(f"\nvs. existing files: {len(both)} bingos rated in both")
    for L in LENGTHS:
        s = both[both.length == L]
        d = (s.new - s.old).abs()
        top = ((s.old > 80) & (s.new > 80)).sum() / max((s.old > 80).sum(), 1)
        print(
            f"  {L}s: spearman {s.old.rank().corr(s.new.rank()):.3f}, "
            f"median |change| {d.median():.0f}, "
            f"within 5/10/20: {(d <= 5).mean():.1%} / {(d <= 10).mean():.1%} / "
            f"{(d <= 20).mean():.1%}, top-20% kept {top:.1%}"
        )
    dropped = old.index.difference(new.index)
    added = new.index.difference(old.index)
    print(
        f"  {len(dropped)} lose their difficulty (answers changed or not enough "
        f"data), {len(added)} get one for the first time"
    )


def holdout(asks, lexica, lex, cut, old, min_players):
    """
    Fit on challenges played before `cut`; score each later live challenge of
    `lex` by how well the difficulties rank its bingos' miss rates.
    """
    train = asks[asks.played_on < cut]
    _, rated, _, _, gamma = difficulties(train, lexica, lex, cut, min_players)
    test = asks[
        (asks.lexicon == lex) & (asks.played_on >= cut) & (asks.eff >= 20)
    ].copy()
    test["obs"] = test.m / test.eff
    t = test.merge(rated[["alphagram", "answers", "logit"]], how="inner")
    t["old"] = t.alphagram.map(old) if old is not None else np.nan
    t = t.dropna(subset=["old"]) if old is not None else t

    def spearman(col):
        return (
            t.groupby("challenge_id")
            .apply(lambda g: g[col].rank().corr(g.obs.rank()), include_groups=False)
            .mean()
        )

    print(
        f"\nholdout from {cut.date()}: {t.challenge_id.nunique()} challenges, "
        f"{len(t)} asks; within-challenge spearman new {spearman('logit'):.3f}"
        + (f", existing {spearman('old'):.3f}" if old is not None else "")
    )


def main():
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    ap.add_argument("data", help="directory from export_challenge_data.sh")
    ap.add_argument("lexicon", help="e.g. NWL23; must be in EDITIONS")
    ap.add_argument(
        "--lexica", default="../word-game-lexica", help="word lists (NAME.txt)"
    )
    ap.add_argument("--out", help="write 7.csv and 8.csv here")
    ap.add_argument("--compare", help="existing difficulty dir to diff against")
    ap.add_argument("--min-players", type=int, default=20)
    ap.add_argument("--as-of", help="date newness is measured at (default today)")
    ap.add_argument("--until", help="ignore challenges played on/after this date")
    ap.add_argument("--holdout", help="also backtest with this cutoff date")
    ap.add_argument(
        "--check-newness",
        action="store_true",
        help="also fit newness per edition, with a placebo (see check_newness)",
    )
    args = ap.parse_args()

    lex = args.lexicon
    fam = family(lex)
    if fam is None or lex not in [n for n, _ in EDITIONS[fam]]:
        sys.exit(f"{lex} isn't in EDITIONS")
    as_of = pd.Timestamp(args.as_of or pd.Timestamp.today().normalize())

    asks = load_asks(args.data)
    if args.until:
        asks = asks[asks.played_on < pd.Timestamp(args.until)]
    old = read_quantiles(args.compare) if args.compare else None

    cur, rated, items, theta, gamma = difficulties(
        asks, args.lexica, lex, as_of, args.min_players
    )
    print(f"{lex}: fit {len(items)} questions over {len(theta)} challenges")
    for f, g in gamma.items():
        print(
            f"  newness ({f} words), logits by age: "
            + ", ".join(f"{a} {v:+.2f}" for a, v in zip(AGE_LABELS, g))
        )
    for L in LENGTHS:
        n = (cur.length == L).sum()
        r = (rated.length == L).sum()
        print(f"  {L}s: {r} of {n} rated, {n - r} left at 0")
    if args.out:
        write(rated, args.out)
    if old is not None:
        compare(rated, cur, old)
    if args.holdout:
        holdout(
            asks, args.lexica, lex, pd.Timestamp(args.holdout), old, args.min_players
        )
    if args.check_newness:
        check_newness(asks, args.lexica, fam, as_of)


if __name__ == "__main__":
    main()

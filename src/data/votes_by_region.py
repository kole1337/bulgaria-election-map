"""Total party votes per electoral region (МИР) from the CIK open-data export.

Edit the file names below, then run:   py votes_by_region.py

Outputs (semicolon-separated, UTF-8 with BOM so Excel opens Cyrillic correctly):
  * OUT_LONG - one row per (region, party/independent on that region's ballot):
               region_code; region_name; party_number; party_name; votes
  * OUT_WIDE - one row per region, one column per national party (2-36), then a column with
               all independent candidates (numbers above 36) and a total column

Party numbers 2-36 are the same nationwide (cik_parties). Numbers above 36 are independent
candidates, and the same number is a different person in each region, so their names come
from local_parties (which lists what was on the ballot in each region).
"""
import csv
from collections import defaultdict

# ---- edit these -------------------------------------------------------------
PARTIES_FILE       = "cik_parties_14.11.2021.txt"
LOCAL_PARTIES_FILE = "local_parties_14.11.2021.txt"
SECTIONS_FILE      = "sections_14.11.2021.txt"
VOTES_FILE         = "votes_14.11.2021.txt"
OUT_LONG           = "votes_by_region_long.csv"
OUT_WIDE           = "votes_by_region_wide.csv"
# -----------------------------------------------------------------------------

LAST_NATIONAL_PARTY = 36   # numbers above this are independent candidates


def read_rows(path):
    """Yield the ';'-separated fields of each non-empty line (handles BOM and \\r\\n)."""
    with open(path, encoding="utf-8-sig") as f:
        for line in f:
            line = line.rstrip("\r\n")
            if line:
                yield line.split(";")


def load_parties(path):
    # party number -> name (national parties)
    return {int(r[0]): r[1] for r in read_rows(path)}


def load_ballots(path):
    # (region code, party number) -> name, for what was on each region's ballot.
    # Column 1 is the RIK code, which equals the region code (2 -> "02").
    return {(f"{int(r[0]):02d}", int(r[2])): r[3] for r in read_rows(path)}


def load_sections(path):
    # section code -> region code, and region code -> region name.
    # Section code = region(2) + municipality(2) + admin district(2) + section(3);
    # column 3 looks like "01. БЛАГОЕВГРАД".
    section_region, region_name = {}, {}
    for r in read_rows(path):
        section, region = r[0], r[0][:2]
        section_region[section] = region
        region_name.setdefault(region, r[2].split(". ", 1)[-1])
    return section_region, region_name


def sum_votes(path, section_region):
    # (region code, party number) -> votes, summed over every row of votes.txt.
    # A section has several rows (paper + one per voting machine), so all are added.
    totals = defaultdict(int)
    unknown_sections = set()
    for r in read_rows(path):
        region = section_region.get(r[1])
        if region is None:
            unknown_sections.add(r[1])
            continue
        pairs = r[3:]
        if len(pairs) % 2:              # tolerate a trailing empty field
            pairs = pairs[:-1]
        for party, votes in zip(pairs[0::2], pairs[1::2]):
            totals[(region, int(party))] += int(votes)
    return totals, unknown_sections


def main():
    parties = load_parties(PARTIES_FILE)
    ballots = load_ballots(LOCAL_PARTIES_FILE)
    section_region, region_name = load_sections(SECTIONS_FILE)
    totals, unknown = sum_votes(VOTES_FILE, section_region)

    # regions with no RIK (abroad, 32) are absent from local_parties: the full national list applies
    have_ballot = {r for r, _ in ballots}
    for region in set(region_name) - have_ballot:
        ballots.update({(region, p): n for p, n in parties.items()})

    if unknown:
        print(f"WARNING: {len(unknown)} sections in the votes file are missing from the sections file")
    stray = {k for k, v in totals.items() if v and k not in ballots}
    if stray:
        print(f"WARNING: votes for (region, party) pairs not on that region's ballot: {sorted(stray)}")

    regions = sorted(region_name)
    national = sorted(parties)

    def name(region, p):
        return ballots.get((region, p)) or parties.get(p, f"(unknown {p})")

    with open(OUT_LONG, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f, delimiter=";")
        w.writerow(["region_code", "region_name", "party_number", "party_name", "votes"])
        for region in regions:
            for reg, p in sorted(k for k in ballots if k[0] == region):
                w.writerow([region, region_name[region], p, name(region, p), totals.get((region, p), 0)])

    with open(OUT_WIDE, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f, delimiter=";")
        w.writerow(["region_code", "region_name"] + [str(p) for p in national]
                   + ["independents", "total"])
        for region in regions:
            row = [totals.get((region, p), 0) for p in national]
            indep = sum(v for (r, p), v in totals.items() if r == region and p > LAST_NATIONAL_PARTY)
            w.writerow([region, region_name[region]] + row + [indep, sum(row) + indep])

    # console summary: nationwide totals (independents are different people per region, so they
    # are listed per region rather than merged under one number)
    print(f"{len(regions)} regions, {len(national)} national parties")
    nat_total = {p: sum(totals.get((r, p), 0) for r in regions) for p in national}
    for p in sorted(national, key=nat_total.get, reverse=True):
        print(f"{p:>3}  {nat_total[p]:>9,}  {parties[p]}")
    grand = sum(nat_total.values())
    for (region, p), v in sorted(totals.items()):
        if p > LAST_NATIONAL_PARTY and v:
            print(f"{p:>3}  {v:>9,}  {name(region, p)}  [region {region}]")
            grand += v
    print(f"     {grand:>9,}  TOTAL")
    print(f"Wrote {OUT_LONG} and {OUT_WIDE}")


if __name__ == "__main__":
    main()

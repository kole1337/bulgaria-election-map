"""Transform votes_by_region_wide.csv (party-number columns) into RegionResult
entries matching the shape of results.json, and merge them in.

Run:   py csv_to_results.py

Notes on fields that this source data cannot fill in:
  * turnout is left at 0 - the CSV has vote counts only, not registered voters.
  * mps is left as [] - seat allocation isn't in this dataset.
  * party colors are whatever is already set in PARTY_COLOR_PLACEHOLDER below;
    real colors should be assigned in App.tsx's PARTIES list later.
"""
import csv
import json

CSV_FILE = "president-2021/votes_by_region_wide.csv"
RESULTS_FILE = "results.json"
ELECTION_ID = "2021-11-14"

# party number -> partyId (must match ids in App.tsx's PARTIES list)
PARTY_ID = {
    2: "rusofili",
    4: "patriotichen-front",
    5: "vazrazhdane",
    7: "nod",
    8: "bsdd",
    10: "bsd-evrolevitsa",
    11: "ataka",
    13: "onb",
    14: "glas-naroden",
    17: "dps",
    20: "pravoto",
    21: "vmro",
    22: "bno",
    23: "volya",
    24: "ima-takuv-narod",
    25: "pp",
    26: "mir",
    27: "blagodenstvie",
    28: "bns-nd",
    29: "priyaka-democracy",
    30: "db",
    31: "izpravi-se-bg",
    32: "gerb-sds",
    33: "bsp",
    34: "bpl",
    35: "zelenite",
    36: "brigada",
}
INDEPENDENTS_PARTY_ID = "independent-candidates"

# region_code -> regionId (matches REGIONS / subRegions abbreviations in App.tsx)
REGION_ID = {
    "01": "BLG", "02": "BGS", "03": "VAR", "04": "VTR", "05": "VID",
    "06": "VRC", "07": "GAB", "08": "DOB", "09": "KRZ", "10": "KNL",
    "11": "LOV", "12": "MON", "13": "PAZ", "14": "PER", "15": "PVN",
    "16": "PDG", "17": "PDO", "18": "RAZ", "19": "RSE", "20": "SLS",
    "21": "SLV", "22": "SML", "23": "SOF23", "24": "SOF24", "25": "SOF25",
    "26": "SFO", "27": "SZR", "28": "TGV", "29": "HKV", "30": "SHU",
    "31": "JAM", "32": "ABR",
}


def read_rows(path):
    with open(path, encoding="utf-8-sig") as f:
        r = csv.reader(f, delimiter=";")
        header = next(r)
        for row in r:
            if row:
                yield row
    return header


def main():
    with open(CSV_FILE, encoding="utf-8-sig") as f:
        reader = csv.reader(f, delimiter=";")
        header = next(reader)
        party_numbers = [int(h) for h in header[2:-2]]

        entries = []
        for row in reader:
            if not row:
                continue
            region_code, region_name = row[0], row[1]
            values = [int(v) for v in row[2:]]
            party_votes = dict(zip(party_numbers, values[:-2]))
            independents_votes = values[-2]
            total_votes = values[-1]

            region_id = REGION_ID.get(region_code)
            if region_id is None:
                raise ValueError(f"Unmapped region_code {region_code} ({region_name})")

            parties = [
                {"partyId": PARTY_ID[p], "votes": v}
                for p, v in party_votes.items()
            ]
            if independents_votes:
                parties.append({"partyId": INDEPENDENTS_PARTY_ID, "votes": independents_votes})

            parties.sort(key=lambda p: p["votes"], reverse=True)
            for p in parties:
                p["percentage"] = round(p["votes"] / total_votes * 100, 2) if total_votes else 0

            entries.append({
                "regionId": region_id,
                "electionId": ELECTION_ID,
                "turnout": 0,
                "totalVotes": total_votes,
                "parties": parties,
                "mps": [],
            })

    with open(RESULTS_FILE, encoding="utf-8") as f:
        results = json.load(f)

    existing_keys = {(r["regionId"], r["electionId"]) for r in results}
    added = 0
    for e in entries:
        key = (e["regionId"], e["electionId"])
        if key in existing_keys:
            print(f"Skipping {key}, already present in {RESULTS_FILE}")
            continue
        results.append(e)
        added += 1

    with open(RESULTS_FILE, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"Added {added} region results for election {ELECTION_ID} to {RESULTS_FILE}")


if __name__ == "__main__":
    main()

import pandas as pd
import json

# 1. Configuration - Change these to your actual filenames
EXCEL_FILE = 'election_results.xlsx'
JSON_TEMPLATE_FILE = 'template.json' # The file you provided
OUTPUT_FILE = 'updated_results.json'

# Mapping: "Cyrillic Name in Excel": "partyId in JSON"
# Add all your parties here so the script knows who is who
name_mapping = {
    "ГЕРБ-СДС": "gerb-sds",
    "ДПС-Ново Начало": "dps-nn",
    "ПП-ДБ": "pp-db",
    "ВЪЗРАЖДАНЕ": "vazrazhdane",
    "БСП": "bsp",
    # ... add the rest of your mapping here
}

def update_election_data():
    # Load Excel data
    # Assuming Column 0 is Name and Column 1 is Votes
    df = pd.read_excel(EXCEL_FILE)
    
    # Calculate Total
    total_votes = df.iloc[:, 1].sum()
    
    # Create a list of party objects
    party_list = []
    for index, row in df.iterrows():
        cyrillic_name = row[0]
        votes = int(row[1])
        
        # Calculate percentage rounded to 2 decimal places
        percentage = round((votes / total_votes) * 100, 2) if total_votes > 0 else 0
        
        # Get the ID from our map, default to lowercase version of name if not found
        party_id = name_mapping.get(cyrillic_name, cyrillic_name.lower().replace(" ", "-"))
        
        party_list.append({
            "partyId": party_id,
            "votes": votes,
            "percentage": percentage
        })

    # Sort party list by votes descending (standard election format)
    party_list = sorted(party_list, key=lambda x: x['votes'], reverse=True)

    # Update the JSON structure
    # If you have multiple regions, you would wrap this in a loop
    result_data = [{
        "regionId": "BLG", # You can customize this
        "electionId": "2023-04-02",
        "turnout": 40.91, # You'll need to calculate this or keep template value
        "totalVotes": int(total_votes),
        "parties": party_list
    }]

    # Save to file
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(result_data, f, ensure_ascii=False, indent=2)

    print(f"Successfully updated {OUTPUT_FILE}")

if __name__ == "__main__":
    update_election_data()
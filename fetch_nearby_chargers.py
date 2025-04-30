import json
import requests
import time

# Load the file
with open("potential_chargers_no_chargers.json", "r") as f:
    charger_sites = json.load(f)

def get_nearby_chargers(lat, lon, distance_km=10):
    url = (
        "https://api.openchargemap.io/v3/poi/"
        f"?output=json&latitude={lat}&longitude={lon}&distance={distance_km}"
        "&distanceunit=KM&maxresults=5&compact=true&verbose=false"
    )
    headers = {
        "X-API-Key": ""  # Optional: Add API Key if you have one
    }

    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            pois = response.json()
            return [poi["AddressInfo"]["Title"] for poi in pois]
        else:
            return []
    except Exception as e:
        print(f"Error fetching for {lat},{lon}: {e}")
        return []

# Fetch and add real chargers to each site
for site in charger_sites:
    site["nearbyChargers"] = get_nearby_chargers(site["lat"], site["lon"])
    time.sleep(1)  # To avoid API throttling

# Save final result
with open("potential_chargers.json", "w") as f:
    json.dump(charger_sites, f, indent=2)

print("✔ Done! Saved as potential_chargers.json")

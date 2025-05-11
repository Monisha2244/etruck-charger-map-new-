const map = L.map("map").setView([50.5, 10.0], 5);

// Add OpenStreetMap tile layer
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

// Function to choose icon color based on score
function getMarkerColor(score) {
  if (score >= 8.5) return "green";
  else if (score >= 7.0) return "orange";
  else return "red";
}

// Function to fetch driving route from OpenRouteService
async function fetchRouteFromORS(start, end) {
  const apiKey = "5b3ce3597851110001cf62480917a3d5026a409c8d18741eac1cc075"; // Your actual API key
  const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${start[1]},${start[0]}&end=${end[1]},${end[0]}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`Failed to fetch route: ${res.status} ${res.statusText}`);
      return null;
    }
    const data = await res.json();
    return data.features[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
  } catch (err) {
    console.error("Routing error:", err);
    return null;
  }
}

// Load charger data
fetch("potential_chargers_extended_realistic_FINAL.json")
  .then(res => res.json())
  .then(async data => {
    const routes = {};

    data.forEach(site => {
      const color = getMarkerColor(site.totalScore);

      const marker = L.circleMarker([site.lat, site.lon], {
        radius: 8,
        color: color,
        fillColor: color,
        fillOpacity: 0.8,
        weight: 1
      }).addTo(map);

      const popupContent = `
        <b>${site.name}</b><br>
        <b>Route:</b> ${site.route}<br>
        <b>Total Score:</b> ${site.totalScore}<br>
        <b>Scores:</b><br>
        🛣️ Proximity: ${site.proximity}<br>
        🅿️ Space: ${site.space}<br>
        🚛 Logistics: ${site.logistics}<br>
        ${site.nearbyChargers?.length ? `<b>Nearby Chargers:</b><ul>${site.nearbyChargers.map(n => `<li>${n}</li>`).join("")}</ul>` : ""}
      `;
      marker.bindPopup(popupContent);

      if (!routes[site.route]) {
        routes[site.route] = [];
      }
      routes[site.route].push(site);
    });

    // Draw real road routes between charger sites per route
    for (const routeName in routes) {
      const chargers = routes[routeName];

      for (let i = 0; i < chargers.length - 1; i++) {
        const start = [chargers[i].lat, chargers[i].lon];
        const end = [chargers[i + 1].lat, chargers[i + 1].lon];

        const routeCoords = await fetchRouteFromORS(start, end);
        if (routeCoords) {
          L.polyline(routeCoords, {
            color: "blue",
            weight: 3,
            opacity: 0.7
          }).addTo(map);
        } else {
          console.warn(`Skipping route from ${start} to ${end} due to fetch error.`);
        }

        // To respect rate limits, wait for a short duration before the next request
        await new Promise(resolve => setTimeout(resolve, 1500)); // Wait for 1.5 seconds
      }
    }
  })
  .catch(err => {
    console.error("Failed to load charger data:", err);
  });

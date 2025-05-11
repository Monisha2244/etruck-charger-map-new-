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

// Remove the function for adding route lines, no need to add polylines

// Load charger data
fetch("potential_chargers_extended_realistic_FINAL.json")
  .then(res => res.json())
  .then(data => {
    // Group chargers by route
    const routes = {};

    data.forEach(site => {
      const color = getMarkerColor(site.totalScore);

      // Custom colored marker using Leaflet circleMarker
      const marker = L.circleMarker([site.lat, site.lon], {
        radius: 8,
        color: color,
        fillColor: color,
        fillOpacity: 0.8,
        weight: 1
      }).addTo(map);

      // Create popup content
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

      // Group sites by route
      if (!routes[site.route]) {
        routes[site.route] = [];
      }
      routes[site.route].push(site);
    });

    // Remove the part where route lines were added
    // for (const route in routes) {
    //   addRouteLine(routes[route]);
    // }
  })
  .catch(err => {
    console.error("Failed to load charger data:", err);
  });

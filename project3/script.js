const userForm = document.getElementById('userForm');
const searchBox = document.querySelector('.SearchBox');
const resultsBox = document.querySelector('.results');

const API_KEY = 'viGRUd5KbK9CZPrfCRsPDfWn1NWbtGQN'; // 🔁 Replace this with your real TomTom API key

let map;
let markers = [];

// Step 1: Convert location name to lat/lon
const geocodeLocation = async (placeName) => {
    const url = `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(placeName)}.json?key=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    console.log("Geocode result:", data);

    if (data.results && data.results.length > 0) {
        return data.results[0].position; // {lat, lon}
    } else {
        throw new Error("Location not found.");
    }
};

// Step 2: Get nearby EV charging stations
const getChargingStations = async (lat, lon) => {
    const url = `https://api.tomtom.com/search/2/nearbySearch/.json?lat=${lat}&lon=${lon}&categorySet=7309&radius=10000&key=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    console.log("Nearby stations result:", data);
    return data.results || [];
};

// Step 3: Initialize or update the map
function initializeMap(lat, lon) {
    if (!map) {
        map = tt.map({
            key: API_KEY,
            container: 'map',
            center: [lon, lat],
            zoom: 13
        });
        map.addControl(new tt.NavigationControl());
    } else {
        map.setCenter([lon, lat]);
    }

    // Clear old markers
    markers.forEach(marker => marker.remove());
    markers = [];
}

// Step 4: Add station marker
function addStationMarker(lat, lon, name) {
    const marker = new tt.Marker().setLngLat([lon, lat]).addTo(map);
    marker.getElement().title = name;
    markers.push(marker);
}

// Step 5: Handle form submit
userForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const location = searchBox.value.trim();

    if (location === '') {
        resultsBox.innerHTML = `<p>Please enter a location.</p>`;
        return;
    }

    resultsBox.innerHTML = `<p>Searching for EV stations near <strong>${location}</strong>...</p>`;

    try {
        const { lat, lon } = await geocodeLocation(location);
        initializeMap(lat, lon);

        const stations = await getChargingStations(lat, lon);

        if (stations.length === 0) {
            resultsBox.innerHTML = `<p>No EV stations found near <strong>${location}</strong>.</p>`;
        } else {
            resultsBox.innerHTML = `<h3>EV Stations near ${location}:</h3><ul>` +
                stations.map(station => {
                    const name = station.poi?.name || 'Unnamed Station';
                    const address = station.address?.freeformAddress || 'Address unavailable';
                    const { lat, lon } = station.position;
                    addStationMarker(lat, lon, name);
                    return `<li><strong>${name}</strong><br>${address}</li>`;
                }).join('') +
                `</ul>`;
        }

    } catch (error) {
        resultsBox.innerHTML = `<p>Error: ${error.message}</p>`;
        console.error("Error:", error);
    }
});

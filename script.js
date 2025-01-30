// Initialize the Leaflet map
var map = L.map('map').setView([49.63881062758846, 8.358768802235213], 14); // Set the center and zoom level

// Add the OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// GeoJSON URL
const geojsonURL = 'https://raw.githubusercontent.com/celthome/worms-mockup/refs/heads/main/klimaoasen_4326.geojson';

// Array to hold GeoJSON features
let geojsonData = [];

// Function to load and display GeoJSON
function loadGeoJSON(url) {
    fetch(url)
        .then(response => response.json())
        .then(data => {
            // Filter features to only include those with Relevanz == 1
            const filteredData = {
                ...data,
                features: data.features.filter(feature => feature.properties.Relevanz === 1)
            };
            
            // Store the features in the geojsonData array
            geojsonData = filteredData.features;

            // Log and validate GeoJSON data
            console.log("GeoJSON Data Loaded:", geojsonData);
            geojsonData.forEach((feature, index) => {
                if (!feature.geometry || !feature.geometry.coordinates) {
                    console.warn(`Feature missing geometry or coordinates at index ${index}:`, feature);
                }
            });

            // Add filtered GeoJSON to the map
            L.geoJSON(filteredData, {
                pointToLayer: function (feature, latlng) {
                    return L.circleMarker(latlng, {
                        radius: 8,
                        color: 'blue',
                        weight: 1,
                        opacity: 1.0,
                        fillColor: 'blue',
                        fillOpacity: 0.4
                    });
                },
                onEachFeature: function (feature, layer) {
                    if (feature.properties && feature.properties["Name des Ortes"]) {
                        layer.bindPopup("<b>" + feature.properties["Name des Ortes"] + "</b>");
                    }
                }
            }).addTo(map);
        })
        .catch(error => {
            console.error("Error loading GeoJSON:", error);
        });
}

// Load GeoJSON data
loadGeoJSON(geojsonURL);

// Function to find the nearest location
function findNearestLocation() {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by this browser.");
        return;
    }

    // Check if the site is served over HTTPS (Geolocation requires HTTPS)
    if (window.location.protocol !== "https:") {
        alert("Geolocation requires HTTPS. Please ensure the site is served over HTTPS.");
        return;
    }

    // Get the user's current position
    navigator.geolocation.getCurrentPosition(
        position => {
            const userLat = position.coords.latitude;
            const userLon = position.coords.longitude;
            console.log("User location:", userLat, userLon); // Log the user's location

            if (geojsonData.length === 0) {
                alert("No Klimaoasen data loaded. Please try again later.");
                return;
            }

            let nearestDistance = Infinity;
            let nearestFeature = null;

            // Loop through the GeoJSON features and calculate the distance to each one
            geojsonData.forEach(feature => {
                if (feature.geometry && feature.geometry.coordinates) {
                    const latlng = L.latLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]);
                    const distance = latlng.distanceTo([userLat, userLon]);

                    // Check if the current feature is the closest one
                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        nearestFeature = feature;
                    }
                } else {
                    console.warn("Feature missing geometry or coordinates:", feature);
                }
            });

            // Zoom into the nearest location
            if (nearestFeature) {
                const nearestLatLng = [
                    nearestFeature.geometry.coordinates[1],
                    nearestFeature.geometry.coordinates[0]
                ];
                map.setView(nearestLatLng, 16);
                L.marker(nearestLatLng)
                    .addTo(map)
                    .bindPopup(`<b>Nearest Klimaoase:</b> ${nearestFeature.properties["Name des Ortes"]}`)
                    .openPopup();
            } else {
                alert("No Klimaoasen found near you.");
            }
        },
        error => {
            console.error("Geolocation error:", error); // Log the error object
            alert(`Error Code: ${error.code} - ${error.message}`); // Show detailed error to the user
        }
    );
}

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
            console.log("GeoJSON Data Loaded:", geojsonData); // Log the loaded GeoJSON data
        })
        .catch(error => {
            console.error("Error loading GeoJSON:", error);
        });
}

// Load GeoJSON data
loadGeoJSON(geojsonURL);
geojsonData.features.forEach((feature, index) => {
    if (!feature.geometry || !feature.geometry.coordinates) {
        console.warn(`Feature missing geometry or coordinates at index ${index}:`, feature);
    }
});

// Function to find the nearest location
function findNearestLocation() {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by this browser.");
        return;
    }

    // Ensure the page is served over HTTPS
    if (window.location.protocol !== "https:") {
        alert("Geolocation requires HTTPS. Please ensure the site is served over HTTPS.");
        return;
    }

    // Get the user's current position
    navigator.geolocation.getCurrentPosition(
        position => {
            const userLat = position.coords.latitude;
            const userLon = position.coords.longitude;
            console.log("User location:", userLat, userLon);

            if (geojsonData.length === 0) {
                alert("No valid Klimaoasen data available.");
                return;
            }

            let nearestDistance = Infinity;
            let nearestFeature = null;

            // Find the nearest valid feature
            geojsonData.forEach(feature => {
                if (feature.geometry && feature.geometry.coordinates) {
                    const latlng = L.latLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]);
                    const distance = latlng.distanceTo([userLat, userLon]);

                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        nearestFeature = feature;
                    }
                }
            });

            // If a nearest feature is found, zoom in
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
                alert("No valid Klimaoasen found near you.");
            }
        },
        error => {
            console.error("Geolocation error:", error);
            alert("Unable to retrieve location. Please check your settings.");
            
            if (error.code === 1) {
                console.log("User denied geolocation request.");
            } else if (error.code === 2) {
                console.log("Geolocation unavailable.");
            } else if (error.code === 3) {
                console.log("Geolocation request timed out.");
            }

            // Detailed error log
            console.log("Error Details: ", error.message);
        }
    );
}

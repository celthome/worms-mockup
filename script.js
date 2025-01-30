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
            if (error.code === 2) {
                alert("Location information is unavailable. Please check your GPS or network connection.");
            } else {
                alert(`Error Code: ${error.code} - ${error.message}`);
            }
        }
    );
}

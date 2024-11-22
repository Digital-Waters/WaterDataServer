
let polyline; // Variable to store the gradient line
let offset = 0; // Initial offset
let jsonData = []; // Array to hold all fetched data
let OPENWEATHER_API_KEY;
let markerLayer;
var map = L.map('map').setView([43.6909, -79.3905], 13);
let totalRecords = []; // Flattened list of all records across devices
let showDetails = true; // Track the initial state of tooltips
let showWeatherLayer = false; // Track the state of the weather layer
window.precipitationLayers = []; // Store layers for toggling


function fetchData(offset) {
    const url = `https://water-watch-58265eebffd9.herokuapp.com/getwaterdata/?deviceIDs=0000000077de649d&deviceIDs=000000002133dded&deviceIDs=0000000035a0f031&only_underwater=25&sort_by=deviceDatetime&offset=${offset}`;

    return fetch(url)
        .then(response => response.json())
        .then(data => {
            if (Array.isArray(data)) {
                // Add records to jsonData without sorting individually
                data.forEach(record => {
                    const deviceID = record.deviceID;
                    if (!jsonData[deviceID]) {
                        jsonData[deviceID] = []; // Initialize array for new deviceID
                    }
                    jsonData[deviceID].push(record); // Add record to device's array
                });

                // Sort each device's array by device_datetime
                Object.keys(jsonData).forEach(deviceID => {
                    jsonData[deviceID].sort((a, b) => new Date(b.device_datetime) - new Date(a.device_datetime));
                });

                // Flatten jsonData into totalRecords and sort by device_datetime
                totalRecords = Object.values(jsonData).flat().sort((a, b) => new Date(b.device_datetime) - new Date(a.device_datetime));

                // Update the slider range based on totalRecords length
                $("#slider").slider("option", "max", totalRecords.length - 1);

                updateMap(0); // Initialize with the first data record

                // Show the "Next" button only if 1000 records were returned
                if (data.length < 1000) {
                    document.getElementById("next-btn").style.display = "none";
                }
            } else {
                console.error('Unexpected data format:', data);
            }
        })
        .catch(error => console.error('Error fetching data:', error));
}



// Listen for checkbox changes to toggle tooltips
document.getElementById('show-details').addEventListener('change', function (e) {
    showDetails = e.target.checked;
    updateMap(currentTimeIndex); // Refresh map to apply tooltip state
});

// Toggle weather layer based on checkbox
document.getElementById('show-weather').addEventListener('change', function (e) {
    showWeatherLayer = e.target.checked;

    if (showWeatherLayer) {
        window.precipitationLayers.forEach(layer => layer.addTo(map));
    } else {
        window.precipitationLayers.forEach(layer => map.removeLayer(layer));
    }
});

function updateMap(timeIndex) {
    // Update the global time index for tracking
    currentTimeIndex = timeIndex;

    // Ensure timeIndex is within bounds for totalRecords
    if (timeIndex < 0 || timeIndex >= totalRecords.length) {
        console.error("Invalid time index.");
        return;
    }

    // Clear previous markers and tooltips
    markerLayer.clearLayers();

    // Array to store coordinates for drawing lines
    const deviceCoordinates = [];
    const deviceMarkers = [];

    // Iterate over all deviceIDs in jsonData
    Object.keys(jsonData).forEach((deviceID) => {
        // Get the most recent record for the current deviceID
        const data = findClosestRecord(totalRecords[timeIndex].device_datetime, jsonData[deviceID]);

        if (!data) {
            return;
        }

        // Parse water color for the marker
        const waterColor = parseWaterColor(data.waterColor);

        // Add coordinates and water color to the array for drawing lines
        deviceCoordinates.push({
            coords: [data.latitude, data.longitude],
            color: waterColor,
            order: data.latitude
        });

        // Prepare the marker data for later rendering
        deviceMarkers.push({
            coords: [data.latitude, data.longitude],
            waterColor: waterColor,
            data: data
        });
    });

    deviceCoordinates.sort((a, b) => b.order - a.order);

    // Draw lines between consecutive device points
    for (let i = 0; i < deviceCoordinates.length - 1; i++) {
        updateLine(
            deviceCoordinates[i].coords,
            deviceCoordinates[i].color,
            deviceCoordinates[i + 1].coords,
            deviceCoordinates[i + 1].color
        );
    }

    // Draw markers on top of the lines
    deviceMarkers.forEach((markerData) => {
        const { coords, waterColor, data } = markerData;

        // Create a marker for the current device
        const marker = L.circleMarker(coords, {
            radius: 8,
            fillColor: `rgba(${waterColor.r}, ${waterColor.g}, ${waterColor.b}, ${waterColor.a / 10})`,
            color: "#000",
            weight: 1,
            fillOpacity: 0.8
        }).addTo(markerLayer);

        // Add tooltip if showDetails is true
        if (showDetails) {
            marker.bindTooltip(`
                <b>Device ID:</b> ${data.deviceID}<br>
                <b>Latitude:</b> ${data.latitude}<br>
                <b>Longitude:</b> ${data.longitude}<br>
                <b>Date:</b> ${data.device_datetime}<br>
                <b>Temperature:</b> ${data.temperature}<br>
                <b>Water Color:</b> rgba(${waterColor.r}, ${waterColor.g}, ${waterColor.b}, ${waterColor.a})
            `, {
                permanent: true,
                direction: "right",
                offset: [10, 0]
            });
        }

        // Open imageURI in new tab on marker click
        marker.on('click', () => {
            window.open(data.imageURI, '_blank');
        });
    });
}


// Fetch API key from server
async function getWeatherApiKey() {
    const response = await fetch('/getWeatherAPIKey');
    const data = await response.json();
    if (data.api_key) {
        OPENWEATHER_API_KEY = data.api_key;
    } else {
        console.error('Failed to load weather API key');
    }
}


// Initialize map and fetch initial data
document.addEventListener('DOMContentLoaded', function () {
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    map.attributionControl.setPrefix(''); // Remove Ukranian flag, keep things focused on geo data. 

    // Initialize markerLayer here
    markerLayer = L.layerGroup().addTo(map);

    // Initial fetch of data with offset = 0
    fetchData(offset);

    // "Next" button click event
    document.getElementById("next-btn").addEventListener("click", () => {
        offset += 1000; // Increment offset by 1000 for pagination
        fetchData(offset); // Fetch next set of data
    });
    
    /*
    addPrecipitationLayerForArea(43.69, -79.385); // Example: Toronto coordinates
    if (showWeatherLayer) {
        window.precipitationLayers.forEach(layer => layer.addTo(map));
    } else {
        window.precipitationLayers.forEach(layer => map.removeLayer(layer));
    }
    */
    // Initialize and update slider based on total records for all devices
    $("#slider").slider({
        min: 0,
        max: Object.values(jsonData).flat().length - 1,
        step: 1,
        slide: async function (event, ui) {
            updateMap(ui.value); // Update map with new data record index
        }
    });
});


// Function to create a gradient line between points
function updateLine(point1, color1, point2, color2) {
    const midpointColor = interpolateColor(color1, color2);
    const lineStyle = {
        color: midpointColor,
        weight: 10,
        opacity: 0.6
    };

    // Add new polyline to markerLayer (which is already attached to map)
    polyline = L.polyline([point1, point2], lineStyle).addTo(markerLayer);
}

// Function to interpolate colors
function interpolateColor(color1, color2, factor = 0.5) {
    // Parse the colors
    const color1RGB = [color1.r, color1.g, color1.b];
    const color2RGB = [color2.r, color2.g, color2.b];

    // Interpolate each color channel
    const result = color1RGB.map((channel, index) =>
        Math.round(channel + factor * (color2RGB[index] - channel))
    );

    return `rgb(${result[0]}, ${result[1]}, ${result[2]})`;
}

// Function to parse the waterColor field into an object with r, g, b, and a properties
function parseWaterColor(waterColorString) {
    try {
        // Replace single quotes with double quotes to make it valid JSON, then parse
        const colorString = waterColorString.replace(/'/g, '"');
        return JSON.parse(colorString);
    } catch (error) {
        console.error('Error parsing waterColor:', error);
        // Return a default color in case of error
        return { r: 0, g: 0, b: 0, a: 100 };
    }
}

// Helper function to find the closest record by datetime
function findClosestRecord(targetDatetime, records) {
    // Parse the target datetime
    const targetTime = new Date(targetDatetime).getTime();

    let closestRecord = records[0];
    let closestDifference = Math.abs(targetTime - new Date(closestRecord.device_datetime).getTime());

    for (const record of records) {
        const recordTime = new Date(record.device_datetime).getTime();
        const difference = Math.abs(targetTime - recordTime);

        if (difference < closestDifference) {
            closestRecord = record;
            closestDifference = difference;
        }
    }

    // Check if the closest difference is within 1 minute (60,000 ms)
    if (closestDifference <= 120* 60 * 1000) {
        return closestRecord;
    }

    return null;
}

// Function to update precipitation layer based on current timeIndex and location
async function updatePrecipitationLayer(timeIndex) {
    const currentRecord = totalRecords[timeIndex];
    const latitude = currentRecord.latitude;
    const longitude = currentRecord.longitude;
    const datetime = currentRecord.device_datetime;

    const precipitation = await fetchPrecipitationData(latitude, longitude, datetime);
    
    // Add the precipitation layer based on precipitation data (e.g., using circle marker)
    const precipitationLayer = L.circleMarker([latitude, longitude], {
        radius: Math.min(20, precipitation * 2), // Scale radius based on precipitation amount
        color: "blue",
        fillOpacity: 0.5,
        fillColor: "blue"
    }).addTo(map);
    
    // Clear old precipitation layer before adding a new one
    if (map.hasLayer(precipitationLayer)) {
        map.removeLayer(precipitationLayer);
    }
    map.addLayer(precipitationLayer);
}


// Fetch current precipitation data from OpenWeatherMap's One Call v3.0 API
async function fetchCurrentPrecipitation(latitude, longitude) {
    getWeatherApiKey()
    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&exclude=minutely,hourly,daily,alerts&appid=${OPENWEATHER_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();
    
    // Get precipitation data (in mm) if available under current weather
    const precipitation = data.current?.rain?.['1h'] || 0;
    return precipitation;
}

// Function to add a current precipitation layer on the map
async function addCurrentPrecipitationLayer() {
    const latitude = 43.6532; // Example location (Toronto latitude)
    const longitude = -79.3832; // Example location (Toronto longitude)

    // Fetch the current precipitation data
    const precipitation = await fetchCurrentPrecipitation(latitude, longitude);

    // Clear any previous precipitation layer
    if (window.currentPrecipitationLayer) {
        map.removeLayer(window.currentPrecipitationLayer);
    }

    // Add a new precipitation layer based on the precipitation amount
    window.currentPrecipitationLayer = L.circleMarker([latitude, longitude], {
        radius: Math.min(20, precipitation * 2), // Scale radius with precipitation
        color: "blue",
        fillOpacity: 0.5,
        fillColor: "blue"
    }).addTo(map);
}





// Function to generate nearby points within a 1 km radius around a central location
function getNearbyPoints(latitude, longitude) {
    const kmInLatitudeDegrees = 1 / 110.574; // 1 km in degrees latitude
    const kmInLongitudeDegrees = 1 / (111.32 * Math.cos(latitude * (Math.PI / 180))); // Adjust for longitude

    // Define points around the center in a square pattern, ~1 km apart
    return [
        { lat: latitude + kmInLatitudeDegrees, lon: longitude },         // North
        { lat: latitude - kmInLatitudeDegrees, lon: longitude },         // South
        { lat: latitude, lon: longitude + kmInLongitudeDegrees },        // East
        { lat: latitude, lon: longitude - kmInLongitudeDegrees },        // West
        { lat: latitude + kmInLatitudeDegrees, lon: longitude + kmInLongitudeDegrees },  // NE
        { lat: latitude + kmInLatitudeDegrees, lon: longitude - kmInLongitudeDegrees },  // NW
        { lat: latitude - kmInLatitudeDegrees, lon: longitude + kmInLongitudeDegrees },  // SE
        { lat: latitude - kmInLatitudeDegrees, lon: longitude - kmInLongitudeDegrees }   // SW
    ];
}

// Add a precipitation layer for a 1 km radius around a central point
async function addPrecipitationLayerForArea(latitude, longitude) {

    const points = getNearbyPoints(latitude, longitude);
    let totalPrecipitation = 0;
    let validPoints = 0;

    // Clear any previous precipitation markers
    window.precipitationLayers.forEach(layer => map.removeLayer(layer));
    window.precipitationLayers = [];

    for (const point of points) {
        const precipitation = await fetchCurrentPrecipitation(point.lat, point.lon);
        totalPrecipitation += precipitation;
        validPoints += 1;

        const color = precipitation > 0 ? "blue" : "gray";
        const radius = precipitation > 0 ? Math.min(20, precipitation * 2) : 5;

        const layer = L.circleMarker([point.lat, point.lon], {
            radius: radius,
            color: color,
            fillOpacity: 0.5,
            fillColor: color
        })
        .bindTooltip(`${precipitation.toFixed(2)} mm`, { permanent: false }) // Tooltip only on hover/click
        .addTo(map);

        window.precipitationLayers.push(layer);
    }

    const averagePrecipitation = totalPrecipitation / validPoints;
    const averageColor = averagePrecipitation > 0 ? "darkblue" : "gray";
    const averageRadius = averagePrecipitation > 0 ? Math.min(20, averagePrecipitation * 2) : 5;

    const averageLayer = L.circleMarker([latitude, longitude], {
        radius: averageRadius,
        color: averageColor,
        fillOpacity: 0.7,
        fillColor: averageColor
    })
    .bindTooltip(`Average Precipitation: ${averagePrecipitation.toFixed(2)} mm`, { permanent: false })
    .addTo(map);

    window.precipitationLayers.push(averageLayer);
}


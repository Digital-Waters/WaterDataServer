
let polyline; // Variable to store the gradient line
let offset = 0; // Initial offset
let jsonData = []; // Array to hold all fetched data
let markerLayer;
var map = L.map('map').setView([43.6909, -79.3905], 13);
let device1ID, device2ID; // Track fixed IDs for device1 and device2
let totalRecords = []; // Flattened list of all records across devices
let showDetails = true; // Track the initial state of tooltips

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

function fetchData(offset) {
    const url = `https://water-watch-58265eebffd9.herokuapp.com/getwaterdata/?deviceIDs=0000000077de649d&deviceIDs=000000002133dded&only_underwater=25&sort_by=deviceDatetime&offset=${offset}`;

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

                // Identify the two device IDs to maintain fixed roles
                const deviceIDs = Object.keys(jsonData);
                if (deviceIDs.length >= 2) {
                    device1ID = deviceIDs[0];
                    device2ID = deviceIDs[1];
                }

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

function updateMap(timeIndex) {
    // Update the global time index for tracking
    currentTimeIndex = timeIndex;

    // Ensure timeIndex is within bounds for totalRecords
    if (timeIndex < 0 || timeIndex >= totalRecords.length) {
        console.error("Invalid time index.");
        return;
    }

    // Get the most recent record for device1ID
    const data1 = findClosestRecord(totalRecords[timeIndex].device_datetime, jsonData[device1ID]);
    // Get the most recent record for device2ID
    const data2 = findClosestRecord(totalRecords[timeIndex].device_datetime, jsonData[device2ID]);

    // Parse colors for markers
    const waterColor1 = parseWaterColor(data1.waterColor);
    const waterColor2 = parseWaterColor(data2.waterColor);

    // Clear previous markers and tooltips
    markerLayer.clearLayers();

    // Create a marker and tooltip for device1
    const marker1 = L.circleMarker([data1.latitude, data1.longitude], {
        radius: 8,
        fillColor: `rgba(${waterColor1.r}, ${waterColor1.g}, ${waterColor1.b}, ${waterColor1.a / 100})`,
        color: "#000",
        weight: 1,
        fillOpacity: 0.8
    }).addTo(markerLayer);

    // Add tooltip if showDetails is true
    if (showDetails) {
        marker1.bindTooltip(`
            <b>Device ID:</b> ${data1.deviceID}<br>
            <b>Latitude:</b> ${data1.latitude}<br>
            <b>Longitude:</b> ${data1.longitude}<br>
            <b>Date:</b> ${data1.device_datetime}<br>
            <b>Temperature:</b> ${data1.temperature}<br>
            <b>Water Color:</b> rgba(${waterColor1.r}, ${waterColor1.g}, ${waterColor1.b}, ${waterColor1.a})
        `, {
            permanent: true,
            direction: "right",
            offset: [10, 0]
        });
    }

    // Open imageURI in new tab on marker1 click
    marker1.on('click', () => {
        window.open(data1.imageURI, '_blank');
    });

    // Create a marker and tooltip for device2
    const marker2 = L.circleMarker([data2.latitude, data2.longitude], {
        radius: 8,
        fillColor: `rgba(${waterColor2.r}, ${waterColor2.g}, ${waterColor2.b}, ${waterColor2.a / 100})`,
        color: "#000",
        weight: 1,
        fillOpacity: 0.8
    }).addTo(markerLayer);

    // Add tooltip if showDetails is true
    if (showDetails) {
        marker2.bindTooltip(`
            <b>Device ID:</b> ${data2.deviceID}<br>
            <b>Latitude:</b> ${data2.latitude}<br>
            <b>Longitude:</b> ${data2.longitude}<br>
            <b>Date:</b> ${data2.device_datetime}<br>
            <b>Temperature:</b> ${data2.temperature}<br>
            <b>Water Color:</b> rgba(${waterColor2.r}, ${waterColor2.g}, ${waterColor2.b}, ${waterColor2.a})
        `, {
            permanent: true,
            direction: "right",
            offset: [10, 0]
        });
    }

    // Open imageURI in new tab on marker2 click
    marker2.on('click', () => {
        window.open(data2.imageURI, '_blank');
    });

    // Draw a gradient line between the two device points
    updateLine([data1.latitude, data1.longitude], waterColor1, [data2.latitude, data2.longitude], waterColor2);
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

    // Initialize and update slider based on total records for all devices
    $("#slider").slider({
        min: 0,
        max: Object.values(jsonData).flat().length - 1,
        step: 1,
        slide: function (event, ui) {
            updateMap(ui.value); // Update map with new data record index
        }
    });
});


// Function to create a gradient line between points
function updateLine(point1, color1, point2, color2) {
    const midpointColor = interpolateColor(color1, color2);
    const lineStyle = {
        color: midpointColor,
        weight: 4,
        opacity: 0.8
    };

    // If polyline exists, remove it from markerLayer
    if (polyline) {
        markerLayer.removeLayer(polyline);
    }

    // Add new polyline to markerLayer (which is already attached to map)
    polyline = L.polyline([point1, point2], lineStyle).addTo(markerLayer);
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

    return closestRecord;
}

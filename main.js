let targetRotationX = 0.05;
let targetRotationY = 0.02;
let mouseX = 0, mouseXOnMouseDown = 0, mouseY = 0, mouseYOnMouseDown = 0;
const slowingFactor = 0.98;
const dragFactor = 0.0002;
const fileDrop = document.getElementById('fileDrop');
const fileInput = document.getElementById('fileInput');


function getEarthRotationAngleForLongitude(lonRad) {
    const now = new Date();
    const gmst = satellite.gstime(now); // radians at Greenwich
    return gmst + lonRad; // offset by observer longitude
}


fileDrop.addEventListener('click', () => {
    fileInput.click();
});

// Handle selected file
fileInput.addEventListener('change', (event) => {
    handleFiles(event.target.files);
});

// Handle drag & drop
fileDrop.addEventListener('dragover', (event) => {
    event.preventDefault();
    fileDrop.style.borderColor = '#00FF00';
});

fileDrop.addEventListener('dragleave', () => {
    fileDrop.style.borderColor = '#007BFF';
});

fileDrop.addEventListener('drop', (event) => {
    event.preventDefault();
    fileDrop.style.borderColor = '#007BFF';
    const files = event.dataTransfer.files;
    handleFiles(files);
});
const searchInput = document.getElementById("satelliteSearch");

// Prevent canvas from stealing clicks/keys when typing
searchInput.addEventListener("mousedown", (e) => {
  e.stopPropagation();
});
searchInput.addEventListener("keydown", (e) => {
  e.stopPropagation();
});
const clockDisplay = document.getElementById("clockDisplay");
const timezoneDropdown = document.getElementById("timezoneDropdown");
const timezoneDropdownBtn = document.getElementById("timezoneDropdownBtn");

const timezones = [
  "UTC","Asia/Kolkata","America/New_York","America/Los_Angeles",
  "Europe/London","Europe/Paris","Asia/Tokyo","Australia/Sydney",
  "Europe/Berlin","Asia/Dubai"
];

// Populate dropdown
timezones.forEach(tz => {
  const option = document.createElement("div");
  option.textContent = tz;
  option.style.cursor = "pointer";
  option.addEventListener("click", () => {
    timezoneDropdownBtn.textContent = tz + " ▼";
    updateClock(tz);
    timezoneDropdown.style.display = "none";
  });
  timezoneDropdown.appendChild(option);
});

// Toggle dropdown
timezoneDropdownBtn.addEventListener("click", () => {
  timezoneDropdown.style.display = timezoneDropdown.style.display === "block" ? "none" : "block";
});

// Day/night function
function isDay(time) {
  const hour = time.getHours();
  return hour >= 6 && hour < 18;
}

// Update single clock
function updateClock(tz) {
  const now = new Date(new Date().toLocaleString("en-US", {timeZone: tz}));
  const dayStatus = isDay(now) ? "Day" : "Night";
  const bgColor = isDay(now) ? "#fdf6e3" : "#2c3e50";
  const textColor = isDay(now) ? "#000" : "#fff";

  clockDisplay.innerHTML = "";
  const tzDiv = document.createElement("div");
  tzDiv.style.background = bgColor;
  tzDiv.style.color = textColor;
  tzDiv.style.padding = "8px";
  tzDiv.style.borderRadius = "6px";
  tzDiv.style.fontFamily = "sans-serif";
  tzDiv.innerHTML = `<strong>${tz}</strong>: ${now.toLocaleTimeString()} - ${dayStatus}`;
  clockDisplay.appendChild(tzDiv);
}

// Initial clock
updateClock(timezones[0]);
setInterval(() => updateClock(timezoneDropdownBtn.textContent.replace(" ▼", "")), 1000);

document.getElementById("satelliteSearch").addEventListener("input", function(e) {
  const query = e.target.value.toLowerCase();

  satEntries.forEach(sat => {
    if (sat.name.toLowerCase().includes(query) || String(sat.id).includes(query)) {
      sat.mesh.visible = true;  // show matching
    } else {
      sat.mesh.visible = false; // hide others
    }
  });
});

function getEarthRotationAngle() {
  const now = new Date();
  const gmst = satellite.gstime(now); // GMST in radians
  return gmst; // rotation around Y-axis
}

function findPasses(satrec, observerLat, observerLon, observerHeight = 0.1) {
  const passes = [];
  const now = new Date();
  const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // next 24h
  const step = 10 * 1000; // 10s

  let isAbove = false;
  let passStart = null;
  let maxElevation = -90;
  let maxTime = null;

  for (let t = now.getTime(); t < endTime.getTime(); t += step) {
    const date = new Date(t);
    const posVel = satellite.propagate(satrec, date);
    if (!posVel.position) continue;

    const gmst = satellite.gstime(date);
    const ecf = satellite.eciToEcf(posVel.position, gmst);
    const look = satellite.ecfToLookAngles(
      { latitude: observerLat, longitude: observerLon, height: observerHeight },
      ecf
    );

    const elevDeg = look.elevation * (180 / Math.PI);

    if (elevDeg > 0) {
      if (!isAbove) {
        passStart = date;
        maxElevation = elevDeg;
        maxTime = date;
        isAbove = true;
      }
      if (elevDeg > maxElevation) {
        maxElevation = elevDeg;
        maxTime = date;
      }
    } else {
      if (isAbove) {
        const passEnd = date;
        if (maxElevation > 20) {  // filter low passes
          const durationMs = passEnd - passStart;
          const totalSeconds = Math.floor(durationMs / 1000);
          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          passes.push({
            start: passStart.toLocaleTimeString(),
            peak: maxTime.toLocaleTimeString(),
            end: passEnd.toLocaleTimeString(),
            maxElevation: maxElevation.toFixed(1) + "°",
            duration: `${hours} hr ${minutes} min`
          });
        }
        isAbove = false;
      }
    }
  }
  return passes;
}

const groundStations = [
  { id: "shar", name: "Sriharikota", lat: 13.733, lon: 80.235, alt: 0.05 },
  { id: "blr", name: "Bangalore ISTRAC", lat: 12.9716, lon: 77.5946, alt: 0.9 },
  { id: "luck", name: "Lucknow GS", lat: 26.8467, lon: 80.9462, alt: 0.12 },
  { id: "port", name: "Port Blair GS", lat: 11.6234, lon: 92.7265, alt: 0.03 }
];





// Default location (Bangalore)
let observerLat = 12.9716 * (Math.PI / 180);
let observerLon = 77.5946 * (Math.PI / 180);

console.log("Lat: " , observerLat)
console.log("Long: " , observerLon)

function detectUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        observerLat = latitude * (Math.PI / 180);
        observerLon = longitude * (Math.PI / 180);
        console.log("User location detected:", latitude, longitude);
        // Optional: refresh passes for selected satellite
        updateSelectedSatellitePasses();
      },
      (error) => {
        console.warn("Geolocation failed, using default location:", error);
      }
    );
  } else {
    console.warn("Geolocation not supported, using default location.");
  }
}

// Call this once at startup
detectUserLocation();


// Function to handle file reading
function handleFiles(files) {
    if (files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const content = e.target.result;
        console.log('File content:', content);

        let userSatellites = [];

        if (file.type === 'application/json' || file.name.endsWith('.json')) {
            try {
                userSatellites = JSON.parse(content);
            } catch (err) {
                alert('Invalid JSON file');
                return;
            }
        } else if (file.name.endsWith('.txt')) {
            // Expecting text format: Name \n TLE1 \n TLE2 \n ...
            const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
            for (let i = 0; i < lines.length; i += 3) {
                if (lines[i+1] && lines[i+2]) {
                    userSatellites.push({
                        name: lines[i],
                        tle1: lines[i+1],
                        tle2: lines[i+2]
                    });
                }
            }
        } else {
            alert('Please upload a JSON or TXT file.');
            return;
        }

        // Remove old satellites
        for (const sat of satEntries) {
            earthGroup.remove(sat.mesh);
        }
        satEntries = [];
        console.log("Sat Entries : " , satEntries)

        // Initialize satellites with uploaded data
        initSatellites(userSatellites);
    };

    reader.readAsText(file);
}

// === Raycaster for Earth detection ===
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isHoveringEarth = false;

// === For satellite hover/click ===
const satRaycaster = new THREE.Raycaster();
const satMouse = new THREE.Vector2();
let satEntries = [];
let satInfoDiv; // UI element for info

function updateSelectedSatellitePasses() {
  if (!satInfoDiv || !satEntries) return;

  const visibleSat = satEntries.find(s => s.orbit && s.orbit.visible);
  if (!visibleSat) return;

  const passes = findPasses(visibleSat.satrec, observerLat, observerLon);
  let passHtml = "<h4>Next Passes (24h)</h4>";
  if (passes.length === 0) {
    passHtml += "<p>No good passes in next 24h.</p>";
  } else {
    passHtml += "<ul>";
    for (const p of passes.slice(0, 3)) {
      passHtml += `<li>
        Start: ${p.start}<br>
        Peak: ${p.peak} (max ${p.maxElevation})<br>
        End: ${p.end}<br>
        Duration: ${p.duration}
      </li>`;
    }
    passHtml += "</ul>";
  }

  satInfoDiv.innerHTML = `
    <h3>${visibleSat.name}</h3>
    <p><b>TLE1:</b> ${visibleSat.tle1}</p>
    <p><b>TLE2:</b> ${visibleSat.tle2}</p>
    ${passHtml}
  `;
}
let camera, renderer, earthMesh, cloudMesh, starMesh, earthGroup;


// === Mouse handlers ===
function onDocumentMouseDown(event) {
  event.preventDefault();
  document.addEventListener('mousemove', onDocumentMouseMove, false);
  document.addEventListener('mouseup', onDocumentMouseUp, false);

  const rect = renderer.domElement.getBoundingClientRect();
  mouseXOnMouseDown = event.clientX - (rect.left + rect.width / 2);
  mouseYOnMouseDown = event.clientY - (rect.top + rect.height / 2);
}
function generateOrbitLine(satrec, color=0xff0000, steps=180, intervalSec=60) {
  const points = [];
  const now = new Date();
  for (let i = 0; i < steps; i++) {
    const time = new Date(now.getTime() + i*intervalSec*1000);
    const pv = satellite.propagate(satrec, time);
    if (!pv.position) continue;
    const gmst = satellite.gstime(time);
    const gd = satellite.eciToGeodetic(pv.position, gmst);
    const lat = satellite.degreesLat(gd.latitude);
    const lon = satellite.degreesLong(gd.longitude);
    const altKm = gd.height;
    const pos = latLonAltToXYZ(lat, lon, altKm, 0.5); // keep same as mesh
    points.push(new THREE.Vector3(pos.x, pos.y, pos.z));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color, linewidth: 1 });
  return new THREE.Line(geometry, material);
}

function onDocumentMouseMove(event) {
  const rect = renderer.domElement.getBoundingClientRect();

  // Raycast against Earth to know if we're hovering it
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(earthMesh);
  isHoveringEarth = intersects.length > 0;

  // Drag rotations
  const localX = event.clientX - (rect.left + rect.width / 2);
  const localY = event.clientY - (rect.top + rect.height / 2);
  targetRotationX = (localX - mouseXOnMouseDown) * dragFactor;
  targetRotationY = (localY - mouseYOnMouseDown) * dragFactor;

  // Satellite hover (pointer cursor)
  satMouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  satMouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  satRaycaster.setFromCamera(satMouse, camera);
  const intersectsSat = satRaycaster.intersectObjects(satEntries.map(s => s.mesh), true);
  document.body.style.cursor = intersectsSat.length > 0 ? 'pointer' : 'default';
}

function onDocumentMouseUp() {
  document.removeEventListener('mousemove', onDocumentMouseMove, false);
  document.removeEventListener('mouseup', onDocumentMouseUp, false);
}

// === Satellite click info ===
let currentVisibleOrbit = null;

function onDocumentClick(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  satMouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  satMouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  satRaycaster.setFromCamera(satMouse, camera);

  const intersectsSat = satRaycaster.intersectObjects(satEntries.map(s => s.mesh), true);

  if (intersectsSat.length > 0) {
    // Clicked a satellite
    const mesh = intersectsSat[0].object;
    const sat = satEntries.find(s => s.mesh === mesh || s.mesh === mesh.parent);

    if (sat) {
      // Hide all other orbits first
      satEntries.forEach(s => { if (s.orbit) s.orbit.visible = false; });

      // Show only this satellite’s orbit
      if (sat.orbit) sat.orbit.visible = true;

      // Update info panel
      const passes = findPasses(sat.satrec, observerLat, observerLon);
      let passHtml = "<h4>Next Passes (24h)</h4>";
      if (passes.length === 0) passHtml += "<p>No good passes in next 24h.</p>";
      else {
        passHtml += "<ul>";
        for (const p of passes.slice(0, 3)) {
          passHtml += `<li>
            Start: ${p.start}<br>
            Peak: ${p.peak} (max ${p.maxElevation})<br>
            End: ${p.end}<br>
            Duration: ${p.duration}
          </li>`;
        }
        passHtml += "</ul>";
      }

      satInfoDiv.style.display = 'block';
      satInfoDiv.innerHTML = `
        <h3>${sat.name}</h3>
        <p><b>TLE1:</b> ${sat.tle1}</p>
        <p><b>TLE2:</b> ${sat.tle2}</p>
        ${passHtml}
      `;
    }

  } else {
    // Clicked empty space — hide all orbits and info
    satEntries.forEach(s => { if (s.orbit) s.orbit.visible = false; });
    satInfoDiv.style.display = 'none';
  }
}
// === Helper: lat/lon to 3D XYZ ===
function latLonAltToXYZ(lat, lon, altKm, earthRadius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  // exaggerate altitude × 4 for visibility
  const radius = earthRadius + (altKm / 6371) * earthRadius * 4;

  return {
    x: radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta)
  };
}

// === NASA GIBS live cloud texture loader ===
function gibsUrlForToday() {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const layer = "MODIS_Terra_CorrectedReflectance_TrueColor";
  // EPSG:4326, TileMatrix=250m, a single global tile at z=0/y=0/x=0
  return `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/${layer}/default/${today}/250m/0/0/0.jpg`;
}

function loadLiveCloudsTexture(onReady) {
  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin('anonymous');
  const url = gibsUrlForToday();

  loader.load(
    url,
    (tex) => {
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      onReady(tex);
    },
    undefined,
    (err) => {
      console.warn("GIBS texture load failed, falling back to local static clouds.", err);
      // Fallback to your local static cloud image if online fetch fails
      loader.load('texture/earthCloud.png', (fallback) => onReady(fallback));
    }
  );
}

function scheduleCloudRefresh() {
  // Refresh hourly
  setInterval(() => {
    loadLiveCloudsTexture((tex) => {
      cloudMesh.material.map = tex;
      cloudMesh.material.needsUpdate = true;
    });
  }, 60 * 60 * 1000);
}
const satelliteList = [
  {
    name: "ISS",
    tle1: "1 25544U 98067A   24226.49545436  .00016717  00000-0  10270-3 0  9000",
    tle2: "2 25544  51.6422 104.2412 0007218  73.9786  42.3170 15.50011925  4750"
  },
  {
    name: "Hubble",
    tle1: "1 20580U 90037B   24226.49497267  .00000334  00000-0  12457-4 0  9993",
    tle2: "2 20580  28.4694 198.3550 0002895  66.9778  40.9311 15.09210786420194"
  },
  {
    name: "NOAA 19",
    tle1: "1 33591U 09005A   24226.42858572  .00000092  00000-0  70517-4 0  9991",
    tle2: "2 33591  99.1875  63.8027 0014530  73.4021 286.8728 14.12415548656497"
  },
  {
    name: "GOES-16",
    tle1: "1 41866U 16071A   25229.58657728 -.00000099  00000-0  00000+0 0  9995",
    tle2: "2 41866   0.0540  99.3944 0001849  98.2441 235.0021  1.00271889 32053"
  },
  {
    name: "KUWAITSAT-1",
    tle1: "1 55103U 23001CY  25209.62786700  .00009749  00000-0  28577-3 0  9995",
    tle2: "2 55103  97.3715 273.0504 0011905 160.1598 200.0111 15.35335126142720"
  },
  {
    name: "HAWK-4C",
    tle1: "1 52170U 22033P   25197.78840598  .00146038  97094-5  51446-3 0  9997",
    tle2: "2 52170  97.2891 296.7778 0004562 235.2912 124.7931 15.89147626184740"
  },
  {
    name: "Starlette",
    tle1: "1 07646U 75070A   24226.42897222  .00000123  00000-0  23456-4 0  9992",
    tle2: "2 07646  49.8400 123.4567 0200000 200.1234 159.8765 12.44444444444444"
  },
  {
    name: "Stella",
    tle1: "1 22824U 93061A   24226.42888889  .00000111  00000-0  21000-4 0  9993",
    tle2: "2 22824  98.6833 321.0000 0005000  45.0000 315.0000 14.25000000000000"
  },
  {
    name: "GOES-17",
    tle1: "1 43226U 18022A   24226.50000000  .00000000  00000-0  00000+0 0  9996",
    tle2: "2 43226   0.0000  95.0000 0001000 180.0000 180.0000  1.00270000 25000"
  },
  {
    name: "GOES-19",
    tle1: "1 57510U 24100A   24226.60000000  .00000000  00000-0  00000+0 0  9992",
    tle2: "2 57510   0.0000  90.0000 0001000   0.0000 180.0000  1.00270000  1000"
  },
  {
    name: "GOES-13",
    tle1: "1 29155U 06018A   24226.70000000  .00000000  00000-0  00000+0 0  9991",
    tle2: "2 29155   0.0000  80.0000 0001000 270.0000  90.0000  1.00270000 20000"
  },
  {
    name: "Hawk-10",
    tle1: "1 58000U 24150C   24226.80000000  .00001234  00000-0  12345-4 0  9994",
    tle2: "2 58000  97.5000 300.0000 0008000 120.0000 240.0000 15.20000000000000"
  }
];


function initSatellites(list = satelliteList) {
    const satMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, depthTest: true });

    // Remove old satellites if any
    if (satEntries.length > 0 && earthGroup) {
    for (const sat of satEntries) {
        if (sat.mesh) earthGroup.remove(sat.mesh);
        if (sat.orbit) earthGroup.remove(sat.orbit); // <-- remove old orbit too
    }
    satEntries = [];
}

    for (const sat of list) {
        try {
            const satrec = satellite.twoline2satrec(sat.line1 || sat.tle1, sat.line2 || sat.tle2);
            const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.0049, 10, 10), satMaterial.clone());
            mesh.renderOrder = 10;
            const orbit = generateOrbitLine(satrec);
            orbit.visible = false;
            satEntries.push({
            name: sat.name,
            satrec,
            mesh,
            orbit,
            tle1: sat.line1 || sat.tle1,
            tle2: sat.line2 || sat.tle2
        });
            earthGroup.add(mesh);
            earthGroup.add(orbit);
        } catch (e) {
            console.warn(`Skipping satellite ${sat.name}:`, e);
        }
    }
    console.log(`Loaded satellites: ${satEntries.length}`);
}
function latLonToVector3(lat, lon, radius = 1.01) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = (radius * Math.sin(phi) * Math.sin(theta));
  const y = (radius * Math.cos(phi));

  return new THREE.Vector3(x, y, z);
}
function latLonToVector31(lat, lon, radius = 0.5) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}
let groundStationMarker = null;

function addGroundStation(latDeg, lonDeg) {
  if (groundStationMarker) earthGroup.remove(groundStationMarker);

  const pos = latLonToVector3(latDeg, lonDeg, 1.01);
  const geometry = new THREE.SphereGeometry(0.01, 16, 16);
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  groundStationMarker = new THREE.Mesh(geometry, material);

  groundStationMarker.position.copy(pos);
  earthGroup.add(groundStationMarker);
}
function isSatelliteVisibleFromGround(satPos, groundLat, groundLon) {
  // Convert ground station to unit vector
  const groundVec = latLonToVector3(groundLat * 180/Math.PI, groundLon * 180/Math.PI, 1.0);

  const satDir = satPos.clone().normalize();
  const groundDir = groundVec.clone().normalize();

  // Satellite is visible if above horizon
  return satDir.dot(groundDir) > 0;
}
// Function to draw coverage circle
function drawCoverage(lat, lon, radiusKm) {
  const earthRadiusKm = 6371; // Earth radius in km
  const angularRadius = radiusKm / earthRadiusKm; // radians

  const coverageGeometry = new THREE.CircleGeometry(angularRadius, 64);
  coverageGeometry.vertices.shift(); // remove center vertex

  const coverageMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
  const coverageCircle = new THREE.LineLoop(coverageGeometry, coverageMaterial);

  // Rotate and move to correct position
  coverageCircle.rotation.x = Math.PI / 2; // align flat
  const position = latLonToVector3(lat, lon);
  coverageCircle.position.copy(position);
  coverageCircle.lookAt(new THREE.Vector3(0, 0, 0));

  scene.add(coverageCircle);

  return coverageCircle;
}
function focusOnSatellite(satellite) {
  if (!satellite || !satellite.position) return;

  const offsetDistance = 2.0; // how far the camera should stay from the satellite
  const satPosition = satellite.position.clone();

  // Direction from origin to satellite
  const direction = satPosition.clone().normalize();

  // Place camera a bit further in the same direction
  const cameraTarget = satPosition.clone().add(direction.multiplyScalar(offsetDistance));

  // Animate smoothly
  gsap.to(camera.position, {
    duration: 2,
    x: cameraTarget.x,
    y: cameraTarget.y,
    z: cameraTarget.z,
    ease: "power2.inOut",
    onUpdate: () => {
      camera.lookAt(satPosition); // always look at the satellite
    }

  });
}


const groundStationGroup = new THREE.Group();
function main() {
  const scene = new THREE.Scene();
  renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#globe'), antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  scene.add(groundStationGroup);
  // === Earth group ===
  earthGroup = new THREE.Group();
  scene.add(earthGroup);

  // === Earth ===
  const earthGeometry = new THREE.SphereGeometry(0.5, 96, 96);
const earthMaterial = new THREE.MeshPhongMaterial({
    map: new THREE.TextureLoader().load('texture/earthmap.jpeg'),
    bumpMap: new THREE.TextureLoader().load('texture/earthbump.jpeg'),
    bumpScale: 0.01,
    side: THREE.FrontSide
});
  earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
  earthGroup.add(earthMesh);

  // === Clouds (live from NASA GIBS) ===
  const cloudGeometry = new THREE.SphereGeometry(0.52, 96, 96);
  const cloudMaterial = new THREE.MeshPhongMaterial({
    transparent: true,
    opacity: 0.25,   // overlay true-color imagery (clouds will be visible)
    depthWrite: false,
    side: THREE.FrontSide
  });
  cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
  earthGroup.add(cloudMesh);

  // initial load + schedule refresh
  loadLiveCloudsTexture((tex) => {
    cloudMesh.material.map = tex;
    cloudMesh.material.needsUpdate = true;
  });
  scheduleCloudRefresh();

  // === Stars / Galaxy background ===
  const starGeometry = new THREE.SphereGeometry(5, 64, 64);
  const starMaterial = new THREE.MeshBasicMaterial({
    map: new THREE.TextureLoader().load('texture/galaxy.png'),
    side: THREE.BackSide
  });
  starMesh = new THREE.Mesh(starGeometry, starMaterial);
  scene.add(starMesh);

  // === Lighting ===
  scene.add(new THREE.AmbientLight(0xffffff, 0.15));
  const sunLight = new THREE.PointLight(0xffffff, 1.2, 100);
  sunLight.position.set(5, 0, 5);
  scene.add(sunLight);
  const sunMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0xffdd88 })
  );
  sunMesh.position.copy(sunLight.position);
  scene.add(sunMesh);

  // === Camera ===
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 1.7;
  const initialCameraPos = camera.position.clone(); // store starting camera pos
const initialLookAt = new THREE.Vector3(0, 0, 0); // assuming you looked at Earth center

  function renderGroundStations(stations) {
  stations.forEach(gs => {
    const pos = latLonToVector31(gs.lat, gs.lon, 0.52); // slightly above Earth (Earth = 0.5)

    // Create cone (antenna marker)
    const geometry = new THREE.ConeGeometry(0.05, 0.15, 16);
    const material = new THREE.MeshPhongMaterial({ color: 0xff0000 }); // red
    const cone = new THREE.Mesh(geometry, material);

    // Position cone
    cone.position.copy(pos);

    // Make cone point outward from Earth's center
    cone.lookAt(new THREE.Vector3(0, 0, 0));

    // Store metadata for interactivity
    cone.userData = gs;

    groundStationGroup.add(cone);
  });
}
renderGroundStations(groundStations)

function moveCameraSmooth(targetPos, lookAt, duration = 1000) {
  const start = performance.now();
  const startPos = camera.position.clone();

  function animate(time) {
    const t = Math.min((time - start) / duration, 1);
    camera.position.lerpVectors(startPos, targetPos, t);
    camera.lookAt(lookAt);

    if (t < 1) requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

function resetCamera() {
  moveCameraSmooth(initialCameraPos, initialLookAt, 1000);
}

function getSelectedFilters() {
  const type = Array.from(document.querySelectorAll('.filter-type:checked')).map(cb => cb.value);
  const orbit = Array.from(document.querySelectorAll('.filter-orbit:checked')).map(cb => cb.value);
  const operator = Array.from(document.querySelectorAll('.filter-operator:checked')).map(cb => cb.value);
  const status = Array.from(document.querySelectorAll('.filter-status:checked')).map(cb => cb.value);

  return {type , orbit , operator , status}
}

function getSearchQuery() {
  return searchInput.value.toLowerCase().trim();
}

function updateSatelliteVisibility(){
  const filters = getSelectedFilters();
  const query = getSearchQuery();

  satEntries.forEach(sat => {
    let visible = true;

    if (filters.type.length && !filters.type.includes(sat.type)) visible = false;
    if (filters.orbit.length && !filters.orbit.includes(sat.orbit)) visible = false;
    if (filters.status.length && !filters.status.includes(sat.status)) visible = false;
    if (filters.operator.length && !filters.operator.includes(sat.operator)) visible = false;
    
    if (query && !sat.name.toLowerCase().includes(query)) visible = false;

    sat.mesh.visible = visible;
  })
}

const allFilters = document.querySelectorAll('.filter-type, .filter-orbit, .filter-operator , .filter-status');
allFilters.forEach(filter => filter.addEventListener('change', updateSatelliteVisibility));
searchInput.addEventListener('input', updateSatelliteVisibility);

function searchSatellite(query) {
  // Reset all to default color
  satEntries.forEach(sat => {
    sat.mesh.material.color.set(0xffff00); // yellow again
  });

  if (!query) {
    resetCamera();
    return;
  }
  satEntries.forEach(sat => {
  const pos = sat.mesh.position;
  const visible = isSatelliteVisibleFromGround(pos, observerLat, observerLon);

  if (visible) {
    sat.mesh.material.color.set(0x00ff00); // green when visible
  } else {
    sat.mesh.material.color.set(0xffff00); // yellow when below horizon
  }
});

  const found = satEntries.find(sat =>
    sat.name.toLowerCase().includes(query.toLowerCase())
  );

  if (found) {
    // Highlight in red
    found.mesh.material.color.set(0xff0000);

    // Move camera smoothly closer to satellite
    const satPos = found.mesh.position.clone();

// Direction from Earth center to satellite
const direction = satPos.clone().normalize();

// Place camera further along that direction
const targetPos = satPos.clone().add(direction.multiplyScalar(0.6)); // "3" is distance behind satellite

moveCameraSmooth(targetPos, satPos, 1500);

    console.log("Found:", found.name);
  } else {
    alert("No satellite found with that name!");
  }
}

document.getElementById("searchBtn").addEventListener("click", () => {
  const query = document.getElementById("satelliteSearch").value.trim();
  searchSatellite(query);
});

document.getElementById("satelliteSearch").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    searchSatellite(e.target.value.trim());
  }
});


  // === Zoom ===
  const minDistance = 1.2, maxDistance = 10, zoomSpeed = 0.5;
  function onMouseWheel(event) {
    event.preventDefault();
    let delta = event.deltaY * 0.001 * zoomSpeed;
    let forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    camera.position.addScaledVector(forward, delta);
    let distance = camera.position.length();
    if (distance < minDistance) camera.position.setLength(minDistance);
    if (distance > maxDistance) camera.position.setLength(maxDistance);
  }
  window.addEventListener('wheel', onMouseWheel, { passive: false });

  // === Resize ===
  window.addEventListener('resize', () => {
    const { innerWidth: w, innerHeight: h } = window;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  // === Satellite list ===
// === Satellite list ===

  // === Build satellite meshes (always visible) ===
  const satMaterial = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    depthTest: true,    // <- key: don't get hidden behind Earth
  });


  // === Satellite Info Panel ===
  satInfoDiv = document.createElement("div");
satInfoDiv.id = "satInfo";
Object.assign(satInfoDiv.style, {
  position: "absolute",
  top: "20px",
  right: "20px",
  padding: "10px",
  background: "rgba(0,0,0,0.8)",
  color: "white",
  fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  borderRadius: "8px",
  display: "block", // Show by default
  maxWidth: "360px",
  fontSize: "12px",
  lineHeight: "1.35"
});
satInfoDiv.innerHTML = "Select a satellite to see info"; // ✅ Default text
document.body.appendChild(satInfoDiv);

  // === Animation loop ===
  let lastTime = Date.now();
  let simEpoch = Date.now();   // simulation clock
  let timeLapseFactor = 1;     // Speed multiplier
let targetEarthRotationY = getEarthRotationAngle(); // real rotation
let userRotationOffsetY = 0; // rotation added by user dragging
  function render() {
    const now = Date.now();
    const deltaTime = (now - lastTime) / 100;
    lastTime = now;

    // Advance simulation clock
    simEpoch += deltaTime * timeLapseFactor * 1000;
    const simTime = new Date(simEpoch);

    // Get real Earth rotation (radians)
    const targetEarthRotationY = getEarthRotationAngleForLongitude(observerLon);

// Smoothly rotate Earth towards correct longitude
const lerpFactor = 0.2; // adjust speed of “snapping back”
earthGroup.rotation.y += (targetEarthRotationY + userRotationOffsetY - earthGroup.rotation.y) * lerpFactor;


    // Apply vertical drag rotation incrementally (X-axis)
    earthGroup.rotation.x += targetRotationY;
    targetRotationY *= slowingFactor;

    // Apply horizontal drag as offset (Y-axis)
    userRotationOffsetY += targetRotationX;
    targetRotationX *= slowingFactor;

    // Update satellites
    const gmst = satellite.gstime(simTime);
    for (const sat of satEntries) {
        const pv = satellite.propagate(sat.satrec, simTime);
        if (!pv.position) continue;
        const gd = satellite.eciToGeodetic(pv.position, gmst);
        const lat = satellite.degreesLat(gd.latitude);
        const lon = satellite.degreesLong(gd.longitude);
        const altKm = gd.height;
        const p = latLonAltToXYZ(lat, lon, altKm, 0.5);
        sat.mesh.position.set(p.x, p.y, p.z);
    }

    renderer.render(scene, camera);
}
  function animate() {
    requestAnimationFrame(animate);
    render();
  }

  // Init + run
  initSatellites();
  animate();

  // Events
  document.addEventListener('mousedown', onDocumentMouseDown, false);
  document.addEventListener('click', onDocumentClick, false);
  document.addEventListener('keydown', e => {
    if (e.key === 't') timeLapseFactor = (timeLapseFactor === 1) ? 100 : 1;
  });
}

window.onload = main;

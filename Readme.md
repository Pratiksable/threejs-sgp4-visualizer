# Three.js Earth and Satellite Tracker

This project is an interactive 3D visualization of the Earth and real-time satellite tracking, built using Three.js. It provides a feature-rich and educational experience for exploring our planet and the objects orbiting it.

## Features

### Core Features

*   **Interactive 3D Earth:** A high-fidelity 3D model of the Earth serves as the centerpiece of the application. Users can freely rotate and zoom the globe to explore different regions.
*   **Real-Time Satellite Tracking:** The application visualizes the positions of numerous satellites in real-time. Satellite data is propagated using the `satellite.js` library, ensuring accurate orbital mechanics.
*   **Detailed Satellite Information:** By clicking on a satellite, users can access detailed information, including its name, TLE (Two-Line Element) data, and predictions for upcoming passes over the user's location.
*   **Orbit Visualization:** When a satellite is selected, its orbital path is drawn around the Earth, providing a clear visual representation of its trajectory.
*   **Live Cloud Imagery:** The Earth model is overlaid with near real-time cloud imagery sourced from the NASA GIBS (Global Imagery Browse Services) API. This data is refreshed periodically to provide an up-to-date view of global weather patterns.

### UI and Interactivity

*   **Satellite Search:** A search bar allows users to quickly find and focus on specific satellites by name or NORAD ID.
*   **Advanced Satellite Filtering:** A comprehensive filtering system enables users to selectively display satellites based on various criteria, including:
    *   **Satellite Type:** (e.g., ISS, Starlink, GPS)
    *   **Orbit Type:** (e.g., LEO, MEO, GEO)
    *   **Operator/Country:** (e.g., USA, Russia, China)
    *   **Status:** (e.g., Active, Inactive, Decayed)
*   **Multi-Timezone Clock:** A customizable clock displays the current time in multiple timezones, along with a day/night indicator.
*   **Custom Satellite Data:** Users can load their own satellite data into the simulation by simply dragging and dropping a JSON or TXT file containing TLE data.
*   **Ground Station Markers:** The application displays markers for key ground stations on the Earth's surface, providing a reference for satellite communication and tracking.
*   **Satellite Pass Prediction:** For any selected satellite, the application predicts and displays a list of upcoming passes for the user's location, including start time, peak elevation, and duration.

## Technical Details

*   **Rendering Engine:** The 3D visualization is powered by the [Three.js](https://threejs.org/) library, a cross-browser JavaScript library and API used to create and display animated 3D computer graphics in a web browser.
*   **Orbital Mechanics:** Satellite positions and orbits are calculated using the [satellite.js](https://github.com/shashwatak/satellite-js) library, a JavaScript implementation of the SGP4/SDP4 orbital propagator.
*   **Cloud Data Source:** Near real-time cloud imagery is fetched from the [NASA GIBS API](https://nasa-gibs.github.io/gibs-api-docs/), providing a dynamic and realistic representation of the Earth's atmosphere.
*   **Geolocation:** The application can use the browser's Geolocation API to determine the user's location and provide more accurate and relevant satellite pass predictions.

## Getting Started

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/threejs-earth.git
    ```
2.  Open the `index.html` file in your web browser.

## File Structure

*   `index.html`: The main HTML file that sets up the scene and UI elements.
*   `main.js`: The core JavaScript file containing the application logic, including Three.js setup, satellite tracking, and UI interactions.
*   `style.css`: The stylesheet for the application, defining the layout and appearance of the UI.
*   `texture/`: A directory containing texture maps for the Earth, stars, and other 3D objects.
*   `satellite.glb`: A 3D model for the satellites.


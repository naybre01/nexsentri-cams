# NexSentri Cams - Installation Guide

This guide covers the complete installation process for the **NexSentri Cams** dashcam dashboard on a **Raspberry Pi 4 Model B** using a **JVCU100 Webcam**.

## 📋 Prerequisites

1.  **Hardware**:
    *   Raspberry Pi 4 Model B (4GB or 8GB RAM recommended).
    *   MicroSD Card (32GB+ recommended) with **Raspberry Pi OS (64-bit)** installed.
    *   JVCU100 Webcam connected to a USB 3.0 (blue) port.
    *   Internet connection.

2.  **Software Services**:
    *   A **Google Gemini API Key** (Free tier available at [aistudio.google.com](https://aistudio.google.com/)).

---

## 🚀 Step 1: Prepare the Raspberry Pi

Open a terminal on your Pi (or SSH in) and run the following commands to update the system and install Docker.

### 1. Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Docker & Docker Compose
The easiest way to install Docker on a Pi:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

Add your user to the Docker group (so you don't need `sudo` for every docker command):
```bash
sudo usermod -aG docker $USER
```
*Logout and log back in (or reboot) for this permission to take effect.*

---

## 📂 Step 2: Project Setup

### 1. Create Project Directory
```bash
mkdir -p ~/nexsentri-cams
cd ~/nexsentri-cams
```

### 2. Create/Upload Files
You need to copy the project files into this directory. Ensure the following files exist in `~/nexsentri-cams`:

*   `package.json`
*   `vite.config.ts`
*   `tsconfig.json`
*   `index.html`
*   `index.tsx`
*   `App.tsx`
*   `types.ts`
*   `metadata.json`
*   `docker-compose.yml`
*   `Dockerfile.txt` (Note the .txt extension)
*   `nginx.conf.txt` (Note the .txt extension)
*   `components/` (Folder containing Sidebar.tsx, CameraFeed.tsx, etc.)
*   `services/` (Folder containing geminiService.ts)

*Tip: You can use an SFTP client like FileZilla or `scp` to transfer files from your computer to the Pi.*

---

## 🔑 Step 3: API Key Configuration

You must provide your Google Gemini API key for the AI features to work.

### Option A: Environment Variable (Temporary)
```bash
export API_KEY="your_actual_key_starting_with_AIza..."
```

### Option B: .env File (Recommended)
Create a `.env` file in the project root:
```bash
nano .env
```
Paste the following inside:
```
API_KEY=your_actual_key_starting_with_AIza...
```
Save and exit (`Ctrl+X`, `Y`, `Enter`).

---

## 🏗️ Step 4: Build and Run

Run the container using Docker Compose. 

```bash
docker-compose up -d --build
```

*   `-d`: Detached mode (runs in background).
*   `--build`: Forces a rebuild of the image (useful if you changed code).

Wait for the build to complete. It may take a few minutes on the Pi.

---

## 🖥️ Step 5: Accessing the Dashboard

### Scenario A: Viewing on the Raspberry Pi (Dashcam Mode)
If you have a screen connected to the Pi (like a dashboard screen):
1.  Open the Chromium Browser on the Pi Desktop.
2.  Go to `http://localhost`.
3.  **Allow Permissions**: Chromium will ask to access the Camera and Microphone. Click **Allow**.

### Scenario B: Viewing from another Computer (Remote View)
**Important:** Web browsers do not allow camera access on insecure (HTTP) sites unless they are `localhost`.
1.  Find your Pi's IP address: `hostname -I`
2.  Open Chrome on your laptop/PC.
3.  Go to `http://<YOUR_PI_IP_ADDRESS>` (e.g., `http://192.168.1.15`).
4.  **Note on Camera Access**: You must whitelist the IP as "secure" for the camera to work.
    *   **Workaround for Chrome**:
        1.  Go to `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
        2.  Enable the flag.
        3.  Add `http://<YOUR_PI_IP_ADDRESS>` to the text box.
        4.  Relaunch Chrome.

*Note: In Remote View, the dashboard will attempt to access YOUR LAPTOP'S webcam, not the Pi's USB webcam. To view the Pi's USB webcam remotely, you would need a streaming backend (like MJPEG-Streamer or Frigate), as this React app runs entirely in the client's browser.*

---

## ⚙️ Integrations

### Node-RED
1.  Install Node-RED on your Pi if not already installed:
    ```bash
    bash <(curl -sL https://raw.githubusercontent.com/node-red/linux-installers/master/deb/update-nodejs-and-nodered)
    ```
2.  Start Node-RED: `node-red-start`.
3.  Create a flow with an `HTTP In` node (method: POST, url: `/event`) connected to a `Debug` node.
4.  In the NexSentri web dashboard, go to **Settings**.
5.  Enable Node-RED Integration.
6.  Set URL to: `http://localhost:1880/event` (if Node-RED is on the same Pi, otherwise use the Pi's IP).

### Setup Camera Feed via Node-RED (Stream Mode)
If you are using Frigate -> MQTT -> Node-RED -> App, setup a Node-RED flow to serve the image:
1.  **MQTT In**: Subscribe to `frigate/<camera_name>/latest` (This receives the latest JPEG).
2.  **HTTP In**: Method `GET`, URL `/stream`.
3.  **Function Node**: Connect HTTP In to a Function node to fetch the last received MQTT image from context, or simply stream direct Frigate URL.
    *   *Alternative*: Simple MJPEG Proxy.
4.  **HTTP Response**: Set header `Content-Type: image/jpeg`.

*Recommended*: Just use the Frigate API directly in the App Settings Stream URL:
`http://<PI_IP>:5000/api/<camera_name>/jpeg`

---

## 🛠️ Troubleshooting

**"Requested device not found"**
*   **Cause**: This usually means Frigate (or another process) is already using `/dev/video0`, so the browser cannot access it.
*   **Fix**: Go to **Settings** in the web app, switch Video Source to **Stream**, and enter your Node-RED or Frigate stream URL (e.g., `http://localhost:1880/stream` or `http://localhost:5000/api/cam/jpeg`).

**AI Chat not working**
*   Check browser console (F12) for errors.
*   Verify your API Key is valid.
*   Check container logs: `docker logs nexsentri_dashboard`.

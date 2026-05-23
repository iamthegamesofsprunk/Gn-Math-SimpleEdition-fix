        // --- 1. SETUP ---
        const zonesURL = "https://cdn.jsdelivr.net/gh/freebuisness/assets@main/zones.json";
        const coverURL = "https://cdn.jsdelivr.net/gh/freebuisness/covers@main";
        const htmlURL = "https://cdn.jsdelivr.net/gh/freebuisness/html@main";
        
        let zones = [];
        const nativeFetch = window.fetch;

        // --- 2. DATA LOADING ---
        async function listZones() {
            try {
                const response = await nativeFetch(zonesURL + "?t=" + Date.now());
                zones = await response.json();
                displayZones(zones);
            } catch (err) {
                document.getElementById('container').innerText = "FAILED TO CONNECT TO DATABASE.";
            }
        }

        function displayZones(data) {
            const container = document.getElementById('container');
            container.innerHTML = "";
            data.forEach(file => {
                const item = document.createElement("div");
                item.className = "zone-item";
                item.onclick = () => openZone(file);

                const img = document.createElement("img");
                img.src = file.cover.replace("{COVER_URL}", coverURL).replace("{HTML_URL}", htmlURL);
                
                const title = document.createElement("div");
                title.className = "game-title";
                title.textContent = file.name;

                item.appendChild(img);
                item.appendChild(title);
                container.appendChild(item);
            });
        }

        // --- 3. GAME PLAYER LOGIC ---
        function openZone(file) {
            const viewer = document.getElementById('zoneViewer');
            const nameDisplay = document.getElementById('zoneName');
            const idTracker = document.getElementById('activeZoneId');
            
            // Clean up previous game session [cite: 137]
            const oldFrame = document.getElementById('zoneFrame');
            if (oldFrame) oldFrame.remove();

            const frame = document.createElement('iframe');
            frame.id = "zoneFrame";
            viewer.appendChild(frame);

            viewer.style.display = "flex";
            nameDisplay.textContent = "LOADING " + file.name + "...";
            idTracker.textContent = file.id; // Track ID for new tab button [cite: 135]

            const gameUrl = file.url.replace("{COVER_URL}", coverURL).replace("{HTML_URL}", htmlURL);

            if (file.url.startsWith("http")) {
                frame.src = file.url;
                nameDisplay.textContent = file.name;
            } else {
                nativeFetch(gameUrl + "?t=" + Date.now())
                    .then(res => res.text())
                    .then(html => {
                        // CRITICAL: Inject BASE tag so game assets load from the CDN 
                        const baseTag = `<base href="${htmlURL}/">`;
                        frame.contentDocument.open();
                        frame.contentDocument.write(baseTag + html);
                        frame.contentDocument.close();
                        nameDisplay.textContent = file.name;
                    })
                    .catch(() => { nameDisplay.textContent = "ERROR LOADING GAME"; });
            }
        }

        // --- 4. NEW TAB & FULLSCREEN [cite: 135-145] ---
        function aboutBlank() {
            const activeId = document.getElementById('activeZoneId').textContent;
            const game = zones.find(z => z.id.toString() === activeId);
            if (!game) return;

            const gameUrl = game.url.replace("{COVER_URL}", coverURL).replace("{HTML_URL}", htmlURL);
            const newWindow = window.open("about:blank", "_blank");

            nativeFetch(gameUrl + "?t=" + Date.now())
                .then(res => res.text())
                .then(html => {
                    if (newWindow) {
                        newWindow.document.open();
                        newWindow.document.write(`<base href="${htmlURL}/">` + html);
                        newWindow.document.close();
                    }
                });
        }

        function fullscreenZone() {
            const frame = document.getElementById('zoneFrame');
            if (!frame) return;
            if (frame.requestFullscreen) frame.requestFullscreen();
            else if (frame.webkitRequestFullscreen) frame.webkitRequestFullscreen();
            else if (frame.msRequestFullscreen) frame.msRequestFullscreen();
        }

        function closeZone() {
            document.getElementById('zoneViewer').style.display = "none";
            const frame = document.getElementById('zoneFrame');
            if (frame) frame.remove();
        }

        function filterZones() {
            const query = document.getElementById('searchBar').value.toLowerCase();
            const filtered = zones.filter(z => z.name.toLowerCase().includes(query));
            displayZones(filtered);
        }

        // --- 5. SCHOOL FILTER BYPASS (AT THE BOTTOM) [cite: 183-187] ---
        const schoolList = ["deledao", "goguardian", "lightspeed", "linewize", "securly", ".edu/"];
        
        window.fetch = function (url, options) {
            try {
                const domain = new URL(url, location.origin).hostname + "/";
                if (schoolList.some(s => domain.includes(s))) {
                    return Promise.reject(new Error("lam"));
                }
            } catch (e) {}
            return nativeFetch.apply(this, arguments);
        };

        // Start App
        listZones();

document.addEventListener('DOMContentLoaded', function() {
    const sosButton = document.getElementById('sosButton');
    const statusMessage = document.getElementById('statusMessage');
    const locationText = document.getElementById('locationText');
    const updateLocationBtn = document.getElementById('updateLocationBtn');
    const soundToggle = document.getElementById('soundToggle');
    const familyContactInput = document.getElementById('familyContactInput');
    const addContactBtn = document.getElementById('addContactBtn');
    const familyContactList = document.getElementById('familyContactList');
    const ipText = document.getElementById('ipText');
    const batteryText = document.getElementById('batteryText');
    const timeText = document.getElementById('timeText');
    const themeToggle = document.getElementById('themeToggle');
    
    let soundEnabled = true;
    let userLocation = null;
    let userIP = null;
    let userBattery = null;
    let familyContacts = JSON.parse(localStorage.getItem('familyContacts')) || [];
    
    // Load saved family contacts
    loadFamilyContacts();
    
    // Get user's location, IP, battery info and time on page load
    getLocation();
    getIP();
    getBatteryInfo();
    updateTime();
    
    // Update time every second
    setInterval(updateTime, 1000);
    
    // Theme toggle (dark mode), persisted
    function setThemeIcon() {
        const dark = document.body.classList.contains('dark');
        themeToggle.querySelector('i').className = dark ? 'fas fa-sun' : 'fas fa-moon';
    }
    if (localStorage.getItem('getsos-theme') === 'dark') {
        document.body.classList.add('dark');
    }
    setThemeIcon();
    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark');
        localStorage.setItem('getsos-theme', document.body.classList.contains('dark') ? 'dark' : 'light');
        setThemeIcon();
    });

    // SOS button click event
    sosButton.addEventListener('click', function() {
        sendSOSAlert();
        if (soundEnabled) {
            playSOSSound();
        }
    });
    
    // Sound toggle click event
    soundToggle.addEventListener('click', function() {
        toggleSound();
    });
    
    // Add contact button click event
    addContactBtn.addEventListener('click', function() {
        addFamilyContact();
    });
    
    // Enter key in contact input
    familyContactInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addFamilyContact();
        }
    });
    
    // Update location button click event
    updateLocationBtn.addEventListener('click', function() {
        getLocation();
        getIP();
        getBatteryInfo();
    });
    
    // Function to load family contacts from localStorage
    function loadFamilyContacts() {
        familyContactList.innerHTML = '';
        
        if (familyContacts.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.className = 'contact-item';
            emptyMessage.innerHTML = `
                <div class="contact-info">
                    <div class="contact-icon">
                        <i class="fas fa-info-circle"></i>
                    </div>
                    <div>
                        <div class="contact-name">No emergency contacts added</div>
                        <div class="contact-number">Add a contact above</div>
                    </div>
                </div>
            `;
            familyContactList.appendChild(emptyMessage);
            return;
        }
        
        familyContacts.forEach((contact, index) => {
            const contactItem = document.createElement('li');
            contactItem.className = 'contact-item';
            contactItem.innerHTML = `
                <div class="contact-info">
                    <div class="contact-icon">
                        <i class="fas fa-user"></i>
                    </div>
                    <div>
                        <div class="contact-name">Emergency Contact ${index + 1}</div>
                        <div class="contact-number">${formatPhoneNumber(contact)}</div>
                    </div>
                </div>
                <div class="btn-row">
                    <button class="icon-btn primary" data-action="call" data-number="${contact}" aria-label="Call contact">
                        <i class="fas fa-phone"></i>
                    </button>
                    <button class="icon-btn danger" data-action="delete" data-index="${index}" aria-label="Remove contact">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            familyContactList.appendChild(contactItem);
        });
        
        // Add event listeners to the dynamically created buttons
        addContactButtonEventListeners();
    }
    
    // Function to add event listeners to family contact buttons only
    // (emergency-service buttons use inline onclick="makeCall(...)" instead)
    function addContactButtonEventListeners() {
        familyContactList.querySelectorAll('.icon-btn').forEach(button => {
            button.addEventListener('click', handleContactButtonClick);
        });
    }
    
    // Function to handle contact button clicks
    function handleContactButtonClick(event) {
        event.preventDefault(); // Prevent default behavior
        event.stopPropagation(); // Stop event from bubbling up
        
        const button = event.currentTarget;
        const action = button.getAttribute('data-action');
        
        if (action === 'call') {
            const number = button.getAttribute('data-number');
            makeCall(number);
        } else if (action === 'delete') {
            const index = parseInt(button.getAttribute('data-index'));
            removeFamilyContact(index);
        }
    }
    
    // Function to add family contact
    function addFamilyContact() {
        const contactNumber = familyContactInput.value.trim();
        
        if (!contactNumber) {
            showStatusMessage('Please enter a contact number', 'error');
            return;
        }
        
        // Clean the phone number (remove non-digit characters)
        const cleanNumber = contactNumber.replace(/\D/g, '');
        
        // Validate phone number (simple validation for Indian numbers)
        if (cleanNumber.length < 10) {
            showStatusMessage('Please enter a valid phone number', 'error');
            return;
        }
        
        // Check if contact already exists
        if (familyContacts.includes(cleanNumber)) {
            showStatusMessage('This contact already exists', 'error');
            return;
        }
        
        // Add to contacts array
        familyContacts.push(cleanNumber);
        
        // Save to localStorage
        localStorage.setItem('familyContacts', JSON.stringify(familyContacts));
        
        // Clear input
        familyContactInput.value = '';
        
        // Reload contacts
        loadFamilyContacts();
        
        showStatusMessage('Emergency contact added successfully', 'success');
    }
    
    // Function to remove family contact
    function removeFamilyContact(index) {
        if (confirm('Are you sure you want to remove this emergency contact?')) {
            familyContacts.splice(index, 1);
            localStorage.setItem('familyContacts', JSON.stringify(familyContacts));
            loadFamilyContacts();
            showStatusMessage('Emergency contact removed', 'success');
        }
    }
    
    // Function to format phone number for display
    function formatPhoneNumber(number) {
        if (number.length === 10) {
            return `+91 ${number.substring(0, 5)} ${number.substring(5)}`;
        } else if (number.length > 10 && number.startsWith('91')) {
            return `+${number.substring(0, 2)} ${number.substring(2, 7)} ${number.substring(7)}`;
        } else if (number.length > 10 && number.startsWith('0')) {
            return `+91 ${number.substring(1, 6)} ${number.substring(6)}`;
        }
        return number;
    }
    
    // Function to get user's location: GPS first, free IP geolocation API as fallback
    function getLocation() {
        locationText.textContent = "Getting your location...";
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showPosition, useIPGeolocation, { timeout: 8000 });
        } else {
            useIPGeolocation();
        }
    }

    // Free IP geolocation (no key, no permission prompt)
    async function useIPGeolocation() {
        locationText.textContent = "Getting approximate location...";
        const apis = [
            { url: 'https://ipwho.is/',
              parse: d => ({ lat: d.latitude, lon: d.longitude, place: [d.city, d.region, d.country].filter(Boolean).join(', '), ip: d.ip }) },
            { url: 'https://ipapi.co/json/',
              parse: d => ({ lat: d.latitude, lon: d.longitude, place: [d.city, d.region, d.country_name].filter(Boolean).join(', '), ip: d.ip }) }
        ];
        for (const api of apis) {
            try {
                const res = await fetch(api.url);
                if (!res.ok) continue;
                const loc = api.parse(await res.json());
                if (loc.lat && loc.lon) {
                    userLocation = { lat: loc.lat, lon: loc.lon, accuracy: null, source: 'IP', place: loc.place };
                    if (loc.ip) { userIP = loc.ip; ipText.textContent = `IP Address: ${userIP}`; }
                    renderLocation();
                    return;
                }
            } catch (e) { /* try next API */ }
        }
        locationText.textContent = "Location unavailable.";
    }

    // Function to show GPS position
    function showPosition(position) {
        userLocation = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            accuracy: position.coords.accuracy,
            source: 'GPS'
        };
        renderLocation();
    }

    function renderLocation() {
        if (!userLocation) return;
        const coords = `Lat: ${userLocation.lat.toFixed(5)}, Lon: ${userLocation.lon.toFixed(5)}`;
        if (userLocation.source === 'GPS') {
            locationText.textContent = `${coords} (GPS, ±${Math.round(userLocation.accuracy)}m)`;
        } else {
            locationText.textContent = `${coords} — approx: ${userLocation.place || 'unknown area'} (IP-based)`;
        }
    }
    
    // Function to get IP address
    async function getIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            userIP = data.ip;
            ipText.textContent = `IP Address: ${userIP}`;
        } catch (error) {
            userIP = "Unable to fetch";
            ipText.textContent = "IP Address: Unable to fetch";
        }
    }
    
    // Function to get battery information
    function getBatteryInfo() {
        if ('getBattery' in navigator) {
            navigator.getBattery().then(function(battery) {
                const level = Math.round(battery.level * 100);
                const charging = battery.charging ? 'Charging' : 'Not charging';
                userBattery = `${level}% (${charging})`;
                batteryText.textContent = `Battery: ${userBattery}`;
            });
        } else {
            // Fallback for browsers that don't support the Battery API
            userBattery = "Status not available";
            batteryText.textContent = "Battery: Status not available";
        }
    }
    
    // Function to update current time
    function updateTime() {
        const now = new Date();
        const timeString = now.toLocaleString('en-IN', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
        });
        timeText.textContent = timeString;
    }
    
    // Function to send SOS alert
    function sendSOSAlert() {
        // Show status message
        statusMessage.textContent = "Preparing emergency alert...";
        statusMessage.classList.remove('success', 'error');
        statusMessage.classList.add('active');
        
        // Check if we have emergency contacts
        if (familyContacts.length === 0) {
            statusMessage.textContent = "No emergency contacts added. Please add contacts first.";
            statusMessage.classList.add('error');
            return;
        }
        
        // Check if we have location data
        if (!userLocation) {
            statusMessage.textContent = "Getting your location for the alert...";
            getLocation();
            
            // Wait a bit for location, then proceed even if we don't get it
            setTimeout(() => {
                prepareAndSendAlert();
            }, 2000);
        } else {
            prepareAndSendAlert();
        }
    }
    
    // Function to prepare and send alert
    function prepareAndSendAlert() {
        // Get current time for the message
        const now = new Date();
        const currentTimeString = now.toLocaleString('en-IN');
        
        // Prepare location information
        let locationInfo = "Location: Unable to determine";
        let mapLink = "";
        
        if (userLocation) {
            const src = userLocation.source === 'GPS'
                ? `GPS (±${Math.round(userLocation.accuracy)}m)`
                : `IP-based approx${userLocation.place ? ' — ' + userLocation.place : ''}`;
            locationInfo = `Latitude: ${userLocation.lat}\nLongitude: ${userLocation.lon}\nSource: ${src}`;
            mapLink = `\n\nMap: https://maps.google.com/?q=${userLocation.lat},${userLocation.lon}`;
        }
        
        // Create message with all available information
        const message = `EMERGENCY SOS ALERT!\n\nI need help! This is an emergency alert.\n\nMy Location:\n${locationInfo}${mapLink}\n\nTime: ${currentTimeString}\nBattery: ${userBattery || "Status not available"}\nIP: ${userIP || "Unable to fetch"}`;
        
        // Show sharing options
        showSharingOptions(message);
    }
    
    // Function to show sharing options
    function showSharingOptions(message) {
        const modal = document.createElement('div');
        modal.className = 'sos-modal';

        const modalContent = document.createElement('div');
        modalContent.className = 'sos-modal-content';

        modalContent.innerHTML = `
            <h3>Send Emergency Alert</h3>
            <p>Choose how to send your emergency alert:</p>
            <button id="sendSMSBtn" class="modal-btn sms">
                <i class="fas fa-sms"></i> Send via SMS
            </button>
            <button id="sendWhatsAppBtn" class="modal-btn wa">
                <i class="fab fa-whatsapp"></i> Send via WhatsApp
            </button>
            <button id="cancelBtn" class="modal-btn cancel">
                <i class="fas fa-times"></i> Cancel
            </button>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Add event listeners
        document.getElementById('sendSMSBtn').addEventListener('click', function() {
            document.body.removeChild(modal);
            sendViaSMS(message);
        });
        
        document.getElementById('sendWhatsAppBtn').addEventListener('click', function() {
            document.body.removeChild(modal);
            sendViaWhatsApp(message);
        });
        
        document.getElementById('cancelBtn').addEventListener('click', function() {
            document.body.removeChild(modal);
            statusMessage.classList.remove('active');
        });
    }
    
    // Function to send via SMS
    function sendViaSMS(message) {
        if (familyContacts.length === 0) {
            showStatusMessage('No emergency contacts available', 'error');
            return;
        }
        
        // Send SMS to the first contact
        const contact = familyContacts[0];
        const formattedNumber = formatPhoneNumberForSMS(contact);
        
        // Create SMS URL with properly encoded message
        const smsUrl = `sms:${formattedNumber}?body=${encodeURIComponent(message)}`;
        
        // Open SMS app
        window.open(smsUrl, '_self');
        
        showStatusMessage('SMS app opened with emergency alert', 'success');
    }
    
    // Function to send via WhatsApp
    function sendViaWhatsApp(message) {
        if (familyContacts.length === 0) {
            showStatusMessage('No emergency contacts available', 'error');
            return;
        }
        
        // Send WhatsApp message to the first contact
        const contact = familyContacts[0];
        const formattedNumber = formatPhoneNumberForWhatsApp(contact);
        
        // Create WhatsApp URL with properly encoded message
        const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;
        
        // Open WhatsApp
        window.open(whatsappUrl, '_blank');
        
        showStatusMessage('WhatsApp opened with emergency alert', 'success');
    }
    
    // Function to format phone number for SMS
    function formatPhoneNumberForSMS(number) {
        if (number.length === 10) {
            return `+91${number}`;
        } else if (number.length > 10 && number.startsWith('91')) {
            return `+${number}`;
        } else if (number.length > 10 && number.startsWith('0')) {
            return `+91${number.substring(1)}`;
        }
        return number;
    }
    
    // Function to format phone number for WhatsApp
    function formatPhoneNumberForWhatsApp(number) {
        // For WhatsApp, we need the number in international format without the +
        if (number.length === 10) {
            return `91${number}`;
        } else if (number.length > 10 && number.startsWith('91')) {
            return number;
        } else if (number.length > 10 && number.startsWith('0')) {
            return `91${number.substring(1)}`;
        }
        return number;
    }
    
    // Function to make a call
    function makeCall(number) {
        // Format the number for tel: protocol
        let formattedNumber = number;
        if (number.length === 10) {
            formattedNumber = `+91${number}`;
        } else if (number.length > 10 && !number.startsWith('+')) {
            if (number.startsWith('91')) {
                formattedNumber = `+${number}`;
            } else if (number.startsWith('0')) {
                formattedNumber = `+91${number.substring(1)}`;
            }
        }
        
        // Open dialer
        window.open(`tel:${formattedNumber}`, '_self');
    }
    // Expose globally: the emergency-service buttons call makeCall() from inline onclick handlers
    window.makeCall = makeCall;
    
    // Function to toggle sound on/off
    function toggleSound() {
        soundEnabled = !soundEnabled;

        if (soundEnabled) {
            soundToggle.classList.add('active');
            soundToggle.querySelector('span').textContent = 'Sound ON';
            soundToggle.querySelector('i').className = 'fas fa-volume-up';
        } else {
            soundToggle.classList.remove('active');
            soundToggle.querySelector('span').textContent = 'Sound OFF';
            soundToggle.querySelector('i').className = 'fas fa-volume-mute';
        }
    }
    
    // Function to play SOS sound (... --- ... morse pattern)
    function playSOSSound() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            if (ctx.state === 'suspended') ctx.resume();

            const shortBeep = 0.18; // seconds
            const longBeep = 0.55;  // seconds
            const gap = 0.22;       // seconds between beeps
            let t = ctx.currentTime + 0.05;

            function beep(dur) {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.value = 880;
                gain.gain.setValueAtTime(0.0001, t);
                gain.gain.exponentialRampToValueAtTime(0.4, t + 0.02);
                gain.gain.setValueAtTime(0.4, Math.max(t + 0.02, t + dur - 0.03));
                gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
                osc.start(t);
                osc.stop(t + dur + 0.05);
                t += dur + gap;
            }

            // S: three short
            for (let i = 0; i < 3; i++) beep(shortBeep);
            t += gap;
            // O: three long
            for (let i = 0; i < 3; i++) beep(longBeep);
            t += gap;
            // S: three short
            for (let i = 0; i < 3; i++) beep(shortBeep);

            setTimeout(() => { ctx.close().catch(() => {}); }, Math.ceil((t - ctx.currentTime + 0.5) * 1000));
        } catch (e) {
            // Audio not available on this device/browser; stay silent
        }
    }

                 // Function to show status message
    function showStatusMessage(message, type) {
        statusMessage.textContent = message;
        statusMessage.classList.remove('success', 'error');
        statusMessage.classList.add('active');
        
        if (type === 'success') {
            statusMessage.classList.add('success');
        } else if (type === 'error') {
            statusMessage.classList.add('error');
        }
        
        setTimeout(() => {
            statusMessage.classList.remove('active');
        }, 3000);
    }
});         

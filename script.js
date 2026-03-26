let gameSessionStart = null;
















// Get API URL - works for local development and production
function getApiUrl() {
    return window.location.origin;
}
















// Initialize home games event listeners
function initHomeGames() {
    const homeGrid = document.getElementById('homeGamesGrid');
    if (!homeGrid) return;








    const gameCards = homeGrid.querySelectorAll('.game-card');
    gameCards.forEach(card => {
        card.addEventListener('click', function() {
            const url = this.getAttribute('data-url');
            const title = this.getAttribute('data-title');
            if (url && title) {
                openGame(url, title);
            }
        });
    });
}
































function openGame(embedUrl, gameTitle) {
    const modal = document.getElementById('gameModal');
    const container = document.getElementById('embedContainer');
    const title = document.getElementById('modalTitle');
    const recentRow = document.getElementById('recentGames');
































    if (!modal || !container || !title || !recentRow) {
        console.error('Modal elements not found');
        return;
    }
































    // Persist recently played
    let recent = JSON.parse(localStorage.getItem('scratchhubRecentGames') || '[]');
    recent = [gameTitle].concat(recent.filter(item => item !== gameTitle)).slice(0, 3);
    localStorage.setItem('scratchhubRecentGames', JSON.stringify(recent));
    recentRow.textContent = recent.join(' • ');
































    // Clear previous content and show loading state
    container.innerHTML = '<div class="loading-overlay">Loading game...</div>';
    title.textContent = gameTitle;
































    const iframe = document.createElement('iframe');
    iframe.src = embedUrl;
    iframe.allowTransparency = 'true';
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.frameBorder = '0';
    iframe.scrolling = 'no';
    iframe.allowFullscreen = 'true';
    iframe.allow = 'autoplay; fullscreen';
    iframe.style.borderRadius = '10px';
    iframe.style.maxWidth = '900px';
    iframe.style.maxHeight = '540px';
































    iframe.onload = () => {
        const loading = container.querySelector('.loading-overlay');
        if (loading) loading.remove();
    };
































    container.appendChild(iframe);
































    // Track session start time for play duration
    gameSessionStart = Date.now();
































    // Show modal
    modal.style.display = 'flex';
    modal.style.zIndex = '1000';
}
































































































// Close modal function
function closeGameModal() {
    const modal = document.getElementById('gameModal');
    const container = document.getElementById('embedContainer');
































    if (gameSessionStart) {
        const elapsedSeconds = Math.round((Date.now() - gameSessionStart) / 1000);
        if (elapsedSeconds > 0) {
            addGameTime(elapsedSeconds);
        }
        gameSessionStart = null;
    }
































    if (container) {
        container.innerHTML = '';
    }
    if (modal) {
        modal.style.display = 'none';
    }
}
































































// Gradient from cyan to yellow without pink
function getHexColor(ratio) {
    // ratio goes from 0 to 1 left to right
    // Gradient: cyan -> red -> orange -> yellow (skip magenta/pink)
    let h; // hue
   
    if (ratio < 0.4) {
        // Cyan to Red
        h = 180 - (ratio / 0.4) * 180; // 180 to 0 (cyan to red)
    } else if (ratio < 0.7) {
        // Red to Orange
        h = 0 + ((ratio - 0.4) / 0.3) * 30; // 0 to 30 (red to orange)
    } else {
        // Orange to Yellow
        h = 30 + ((ratio - 0.7) / 0.3) * 30; // 30 to 60 (orange to yellow)
    }
   
    return `hsl(${h}, 100%, 50%)`;
}
































































function createCell(xPos) {
    const cell = document.createElement('div');
    cell.className = 'hexagon';
   
    // Set border color based on horizontal position
    const ratio = Math.min(xPos / window.innerWidth, 0.99);
    const borderColor = getHexColor(ratio);
    cell.style.borderColor = borderColor;
    cell.style.color = borderColor;
   
    // Override the hover to use a random bright color
    cell.addEventListener('mouseenter', function() {
        const colors = ['#00ff88', '#00ffff', '#ff0055', '#ff1744', '#ff3d00', '#00bcd4', '#ff5722', '#ffff00', '#ff00ff', '#00ff00'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        this.style.backgroundColor = randomColor;
    });
   
    cell.addEventListener('mouseleave', function() {
        this.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    });
































































    return cell;
}
































































function createHexagonGrid() {
    const container = document.getElementById('hexContainer');
    const hexSize = 60;
    const hexesPerRow = Math.ceil(window.innerWidth / hexSize) + 5;
   
    // Calculate how many hexagons we need for complete coverage
    const totalHexagons = Math.ceil((window.innerWidth / 60) * (window.innerHeight / 52)) + 100;
   
    // Create hexagons to fill the entire honeycomb
    for (let i = 0; i < totalHexagons; i++) {
        // Calculate approximate x position for this hexagon
        const colIndex = i % hexesPerRow;
        const xPos = colIndex * hexSize;
        container.appendChild(createCell(xPos));
    }
}
































































// Create hexagons and wire up game controls when the page loads
document.addEventListener('DOMContentLoaded', () => {
    createHexagonGrid();
    initPageNav();
    initHomeGames();
    initGameFilters();
    initRandomGameButton();
    loadRecentGames();
    populateGamesPage();
    initAuth();
    initAIAssistant();
    initSettings();
    initCreate();
    initAudioSystem();
    applySavedSettings();
});
































// AI Assistant client
function initAIAssistant() {
    const sendButton = document.getElementById('sendButton');
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    const quickBtns = document.querySelectorAll('.quick-btn');
















    if (!sendButton || !chatInput || !chatMessages) return;
















    function appendMessage(role, text, isHTML = false) {
        const wrapper = document.createElement('div');
        wrapper.className = `message ${role}-message`;
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = role === 'user' ? '🧑' : '🤖';
        const content = document.createElement('div');
        content.className = 'message-content';
        const p = document.createElement('p');
        if (isHTML) {
            p.innerHTML = text;
        } else {
            p.textContent = text;
        }
        content.appendChild(p);
        wrapper.appendChild(avatar);
        wrapper.appendChild(content);
        chatMessages.appendChild(wrapper);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return wrapper;
    }
















    async function sendPrompt(prompt) {
        const userEl = appendMessage('user', prompt);
        const botEl = appendMessage('assistant', '🤔 Thinking...');


        try {
            // Use local knowledge instead of API
            const relevantKnowledge = findRelevantKnowledge(prompt);
           
            let responseText = '';
            if (relevantKnowledge.length > 0) {
                // Combine relevant knowledge entries
                responseText = relevantKnowledge.map(item => item.value).join('\n\n');
            } else {
                // Fallback response for unknown queries
                responseText = "I'm sorry, I don't have specific information about that. I can help you with questions about ScratchHub features like playing games, creating accounts, using settings, or the create game interface. Try asking about those topics!";
            }


            // Add a small delay to make it feel more natural
            setTimeout(() => {
                botEl.querySelector('.message-content p').textContent = responseText;
            }, 300);


        } catch (err) {
            console.error('AI response failed', err);
            botEl.querySelector('.message-content p').textContent = '❌ Something went wrong. Please try again.';
        }
    }
















    sendButton.addEventListener('click', () => {
        const q = chatInput.value.trim();
        if (!q) return;
        chatInput.value = '';
        sendPrompt(q);
    });
















    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendButton.click();
        }
    });
















    quickBtns.forEach(b => b.addEventListener('click', () => {
        const q = b.dataset.question;
        if (q) {
            chatInput.value = q;
            sendButton.click();
        }
    }));
}
































function initPageNav() {
    const pageButtons = document.querySelectorAll('.page-btn');
    const pages = document.querySelectorAll('.page');
































    pageButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            pageButtons.forEach(b => b.classList.remove('active'));
            pages.forEach(p => p.classList.remove('active'));
































            btn.classList.add('active');
            const target = btn.dataset.page;
            const destination = document.getElementById(target);
            if (destination) destination.classList.add('active');
































            if (target === 'home') {
                document.querySelector('.content-overlay').classList.remove('compact-view');
            } else {
                document.querySelector('.content-overlay').classList.add('compact-view');
            }
        });
    });
}
































function initGameFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const gameCards = document.querySelectorAll('.game-card');
































    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const category = btn.dataset.filter;
































            gameCards.forEach(card => {
                const cardCategory = card.dataset.category || 'all';
                card.style.display = category === 'all' || cardCategory === category ? 'block' : 'none';
            });
        });
    });
}
































function initRandomGameButton() {
    const randomBtn = document.getElementById('randomGameBtn');
    randomBtn.addEventListener('click', () => {
        const visibleCards = Array.from(document.querySelectorAll('.game-card')).filter(card => card.style.display !== 'none');
        if (visibleCards.length === 0) return;
        const chosen = visibleCards[Math.floor(Math.random() * visibleCards.length)];
        chosen.click();
    });
}












































function loadRecentGames() {
    const recent = JSON.parse(localStorage.getItem('scratchhubRecentGames') || '[]');
    const recentRow = document.getElementById('recentGames');
    if (recentRow) {
        recentRow.textContent = recent.length ? recent.join(' • ') : 'None yet';
    }
}
































// Basic localStorage account management
function getAccounts() {
    return JSON.parse(localStorage.getItem('scratchhubAccounts') || '{}');
}
































function saveAccounts(accounts) {
    localStorage.setItem('scratchhubAccounts', JSON.stringify(accounts));
}
































function setCurrentUser(username) {
    localStorage.setItem('scratchhubCurrentUser', username);
    document.getElementById('currentUser').textContent = username;
}
































function getCurrentUser() {
    return localStorage.getItem('scratchhubCurrentUser');
}
































function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}
































function updateLeaderboard() {
    const accounts = getAccounts();
    const board = document.querySelector('#topPlayers .leaderboard');
    if (!board) return;
































    const players = Object.entries(accounts)
          .map(([name,data]) => ({name, time: data.time || 0}))
          .sort((a,b) => b.time - a.time)
          .slice(0, 10);
































    board.innerHTML = '';
    players.forEach((p,index) => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${index + 1}.</strong> ${p.name} - ${formatTime(p.time)} played`;
        board.appendChild(li);
    });
}
































function createUserStoreSlot() {
    const username = getCurrentUser();
    if (!username) return;
    const accounts = getAccounts();
    if (!accounts[username]) {
        accounts[username] = { password: '', time: 0 };
        saveAccounts(accounts);
    }
}
































function addGameTime(elapsedSeconds) {
    const username = getCurrentUser();
    if (!username) return;
    const accounts = getAccounts();
    if (!accounts[username]) return;
































    accounts[username].time = (accounts[username].time || 0) + elapsedSeconds;
    saveAccounts(accounts);
    updateLeaderboard();
}
































function initAuth() {
    const overlay = document.getElementById('authOverlay');
    const authUser = document.getElementById('authUser');
    const authPass = document.getElementById('authPass');
    const message = document.getElementById('authMessage');
    const submit = document.getElementById('authSubmit');
    const toggleSignIn = document.getElementById('btnSignIn');
    const toggleSignUp = document.getElementById('btnSignUp');
































    let mode = 'signin';
































    function setMode(newMode) {
        mode = newMode;
        toggleSignIn.classList.toggle('active', mode === 'signin');
        toggleSignUp.classList.toggle('active', mode === 'signup');
        message.textContent = '';
        submit.textContent = mode === 'signin' ? 'Sign In' : 'Sign Up';
    }
































    toggleSignIn.addEventListener('click', () => setMode('signin'));
    toggleSignUp.addEventListener('click', () => setMode('signup'));
































    submit.addEventListener('click', () => {
        const username = authUser.value.trim();
        const password = authPass.value.trim();
        if (!username || !password) {
            message.textContent = 'Enter username and password.';
            return;
        }
































        const accounts = getAccounts();
































        if (mode === 'signup') {
            if (accounts[username]) {
                message.textContent = 'Username already exists.';
                return;
            }
            accounts[username] = { password, time: 0 };
            saveAccounts(accounts);
           
            // Verify it was saved
            const verify = getAccounts();
            if (!verify[username]) {
                message.textContent = 'Error: Could not save account. Try enabling localStorage.';
                return;
            }
           
            setCurrentUser(username);
            overlay.style.display = 'none';
            message.textContent = 'Account created! You are now logged in.';
            createUserStoreSlot();
            updateLeaderboard();
            return;
        }
































        // signin
        if (!accounts[username]) {
            message.textContent = 'Username not found.';
            console.error('Sign in failed: Username not found. Available accounts:', Object.keys(accounts));
            return;
        }
       
        if (accounts[username].password !== password) {
            message.textContent = 'Invalid password.';
            console.error('Sign in failed: Invalid password for user:', username);
            return;
        }
































        setCurrentUser(username);
        overlay.style.display = 'none';
        message.textContent = 'Signed in!';
        createUserStoreSlot();
        updateLeaderboard();
    });
































    const existingUser = getCurrentUser();
    if (!existingUser) {
        overlay.style.display = 'flex';
    } else {
        overlay.style.display = 'none';
        document.getElementById('currentUser').textContent = existingUser;
        createUserStoreSlot();
        updateLeaderboard();
    }
































    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('scratchhubCurrentUser');
        document.getElementById('currentUser').textContent = 'Guest';
        overlay.style.display = 'flex';
        setMode('signin');
    });
}
































function populateGamesPage() {
    const sourceCards = Array.from(document.querySelectorAll('#home .game-card'));
    const destination = document.getElementById('gamesGridCopy');
































    if (!destination || sourceCards.length === 0) return;
































    destination.innerHTML = '';
    sourceCards.forEach(card => {
        const clone = card.cloneNode(true);
        clone.addEventListener('click', () => {
            const onclickAttr = card.getAttribute('onclick');
            if (onclickAttr) {
                eval(onclickAttr);
            }
        });
        destination.appendChild(clone);
    });
}








// Local knowledge base for AI assistant
const websiteKnowledge = {
    "what is scratchhub": "ScratchHub is a web platform that hosts and showcases Scratch games and projects. It allows users to play games, create accounts, customize settings, and even create their own games using a visual programming interface.",
    "how to play games": "To play games on ScratchHub, simply click on any game card on the home page. The game will open in a modal window where you can play directly in your browser. You can close the game by clicking the X button or clicking outside the modal.",
    "how to sign up": "To create an account, click the 'Sign Up' button in the top navigation. Fill in your username, email, and password, then click 'Create Account'. Your information will be stored locally in your browser.",
    "how to sign in": "Click the 'Sign In' button in the navigation, enter your username and password, and click 'Sign In'. If you don't have an account, use the 'Sign Up' link instead.",
    "what are settings": "The settings page allows you to customize your ScratchHub experience. You can change your username, email, toggle dark mode, adjust volume, and modify other preferences.",
    "how to create games": "Use the 'Create' page to build your own games. Drag and drop programming blocks from the toolbox into the workspace to create game logic. You can add sprites, sounds, and interactive elements.",
    "what is the leaderboard": "The leaderboard shows the top players based on their game performance and achievements. Sign in to track your own progress and compete with other users.",
    "how does authentication work": "ScratchHub uses local browser storage for authentication. Your account information is saved in your browser's localStorage, so you'll stay signed in between sessions.",
    "what games are available": "ScratchHub features various Scratch games including platformers, puzzles, arcade games, and more. Each game is embedded directly in the platform for easy access.",
    "how to change settings": "Navigate to the Settings page using the menu. There you'll find options to update your profile, toggle themes, adjust audio settings, and customize your experience.",
    "what is the create feature": "The Create feature provides a visual programming environment similar to Scratch. You can drag blocks to create game logic, add sprites, and build interactive projects.",
    "how to navigate the site": "Use the navigation buttons at the top: Home (games), Settings (customization), Create (game building), and AI Assistant (help and information).",
    "what is scratch": "Scratch is a visual programming language developed by MIT that makes it easy to create interactive stories, games, and animations. ScratchHub hosts games made with Scratch.",
    "how to get help": "Use the AI Assistant in the navigation to ask questions about ScratchHub. The assistant has knowledge about all features and can help you navigate the platform.",
    "what is dark mode": "Dark mode is a theme option in settings that changes the color scheme to darker colors, which can be easier on the eyes in low light conditions.",
    "how to log out": "Currently, there's no explicit logout button, but you can clear your browser data or use incognito mode to start fresh. Your data is stored locally.",
    "what are game stats": "Game stats track your playing time and performance. They help populate the leaderboard and show your gaming activity on the platform.",
    "how to embed games": "Games are automatically embedded in modal windows when you click on them. The platform handles the iframe loading and display for you.",
    "what is the ai assistant": "The AI Assistant is a built-in help system that can answer questions about ScratchHub. It uses local knowledge to provide accurate information about the platform's features and functionality."
};








// Function to find relevant knowledge based on user query
function findRelevantKnowledge(query) {
    const lowerQuery = query.toLowerCase();
    const matches = [];








    for (const [key, value] of Object.entries(websiteKnowledge)) {
        if (lowerQuery.includes(key) || key.split(' ').some(word => lowerQuery.includes(word))) {
            matches.push({ key, value, relevance: calculateRelevance(lowerQuery, key) });
        }
    }








    // Sort by relevance and return top matches
    matches.sort((a, b) => b.relevance - a.relevance);
    return matches.slice(0, 3);
}








function calculateRelevance(query, key) {
    const queryWords = query.toLowerCase().split(' ');
    const keyWords = key.toLowerCase().split(' ');
    let score = 0;








    for (const qWord of queryWords) {
        for (const kWord of keyWords) {
            if (qWord === kWord) score += 2;
            else if (kWord.includes(qWord) || qWord.includes(kWord)) score += 1;
        }
    }








    return score;
}
































function initSettings() {
    // Profile settings
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const settingsUsername = document.getElementById('settingsUsername');
    const settingsEmail = document.getElementById('settingsEmail');








    // Load current user data
    const currentUser = getCurrentUser();
    if (currentUser) {
        const accounts = getAccounts();
        if (accounts[currentUser]) {
            settingsUsername.value = currentUser;
            settingsEmail.value = accounts[currentUser].email || '';
        }
    }








    // Save profile
    saveProfileBtn.addEventListener('click', () => {
        const newUsername = settingsUsername.value.trim();
        const newEmail = settingsEmail.value.trim();








        if (!newUsername) {
            alert('Username cannot be empty!');
            return;
        }








        const accounts = getAccounts();
        const oldUsername = getCurrentUser();








        if (oldUsername && oldUsername !== newUsername) {
            // Rename user account
            accounts[newUsername] = accounts[oldUsername];
            delete accounts[oldUsername];
            setCurrentUser(newUsername);
        }








        if (accounts[newUsername]) {
            accounts[newUsername].email = newEmail;
            saveAccounts(accounts);
            updateLeaderboard();
            document.getElementById('currentUser').textContent = newUsername;
            alert('Profile saved successfully!');
        }
    });


    // API Key settings
    const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
    const geminiApiKey = document.getElementById('geminiApiKey');


    // Load saved API key
    const savedApiKey = localStorage.getItem('geminiApiKey');
    if (savedApiKey) {
        geminiApiKey.value = savedApiKey;
    }


    // Save API key
    saveApiKeyBtn.addEventListener('click', () => {
        const apiKey = geminiApiKey.value.trim();
       
        if (!apiKey) {
            alert('API key cannot be empty!');
            return;
        }


        localStorage.setItem('geminiApiKey', apiKey);
        alert('API key saved successfully!');
    });


    // Appearance settings
    const darkModeToggle = document.getElementById('darkModeToggle');
    const themeColor = document.getElementById('themeColor');








    // Load saved settings
    darkModeToggle.checked = localStorage.getItem('scratchhubDarkMode') === 'true';
    themeColor.value = localStorage.getItem('scratchhubThemeColor') || 'blue';








    // Apply theme
    function applyTheme() {
        const isDark = darkModeToggle.checked;
        const color = themeColor.value;








        document.body.classList.toggle('dark-mode', isDark);
        document.body.setAttribute('data-theme', color);








        localStorage.setItem('scratchhubDarkMode', isDark);
        localStorage.setItem('scratchhubThemeColor', color);
    }








    darkModeToggle.addEventListener('change', applyTheme);
    themeColor.addEventListener('change', applyTheme);








    // Music & Audio settings
    const masterVolumeSlider = document.getElementById('masterVolumeSlider');
    const masterVolumeValue = document.getElementById('masterVolumeValue');
    const musicVolumeSlider = document.getElementById('musicVolumeSlider');
    const musicVolumeValue = document.getElementById('musicVolumeValue');
    const sfxVolumeSlider = document.getElementById('sfxVolumeSlider');
    const sfxVolumeValue = document.getElementById('sfxVolumeValue');
    const backgroundMusicToggle = document.getElementById('backgroundMusicToggle');
    const gameSoundsToggle = document.getElementById('gameSoundsToggle');
    const musicTheme = document.getElementById('musicTheme');








    // Load saved audio settings
    masterVolumeSlider.value = localStorage.getItem('scratchhubMasterVolume') || '70';
    masterVolumeValue.textContent = masterVolumeSlider.value + '%';
    musicVolumeSlider.value = localStorage.getItem('scratchhubMusicVolume') || '60';
    musicVolumeValue.textContent = musicVolumeSlider.value + '%';
    sfxVolumeSlider.value = localStorage.getItem('scratchhubSfxVolume') || '80';
    sfxVolumeValue.textContent = sfxVolumeSlider.value + '%';
    backgroundMusicToggle.checked = localStorage.getItem('scratchhubBackgroundMusic') !== 'false';
    gameSoundsToggle.checked = localStorage.getItem('scratchhubGameSounds') !== 'false';
    musicTheme.value = localStorage.getItem('scratchhubMusicTheme') || 'electronic';








    // Audio event listeners
    masterVolumeSlider.addEventListener('input', () => {
        masterVolumeValue.textContent = masterVolumeSlider.value + '%';
        localStorage.setItem('scratchhubMasterVolume', masterVolumeSlider.value);
        updateAudioSettings();
    });








    musicVolumeSlider.addEventListener('input', () => {
        musicVolumeValue.textContent = musicVolumeSlider.value + '%';
        localStorage.setItem('scratchhubMusicVolume', musicVolumeSlider.value);
        updateAudioSettings();
    });








    sfxVolumeSlider.addEventListener('input', () => {
        sfxVolumeValue.textContent = sfxVolumeSlider.value + '%';
        localStorage.setItem('scratchhubSfxVolume', sfxVolumeSlider.value);
        updateAudioSettings();
    });








    backgroundMusicToggle.addEventListener('change', () => {
        localStorage.setItem('scratchhubBackgroundMusic', backgroundMusicToggle.checked);
        updateAudioSettings();
    });








    gameSoundsToggle.addEventListener('change', () => {
        localStorage.setItem('scratchhubGameSounds', gameSoundsToggle.checked);
        // Note: This would affect game sound effects, but for now we'll just save it
    });








    musicTheme.addEventListener('change', () => {
        localStorage.setItem('scratchhubMusicTheme', musicTheme.value);
        updateAudioSettings();
    });








    const startAudioBtn = document.getElementById('startAudioBtn');
    const audioStatus = document.getElementById('audioStatus');




    startAudioBtn.addEventListener('click', () => {
        if (!audioContext) {
            initAudioSystem();
        }
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                audioStatus.textContent = 'Audio started successfully.';
                startBackgroundMusic();
            }).catch(err => {
                audioStatus.textContent = 'Audio resume failed, maybe browser blocked it.';
                console.warn('Audio resume failed:', err);
            });
        } else {
            audioStatus.textContent = 'Audio is already started or not supported.';
            startBackgroundMusic();
        }
    });
}
































// Audio System
let audioContext = null;
let backgroundMusic = null;
let masterGainNode = null;
let musicGainNode = null;
let sfxGainNode = null;
let currentMusicTheme = 'electronic';








const musicThemes = {
    electronic: {
        frequency: 220,
        type: 'sawtooth',
        duration: 4
    },
    ambient: {
        frequency: 110,
        type: 'sine',
        duration: 8
    },
    upbeat: {
        frequency: 330,
        type: 'square',
        duration: 2
    },
    calm: {
        frequency: 165,
        type: 'triangle',
        duration: 6
    }
};








function initAudioSystem() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        masterGainNode = audioContext.createGain();
        musicGainNode = audioContext.createGain();
        sfxGainNode = audioContext.createGain();




        masterGainNode.connect(audioContext.destination);
        musicGainNode.connect(masterGainNode);
        sfxGainNode.connect(masterGainNode);




        // Load saved audio settings
        const masterVolume = parseInt(localStorage.getItem('scratchhubMasterVolume') || '70') / 100;
        const musicVolume = parseInt(localStorage.getItem('scratchhubMusicVolume') || '60') / 100;
        const sfxVolume = parseInt(localStorage.getItem('scratchhubSfxVolume') || '80') / 100;




        masterGainNode.gain.setValueAtTime(masterVolume, 0);
        musicGainNode.gain.setValueAtTime(musicVolume, 0);
        sfxGainNode.gain.setValueAtTime(sfxVolume, 0);




        currentMusicTheme = localStorage.getItem('scratchhubMusicTheme') || 'electronic';




        function tryStartMusic() {
            if (!audioContext) return;
            if (audioContext.state === 'suspended') {
                audioContext.resume().catch(() => {});
            }
            const enabled = localStorage.getItem('scratchhubBackgroundMusic') !== 'false';
            if (enabled && !backgroundMusic) {
                startBackgroundMusic();
            }
        }




        document.body.addEventListener('click', tryStartMusic, { once: true });
        document.body.addEventListener('keydown', tryStartMusic, { once: true });




        const audioStatus = document.getElementById('audioStatus');
        if (audioStatus) {
            audioStatus.textContent = 'Click or press any key to start audio.';
        }




        // Try immediately in case the browser allows it
        tryStartMusic();




    } catch (e) {
        console.warn('Web Audio API not supported:', e);
    }
}








function startBackgroundMusic() {
    if (backgroundMusic) return;


    const enabled = localStorage.getItem('scratchhubBackgroundMusic');
    if (enabled === 'false') return;


    // Play background-music.mp3
    backgroundMusic = new Audio('background-music.mp3');
    backgroundMusic.loop = true;
    backgroundMusic.volume = (parseInt(localStorage.getItem('scratchhubMusicVolume') || '60') / 100);
   
    backgroundMusic.addEventListener('error', (e) => {
        console.error('Failed to load background music:', e);
        console.warn('Background music file is missing or invalid.');
        backgroundMusic = null;
    });
   
    backgroundMusic.play().catch(err => {
        console.warn('Could not play background music:', err);
    });
   
    const audioStatus = document.getElementById('audioStatus');
    if (audioStatus) {
        audioStatus.textContent = 'Audio playing ♪';
    }
}








function stopBackgroundMusic() {
    if (backgroundMusic && backgroundMusic instanceof Audio) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
        backgroundMusic = null;
    }
}




















function playSoundEffect(frequency = 440, duration = 0.2, type = 'sine') {
    // Sound effects disabled - using background music instead
    return;
}








function updateAudioSettings() {
    const masterVolume = parseInt(localStorage.getItem('scratchhubMasterVolume') || '70') / 100;
    const musicVolume = parseInt(localStorage.getItem('scratchhubMusicVolume') || '60') / 100;
    const sfxVolume = parseInt(localStorage.getItem('scratchhubSfxVolume') || '80') / 100;


    // Update background music volume
    if (backgroundMusic && backgroundMusic instanceof Audio) {
        backgroundMusic.volume = masterVolume * musicVolume;
    }


    // Update audio context gain nodes
    if (audioContext) {
        masterGainNode.gain.setValueAtTime(masterVolume, audioContext.currentTime);
        musicGainNode.gain.setValueAtTime(musicVolume, audioContext.currentTime);
        sfxGainNode.gain.setValueAtTime(sfxVolume, audioContext.currentTime);
    }


    const backgroundMusicEnabled = localStorage.getItem('scratchhubBackgroundMusic') !== 'false';
    if (backgroundMusicEnabled && !backgroundMusic) {
        startBackgroundMusic();
    } else if (!backgroundMusicEnabled && backgroundMusic) {
        stopBackgroundMusic();
    }
}








function applySavedSettings() {
    // Apply theme on page load
    const isDark = localStorage.getItem('scratchhubDarkMode') === 'true';
    const themeColor = localStorage.getItem('scratchhubThemeColor') || 'blue';




    document.body.classList.toggle('dark-mode', isDark);
    document.body.setAttribute('data-theme', themeColor);




    // Sync theme color dropdown with saved theme
    const themeColorDropdown = document.getElementById('themeColor');
    if (themeColorDropdown) {
        themeColorDropdown.value = themeColor;
    }




    // Sync dark mode toggle with saved setting
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.checked = isDark;
    }
}
































// Trivia Game Data
const triviaQuestions = [
    {
        question: "What programming language is Scratch based on?",
        options: ["JavaScript", "Python", "Blocks", "Visual Basic"],
        correct: 2,
        explanation: "Scratch uses visual programming blocks instead of text-based code!"
    },
    {
        question: "What is the main purpose of Scratch?",
        options: ["Make websites", "Learn programming", "Play games", "Draw pictures"],
        correct: 1,
        explanation: "Scratch is designed to help people learn programming through fun, visual coding!"
    },
    {
        question: "What do you call the colorful puzzle-piece shapes in Scratch?",
        options: ["Sprites", "Blocks", "Scripts", "Variables"],
        correct: 1,
        explanation: "Blocks are the visual programming elements that snap together like puzzle pieces!"
    },
    {
        question: "What is a 'sprite' in Scratch?",
        options: ["A sound effect", "A character or object", "A programming block", "A background"],
        correct: 1,
        explanation: "Sprites are the characters, objects, or images that you can program to move and interact!"
    },
    {
        question: "Which block category controls movement in Scratch?",
        options: ["Looks", "Sound", "Motion", "Events"],
        correct: 2,
        explanation: "The Motion category contains blocks for moving sprites around the stage!"
    },
    {
        question: "What happens when you click the green flag in Scratch?",
        options: ["Stops the program", "Starts the program", "Saves the project", "Deletes everything"],
        correct: 1,
        explanation: "The green flag starts running your Scratch program!"
    },
    {
        question: "What is the stage in Scratch?",
        options: ["Where blocks are stored", "The programming area", "The performance area", "The background"],
        correct: 2,
        explanation: "The stage is where your sprites perform and where you see the results of your code!"
    },
    {
        question: "Which of these is NOT a Scratch block category?",
        options: ["Motion", "Looks", "Sound", "Database"],
        correct: 3,
        explanation: "Scratch has Motion, Looks, Sound, Events, Control, Sensing, Operators, and Variables categories!"
    }
];








let currentTriviaQuestion = 0;
let triviaScore = 0;








function initTriviaGame() {
    currentTriviaQuestion = 0;
    triviaScore = 0;
    showTriviaQuestion();
}








function showTriviaQuestion() {
    if (currentTriviaQuestion >= triviaQuestions.length) {
        showTriviaResults();
        return;
    }








    const question = triviaQuestions[currentTriviaQuestion];
    const modal = document.createElement('div');
    modal.className = 'game-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2 class="modal-title">🧠 Scratch Trivia</h2>
            <div class="trivia-content">
                <div class="question-counter">Question ${currentTriviaQuestion + 1} of ${triviaQuestions.length}</div>
                <div class="score-display">Score: ${triviaScore}/${triviaQuestions.length}</div>
                <div class="trivia-question">${question.question}</div>
                <div class="trivia-options">
                    ${question.options.map((option, index) =>
                        `<button class="trivia-option" data-index="${index}">${option}</button>`
                    ).join('')}
                </div>
            </div>
            <button class="close-btn" onclick="closeGameModal()">×</button>
        </div>
    `;








    document.body.appendChild(modal);








    // Add event listeners to options
    modal.querySelectorAll('.trivia-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const selectedIndex = parseInt(e.target.dataset.index);
            checkTriviaAnswer(selectedIndex);
        });
    });
}








function checkTriviaAnswer(selectedIndex) {
    const question = triviaQuestions[currentTriviaQuestion];
    const modal = document.querySelector('.game-modal');
    const options = modal.querySelectorAll('.trivia-option');








    // Disable all options
    options.forEach(option => option.disabled = true);








    // Show correct/incorrect
    if (selectedIndex === question.correct) {
        options[selectedIndex].classList.add('correct');
        triviaScore++;
    } else {
        options[selectedIndex].classList.add('incorrect');
        options[question.correct].classList.add('correct');
    }








    // Show explanation
    const explanation = document.createElement('div');
    explanation.className = 'trivia-explanation';
    explanation.innerHTML = `<p>${question.explanation}</p><button class="next-btn">Next Question</button>`;
    modal.querySelector('.trivia-content').appendChild(explanation);








    explanation.querySelector('.next-btn').addEventListener('click', () => {
        modal.remove();
        currentTriviaQuestion++;
        showTriviaQuestion();
    });
}








function showTriviaResults() {
    const percentage = Math.round((triviaScore / triviaQuestions.length) * 100);
    let message = '';








    if (percentage >= 80) {
        message = '🎉 Excellent! You\'re a Scratch expert!';
    } else if (percentage >= 60) {
        message = '👍 Good job! You know quite a bit about Scratch!';
    } else if (percentage >= 40) {
        message = '🤔 Not bad! Keep learning about Scratch!';
    } else {
        message = '📚 Keep exploring Scratch to learn more!';
    }








    const modal = document.createElement('div');
    modal.className = 'game-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2 class="modal-title">🏆 Trivia Complete!</h2>
            <div class="trivia-results">
                <div class="final-score">Final Score: ${triviaScore}/${triviaQuestions.length}</div>
                <div class="percentage">${percentage}% Correct</div>
                <div class="message">${message}</div>
                <button class="play-again-btn">Play Again</button>
            </div>
            <button class="close-btn" onclick="closeGameModal()">×</button>
        </div>
    `;








    document.body.appendChild(modal);








    modal.querySelector('.play-again-btn').addEventListener('click', () => {
        modal.remove();
        initTriviaGame();
    });
}
































// Jeopardy Game Data
const jeopardyCategories = [
    {
        name: "Scratch Basics",
        questions: [
            { points: 100, question: "What is the name of the visual programming language used in Scratch?", answer: "Blocks" },
            { points: 200, question: "What color are Motion blocks in Scratch?", answer: "Blue" },
            { points: 300, question: "What does the green flag do in Scratch?", answer: "Starts the program" },
            { points: 400, question: "What is the area called where sprites perform in Scratch?", answer: "The Stage" }
        ]
    },
    {
        name: "Blocks & Code",
        questions: [
            { points: 100, question: "Which category contains blocks for changing costumes?", answer: "Looks" },
            { points: 200, question: "What type of block waits for a specific event?", answer: "Event block" },
            { points: 300, question: "Which block repeats actions a certain number of times?", answer: "Repeat" },
            { points: 400, question: "What block category handles mathematical operations?", answer: "Operators" }
        ]
    },
    {
        name: "Sprites & Stage",
        questions: [
            { points: 100, question: "What is the default sprite called in Scratch?", answer: "Cat" },
            { points: 200, question: "What can sprites do on the stage?", answer: "Move, rotate, change size" },
            { points: 300, question: "What is the maximum number of clones a sprite can have?", answer: "300" },
            { points: 400, question: "What determines the order sprites appear on stage?", answer: "Layer order" }
        ]
    },
    {
        name: "Sound & Media",
        questions: [
            { points: 100, question: "Which block category handles audio?", answer: "Sound" },
            { points: 200, question: "What file formats can be imported for sounds?", answer: "MP3, WAV, etc." },
            { points: 300, question: "How many sound effects can play simultaneously?", answer: "Multiple" },
            { points: 400, question: "What block plays a sound until it finishes?", answer: "Play sound until done" }
        ]
    }
];








let jeopardyScore = 0;
let selectedQuestions = new Set();








function initJeopardyGame() {
    jeopardyScore = 0;
    selectedQuestions.clear();
    showJeopardyBoard();
}








function showJeopardyBoard() {
    const modal = document.createElement('div');
    modal.className = 'game-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2 class="modal-title">🎯 Scratch Jeopardy</h2>
            <div class="jeopardy-score">Score: $${jeopardyScore}</div>
            <div class="jeopardy-board">
                ${jeopardyCategories.map((category, catIndex) => `
                    <div class="jeopardy-category">
                        <h3>${category.name}</h3>
                        ${category.questions.map((q, qIndex) => {
                            const questionId = `${catIndex}-${qIndex}`;
                            const isAnswered = selectedQuestions.has(questionId);
                            return `<button class="jeopardy-question ${isAnswered ? 'answered' : ''}"
                                    data-category="${catIndex}" data-question="${qIndex}"
                                    ${isAnswered ? 'disabled' : ''}>
                                $${q.points}
                            </button>`;
                        }).join('')}
                    </div>
                `).join('')}
            </div>
            <button class="close-btn" onclick="closeGameModal()">×</button>
        </div>
    `;








    document.body.appendChild(modal);








    // Add event listeners
    modal.querySelectorAll('.jeopardy-question:not(.answered)').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const catIndex = parseInt(e.target.dataset.category);
            const qIndex = parseInt(e.target.dataset.question);
            showJeopardyQuestion(catIndex, qIndex);
        });
    });
}








function showJeopardyQuestion(catIndex, qIndex) {
    const category = jeopardyCategories[catIndex];
    const question = category.questions[qIndex];
    const questionId = `${catIndex}-${qIndex}`;








    const modal = document.querySelector('.game-modal');
    modal.innerHTML = `
        <div class="modal-content">
            <h2 class="modal-title">🎯 ${category.name} - $${question.points}</h2>
            <div class="jeopardy-question-display">
                <div class="question-text">${question.question}</div>
                <input type="text" class="jeopardy-answer" placeholder="Your answer..." maxlength="100">
                <div class="jeopardy-buttons">
                    <button class="submit-answer-btn">Submit Answer</button>
                    <button class="back-to-board-btn">Back to Board</button>
                </div>
            </div>
            <button class="close-btn" onclick="closeGameModal()">×</button>
        </div>
    `;








    const answerInput = modal.querySelector('.jeopardy-answer');
    const submitBtn = modal.querySelector('.submit-answer-btn');
    const backBtn = modal.querySelector('.back-to-board-btn');








    submitBtn.addEventListener('click', () => {
        const userAnswer = answerInput.value.trim().toLowerCase();
        const correctAnswer = question.answer.toLowerCase();
       
        // Simple answer checking (could be improved)
        const isCorrect = userAnswer.includes(correctAnswer) || correctAnswer.includes(userAnswer);
       
        if (isCorrect) {
            jeopardyScore += question.points;
            showJeopardyFeedback(true, question.answer);
        } else {
            jeopardyScore -= question.points;
            showJeopardyFeedback(false, question.answer);
        }
       
        selectedQuestions.add(questionId);
    });








    backBtn.addEventListener('click', () => {
        showJeopardyBoard();
    });








    // Auto-focus input
    setTimeout(() => answerInput.focus(), 100);
}








function showJeopardyFeedback(isCorrect, correctAnswer) {
    const modal = document.querySelector('.game-modal');
    const feedbackClass = isCorrect ? 'correct' : 'incorrect';
    const feedbackText = isCorrect ? 'Correct!' : `Incorrect. The answer was: ${correctAnswer}`;








    modal.innerHTML = `
        <div class="modal-content">
            <h2 class="modal-title">🎯 ${isCorrect ? 'Correct!' : 'Incorrect'}</h2>
            <div class="jeopardy-feedback ${feedbackClass}">
                <div class="feedback-text">${feedbackText}</div>
                <div class="current-score">Current Score: $${jeopardyScore}</div>
                <button class="back-to-board-btn">Back to Board</button>
            </div>
            <button class="close-btn" onclick="closeGameModal()">×</button>
        </div>
    `;








    modal.querySelector('.back-to-board-btn').addEventListener('click', () => {
        showJeopardyBoard();
    });
}




























































































































































































































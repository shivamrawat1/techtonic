// interview_technical/static/js/main.js

// Immediately log that the script is running
console.log("main.js is running");

// Initialize Monaco Editor
require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.43.0/min/vs' } });
require(['vs/editor/editor.main'], function () {
    console.log("Monaco editor module loaded");
    try {
        var editorElement = document.getElementById('editor');
        console.log("Editor element found:", editorElement);

        // Get the selected question and function signature
        const selectedQuestion = document.getElementById('selected-question').value;
        let initialCode = '# Write your solution here\n\n';

        // Get function signature from the hidden input if available
        const functionSignatureElement = document.getElementById('function-signature');
        if (functionSignatureElement && functionSignatureElement.value) {
            initialCode = functionSignatureElement.value + '\n    # Your code here\n    pass\n';
        }

        // Determine language based on function signature
        let language = 'python';  // Default to Python
        if (initialCode.includes('function') && initialCode.includes('{')) {
            language = 'javascript';
        }

        var editor = monaco.editor.create(editorElement, {
            value: initialCode,
            language: language,
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: {
                enabled: false
            }
        });

        console.log("Monaco editor initialized successfully");

        // Make editor accessible globally
        window.monacoEditor = editor;
    } catch (error) {
        console.error("Error initializing Monaco editor:", error);
    }
});

// Initialize Webcam and Audio
const video = document.getElementById('videoElement');
const timerDisplay = document.getElementById('timer-display');
const currentTimeDisplay = document.getElementById('current-time');
const sendButton = document.getElementById('send-button');
const userInput = document.getElementById('user-input');
const chatMessages = document.getElementById('chat-messages');
const leaveButton = document.getElementById('leave-button');
const muteButton = document.getElementById('mute-button');
const toggleVideoBtn = document.getElementById('toggle-video');
const videoContainer = document.querySelector('.video-container');
const resizeHandle = document.getElementById('question-editor-resize');
let conversation = [];

// Initialize resize functionality
function initResizeHandle() {
    const mainContent = document.querySelector('.main-content');
    const questionContainer = document.querySelector('.question-container');
    const editorContainer = document.querySelector('.editor-container');
    const rightSection = document.querySelector('.right-section');
    let isResizing = false;
    let startX, startWidth;

    // Set initial grid template on page load to ensure proper layout
    function setInitialLayout() {
        const totalWidth = mainContent.getBoundingClientRect().width;
        // Use exactly 33.33% for right section, but convert to pixels
        const rightSectionWidth = Math.floor(totalWidth * 0.3333);
        // Account for the resize handle (10px) and the margin between editor and right section (10px)
        const availableWidth = totalWidth - rightSectionWidth - 10 - 10;
        // Split the available width equally between question and editor
        const questionWidth = Math.floor(availableWidth * 0.5);
        const editorWidth = availableWidth - questionWidth;

        // Apply the initial grid template
        mainContent.style.gridTemplateColumns = `${questionWidth}px 10px ${editorWidth}px ${rightSectionWidth}px`;
    }

    // Call on initialization
    if (window.innerWidth > 1200) {
        setInitialLayout();
    }

    resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        startX = e.clientX;
        startWidth = questionContainer.getBoundingClientRect().width;

        // Add a class to indicate resizing is in progress
        document.body.classList.add('resizing');

        // Prevent text selection during resize
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;

        const deltaX = e.clientX - startX;
        const newWidth = startWidth + deltaX;
        const totalWidth = mainContent.getBoundingClientRect().width;

        // Calculate the right section width (exactly 33.33% of total width)
        const rightSectionWidth = Math.floor(totalWidth * 0.3333);

        // Available width for question and editor (accounting for resize handle and margin)
        const availableWidth = totalWidth - rightSectionWidth - 10 - 10; // 10px for resize handle, 10px for margin

        // Ensure minimum widths and prevent overflow
        if (newWidth > 100 && (availableWidth - newWidth) > 100 && newWidth < availableWidth) {
            // Calculate editor width based on available space
            const editorWidth = availableWidth - newWidth;

            // Apply the new grid template with fixed pixel values
            mainContent.style.gridTemplateColumns = `${newWidth}px 10px ${editorWidth}px ${rightSectionWidth}px`;

            // Log for debugging
            console.log(`Grid template: ${newWidth}px 10px ${editorWidth}px ${rightSectionWidth}px`);
            console.log(`Total width: ${totalWidth}, Sum: ${newWidth + 10 + editorWidth + rightSectionWidth}`);
        }
    });

    document.addEventListener('mouseup', () => {
        isResizing = false;
        document.body.classList.remove('resizing');
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        // Reset custom grid template if window is resized
        if (window.innerWidth <= 1200) {
            mainContent.style.gridTemplateColumns = '';
        } else {
            setInitialLayout();
        }
    });
}

// Initialize video toggle functionality
function initVideoToggle() {
    toggleVideoBtn.addEventListener('click', () => {
        videoContainer.classList.toggle('collapsed');

        // Update the toggle button icon (handled by CSS rotation)

        // Ensure Monaco editor layout is updated
        if (window.monacoEditor) {
            window.monacoEditor.layout();
        }
    });
}

// Initialize UI components after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initResizeHandle();
    initVideoToggle();
});

// Update current time
function updateCurrentTime() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;

    currentTimeDisplay.textContent = `${formattedHours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${ampm}`;
}

// Update time every second
setInterval(updateCurrentTime, 1000);
updateCurrentTime(); // Initial update

// Voice Recording Variables
let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let isMuted = true; // Start with microphone muted by default
let isProcessing = false; // Flag to track if audio is being processed
let audioElement = null;
let isBotSpeaking = false;

// Initialize video and audio stream
let videoStream;
let audioStream; // Separate audio stream for recording
navigator.mediaDevices
    .getUserMedia({ video: true, audio: true })
    .then((stream) => {
        videoStream = stream;
        video.srcObject = stream;

        // Always keep video element muted to prevent echo
        video.muted = true;

        // Create a separate audio context for recording only
        setupAudioRecording(stream);

        // Mute audio tracks by default
        videoStream.getAudioTracks().forEach(track => {
            track.enabled = !isMuted;
        });

        // Update button appearance to show initial muted state
        updateMuteButtonState();

        // Get initial welcome message from the AI
        getWelcomeMessage();
    })
    .catch((error) => {
        console.error("Error accessing webcam:", error);
        appendMessage('System', 'Error accessing camera or microphone. Please check permissions.');
    });

// Setup audio recording separately from video playback
function setupAudioRecording(stream) {
    try {
        // Initialize media recorder for voice input
        mediaRecorder = new MediaRecorder(stream);
        setupMediaRecorder();

        console.log("Audio recording setup complete");
    } catch (error) {
        console.error("Error setting up audio recording:", error);
        appendMessage('System', 'Error setting up audio recording. Please try again.');
    }
}

// Function to get welcome message from the AI
async function getWelcomeMessage() {
    try {
        // Show loading indicator
        showLoadingIndicator('welcome');

        // Set processing state to disable microphone button during welcome message loading
        isProcessing = true;
        updateMuteButtonState();

        const response = await fetch(getResponseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,
            },
            body: JSON.stringify({
                message: "Hello, I'm ready for my technical interview.",
                assessment_type: 'technical'
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Remove loading indicator
        removeLoadingIndicator();

        if (data.message) {
            appendMessage('Assistant', data.message);
            botStartedSpeaking();
            await synthesizeSpeech(data.message);
            botStoppedSpeaking();
        }
    } catch (error) {
        console.error('Error getting welcome message:', error);
        removeLoadingIndicator();
        appendMessage('Assistant', 'Welcome to your technical interview. When you\'re ready to respond, click the microphone button to begin speaking.');
    } finally {
        // Reset processing state after welcome message is complete
        isProcessing = false;
        updateMuteButtonState();
    }
}

// Function to start recording
function startRecording() {
    if (mediaRecorder && mediaRecorder.state === 'inactive' && !isMuted && !isProcessing) {
        audioChunks = [];
        mediaRecorder.start();
        isRecording = true;
        console.log('Recording started');

        // Visual feedback that recording is active
        muteButton.classList.add('recording');
    }
}

// Function to stop recording
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        isRecording = false;
        console.log('Recording stopped');

        // Visual feedback that recording has stopped
        muteButton.classList.remove('recording');

        // Set processing state
        isProcessing = true;
        updateMuteButtonState();
    }
}

// Setup MediaRecorder event handlers
function setupMediaRecorder() {
    mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
        if (audioChunks.length === 0) {
            isProcessing = false;
            updateMuteButtonState();
            return;
        }

        try {
            // Show loading indicator for transcription
            showLoadingIndicator('transcribing');

            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            audioChunks = [];

            // Create form data and send to backend
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.wav');

            const response = await fetch(processAudioUrl, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrftoken,
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.recognized_text) {
                // Remove the loading indicator
                removeLoadingIndicator();

                appendMessage('You', data.recognized_text);

                // Show loading indicator for AI response
                showLoadingIndicator('generating');

                // Get AI response
                const aiResponse = await fetch(getResponseUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken,
                    },
                    body: JSON.stringify({
                        message: data.recognized_text,
                        assessment_type: 'technical'
                    })
                });

                if (!aiResponse.ok) {
                    throw new Error(`HTTP error! status: ${aiResponse.status}`);
                }

                const aiData = await aiResponse.json();

                // Remove loading indicator
                removeLoadingIndicator();

                if (aiData.message) {
                    appendMessage('Assistant', aiData.message);
                    botStartedSpeaking();
                    await synthesizeSpeech(aiData.message);
                    botStoppedSpeaking();
                }
            } else {
                removeLoadingIndicator();
                appendMessage('System', 'No speech detected. Please try again.');
            }
        } catch (error) {
            console.error('Error processing audio:', error);
            removeLoadingIndicator();
            appendMessage('System', `Error: ${error.message}. Please try again.`);
        } finally {
            // Reset processing state
            isProcessing = false;
            updateMuteButtonState();
        }
    };
}

// Function to show loading indicator
function showLoadingIndicator(type = 'default') {
    const loadingElement = document.createElement('div');
    loadingElement.className = 'loading-indicator';

    let loadingText = '';
    switch (type) {
        case 'transcribing':
            loadingText = 'Transcribing audio...';
            break;
        case 'generating':
            loadingText = 'Generating response...';
            break;
        case 'welcome':
            loadingText = 'Loading interview...';
            break;
        default:
            loadingText = 'Processing...';
    }

    loadingElement.innerHTML = `
        <div class="loading-circle"></div>
        <div class="loading-text">${loadingText}</div>
    `;
    loadingElement.id = 'loading-indicator';
    chatMessages.appendChild(loadingElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Function to remove loading indicator
function removeLoadingIndicator() {
    const loadingElement = document.getElementById('loading-indicator');
    if (loadingElement) {
        loadingElement.remove();
    }
}

// Function when bot starts speaking
function botStartedSpeaking() {
    console.log('Bot started speaking');
    isBotSpeaking = true;
    updateMuteButtonState();
}

// Function when bot stops speaking
function botStoppedSpeaking() {
    console.log('Bot stopped speaking');
    isBotSpeaking = false;
    updateMuteButtonState();
}

// Update mute button state based on current status
function updateMuteButtonState() {
    // Update button appearance
    muteButton.classList.toggle('active', isMuted);

    // Disable button during processing
    if (isProcessing || isBotSpeaking) {
        muteButton.disabled = true;
        muteButton.classList.add('disabled');
    } else {
        muteButton.disabled = false;
        muteButton.classList.remove('disabled');
    }
}

// Timer Functionality
let startTime = Date.now();
let timerInterval;
const duration = parseInt(document.getElementById('interview-duration').value) || 30;
let timeRemaining = duration * 60; // Convert to seconds

function updateTimer() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    if (timeRemaining <= 0) {
        clearInterval(timerInterval);
        alert('Interview time is up!');
        saveAssessment();
    } else {
        timeRemaining--;
    }
}

// Start the timer immediately
timerInterval = setInterval(updateTimer, 1000);

// Helper: Get CSRF Token
function getCookie(name) {
    if (name === 'csrftoken') {
        // First try to get from meta tag
        const metaTag = document.querySelector('meta[name="csrf-token"]');
        if (metaTag) {
            const token = metaTag.getAttribute('content');
            console.log('CSRF token found in meta tag');
            return token;
        }
        console.log('CSRF token not found in meta tag, trying cookies');
    }

    // Try cookies as fallback
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const trimmed = cookie.trim();
        if (trimmed.startsWith(name + '=')) {
            const token = decodeURIComponent(trimmed.substring(name.length + 1));
            console.log('CSRF token found in cookies');
            return token;
        }
    }

    console.error('CSRF token not found in meta tag or cookies');
    return null;
}

// Initialize CSRF token with more detailed logging
const csrftoken = getCookie('csrftoken');
if (!csrftoken) {
    console.error('CSRF token initialization failed. Form submissions will fail.');
    console.error('Meta tag status:', document.querySelector('meta[name="csrf-token"]') ? 'present' : 'missing');
    console.error('Cookie status:', document.cookie.includes('csrftoken') ? 'present' : 'missing');
} else {
    console.log('CSRF token successfully initialized');
}

// Append a Message to the Chat
function appendMessage(sender, message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Only add user and assistant messages to the conversation history
    if (sender === 'You' || sender === 'Assistant') {
        conversation.push({ sender, message });
    }
}

// Synthesize Speech
async function synthesizeSpeech(text) {
    try {
        const response = await fetch(synthesizeTextUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-CSRFToken': csrftoken,
            },
            body: new URLSearchParams({ text }),
        });

        const blob = await response.blob();

        // Create and play audio
        if (audioElement) {
            // If there's an existing audio element, clean it up
            audioElement.pause();
            audioElement.remove();
        }

        audioElement = new Audio(URL.createObjectURL(blob));

        // Add event listener for when audio ends
        audioElement.addEventListener('ended', () => {
            botStoppedSpeaking();
            updateMuteButtonState();
        });

        // Play the audio
        await audioElement.play();

        return new Promise((resolve) => {
            audioElement.onended = resolve;
        });
    } catch (error) {
        console.error('Speech synthesis error:', error);
        botStoppedSpeaking();
        updateMuteButtonState();
    }
}

// Send a Text Message
async function sendMessage() {
    const message = userInput.value.trim();
    if (message === '' || isProcessing) return;

    appendMessage('You', message);
    userInput.value = '';
    userInput.style.height = 'auto';

    // Set processing state
    isProcessing = true;
    updateMuteButtonState();

    // Show loading indicator
    showLoadingIndicator('generating');

    try {
        const response = await fetch(getResponseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,
            },
            body: JSON.stringify({
                message,
                assessment_type: 'technical'
            }),
        });

        // Remove loading indicator
        removeLoadingIndicator();

        const data = await response.json();

        if (data.message) {
            appendMessage('Assistant', data.message);
            botStartedSpeaking();
            await synthesizeSpeech(data.message);
            botStoppedSpeaking();
        } else if (data.error) {
            appendMessage('Error', data.error);
        }
    } catch (error) {
        console.error('Error:', error);
        removeLoadingIndicator();
        appendMessage('Error', 'Failed to get response from the assistant.');
    } finally {
        // Reset processing state
        isProcessing = false;
        updateMuteButtonState();
    }
}

// Function to show leave confirmation modal
function showLeaveConfirmation() {
    // Create modal if it doesn't exist
    if (!document.getElementById('leaveModal')) {
        const modalHTML = `
        <div id="leaveModal" class="modal">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>Leave Interview</h2>
                </div>
                <div class="modal-body">
                    <div class="warning-icon">⚠️</div>
                    <p>Are you sure you want to leave this interview?</p>
                    <p class="warning-text">Your progress will be saved, but the interview will end.</p>
                </div>
                <div class="modal-footer">
                    <button id="cancelLeaveBtn" class="btn-cancel">Cancel</button>
                    <button id="confirmLeaveBtn" class="btn-confirm-delete">Leave Interview</button>
                </div>
            </div>
        </div>
        `;

        // Append modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Set up event listeners for the modal
        const leaveModal = document.getElementById('leaveModal');
        const cancelLeaveBtn = document.getElementById('cancelLeaveBtn');
        const confirmLeaveBtn = document.getElementById('confirmLeaveBtn');

        // Close modal when clicking outside
        leaveModal.addEventListener('click', function (event) {
            if (event.target === leaveModal) {
                hideLeaveConfirmation();
            }
        });

        // Close modal when clicking cancel
        cancelLeaveBtn.addEventListener('click', hideLeaveConfirmation);

        // Confirm leave when clicking confirm
        confirmLeaveBtn.addEventListener('click', function () {
            hideLeaveConfirmation();
            endInterview();
        });
    }

    // Show the modal
    const leaveModal = document.getElementById('leaveModal');
    leaveModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Function to hide leave confirmation modal
function hideLeaveConfirmation() {
    const leaveModal = document.getElementById('leaveModal');
    if (leaveModal) {
        leaveModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Function to end the interview and save assessment
function endInterview() {
    clearInterval(timerInterval);

    // Stop recording if active
    if (isRecording) {
        mediaRecorder.stop();
        isRecording = false;
    }

    // Stop all tracks
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
    }

    saveAssessment();
}

// Event Listeners
sendButton.addEventListener('click', sendMessage);

// Handle text input
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Auto-resize text area
userInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

// Handle Mute Button Click
muteButton.addEventListener('click', () => {
    // Don't allow changes during processing
    if (isProcessing || isBotSpeaking) {
        return;
    }

    isMuted = !isMuted;

    // Keep video element muted regardless of microphone state to prevent echo
    video.muted = true;

    // Handle audio recording
    if (isMuted) {
        if (isRecording) {
            stopRecording();
        }
    } else {
        // Start recording when unmuted
        startRecording();
    }

    // Toggle audio tracks
    if (videoStream) {
        videoStream.getAudioTracks().forEach(track => {
            track.enabled = !isMuted;
        });
    }

    // Update button appearance
    updateMuteButtonState();
});

// Function to Save Assessment
function saveAssessment() {
    if (conversation.length === 0) {
        showNotificationPopup('No conversation to save.', 'error');
        return;
    }

    fetch('/assessments/save/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken,
        },
        body: JSON.stringify({
            conversation: conversation,
            assessment_type: 'technical'
        }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.message) {
                // Create a success popup that will be shown on the assessments list page
                localStorage.setItem('assessment_saved', 'true');
                localStorage.setItem('assessment_message', data.message);

                // Redirect to assessments list page
                window.location.href = '/assessments/list/';
            } else if (data.error) {
                showNotificationPopup(`Error: ${data.error}`, 'error');
            }
        })
        .catch((error) => {
            console.error('Save Assessment Error:', error);
            showNotificationPopup('Error saving assessment. Please try again.', 'error');
        });
}

// Function to show notification popup
function showNotificationPopup(message, type = 'success') {
    // Create popup if it doesn't exist
    if (!document.getElementById('notificationPopup')) {
        const popupHTML = `
        <div id="notificationPopup" class="success-popup ${type === 'error' ? 'error-popup' : ''}">
            <div class="success-content">
                <span class="success-icon">${type === 'error' ? '✕' : '✓'}</span>
                <p id="notificationMessage"></p>
            </div>
        </div>
        `;

        // Append popup to body
        document.body.insertAdjacentHTML('beforeend', popupHTML);
    }

    // Update popup message and show it
    const popup = document.getElementById('notificationPopup');
    const messageElement = document.getElementById('notificationMessage');

    // Update class based on type
    popup.className = `success-popup ${type === 'error' ? 'error-popup' : ''}`;

    // Set message
    messageElement.textContent = message;

    // Show popup
    popup.style.display = 'block';

    // Hide popup after 3 seconds
    setTimeout(function () {
        popup.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(function () {
            popup.style.display = 'none';
            popup.style.animation = 'slideIn 0.3s ease-out';
        }, 300);
    }, 3000);
}

// Handle Leave Button Click - Show confirmation instead of immediate action
leaveButton.addEventListener('click', showLeaveConfirmation);

// Initialize the UI with proper button state
window.addEventListener('DOMContentLoaded', () => {
    // Set initial mute button state
    updateMuteButtonState();
});
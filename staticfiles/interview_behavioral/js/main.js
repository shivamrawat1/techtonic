// interview_behavioral/static/js/mainb.js

// Immediately log that the script is running
console.log("main.js is running");

// Initialize Webcam and Audio
const video = document.getElementById('videoElement');
const timerDisplay = document.getElementById('timer-display');
const currentTimeDisplay = document.getElementById('current-time');
const sendButton = document.getElementById('send-button');
const userInput = document.getElementById('user-input');
const chatMessages = document.getElementById('chat-messages');
const leaveButton = document.getElementById('leave-button');
const muteButton = document.getElementById('mute-button');
let conversation = [];

// WebSocket for real-time transcription
let transcriptionSocket = null;
let isTranscribing = false;
const transcriptionDisplay = document.createElement('div');
transcriptionDisplay.className = 'transcription-display';
transcriptionDisplay.innerHTML = '<div class="transcription-status">Waiting to start...</div><div class="transcription-text"></div>';
document.querySelector('.chat-interface').insertBefore(transcriptionDisplay, chatMessages);

// Initialize WebSocket connection
function initWebSocket() {
    // Get the protocol (ws or wss)
    const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    // Create WebSocket connection
    transcriptionSocket = new WebSocket(`${protocol}${window.location.host}/ws/interview/transcribe/`);

    // Connection opened
    transcriptionSocket.addEventListener('open', (event) => {
        console.log('WebSocket connection established');
        updateTranscriptionStatus('Connected');

        // Send start command
        transcriptionSocket.send(JSON.stringify({
            command: 'start'
        }));
    });

    // Listen for messages
    transcriptionSocket.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);

        if (data.type === 'transcript') {
            // Update the transcription display
            const transcriptionText = document.querySelector('.transcription-text');
            transcriptionText.textContent = data.transcript;

            // If this is a final result, add it to the chat
            if (data.is_final && data.transcript.trim()) {
                // Only add to chat if it's not empty
                appendMessage('You', data.transcript);

                // Get AI response
                getAIResponse(data.transcript);
            }
        } else if (data.type === 'status') {
            updateTranscriptionStatus(data.message);
        } else if (data.type === 'error') {
            console.error('WebSocket error:', data.message);
            updateTranscriptionStatus(`Error: ${data.message}`);
        }
    });

    // Connection closed
    transcriptionSocket.addEventListener('close', (event) => {
        console.log('WebSocket connection closed');
        updateTranscriptionStatus('Disconnected');

        // Try to reconnect after a delay
        setTimeout(() => {
            if (!transcriptionSocket || transcriptionSocket.readyState === WebSocket.CLOSED) {
                initWebSocket();
            }
        }, 3000);
    });

    // Connection error
    transcriptionSocket.addEventListener('error', (event) => {
        console.error('WebSocket error:', event);
        updateTranscriptionStatus('Connection error');
    });
}

// Update the transcription status display
function updateTranscriptionStatus(status) {
    const statusElement = document.querySelector('.transcription-status');
    if (statusElement) {
        statusElement.textContent = `Status: ${status}`;
    }
}

// Start transcription
function startTranscription() {
    if (transcriptionSocket && transcriptionSocket.readyState === WebSocket.OPEN) {
        isTranscribing = true;
        updateTranscriptionStatus('Listening...');

        // Start sending audio data
        if (mediaRecorder && mediaRecorder.state === 'inactive') {
            startStreamingAudio();
        }
    } else {
        console.error('WebSocket not connected');
        updateTranscriptionStatus('Not connected');

        // Try to reconnect
        initWebSocket();
    }
}

// Stop transcription
function stopTranscription() {
    isTranscribing = false;
    updateTranscriptionStatus('Stopped');

    if (transcriptionSocket && transcriptionSocket.readyState === WebSocket.OPEN) {
        transcriptionSocket.send(JSON.stringify({
            command: 'stop'
        }));
    }

    // Stop streaming audio
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    }
}

// Get AI response for a transcript
async function getAIResponse(transcript) {
    try {
        const response = await fetch('/interview_behavioral/get_response/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,
            },
            body: JSON.stringify({ message: transcript })
        });
        const data = await response.json();

        if (data.message) {
            appendMessage('Assistant', data.message);
            synthesizeSpeech(data.message);
        }
    } catch (error) {
        console.error('Error getting AI response:', error);
    }
}

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
let isMuted = false;

// Initialize video and audio stream
let videoStream;
navigator.mediaDevices
    .getUserMedia({ video: true, audio: true })
    .then((stream) => {
        videoStream = stream;
        video.srcObject = stream;
        // Initialize media recorder for voice input
        setupMediaRecorder(stream);
        // Start WebSocket connection
        initWebSocket();
        // Start transcription by default when unmuted
        if (!isMuted) {
            startTranscription();
        }
    })
    .catch((error) => {
        console.error("Error accessing webcam:", error);
    });

// Setup MediaRecorder for streaming audio
function setupMediaRecorder(stream) {
    // Create a new MediaRecorder with the stream
    mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 16000
    });

    // Set up event handlers
    mediaRecorder.ondataavailable = handleAudioData;
    mediaRecorder.onstop = handleRecordingStopped;

    console.log('MediaRecorder initialized');
}

// Start streaming audio in small chunks
function startStreamingAudio() {
    if (mediaRecorder && mediaRecorder.state === 'inactive' && !isMuted) {
        audioChunks = [];
        // Start recording with small time slices (250ms)
        mediaRecorder.start(250);
        isRecording = true;
        console.log('Streaming audio started');
    }
}

// Handle audio data from MediaRecorder
function handleAudioData(event) {
    if (event.data.size > 0 && isTranscribing) {
        // If WebSocket is connected, send the audio chunk
        if (transcriptionSocket && transcriptionSocket.readyState === WebSocket.OPEN) {
            // Convert to the format expected by Deepgram
            const reader = new FileReader();
            reader.onloadend = () => {
                const arrayBuffer = reader.result;
                transcriptionSocket.send(arrayBuffer);
            };
            reader.readAsArrayBuffer(event.data);
        } else {
            // Store chunks for later processing if WebSocket is not available
            audioChunks.push(event.data);
        }
    }
}

// Handle recording stopped event
function handleRecordingStopped() {
    isRecording = false;
    console.log('Recording stopped');

    // If we have accumulated chunks and WebSocket is not available,
    // we can process them using the traditional HTTP endpoint
    if (audioChunks.length > 0 && (!transcriptionSocket || transcriptionSocket.readyState !== WebSocket.OPEN)) {
        processAudioChunks();
    }

    // Restart streaming if transcription is still active
    if (isTranscribing && !isMuted) {
        startStreamingAudio();
    }
}

// Process accumulated audio chunks using HTTP endpoint
async function processAudioChunks() {
    if (audioChunks.length === 0) return;

    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    audioChunks = [];

    // Create form data and send to backend
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    try {
        const response = await fetch('/interview_behavioral/process_audio/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrftoken,
            },
            body: formData
        });
        const data = await response.json();

        if (data.recognized_text) {
            appendMessage('You', data.recognized_text);
            // Get AI response
            getAIResponse(data.recognized_text);
        }
    } catch (error) {
        console.error('Error processing audio:', error);
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
    conversation.push({ sender, message });
}

// Synthesize Speech
function synthesizeSpeech(text) {
    fetch('/interview_behavioral/synthesize_text/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRFToken': csrftoken,
        },
        body: new URLSearchParams({ text }),
    })
        .then((response) => response.blob())
        .then((blob) => {
            const audio = new Audio(URL.createObjectURL(blob));
            audio.play();
        })
        .catch((error) => console.error('Speech synthesis error:', error));
}

// Send a Text Message
async function sendMessage() {
    const message = userInput.value.trim();
    if (message === '') return;

    appendMessage('You', message);
    userInput.value = '';
    userInput.style.height = 'auto';

    try {
        const response = await fetch('/interview_behavioral/get_response/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,
            },
            body: JSON.stringify({ message }),
        });
        const data = await response.json();

        if (data.message) {
            appendMessage('Assistant', data.message);
            synthesizeSpeech(data.message);
        } else if (data.error) {
            appendMessage('Error', data.error);
        }
    } catch (error) {
        console.error('Error:', error);
        appendMessage('Error', 'Failed to get response from the assistant.');
    }
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
    isMuted = !isMuted;

    // Toggle video mute
    video.muted = isMuted;

    // Handle audio recording
    if (isMuted) {
        stopTranscription();
    } else {
        startTranscription();
    }

    // Toggle audio tracks
    if (videoStream) {
        videoStream.getAudioTracks().forEach(track => {
            track.enabled = !isMuted;
        });
    }

    // Update button appearance
    muteButton.classList.toggle('active', isMuted);
});

// Function to Save Assessment
function saveAssessment() {
    if (conversation.length === 0) {
        alert('No conversation to save.');
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
            assessment_type: 'behavioral'
        }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.message) {
                alert(data.message);
                window.location.href = '/assessments/list/';
            } else if (data.error) {
                alert(`Error: ${data.error}`);
            }
        })
        .catch((error) => console.error('Save Assessment Error:', error));
}

// Handle Leave Button Click
leaveButton.addEventListener('click', () => {
    clearInterval(timerInterval);

    // Stop transcription
    stopTranscription();

    // Close WebSocket connection
    if (transcriptionSocket) {
        transcriptionSocket.close();
    }

    // Stop all tracks
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
    }

    saveAssessment();
});

// Immediately execute when script loads
(function () {
    console.log("Immediate execution started");

    // Get the elements
    const timerDisplay = document.getElementById('timer-display');
    const durationInput = document.getElementById('interview-duration');

    // Verify elements exist
    if (!timerDisplay || !durationInput) {
        console.error("Timer elements not found");
        return;
    }

    // Get duration value
    const duration = parseInt(durationInput.value) || 30;
    let seconds = duration * 60;

    // Update timer display
    function updateTimer() {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        timerDisplay.textContent = `Time Remaining: ${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;

        if (seconds === 0) {
            clearInterval(countdownInterval);
            timerDisplay.style.backgroundColor = 'rgba(255,0,0,0.7)';
            alert('Time is up!');
            if (typeof saveAssessment === 'function') {
                saveAssessment();
            }
        } else {
            seconds--;
        }
    }

    // Initial display
    updateTimer();

    // Start countdown
    const countdownInterval = setInterval(updateTimer, 1000);

    console.log("Timer initialized with duration:", duration, "minutes");
})();

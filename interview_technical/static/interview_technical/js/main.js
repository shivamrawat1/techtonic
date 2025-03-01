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

        // Keep right section at 1/3 of the total width
        const rightSectionWidth = totalWidth / 3;

        // Remaining width for question and editor containers (minus resize handle)
        const remainingWidth = totalWidth - rightSectionWidth - 10; // 10px for resize handle

        // Ensure minimum widths
        if (newWidth > 100 && (remainingWidth - newWidth) > 100) {
            // Set the width of question container and editor container
            mainContent.style.gridTemplateColumns = `${newWidth}px 10px ${remainingWidth - newWidth}px ${rightSectionWidth}px`;
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
let isMuted = false;

// Initialize video and audio stream
let videoStream;
navigator.mediaDevices
    .getUserMedia({ video: true, audio: true })
    .then((stream) => {
        videoStream = stream;
        video.srcObject = stream;
        // Initialize media recorder for voice input
        mediaRecorder = new MediaRecorder(stream);
        setupMediaRecorder();
        // Start recording by default when unmuted
        if (!isMuted) {
            startRecording();
        }
    })
    .catch((error) => {
        console.error("Error accessing webcam:", error);
    });

// Function to start recording
function startRecording() {
    if (mediaRecorder && mediaRecorder.state === 'inactive' && !isMuted) {
        audioChunks = [];
        mediaRecorder.start();
        isRecording = true;
        console.log('Recording started');
    }
}

// Function to stop recording
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        isRecording = false;
        console.log('Recording stopped');
    }
}

// Setup MediaRecorder event handlers
function setupMediaRecorder() {
    mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
        if (audioChunks.length === 0) return;

        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        audioChunks = [];

        // Create form data and send to backend
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.wav');

        try {
            const response = await fetch(processAudioUrl, {
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
                const aiData = await aiResponse.json();
                if (aiData.message) {
                    appendMessage('Assistant', aiData.message);
                    synthesizeSpeech(aiData.message);
                }
            }

            // Start a new recording if not muted
            if (!isMuted) {
                startRecording();
            }
        } catch (error) {
            console.error('Error processing audio:', error);
            // Attempt to restart recording even if there was an error
            if (!isMuted) {
                startRecording();
            }
        }
    };
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
    fetch(synthesizeTextUrl, {
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
        stopRecording();
    } else {
        startRecording();
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
            assessment_type: 'technical'
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
});
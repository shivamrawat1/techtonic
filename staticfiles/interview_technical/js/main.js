// interview_technical/static/js/main.js

// Wait for DOM content to be loaded
document.addEventListener('DOMContentLoaded', function () {
    // Initialize Monaco Editor with proper loading sequence
    require(['vs/editor/editor.main'], function () {
        // Create editor instance
        const editorContainer = document.getElementById('editor');
        if (!editorContainer) {
            console.error('Editor container not found');
            return;
        }

        try {
            window.editor = monaco.editor.create(editorContainer, {
                value: '// Write your code here\n',
                language: 'javascript',
                theme: 'vs-dark',
                automaticLayout: true,
                minimap: {
                    enabled: false
                },
                scrollBeyondLastLine: false,
                fontSize: 14,
                lineNumbers: 'on',
                renderLineHighlight: 'all',
                roundedSelection: false,
                scrollbar: {
                    vertical: 'visible',
                    horizontal: 'visible'
                }
            });

            // Handle window resize
            window.addEventListener('resize', function () {
                if (window.editor) {
                    window.editor.layout();
                }
            });

            console.log('Monaco editor initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Monaco editor:', error);
        }
    });

    // Initialize video with proper constraints
    const video = document.getElementById('videoElement');
    if (video) {
        navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: true
        })
            .then(stream => {
                video.srcObject = stream;
                window.videoStream = stream;
                initializeAudioRecording(stream);
            })
            .catch(err => console.error('Error accessing media devices:', err));
    }

    // Initialize timer
    initializeTimer();

    // Initialize event listeners
    initializeEventListeners();
});

// Add layout refresh on visibility change
document.addEventListener('visibilitychange', function () {
    if (!document.hidden && window.editor) {
        window.editor.layout();
    }
});

// Initialize Split.js
Split(['.editor-pane', '.video-chat-pane'], {
    sizes: [50, 50],
    minSize: [300, 300],
    gutterSize: 8,
    cursor: 'col-resize'
});

// Initialize timer
function initializeTimer() {
    const timerDisplay = document.getElementById('timer-display');
    const duration = parseInt(document.getElementById('interview-duration').value) || 30;
    let timeRemaining = duration * 60;

    window.timerInterval = setInterval(() => {
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        if (timeRemaining <= 0) {
            clearInterval(window.timerInterval);
            handleInterviewEnd();
        } else {
            timeRemaining--;
        }
    }, 1000);
}

// Initialize event listeners
function initializeEventListeners() {
    const sendButton = document.getElementById('send-button');
    const userInput = document.getElementById('user-input');
    const leaveButton = document.getElementById('leave-button');
    const muteButton = document.getElementById('mute-button');

    sendButton.addEventListener('click', handleSendMessage);
    userInput.addEventListener('keypress', handleInputKeypress);
    leaveButton.addEventListener('click', handleLeave);
    muteButton.addEventListener('click', handleMute);
}

// Webcam setup
var video = document.getElementById('videoElement');
if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(function (stream) {
            video.srcObject = stream;
        })
        .catch(function (error) {
            console.log("Something went wrong!", error);
        });
}

// Chat setup
var sendButton = document.getElementById('send-button');
var userInput = document.getElementById('user-input');
var chatMessages = document.getElementById('chat-messages');
var voiceButton = document.getElementById('voice-button');
var leaveButton = document.getElementById('leave-button');  // Leave button
var conversation = [];  // Store conversation for scoring and saving

// Get CSRF token from cookie
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        let cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
let csrftoken = getCookie('csrftoken');

// Voice Recording Variables
let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let recordingStream = null;

// Update the voice button click handler
voiceButton.addEventListener('click', () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Your browser does not support audio recording.');
        return;
    }

    if (isRecording) {
        // Stop Recording
        stopRecording();
    } else {
        // Start Recording
        startRecording();
    }
});

function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
            recordingStream = stream;
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                processRecording(audioBlob);
            };

            mediaRecorder.start();
            voiceButton.textContent = '⏹️'; // Change to pause icon instead of stop icon
            isRecording = true;
        })
        .catch((error) => {
            console.error("Error accessing microphone:", error);
            alert('Could not access your microphone.');
        });
}

function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        recordingStream.getTracks().forEach(track => track.stop());
        voiceButton.textContent = '🎤'; // Change back to mic icon
        isRecording = false;
    }
}

function processRecording(audioBlob) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');

    fetch(processAudioUrl, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken,
        },
        body: formData,
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.recognized_text) {
                appendMessage('You (Voice)', data.recognized_text);
                // Send recognized text to the assistant
                return fetch(getResponseUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken,
                    },
                    body: JSON.stringify({
                        message: data.recognized_text,
                        assessment_type: 'technical'
                    }),
                });
            } else {
                throw new Error(data.error || 'No transcription received');
            }
        })
        .then((response) => response.json())
        .then((data) => {
            if (data.message) {
                appendMessage('Assistant', data.message);
                synthesizeSpeech(data.message);
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            appendMessage('Error', error.message);
        });
}

// Function to synthesize speech
function synthesizeSpeech(text) {
    fetch(synthesizeTextUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRFToken': csrftoken,
        },
        body: new URLSearchParams({ text }),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error('Synthesis failed');
            }
            return response.blob();
        })
        .then((blob) => {
            const audioUrl = URL.createObjectURL(blob);
            const audio = new Audio(audioUrl);
            audio.play();
        })
        .catch((error) => console.error('Synthesis Error:', error));
}

// Handle sending message
sendButton.addEventListener('click', function () {
    var message = userInput.value;
    if (message.trim() === '') return;
    appendMessage('You', message);
    userInput.value = '';

    // Send message to server and handle response
    fetch('/interview/get_response/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken,
        },
        body: JSON.stringify({
            message: message,
            assessment_type: 'technical' // Include assessment_type
        })
    })
        .then(response => response.json())
        .then(data => {
            appendMessage('Assistant', data.message);
        });
});

// Handle speech synthesis using ElevenLabs
function speak(text) {
    fetch('/interview/synthesize_text/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRFToken': csrftoken,
        },
        body: new URLSearchParams({ text: text })
    })
        .then(response => response.blob())
        .then(blob => {
            const audioUrl = URL.createObjectURL(blob);
            const audio = new Audio(audioUrl);
            audio.play();
        })
        .catch(error => {
            console.error('Error synthesizing speech:', error);
        });
}

// Append message and use ElevenLabs Speech Synthesis for Assistant's response
function appendMessage(sender, message) {
    var messageElement = document.createElement('div');
    messageElement.innerHTML = '<strong>' + sender + ':</strong> ' + message;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Add to conversation array for saving
    conversation.push({ sender: sender, message: message });

    if (sender === 'Assistant') {
        speak(message);
    }
}

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
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert(data.message);
                window.location.href = '/assessments/list/';
            } else {
                console.error('Error:', data.error);
                alert('Error saving conversation');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error saving conversation');
        });
}

// Handle Leave Button Click
leaveButton.addEventListener('click', function () {
    // Save the assessment
    saveAssessment();
});

// Timer setup
let timeLeft;
let timerInterval;

function startTimer(duration) {
    const timerDisplay = document.getElementById('timer-display');
    if (!timerDisplay) {
        console.error('Timer display element not found');
        return;
    }

    timeLeft = duration * 60; // Convert to seconds
    updateTimerDisplay(timerDisplay);

    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay(timerDisplay);

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert('Time is up!');
            saveAssessment();
        }
    }, 1000);
}

function updateTimerDisplay(timerDisplay) {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `Time Remaining: ${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Initialize timer when page loads
window.addEventListener('load', () => {
    const durationInput = document.getElementById('interview-duration');
    if (!durationInput) {
        console.error('Duration input element not found');
        return;
    }

    const duration = parseInt(durationInput.value) || 30;
    startTimer(duration);
});

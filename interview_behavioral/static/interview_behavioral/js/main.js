// interview_behavioral/static/js/mainb.js

// Immediately log that the script is running
console.log("mainb.js is running");

// Initialize Webcam for Video Feed
const video = document.getElementById('videoElement');
navigator.mediaDevices
    .getUserMedia({ video: true })
    .then((stream) => {
        video.srcObject = stream;
    })
    .catch((error) => {
        console.error("Error accessing webcam:", error);
    });

// Chat Functionality
const sendButton = document.getElementById('send-button');
const userInput = document.getElementById('user-input');
const chatMessages = document.getElementById('chat-messages');
const voiceButton = document.getElementById('voice-button');
const leaveButton = document.getElementById('leave-button');
let conversation = [];

// Voice Recording Variables
let mediaRecorder;
let audioChunks = [];
let isRecording = false;

// Helper: Get CSRF Token
function getCookie(name) {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const trimmed = cookie.trim();
        if (trimmed.startsWith(name + '=')) {
            return decodeURIComponent(trimmed.substring(name.length + 1));
        }
    }
    return null;
}
const csrftoken = getCookie('csrftoken');

// Append a Message to the Chat
function appendMessage(sender, message) {
    const messageElement = document.createElement('div');
    messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Store the conversation for grading
    conversation.push({ sender, message });
}

// Function to Synthesize Text to Speech (Optional)
function synthesizeSpeech(text) {
    fetch('/interview_behavioral/synthesize_text/', {
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

// Send a Text Message
sendButton.addEventListener('click', () => {
    const message = userInput.value.trim();
    if (message === '') return;

    appendMessage('You', message);
    userInput.value = '';

    fetch('/interview_behavioral/get_response/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken,
        },
        body: JSON.stringify({ message }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.message) {
                appendMessage('Assistant', data.message);
                // Optionally synthesize speech
                synthesizeSpeech(data.message);
            } else if (data.error) {
                appendMessage('Error', data.error);
            }
        })
        .catch((error) => console.error('Error:', error));
});

// Handle Voice Button Click
voiceButton.addEventListener('click', () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Your browser does not support audio recording.');
        return;
    }

    if (isRecording) {
        // Stop Recording
        mediaRecorder.stop();
        voiceButton.textContent = '🎤'; // Reset button icon
        isRecording = false;
    } else {
        // Start Recording
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then((stream) => {
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.start();
                voiceButton.textContent = '⏹️'; // Change button icon to indicate recording
                isRecording = true;

                mediaRecorder.ondataavailable = (event) => {
                    audioChunks.push(event.data);
                };

                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    audioChunks = [];
                    stream.getTracks().forEach(track => track.stop()); // Stop all tracks

                    // Upload the audio blob to the backend
                    const formData = new FormData();
                    formData.append('audio', audioBlob, 'recording.wav');

                    fetch('/interview_behavioral/process_audio/', {
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
                                fetch('/interview_behavioral/get_response/', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'X-CSRFToken': csrftoken,
                                    },
                                    body: JSON.stringify({ message: data.recognized_text }),
                                })
                                    .then((response) => response.json())
                                    .then((data) => {
                                        if (data.message) {
                                            appendMessage('Assistant', data.message);
                                            // Optionally synthesize speech
                                            synthesizeSpeech(data.message);
                                        } else if (data.error) {
                                            appendMessage('Error', data.error);
                                        }
                                    })
                                    .catch((error) => console.error('Error:', error));
                            } else if (data.error) {
                                appendMessage('Error', data.error);
                            }
                        })
                        .catch((error) => console.error('Error:', error));
                };
            })
            .catch((error) => {
                console.error("Error accessing microphone:", error);
                alert('Could not access your microphone.');
            });
    }
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
    // Save the assessment
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

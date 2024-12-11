// interview_technical/static/js/main.js

// Initialize Monaco Editor
require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.33.0/min/vs' } });
require(['vs/editor/editor.main'], function () {
    var editor = monaco.editor.create(document.getElementById('editor'), {
        value: '',
        language: 'javascript',
        theme: 'vs-dark'
    });
});

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

// Handle voice input using Deepgram
voiceButton.addEventListener('click', async function () {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            const audioChunks = [];

            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const formData = new FormData();
                formData.append('audio', audioBlob);

                try {
                    const response = await fetch('/interview/process_audio/', {
                        method: 'POST',
                        headers: {
                            'X-CSRFToken': csrftoken
                        },
                        body: formData
                    });
                    const data = await response.json();
                    if (data.recognized_text) {
                        userInput.value = data.recognized_text;
                        sendButton.click();
                    }
                } catch (error) {
                    console.error('Error processing audio:', error);
                }
            };

            mediaRecorder.start();
            setTimeout(() => {
                mediaRecorder.stop();
            }, 3000); // Record for 3 seconds
        } catch (error) {
            console.error('Error accessing microphone:', error);
        }
    }
});

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
            assessment_type: 'technical' // Specify the assessment type
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert(`Conversation saved with score: ${data.score}`);
                window.location.href = '/assessments/list/';  // Redirect to list page
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

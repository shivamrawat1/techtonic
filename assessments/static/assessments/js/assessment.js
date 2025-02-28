// Global namespace for assessment functions
window.AssessmentManager = {
    showConversation: function (assessmentId, conversationData) {
        console.log('Showing conversation:', conversationData);
        const popup = document.getElementById('conversationPopup');
        const container = popup.querySelector('.conversation-container');

        if (!popup) {
            console.error('Popup element not found');
            return;
        }

        if (!container) {
            console.error('Conversation container not found');
            return;
        }

        // Clear previous conversation
        container.innerHTML = '';

        try {
            // Add each message to the container
            conversationData.forEach(message => {
                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${message.sender === 'You' ? 'user-message' : 'assistant-message'}`;

                const senderDiv = document.createElement('div');
                senderDiv.className = 'message-sender';
                senderDiv.textContent = message.sender;

                const contentDiv = document.createElement('div');
                contentDiv.className = 'message-content';
                contentDiv.textContent = message.message;

                messageDiv.appendChild(senderDiv);
                messageDiv.appendChild(contentDiv);
                container.appendChild(messageDiv);
            });

            // Show the popup with animation
            popup.style.display = 'flex';
            if (typeof animatePopupOpen === 'function') {
                animatePopupOpen();
            }
        } catch (error) {
            console.error('Error displaying conversation:', error);
            alert('Error displaying conversation. Please try again.');
        }
    },

    closeConversationPopup: function () {
        const popup = document.getElementById('conversationPopup');
        if (popup) {
            const content = popup.querySelector('.popup-content');
            if (content) {
                // Add fade-out animation
                content.style.animation = 'modalSlideOut 0.3s ease-out';
                // Hide popup after animation completes
                setTimeout(() => {
                    popup.style.display = 'none';
                    // Reset animation for next time
                    content.style.animation = '';
                }, 300);
            } else {
                popup.style.display = 'none';
            }
        }
    },

    deleteAssessment: function (id) {
        if (confirm('Are you sure you want to delete this assessment?')) {
            fetch(`/assessments/delete/${id}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': this.getCookie('csrftoken')
                }
            })
                .then(response => response.json())
                .then(data => {
                    if (data.message) {
                        document.getElementById(`assessment-${id}`).remove();
                    } else {
                        alert('Error deleting assessment');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Error deleting assessment');
                });
        }
    },

    // Initialize popup functionality
    initializePopup: function () {
        const popup = document.getElementById('conversationPopup');
        if (!popup) {
            console.error('Conversation popup element not found during initialization');
            return;
        }

        // Close popup when clicking outside
        document.addEventListener('click', function (event) {
            if (event.target === popup) {
                AssessmentManager.closeConversationPopup();
            }
        });

        // Close popup when pressing Escape key
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                AssessmentManager.closeConversationPopup();
            }
        });
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    AssessmentManager.initializePopup();
}); 
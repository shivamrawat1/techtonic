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

    // Add getCookie function to retrieve CSRF token
    getCookie: function (name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    },

    deleteAssessment: function (id) {
        console.log(`Attempting to delete assessment with ID: ${id}`);

        // Ensure id is a number
        id = parseInt(id, 10);
        if (isNaN(id)) {
            console.error('Invalid assessment ID:', id);
            alert('Invalid assessment ID. Please try again.');
            return;
        }

        if (confirm('Are you sure you want to delete this assessment?')) {
            try {
                console.log(`Sending delete request for assessment ID: ${id}`);

                // Create and submit a form directly
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = `/assessments/delete/${id}/`;

                // Add CSRF token
                const csrfToken = this.getCookie('csrftoken');
                if (csrfToken) {
                    const csrfInput = document.createElement('input');
                    csrfInput.type = 'hidden';
                    csrfInput.name = 'csrfmiddlewaretoken';
                    csrfInput.value = csrfToken;
                    form.appendChild(csrfInput);
                }

                // Append form to body and submit
                document.body.appendChild(form);
                console.log('Submitting form for deletion');
                form.submit();

            } catch (error) {
                console.error('Exception in deleteAssessment:', error);
                alert('An unexpected error occurred. Please try again or refresh the page.');

                // Fallback: reload the page
                window.location.href = '/assessments/list/';
            }
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
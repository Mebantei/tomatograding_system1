document.addEventListener('DOMContentLoaded', () => {
    const sendBtn = document.getElementById('sendBtn');
    const userInput = document.getElementById('userInput');
    const imageInput = document.getElementById('imageInput');
    const chatHistory = document.getElementById('chatHistory');
    const selectedImageContainer = document.getElementById('selectedImageContainer');

    let selectedImageDataUrl = null;

    const resetImageSelection = () => {
        selectedImageDataUrl = null;
        selectedImageContainer.innerHTML = '';
        imageInput.value = '';
    };

    imageInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                selectedImageDataUrl = e.target.result;
                selectedImageContainer.innerHTML = `
                    <img src="${selectedImageDataUrl}" alt="Thumbnail">
                    <button class="remove-img-btn">×</button>
                `;
                selectedImageContainer.querySelector('.remove-img-btn').addEventListener('click', resetImageSelection);
            };
            reader.readAsDataURL(file);
        }
    });

    // --- NEW: Function to add a message to the chat history ---
    const addMessageToChat = (content, type) => {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message', type); // type can be 'user', 'ai', 'system'
        messageDiv.innerHTML = content; // Using innerHTML to render images and text
        chatHistory.appendChild(messageDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight; // Auto-scroll to bottom
    };

    // --- MODIFIED: Function to send data to the backend ---
    const sendMessage = async () => {
        const text = userInput.value.trim();
        if (!selectedImageDataUrl && !text) return;

        // 1. Display the user's message immediately
        let userMessageHTML = '';
        if (selectedImageDataUrl) {
            userMessageHTML += `<img src="${selectedImageDataUrl}" alt="User upload">`;
        }
        if (text) {
            userMessageHTML += `<p>${text}</p>`;
        }
        addMessageToChat(userMessageHTML, 'user');

        // Prepare the data to send to the backend
        const payload = {
            prompt: text,
            image: selectedImageDataUrl
        };

        // Clear the input area after displaying the user's message
        const originalImageDataUrl = selectedImageDataUrl; // Keep for the payload
        userInput.value = '';
        resetImageSelection();

        // 2. Add a loading indicator for the AI response
        addMessageToChat('<p>Thinking...</p>', 'ai');

        // 3. Send the data to the Flask server
        try {
            const response = await fetch('http://127.0.0.1:5000/ask-ai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            
            // Remove the "thinking..." message
            chatHistory.removeChild(chatHistory.lastChild);

            if (data.error) {
                addMessageToChat(`<p>Error: ${data.error}</p>`, 'system');
            } else {
                // Display the AI's actual response
                addMessageToChat(`<p>${data.response}</p>`, 'ai');
            }

        } catch (error) {
            // Remove the "thinking..." message
            chatHistory.removeChild(chatHistory.lastChild);
            console.error('Error:', error);
            addMessageToChat(`<p>Sorry, something went wrong. Could not connect to the server.</p>`, 'system');
        }
    };

    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent default form submission
            sendMessage();
        }
    });
});
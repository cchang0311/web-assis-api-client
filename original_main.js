document.addEventListener('DOMContentLoaded', (event) => {
    const inputField = document.querySelector('.input-area input');
    const sendButton = document.querySelector('.input-area button');
    const chatHistory = document.querySelector('#chat-history-window');
    const apiUrl = 'http://localhost:5500/api/generate-text?message=';

    const conversationStarters = [
        '안내 및 혜택',
        '문의(FAQ), 기타 문의, 예약'
    ];

    const starterContainer = document.createElement('div');
    starterContainer.style.border = '1px solid #ccc';
    starterContainer.style.padding = '1rem';
    starterContainer.style.marginBottom = '1rem';

    function addMessageToChatHistory(message) {
        const messageElement = document.createElement('p');
        messageElement.innerHTML = message; // Use innerHTML to allow HTML content
        chatHistory.appendChild(messageElement);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    conversationStarters.forEach(starter => {
        const starterElement = document.createElement('div');
        starterElement.textContent = starter;
        starterElement.style.border = '1px solid #ccc';
        starterElement.style.padding = '0.5rem';
        starterElement.style.marginBottom = '0.5rem';
        starterElement.style.cursor = 'pointer';
        starterElement.addEventListener('click', async () => {
            addMessageToChatHistory(`[User] ${starter}`);
            
            const textSection = document.querySelector('.text-section');
            textSection.style.overflowY = 'auto'; // Make text-section scrollable
            textSection.style.userSelect = 'text'; // Make text-section content selectable
            const starterTextElement = document.createElement('p');
            starterTextElement.textContent = starter;
            starterTextElement.style.cursor = 'pointer'; // Make the text clickable
            starterTextElement.addEventListener('click', () => {
                inputField.value = starter; // Copy the clicked text into input-area
                starterTextElement.style.color = 'blue'; // Change the color of the text when clicked
                inputField.focus(); // Move the cursor to input-area
            });
            textSection.appendChild(starterTextElement);
            textSection.scrollTop = textSection.scrollHeight; // Scroll to the bottom when overflow

            // Show busy cursor 
            document.body.style.cursor = 'wait';
            try {
                const response = await fetch(apiUrl + starter);
                const data = await response.json();
                addMessageToChatHistory(`${data.response}`);
            } catch (error) {
                console.error('Error from GET API', error);
            } finally {
                // Revert to default cursor
                document.body.style.cursor = 'default';
            }
        });
        starterContainer.appendChild(starterElement);
    });

    chatHistory.appendChild(starterContainer);

    sendButton.addEventListener('click', async () => {
        const message = inputField.value;
        if (message.trim() !== '') {
            inputField.value = '';
            addMessageToChatHistory(`[User] ${message}`);
            document.body.style.cursor = 'wait';
            try {

                const response = await fetch(apiUrl + message);
                const data = await response.json();
                addMessageToChatHistory(`${data.response}`);

                const textSection = document.querySelector('.text-section');
                textSection.style.overflowY = 'auto'; // Make text-section scrollable
                textSection.style.userSelect = 'text'; // Make text-section content selectable
                const messageTextElement = document.createElement('div'); // Changed from 'p' to 'div'
                messageTextElement.textContent = message;
                messageTextElement.style.cursor = 'pointer'; // Make the text clickable
                //messageTextElement.style.border = '1px solid #ccc'; // Added border for visibility
                //messageTextElement.style.padding = '0.5rem'; // Added padding for better appearance
                //messageTextElement.style.marginBottom = '0.5rem'; // Added margin for spacing
                messageTextElement.addEventListener('click', () => {
                    inputField.value = message; // Copy the clicked text into input-area
                    messageTextElement.style.color = 'blue'; // Change the color of the text when clicked
                    inputField.focus(); // Move the cursor to input-area
                });
                textSection.appendChild(messageTextElement);
                textSection.scrollTop = textSection.scrollHeight; // Scroll to the bottom when overflow    
            } catch (error) {
                console.error('Error from GET API', error);
            } finally {
                // Revert to default cursor
                document.body.style.cursor = 'default';
            }
        }
    });

    inputField.addEventListener('keypress', async (event) => {
        if (event.key === 'Enter') {
            const message = inputField.value;
            if (message.trim() !== '') {
                inputField.value = '';
                addMessageToChatHistory(`[User] ${message}`);
                document.body.style.cursor = 'wait';
                try {
                    const response = await fetch(apiUrl + message);
                    const data = await response.json();
                    addMessageToChatHistory(`${data.response}`);

                    const textSection = document.querySelector('.text-section');
                    textSection.style.overflowY = 'auto'; // Make text-section scrollable
                    textSection.style.userSelect = 'text'; // Make text-section content selectable
                    const messageTextElement = document.createElement('div'); // Changed from 'p' to 'div'
                    messageTextElement.textContent = message;
                    messageTextElement.style.cursor = 'pointer'; // Make the text clickable
                    //messageTextElement.style.border = '1px solid #ccc'; // Added border for visibility
                    //messageTextElement.style.padding = '0.5rem'; // Added padding for better appearance
                    //messageTextElement.style.marginBottom = '0.5rem'; // Added margin for spacing
                    messageTextElement.addEventListener('click', () => {
                        inputField.value = message; // Copy the clicked text into input-area
                        messageTextElement.style.color = 'blue'; // Change the color of the text when clicked
                        inputField.focus(); // Move the cursor to input-area    
                    });
                    textSection.appendChild(messageTextElement);
                    textSection.scrollTop = textSection.scrollHeight; 
                } catch (error) {
                    console.error('Error from GET API', error);
                } finally {
                    // Revert to default cursor
                    document.body.style.cursor = 'default';
                }
            }
        }
    });    
});
document.addEventListener('DOMContentLoaded', (event) => {
    const inputField_g = document.querySelector('.input-area input');
    const sendButton_g = document.querySelector('.input-area button');
    const chatHistory_g = document.querySelector('#chat-history-window');

    let accessToken_g;
    let threadSessionID_g;
    let conversationHistory_g = [];
    const conversationStarters = [
        '영어<->한국어 자동 번역 ',
        '영어 에세이 & 작문을 제출해 주시면 첨삭을 해드립니다영어 문제풀이 (영어 문제나 독해 문제 풀이 해결)',
        '영어 문제풀이 (영어 문제나 독해 문제 풀이 해결)'
    ];

    conversationHistory_g.push({role: 'user', content: '질문에 대한 답변을 정확하게 답변해 줄수 있지?'})

    //upon starting up, the client sends /api/get-access-token to server 
    // client saves it and uses it whenever it sends an API request to server 
    const apiUrl = 'http://localhost:5500/api/';

    function consoleLog (text, variable) {
        console.log(text, variable)
    }

    
    //get access token from server
    async function getAccessToken(uniqueID) {
        try {
            const response = await fetch(apiUrl + `get-access-token?unique_ID=${uniqueID}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            const text = await response.text();
            return JSON.parse(text);
        } catch (error) {
            console.error('Error sending getAccessToken:', error);
        }
    }

    //this makes openai to create a thread session
    async function createThreadSession() {
        try {
            const response = await fetch(apiUrl + 'create-thread-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ messages:initialMessages })
            });

            const text = await response.text();
            return JSON.parse(text);
        } catch (error) {
            console.error('Error in create-initial-thread-session:', error);
        }
    }


    //Tell the server to create an assistant session and returns the session ID
    async function sendRequestToChatGpt(conversationHistory) {
        try {
            const response = await fetch(apiUrl + 'send-request-to-chatgpt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ messages:conversationHistory })
            });

            const text = await response.text();
            return JSON.parse(text);
        } catch (error) {
            console.error('Error in create-initial-thread-session:', error);
        }
    }
    /*
    send a unique ID of the current system the user is on to server so that 
    server can generate a token and send it back to client.  Client is to 
    pass this token to server whenever it make an Open AI request to server. 
    const uniqueID = Date.now();
    console.log(uniqueID);
    getAccessToken(uniqueID).then(response => {
        if (response){
            const {message, access_token: token} = response;
            consoleLog('message:', message)
            consoleLog('access token: ', token)
            accessToken_g = token;
        } else {
            console.error('No response received from getAccessToken');
        }

    }).catch(error => {
    console.error('Error getting access token:', error);
    });
    */

    async function sendSystemMessage() {
        await createThreadSession().then(response => {
            if (response){
                const {message, thread_ID: data, assistant_message: assistant_response} = response;
                threadSessionID_g = data;
                conversationHistory_g.push({role: 'assistant', content: assistant_response});
                //consoleLog('message:', message);
                //consoleLog('Thread ID: ', threadSessionID_g);
                //consoleLog('assistant response: ', assistant_response);
            } else {
                console.error('No response received from createInitialThreadSession');
            }

    //}).catch(error => {
    //    console.error('Error in getting thread ID:', error);
    //}
})};

    async function askChatGpt (question) {
        conversationHistory_g.push({role:'user', content: question});

        try {
            const response = await sendRequestToChatGpt(conversationHistory_g);
            if (response){
                const {thread_ID: data, assistant_message: assistant_response} = response;
                threadSessionID_g = data;
                conversationHistory_g.push({role: 'assistant', content: assistant_response});
                return assistant_response;
                //consoleLog('Thread ID: ', threadSessionID_g);
                //consoleLog('conversation history: ', conversationHistory_g);
            } else {
                console.error('No response received from createInitialThreadSession');
            }
        } catch (error) {
            console.error('Error in getting thread ID:', error);
        }
    }

    
    function copyUserMessageToInputArea(user_message){
        const textSection = document.querySelector('.text-section');
            textSection.style.overflowY = 'auto'; // Make text-section scrollable
            textSection.style.userSelect = 'text'; // Make text-section content selectable
            const starterTextElement = document.createElement('p');
            starterTextElement.textContent = `[${user_message}]`;
            //starterTextElement.style.textDecoration = 'underline'
            starterTextElement.style.cursor = 'pointer'; // Make the text clickable

            starterTextElement.addEventListener('click', () => {
                inputField_g.value = user_message; // Copy the clicked text into input-area
                starterTextElement.style.color = 'blue'; // Change the color of the text when clicked
                inputField_g.focus(); // Move the cursor to input-area
            });
            textSection.appendChild(starterTextElement);
            textSection.scrollTop = textSection.scrollHeight; // Scroll to the bottom when overflow
    }

    function addMessageToChatHistory(message) {
        const messageElement = document.createElement('p');
        messageElement.innerHTML = message; // Use innerHTML to allow HTML content
        chatHistory_g.appendChild(messageElement);
        chatHistory_g.scrollTop = chatHistory_g.scrollHeight;
    }

    //this is to ensure that the conversationHistory array stores the user and assistant messages in the sequential order. 
    (async() => {
        await sendSystemMessage ();
        //await askChatGpt('what is a verb?');
        //await askChatGpt('what is a noun?');
        //conversationHistory_g.forEach((element, index) => {
        //    consoleLog(`Element ${index + 1}:`, element);
    })();

    //display conversation starters to the user
    const starterContainer = document.createElement('div');
    starterContainer.style.border = '1px solid #ccc';
    starterContainer.style.padding = '1rem';
    starterContainer.style.marginBottom = '1rem';

    conversationStarters.forEach(starter => {
        const starterElement = document.createElement('div');
        starterElement.textContent = starter;
        starterElement.style.border = '1px solid #ccc';
        starterElement.style.padding = '0.5rem';
        starterElement.style.marginBottom = '0.5rem';
        starterElement.style.cursor = 'pointer';

        starterElement.addEventListener('click', async () => {
            addMessageToChatHistory(`[User] ${starter}`);

            //copy user message in the history area to input area when selected 
            copyUserMessageToInputArea(starter);

            // Show busy cursor 
            document.body.style.cursor = 'wait';

            try{
                const response = await askChatGpt(starter);
                //const data = await response.json();
                addMessageToChatHistory(`${response}`);
            } catch (error) {
                console.error('Error in getting chatGPT response in starter', error);
            } finally {
                // Revert to default cursor
                document.body.style.cursor = 'default';
            }
        });
        starterContainer.appendChild(starterElement);
    });

    chatHistory_g.appendChild(starterContainer);

    sendButton_g.addEventListener('click', async () => {
        const message = inputField_g.value;
        if (message.trim() !== '') {
            inputField_g.value = '';
            addMessageToChatHistory(`[User] ${message}`);
            document.body.style.cursor = 'wait';
            try {
                const response = await askChatGpt(message);
                addMessageToChatHistory(`${response}`);

                //copy user message in the history area to input area when selected 
                copyUserMessageToInputArea(message);

            } catch (error) {
                console.error('Error in getting chatGPT response in <send> button', error);
            } finally {
                // Revert to default cursor
                document.body.style.cursor = 'default';
            }
        }
    });

    inputField_g.addEventListener('keypress', async (event) => {
        if (event.key === 'Enter') {
            const message = inputField_g.value;
            if (message.trim() !== '') {
                inputField_g.value = '';
                addMessageToChatHistory(`[User] ${message}`);
                document.body.style.cursor = 'wait';
                try {
                    const response = await askChatGpt(message);
                    addMessageToChatHistory(`${response}`);

                //copy user message in the history area to input area when selected 
                copyUserMessageToInputArea(message);

                } catch (error) {
                    console.error('Error in getting chatGPT response for <enter> key', error);
                } finally {
                    // Revert to default cursor
                    document.body.style.cursor = 'default';
                }
            }
        }
    });   
});

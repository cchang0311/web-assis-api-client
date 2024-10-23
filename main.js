document.addEventListener('DOMContentLoaded', (event) => {
    const inputField_g = document.querySelector('.input-area input');
    const sendButton_g = document.querySelector('.input-area button');
    const chatHistory_g = document.querySelector('#chat-history-window');
    let accessToken_g;
    let threadSessionID_g;
    let userTokenCount_g;
    let assistantTokenCount_g;
    const conversationStarters = [
        '영어<->한국어 자동 번역 ',
        '영어 에세이 & 작문을 제출해 주시면 첨삭을 해드립니다영어 문제풀이 (영어 문제나 독해 문제 풀이 해결)',
        '영어 문제풀이 (영어 문제나 독해 문제 풀이 해결)'
    ];

    //upon starting up, the client sends /api/get-access-token to server 
    // client saves it and uses it whenever it sends an API request to server 
    const apiUrl = 'http://localhost:5500/api/';

    //register an event handler for use selecting a file to be sent to chatgpt
    document.getElementById('file-input').addEventListener('change', function() {
        // Handle the selected file
        const userSelectedFile = this.files[0].name
        const validExtensions = ['.txt', '.csv', '.docx'];
        const isValidFile = validExtensions.some(ext => userSelectedFile.trim().toLowerCase().endsWith(ext));

        if (isValidFile) {
            const reader = new FileReader();
        
            reader.onload = function(e) {
                addMessageToChatHistory('[User] ' + userSelectedFile + ' 파일을 chatGPT 로 보냈습니다.');
                document.body.style.cursor = 'wait';
        
                if (userSelectedFile.trim().toLowerCase().endsWith('.docx')) {
                    const arrayBuffer = e.target.result; // Get the ArrayBuffer from the FileReader
                    mammoth.extractRawText({ arrayBuffer: arrayBuffer })
                    .then(function(result) {
                        // The extracted text from the .docx file
                        const fileContent = result.value;
                        console.log(fileContent);
                        
                        // Call askChatGpt inside async() since another async function cannot be called inside onload event handler.
                        (async() => {
                            const assistant_message = await askChatGpt(fileContent);
                            addMessageToChatHistory(`${assistant_message}(${userTokenCount_g+assistantTokenCount_g} tokens)`);
                            document.body.style.cursor = 'default';
                        })();
                        consoleLog(fileContent, "");
                    })
                    .catch(function(err) {
                        console.error("Error reading .docx file:", err);
                    });
                } else {
                    //file is a text file
                    const fileContent = e.target.result;
                    
                    // Call askChatGpt inside async() since another async function cannot be called inside onload event handler.
                    (async() => {
                        const assistant_message = await askChatGpt(fileContent);
                        addMessageToChatHistory(`${assistant_message}(${userTokenCount_g+assistantTokenCount_g} tokens)`);
                        document.body.style.cursor = 'default';
                    })();
                    consoleLog(fileContent, "");
                }
            }
        
            // Read the file as an ArrayBuffer for .docx files
            if (userSelectedFile.trim().toLowerCase().endsWith('.docx')){
                reader.readAsArrayBuffer(this.files[0]); // Changed to read as ArrayBuffer 
            }else{
                reader.readAsText(this.files[0])
            }
        } else {
            addMessageToChatHistory(`[WARNING] ${userSelectedFile} 파일이 선택되었는데 .txt,.cvs, .docx 파일을 선택하여야 합니다.`);
            consoleLog(".txt 나 .cvs 파일을 선택하여야 합니다.", "");
        }      
        // Reset the input value to allow the same file or another file  to be selected again
        this.value = ''; // Clear the input value
    });

    function consoleLog (text, variable) {
        console.log(text, variable)
    }

    /*
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
    */
    //send the new user message to chatgpt in the conversation history array
    async function sendRequestToChatGpt(userMessage) {
        try {
            const response = await fetch(apiUrl + 'send-request-to-chatgpt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ messages:{role: 'user', content: userMessage}})
            });

            if (!response.ok) {
                throw new Error (`Server Error: ${response.status}, ${response.statusText}`);
            }
            
            const data = await response.json();
            const {user_token_count, assistant_token_count} = data;
            userTokenCount_g = user_token_count;
            assistantTokenCount_g = assistant_token_count;
            return data;

        } catch (error) {
            addMessageToChatHistory(
                `***${error}***`
            ) 
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

    //send the system instruction message to chatgpt 
    async function sendSystemMessage() {
        try {
            const response = await fetch(apiUrl + 'send-system-message-to-chatgpt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error (`Server Error: ${response.status}, ${response.statusText}`);
            }

            const data = await response.json();
            const {thread_ID, user_token_count, assistant_token_count, assistant_message} = data;
            userTokenCount_g = user_token_count;
            assistantTokenCount_g = assistant_token_count;   
            addMessageToChatHistory(`${assistant_message}(${userTokenCount_g+assistantTokenCount_g} tokens)`);
        } catch (error) {
            addMessageToChatHistory(
                `***${error}***`
            ) 
        }
    }

    

    //return the assistant message from chatgpt to the caller
    //save thread_ID in the global variable just in case it's needed in the future
    async function askChatGpt (userMessage){

        try {
            const response = await sendRequestToChatGpt(userMessage);
            if (response){
                const {thread_ID:threadSessionID_g, assistant_message: assistant_response} = response;
                return assistant_response;
            } else {
                console.error('askChatGPT failed');
            }
        } catch (error) {
            console.error('askChatGPT failed', error);
        }
    }

    //copy the user message to the sidebar user message area in the screen
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

    //display the user message in the main text area in the screen 
    function addMessageToChatHistory(message) {
        const messageElement = document.createElement('p');
        messageElement.innerHTML = message; // Use innerHTML to allow HTML content
        chatHistory_g.appendChild(messageElement);
        chatHistory_g.scrollTop = chatHistory_g.scrollHeight;
    }

    //Execution starts from here.  Async() is used to make sure that sendSystemMessage is done first.  
    (async() => {
        document.body.style.cursor = 'wait';
        await sendSystemMessage ();       
        document.body.style.cursor = 'default';
    })();

    //display conversation starter menu to the user
    const starterContainer = document.createElement('div');
    //starterContainer.style.border = '1px solid #ccc';
    starterContainer.style.padding = '0rem';
    starterContainer.style.marginBottom = '0rem';
    

    //display the starter menu in the screen. 
    conversationStarters.forEach(starter => {
        const starterElement = document.createElement('div');
        starterElement.textContent = starter;
        starterElement.style.border = '1px solid #ccc';
        starterElement.style.padding = '0.1rem';
        starterElement.style.marginBottom = '0.1rem';
        starterElement.style.cursor = 'pointer';
        starterElement.style.fontSize = '0.8rem'; // Use small font

        //register an event handler for each starter box's clicking
        starterElement.addEventListener('click', async () => {
            addMessageToChatHistory(`[User] ${starter}`);

            //copy user message in the history area to input area when selected 
            copyUserMessageToInputArea(starter);

            // Show busy cursor 
            document.body.style.cursor = 'wait';

            try{
                const assistant_message = await askChatGpt(starter);
                //const data = await response.json();
                addMessageToChatHistory(`${assistant_message} (${userTokenCount_g+assistantTokenCount_g} tokens)`);
            } catch (error) {
                console.error('Error in getting chatGPT response in starter');
            } finally {
                // Revert to default cursor
                document.body.style.cursor = 'default';
            }
        });
        starterContainer.appendChild(starterElement);
    });

    chatHistory_g.appendChild(starterContainer);

   //register an event handler for send button click
    sendButton_g.addEventListener('click', async () => {
        const message = inputField_g.value;
        if (message.trim() !== '') {
            inputField_g.value = '';
            addMessageToChatHistory(`[User] ${message}`);
            document.body.style.cursor = 'wait';
            try {
                const assistant_message = await askChatGpt(message);
                addMessageToChatHistory(`${assistant_message} (${userTokenCount_g+assistantTokenCount_g} tokens`);

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

    //register an event handler for <return> key press
    inputField_g.addEventListener('keypress', async (event) => {
        if (event.key === 'Enter') {
            const message = inputField_g.value;
            if (message.trim() !== '') {
                inputField_g.value = '';
                addMessageToChatHistory(`[User] ${message}`);
                document.body.style.cursor = 'wait';
                try {
                    const assistant_message = await askChatGpt(message);
                    addMessageToChatHistory(`${assistant_message} (${userTokenCount_g+assistantTokenCount_g} tokens)`);

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

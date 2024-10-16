let accessToken_g;
let threadSessionID_g;
let conversationHistory_g = [];

const initialMessages_g = [
    { role: "system", content: "YYou are the most knowledgeable English professor. You are to answer any English questions asked" },
    { role: "user", content: "Can you help me with english questions?" }

]
conversationHistory_g.push({role: 'user', content: 'Can you help me with english questions?'})

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

//Tell the server to create an assistant session and returns the session ID
async function createThreadSession(initialMessages) {
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

//send a unique ID of the current system the user is on to server so that 
//server can generate a token and send it back to client.  Client is to 
//pass this token to server whenever it make an Open AI request to server. 
const uniqueID = Date.now();
//console.log(uniqueID);

/*
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

async function sendSystemMessage(initialMessages) {
    await createThreadSession(initialMessages).then(response => {
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
})};

async function askChatGpt (question) {
    conversationHistory_g.push({role:'user', content: question});

    await sendRequestToChatGpt(conversationHistory_g).then(response => {
        if (response){
            const {thread_ID: data, assistant_message: assistant_response} = response;
            threadSessionID_g = data;
            conversationHistory_g.push({role: 'assistant', content: assistant_response});
            //consoleLog('Thread ID: ', threadSessionID_g);
            //consoleLog('conversation history: ', conversationHistory_g);
        } else {
        console.error('No response received from createInitialThreadSession');
    }

    }).catch(error => {
        console.error('Error in getting thread ID:', error);
    });
}

//this is to ensure that the conversationHistory array stores the user and assistant messages in the sequential order. 
(async() => {
await sendSystemMessage(initialMessages_g);
await askChatGpt('what is a verb?');
await askChatGpt('what is a noun?');
conversationHistory_g.forEach((element, index) => {
    consoleLog(`Element ${index + 1}:`, element);
});
})();



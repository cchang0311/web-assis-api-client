let accessToken;
let assistantSessionID;
let threadID;

//upon starting up, the client sends /api/get-access-token to server 
// client saves it and uses it whenever it sends an API request to server 
const apiUrl = 'http://localhost:5500/api/';

//get access token from server
async function getAccessToken(uniqueID) {
    try {
        const response = await fetch(apiUrl + `get-access-token?unique_ID=${uniqueID}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        return await response.json();
    } catch (error) {
        console.error('Error sending system ID:', error);
    }
}

//Tell the server to create an assistant session and returns the session ID
async function createAssistantSession() {
    try {
        const response = await fetch(apiUrl + 'create-assistant-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        return await response.json();
    } catch (error) {
        console.error('Error sending system ID:', error);
    }
}

//send a unique ID of the current system the user is on to server so that 
//server can generate a token and send it back to client.  Client is to 
//pass this token to server whenever it make an openai request to server. 
const uniqueID = Date.now();
console.log(uniqueID);

getAccessToken(uniqueID).then(response => {
    if (response){
        const {message, access_token: token} = response;
        console.log('message:', message)
        console.log('access token: ', token)
        accessToken = token;
    } else {
        console.error('No response received');
    }

}).catch(error => {
    console.error('Error getting access token:', error);
});


createAssistantSession().then(response => {
    if (response){
        const {message, assistant_session_ID: data} = response;
        assistantSessionID = data;
        console.log('message:', message);
        console.log('assistant ID: ', assistantSessionID);
    } else {
        console.error('No response received');
    }

}).catch(error => {
    console.error('Error getting access token:', error);
});



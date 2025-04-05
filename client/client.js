const API_URL = "https://spacetime.bryanlearn.com";
const WS_URL = "wss://spacetime.bryanlearn.com";
const DATABASE_NAME = "chat-game-dev";
let currentIdentity = null;
let currentToken = null;
let websocket = null;

function subscribeToChatMessages() {
    // Generate random key for WebSocket connection
    const key = btoa(Math.random().toString());

    // Create WebSocket URL
    //const socket = new WebSocket(`wss://spacetime.bryanlearn.com/v1/database/chat-game-dev/subscribe`, "v1.bsatn.spacetimedb");
    const socket = new WebSocket(`wss://spacetime.bryanlearn.com/v1/database/chat-game-dev/subscribe`, "v1.json.spacetimedb");

    // Handle connection open
    socket.onopen = () => {
        console.log("WebSocket connection established");

        //// subscribe to chat messages
        //const subscribeMessage = {
        //    type: "Subscribe",
        //    query_strings: [ "SELECT * FROM ChatMessages ORDER BY Timestamp DESC" ],
        //    request_id: Date.now(), // Generate a unique request ID
        //};

        //socket.send(JSON.stringify(subscribeMessage));
    };

    // Handle incoming messages
    socket.onmessage = (event) => {
        console.log('Message from server:', event.data);
        
        const data = JSON.parse(event.data);

        // Store the identity and token
        if (data.IdentityToken) {
            currentIdentity = data.IdentityToken.identity;
            currentToken = data.IdentityToken.token;
            console.log("New Identity token received:", currentToken);
            console.log("Identity:", currentIdentity);

        } else if (data.SubscribeApplied) {
            // when subscription is confirmed
            const initialRows = data.SubscribeApplied.rows.table_rows;
            initialRows.forEach(row => {
                displayChatMessage(row);
            })
        } else if (data.TransactionUpdate) {
           // process updates 
           const updatedRows = data.TransactionUpdate.update.inserts;
           updatedRows.forEach(row => {
               displayChatMessage(row);
           });
        }

    }

    // Handle errors
    socket.onerror = (error) => {
        console.error("WebSocket error:", error);
    };

    // Handle connection close
    socket.onclose = () => {
        console.log("WebSocket connection closed");
    };

    websocket = socket; // Store websocket reference
}

function displayChatMessage(row) {
    const chatDiv = document.getElementById("chatMessages");
    const messageElement = document.createElement("div");
    messageElement.innerText = `${row.SenderId}: ${row.Message}`;
    chatDiv.appendChild(messageElement);
}

// Join Game
document.getElementById("joinButton").onclick = async () => {
    const username = document.getElementById("username").value;
    const response = await fetch(`${API_URL}/v1/identity`, {
        method: 'POST',
    });

    if (response.ok) {
        const data = await response.json();
        currentIdentity = data.identity;
        currentToken = data.token;

        console.log("Joined as:", currentIdentity);
        //alert(`Welcome, ${username}! You are now connected.`);
        subscribeToChatMessages();
    } else {
        console.error("Failed to generate identity:", response.statusText);
        //alert("Failed to join.");
    }
};

// Send Chat Message
document.getElementById("sendMessageButton").onclick = async () => {
    const message = document.getElementById("chatInput").value;
    const username = document.getElementById("username").value;

    if (!currentIdentity || !currentToken) {
        //alert("You need to join first!");
        return;
    }

    const response = await fetch(`${API_URL}/v1/database/${DATABASE_NAME}/call/AddChatMessage`, { // Replace with your database name
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify([username, message])
    });

    if (response.ok) {
        console.log("Message sent:", message);
        document.getElementById("chatInput").value = ''; // Clear input
    } else {
        console.error("Failed to send message:", response.statusText);
        //alert("Failed to send message.");
    }
};

//// Fetch Chat Messages
//async function fetchChatMessages() {
//    const response = await fetch(`${API_URL}/v1/database/${DATABASE_NAME}/sql`, { // Replace with your database name
//        method: 'POST',
//        headers: {
//            'Authorization': `Bearer ${currentToken}`,
//            'Content-Type': 'application/json'
//        },
//        body: JSON.stringify(['SELECT * FROM ChatMessages ORDER BY Timestamp DESC'])
//    });
//
//    if (response.ok) {
//        const data = await response.json();
//        const chatDiv = document.getElementById("chatMessages");
//        chatDiv.innerHTML = ''; // Clear existing messages
//        data[0].rows.forEach(row => {
//            const messageElement = document.createElement("div");
//            messageElement.textContent = `${row.SenderId}: ${row.Message}`;
//            chatDiv.appendChild(messageElement);
//        });
//    } else {
//        console.error("Failed to fetch chat messages:", response.statusText);
//        alert("Failed to fetch chat messages.");
//    }
//}
//
//document.getElementById("fetchChatMessagesButton").onclick = fetchChatMessages;

// Fetch chat messages every 5 seconds (optional polling)
//setInterval(fetchChatMessages, 5000);
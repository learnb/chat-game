import { DbConnection, EventContext, ChatMessage, Player, ErrorContext } from "./module_bindings/index";
import { Identity } from "@clockworklabs/spacetimedb-sdk"

const API_URL = "wss://spacetime.bryanlearn.com";
const DATABASE_NAME = "chat-game-dev";


const messagesDiv = document.getElementById('messages') as HTMLDivElement;
const usernameInput = document.getElementById('username') as HTMLInputElement;
const setUsernameButton = document.getElementById('setUsername') as HTMLButtonElement;
const messageInput = document.getElementById('messageInput') as HTMLTextAreaElement;
const sendMessageButton = document.getElementById('sendMessage') as HTMLButtonElement;

let username: string;
let conn: DbConnection | null = null;

// Function to connect to SpacetimeDB
function connectToSpacetimeDB() {
    conn = DbConnection.builder()
        .withUri(API_URL)
        .withModuleName(DATABASE_NAME)
        .onConnect(onConnect)
        .onDisconnect(onDisconnect)
        .onConnectError(onConnectError)
        .build();
}

// Event handler for successful connection
function onConnect(connection: DbConnection) {
    console.log('Connected to SpacetimeDB');
    subscribeToMessages();
}

// Event handler for disconnection
function onDisconnect() {
    console.log('Disconnected from SpacetimeDB');
}

// Event handler for connection error
function onConnectError(ctx: ErrorContext, error: Error) {
    console.error('Error connecting to SpacetimeDB:', error);
}

// Function to subscribe to messages
function subscribeToMessages() {
    console.log('Entered subscribeToMessages');
    if (!conn) {
        console.error('Connection not initialized, cannot subscribe');
        return;
    }

    console.log('Subscribing to messages...');
    conn.subscriptionBuilder()
        .onApplied(() => {
            console.log('Subscription applied');
        })
        .onError((ctx: ErrorContext) => {
            console.error('Subscription error:', ctx);
        })
        .subscribe('SELECT * FROM ChatMessages');

    console.log('Subscribed to messages');


    conn.db.chatMessages.onInsert((ctx: EventContext, message: ChatMessage) => {
        console.log('New message:', message);
        const messageElement = document.createElement('div');
        messageElement.textContent = `[${message.timestamp.toDate()}] ${message.senderId}: ${message.message}`;
        messagesDiv.appendChild(messageElement);
    });
}

// Event listener for setting the username
setUsernameButton.onclick = () => {
    username = usernameInput.value || 'Anonymous';
    console.log('Username set to:', username);
};

// Event listener for sending messages
sendMessageButton.onclick = () => {
    if (conn && username) {
        conn.reducers.addChatMessage(username, messageInput.value);
        messageInput.value = ''; // Clear input after sending
    }
};

// Initialize the connection when the script loads
connectToSpacetimeDB();

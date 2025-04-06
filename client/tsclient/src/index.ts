import { 
    DbConnection, EventContext, ChatMessage, Player, ErrorContext, Vector3
} from "./module_bindings/index";
import { Identity } from "@clockworklabs/spacetimedb-sdk"

const API_URL = "wss://spacetime.bryanlearn.com";
const DATABASE_NAME = "chat-game-dev";


const messagesDiv = document.getElementById('messages') as HTMLDivElement;
const playersDiv = document.getElementById('players') as HTMLDivElement;
const usernameInput = document.getElementById('username') as HTMLInputElement;
const setUsernameButton = document.getElementById('setUsername') as HTMLButtonElement;
const messageInput = document.getElementById('messageInput') as HTMLTextAreaElement;
const sendMessageButton = document.getElementById('sendMessage') as HTMLButtonElement;
const disconnectionButton = document.getElementById('disconnect') as HTMLButtonElement;

let playerElements: { [playerId: number]: HTMLDivElement } = {};

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
    subscribeToPlayers();
}

// Event handler for disconnection
function onDisconnect() {
    console.log('Disconnected from SpacetimeDB');
    // remove player
    conn?.reducers.removePlayer(username);
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
        const date = message.timestamp.toDate();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const messageElement = document.createElement('div');
        messageElement.textContent = `[${hours}:${minutes}] ${message.senderId}: ${message.message}`;
        messagesDiv.appendChild(messageElement);
    });
}

// Subscribe to Players
function subscribeToPlayers() {
    console.log('Entered subscribeToPlayers');
    if (!conn) {
        console.error('Connection not initialized, cannot subscribe');
        return;
    }

    console.log('Subscribing to players...');
    conn.subscriptionBuilder()
        .onApplied(() => {
            console.log('Subscription applied');
        })
        .onError((ctx: ErrorContext) => {
            console.error('Subscription error:', ctx);
        })
        .subscribe('SELECT * FROM Players');

    console.log('Subscribed to players');


    conn.db.players.onInsert((ctx: EventContext, player: Player) => {
        console.log('Added player:', player);
        const playerElement = document.createElement('div');
        playerElement.textContent = player.identity;
        playersDiv.appendChild(playerElement);
        playerElements[player.playerId] = playerElement;
    });
    
    conn.db.players.onDelete((ctx: EventContext, player: Player) => {
        console.log('Removed player:', player);
        const playerElement = playerElements[player.playerId];
        if (playerElement) {
            playersDiv.removeChild(playerElement);
            delete playerElements[player.playerId];
        }
    });

    conn.db.players.onUpdate((ctx: EventContext, old_player: Player, new_player: Player) => {
        console.log('Updated player:', new_player);
        const playerElement = playerElements[new_player.playerId];
        if (playerElement) {
            playerElement.textContent = new_player.identity;
        }
    })
}

// Event listener for setting the username
setUsernameButton.onclick = () => {
    username = usernameInput.value || 'Anonymous';
    console.log('Username set to:', username);
    const v: Vector3 = {x: 0, y: 0, z: 0};
    conn?.reducers.upsertPlayer(username, "", v, v);
};

// Event listener for sending messages
sendMessageButton.onclick = () => {
    if (conn && username) {
        conn.reducers.addChatMessage(username, messageInput.value);
        messageInput.value = ''; // Clear input after sending
    }
};

// Event listener for disconnecting
disconnectionButton.onclick = () => {
    //conn?.disconnect();
    // remove player
    console.log('Removing player:', username);
    conn?.reducers.removePlayer(username);
};

// Initialize the connection when the script loads
connectToSpacetimeDB();

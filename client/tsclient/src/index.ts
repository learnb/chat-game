import { 
    DbConnection, EventContext, ChatMessage, Player, ErrorContext, Vector3
} from "./module_bindings/index";
import { Identity } from "@clockworklabs/spacetimedb-sdk"

const API_URL = "wss://spacetime.bryanlearn.com";
const DATABASE_NAME = "chat-game-dev";

const gameContainer = document.getElementById('game-container') as HTMLDivElement;
const messagesDiv = document.getElementById('messages') as HTMLDivElement;
const playersDiv = document.getElementById('players') as HTMLDivElement;
const usernameInput = document.getElementById('username') as HTMLInputElement;
const setUsernameButton = document.getElementById('setUsername') as HTMLButtonElement;
const messageInput = document.getElementById('messageInput') as HTMLTextAreaElement;
const sendMessageButton = document.getElementById('sendMessage') as HTMLButtonElement;
const disconnectionButton = document.getElementById('disconnect') as HTMLButtonElement;

let playerElements: { [playerId: number]: HTMLDivElement } = {};
let playerMap: { [username: string]: number} = {};

let isOnline: boolean = false;
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
    removePlayer(playerMap[username]);
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
        let playerElement = document.createElement('div');
        playerElement.style.position = 'absolute';
        playerElement.style.width = '10px';
        playerElement.style.height = '10px';
        playerElement.style.backgroundColor = 'red';
        playerElement.style.pointerEvents = 'none';
        playerElement.textContent = player.identity;
        gameContainer.appendChild(playerElement);
        playerElements[player.playerId] = playerElement;
        playerMap[player.identity] = player.playerId;

        updatePlayerElementPosition(player);
    });
    
    conn.db.players.onDelete((ctx: EventContext, player: Player) => {
        console.log('Removed player:', player);
        const playerElement = playerElements[player.playerId];
        if (playerElement) {
            removePlayer(player.playerId);
            //gameContainer.removeChild(playerElement);
            //delete playerElements[player.playerId];
        }
    });

    conn.db.players.onUpdate((ctx: EventContext, old_player: Player, new_player: Player) => {
        console.log('Updated player:', new_player);
        const playerElement = playerElements[new_player.playerId];
        playerMap[new_player.identity] = new_player.playerId;
        if (playerElement) {
            updatePlayerElementPosition(new_player);
        }
    })
}

// Event listener for setting the username
setUsernameButton.onclick = () => {
    username = usernameInput.value || 'Anonymous';
    console.log('Username set to:', username);
    const v: Vector3 = {x: 0, y: 0, z: 0};
    conn?.reducers.upsertPlayer(username, "", v, v);
    isOnline = true;
};

// Event listener for sending messages
sendMessageButton.onclick = () => {
    if (conn && username && isOnline) {
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
    isOnline = false;
};

// Event listener for mouse move events
document.addEventListener('mousemove', (event: MouseEvent) => {
    // get mouse position relative to game container
    //const x = event.clientX - gameContainer.offsetLeft;
    //const y = event.clientY - gameContainer.offsetTop;
    const mouse_offset = 3;
    const x = event.clientX - mouse_offset;
    const y = event.clientY - mouse_offset;

    // update player's position based on mouse position
    if (conn && username && isOnline) {
        const v: Vector3 = {x: x, y: y, z: 0};
        const r: Vector3 = {x: 0, y: 0, z: 0};
        conn.reducers.upsertPlayer(username, "", v, r);
    }
});

// Update the player element's position based on the player's position
function updatePlayerElementPosition(player: Player) {
    const playerElement = playerElements[player.playerId];
    if (playerElement) {
        playerElement.style.left = `${player.position.x}px`;
        playerElement.style.top = `${player.position.y}px`;
    }
}

function removePlayer(playerId: number) {
    const playerElement = playerElements[playerId];
    gameContainer.removeChild(playerElement);
    delete playerElements[playerId];
}

// Initialize the connection when the script loads
connectToSpacetimeDB();

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const spacetimedb_sdk_1 = require("@clockworklabs/spacetimedb-sdk");
// Configuration Constants
const API_URL = "https://spacetime.bryanlearn.com";
const DATABASE_NAME = "chat-game-dev"; // Your database name
let currentIdentity = null;
let currentToken = null;
// Function to initialize the database connection and handle subscriptions
function initializeChatClient() {
    return __awaiter(this, void 0, void 0, function* () {
        // Create a new connection builder
        const connectionBuilder = spacetimedb_sdk_1.DbConnection.builder()
            .withUri(API_URL)
            .withModuleName(DATABASE_NAME)
            .onConnect((ctx, identity, token) => {
            console.log("Connected as:", identity);
            currentIdentity = identity;
            currentToken = token; // Save the token for further API requests
            subscribeToChatMessages(ctx); // Subscribe to messages once connected
        })
            .onConnectError((ctx, error) => {
            console.error("Connection error:", error);
        })
            .onDisconnect((ctx, error) => {
            console.log("Disconnected:", error);
        });
        // Build the connection
        const connection = connectionBuilder.build();
    });
}
// Function to subscribe to chat messages
function subscribeToChatMessages(ctx) {
    console.log("Subscribing to chat messages...");
    // Create a subscription for ChatMessages
    ctx.subscriptionBuilder()
        .onApplied((subscriptionContext) => {
        console.log("Subscription applied:", subscriptionContext);
    })
        .onError((errorContext, error) => {
        console.error("Subscription error:", error);
    })
        .subscribe(["SELECT * FROM ChatMessages ORDER BY Timestamp DESC"]);
}
// Function to send chat messages
function sendChatMessage(senderId, message) {
    return __awaiter(this, void 0, void 0, function* () {
        // Ensure there's an active identity and token
        if (!currentIdentity || !currentToken) {
            console.error("User not authenticated. Cannot send messages.");
            return;
        }
        const response = yield fetch(`${API_URL}/v1/database/${DATABASE_NAME}/call/AddChatMessage`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify([senderId, message]),
        });
        if (response.ok) {
            console.log("Message sent:", message);
        }
        else {
            console.error("Failed to send message:", response.statusText);
        }
    });
}
// Initialize the chat client
initializeChatClient();

using SpacetimeDB;
using SpacetimeDB.Internal.TableHandles;

public static partial class Module
{
    // players table
    [Table(Name = "Players", Public = true)]
    public partial struct Player
    {
        [PrimaryKey]
        [AutoInc]
        public uint PlayerId;       // Unique ID for the player
        [Unique]
        public string Identity;     // Unique username for the player
        public string AvatarConfig; // Avater appearance (JSON string)
        public Vector3 Position;    // Player position
        public Vector3 Rotation;    // Player rotation
        public bool IsOnline;       // Player online status
    }

    // entities table
    [Table(Name = "Entities", Public = true)]
    public partial struct Entity
    {
        [PrimaryKey]
        [AutoInc]
        public uint EntityId;       // Unique ID for the entity
        public string Type;          // Type of the entity
        public Vector3 Position;    // Entity position
        public Vector3 Rotation;    // Entity rotation
    }

    // chatMessages table
    [Table(Name = "ChatMessages", Public = true)]
    public partial struct ChatMessage
    {
        [PrimaryKey]
        [AutoInc]
        public uint MessageId;      // Unique ID for the message
        public string SenderId;     // ID of the player sending the message
        public string Message;      // Content of the message
        public Timestamp Timestamp; // Time the message was sent
    }

    // Reducer: update existing player
    [Reducer]
    public static void UpdatePlayer(ReducerContext ctx, string identity, string avatarConfig, Vector3 position, Vector3 rotation)
    {
        Player existingPlayer = FindPlayerByIdentity(ctx, identity);
        if (existingPlayer.PlayerId != 0)
        {
            // update existing player
            existingPlayer.AvatarConfig = avatarConfig;
            existingPlayer.Position = position;
            existingPlayer.Rotation = rotation;
            ctx.Db.Players.PlayerId.Update(existingPlayer);
        }
    }

    // Reducer: add or update player
    [Reducer]
    public static void UpsertPlayer(ReducerContext ctx, string identity, string avatarConfig, Vector3 position, Vector3 rotation)
    {
        Player existingPlayer = FindPlayerByIdentity(ctx, identity);
        if (existingPlayer.PlayerId != 0)
        {
            // update existing player
            existingPlayer.AvatarConfig = avatarConfig;
            existingPlayer.Position = position;
            existingPlayer.Rotation = rotation;
            ctx.Db.Players.PlayerId.Update(existingPlayer);
        }
        else
        {
            // create new player
            var newPlayer = ctx.Db.Players.Insert(new Player
            {
                Identity = identity,
                AvatarConfig = avatarConfig,
                Position = position,
                Rotation = rotation,
                IsOnline = true
            });
        }
    }

    // Reducer: remove player
    [Reducer]
    public static void RemovePlayer(ReducerContext ctx, string identity)
    {
        Player existingPlayer = FindPlayerByIdentity(ctx, identity);
        if (existingPlayer.PlayerId != 0)
        {
            Log.Info($"Removing playerId: {existingPlayer.PlayerId}");
            ctx.Db.Players.PlayerId.Delete(existingPlayer.PlayerId);
        }
    }

    // Reducer: insert entity
    [Reducer]
    public static void InsertEntity(ReducerContext ctx, string type, Vector3 position, Vector3 rotation)
    {
        var newEntity = ctx.Db.Entities.Insert(new Entity
        {
            Type = type,
            Position = position,
            Rotation = rotation
        });
    }

    // Reducer: update entity
    [Reducer]
    public static void UpdateEntity(ReducerContext ctx, uint entityId, Vector3 position, Vector3 rotation)
    {
        Entity existingEntity = FindEntityById(ctx, entityId);
        if (existingEntity.EntityId != 0)
        {
            // update existing entity
            existingEntity.Position = position;
            existingEntity.Rotation = rotation;
            ctx.Db.Entities.EntityId.Update(existingEntity);
        }
    }

    // Reducer: add chat message
    [Reducer]
    public static void AddChatMessage(ReducerContext ctx, string senderId, string message)
    {
        var newMessage = ctx.Db.ChatMessages.Insert(new ChatMessage
        {
            SenderId = senderId,
            Message = message,
            Timestamp = ctx.Timestamp
        });
    }

    // helper method to find player by identity
    public static Player FindPlayerByIdentity(ReducerContext ctx, string identity)
    {
        foreach (var player in ctx.Db.Players.Iter())
        {
            if (player.Identity == identity)
            {
                return player;
            }
        }

        Log.Info($"Player not found for identity: {identity}");
        return new Player { PlayerId = 0 };
    }

    // helper method to find entity by entity_id
    public static Entity FindEntityById(ReducerContext ctx, uint entityId)
    {
        foreach (var entity in ctx.Db.Entities.Iter())
        {
            if (entity.EntityId == entityId)
            {
                return entity;
            }
        }

        Log.Info($"Entity not found for entityId: {entityId}");
        return new Entity { EntityId = 0 };
    }

    // Lifecycle reducer called when a client connects
    [Reducer(ReducerKind.ClientConnected)]
    public static void ClientConnected(ReducerContext ctx)
    {
        Log.Info($"Client connected: {ctx.Sender}");
        // can initial player state here
    }

    // Lifecycle reducer called when a client disconnects
    [Reducer(ReducerKind.ClientDisconnected)]
    public static void ClientDisconnected(ReducerContext ctx)
    {
        Log.Info($"Client disconnected:\n\tSender:{ctx.Sender}\n\tIdentity:{ctx.Identity}\n\t");
        // potentially remove player from db
        //RemovePlayer(ctx, ctx.Sender.ToString());
        //RemovePlayer(ctx, ctx.Identity.ToString());
    }

}

[Type]
public partial struct Vector3
{
    public float X;
    public float Y;
    public float Z;

    // constructor
    public Vector3(float x, float y, float z)
    {
        X = x;
        Y = y;
        Z = z;
    }
}
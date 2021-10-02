"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Manager = void 0;
const axios = require('axios');
const events_1 = require("events");
const Structures_1 = require("../Structures");
const defaults = {
    resuming: {
        key: Math.random().toString(32),
        timeout: 60000 * 5,
    },
    reconnect: {
        auto: true,
        delay: 15000,
        maxTries: 10,
    },
    shards: 1,
};
class Manager extends events_1.EventEmitter {
    constructor(nodes, options) {
        super();
        this.plugins = [];
        options = Object.assign(defaults, options);
        this.sockets = new Map();
        this.players = new Map();
        this.nodes = nodes;
        this.options = options;
        this.userId = options.userId;
        this.send = options.send;
        this.resuming = (typeof options.resuming === "boolean"
            ? !options.resuming ? null : defaults.resuming
            : options.resuming ?? defaults.resuming);
        if (!options.send || typeof options.send !== "function") {
            throw new TypeError("Please provide a send function for sending packets to discord.");
        }
        if (this.options.shards < 1) {
            throw new TypeError("Shard count must be 1 or greater.");
        }
        if (options.plugins && options.plugins.length) {
            for (const plugin of options.plugins) {
                this.plugins.push(plugin);
                plugin.load(this);
            }
        }
    }

    get ideal() {
        return [...this.sockets.values()].sort((a, b) => a.penalties - b.penalties);
    }
    init(userId = this.userId) {
        if (!userId) {
            throw new Error("Provide a client id for lavalink to use.");
        }
        else {
            this.userId = userId;
        }
        for (const plugin of this.plugins) {
            plugin.init();
        }
        for (const s of this.nodes) {
            if (!this.sockets.has(s.id)) {
                const socket = new (Structures_1.Structures.get("socket"))(this, s);
                try {
                    socket.connect();
                    this.sockets.set(s.id, socket);
                }
                catch (e) {
                    this.emit("socketError", e, socket);
                }
            }
        }
    }
    use(plugin) {
        plugin.load(this);
        this.plugins = this.plugins.concat([plugin]);
        return this;
    }
    async serverUpdate(update) {
        const player = this.players.get(update.guild_id);
        if (player) {
            await player.handleVoiceUpdate(update);
        }
        return;
    }
    async stateUpdate(update) {
        const player = this.players.get(update.guild_id);
        if (player && update.user_id === this.userId) {
            if (update.channel_id !== player.channel) {
                player.emit("move", update.channel_id);
                player.channel = update.channel_id;
            }
            setTimeout(() => {
                if (update.channel_id === null) {
                    this.emit("_event", {type: 'TrackDisconnect', data: player});
                    this.destroy(update.guild_id);
                }
            }, 1000)
            await player.handleVoiceUpdate(update);
        }
    }
    create(guild, socket = this.ideal[Math.floor(Math.random() * this.ideal.length)]) {
        const id = typeof guild === "string" ? guild : guild.id, existing = this.players.get(id);
        if (existing) {
            return existing;
        }
        if (!socket) {
            throw new Error("Manager#create(): No available nodes.");
        }
        const player = new (Structures_1.Structures.get("player"))(socket, id);
        this.players.set(id, player);
        return player;
    }
    async destroy(guild) {
        const id = typeof guild === "string" ? guild : guild.id;
        const player = this.players.get(id);
        if (player) {
            await player.destroy(true);
            return this.players.delete(id);
        }
        else {
            return false;
        }
    }
    async search(query) {
        const NodeSearch = this.ideal.filter((e) => e.search == true)
        if (NodeSearch.length === 0) throw new Error("Manager#search(): No available nodes.");
        const socket = NodeSearch[Math.floor(Math.random() * NodeSearch.length)];
        try {
            if (!socket) {
                throw new Error("Manager#search(): No available sockets.");
            }
        } catch (e) { }
        const getload = await axios({
            method: 'get',
            url: `http${socket.secure ? "s" : ""}://${socket.address}/loadtracks?identifier=${encodeURIComponent(query)}`,
            headers: {
                'authorization': `${socket.password}`
            },
            json: true,
        })
        if (getload && getload.status === 200) return getload.data
    }
}
exports.Manager = Manager;

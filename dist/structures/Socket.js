"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Socket = exports.Status = void 0;
const ws_1 = __importDefault(require("ws"));
var Status;
(function (Status) {
    Status[Status["CONNECTED"] = 0] = "CONNECTED";
    Status[Status["CONNECTING"] = 1] = "CONNECTING";
    Status[Status["IDLE"] = 2] = "IDLE";
    Status[Status["DISCONNECTED"] = 3] = "DISCONNECTED";
    Status[Status["RECONNECTING"] = 4] = "RECONNECTING";
    Status[Status["DISCONNECTING"] = 5] = "DISCONNECTING";
})(Status = exports.Status || (exports.Status = {}));
class Socket {
    constructor(manager, data) {
        this.manager = manager;
        this.id = data.id;
        this.host = data.host;
        this.port = data.port;
        this.search = data.search ?? true;
        this.loadtrack = data.loadtrack ?? true;
        this.secure = data.secure ?? false;
        Object.defineProperty(this, "password", { value: data.password ?? "youshallnotpass" });
        this.remainingTries = Number(manager.options.reconnect.maxTries ?? 5);
        this.status = Status.IDLE;
        this.queue = [];
        this.stats = {
            cpu: {
                cores: 0,
                lavalinkLoad: 0,
                systemLoad: 0,
            },
            frameStats: {
                deficit: 0,
                nulled: 0,
                sent: 0,
            },
            memory: {
                allocated: 0,
                free: 0,
                reservable: 0,
                used: 0,
            },
            players: 0,
            playingPlayers: 0,
            uptime: 0,
        };
    }
    get reconnection() {
        return this.manager.options.reconnect;
    }
    get connected() {
        return this.ws !== undefined
            && this.ws.readyState === ws_1.default.OPEN;
    }
    get address() {
        return `${this.host}${this.port ? `:${this.port}` : ""}`;
    }
    get penalties() {
        const cpu = Math.pow(1.05, 100 * this.stats.cpu.systemLoad) * 10 - 10;
        let deficit = 0, nulled = 0;
        if (this.stats.frameStats?.deficit !== -1) {
            deficit = Math.pow(1.03, 500 * ((this.stats.frameStats?.deficit ?? 0) / 3000)) * 600 - 600;
            nulled = (Math.pow(1.03, 500 * ((this.stats.frameStats?.nulled ?? 0) / 3000)) * 600 - 600) * 2;
            nulled *= 2;
        }
        return cpu + deficit + nulled;
    }
    send(data, priority = false) {
        const json = JSON.stringify(data);
        this.queue[priority ? "unshift" : "push"](json);
        if (this.connected) {
            this._processQueue();
        }
    }
    connect() {
        if (this.status !== Status.RECONNECTING) {
            this.status = Status.CONNECTING;
        }
        if (this.connected) {
            this._cleanup();
            this.ws?.close(1012);
            delete this.ws;
        }
        const headers = {
            authorization: this.password,
            "Num-Shards": this.manager.options.shards,
            "User-ID": this.manager.userId,
            "Client-Name": "lilia-client",
        };
        if (this.resumeKey) {
            headers["resume-key"] = this.resumeKey;
        }
        this.ws = new ws_1.default(`ws${this.secure ? "s" : ""}://${this.address}`, { headers });
        this.ws.onopen = this._open.bind(this);
        this.ws.onmessage = this._message.bind(this);
        this.ws.onclose = this._close.bind(this);
        this.ws.onerror = this._error.bind(this);
    }
    reconnect() {
        if (this.remainingTries !== 0) {
            this.remainingTries -= 1;
            this.status = Status.RECONNECTING;

            try {
                this.connect();
                clearTimeout(this.timeoutReconnect)
            } catch (e) {
                this.manager.emit("socketError", this, e);
            }
        } else {
            this.status = Status.DISCONNECTED;
            this.manager.emit("socketDisconnect", this, "Ran out of reconnect tries.");
        }
    }
    configureResuming() {
        if (this.manager.resuming !== null) {
            this.resumeKey = this.manager.resuming.key ?? Math.random().toString(32);
            return this.send({
                op: "configureResuming",
                timeout: this.manager.resuming.timeout ?? 60000,
                key: this.resumeKey,
            }, true);
        }
    }
    async _open() {
        this.manager.emit("socketReady", this);
        this._processQueue();
        this.configureResuming();
        this.status = Status.CONNECTED;
    }
    async _message({ data }) {
        if (data instanceof ArrayBuffer) {
            data = Buffer.from(data);
        }
        else if (Array.isArray(data)) {
            data = Buffer.concat(data);
        }
        let pk;
        try {
            pk = JSON.parse(data.toString());
        }
        catch (e) {
            this.manager.emit("socketError", this, e);
            return;
        }
        const player = this.manager.players.get(pk.guildId);
        if (pk.guildId && player) {
            await player.emit(pk.op, pk);
        }
        else if (pk.op === "stats") {
            this.stats = pk;
        }
    }
    async _close({ reason, code, wasClean }) {
        if (this.remainingTries === this.reconnection.maxTries) {
            this.manager.emit("socketClose", { reason, code, wasClean });
        }
        if (code !== 1000 && reason !== "destroy") {
            if (this.reconnection.auto) {
                this.timeoutReconnect = setTimeout(() => {
                    this.reconnect();
                }, this.reconnection.delay * 1000 || 1000 * 15)
            }
        }
    }
    _error(event) {
        const error = event.error ? event.error : event.message;
        this.manager.emit("socketError", this, error);
    }
    _processQueue() {
        if (this.queue.length === 0) {
            return;
        }
        while (this.queue.length > 0) {
            const payload = this.queue.shift();
            if (!payload) {
                return;
            }
            this._send(payload);
        }
    }
    _send(payload) {
        return this.ws.send(payload, err => err
            ? this.manager.emit("socketError", err, this)
            : void 0);
    }
    _cleanup() {
        if (this.ws) {
            this.ws.onclose =
                this.ws.onerror =
                this.ws.onopen =
                this.ws.onmessage = () => void 0;
        }
    }
}
exports.Socket = Socket;

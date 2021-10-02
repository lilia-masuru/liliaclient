"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var _filters;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
const events_1 = require("events");
const { decode } = require('@lavalink/encoding')
const Structures_1 = require("../Structures");
class Player extends events_1.EventEmitter {
    constructor(socket, guild) {
        super();
        _filters.set(this, void 0);
        this.socket = socket;
        this.guild = guild;
        this.paused = false;
        this.playing = false;
        this.position = 0;
        this.volume = 100;
        this.equalizer = [];
        this.connected = false;
        this.skip_vote = new Set();
        
        this._nightcore = false;
        this._vaporwave = false;
        this._bassboost = false;
        this._pop = false;
        this._soft = false;
        this._treblebass = false;
        this._eightD = false;
        this._karaoke = false;
        this._vibrato = false;
        this._tremolo = false;

        this.filters = this.socket.manager.options.filters || false

        this.on("playerUpdate", this._playerUpdate.bind(this));
        this.on("event", this._event.bind(this));

        this._resetData = {
            op: "filters",
            guildId: this.guild,
        };
        this._nightcoreData = {
            op: "filters",
            guildId: this.guild,
            timescale: this.filters?.nightcore || { speed: 1.1, pitch: 1.1, rate: 1 }
        };
        this._vaporwaveData = {
            op: "filters",
            guildId: this.guild,
            timescale: this.filters?.vaporwave || { pitch: 0.5 },
        };
        this._bassboostData = {
            op: "filters",
            guildId: this.guild,
            equalizer: [
                { band: 0, gain: 0.1875 },
                { band: 1, gain: 0.375 },
                { band: 2, gain: -0.375 },
                { band: 3, gain: -0.1875 },
                { band: 4, gain: 0 },
                { band: 5, gain: -0.0125 },
                { band: 6, gain: -0.025 },
                { band: 7, gain: -0.0175 },
                { band: 8, gain: 0 },
                { band: 9, gain: 0 },
                { band: 10, gain: 0.0125 },
                { band: 11, gain: 0.025 },
                { band: 12, gain: 0.375 },
                { band: 13, gain: 0.125 },
                { band: 14, gain: 0.125 },
            ],
        };
        this._popData = {
            op: "filters",
            guildId: this.guild,
            equalizer: [
                { band: 0, gain: 0.65 },
                { band: 1, gain: 0.45 },
                { band: 2, gain: -0.45 },
                { band: 3, gain: -0.65 },
                { band: 4, gain: -0.35 },
                { band: 5, gain: 0.45 },
                { band: 6, gain: 0.55 },
                { band: 7, gain: 0.6 },
                { band: 8, gain: 0.6 },
                { band: 9, gain: 0.6 },
                { band: 10, gain: 0 },
                { band: 11, gain: 0 },
                { band: 12, gain: 0 },
                { band: 13, gain: 0 },
            ],
        };
        this._softData = {
            op: "filters",
            guildId: this.guild,
            lowPass: {
                smoothing: 20.0
            }
        };
        this._treblebassData = {
            op: "filters",
            guildId: this.guild,
            equalizer: [
                { band: 0, gain: 0.6 },
                { band: 1, gain: 0.67 },
                { band: 2, gain: 0.67 },
                { band: 3, gain: 0 },
                { band: 4, gain: -0.5 },
                { band: 5, gain: 0.15 },
                { band: 6, gain: -0.45 },
                { band: 7, gain: 0.23 },
                { band: 8, gain: 0.35 },
                { band: 9, gain: 0.45 },
                { band: 10, gain: 0.55 },
                { band: 11, gain: 0.6 },
                { band: 12, gain: 0.55 },
                { band: 13, gain: 0 },
            ],
        };
        this._eightDData = {
            op: "filters",
            guildId: this.guild,
            rotation: {
                rotationHz: 0.2,
                speed: 0.2
            }
        };
        this._karaokeData = {
            op: "filters",
            guildId: this.guild,
            karaoke: {
                level: 1.0,
                monoLevel: 1.0,
                filterBand: 220.0,
                filterWidth: 100.0
            },
        };
        this._vibratoData = {
            op: "filters",
            guildId: this.guild,
            vibrato: {
                frequency: 10,
                depth: 0.9
            }
        };
        this._tremoloData = {
            op: "filters",
            guildId: this.guild,
            tremolo: {
                frequency: 10,
                depth: 0.5
            }
        };
    }
    set nightcore(status) {
        this._nightcore = status;
        if (status) {
            this._vaporwave = false;
            this._bassboost = false;
            this._soft = false;
            this._pop = false;
            this._treblebass = false;
            this._eightD = false;
            this._karaoke = false;
            this._vibrato = false;
            this._tremolo = false;
            this.socket.send(this._nightcoreData);
        }
        else
            this._resetnode();
    }
    set vaporwave(status) {
        this._vaporwave = status;
        if (status) {
            this._bassboost = false;
            this._nightcore = false;
            this._soft = false;
            this._pop = false;
            this._treblebass = false;
            this._eightD = false;
            this._karaoke = false;
            this._vibrato = false;
            this._tremolo = false;
            this.socket.send(this._vaporwaveData);
        }
        else
            this._resetnode();
    }
    set bassboost(status) {
        this._bassboost = status;
        if (status) {
            this._nightcore = false;
            this._vaporwave = false;
            this._soft = false;
            this._pop = false;
            this._treblebass = false;
            this._eightD = false;
            this._karaoke = false;
            this._vibrato = false;
            this._tremolo = false;
            this.socket.send(this._bassboostData);
        }
        else
            this._resetnode();
    }
    set pop(status) {
        this._pop = status;
        if (status) {
            this._nightcore = false;
            this._vaporwave = false;
            this._bassboost = false;
            this._soft = false;
            this._treblebass = false;
            this._eightD = false;
            this._karaoke = false;
            this._vibrato = false;
            this._tremolo = false;
            this.socket.send(this._popData);
        }
        else
            this._resetnode();
    }
    set soft(status) {
        this._soft = status;
        if (status) {
            this._nightcore = false;
            this._vaporwave = false;
            this._bassboost = false;
            this._pop = false;
            this._treblebass = false;
            this._eightD = false;
            this._karaoke = false;
            this._vibrato = false;
            this._tremolo = false;
            this.socket.send(this._softData);
        }
        else
            this._resetnode();
    }
    set treblebass(status) {
        this._treblebass = status;
        if (status) {
            this._nightcore = false;
            this._vaporwave = false;
            this._bassboost = false;
            this._pop = false;
            this._soft = false;
            this._eightD = false;
            this._karaoke = false;
            this._vibrato = false;
            this._tremolo = false;
            this.socket.send(this._treblebassData);
        }
        else
            this._resetnode();
    }
    set eightD(status) {
        this._eightD = status;
        if (status) {
            this._nightcore = false;
            this._vaporwave = false;
            this._bassboost = false;
            this._pop = false;
            this._soft = false;
            this._treblebass = false;
            this._karaoke = false;
            this._vibrato = false;
            this._tremolo = false;
            this.socket.send(this._eightDData);
        }
        else
            this._resetnode();
    }
    set karaoke(status) {
        this._karaoke = status;
        if (status) {
            this._nightcore = false;
            this._vaporwave = false;
            this._bassboost = false;
            this._pop = false;
            this._soft = false;
            this._treblebass = false;
            this._eightD = false;
            this._vibrato = false;
            this._tremolo = false;
            this.socket.send(this._karaokeData);
        }
        else
            this._resetnode();
    }
    set vibrato(status) {
        this._vibrato = status;
        if (status) {
            this._nightcore = false;
            this._vaporwave = false;
            this._bassboost = false;
            this._pop = false;
            this._soft = false;
            this._treblebass = false;
            this._eightD = false;
            this._karaoke = false;
            this._tremolo = false;
            this.socket.send(this._vibratoData);
        }
        else
            this._resetnode();
    }
    set tremolo(status) {
        this._tremolo = status;
        if (status) {
            this._nightcore = false;
            this._vaporwave = false;
            this._bassboost = false;
            this._pop = false;
            this._soft = false;
            this._treblebass = false;
            this._eightD = false;
            this._karaoke = false;
            this._vibrato = false;
            this.socket.send(this._tremoloData);
        }
        else
            this._resetnode();
    }
    //Get Filter Status
    get nightcore() {
        return this._nightcore;
    }
    get vaporwave() {
        return this._vaporwave;
    }
    get bassboost() {
        return this._bassboost;
    }
    get pop() {
        return this._pop;
    }
    get soft() {
        return this._soft;
    }
    get treblebass() {
        return this._treblebass;
    }
    get eightD() {
        return this._eightD;
    }
    get karaoke() {
        return this._karaoke;
    }
    get vibrato() {
        return this._vibrato;
    }
    get tremolo() {
        return this._tremolo;
    }
    //Reset Everything
    _resetnode() {
        this.socket.send(this._resetData);
    }
    reset() {
        this._resetnode();
        this._nightcore = false;
        this._vaporwave = false;
        this._bassboost = false;
        this._soft = false;
        this._pop = false;
        this._treblebass = false;
        this._eightD = false;
        this._karaoke = false;
        this._vibrato = false;
        this._tremolo = false;
    }
    get manager() {
        return this.socket.manager;
    }
    connect(channel, options = {}) {
        const channelId = typeof channel === "object"
            ? channel?.id
            : channel;
        this.channel = channelId;
        this.socket.manager.send(this.guild, {
            op: 4,
            d: {
                guild_id: this.guild,
                channel_id: channelId ?? null,
                self_deaf: options.selfDeaf ?? false,
                self_mute: options.selfMute ?? false,
            },
        });
        return this;
    }
    disconnect() {
        return this.connect(null);
    }
    async move(socket) {
        this.socket = socket;
        await this.destroy();
        if (this.channel) {
            this.connect(this.channel);
        }
        return this;
    }
    async disconnectroom() {
        this.disconnect();
        return this.send("destroy");
    }
    play(track, options = {}) {
        track = typeof track === "string" ? track : track.track;
        return this.send("play", Object.assign({ track }, options));
    }
    setVolume(volume = 100) {
        if (volume < 0 || volume > 1000) {
            throw new RangeError(`Player#setVolume (${this.guild}): Volume must be within the 0 to 1000 range.`);
        }
        this.volume = volume;
        return this.send("volume", { volume });
    }
    pause(state = true) {
        this.paused = state;
        this.playing = !state;
        return this.send("pause", { pause: state });
    }
    resume() {
        return this.pause(false);
    }
    stop() {
        delete this.track;
        delete this.timestamp;
        this.position = 0;
        return this.send("stop");
    }
    seek(position) {
        if (!this.track) {
            throw new Error(`Player#seek() ${this.guild}: Not playing anything.`);
        }
        return this.send("seek", { position });
    }
    setEqualizer(bands, asFilter = false) {
        if (asFilter) {
            this.filters.equalizer = bands;
            this.filters.apply();
        }
        else {
            this.send("equalizer", { bands });
        }
        return this;
    }
    destroy(disconnect = false) {
        if (disconnect) {
            this.disconnect();
        }
        return this.send("destroy");
    }
    async handleVoiceUpdate(update) {
        "token" in update
            ? this._server = update
            : this._sessionId = update.session_id;
        if (this._sessionId && this._server) {
            await this.send("voiceUpdate", {
                sessionId: this._sessionId,
                event: this._server,
            });
            this.connected = true;
            this._server = this._sessionId = undefined;
        }
        return this;
    }
    send(op, data = {}, priority = false) {
        data.guildId ?? (data.guildId = this.guild);
        this.socket.send({ op, ...data }, priority);
        return this;
    }
    async _event(event) {
        switch (event.type) {
            case "TrackDisconnect":
                try {
                    this.emit("disconnect", event);
                } catch (e) { }
                break;
            case "TrackEndEvent":
                try {
                    if (event.reason !== "REPLACED") {
                        this.playing = false;
                        this.track = {
                            track: event.track,
                            info: decode(event.track)
                        };
                    }
                    this.timestamp = this.track = undefined;
                    this.emit("end", event);
                } catch (e) {
                    console.log(e)
                }
                break;
            case "TrackExceptionEvent":
                try {
                    this.emit("error", event);
                    this.stop()
                } catch (e) { }
                break;
            case "TrackStartEvent":
                try {
                    this.playing = true;
                    this.track = {
                        track: event.track,
                        info: decode(event.track)
                    };
                    this.emit("start", event);
                } catch (e) {
                    console.log(e)
                }
                break;
            case "TrackStuckEvent":
                try {
                    await this.stop();
                    this.emit("stuck", event);
                } catch (e) { }
                break;
            case "WebSocketClosedEvent":
                try {
                    this.emit("closed", event);
                    this.stop()
                } catch (e) {
                    console.log(e)
                }
                break;
        }
    }
    _playerUpdate(update) {
        if (!update.state) {
            return;
        }
        this.position = update.state.position ?? -1;
        this.timestamp = update.state.time;
    }
}
exports.Player = Player;
_filters = new WeakMap();

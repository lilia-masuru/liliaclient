# Installation
**liliaclient (NPM)**

```shell script
npm install liliaclient
```

# How to use the module
<hr>

**register Liliaclient**

```js 
const { Manager } = require("liliaclient");
const { Client } = require("discord.js");

const client = new Client();
const manager = new Manager([
    {
        id: "main",
        host: "localhost",
        port: 2333,
        password: "password"
    }], {
        send(id, data) {
            const guild = bot.guilds.cache.get(id);
            if (guild) guild.shard.send(data);
            return;
        },
        reconnect: {
            auto: true,
            maxTries: 10000000, // max reconnect
            delay: 30 //s
        },
        // Use player.bassboost = true
         filters: {
             bassboost: [
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
             ]
         }
    }
);
client.manager = manager
client.on("ready", async () => {
   client.manager.connect(client.user.id)

});
manager.on("socketError", ({ id }, error) => console.error(`${id} ran into an error`, error));
manager.on("socketDisconnect", ({ id }, a) =>{ m.messagelog(`Music Node: [${id}] Disconnected | ${a}`) });

manager.on("socketReady", (node) => m.messagelog(`Music Node: [${node.id}] Connected`));
client.ws.on("VOICE_STATE_UPDATE", (upd) => manager.stateUpdate(upd));
client.ws.on("VOICE_SERVER_UPDATE", (upd) => manager.serverUpdate(upd));
client.login("Token");
```

**Play Music**

```js
const player = await client.manager.create(message.guild.id)
await player.connect(channel.id, { deafened: true })
player.setVolume(50)
const results = await player.manager.search("ytsearch:genshin impact bgm");
if (!results || results.tracks.length < 1) return undefined;
const {track, info} = results.tracks[0]
player.play(track)
console.log(`Playinig ${info.title}`)
```
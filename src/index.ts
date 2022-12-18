import { Client } from "discord-rpc";
import { existsSync } from "fs";
import { rm } from "fs/promises";
import { startITunesReader, Track, TrackInfo } from "./itunes";
import { getPresence, getStartTimestamp, getTrack } from "./rpc";
import { createScriptFile } from "./script";

async function main() {
    const script = await createScriptFile();
    process.on("SIGINT", async () => {
        if (existsSync(script)) await rm(script);
        process.exit(0);
    })

    const rpc = new Client({
        transport: "ipc"
    });

    rpc.on("ready", async () => {
        while (true) {
            let track: Track | null = null, paused = false;
            for await (const line of startITunesReader(script)) {
                const json = decodeURIComponent(line.trim());
                if (!json.length) {
                    continue;
                }

                console.log("<<<", json);
                const info: TrackInfo = JSON.parse(json);

                /* if stopped break out */
                if (info.state === "STOPPED") {
                    break;
                }

                /* ensure that a track is available */
                if (info.position == 0 || track == null) {
                    track = await getTrack(info);
                }

                /* if paused clear activity */
                if (info.state === "PAUSED") {
                    paused = true;
                    await rpc.clearActivity();
                    continue;
                }

                if (paused) {
                    paused = false;
                    track.startedAt = getStartTimestamp(info);
                }

                rpc.setActivity(getPresence(track));
            };

            console.log(`Exited iTunes read loop, trying again in 5 seconds.`);
            await new Promise(res => setTimeout(res, 5_000));
        }
    });

    await rpc.login({ clientId: "1054013362230530170" });
}

void main();

import type { iTunes, TrackInfo } from "./itunes";
import { AutoClient, type Presence } from "discord-auto-rpc";
import { startITunesReader } from "./script";
import { createPresence, createTrack } from "./tools";

export interface PlayerTrack {
    hash: string;
    info: TrackInfo;
    end: number;
}

export class Player {
    readonly rpc: AutoClient;
    
    track: PlayerTrack | null = null;
    
    paused = false;

    presenceCache: Presence | null = null;

    constructor() {
        this.rpc = new AutoClient({ transport: "ipc" });
    }
    
    async start(script: string) {
        await this.rpc.endlessLogin({ clientId: "1054013362230530170" });
        while (true) {
            for await (const event of startITunesReader(script)) {
                console.log("<<<", JSON.stringify(event));
                switch (event.t) {
                    case "stop":
                        await this.stop();
                        break;
                    case "tick":
                        await this.tick(event.d);
                        break;
                }
            };

            console.log("Exited iTunes read loop");
            await new Promise(resolve => setTimeout(resolve, 5_000));
        }
    }

    async pause() {
        this.paused = true;

        await this.rpc.clearActivity();
    }

    async stop() {
        await this.rpc.clearActivity();
    }

    async tick(event: iTunes.TickEvent) {
        if (event.state === "PAUSED") {
            if (!this.paused) await this.pause();
            return;
        }

        const track = createTrack(event);
        if (this.paused || this.track?.hash !== track.hash) {
            this.paused = false;
            this.track = track;
            this.presenceCache = await createPresence(this.track);
        }

        if (this.presenceCache) {
            await this.rpc.setActivity(this.presenceCache);
        }
    }
}

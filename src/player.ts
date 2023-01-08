import { Activity, delay, getLogger, RPC } from "../deps.ts";
import * as wsh from "./script.ts"
import { createActivity, createTrack } from "./tools.ts";
import { iTunesTickEvent, TrackInfo } from "./types.ts";

export interface PlayerTrack {
    hash: string;
    info: TrackInfo;
    end: number;
}

export class Player {
    static readonly LOGGER = getLogger("player")

    #activity: Activity | null = null;
    #rpc: RPC = new RPC({ id: "1054013362230530170" });
    #signal = new AbortController();
    #paused = false;
    #track: PlayerTrack | null = null;

    async start() {
        // create the script.
        const scriptPath = await wsh.create();

        // connect rpc
        await this.#rpc.connect();

        // race the abort signal and the read loop.
        await Promise.race([
            this.#execute(scriptPath),
            new Promise(resolve => this.#signal.signal.addEventListener("abort", resolve))
        ]);

        // cleanup.
        await this.#rpc.clearActivity();
        this.#rpc.close();

        await Deno.remove(scriptPath);
    }

    destroy() {
        this.#signal.abort();
    }

    async #tick(event: iTunesTickEvent) {
        if (event.state === "PAUSED") {
            if (!this.#paused) {
                this.#paused = true;
                await this.#rpc.clearActivity();
            }

            return;
        }

        const track = await createTrack(event);
        if (this.#paused || this.#track?.hash !== track.hash) {
            this.#paused = false;
            this.#track = track;
            this.#activity = await createActivity(this.#track);
        }

        if (this.#activity) {
            await this.#rpc.setActivity(this.#activity);
        }
    } 

    async #execute(scriptPath: string): Promise<void> {
        while (true) {
            for await (const event of wsh.execute(scriptPath)) {
                Player.LOGGER.debug(() => `Received event: ${JSON.stringify(event)}`);

                if (event.t === "stop") {
                    await this.#rpc.clearActivity();
                } else if (event.t === "tick") {
                    await this.#tick(event.d);
                }
            }

            await delay(5_000);
        }
    }
}

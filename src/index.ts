import { rm } from "fs/promises";
import { Player } from "./player";
import { createScriptFile } from "./script";
import onExit from "signal-exit";

async function main() {
    console.log("> iTunes Companion\n> https://github.com/melike2d/itunes-presence")

    const script = await createScriptFile(), player = new Player();
    onExit(async () => {
        await rm(script);
        await player.stop();
    });

    await player.start(script);
}

void main();

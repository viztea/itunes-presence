import { setup, ConsoleHandler } from "./deps.ts";
import { Player } from "./src/player.ts";

setup({
    handlers: {
        console: new ConsoleHandler("DEBUG")
    },
    loggers: {
        player: {
            level: "DEBUG",
            handlers: ["console"]
        }
    }
});

const player = new Player();
await player.start();

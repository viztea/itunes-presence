import { join, JsonParseStream } from "../deps.ts";
import { iTunesEvent } from "./types.ts";

const SCRIPT_CONTENT = /* js */`
var stderr = WScript
        .CreateObject("Scripting.FileSystemObject")
        .GetStandardStream(2), 
    service = WScript
        .CreateObject("WbemScripting.SWbemLocator")
        .ConnectServer();

var iTunesApp = null, playing = false;

function CreateJsonElement(element) {
    if (typeof element == "string") {
        return '"' + element + '"';
    } else if (typeof element == "object") {
        return CreateJsonObject(element);
    } else {
        return element;
    }
}

function CreateJsonObject(object) {
    var output = "{";
    for (var key in object) {
        if (output != "{") output += ",";
        output += '"' + key + '":' + CreateJsonElement(object[key]);
    }

    return output + "}";
}

function WaitForITunes() {
    while (true) {
        // Search for the "iTunes.exe" process
        var items = service.ExecQuery("SELECT * FROM Win32_Process WHERE Name = 'iTunes.exe'");
        if (items.Count != 0) {
            // If there is, create the object used for retrieving the tracks and return
            iTunesApp = WScript.CreateObject("iTunes.Application");
            return;
        }

        WScript.sleep(1000);
    }
}

function ConvertITTrack(track) {
    if (track == undefined) {
        return null;
    }

    return {
        title: track.Name,
        artist: track.Artist,
        album: track.Album,
        duration: track.Duration
    }
}

function Emit(event, data) {
    var json = CreateJsonObject({ t: event, d: data });
    stderr.WriteLine(json);
}

WaitForITunes();
while(true) {
    if (iTunesApp == null) {
        WaitForITunes();
        continue;
    }

    var track = iTunesApp.CurrentTrack;
    var playerState = iTunesApp.PlayerState;
    if (track == null || playerState == null) {
        if (playing) {
            playing = false;
            Emit("stop");
        }

        continue;
    }

    playing = true;
    
    // Create a JSON object with the track information
    Emit("tick", {
        track: ConvertITTrack(track),
        state: playerState == 0 ? "PAUSED" : "PLAYING",
        position: iTunesApp.PlayerPosition
    });
    
    WScript.sleep(1000);
}

// Reset Variables
iTunesApp = null;
`;

export async function create(): Promise<string> {
    const path = join(Deno.cwd(), "script.js");
    await Deno.writeFile(
        path, 
        new TextEncoder().encode(SCRIPT_CONTENT)
    );

    return path;
}

export function execute(file: string): ReadableStream<iTunesEvent> {
    const p = Deno.run({
        cmd: ["cscript", file],
        stderr: "piped"
    });

    // our script is writing to stderr, so we need to read from that
    const readStream = p.stderr.readable
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new JsonParseStream());

    /* if the parsed chunks do not conform to `iTunesEvent` then it should just be a panic lol. */
    return readStream as unknown as ReadableStream<iTunesEvent>;
}

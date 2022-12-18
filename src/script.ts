import { writeFile } from "node:fs/promises";
import { join } from "node:path";

const SCRIPT_CONTENT = `
var sQuery = "SELECT * FROM Win32_Process WHERE Name = 'iTunes.exe'";
var stderr = WScript.CreateObject("Scripting.FileSystemObject").GetStandardStream(2);

var iTunesApp = null;
var state = "";

function CreateJsonElement(element) {
    if(typeof element == "string") {
        return "\\"" + element + "\\"";
    } else if (typeof element == "object") {
        return CreateJsonObject(element);
    } else {
        return element;
    }
}

function CreateJsonArray(array) {
    var output = "[";
    for(var i = 0; i < array.length; i++) {
        if(output != "[") {
            output += ",";
        }

        var value = array[i];
        output += CreateJsonElement(value);
    }

    output += "]";
    return output;
}

function CreateJsonObject(object) {
    var output = "{";
    for(var key in object) {
        if(output != "{") {
            output += ",";
        }

        var value = object[key];
        output += "\\"" + key + "\\":" + CreateJsonElement(value);
    }
    output += "}";
    return output;
}

function WaitForITunes() {
    var service = WScript.CreateObject("WbemScripting.SWbemLocator").ConnectServer();
    while(true) {
        // Search for the "iTunes.exe" process
        var items = service.ExecQuery(sQuery);
        if(items.Count != 0) {
            // If there is, create the object used for retrieving the tracks and return
            iTunesApp = WScript.CreateObject("iTunes.Application");
            return;
        }
        WScript.sleep(1000);
    }
}

function WriteInfoLine(object) {
    var json = CreateJsonObject(object);
    stderr.WriteLine(encodeURIComponent(json));
}

function MainLoop() {
    while(true) {
        if(iTunesApp == null) {
            LogStopped();
            WaitForITunes();
        } else {
            try {
                var currentTrack = iTunesApp.CurrentTrack;
                var playerState = iTunesApp.PlayerState;
                if(currentTrack == null || playerState == null) {
                    LogStopped();
                } else {
                    if(playerState == 0) {
                        state = "PAUSED";
                    } else {
                        state = "PLAYING";
                    }
                    
                    // Create a JSON object with the track information
                    try {
                        WriteInfoLine({
                            name: currentTrack.Name,
                            artist: currentTrack.Artist,
                            album: currentTrack.Album,
                            state: state,
                            position: iTunesApp.PlayerPosition,
                            duration: currentTrack.Duration,
                            trackNumber: currentTrack.TrackNumber,
                            trackCount: currentTrack.TrackCount
                        });
                    } catch (e) {
                        stderr.WriteLine(e.message);
                    }
                }
                
                WScript.sleep(1000);
            } catch(err) {
                // If iTunes stops, reset the variables and do nothing
                iTunesApp = null;
            }
        }
    }
}

function LogStopped() {
    if(state != "STOPPED") {
        state = "STOPPED";
        WriteInfoLine({ state: state });
    }
}

WaitForITunes();
MainLoop();
`;

export async function createScriptFile() {
    const path = join(process.cwd(), "script-file.js");
    await writeFile(
        path, 
        SCRIPT_CONTENT
    );

    return path;
}

import type { Presence } from "discord-auto-rpc";
import { iTunes, searchAlbum, TrackInfo } from "./itunes";
import type { PlayerTrack } from "./player";
import createHash from "object-hash";
import { TransformStream } from "node:stream/web";

export function formatStr(s: string, minLength = 2, maxLength = 128) {
    return s.length <= maxLength
        ? s.padEnd(minLength)
        : `${s.slice(0, maxLength - 3)}...`;
}


export function getEndTimestamp(track: TrackInfo, position: number) {
    let end = Date.now() + track.duration * 1000;
    if (position > 0) {
        /* offset the end timestamp by the current position */
        end -= position * 1000;
    }

    return end;
}

export async function createPresence(track: PlayerTrack): Promise<Presence> {
    const presence: Presence = {
        details: formatStr(track.info.title),
        endTimestamp: track.end,
        largeImageKey: "ico"
    };

    if (track.info.album.length >= 2) {
        presence.largeImageText = track.info.album;
    }

    if (track.info.artist.length > 0) {
        presence.state = formatStr(`by ${track.info.artist}`);
    }

    /* fetch meta information. */
    const meta = await searchAlbum(track.info.artist, track.info.album);
    if (meta.url) {
        presence.buttons = [{ label: "Listen on Apple Music", url: meta.url }]
    }

    if (meta.artwork) {
        presence.largeImageKey = meta.artwork;
    }

    /* return created presence. */
    return presence;
}

export function createTrack(event: iTunes.TickEvent): PlayerTrack {
    return {
        info: event.track,
        hash: createHash(event.track),
        end: getEndTimestamp(event.track, event.position)
    }
}

/* https://deno.land/std@0.171.0/encoding/json/_parse.ts?source#L68 */
export class JsonParseStream<T = unknown> extends TransformStream<string, T> {
    static readonly BRANKS = /^[ \t\r\n]*$/;

    static isBrankString(str: string) {
        return JsonParseStream.BRANKS.test(str);
    }
    
    constructor() {
        super(
            {
                transform(chunk, controller) {
                    if (!JsonParseStream.isBrankString(chunk)) controller.enqueue(JSON.parse(chunk));
                },
            },
        );
    }
}

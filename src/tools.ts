import { Activity, hex } from "../deps.ts";
import { searchAlbum } from "./itunes.ts";
import type { PlayerTrack } from "./player.ts";
import type { iTunesTickEvent, TrackInfo } from "./types.ts";

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

export async function createActivity(track: PlayerTrack): Promise<Activity> {
    const presence: Activity = {
        details: formatStr(track.info.title),
    };

    if (track.info.artist.length > 0) {
        presence.state = formatStr(`by ${track.info.artist}`);
    }

    /* fetch meta information. */
    const meta = await searchAlbum(track.info.artist, track.info.album);
    if (meta.url) {
        presence.buttons = [{ label: "Listen on Apple Music", url: meta.url }]
    }

    const largeImage = meta.artwork ?? "ico";

    /* return created presence. */
    return {
        assets: { large_image: largeImage, large_text: track.info.album },
        timestamps: { end: track.end },

        ...presence,
    };
}

const dec = new TextDecoder(), enc = new TextEncoder();

export async function createTrack(event: iTunesTickEvent): Promise<PlayerTrack> {
    const hash = await crypto.subtle.digest(
        "SHA-256", 
        enc.encode(JSON.stringify(event.track))
    );
    return {
        info: event.track,
        hash: dec.decode(
            hex.encode(new Uint8Array(hash))
        ), // replace with a better hash method.
        end: getEndTimestamp(event.track, event.position)
    }
}

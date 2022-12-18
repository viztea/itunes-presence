import type { Presence } from "discord-rpc";
import { HydratedTrackInfo, searchAlbum, Track } from "./itunes";

export function getStartTimestamp(info: HydratedTrackInfo): number {
    let start = Date.now();
    if (info.position > 0) {
        /* offset the start timestamp by the current position */
        start -= info.position * 1000;
    }

    return start;
}

export async function getTrack(info: HydratedTrackInfo): Promise<Track> {
    const results = await searchAlbum(info.artist, info.album);
    return {
        startedAt: getStartTimestamp(info),
        info: results,
        album: info.album,
        artist: info.artist,
        name: info.name,
        duration: info.duration
    }
}

function formatStr(s: string, minLength = 2, maxLength = 128) {
    return s.length <= maxLength
        ? s.padEnd(minLength)
        : `${s.slice(0, maxLength - 3)}...`;
}

export function getPresence(track: Track): Presence {
    const presence: Presence = {
        details: formatStr(track.name),
        endTimestamp: track.startedAt + track.duration * 1000,
        largeImageKey: "ico",
        largeImageText: track.album,
    };

    if (track.artist.length > 0) {
        presence.state = formatStr(`by ${track.artist}`);
    }

    if (track.info.url) {
        presence.buttons = [
            { label: "Listen on Apple music", url: track.info.url }
        ]
    }

    if (track.info.artwork) {
        presence.largeImageKey = track.info.artwork;
    }

    return presence;
}

import { spawn } from "node:child_process";
import { Readable } from "node:stream";
import { ReadableStream, TextDecoderStream } from "node:stream/web";

export function startITunesReader(script: string): ReadableStream<string> {
    const proc = spawn(
        "Cscript.exe",
        [script],
        { stdio: "pipe", shell: false }
    );

    return Readable.toWeb(proc.stderr).pipeThrough(new TextDecoderStream())
}

export async function searchAlbum(
    artist: string,
    album: string
): Promise<iTunesInfos> {
    const params = new URLSearchParams({
        media: "music",
        entity: "album",
        term: album.includes(artist) ? artist : `${artist} ${album}`,
        limit: album.includes(artist) ? "" : "1",
    });

    const resp = await fetch(`https://itunes.apple.com/search?${params}`)
        , json: iTunesSearchResponse = await resp.json();

    let result: iTunesSearchResult | undefined;
    if (json.resultCount === 1) {
        result = json.results[0];
    } else if (json.resultCount > 1) {
        result = json.results.find((r) => r.collectionName === album);
    } else if (album.match(/\(.*\)$/)) {
        return await searchAlbum(artist, album.replace(/\(.*\)$/, "").trim());
    }

    const artwork = result?.artworkUrl100.replace("100x100bb", "512x512bb") ?? null;
    const url = result?.collectionViewUrl ?? null;
    return { artwork, url };
}

export interface iTunesInfos {
    artwork: string | null;
    url: string | null;
}

interface iTunesSearchResponse {
    resultCount: number;
    results: iTunesSearchResult[];
}

interface iTunesSearchResult {
    artworkUrl100: string;
    collectionViewUrl: string;
    collectionName: string;
}

export type TrackInfo =
    | { state: "STOPPED" }
    | HydratedTrackInfo

export interface HydratedTrackInfo {
    state: "PLAYING" | "PAUSED";
    name: string;
    artist: string;
    album: string;
    position: number;
    duration: number;
    trackNumber: number;
    trackCount: number;
}

export interface Track {
    info: iTunesInfos;
    name: string;
    album: string;
    duration: number;
    artist: string;
    startedAt: number;
}
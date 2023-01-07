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
        , json: iTunes.SearchResponse = await resp.json();

    let result: iTunes.SearchResult | undefined;
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

/* cry about it */
export namespace iTunes {
    export interface SearchResponse {
        resultCount: number;
        results: SearchResult[];
    }

    export interface SearchResult {
        artworkUrl100: string;
        collectionViewUrl: string;
        collectionName: string;
    }

    type createEvent<$Type, $Data> = { t: $Type, d: $Data }

    export type TickEvent = { state: "PLAYING" | "PAUSED", track: TrackInfo, position: number }

    export type StopEvent = { track: TrackInfo }

    export type Event =
        | createEvent<"tick", TickEvent>
        | createEvent<"stop", StopEvent>
}

export interface TrackInfo {
    title: string;
    album: string;
    duration: number;
    artist: string;
}

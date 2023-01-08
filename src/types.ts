type createEvent<$Type, $Data> = { t: $Type, d: $Data }

export type iTunesTickEvent = { state: "PLAYING" | "PAUSED", track: TrackInfo, position: number }

export type iTunesStopEvent = { track: TrackInfo }

export type iTunesEvent =
    | createEvent<"tick", iTunesTickEvent>
    | createEvent<"stop", iTunesStopEvent>

export interface TrackInfo {
    title: string;
    album: string;
    duration: number;
    artist: string;
}

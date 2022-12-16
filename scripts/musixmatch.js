const musixBaseURL = "https://api.musixmatch.com/ws/1.1/";
const musixKey = "6f134df877d21f6dede4f762d5c8940f";

let lyricsCopyright;

async function musixGetLines(isrc) {
    const trackID = await getTrackID(isrc);
    if (trackID == null) {
        return [];
    }
    return await getLyrics(trackID);
}

async function getTrackID(isrc) {
    let musixURL = musixBaseURL;
    musixURL += "track.get?apikey=";
    musixURL += musixKey;
    musixURL += "&track_isrc=";
    musixURL += isrc;
    const musixRespJson = await (await fetch(musixURL)).json();
    // console.log('Musix Resp Json', musixRespJson);
    // no track was returned by this ISRC
    if (!musixRespJson.message.body.track) {
        return null;
    }
    curHasLyrics = musixRespJson.message.body.track.has_lyrics;
    if (curHasLyrics == 0) {
        return null;
    }
    return musixRespJson.message.body.track.track_id;
}

async function getLyrics(musixID) {
    let musixURL = musixBaseURL;
    musixURL += "track.lyrics.get?apikey=";
    musixURL += musixKey;
    musixURL += "&track_id=";
    musixURL += musixID;
    let lyrics;
    const respJson = await (await fetch(musixURL)).json();
    lyrics = respJson.message.body.lyrics.lyrics_body;
    lyricsCopyright = respJson.message.body.lyrics.lyrics_copyright;
    // console.log('Lyrics', lyrics);
    // console.log('Copyright', lyricsCopyright);
    const copyrightFooter = document.querySelector('#copyright-footer');
    copyrightFooter.textContent = lyricsCopyright;
    return lyricsHandler(lyrics);
}

function lyricsHandler(lyrics) {
    if (lyrics === "") {
        return [];
    }
    const lines = lyrics.split('\n');
    const endIndex = lines.indexOf('...');
    return lines.filter((line, index) => {
        return line !== "" && index < endIndex;
    });
}
let possibleTracks;
let selectedTrack;

function startGame() {
    displayPlaylistSelect();
}

async function displayPlaylistSelect() {
    const userID = await getUserID();
    console.log('User ID:', userID);
    const playlistJson = await callSpotifyGET(`${spotifyBaseURI}/users/${userID}/playlists`);
    console.log('Playlists:', playlistJson);
    const playlists = playlistJson.items;
    console.log('Playlist array:', playlists);
    displaySongSelect(playlists[1].id)
}

async function displaySongSelect(playlistID) {
    console.log('Playlist ID:', playlistID);
    const songsListJson = await callSpotifyGET(`${spotifyBaseURI}/playlists/${playlistID}/tracks`);
    console.log('Songs List:', songsListJson);
    const songsListArray = songsListJson.items;
    console.log('Songs List Items:', songsListArray);
    const possibleTracks = songsListArray.map((song) => song.track);
    console.log('Tracks List:', possibleTracks);
    selectedTrack = possibleTracks[0];
    console.log('Selected Track:', selectedTrack);

    const lyrics = await musixGetLines(selectedTrack.external_ids.isrc);
    console.log('Lyrics:', lyrics);
    console.log('Lyrics line count:', lyrics.length);
}

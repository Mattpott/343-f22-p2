function startGame() {
    displayPlaylistSelect();
}

async function displayPlaylistSelect() {
    const userID = await getUserID().id;
    console.log('User ID:', userID);
    console.log(await callSpotifyGET(`${spotifyBaseURI}/users/${userID}/playlists`));
}

function displaySongSelect() {

}

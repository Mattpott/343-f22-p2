let possibleTracks;
let selectedTrack;
let selectedTrackLyrics;
let selectionButton;
let shownLinesIndexes;

function startGame() {
    const playButton = document.getElementById('play-button-container');
    playButton.remove();
    displayPlaylistSelect();
}

async function displayPlaylistSelect() {
    const userID = await getUserID();
    console.log('User ID:', userID);
    const playlistJson = await callSpotifyGET(`${spotifyBaseURI}/users/${userID}/playlists`);
    console.log('Playlists:', playlistJson);
    // get the list of playlists, but filter out any empty ones
    const playlists = playlistJson.items.filter((playlist) => {
        return playlist.tracks.total > 0;
    });
    console.log('Playlist array:', playlists);
    displayPlaylists(playlists);
}

function displaySelectionButton() {
    const container = document.getElementById('selection-button-container');
    selectionButton = document.createElement('button');
    selectionButton.id = 'selection-button';
    selectionButton.type = 'button';
    // initially begin with playlist select as value
    selectionButton.append('Select A Random Song');
    // this function will be dynamically updated depending on if a song is chosen or not
    selectionButton.onclick = playlistSelectionEvent;
    container.appendChild(selectionButton);
}

function displayPlaylists(playlists) {
    const choiceContainer = document.getElementById('choice-container');
    const playlistNodeList = document.createElement('ul');
    playlistNodeList.classList.add('playlist-list');
    // remove all currently displayed nodes from the choice container
    while (choiceContainer.hasChildNodes()) {
        choiceContainer.removeChild(choiceContainer.lastChild);
    }
    playlists.forEach(playlist => {
        const playlistID = playlist.id;
        const imageNode = document.createElement('img');
        imageNode.classList.add('playlist-card-image');
        // set the image to the first one given by playlist query
        imageNode.src = playlist.images[0].url;
        const playlistCard = document.createElement('li');
        playlistCard.classList.add('playlist-card');
        playlistCard.appendChild(imageNode);
        playlistCard.append(playlist.name);
        playlistCard.addEventListener('click', () => {
            displaySelectionButton();
            displaySongSelect(playlistID)
        });
        playlistNodeList.appendChild(playlistCard);
    });
    choiceContainer.appendChild(playlistNodeList);
}

async function displaySongSelect(playlistID) {
    const choiceContainer = document.getElementById('choice-container');
    const trackNodeList = document.createElement('ol');
    trackNodeList.classList.add('track-list');
    // remove all currently displayed playlist nodes from the choice container
    while (choiceContainer.hasChildNodes()) {
        choiceContainer.removeChild(choiceContainer.lastChild);
    }
    console.log('Playlist ID:', playlistID);
    // get selected playlist's track list
    const songsListJson = await callSpotifyGET(`${spotifyBaseURI}/playlists/${playlistID}/tracks`);
    console.log('Songs List:', songsListJson);
    // extract the list of tracks
    const songsListArray = songsListJson.items;
    console.log('Songs List Items:', songsListArray);
    // get the track objects from that list
    possibleTracks = songsListArray.map((song) => song.track);
    console.log('Tracks List:', possibleTracks);
    possibleTracks.forEach((track) => {
        const trackImage = document.createElement('img');
        trackImage.classList.add('track-image');
        // set the image to the first one given in the track's info
        trackImage.src = track.album.images[0].url;
        // create an array of all the artists who contributed to the song
        const trackArtists = track.artists.map((artist) => artist.name);
        const trackNode = document.createElement('li');
        trackNode.classList.add('track-node');
        trackNode.appendChild(trackImage);
        trackNode.append(track.name, trackArtists);
        trackNode.addEventListener('click', () => {
            // this node is the selected node, so deselect it
            if (trackNode.classList.contains('selected-track')) {
                // update the button
                selectionButton.lastChild.replaceWith('Select A Random Song');
                selectionButton.onclick = playlistSelectionEvent;
            }
            // set this node to be the new selected track, 
            // updating previously selected track to longer be such
            selectedTrack = track;
            const prevSelected = document.querySelector('.selected-track');
            if (prevSelected) {
                prevSelected.classList.remove('selected-track');
                return;
            }
            // add selected-track class to this node
            trackNode.classList.add('selected-track');
            // update the button
            selectionButton.lastChild.replaceWith('Select This Song');
            selectionButton.onclick = songSelectionEvent;
        });
        trackNodeList.appendChild(trackNode);
    });
    choiceContainer.appendChild(trackNodeList);
}


async function playlistSelectionEvent() {
    // set the selected track to a random one, 
    // ensuring the random track has displayable lyrics
    let trackISRC;
    do {
        selectedTrack = possibleTracks[Math.floor(Math.random() * possibleTracks.length)];
        trackISRC = selectedTrack.external_ids.isrc;
        selectedTrackLyrics = await musixGetLines(trackISRC);
        console.log('Selected Track Lyrics:', selectedTrackLyrics);
    }
    while (selectedTrackLyrics.length < 9);
    // play the lyric game
    play();
}

async function songSelectionEvent() {
    // get the index of the selected track
    // const selectedIndex = Array.from(trackNodeList.children).indexOf(selectedTrackNode);
    const trackISRC = selectedTrack.external_ids.isrc;
    selectedTrackLyrics = await musixGetLines(trackISRC);
    console.log('Selected Track Lyrics:', selectedTrackLyrics);
    if (selectedTrackLyrics.length < 9) {
        alert("Song with too few lyrics chosen, please choose another");
        return;
    }
    play();
}

function play() {
    displayLyrics();
    setUpLineEntry();
}

async function displayLyrics() {
    // clear previous view
    const choiceContainer = document.getElementById('choice-container');
    choiceContainer.removeChild(choiceContainer.lastChild);
    const selectionButtonContainer = document.getElementById('selection-button-container');
    selectionButtonContainer.removeChild(selectionButton);
    // set up lyric view
    const lyricContainer = document.getElementById('lyric-container');
    const lyricListNode = document.createElement('ol');
    lyricListNode.classList.add('lyrics-list');
    selectedTrackLyrics.forEach((line) => {
        const lineNode = document.createElement('li');
        lineNode.classname = 'lyrics-line';
        lyricListNode.appendChild(lineNode);
    });
    lyricContainer.appendChild(lyricListNode);
    shownLinesIndexes = [];
    // console.log('Lyrics:', selectedTrackLyrics);
}

function setUpLineEntry() {
    const searchEntry = document.querySelector('.input-location');
    const numberEntry = document.createElement('input');
    numberEntry.type = 'number';
    numberEntry.className = 'input-location';
    numberEntry.addEventListener('change', handleNumberEntry);
    searchEntry.replaceWith(numberEntry);
}

function handleNumberEntry() {
    const entry = document.querySelector('.input-location');
    const value = entry.value;
    if (value <= 0 || value > selectedTrackLyrics.length) {
        alert('Number is not a valid line, please enter another');
        entry.value = null;
        return;
    }
    if (shownLinesIndexes.includes(value - 1)) {
        return;
    }
    if (shownLinesIndexes.length >= 5) {
        alert('Max number of lines are already shown, please make a guess');
        entry.value = null;
        return;
    }
    const linesDisplay = document.querySelector('.lyrics-list');
    const linesNodes = Array.from(linesDisplay.children);
    linesNodes[value - 1].innerHTML = `${selectedTrackLyrics[value - 1]}`;
    shownLinesIndexes.push(value - 1);
    entry.value = null;
    console.log('Lines Shown:', shownLinesIndexes);
}
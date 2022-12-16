let main;
let possiblePlaylists;
let selectedPlaylistID;
let selectionButton;

async function displayInitialSelection() {
    main = document.querySelector('main');
    await buildPossiblePlaylists();
    displayPlaylists(possiblePlaylists);
}

async function buildPossiblePlaylists() {
    const userID = await getUserID();
    console.log('User ID:', userID);
    const playlistJson = await callSpotifyGET(`${spotifyBaseURI}/users/${userID}/playlists`);
    console.log('Playlists:', playlistJson);
    possiblePlaylists = playlistJson.items.filter((playlist) => {
        return playlist.tracks.total > 0;
    });
}

function displayPlaylists(playlists) {
    setUpChoiceView();
    setFilterFunction(playlistFilter);
    // get the list of playlists, but filter out any empty ones
    console.log('Playlist array:', playlists);
    const playlistNodeList = document.createElement('ul');
    playlistNodeList.classList.add('playlist-list');
    playlists.forEach(playlist => {
        const playlistID = playlist.id;
        const imageNode = document.createElement('img');
        // set the image to the first one given by playlist query
        imageNode.src = playlist.images[0].url;
        const playlistCard = document.createElement('li');
        playlistCard.classList.add('playlist-card');
        playlistCard.appendChild(imageNode);
        playlistCard.append(playlist.name);
        playlistCard.addEventListener('click', () => {
            selectedPlaylistID = playlistID;
            displayBackButton();
            displayPlaylistSongs(playlistID)
        });
        playlistNodeList.appendChild(playlistCard);
    });
    document.getElementById('choice-container').appendChild(playlistNodeList);
}

function setUpChoiceView() {
    window.scrollTo(0, 0);
    let choiceContainer = document.getElementById('choice-container');
    // must be setting up song select if not null, so only need to clear container
    if (choiceContainer) {
        // clear the shown choices
        while (choiceContainer.hasChildNodes()) {
            choiceContainer.removeChild(choiceContainer.lastChild);
        }
        return;
    }
    // clear previous view
    while (main.hasChildNodes()) {
        main.removeChild(main.lastChild);
    }
    // add search bar
    const playListSearch = document.createElement('input');
    playListSearch.type = 'search';
    playListSearch.className = 'input-location';
    main.appendChild(playListSearch);
    // add choice container
    choiceContainer = document.createElement('div');
    choiceContainer.id = 'choice-container';
    main.appendChild(choiceContainer);
}

function setFilterFunction(func) {
    const filterBox = document.querySelector('.input-location');
    filterBox.removeEventListener('input', playlistFilter);
    filterBox.removeEventListener('input', songListFilter);
    filterBox.addEventListener('input', func);
}

function playlistFilter(ev) {
    const query = ev.target.value;
    const filteredPlaylists = possiblePlaylists.filter((playlist) => {
        return playlist.name.toLowerCase().includes(query.toLowerCase())
    });
    displayPlaylists(filteredPlaylists);
}

function songListFilter(ev) {
    const query = ev.target.value;
    const filteredTracks = possibleTracks.filter((track) => {
        const trackArtists = track.artists.filter((artist) => {
            artist.name.toLowerCase().includes(query.toLowerCase())
        });
        return track.name.toLowerCase().includes(query.toLowerCase()) || trackArtists.length !== 0;
    });
    displayTracks(filteredTracks);
}

function displayBackButton() {
    const header = document.getElementById('top-header');
    const backButton = document.createElement('button');
    backButton.id = 'back-button';
    backButton.type = 'button';
    backButton.append('Back');
    header.insertBefore(backButton, header.firstChild);
}

function setBackButtonOnclick(func) {
    const backButton = document.getElementById('back-button');
    backButton.onclick = func;
}

async function displayPlaylistSongs(playlistID) {
    // get selected playlist's track list
    const songsListJson = await callSpotifyGET(`${spotifyBaseURI}/playlists/${playlistID}/tracks`);
    const songsListArray = songsListJson.items;
    // get the track objects from that list
    possibleTracks = songsListArray.map((song) => song.track);
    displayTracks(possibleTracks);
}

async function displayTracks(tracks) {
    setBackButtonOnclick((ev) => {
        ev.target.remove();
        document.getElementById('selection-button-container').remove();
        displayPlaylists(possiblePlaylists);
    });
    setUpChoiceView();
    setFilterFunction(songListFilter);
    if (!document.getElementById('selection-button-container')) {
        displaySelectionButton();
    }
    const trackNodeList = document.createElement('ol');
    trackNodeList.classList.add('track-list');
    tracks.forEach((track) => {
        const trackImage = document.createElement('img');
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
    document.getElementById('choice-container').appendChild(trackNodeList);
}

function displaySelectionButton() {
    const selectionButtonContainer = document.createElement('div');
    selectionButtonContainer.id = 'selection-button-container';
    main.insertBefore(selectionButtonContainer, main.lastChild);
    selectionButton = document.createElement('button');
    selectionButton.className = 'selection-button';
    selectionButton.type = 'button';
    // initially begin with playlist select as value
    selectionButton.append('Select A Random Song');
    // this function will be dynamically updated depending on if a song is chosen or not
    selectionButton.onclick = playlistSelectionEvent;
    selectionButtonContainer.appendChild(selectionButton);
}
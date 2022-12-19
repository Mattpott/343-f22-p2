let possibleTracks;
let selectedTrack;
let selectedTrackLyrics;
let shownLinesIndexes;

async function playlistSelectionEvent() {
    // set the selected track to a random one, 
    // ensuring the random track has enough displayable lyrics
    let trackISRC;
    let ind = 0;
    do {
        selectedTrack = possibleTracks[Math.floor(Math.random() * possibleTracks.length)];
        trackISRC = selectedTrack.external_ids.isrc;
        selectedTrackLyrics = await musixGetLines(trackISRC);
        ind++;
        // console.log('Selected Track Lyrics:', selectedTrackLyrics);
    }
    while (selectedTrackLyrics.length < 9 && ind < possibleTracks.length);
    if (ind === possibleTracks.length) {
        alert(`No playable songs in this playlist. \n${ind} requests were wasted.`);
    }
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

async function play() {
    await displayLyricScreen();
    buildGameInputs();
}

async function displayLyricScreen() {
    // make back button go to song select
    setBackButtonOnclick(() => displayTracks(possibleTracks));
    // clear previous view
    while (main.hasChildNodes()) {
        main.removeChild(main.lastChild);
    }
    // set up lyric view
    const lyricContainer = document.createElement('div');
    lyricContainer.id = 'lyric-container';
    main.appendChild(lyricContainer);
    const lyricListNode = document.createElement('ol');
    lyricListNode.className = ('lyrics-list');
    selectedTrackLyrics.forEach(() => {
        const lineNode = document.createElement('li');
        lineNode.className = 'lyrics-line';
        lyricListNode.appendChild(lineNode);
    });
    lyricContainer.appendChild(lyricListNode);
    shownLinesIndexes = [];
    // console.log('Lyrics:', selectedTrackLyrics);
}

function buildGameInputs() {
    // number input
    const lyricContainer = document.getElementById('lyric-container');
    const numberEntry = document.createElement('input');
    numberEntry.placeholder = 'Input Desired Line Number';
    numberEntry.type = 'number';
    numberEntry.className = 'input-location';
    numberEntry.addEventListener('change', (ev) => handleNumberEntry(ev));

    // song search
    main.insertBefore(numberEntry, lyricContainer);
    const songSearchWrapper = document.createElement('div');
    songSearchWrapper.id = 'song-search-wrapper';
    const searchEntry = document.createElement('input');
    searchEntry.placeholder = 'Search for song here';
    searchEntry.type = 'text';
    searchEntry.id = 'song-search-input';
    searchEntry.className = 'input-location';
    searchEntry.addEventListener('input', (ev) => handleSearchEntry(ev.target.value));
    searchEntry.addEventListener('focus', searchGainFocus);
    songSearchWrapper.addEventListener('focusout', (ev) => searchLoseFocus(ev));
    songSearchWrapper.appendChild(searchEntry);

    main.appendChild(songSearchWrapper);

}

function handleNumberEntry(ev) {
    // target is the entry box
    const entry = ev.target;
    const value = entry.value;
    // bad value, so do nothing
    if (value <= 0 || value > selectedTrackLyrics.length) {
        alert('Number does not correspond to a valid line, please enter another');
        entry.value = null;
        return;
    }
    // value already present, so do nothing
    if (shownLinesIndexes.includes(value - 1)) {
        return;
    }
    // too many lines already shown, so do nothing
    if (shownLinesIndexes.length >= 5) {
        alert('Max number of lines are already shown, please make a guess');
        entry.value = null;
        return;
    }
    // number works, so display the corresponding lyric line
    const linesDisplay = document.querySelector('.lyrics-list');
    const linesNodes = Array.from(linesDisplay.children);
    linesNodes[value - 1].innerHTML = `${selectedTrackLyrics[value - 1]}`;
    // adjust any dependencies like shown indexes
    shownLinesIndexes.push(value - 1);
    entry.value = null;
}

function handleSearchEntry(query) {
    const oldSearchList = document.getElementById('song-search-list');
    if (query === "") {
        if (oldSearchList) {
            // no text entered but the list is showing, so hide it
            oldSearchList.remove();
        }
        return;
    }
    const newSearchList = document.createElement('ul');
    newSearchList.id = 'song-search-list';
    const queriedSongs = possibleTracks.filter((track) => {
        const trackArtists = track.artists.filter((artist) => {
            return artist.name.toLowerCase().includes(query.toLowerCase());
        });
        return track.name.toLowerCase().includes(query.toLowerCase()) || trackArtists.length !== 0;
    });
    // set current search list to an empty one
    const container = document.getElementById('song-search-wrapper');
    if (queriedSongs.length === 0) {
        if (!oldSearchList) {
            container.insertBefore(newSearchList, container.lastChild);
        } else {
            oldSearchList.replaceWith(newSearchList);
        }
    }
    queriedSongs.forEach((song) => {
        const songResult = document.createElement('li');
        songResult.className = 'queried-song';
        songResult.append(song.name);
        // in order to check if clicked on blur of the input
        songResult.tabIndex = -1;
        songResult.addEventListener('click', (ev) => handleSongSubmission(ev));
        newSearchList.appendChild(songResult);
    });
    // update the visual
    if (!oldSearchList) {
        container.insertBefore(newSearchList, container.lastChild);
    } else {
        oldSearchList.replaceWith(newSearchList);
    }
}

function searchLoseFocus(ev) {
    const searchList = document.getElementById('song-search-list');
    if (searchList) {
        // clicked on a song within the list, so don't hide
        if (searchList.contains(ev.relatedTarget)) {
            return;
        }
        searchList.hidden = true;
    }
}

function searchGainFocus() {
    const searchList = document.getElementById('song-search-list');
    if (searchList) {
        searchList.hidden = false;
    }
}

function handleSongSubmission(ev) {
    // searchLoseFocus();
    const input = ev.target;
    const submittedTrackTitle = input.innerText;
    document.getElementById('song-search-input').value = submittedTrackTitle;
    const resultScreen = document.createElement('div');
    resultScreen.id = 'result-screen-container';
    
    const result = document.createElement('p');
    result.append(`The Song Was:\n${selectedTrack.name}\n`);
    // console.log('Selected:', selectedTrack);
    if (selectedTrack.name.toLowerCase().includes(submittedTrackTitle.toLowerCase())) {
        result.append('You Got It Right!');
    } else {
        result.append('You Got It Wrong, Try Again');
    }
    resultScreen.appendChild(result);

    const playAgainButton = document.createElement('button');
    playAgainButton.type = 'button';
    playAgainButton.append('Play Again');
    playAgainButton.onclick = () => displayTracks(possibleTracks);
    resultScreen.appendChild(playAgainButton);
    main.appendChild(resultScreen);
}
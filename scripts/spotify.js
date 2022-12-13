const spotifyBaseURI = "https://api.spotify.com/v1";

async function getUserID() {
    const resp = await callSpotifyGET (spotifyBaseURI + "/me");
    return resp.id;
}

async function callSpotifyGET(url) {
    const resp = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + spotifyAccessToken
        }
    });
    if (resp.status == 200) {
        // all good, so return received data as json
        return await resp.json();
    } else if (resp.status == 401) {
        // need to refresh access token
        refreshAccessToken();
        // access token refreshed, so make call again
        return callSpotifyGET(url);
    } else {
        // bad response, so alert and log problem
        console.log("Error response:", resp);
        alert("Bad status was received handling request:", resp);
        return null;
    }
}


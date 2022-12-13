// const spotifyRedirectURI = "https://mattpott.github.io/343-f22-p2/index.html"
const spotifyRedirectURI = "http://127.0.0.1:5500/index.html";

const spotifyClientID = "0fda33fa1e274e3abebe40455206dbb0";
const spotifyClientSecret = "73175ba3f83e417d92669a4ac6018474";
const spotifyAuthorizeURL = "https://accounts.spotify.com/authorize";
let spotifyAccessToken;
let spotifyRefreshToken;

window.onload = onPageLoad;

/*
Auth loop is as follows:
    1. Query Spotify using Client ID and Client Secret
    2. Route user to Spotify Authentication page
    3. User signs in, page gets rerouted to secondary page 
    where the Access and Refresh Tokens are scraped from the URL
    4. Using Genius Client Access Token and retrieved Spotify token,
    play the game
    5. If the Spotify Access Token need to be refreshed, 
    query the API using the Refresh Token to refresh it.
*/

async function onPageLoad() {
    // data is encoded in URL, so this occurs on redirect during authentication
    if (window.location.search.length > 0) {
        handleRedirect();
    } else {
        // handles before authentication runs
        // no access token exists for spotify, so request one again
        spotifyAccessToken = localStorage.getItem("spotify_access_token");
        if (spotifyAccessToken == null) {
            requestSpotifyAuthorization();
            return;
        }
    }
}

function requestSpotifyAuthorization() {
    // get permissions using my client ID and secret
    let url = spotifyAuthorizeURL;
    url += "?client_id=" + spotifyClientID;
    url += "&response_type=code";
    url += "&redirect_uri=" + encodeURI(spotifyRedirectURI);
    url += "&show_dialog=true";
    url += "&scope=playlist-read-private playlist-read-collaborative user-library-read";
    window.location.href = url; // Show Spotify's authorization screen
}

function handleRedirect() {
    let code = getCode();
    fetchAccessToken(code);
    // removes the parameters from the url
    window.history.pushState("", "", spotifyRedirectURI);
}

function getCode() {
    let code = null;
    const queryString = window.location.search;
    if (queryString.length > 0) {
        const urlParams = new URLSearchParams(queryString);
        code = urlParams.get('code');
    }
    return code;
}

function fetchAccessToken(code) {
    let body = "grant_type=authorization_code";
    body += "&code=" + code;
    body += "&redirect_uri=" + encodeURI(spotifyRedirectURI);
    body += "&client_id=" + spotifyClientID;
    body += "&client_secret=" + spotifyClientSecret;
    callAuthorizationApi(body);
}

function callAuthorizationApi(body) {
    fetch("https://accounts.spotify.com/api/token", {
        method: 'POST',
        body: body,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(spotifyClientID + ':' + spotifyClientSecret)
        }
    })
        .then(resp => handleAuthResponse(resp))
        .catch(reason => alert("Failed to handle the authorization response:", reason));
}

function handleAuthResponse(resp) {
    if (resp.status == 200) {
        // all good
        resp.json().then(respJson => {
            if (respJson.access_token != undefined) {
                spotifyAccessToken = respJson.access_token;
                localStorage.setItem("spotify_access_token", spotifyAccessToken);
            }
            if (respJson.refresh_token != undefined) {
                spotifyRefreshToken = respJson.refresh_token;
                localStorage.setItem("spotify_refresh_token", spotifyRefreshToken);
            }
        });
    } else {
        // bad response, so alert and log problem
        console.log("Error response:", resp);
        alert("Bad status was received handling request:", resp);
    }
}

function refreshAccessToken() {
    refreshToken = localStorage.getItem("spotify_refresh_token");
    let body = "grant_type=refresh_token";
    body += "&refresh_token=" + refreshToken;
    body += "&client_id=" + spotifyClientID;
    callAuthorizationApi(body);
}
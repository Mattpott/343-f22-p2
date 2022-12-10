// const redirectURI = "https://mattpott.github.io/343-f22-p2/index.html"
const redirectURI = "http://127.0.0.1:5500/index.html";

const spotifyClientID = "0fda33fa1e274e3abebe40455206dbb0";
const spotifyClientSecret = "73175ba3f83e417d92669a4ac6018474";
const spotifyAuthorizeURL = "https://accounts.spotify.com/authorize";
let spotifyAccessToken;
let spotifyRefreshToken;

const geniusClientID = "MMil_jC5rx7rairCJbvwzG3Vz4Ej0ICyKvVkNiy_skdXd_hAdEMb37r5xmtwzu30";
const geniusClientSecret = "70jUVuJYLUtvwIOdoc20F91kkkP82YWFBJ2hbz6O332l0N7FQ3jWoBrFSSznP2xyKVq79fSDGOUA65M5Ahhlig";
const geniusAuthorizeURL = "https://api.genius.com/oauth/authorize";
let geniusAccessToken;
let geniusRefreshToken;

/*
Auth loop is as follows:
    1. Query Spotify using Client ID and Client Secret
    2. Route user to Spotify Authentication page
    3. User signs in, page gets rerouted to secondary page 
    where the Access and Refresh Tokens are scraped from the URL
    4. Query Genius using Client ID and Client Secret
    5. Route user to Genius Authentication page
    6. User signs in, page gets rerouted to secondary page 
    where the Access and Refresh Tokens are scraped from the URL
    7. Using these Access Tokens, play the game
    8. If an Access Token need to be refreshed, query the appropriate
    API using the Refresh Token and refresh it.
*/
function onPageLoad() {
    // data must be encoded in URL from data recieved
    if (window.location.search.length > 0) {
        // if the page has been routed for spotify
        if (sessionStorage.get("routed_spotify") == true) {
            handleRedirect("spotify");
            sessionStorage.setItem("routed_spotify" == false);
        }
        // if the page has been routed for genius
        if (sessionStorage.getItem("routed_genius") == true) {
            handleRedirect("genius")
            sessionStorage.setItem("routed_genius" == false);
        }
    } else {
        // no access token is present, so request one from the API
        spotifyAccessToken = localStorage.getItem("spotify_access_token");
        if (spotifyAccessToken == null) {
            requestSpotifyAuthorization();
        }
        geniusAccessToken = localStorage.getItem("genius_access_token");
        if (geniusAccessToken == null) {
            requestGeniusAuthorization();
        }
    }
}

function requestSpotifyAuthorization() {
    const scope = "&scope=playlist-read-private playlist-read-collaborative user-library-read";
    requestOAuth(spotifyAuthorizeURL, spotifyClientID, scope);
    sessionStorage.setItem("routed_spotify", true);
}

function requestGeniusAuthorization() {
    requestOAuth(geniusAuthorizeURL, geniusClientID, "");
    sessionStorage.setItem("routed_genius", true);
}

function requestOAuth(url, clientID, scope) {
    // get permissions using my client ID and secret
    let authURL = url;
    authURL += "?client_id=" + clientID;
    authURL += "&response_type=code";
    authURL += "&redirect_uri=" + encodeURI(redirectURI);
    authURL += "&show_dialog=true";
    authURL += scope;
    window.location.href = authURL; // Show associated authorization screen
}

function handleRedirect(router) {
    let code = getCode();
    if (router == "spotify") {
        fetchSpotifyAccessToken(code);
    } else if (router == "genius") {
        fetchGeniusAccessToken(code);
    }
    // removes the parameters from the url
    window.history.pushState("", "", redirectURI);
}

function getCode() {
    let code = null;
    const queryString = window.location.search;
    if (queryString.length > 0) {
        const urlParams = new URLSearchParams(queryString);
        code = urlParams.get("code");
    }
    return code;
}

function fetchSpotifyAccessToken(code) {
    let body = "grant_type=authorization_code";
    body += "&code=" + code;
    body += "&redirect_uri=" + encodeURI(redirectURI);
    body += "&client_id=" + spotifyClientID;
    body += "&client_secret=" + spotifyClientSecret;
    callAuthorizationApi(body);
}

function fetchGeniusAccessToken(code) {
    let body = "grant_type=authorization_code";
    body += "&code=" + code;
    body += "&redirect_uri=" + encodeURI(redirectURI);
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
    // all good
    console.log("status", resp.status);
    if (resp.status == 200) {
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
        // bad response, so alert and log problem
    } else {
        console.log("Error response:", resp);
        alert("Bad status was received handling request:", resp);
    }
}

function callSpotifyAPI(url, method, body) {
    fetch(url, {
        method: method,
        body: body,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + spotifyAccessToken
        }
    }).then(resp => checkStatus(resp));
    // should be a general function? TODO
}

function checkStatus(resp) {
    // all good
    console.log("status", resp.status);
    if (resp.status == 200) {
        resp.json().then(respJson => {
            if (respJson.access_token != undefined) {
                spotifyAccessToken = respJson.access_token;
                localStorage.setItem("spotify_access_token", spotifyAccessToken);
                spotifyRefreshToken = respJson.refresh_token;
                localStorage.setItem("spotify_refresh_token", spotifyRefreshToken);
            }
        });
        // need to refresh access token
    } else if (resp.status == 401) {
        refreshAccessToken();
        // bad response, so alert and log problem
    } else {
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
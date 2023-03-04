import * as dotenv from 'dotenv';
import SpotifyWebApi from 'spotify-web-api-node';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });
const spotifyTokens = JSON.parse(fs.readFileSync(path.join(__dirname, "../tokens.spotify.json")));

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: 'http://localhost:3000'
});

spotifyApi.setRefreshToken(spotifyTokens.refresh_token);
spotifyApi.setAccessToken(spotifyTokens.access_token);

export async function currentTrack() {
   let track;
   try {
      track = await spotifyApi.getMyCurrentPlayingTrack();
   } catch(err) {
      if (err.body.error?.status !== 401 && err.statusCode !== 403) throw err;
      const refreshResponse = await spotifyApi.refreshAccessToken();
      spotifyApi.setAccessToken(refreshResponse.body['access_token']);
      track = await spotifyApi.getMyCurrentPlayingTrack();
   }

   return track.body.item;
}



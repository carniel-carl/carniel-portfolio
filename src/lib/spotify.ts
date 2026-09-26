// Spotify sign-in (Authorization Code + PKCE, browser only: no client secret)
// and the official Embed iFrame API. Sign-in is enabled when
// NEXT_PUBLIC_SPOTIFY_CLIENT_ID is set and `<origin>/spotify/callback` is
// registered as a Redirect URI in the Spotify developer dashboard.

const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
const SCOPES = "playlist-read-private playlist-read-collaborative";

const TOKEN_KEY = "carniel:spotify-token";
const VERIFIER_KEY = "carniel:spotify-verifier";
const STATE_KEY = "carniel:spotify-state";
const RETURN_KEY = "carniel:spotify-return";
export const JUST_CONNECTED_KEY = "carniel:spotify-connected";

export const spotifySignInEnabled = Boolean(CLIENT_ID);

type StoredToken = { access: string; refresh?: string; expiresAt: number };

export type SpotifyPlaylist = {
  id: string;
  name: string;
  image?: string;
  tracks: number;
  uri: string;
};

// HDR: Links and URIs

// Accepts open.spotify.com links (with or without /intl-xx/) or spotify: URIs
export const toSpotifyUri = (input: string) => {
  const value = input.trim();
  const uri = value.match(/^spotify:(playlist|album|track|artist|episode|show):([A-Za-z0-9]+)$/);
  if (uri) return value;
  const link = value.match(
    /open\.spotify\.com\/(?:intl-[a-z-]+\/)?(playlist|album|track|artist|episode|show)\/([A-Za-z0-9]+)/,
  );
  return link ? `spotify:${link[1]}:${link[2]}` : null;
};

// HDR: PKCE sign-in

const redirectUri = () => `${window.location.origin}/spotify/callback`;

const randomString = (length: number) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (v) => chars[v % chars.length]).join("");
};

const challengeFor = async (verifier: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};

export async function connectSpotify() {
  if (!CLIENT_ID) return;
  const verifier = randomString(64);
  const state = randomString(16);
  sessionStorage.setItem(VERIFIER_KEY, verifier);
  sessionStorage.setItem(STATE_KEY, state);
  sessionStorage.setItem(RETURN_KEY, window.location.pathname + window.location.search);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: redirectUri(),
    code_challenge_method: "S256",
    code_challenge: await challengeFor(verifier),
    scope: SCOPES,
    state,
  });
  window.location.assign(`https://accounts.spotify.com/authorize?${params}`);
}

const saveToken = (json: { access_token: string; refresh_token?: string; expires_in: number }, fallbackRefresh?: string) => {
  const token: StoredToken = {
    access: json.access_token,
    refresh: json.refresh_token ?? fallbackRefresh,
    expiresAt: Date.now() + (json.expires_in - 60) * 1000,
  };
  localStorage.setItem(TOKEN_KEY, JSON.stringify(token));
  return token;
};

// Runs on /spotify/callback. Returns where to send the visitor back to.
export async function completeSpotifySignIn(): Promise<{ ok: boolean; returnTo: string }> {
  const returnTo = sessionStorage.getItem(RETURN_KEY) || "/";
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");
  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  const expected = sessionStorage.getItem(STATE_KEY);
  sessionStorage.removeItem(VERIFIER_KEY);
  sessionStorage.removeItem(STATE_KEY);
  sessionStorage.removeItem(RETURN_KEY);

  if (!CLIENT_ID || !code || !verifier || !state || state !== expected) {
    return { ok: false, returnTo };
  }

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri(),
      code_verifier: verifier,
    }),
  });
  if (!res.ok) return { ok: false, returnTo };
  saveToken(await res.json());
  sessionStorage.setItem(JUST_CONNECTED_KEY, "1");
  return { ok: true, returnTo };
}

const readToken = (): StoredToken | null => {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    return raw ? (JSON.parse(raw) as StoredToken) : null;
  } catch {
    return null;
  }
};

export const isSpotifyConnected = () => Boolean(readToken());

export function disconnectSpotify() {
  localStorage.removeItem(TOKEN_KEY);
}

async function accessToken(): Promise<string | null> {
  const token = readToken();
  if (!token) return null;
  if (Date.now() < token.expiresAt) return token.access;
  if (!token.refresh || !CLIENT_ID) {
    disconnectSpotify();
    return null;
  }
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: "refresh_token",
      refresh_token: token.refresh,
    }),
  });
  if (!res.ok) {
    disconnectSpotify();
    return null;
  }
  return saveToken(await res.json(), token.refresh).access;
}

async function api<T>(path: string): Promise<T> {
  const token = await accessToken();
  if (!token) throw new Error("not-connected");
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    disconnectSpotify();
    throw new Error("not-connected");
  }
  if (!res.ok) throw new Error(`spotify-${res.status}`);
  return res.json() as Promise<T>;
}

export async function fetchSpotifyProfile() {
  const me = await api<{ display_name: string | null }>("/me");
  return me.display_name;
}

export async function fetchSpotifyPlaylists(): Promise<SpotifyPlaylist[]> {
  const data = await api<{
    items: {
      id: string;
      name: string;
      uri: string;
      images: { url: string }[] | null;
      tracks: { total: number };
    }[];
  }>("/me/playlists?limit=30");
  return data.items.filter(Boolean).map((p) => ({
    id: p.id,
    name: p.name,
    uri: p.uri,
    image: p.images?.[p.images.length - 1]?.url ?? p.images?.[0]?.url,
    tracks: p.tracks?.total ?? 0,
  }));
}

// HDR: Embed iFrame API (reports play/pause so the UI can react)

export type SpotifyEmbedController = {
  loadUri: (uri: string) => void;
  play: () => void;
  pause: () => void;
  resume: () => void;
  destroy: () => void;
  addListener: (
    event: "ready" | "playback_update",
    cb: (e: { data: { isPaused: boolean; isBuffering?: boolean } }) => void,
  ) => void;
};

type SpotifyIframeApi = {
  createController: (
    element: HTMLElement,
    options: { uri: string; width?: string | number; height?: string | number },
    callback: (controller: SpotifyEmbedController) => void,
  ) => void;
};

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: SpotifyIframeApi) => void;
  }
}

let apiPromise: Promise<SpotifyIframeApi> | null = null;

export function loadSpotifyEmbedApi() {
  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      window.onSpotifyIframeApiReady = resolve;
      const script = document.createElement("script");
      script.src = "https://open.spotify.com/embed/iframe-api/v1";
      script.async = true;
      document.body.appendChild(script);
    });
  }
  return apiPromise;
}

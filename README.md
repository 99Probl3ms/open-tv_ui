# Open TV UI

This repository contains a demo Angular client that recreates a sports streaming layout and a companion Node.js backend that serves a mock IPTV playlist and EPG feed.

## Prerequisites

- Node.js 18+
- npm 9+

## Getting started

Install dependencies for both the Angular client and the mock backend:

```bash
cd client
npm install
cd ../server
npm install
```

### Run the backend

```bash
cd server
npm start
```

The backend exposes:

- `GET /api/channels` – channel metadata consumed by the UI
- `GET /api/programs` – generated EPG schedule with timestamps near the current time
- `GET /playlist.m3u` – an IPTV playlist referencing the channels
- `GET /epg.xml` – XMLTV EPG generated from the schedule

### Run the Angular client

In a separate terminal:

```bash
cd client
npm start
```

By default the Angular dev server proxies `/api`, `/playlist.m3u`, and `/epg.xml` to the backend at `http://localhost:3000`.

If the backend is not running the client falls back to bundled sample data so the layout still renders, but live guide updates
require starting the Express server.

### Build for production

```bash
cd client
npm run build
```

The static assets are produced in `client/dist/client`.

## Project structure

- `client/` – Angular standalone application replicating the requested layout
- `server/` – Express backend exposing the playlist and EPG endpoints

## Testing

Angular unit tests can be executed with:

```bash
cd client
npm test
```

(ChromeHeadless is configured by default.)

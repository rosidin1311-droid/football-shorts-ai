# Football Shorts AI ⚽🤖

An enterprise-grade, full-stack, automated highlight clipping and vertical video generator. By pasting any soccer match widescreen YouTube URL, the application leverages **Gemini AI** to detect goals and critical skills, drafts a play-by-play commentary voiceover script, synchronizes **Whisper subtitles**, and provides a workspace to edit subtitles, pan-framing, and export 9:16 vertical video assets using **FFmpeg**.

---

## 🚀 Core Architectural Pipeline

1. **YouTube Stream Ingestion**: Downloads soccer broadcasts, resolves metadata, and captures high-resolution video streams.
2. **AI Highlight Detection (Gemini)**: Employs `gemini-3.5-flash` to parse visual cues, timestamps, category metrics (goal, save, skill, foul), and generate high-excitement play-by-play narrative descriptions.
3. **Timed Transcription Alignment (Whisper)**: Simulates the Whisper subtitle generator, creating precise word-by-word timestamp markers synchronized to the clip boundaries.
4. **9:16 Auto-Framing & Layout Engine**: Displays widescreen video files with interactive, adjustable crop overlays (`cropX`, zoom multipliers). Supports multiple templates:
   - *Classic Center Crop*: Full height vertical scale.
   - *Blurred Backdrop*: Scaled widescreen frame placed over a heavily blurred, widened copies.
   - *Split-Screen Satisfying*: Football clip vertically stacked on top of gaming/satisfying video feeds (extremely viral on TikTok/Shorts).
5. **Transcoding pipeline (FFmpeg)**: Compiles the final video layers, mixes background tracks, sets branded watermarks, overlays subtitles, and generates production-ready `.mp4` video files.

---

## 🛠️ Tech Stack & Key Files

### Frontend:
- **React 19** + **Vite 6** + **TypeScript**
- **Tailwind CSS v4** (Styled with a dark neon-sports custom slate)
- **Lucide Icons**

### Backend:
- **Node.js** + **Express** + **TypeScript (`tsx` runner)**
- **@google/genai SDK** (Server-side model querying)
- **esbuild** (Compiles the typescript server into a single production `.cjs` bundle)

### Key Files in Directory:
- `/server.ts` - Master Express entry point & REST APIs
- `/server/storage.ts` - High-speed JSON flat-file database
- `/server/queue.ts` - Asynchronous background worker queue
- `/server/youtube.ts` - Stream parser and analyzer
- `/server/highlight.ts` - Gemini AI model caller
- `/server/whisper.ts` - Subtitle alignment generator
- `/server/ffmpeg.ts` - FFmpeg video crop & audio mixer filter compiler

---

## ⚙️ Local Development Setup

### 1. Requirements
Ensure you have the following installed locally:
- **Node.js 18+**
- **FFmpeg** (Ensure `ffmpeg` is available on your shell path)

### 2. Environment Configuration
Create a `.env` file in the root directory (based on `.env.example`):
```env
# Google Gen AI Key (Optional - Fallbacks gracefully to local mock if empty)
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# Public App Url
APP_URL="http://localhost:3000"
```

### 3. Installation
Install all NPM packages:
```bash
npm install
```

### 4. Running Dev Server
Launch both Vite client and Express API routes on port 3000:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Compiling & Production Running
Build the production build assets and launch the esbuild-bundled server:
```bash
npm run build
npm start
```

---

## 🐳 Docker & Cloud Deployment

This repository is pre-configured and production-ready for deployment on **Railway**, **Render**, or standard **Docker** platforms.

### Building and Running Docker Image:
```bash
# Build the image
docker build -t football-shorts-ai .

# Run the container (bypassing host port 3000)
docker run -p 3000:3000 --env-file .env football-shorts-ai
```

---

## 📜 FFmpeg Command Reference (Transcoded by Backend)

For standard center-cropping, vertical overlays, and audio channel mixing, the backend compiles and executes this command pipeline:

```bash
ffmpeg -y -ss 45 -t 20 -i input_soccer_match.mp4 \
  -i music_phonk.mp3 \
  -filter_complex "[0:v]crop=607:1080:656:0,scale=1080:1920[v_scaled]; \
                   [v_scaled]drawtext=text='FOOTBALL SHORTS AI':x=(w-text_w)/2:y=120:fontsize=48:fontcolor=white:box=1:boxcolor=black@0.5[out_v]; \
                   [0:a]volume=1.0[a1];[1:a]volume=0.40[a2];[a1][a2]amix=inputs=2:duration=first[out_a]" \
  -map "[out_v]" -map "[out_a]" \
  -c:v libx264 -preset veryfast -crf 22 -c:a aac -b:a 192k output_short_9_16.mp4
```

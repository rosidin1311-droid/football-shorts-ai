import express, { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { Storage } from "./server/storage.js";
import { JobQueue } from "./server/queue.js";
import { YouTubeService } from "./server/youtube.js";
import { ShortJob } from "./src/types.js";

const __filenamePath = typeof import.meta?.url === "string" ? fileURLToPath(import.meta.url) : "";
const __dirnamePath = __filenamePath ? path.dirname(__filenamePath) : "";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Middleware for parsing JSON and form bodies
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // --- API Endpoints ---

  // Health check
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Get all shorts automation jobs
  app.get("/api/jobs", (req: Request, res: Response) => {
    try {
      const jobs = Storage.getJobs();
      res.json(jobs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get a specific job
  app.get("/api/jobs/:id", (req: Request, res: Response) => {
    try {
      const job = Storage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json(job);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create a new highlight detection job from a YouTube URL
  app.post("/api/jobs", async (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "YouTube URL is required" });
      }

      if (!YouTubeService.isValidUrl(url)) {
        return res.status(400).json({ error: "Invalid YouTube URL format. Must be youtube.com or youtu.be" });
      }

      const jobId = `job_${Date.now()}`;
      const newJob: ShortJob = {
        id: jobId,
        url,
        status: "queued",
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        clips: [],
        logs: [
          {
            timestamp: new Date().toLocaleTimeString(),
            level: "info",
            message: `Highlight detection request created for URL: ${url}`
          }
        ],
        subtitleStyle: "phonk-karaoke",
        layoutTemplate: "classic-crop",
        bgMusic: "phonk",
        musicVolume: 40,
        watermarkText: "FOOTBALL SHORTS AI"
      };

      Storage.saveJob(newJob);
      JobQueue.add({ jobId, type: "analyze" });

      res.status(201).json(newJob);
    } catch (err: any) {
      console.error("Error creating job:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Update render settings and trigger FFmpeg rendering for a clip
  app.post("/api/jobs/:id/render", (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { clipId, subtitleStyle, layoutTemplate, bgMusic, musicVolume, watermarkText } = req.body;

      const job = Storage.getJob(id);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Update workspace styling configurations
      job.selectedClipId = clipId || job.selectedClipId;
      if (subtitleStyle) job.subtitleStyle = subtitleStyle;
      if (layoutTemplate) job.layoutTemplate = layoutTemplate;
      if (bgMusic) job.bgMusic = bgMusic;
      if (musicVolume !== undefined) job.musicVolume = Number(musicVolume);
      if (watermarkText !== undefined) job.watermarkText = watermarkText;
      job.updatedAt = new Date().toISOString();

      Storage.saveJob(job);

      // Add to queue for background FFmpeg rendering
      JobQueue.add({
        jobId: id,
        type: "render",
        clipId: job.selectedClipId
      });

      // Fetch the updated job to send back
      const updatedJob = Storage.getJob(id);
      res.json(updatedJob);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Edit clip details surgically (e.g. adjust title, subtitles words, crop bounds)
  app.post("/api/jobs/:id/edit-clip", (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { clipId, title, commentary, cropX, cropScale, subtitles } = req.body;

      const job = Storage.getJob(id);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      const clipIndex = job.clips.findIndex(c => c.id === clipId);
      if (clipIndex === -1) {
        return res.status(404).json({ error: "Clip not found" });
      }

      const clip = job.clips[clipIndex];
      if (title !== undefined) clip.title = title;
      if (commentary !== undefined) clip.commentary = commentary;
      if (cropX !== undefined) clip.cropX = Number(cropX);
      if (cropScale !== undefined) clip.cropScale = Number(cropScale);
      if (subtitles !== undefined) clip.subtitles = subtitles;

      job.updatedAt = new Date().toISOString();
      Storage.saveJob(job);

      res.json(job);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete job
  app.delete("/api/jobs/:id", (req: Request, res: Response) => {
    try {
      Storage.deleteJob(req.params.id);
      res.json({ success: true, message: "Job deleted" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Clear all jobs
  app.post("/api/jobs/clear", (req: Request, res: Response) => {
    try {
      Storage.clearAllJobs();
      res.json({ success: true, message: "All jobs cleared" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  // --- Vite Dev Server & Static Asset Routing ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // Mount Vite middleware so dev client works flawlessly
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Listen on standard container port 3000
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Football Shorts AI running on http://localhost:${PORT}`);
    console.log(`[Server] Env: ${process.env.NODE_ENV || "development"}`);
  });
}

startServer().catch((err) => {
  console.error("Critical error starting server:", err);
});

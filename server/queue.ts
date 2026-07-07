import { ShortJob, LogMessage } from "../src/types.js";
import { Storage } from "./storage.js";
import { YouTubeService } from "./youtube.js";
import { HighlightService } from "./highlight.js";
import { WhisperService } from "./whisper.js";
import { FFmpegService } from "./ffmpeg.js";

interface QueueItem {
  jobId: string;
  type: "analyze" | "render";
  clipId?: string; // only for render
}

class JobQueueProcessor {
  private queue: QueueItem[] = [];
  private isProcessing = false;

  public add(item: QueueItem): void {
    console.log(`[JobQueue] Adding job to queue: ID=${item.jobId}, Type=${item.type}`);
    this.queue.push(item);
    this.processNext();
  }

  private async processNext(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const item = this.queue.shift()!;
    
    try {
      if (item.type === "analyze") {
        await this.processAnalysis(item.jobId);
      } else {
        await this.processRendering(item.jobId, item.clipId);
      }
    } catch (err: any) {
      console.error(`[JobQueue] Error processing job ${item.jobId}:`, err);
      const job = Storage.getJob(item.jobId);
      if (job) {
        job.status = "failed";
        job.error = err.message || "Unknown error";
        this.addLog(job, "error", `Job execution failed: ${job.error}`);
        Storage.saveJob(job);
      }
    } finally {
      this.isProcessing = false;
      this.processNext();
    }
  }

  private async processAnalysis(jobId: string): Promise<void> {
    const job = Storage.getJob(jobId);
    if (!job) return;

    // Phase 1: Downloading Simulator
    job.status = "downloading";
    job.progress = 10;
    this.addLog(job, "info", `Initializing workspace for YouTube source: ${job.url}`);
    this.addLog(job, "info", `Fetching video details and YouTube stream manifests...`);
    Storage.saveJob(job);
    await sleep(1500);

    const metadata = await YouTubeService.fetchMetadata(job.url);
    job.metadata = metadata;
    job.progress = 25;
    this.addLog(job, "success", `Successfully loaded metadata. Title: "${metadata.title}"`);
    this.addLog(job, "info", `Downloading high-definition H.264 video streams (Duration: ${metadata.duration}s)...`);
    Storage.saveJob(job);
    await sleep(2000);

    job.progress = 40;
    this.addLog(job, "success", `Video stream download completed. Temp file: /tmp/input_${metadata.id}.mp4`);
    
    // Phase 2: Highlight Detection (AI Analyzer)
    job.status = "analyzing";
    this.addLog(job, "info", `Starting AI Highlight Analyzer. Processing visual excitement cues and player tracking...`);
    Storage.saveJob(job);
    await sleep(1000);

    const clips = await HighlightService.detectHighlights(metadata);
    job.clips = clips;
    job.progress = 70;
    this.addLog(job, "success", `AI Highlight Analyzer completed. Detected ${clips.length} high-excitement football clips!`);
    Storage.saveJob(job);
    await sleep(1500);

    // Phase 3: Subtitling (Whisper Simulator)
    job.status = "subtitling";
    this.addLog(job, "info", `Starting Whisper translation engine. Creating synchronized subtitle words...`);
    Storage.saveJob(job);

    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      this.addLog(job, "info", `Transcribing speech and commentary for Clip #${i + 1}: "${clip.title}"...`);
      Storage.saveJob(job);
      await sleep(1000);

      const subtitles = await WhisperService.generateSubtitles(clip.commentary, clip.startTime, clip.endTime);
      clip.subtitles = subtitles;
      
      this.addLog(job, "success", `Generated ${subtitles.length} synchronized subtitle words for "${clip.title}".`);
      Storage.saveJob(job);
    }

    // Set first clip as default selected
    if (clips.length > 0) {
      job.selectedClipId = clips[0].id;
    }

    job.status = "completed";
    job.progress = 100;
    this.addLog(job, "success", `Job processing completed successfully. Shorts editor workspace is now ready!`);
    Storage.saveJob(job);
  }

  private async processRendering(jobId: string, clipId?: string): Promise<void> {
    const job = Storage.getJob(jobId);
    if (!job) return;

    const targetClipId = clipId || job.selectedClipId;
    if (!targetClipId) {
      throw new Error("No highlight clip selected for rendering");
    }

    const clip = job.clips.find(c => c.id === targetClipId);
    if (!clip) {
      throw new Error(`Clip ${targetClipId} not found in job`);
    }

    job.status = "rendering";
    job.progress = 0;
    job.selectedClipId = targetClipId;
    this.addLog(job, "info", `Launching FFmpeg Renderer for: "${clip.title}"`);
    this.addLog(job, "info", `Style: ${job.subtitleStyle}, Template: ${job.layoutTemplate}, Background Music: ${job.bgMusic}`);
    Storage.saveJob(job);
    await sleep(800);

    try {
      const renderedUrl = await FFmpegService.renderShort({
        videoTitle: clip.title,
        startTime: clip.startTime,
        endTime: clip.endTime,
        cropX: clip.cropX,
        cropScale: clip.cropScale,
        subtitleStyle: job.subtitleStyle,
        layoutTemplate: job.layoutTemplate,
        bgMusic: job.bgMusic,
        musicVolume: job.musicVolume,
        watermarkText: job.watermarkText,
        onProgress: (pct, logLine) => {
          job.progress = pct;
          const isError = logLine.toLowerCase().includes("error");
          this.addLog(job, isError ? "error" : "info", logLine);
          Storage.saveJob(job);
        }
      });

      job.status = "completed";
      job.progress = 100;
      job.renderedVideoUrl = renderedUrl;
      this.addLog(job, "success", `FFmpeg rendering finished! 9:16 vertical short is ready.`);
      Storage.saveJob(job);
    } catch (err: any) {
      job.status = "completed"; // revert back to completed so they can edit and retry
      this.addLog(job, "error", `FFmpeg rendering failed: ${err.message}`);
      Storage.saveJob(job);
      throw err;
    }
  }

  private addLog(job: ShortJob, level: LogMessage["level"], message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    job.logs.push({ timestamp, level, message });
    console.log(`[JobQueue ID=${job.id}] [${level.toUpperCase()}] ${message}`);
  }
}

export const JobQueue = new JobQueueProcessor();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

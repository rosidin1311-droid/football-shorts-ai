// Shared Type Definitions for Football Shorts AI

export type JobStatus =
  | "queued"
  | "downloading"
  | "analyzing"
  | "subtitling"
  | "rendering"
  | "completed"
  | "failed";

export interface LogMessage {
  timestamp: string;
  level: "info" | "warning" | "error" | "success";
  message: string;
}

export type SubtitleStyle = "phonk-karaoke" | "neon-pulse" | "classic-yellow" | "clean-minimal";

export type LayoutTemplate = "classic-crop" | "split-satisfying" | "blurred-background";

export type AudioTrack = "none" | "phonk" | "epic" | "edm" | "lofi";

export interface SubtitleWord {
  text: string;
  start: number; // in seconds
  end: number;   // in seconds
}

export interface HighlightClip {
  id: string;
  title: string;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  excitementScore: number; // 0-100
  category: "goal" | "skill" | "save" | "foul" | "reaction" | "other";
  commentary: string; // generated text commentary
  cropX: number; // 0 to 100 representing horizontal center point (%), defaults to 50
  cropScale: number; // multiplier, default 1.0
  subtitles: SubtitleWord[];
}

export interface VideoMetadata {
  id: string;
  url: string;
  title: string;
  author: string;
  duration: number; // in seconds
  thumbnail: string;
  views: string;
  publishedAt: string;
}

export interface ShortJob {
  id: string;
  url: string;
  status: JobStatus;
  progress: number; // 0-100
  createdAt: string;
  updatedAt: string;
  metadata?: VideoMetadata;
  clips: HighlightClip[];
  logs: LogMessage[];
  error?: string;
  
  // Custom Render Settings (edited by user)
  selectedClipId?: string;
  subtitleStyle: SubtitleStyle;
  layoutTemplate: LayoutTemplate;
  bgMusic: AudioTrack;
  musicVolume: number; // 0-100
  gameplayVideoUrl?: string; // for split satisfying layout
  watermarkText?: string;
  renderedVideoUrl?: string; // Path/URL to the rendered .mp4 file
}

export interface AppState {
  jobs: ShortJob[];
  currentJobId: string | null;
  loading: boolean;
}

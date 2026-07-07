import React, { useState, FormEvent } from "react";
import { ShortJob } from "../types.js";
import { Youtube, Search, CheckCircle2, AlertTriangle, Play, Flame, Loader2, Sparkles, Check } from "lucide-react";

interface DashboardProps {
  jobs: ShortJob[];
  onAddJob: (url: string) => void;
  onSelectJob: (id: string) => void;
  onDeleteJob: (id: string) => void;
  activeJobId: string | null;
}

const FOOTBALL_PRESETS = [
  {
    title: "Cristiano Ronaldo (CR7) - Header & Free Kick Show",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXc7",
    author: "MadridistaTV",
    duration: "8 mins",
    icon: "🐐"
  },
  {
    title: "Lionel Messi - Unbelievable Solo Dribbling Masterclass",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXc8",
    author: "BarcaFans Global",
    duration: "9 mins",
    icon: "👽"
  },
  {
    title: "UEFA Champions League: Real Madrid vs Bayern (Epic Drama)",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXc9",
    author: "UEFA",
    duration: "14 mins",
    icon: "🏆"
  },
  {
    title: "Neymar Jr - Joga Bonito: Rainbow Flicks & Humiliations",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXc0",
    author: "HeilsFootball",
    duration: "5 mins",
    icon: "🌈"
  }
];

export default function Dashboard({
  jobs,
  onAddJob,
  onSelectJob,
  onDeleteJob,
  activeJobId,
}: DashboardProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!url.trim()) {
      setError("Please paste a valid YouTube URL first");
      return;
    }

    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    if (!pattern.test(url)) {
      setError("Invalid format. URL must be a valid YouTube link.");
      return;
    }

    onAddJob(url.trim());
    setUrl("");
  };

  const handlePresetClick = (presetUrl: string) => {
    onAddJob(presetUrl);
  };

  return (
    <div className="space-y-8">
      
      {/* 1. Hero / Main Paste Box */}
      <div className="bg-gradient-to-br from-soccer-panel to-[#0f1522] border border-gray-800 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden glow-green">
        <div className="absolute top-0 right-0 w-96 h-96 bg-soccer-green/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-soccer-green/10 text-soccer-green text-[10px] font-extrabold uppercase tracking-widest rounded-full mb-4 border border-soccer-green/20 animate-pulse">
            <Sparkles size={11} />
            Auto Highlight Clipper
          </div>
          
          <h2 className="text-2xl md:text-4xl font-black font-display text-white tracking-tight leading-tight">
            Transform Match Broadcasts into <span className="text-soccer-green">Viral 9:16 Shorts</span> in One Click
          </h2>
          
          <p className="text-xs md:text-sm text-gray-400 mt-2.5 leading-relaxed">
            Our dual AI system uses Gemini to identify highlight goals and skills, drafts play-by-play TikTok commentary, synchronizes Whisper subtitles, and lets you crop 9:16 vertical frames surgically.
          </p>

          {/* Paste Input form */}
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row gap-3 relative z-10">
            <div className="flex-1 relative">
              <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste soccer match YouTube video link... (e.g. youtube.com/watch?v=...)"
                className="w-full bg-[#070b13] border border-gray-800 focus:border-soccer-green hover:border-gray-700 text-gray-200 pl-11 pr-4 py-3.5 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-soccer-green/30 transition shadow-inner"
              />
            </div>
            <button
              type="submit"
              className="py-3.5 px-6 bg-soccer-green hover:bg-emerald-400 active:scale-95 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shrink-0 shadow-[0_4px_12px_rgba(0,255,102,0.2)] cursor-pointer"
            >
              <Search size={14} />
              Analyze Match
            </button>
          </form>

          {error && <p className="text-xs text-red-400 mt-2 flex items-center gap-1">⚠️ {error}</p>}
        </div>
      </div>

      {/* 2. Quick Presets for Demo */}
      <div>
        <div className="flex items-center gap-2 mb-3.5">
          <Flame size={16} className="text-soccer-green" />
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest font-display">
            Quick Football Match Presets (No Search Required)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {FOOTBALL_PRESETS.map((preset, index) => (
            <button
              key={index}
              onClick={() => handlePresetClick(preset.url)}
              className="text-left bg-soccer-panel/40 border border-gray-800/80 hover:border-soccer-green/50 hover:bg-soccer-panel p-4 rounded-xl transition group relative overflow-hidden"
            >
              <div className="text-2xl mb-2">{preset.icon}</div>
              <h4 className="text-xs font-bold text-gray-200 line-clamp-1 group-hover:text-soccer-green transition">
                {preset.title}
              </h4>
              <div className="flex items-center justify-between mt-3 text-[10px] text-gray-500 font-mono">
                <span>{preset.author}</span>
                <span>{preset.duration}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Job queue dashboard list */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest font-display mb-4">
          Current Automation Jobs
        </h3>

        {jobs.length === 0 ? (
          <div className="bg-soccer-panel/20 border border-gray-850 rounded-xl p-10 text-center text-gray-500">
            No highlights created yet. Paste a YouTube URL or click a preset above to begin processing your first clip!
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const isActive = activeJobId === job.id;
              const isProcessing = ["queued", "downloading", "analyzing", "subtitling", "rendering"].includes(job.status);
              
              let statusText = "Processing Queue";
              let statusColor = "text-amber-400 bg-amber-950/40 border-amber-900";
              let iconElement = <Loader2 size={12} className="animate-spin text-amber-400" />;

              if (job.status === "completed") {
                statusText = "Completed";
                statusColor = "text-soccer-green bg-emerald-950/40 border-emerald-900";
                iconElement = <CheckCircle2 size={12} className="text-soccer-green" />;
              } else if (job.status === "failed") {
                statusText = "Failed";
                statusColor = "text-red-400 bg-red-950/40 border-red-900";
                iconElement = <AlertTriangle size={12} className="text-red-400" />;
              }

              return (
                <div
                  key={job.id}
                  className={`bg-soccer-panel border rounded-xl p-5 transition-all ${
                    isActive
                      ? "border-soccer-green ring-1 ring-soccer-green/10"
                      : "border-gray-850 hover:border-gray-800"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    
                    {/* Left: Metadata summary */}
                    <div className="flex gap-4 items-start">
                      {job.metadata?.thumbnail ? (
                        <img
                          src={job.metadata.thumbnail}
                          alt="Thumbnail"
                          className="w-24 h-14 rounded object-cover border border-gray-800 shrink-0 bg-gray-900"
                        />
                      ) : (
                        <div className="w-24 h-14 bg-gray-900 border border-gray-800 flex items-center justify-center rounded text-xs text-gray-500 shrink-0">
                          YT VIDEO
                        </div>
                      )}

                      <div>
                        <h4 className="text-xs font-bold text-gray-200 line-clamp-1 leading-normal">
                          {job.metadata?.title || job.url}
                        </h4>
                        <span className="text-[10px] text-gray-500 block font-mono mt-0.5">
                          ID: {job.id} • Added {new Date(job.createdAt).toLocaleDateString()}
                        </span>

                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${statusColor} font-semibold uppercase font-display`}>
                            {iconElement}
                            {statusText}
                          </span>

                          {job.clips.length > 0 && (
                            <span className="text-[10px] bg-blue-950/40 border border-blue-900 text-blue-400 px-2.5 py-0.5 rounded-full font-semibold">
                              {job.clips.length} AI CLIPS EXTRACTED
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions and progress stats */}
                    <div className="flex flex-col md:items-end gap-2 shrink-0 justify-center">
                      {isProcessing ? (
                        <div className="w-48">
                          <div className="flex justify-between text-[10px] text-gray-400 font-mono mb-1">
                            <span>{job.status.toUpperCase()}</span>
                            <span>{job.progress}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-soccer-green rounded-full transition-all duration-300"
                              style={{ width: `${job.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          {job.clips.length > 0 && (
                            <button
                              onClick={() => onSelectJob(job.id)}
                              className="px-4 py-2 bg-soccer-green text-black hover:bg-emerald-400 font-extrabold text-xs uppercase tracking-wider rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <Play size={11} fill="currentColor" />
                              Open Editor
                            </button>
                          )}
                          <button
                            onClick={() => onDeleteJob(job.id)}
                            className="px-3 py-2 bg-gray-900 hover:bg-red-950 text-gray-400 hover:text-red-400 border border-gray-800/60 hover:border-red-900 rounded-lg text-xs transition cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

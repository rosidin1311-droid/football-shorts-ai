import { useState, useEffect } from "react";
import { ShortJob, HighlightClip, SubtitleStyle, LayoutTemplate, AudioTrack, SubtitleWord } from "../types.js";
import { Edit3, Check, Play, Music, Settings, Crop, Sparkles, Sliders, Type, HelpCircle } from "lucide-react";

interface ShortsEditorProps {
  job: ShortJob;
  onUpdateJobSettings: (settings: Partial<ShortJob>) => void;
  onUpdateClip: (clipId: string, updatedFields: Partial<HighlightClip>) => void;
  onTriggerRender: (clipId: string) => void;
}

export default function ShortsEditor({
  job,
  onUpdateJobSettings,
  onUpdateClip,
  onTriggerRender,
}: ShortsEditorProps) {
  const [selectedClipId, setSelectedClipId] = useState<string>("");
  const [isEditingWordIndex, setIsEditingWordIndex] = useState<number | null>(null);
  const [editingWordText, setEditingWordText] = useState("");

  useEffect(() => {
    if (job.clips.length > 0) {
      if (job.selectedClipId && job.clips.some(c => c.id === job.selectedClipId)) {
        setSelectedClipId(job.selectedClipId);
      } else {
        setSelectedClipId(job.clips[0].id);
      }
    }
  }, [job]);

  const activeClip = job.clips.find((c) => c.id === selectedClipId) || job.clips[0];

  if (!activeClip) {
    return (
      <div className="bg-soccer-panel border border-gray-800 rounded-xl p-8 text-center text-gray-400">
        No highlight clips available. Run an AI YouTube analysis first.
      </div>
    );
  }

  const handleClipChange = (id: string) => {
    setSelectedClipId(id);
    onUpdateJobSettings({ selectedClipId: id });
  };

  const handleSubtitleWordEdit = (wordIndex: number, text: string) => {
    const updatedSubtitles = [...activeClip.subtitles];
    updatedSubtitles[wordIndex] = {
      ...updatedSubtitles[wordIndex],
      text
    };
    onUpdateClip(activeClip.id, { subtitles: updatedSubtitles });
    setIsEditingWordIndex(null);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      
      {/* LEFT PORTION: 8 Columns - Configurations and settings */}
      <div className="xl:col-span-7 flex flex-col gap-6">
        
        {/* Clip selector */}
        <div className="bg-soccer-panel border border-gray-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-400 uppercase font-display tracking-wider mb-3 flex items-center gap-1.5">
            <Sparkles size={14} className="text-soccer-green" />
            Detected AI Highlight Moments
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {job.clips.map((clip) => {
              const isSelected = clip.id === selectedClipId;
              let categoryEmoji = "⚽";
              if (clip.category === "save") categoryEmoji = "🧤";
              if (clip.category === "skill") categoryEmoji = "🕺";
              if (clip.category === "reaction") categoryEmoji = "🟥";

              return (
                <button
                  key={clip.id}
                  onClick={() => handleClipChange(clip.id)}
                  className={`text-left p-3.5 rounded-xl border transition-all relative ${
                    isSelected
                      ? "border-soccer-green bg-soccer-green/5 ring-1 ring-soccer-green/30"
                      : "border-gray-800 hover:border-gray-700 bg-black/30"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-semibold text-gray-200 line-clamp-1">
                      {clip.title}
                    </span>
                    <span className="text-xs bg-gray-900 border border-gray-800 px-1.5 py-0.5 rounded">
                      {categoryEmoji}
                    </span>
                  </div>

                  <div className="flex justify-between items-center mt-2.5 text-[10px] text-gray-400 font-mono">
                    <span>
                      {Math.floor(clip.startTime / 60)}:{(clip.startTime % 60).toString().padStart(2, "0")} - {Math.floor(clip.endTime / 60)}:{(clip.endTime % 60).toString().padStart(2, "0")}
                    </span>
                    <span className="text-soccer-green font-bold">
                      🔥 {clip.excitementScore}% excitement
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Framing & Crop layout configuration */}
        <div className="bg-soccer-panel border border-gray-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-400 uppercase font-display tracking-wider mb-4 flex items-center gap-1.5">
            <Crop size={14} className="text-blue-400" />
            Vertical Auto-Framing Controls
          </h3>

          <div className="space-y-5">
            {/* Slider: Crop X focal point */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-300 font-medium flex items-center gap-1">
                  Horizontal Focal Center (cropX)
                  <HelpCircle size={11} className="text-gray-500" title="Shift the vertical viewport left or right to track the ball." />
                </span>
                <span className="text-soccer-green font-mono">{activeClip.cropX}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                value={activeClip.cropX}
                onChange={(e) => onUpdateClip(activeClip.id, { cropX: Number(e.target.value) })}
                className="w-full accent-soccer-green h-1.5 bg-gray-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-gray-500 font-mono mt-1">
                <span>Left Wing (10%)</span>
                <span>Center Pitch (50%)</span>
                <span>Right Wing (90%)</span>
              </div>
            </div>

            {/* Slider: Crop scale zoom factor */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-300 font-medium">Camera Tracking Zoom Depth</span>
                <span className="text-soccer-green font-mono">{activeClip.cropScale.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="1.5"
                step="0.05"
                value={activeClip.cropScale}
                onChange={(e) => onUpdateClip(activeClip.id, { cropScale: Number(e.target.value) })}
                className="w-full accent-soccer-green h-1.5 bg-gray-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-gray-500 font-mono mt-1">
                <span>1.0x (Full Height)</span>
                <span>1.25x (Cinematic Framing)</span>
                <span>1.5x (Ultra Close-up)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Surgical Word-by-Word Subtitle Editor */}
        <div className="bg-soccer-panel border border-gray-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-400 uppercase font-display tracking-wider mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Type size={14} className="text-amber-400" />
              Surgical Subtitle Word Timeline
            </span>
            <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-900 px-1.5 py-0.5 rounded font-mono">
              {activeClip.subtitles.length} WORDS ACTIVE
            </span>
          </h3>

          <p className="text-[11px] text-gray-400 mb-4 leading-relaxed">
            Whisper AI matched the verbal cues below. Click any word to edit its text spelling for high impact overlay corrections.
          </p>

          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-3 bg-black/40 border border-gray-950 rounded-lg">
            {activeClip.subtitles.map((word, index) => {
              const isEditing = isEditingWordIndex === index;

              return (
                <div
                  key={index}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition text-xs ${
                    isEditing
                      ? "border-soccer-green bg-soccer-green/10"
                      : "border-gray-800 bg-gray-900 hover:border-gray-700"
                  }`}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={editingWordText}
                        onChange={(e) => setEditingWordText(e.target.value)}
                        className="bg-black text-white text-xs px-1 py-0.5 rounded w-16 border border-soccer-green focus:outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSubtitleWordEdit(index, editingWordText);
                        }}
                      />
                      <button
                        onClick={() => handleSubtitleWordEdit(index, editingWordText)}
                        className="p-1 bg-soccer-green text-black rounded hover:bg-emerald-400"
                      >
                        <Check size={10} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setIsEditingWordIndex(index);
                          setEditingWordText(word.text);
                        }}
                        className="hover:text-soccer-green font-medium"
                        title="Click to edit"
                      >
                        {word.text}
                      </button>
                      <span className="text-[9px] text-gray-500 font-mono">
                        {word.start.toFixed(1)}s
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* RIGHT PORTION: 5 Columns - Rendering and Styles customizer */}
      <div className="xl:col-span-5 flex flex-col gap-6">
        
        {/* Theme Settings & Presets */}
        <div className="bg-soccer-panel border border-gray-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-400 uppercase font-display tracking-wider mb-4 flex items-center gap-1.5">
            <Sliders size={14} className="text-purple-400" />
            Viral Style Presets
          </h3>

          <div className="space-y-4">
            
            {/* Template options */}
            <div>
              <label className="text-xs text-gray-400 block mb-1.5 font-medium">Layout Template</label>
              <select
                value={job.layoutTemplate}
                onChange={(e) => onUpdateJobSettings({ layoutTemplate: e.target.value as LayoutTemplate })}
                className="w-full bg-[#0b0f19] border border-gray-800 text-gray-200 text-xs rounded-lg p-2.5 focus:border-soccer-green focus:outline-none"
              >
                <option value="classic-crop">Classic Center Crop (9:16 Full Screen)</option>
                <option value="blurred-background">Blurred Backdrop (Original 16:9 atop Blur)</option>
                <option value="split-satisfying">Split Screen (Football top / Satisfying Gameplay bottom)</option>
              </select>
            </div>

            {/* Subtitle Styles options */}
            <div>
              <label className="text-xs text-gray-400 block mb-1.5 font-medium">Subtitle Typography Style</label>
              <select
                value={job.subtitleStyle}
                onChange={(e) => onUpdateJobSettings({ subtitleStyle: e.target.value as SubtitleStyle })}
                className="w-full bg-[#0b0f19] border border-gray-800 text-gray-200 text-xs rounded-lg p-2.5 focus:border-soccer-green focus:outline-none"
              >
                <option value="phonk-karaoke">💥 Phonk Karaoke (TikTok Bold Angle)</option>
                <option value="neon-pulse">🟢 Neon Glow Pulse (Impact Green)</option>
                <option value="classic-yellow">🟡 Classic Yellow (Impact Black Borders)</option>
                <option value="clean-minimal">⚪ Minimalist (Centered Dark Box)</option>
              </select>
            </div>

            {/* Watermark text */}
            <div>
              <label className="text-xs text-gray-400 block mb-1.5 font-medium">Branded Watermark Overlay</label>
              <input
                type="text"
                value={job.watermarkText || ""}
                onChange={(e) => onUpdateJobSettings({ watermarkText: e.target.value })}
                placeholder="e.g. FOOTBALL SHORTS AI"
                className="w-full bg-[#0b0f19] border border-gray-800 text-gray-200 text-xs rounded-lg p-2.5 focus:border-soccer-green focus:outline-none"
              />
            </div>

            {/* Background Music overlay */}
            <div>
              <label className="text-xs text-gray-400 block mb-1.5 font-medium flex items-center justify-between">
                <span>Viral Phonk Background Audio</span>
                <span className="flex items-center gap-1 font-mono text-[10px] text-soccer-green">
                  <Music size={10} />
                  Amix mixed
                </span>
              </label>
              <select
                value={job.bgMusic}
                onChange={(e) => onUpdateJobSettings({ bgMusic: e.target.value as AudioTrack })}
                className="w-full bg-[#0b0f19] border border-gray-800 text-gray-200 text-xs rounded-lg p-2.5 focus:border-soccer-green focus:outline-none mb-2"
              >
                <option value="phonk font-bold">⚽ Brazil Phonk (Drift Phonk) - Viral TikTok</option>
                <option value="epic">🎻 Epic Orchestral (Gladiator Style)</option>
                <option value="edm">🎧 High Energy EDM (Trap Beats)</option>
                <option value="lofi">☕ Chill Football Lofi</option>
                <option value="none">❌ Original Broadcast Audio Only</option>
              </select>

              {job.bgMusic !== "none" && (
                <div className="mt-2.5">
                  <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                    <span>Soundtrack Volume Level</span>
                    <span>{job.musicVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={job.musicVolume}
                    onChange={(e) => onUpdateJobSettings({ musicVolume: Number(e.target.value) })}
                    className="w-full accent-soccer-green h-1.5 bg-gray-800 rounded-lg cursor-pointer"
                  />
                </div>
              )}
            </div>

          </div>
        </div>

        {/* FFmpeg rendering actions card */}
        <div className="bg-soccer-panel border border-gray-800 rounded-xl p-5 shadow-sm text-center">
          <h3 className="text-sm font-bold text-gray-200 font-display tracking-wider mb-1.5">
            READY TO EXPORT?
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            FFmpeg will crop the video, synchronize the subtitle markers, mix background music and compile your 1080x1920 MP4 short.
          </p>

          {job.status === "rendering" ? (
            <div className="space-y-3 p-3 bg-black/40 rounded-xl border border-gray-800">
              <div className="flex justify-between text-xs text-gray-300 font-mono">
                <span>FFmpeg Render Pipeline...</span>
                <span className="text-soccer-green animate-pulse">{job.progress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-soccer-green transition-all duration-300"
                  style={{ width: `${job.progress}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-gray-500 block font-mono">Do not close window // transcoding in progress</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <button
                onClick={() => onTriggerRender(activeClip.id)}
                className="w-full py-3.5 bg-soccer-green hover:bg-emerald-400 active:scale-95 transition text-black font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(0,255,102,0.3)] cursor-pointer"
              >
                <Play size={16} fill="currentColor" />
                COMPILE VERTICAL SHORT
              </button>
              
              {job.renderedVideoUrl && (
                <a
                  href={job.renderedVideoUrl}
                  target="_blank"
                  referrerPolicy="no-referrer"
                  className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs rounded-lg transition inline-flex items-center justify-center gap-1"
                >
                  📥 DOWNLOAD COMPLETED SHORT
                </a>
              )}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

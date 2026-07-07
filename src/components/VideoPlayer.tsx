import { useState, useRef, useEffect } from "react";
import { HighlightClip, LayoutTemplate, SubtitleStyle } from "../types.js";
import { Play, Pause, Volume2, Maximize2, RefreshCw, Layers, ShieldCheck } from "lucide-react";

interface VideoPlayerProps {
  clip: HighlightClip;
  layoutTemplate: LayoutTemplate;
  subtitleStyle: SubtitleStyle;
  watermarkText?: string;
}

export default function VideoPlayer({
  clip,
  layoutTemplate,
  subtitleStyle,
  watermarkText,
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeWord, setActiveWord] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState("https://assets.mixkit.co/videos/preview/mixkit-soccer-ball-passing-between-players-on-pitch-41133-large.mp4");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Synchronize clip video URL when clip changes (simulate specific clip offsets)
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
      setCurrentTime(0);
      videoRef.current.currentTime = 0;
    }
    
    // Choose dynamic stock football clips depending on category/name to make it stunningly realistic
    const category = clip.category;
    if (category === "goal") {
      setVideoUrl("https://assets.mixkit.co/videos/preview/mixkit-soccer-player-kicking-the-ball-into-the-goal-41136-large.mp4");
    } else if (category === "save") {
      setVideoUrl("https://assets.mixkit.co/videos/preview/mixkit-goalkeeper-catching-the-ball-on-soccer-field-41137-large.mp4");
    } else if (category === "skill") {
      setVideoUrl("https://assets.mixkit.co/videos/preview/mixkit-football-player-practicing-juggling-with-a-ball-41135-large.mp4");
    } else {
      setVideoUrl("https://assets.mixkit.co/videos/preview/mixkit-soccer-ball-passing-between-players-on-pitch-41133-large.mp4");
    }
  }, [clip]);

  // Track playback time and manage word-level subtitle synchronization
  const updatePlaybackTime = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);

      // Subtitles synchronization: find the word matching the current time
      const words = clip.subtitles;
      if (words && words.length > 0) {
        // Find if we are currently in a word
        const matched = words.find(w => time >= w.start && time <= w.end);
        if (matched) {
          setActiveWord(matched.text);
        } else {
          // If no word, look for nearest past word (or clear)
          setActiveWord("");
        }
      } else {
        setActiveWord("");
      }
    }
    
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updatePlaybackTime);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updatePlaybackTime);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, clip]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(err => console.log("Video playback interrupted", err));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const restartVideo = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
      videoRef.current.play().catch(err => console.log(err));
      setIsPlaying(true);
    }
  };

  // Convert seconds to readable layout (00:00)
  const formatTime = (timeInSecs: number) => {
    const mins = Math.floor(timeInSecs / 60);
    const secs = Math.floor(timeInSecs % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const totalDuration = videoRef.current?.duration || (clip.endTime - clip.startTime) || 15;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      
      {/* 1. Left panel: Widescreen original video with crop overlay */}
      <div className="flex-1 bg-[#101524] rounded-xl border border-gray-800 p-5 shadow-lg flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5 uppercase font-display tracking-wider">
              <Layers size={14} className="text-blue-400" />
              Source widescreen (16:9)
            </span>
            <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-900/50 px-2 py-0.5 rounded font-mono">
              Focal Tracking: X = {clip.cropX}%
            </span>
          </div>

          {/* Video Container with absolute positioning for crop box */}
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black border border-gray-900">
            <video
              ref={videoRef}
              src={videoUrl}
              loop
              muted
              playsInline
              className="w-full h-full object-cover opacity-80"
              onClick={togglePlay}
            />

            {/* Vertical 9:16 Crop Overlay bounding box */}
            <div
              className="absolute top-0 bottom-0 border-2 border-soccer-green bg-soccer-green/5 pointer-events-none transition-all duration-300 glow-green"
              style={{
                width: `${(9 / 16) * 100 * (1 / clip.cropScale)}%`,
                left: `calc(${clip.cropX}% - ${(9 / 16) * 100 * (1 / clip.cropScale) / 2}%)`,
              }}
            >
              {/* Corner Reticles */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-soccer-green"></div>
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-soccer-green"></div>
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-soccer-green"></div>
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-soccer-green"></div>
              
              {/* Overlay HUD */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-0.5 rounded text-[8px] font-mono text-soccer-green font-bold">
                FFMPEG CROP AREA
              </div>
            </div>
          </div>
        </div>

        {/* Playback HUD controls */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-2.5 bg-gray-800 hover:bg-gray-700 active:scale-95 transition text-white rounded-lg"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button
              onClick={restartVideo}
              className="p-2.5 bg-gray-800 hover:bg-gray-700 active:scale-95 transition text-white rounded-lg"
              title="Restart"
            >
              <RefreshCw size={16} />
            </button>
            <div className="text-xs font-mono text-gray-400">
              {formatTime(currentTime)} / {formatTime(totalDuration)}
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono">
            <Volume2 size={14} />
            <span>MUTED PREVIEW</span>
          </div>
        </div>
      </div>

      {/* 2. Right panel: Vertical phone mockup showing rendered result */}
      <div className="w-full lg:w-[320px] shrink-0 flex flex-col items-center">
        <div className="relative w-[300px] h-[580px] bg-black rounded-[40px] border-[10px] border-gray-800 p-2 shadow-2xl flex flex-col justify-between overflow-hidden">
          
          {/* Top Notch/Speaker area */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-30 flex items-center justify-center gap-1">
            <div className="w-12 h-1 bg-gray-800 rounded"></div>
            <div className="w-2.5 h-2.5 bg-gray-900 rounded-full border border-gray-800"></div>
          </div>

          {/* Actual Phone Video Frame */}
          <div className="relative w-full h-full rounded-[30px] overflow-hidden bg-black flex flex-col justify-end">
            
            {/* Cropped Video Background representation */}
            <div className="absolute inset-0 w-full h-full bg-[#151c2d] flex items-center justify-center overflow-hidden">
              
              {layoutTemplate === "classic-crop" && (
                <div className="relative w-full h-full">
                  <video
                    src={videoUrl}
                    className="absolute w-[177%] h-full max-w-none object-cover transition-all"
                    style={{
                      left: `calc(50% - ${clip.cropX}% * 1.77)`, // Dynamic horizontal slide matching cropX!
                      transform: `scale(${clip.cropScale})`,
                    }}
                    ref={(el) => {
                      if (el && videoRef.current) {
                        el.currentTime = currentTime;
                        if (isPlaying) {
                          el.play().catch(() => {});
                        } else {
                          el.pause();
                        }
                      }
                    }}
                    muted
                    loop
                    playsInline
                  />
                </div>
              )}

              {layoutTemplate === "blurred-background" && (
                <div className="relative w-full h-full flex flex-col justify-center">
                  {/* Blurred BG */}
                  <video
                    src={videoUrl}
                    className="absolute inset-0 w-full h-full object-cover blur-xl opacity-60 scale-125"
                    ref={(el) => {
                      if (el && videoRef.current) {
                        el.currentTime = currentTime;
                      }
                    }}
                    muted
                    loop
                  />
                  {/* Styled crop on top */}
                  <div className="relative w-full aspect-video z-10 border-y border-white/10 shadow-lg overflow-hidden">
                    <video
                      src={videoUrl}
                      className="absolute w-[177%] h-full max-w-none object-cover"
                      style={{
                        left: `calc(50% - ${clip.cropX}% * 1.77)`,
                        transform: `scale(${clip.cropScale})`,
                      }}
                      ref={(el) => {
                        if (el && videoRef.current) {
                          el.currentTime = currentTime;
                          if (isPlaying) el.play().catch(() => {});
                          else el.pause();
                        }
                      }}
                      muted
                      loop
                    />
                  </div>
                </div>
              )}

              {layoutTemplate === "split-satisfying" && (
                <div className="relative w-full h-full flex flex-col">
                  {/* Top: Football video */}
                  <div className="relative w-full h-[50%] overflow-hidden border-b-2 border-soccer-green">
                    <video
                      src={videoUrl}
                      className="absolute w-[177%] h-full max-w-none object-cover"
                      style={{
                        left: `calc(50% - ${clip.cropX}% * 1.77)`,
                        transform: `scale(${clip.cropScale})`,
                      }}
                      ref={(el) => {
                        if (el && videoRef.current) {
                          el.currentTime = currentTime;
                          if (isPlaying) el.play().catch(() => {});
                          else el.pause();
                        }
                      }}
                      muted
                      loop
                    />
                  </div>
                  {/* Bottom: Subway Surfers or similar gameplay */}
                  <div className="relative w-full h-[50%] bg-[#0f1422] flex items-center justify-center overflow-hidden">
                    <video
                      src="https://assets.mixkit.co/videos/preview/mixkit-top-view-of-cars-on-a-road-42352-large.mp4"
                      className="w-full h-full object-cover opacity-85"
                      autoPlay
                      muted
                      loop
                    />
                    <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[8px] text-gray-300 font-mono">
                      SATISFYING OVERLAY
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Subtitles Overlay Layer */}
            <div className="absolute inset-x-0 bottom-40 top-10 flex items-center justify-center pointer-events-none z-20 px-4 text-center">
              {activeWord && (
                <div className={`transition-all duration-75 scale-110`}>
                  {subtitleStyle === "phonk-karaoke" && (
                    <span className="subtitle-phonk-karaoke inline-block">{activeWord}</span>
                  )}
                  {subtitleStyle === "neon-pulse" && (
                    <span className="subtitle-neon-pulse inline-block">{activeWord}</span>
                  )}
                  {subtitleStyle === "classic-yellow" && (
                    <span className="subtitle-classic-yellow inline-block">{activeWord}</span>
                  )}
                  {subtitleStyle === "clean-minimal" && (
                    <span className="subtitle-clean-minimal inline-block">{activeWord}</span>
                  )}
                </div>
              )}
            </div>

            {/* Watermark overlay */}
            {watermarkText && (
              <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm border border-white/10 px-3 py-1 rounded-full text-[9px] font-bold text-white tracking-widest uppercase z-20">
                {watermarkText}
              </div>
            )}

            {/* Mobile HUD overlay panels (like TikTok) */}
            <div className="absolute right-3 bottom-24 flex flex-col gap-4 items-center z-20">
              <div className="w-10 h-10 rounded-full border-2 border-soccer-green bg-[#111] overflow-hidden flex items-center justify-center shadow-lg">
                <span className="text-[10px] font-bold text-soccer-green">FS</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white text-xs">
                  ⚽
                </div>
                <span className="text-[8px] font-mono text-gray-300 mt-1">Goal</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white text-xs">
                  🔥
                </div>
                <span className="text-[8px] font-mono text-gray-300 mt-1">{clip.excitementScore}%</span>
              </div>
            </div>

            {/* Bottom Shorts details description */}
            <div className="absolute bottom-5 left-4 right-14 z-20 text-left">
              <div className="text-xs font-bold text-white mb-1 flex items-center gap-1">
                @football_shorts_ai
                <ShieldCheck size={12} className="text-blue-400" />
              </div>
              <div className="text-[11px] text-gray-200 line-clamp-2 leading-relaxed">
                {clip.title} - {clip.category.toUpperCase()} moment! ⚽🔥 #soccer #football #shorts
              </div>
            </div>

            {/* Bottom Progress Bar */}
            <div className="absolute bottom-0 inset-x-0 h-1 bg-gray-800 z-20">
              <div
                className="h-full bg-soccer-green shadow-[0_0_8px_#00ff66]"
                style={{
                  width: `${(currentTime / totalDuration) * 100}%`,
                }}
              ></div>
            </div>

          </div>
        </div>
        <span className="text-xs text-gray-500 font-mono mt-3">9:16 VERTICAL WORKSPACE PREVIEW</span>
      </div>

    </div>
  );
}

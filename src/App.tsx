import { useState, useEffect } from "react";
import { ShortJob, HighlightClip, LogMessage } from "./types.js";
import Dashboard from "./components/Dashboard.js";
import VideoPlayer from "./components/VideoPlayer.js";
import ShortsEditor from "./components/ShortsEditor.js";
import Terminal from "./components/Terminal.js";
import { Sparkles, Trophy, Video, RefreshCw, LayoutGrid, Github } from "lucide-react";

export default function App() {
  const [jobs, setJobs] = useState<ShortJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch all jobs from the Express backend
  const fetchJobs = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/jobs");
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (err) {
      console.error("Error fetching jobs from server:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Long-poll active jobs to render logs, progress, and status changes in real-time
  useEffect(() => {
    const hasActiveJob = jobs.some(j => 
      ["queued", "downloading", "analyzing", "subtitling", "rendering"].includes(j.status)
    );

    if (hasActiveJob) {
      const timer = setInterval(() => {
        fetchJobs(true);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [jobs]);

  // Create a new job from a YouTube URL
  const handleAddJob = async (url: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      if (res.ok) {
        const newJob = await res.json();
        setJobs(prev => [newJob, ...prev]);
        setSelectedJobId(newJob.id); // auto-open workspace
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.error || "Failed to create job"}`);
      }
    } catch (err) {
      console.error("Network error adding job:", err);
    } finally {
      setLoading(false);
    }
  };

  // Update render and theme settings
  const handleUpdateJobSettings = async (settings: Partial<ShortJob>) => {
    if (!selectedJobId) return;
    
    // Optimistic state update
    setJobs(prev => prev.map(job => {
      if (job.id === selectedJobId) {
        return { ...job, ...settings };
      }
      return job;
    }));

    // In a real database we can sync this or we sync when triggering compile. 
    // We will save to backend locally on the fly
    try {
      const job = jobs.find(j => j.id === selectedJobId);
      if (!job) return;

      await fetch(`/api/jobs/${selectedJobId}/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clipId: settings.selectedClipId || job.selectedClipId,
          subtitleStyle: settings.subtitleStyle || job.subtitleStyle,
          layoutTemplate: settings.layoutTemplate || job.layoutTemplate,
          bgMusic: settings.bgMusic || job.bgMusic,
          musicVolume: settings.musicVolume !== undefined ? settings.musicVolume : job.musicVolume,
          watermarkText: settings.watermarkText !== undefined ? settings.watermarkText : job.watermarkText,
        })
      });
    } catch (err) {
      console.error("Failed to sync layout options with server:", err);
    }
  };

  // Surgically update a specific clip's parameters (crop focal center, titles, edited subtitle spelling)
  const handleUpdateClip = async (clipId: string, updatedFields: Partial<HighlightClip>) => {
    if (!selectedJobId) return;

    // Optimistically update frontend UI
    setJobs(prev => prev.map(job => {
      if (job.id === selectedJobId) {
        const updatedClips = job.clips.map(clip => {
          if (clip.id === clipId) {
            return { ...clip, ...updatedFields };
          }
          return clip;
        });
        return { ...job, clips: updatedClips };
      }
      return job;
    }));

    try {
      await fetch(`/api/jobs/${selectedJobId}/edit-clip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clipId,
          ...updatedFields
        })
      });
    } catch (err) {
      console.error("Failed to sync edited clip metadata with server:", err);
    }
  };

  // Delete an existing job
  const handleDeleteJob = async (id: string) => {
    if (selectedJobId === id) setSelectedJobId(null);
    setJobs(prev => prev.filter(j => j.id !== id));

    try {
      await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Error deleting job on server:", err);
    }
  };

  // Clear logs helper
  const handleClearLogs = async () => {
    if (!selectedJobId) return;
    setJobs(prev => prev.map(job => {
      if (job.id === selectedJobId) {
        return { ...job, logs: [] };
      }
      return job;
    }));
  };

  // Trigger rendering action
  const handleTriggerRender = async (clipId: string) => {
    if (!selectedJobId) return;
    const job = jobs.find(j => j.id === selectedJobId);
    if (!job) return;

    try {
      const res = await fetch(`/api/jobs/${selectedJobId}/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clipId,
          subtitleStyle: job.subtitleStyle,
          layoutTemplate: job.layoutTemplate,
          bgMusic: job.bgMusic,
          musicVolume: job.musicVolume,
          watermarkText: job.watermarkText,
        })
      });
      if (res.ok) {
        const updatedJob = await res.json();
        setJobs(prev => prev.map(j => j.id === selectedJobId ? updatedJob : j));
      }
    } catch (err) {
      console.error("Failed to start short compile sequence:", err);
    }
  };

  const selectedJob = jobs.find((j) => j.id === selectedJobId);
  const activeClip = selectedJob?.clips.find(c => c.id === (selectedJob.selectedClipId || (selectedJob.clips[0]?.id)));

  return (
    <div className="min-h-screen bg-soccer-dark text-gray-100 flex flex-col justify-between selection:bg-soccer-green/20">
      
      {/* BRANDING HEADER NAVIGATION */}
      <header className="bg-soccer-panel/80 backdrop-blur-md border-b border-gray-850 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-soccer-green text-black p-2.5 rounded-xl shadow-[0_0_12px_rgba(0,255,102,0.4)]">
              <Trophy size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight font-display text-white uppercase flex items-center gap-1.5 leading-none">
                Football Shorts AI
              </h1>
              <span className="text-[10px] font-bold text-gray-500 font-mono tracking-widest uppercase">
                Dual AI Video Transcoder
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => fetchJobs()}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
              title="Refresh queue"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
            <a
              href="https://github.com"
              target="_blank"
              referrerPolicy="no-referrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-900 border border-gray-850 text-xs font-semibold text-gray-300 rounded-lg hover:text-white transition"
            >
              <Github size={13} />
              GitHub Repo
            </a>
          </div>
        </div>
      </header>

      {/* CORE WORKSPACE PANEL */}
      <main className="max-w-7xl mx-auto w-full px-6 py-8 flex-1 flex flex-col gap-8">
        
        {selectedJobId && selectedJob ? (
          /* WORKSPACE VIEW */
          <div className="space-y-8 animate-fade-in">
            {/* Nav row */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedJobId(null)}
                  className="px-4 py-2 bg-gray-900 border border-gray-850 hover:border-gray-700 text-gray-300 text-xs font-bold rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <LayoutGrid size={13} />
                  Dashboard Queue
                </button>
                <div className="hidden md:block w-[1px] h-5 bg-gray-800"></div>
                <div className="text-xs text-gray-400 max-w-sm line-clamp-1">
                  Active Workspace: <strong className="text-gray-200">{selectedJob.metadata?.title || selectedJob.url}</strong>
                </div>
              </div>

              {selectedJob.status !== "completed" && (
                <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-semibold uppercase bg-amber-950/20 border border-amber-900/40 px-3 py-1 rounded-full">
                  <RefreshCw size={11} className="animate-spin" />
                  Processing Source: {selectedJob.progress}% Completed
                </span>
              )}
            </div>

            {selectedJob.clips.length === 0 ? (
              <div className="bg-soccer-panel border border-gray-800 rounded-xl p-12 text-center max-w-xl mx-auto space-y-4">
                <div className="inline-flex p-4 bg-soccer-green/10 text-soccer-green rounded-full animate-bounce">
                  <Video size={32} />
                </div>
                <h3 className="text-lg font-bold">Extracting Highlight Reels</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  We are fetching match metadata, evaluating action intensity via Gemini, and compiling the timeline indexes. Check the real-time terminal below for active build status.
                </p>
                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-soccer-green rounded-full animate-pulse" style={{ width: `${selectedJob.progress}%` }}></div>
                </div>
              </div>
            ) : (
              <>
                {/* Visual crop preview element */}
                {activeClip && (
                  <VideoPlayer
                    clip={activeClip}
                    layoutTemplate={selectedJob.layoutTemplate}
                    subtitleStyle={selectedJob.subtitleStyle}
                    watermarkText={selectedJob.watermarkText}
                  />
                )}

                {/* Subtitle, framing and templates customizer */}
                <ShortsEditor
                  job={selectedJob}
                  onUpdateJobSettings={handleUpdateJobSettings}
                  onUpdateClip={handleUpdateClip}
                  onTriggerRender={handleTriggerRender}
                />
              </>
            )}

            {/* Live streaming Terminal logs logger */}
            <Terminal logs={selectedJob.logs} onClear={handleClearLogs} />
          </div>
        ) : (
          /* DASHBOARD VIEW */
          <Dashboard
            jobs={jobs}
            onAddJob={handleAddJob}
            onSelectJob={(id) => setSelectedJobId(id)}
            onDeleteJob={handleDeleteJob}
            activeJobId={selectedJobId}
          />
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-soccer-panel/20 border-t border-gray-900 px-6 py-6 mt-12 text-center text-xs text-gray-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            © 2026 Football Shorts AI. Cloud Native Workspace.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-[10px] text-soccer-green bg-soccer-green/5 border border-soccer-green/20 px-2 py-0.5 rounded">
              ● SERVER CONNECTED
            </span>
            <span>PORT 3000 INGRESS</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

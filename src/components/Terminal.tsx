import { useRef, useEffect } from "react";
import { LogMessage } from "../types.js";
import { Terminal as TerminalIcon, ShieldCheck, Trash2 } from "lucide-react";

interface TerminalProps {
  logs: LogMessage[];
  onClear: () => void;
}

export default function Terminal({ logs, onClear }: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-[#0b0f19] border border-gray-800 rounded-xl overflow-hidden shadow-2xl h-64 flex flex-col">
      {/* Header */}
      <div className="bg-[#0f1422] px-4 py-2 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
          <TerminalIcon size={14} className="text-soccer-green animate-pulse" />
          <span>SYSTEM LOGS // ffmpeg_whisper_daemon.sh</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900">
            <ShieldCheck size={10} />
            SANDBOX SECURE
          </span>
          <button
            onClick={onClear}
            className="text-gray-500 hover:text-white transition"
            title="Clear logs"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Logs output */}
      <div
        ref={containerRef}
        className="p-4 flex-1 overflow-y-auto font-mono text-xs space-y-1.5 scrollbar-thin select-text selection:bg-soccer-green/30"
      >
        {logs.length === 0 ? (
          <div className="text-gray-600 italic">No output logs received yet. Paste a YouTube video above to start...</div>
        ) : (
          logs.map((log, index) => {
            let color = "text-gray-300";
            let prefix = "[INFO]";

            if (log.level === "error") {
              color = "text-red-400";
              prefix = "[ERR]";
            } else if (log.level === "warning") {
              color = "text-amber-400";
              prefix = "[WARN]";
            } else if (log.level === "success") {
              color = "text-soccer-green font-semibold";
              prefix = "[OK]";
            }

            return (
              <div key={index} className="flex gap-2.5 items-start leading-5">
                <span className="text-gray-600 shrink-0 select-none">{log.timestamp}</span>
                <span className={`${color} shrink-0 select-none`}>{prefix}</span>
                <span className="text-gray-200 whitespace-pre-wrap">{log.message}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

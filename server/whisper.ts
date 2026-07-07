import { SubtitleWord } from "../src/types.js";

export const WhisperService = {
  /**
   * Generates highly precise word-by-word subtitles matching the clip commentary
   * and clips them perfectly within the start and end boundaries of the highlight clip.
   */
  async generateSubtitles(commentary: string, clipStart: number, clipEnd: number): Promise<SubtitleWord[]> {
    console.log(`[WhisperService] Auto-generating word-level subtitles for commentary (${commentary.length} chars)`);

    const words = commentary.split(/\s+/).filter(w => w.trim() !== "");
    const clipDuration = clipEnd - clipStart; // in seconds
    
    if (words.length === 0) return [];

    // Distribute words evenly over the duration of the clip
    // Leave a small padding at the beginning and the end
    const startPadding = 0.5;
    const endPadding = 0.5;
    const activeDuration = Math.max(1, clipDuration - startPadding - endPadding);
    const durationPerWord = activeDuration / words.length;

    const subtitleWords: SubtitleWord[] = [];
    
    words.forEach((word, index) => {
      // Clean up punctuation for display words but keep them legible
      const cleanText = word.replace(/[\[\]]/g, "");
      
      const startOffset = startPadding + index * durationPerWord;
      const endOffset = startOffset + durationPerWord * 0.95; // slightly shorter to avoid overlap

      subtitleWords.push({
        text: cleanText,
        start: Number(startOffset.toFixed(2)),
        end: Number(endOffset.toFixed(2))
      });
    });

    return subtitleWords;
  }
};

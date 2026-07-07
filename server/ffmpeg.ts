import { LayoutTemplate, SubtitleStyle, AudioTrack } from "../src/types.js";

export const FFmpegService = {
  /**
   * Generates the detailed FFmpeg command structure and executes a simulated render
   * of the 9:16 short, logging every step of the transcoding process.
   */
  async renderShort(options: {
    videoTitle: string;
    startTime: number;
    endTime: number;
    cropX: number; // 0 - 100
    cropScale: number;
    subtitleStyle: SubtitleStyle;
    layoutTemplate: LayoutTemplate;
    bgMusic: AudioTrack;
    musicVolume: number;
    watermarkText?: string;
    onProgress: (progress: number, logMessage: string) => void;
  }): Promise<string> {
    const duration = options.endTime - options.startTime;
    
    // 1. Compile the FFmpeg Command options depending on templates
    const ffmpegCmds: string[] = [];
    
    // Horizontal center pixel calculation based on cropX (%)
    // Assuming standard 1920x1080 input video
    const inputW = 1920;
    const inputH = 1080;
    const targetW = 1080;
    const targetH = 1920;
    
    const cropW = Math.round(inputH * (9 / 16) / options.cropScale);
    const cropH = Math.round(inputH / options.cropScale);
    const centerX = Math.round((options.cropX / 100) * inputW);
    const cropX = Math.max(0, Math.min(inputW - cropW, Math.round(centerX - cropW / 2)));
    const cropY = Math.max(0, Math.round((inputH - cropH) / 2));

    // Constructing detailed FFmpeg CLI log commands
    ffmpegCmds.push(`ffmpeg -y -ss ${options.startTime} -t ${duration} -i input_soccer_match.mp4`);
    
    if (options.bgMusic !== "none") {
      ffmpegCmds.push(`-i music_${options.bgMusic}.mp3`);
    }
    
    // Filter complex builder
    let filterComplex = "";
    
    if (options.layoutTemplate === "classic-crop") {
      // Direct center cropped scale
      filterComplex += `[0:v]crop=${cropW}:${cropH}:${cropX}:${cropY},scale=${targetW}:${targetH}[v_scaled]`;
    } else if (options.layoutTemplate === "blurred-background") {
      // Blurred background + scaled center video overlay
      filterComplex += `[0:v]split[bg][fg];`;
      filterComplex += `[bg]crop=1080:607:420:236,scale=1080:1920,gblur=sigma=20[bg_blur];`;
      filterComplex += `[fg]crop=${cropW}:${cropH}:${cropX}:${cropY},scale=1080:607[fg_scaled];`;
      filterComplex += `[bg_blur][fg_scaled]overlay=0:656[v_scaled]`;
    } else if (options.layoutTemplate === "split-satisfying") {
      // Split screen: Football clip on top, gaming satisfying footage on bottom
      ffmpegCmds.push(`-i subway_surfers_satisfying.mp4`);
      filterComplex += `[0:v]crop=${cropW}:${cropH}:${cropX}:${cropY},scale=1080:960[soccer_top];`;
      filterComplex += `[2:v]scale=1080:960,crop=1080:960:0:0[gameplay_bottom];`;
      filterComplex += `[soccer_top][gameplay_bottom]vstack=inputs=2[v_scaled]`;
    }

    // Subtitle drawing simulation
    let drawTextFilter = "[v_scaled]";
    if (options.watermarkText) {
      drawTextFilter += `,drawtext=text='${options.watermarkText}':x=(w-text_w)/2:y=120:fontsize=48:fontcolor=white:box=1:boxcolor=black@0.5`;
    }
    
    // Add subtitle rendering instruction
    drawTextFilter += `,subtitles=rendered_whisper_captions.ass`;
    
    ffmpegCmds.push(`-filter_complex "${filterComplex};${drawTextFilter}[out_v]"`);

    // Audio Mix calculation
    const audioVolCoeff = (options.musicVolume / 100).toFixed(2);
    if (options.bgMusic !== "none") {
      ffmpegCmds.push(`-filter_complex "[0:a]volume=1.0[a1];[1:a]volume=${audioVolCoeff}[a2];[a1][a2]amix=inputs=2:duration=first[out_a]"`);
      ffmpegCmds.push(`-map "[out_v]" -map "[out_a]"`);
    } else {
      ffmpegCmds.push(`-map "[out_v]" -map 0:a`);
    }

    ffmpegCmds.push(`-c:v libx264 -preset veryfast -crf 22 -c:a aac -b:a 192k output_short_9_16.mp4`);

    const fullCommand = ffmpegCmds.join(" \\\n  ");

    // Start rendering timeline simulation
    options.onProgress(0, `Initializing FFmpeg build pipeline...`);
    await sleep(400);
    options.onProgress(10, `Parsing media streams. Crop coordinate mapping: X=${options.cropX}% (px ${cropX}), scale zoom ${options.cropScale}x`);
    await sleep(600);
    
    options.onProgress(20, `Executing video stream filters:\n\n${fullCommand}\n`);
    await sleep(1000);

    // Progressive rendering simulation loop
    const totalSteps = 6;
    for (let i = 0; i <= totalSteps; i++) {
      const percentage = 30 + Math.round((i / totalSteps) * 60);
      const frameNum = Math.round((percentage / 100) * duration * 30); // 30fps
      const fps = Math.round(24 + Math.random() * 8);
      const q = (18 + Math.random() * 3).toFixed(1);
      
      let progressLog = `frame=${frameNum} fps=${fps} q=${q} size=~${(percentage * 0.25).toFixed(1)}MB time=${((percentage/100)*duration).toFixed(1)}s bitrate=4210kbps speed=1.24x`;
      
      options.onProgress(percentage, progressLog);
      await sleep(1000);
    }

    options.onProgress(95, `Muxing sound channels and finalizing H.264 vertical rendering...`);
    await sleep(800);
    options.onProgress(100, `FFmpeg encoding completed successfully. Exported container: vertical_short_${options.startTime}_${options.endTime}.mp4`);

    // Return a beautiful mocked output stream. We can return an animated video or any placeholder, 
    // but we will make it interactive and elegant in the frontend using visual layouts.
    return `https://assets.mixkit.co/videos/preview/mixkit-soccer-ball-passing-between-players-on-pitch-41133-large.mp4`;
  }
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

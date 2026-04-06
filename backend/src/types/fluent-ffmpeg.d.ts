declare module 'fluent-ffmpeg' {
  interface FfmpegCommand {
    setFfmpegPath(path: string): FfmpegCommand;
    setFfprobePath(path: string): FfmpegCommand;
    setStartTime(time: number | string): FfmpegCommand;
    duration(seconds: number): FfmpegCommand;
    videoFilters(filter: string | string[]): FfmpegCommand;
    complexFilter(
      filters: string | string[],
      outputs?: string | string[]
    ): FfmpegCommand;
    output(target: string): FfmpegCommand;
    input(source: string): FfmpegCommand;
    videoCodec(codec: string): FfmpegCommand;
    audioCodec(codec: string): FfmpegCommand;
    videoBitrate(rate: string): FfmpegCommand;
    audioBitrate(rate: string): FfmpegCommand;
    fps(rate: number): FfmpegCommand;
    on(event: string, callback: (...args: any[]) => void): FfmpegCommand;
    run(): void;
  }

  interface FfmpegStatic {
    (input: string): FfmpegCommand;
    setFfmpegPath(path: string): void;
    setFfprobePath(path: string): void;
    ffprobe(
      source: string,
      callback: (err: Error | null, metadata?: any) => void
    ): void;
  }

  const ffmpeg: FfmpegStatic;
  export default ffmpeg;
}

#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
// @ts-ignore
import ffprobeInstallerImport from "@ffprobe-installer/ffprobe";
const ffprobeInstaller = ffprobeInstallerImport || require("@ffprobe-installer/ffprobe");
import { promises as fs } from "fs";
import { dirname, basename, extname, join } from "path";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

interface ConvertVideoToGifParams {
  video_path: string;
  fps?: number;
  width?: number;
  height?: number;
  start_time?: number;
  duration?: number;
  split_duration?: number;
}

class GifCreatorServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "gif-creator-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "convert_video_to_gif",
          description: "Convert a video file to a GIF file in the same directory",
          inputSchema: {
            type: "object",
            properties: {
              video_path: {
                type: "string",
                description: "Path to the video file to convert"
              },
              fps: {
                type: "number",
                description: "Frames per second for the GIF (default: 10)",
                minimum: 1,
                maximum: 30
              },
              width: {
                type: "number",
                description: "Width of the output GIF (maintains aspect ratio if height not specified)"
              },
              height: {
                type: "number",
                description: "Height of the output GIF (maintains aspect ratio if width not specified)"
              },
              start_time: {
                type: "number",
                description: "Start time in seconds (default: 0)"
              },
              duration: {
                type: "number",
                description: "Duration in seconds (default: entire video)"
              },
              split_duration: {
                type: "number",
                description: "Duration in seconds for each segment (default: 0)"
              }
            },
            required: ["video_path"]
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name === "convert_video_to_gif") {
        const args = request.params.arguments as unknown as ConvertVideoToGifParams;
        return await this.convertVideoToGif(args);
      }
      
      throw new McpError(
        ErrorCode.MethodNotFound,
        `Unknown tool: ${request.params.name}`
      );
    });
  }

  public async convertVideoToGif(params: ConvertVideoToGifParams) {
    const {
      video_path,
      fps = 10,
      width,
      height,
      start_time = 0,
      duration,
      split_duration
    } = params;

    try {
      console.error('[DEBUG] Start convertVideoToGif');
      // Check if video file exists
      await fs.access(video_path);
      console.error('[DEBUG] File exists:', video_path);

      // 获取视频总时长
      const getVideoDuration = (path: string): Promise<number> => {
        return new Promise((resolve, reject) => {
          ffmpeg.ffprobe(path, (err, metadata) => {
            if (err) return reject(err);
            resolve(metadata.format.duration || 0);
          });
        });
      };

      const totalDuration = await getVideoDuration(video_path);
      console.error('[DEBUG] Video total duration:', totalDuration);
      const actualDuration = duration !== undefined ? Math.min(duration, totalDuration - start_time) : totalDuration - start_time;
      console.error('[DEBUG] actualDuration:', actualDuration);
      const dir = dirname(video_path);
      const filename = basename(video_path, extname(video_path));

      // 如果 split_duration 存在，批量导出
      if (split_duration && split_duration > 0) {
        console.error('[DEBUG] Enter split_duration loop');
        const gifPaths: string[] = [];
        let segmentIndex = 0;
        for (let t = start_time; t < start_time + actualDuration; t += split_duration, segmentIndex++) {
          const segDuration = Math.min(split_duration, start_time + actualDuration - t);
          const output_path = join(dir, `${filename}_${segmentIndex}.gif`);
          console.error(`[DEBUG] Segment ${segmentIndex}: t=${t}, segDuration=${segDuration}, output_path=${output_path}`);
          console.error(`[DEBUG] Before performConversion for segment ${segmentIndex}`);
          await this.performConversion(video_path, output_path, {
            fps,
            width,
            height,
            start_time: t,
            duration: segDuration
          });
          console.error(`[DEBUG] After performConversion for segment ${segmentIndex}`);
          gifPaths.push(output_path);
        }
        console.error('[DEBUG] All segments done');
        return {
          content: [
            {
              type: "text",
              text: `GIFs created successfully: ${gifPaths.join(", ")}`
            }
          ]
        };
      } else {
        // 单个导出
        const output_path = join(dir, `${filename}.gif`);
        console.error('[DEBUG] Single export, output_path:', output_path);
        await this.performConversion(video_path, output_path, {
          fps,
          width,
          height,
          start_time,
          duration: actualDuration
        });
        console.error('[DEBUG] Single export done');
        return {
          content: [
            {
              type: "text",
              text: `GIF created successfully at: ${output_path}`
            }
          ]
        };
      }
    } catch (error) {
      console.error('[DEBUG] Caught error in convertVideoToGif:', error);
      if (error instanceof Error && error.message.includes('ENOENT')) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Video file not found: ${video_path}`
        );
      }
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to convert video to GIF: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private performConversion(
    inputPath: string,
    outputPath: string,
    options: {
      fps: number;
      width?: number;
      height?: number;
      start_time?: number;
      duration?: number;
    }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      console.error('[DEBUG] performConversion called:', { inputPath, outputPath, options });
      const timeout = setTimeout(() => {
        console.error('[DEBUG] performConversion timeout!');
        reject(new Error('Video conversion timed out after 120 seconds'));
      }, 120000);

      let command = ffmpeg(inputPath)
        .format('gif');

      // Apply start time if specified
      if (options.start_time !== undefined) {
        command = command.setStartTime(options.start_time);
      }

      // Apply duration if specified
      if (options.duration !== undefined) {
        command = command.setDuration(options.duration);
      }

      // Build the filter complex for high-quality GIF
      let filterString = `fps=${options.fps}`;
      
      // Add scaling if dimensions are specified
      if (options.width && options.height) {
        filterString += `,scale=${options.width}:${options.height}:flags=lanczos`;
      } else if (options.width) {
        filterString += `,scale=${options.width}:-1:flags=lanczos`;
      } else if (options.height) {
        filterString += `,scale=-1:${options.height}:flags=lanczos`;
      }

      // Add palette generation for better quality
      filterString += `,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`;

      command = command.complexFilter(filterString);

      command
        .on('start', (commandLine) => {
          console.error('[DEBUG] ffmpeg start:', commandLine);
        })
        .on('progress', (progress) => {
          console.error('[DEBUG] ffmpeg progress:', progress);
        })
        .on('end', () => {
          clearTimeout(timeout);
          console.error('[DEBUG] ffmpeg end');
          resolve();
        })
        .on('error', (err) => {
          clearTimeout(timeout);
          console.error('[DEBUG] ffmpeg error:', err);
          reject(err);
        })
        .save(outputPath);
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("GIF Creator MCP server running on stdio");
    
    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }
}

const server = new GifCreatorServer();

server.start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
  // 在 src/index.ts 末尾加
export async function convertVideoToGif(params: ConvertVideoToGifParams) {
return await new GifCreatorServer().convertVideoToGif(params);
}
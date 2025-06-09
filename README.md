# GIF Creator MCP

An MCP (Model Context Protocol) server that converts video files to GIF animations.

## Features

- Convert any video file to GIF format
- Customize output settings (FPS, dimensions, duration)
- Extract specific portions of videos
- High-quality GIF generation with optimized palette

## Installation

```bash
npm install
npm run build
```

## Usage

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "gif-creator": {
      "command": "node",
      "args": ["/path/to/gif-creator-mcp/dist/index.js"]
    }
  }
}
```

## Tools

### convert_video_to_gif

Converts a video file to a GIF file, saving it in the same directory as the source video.

**Parameters:**
- `video_path` (required): Path to the video file to convert
- `fps` (optional): Frames per second for the GIF (1-30, default: 10)
- `width` (optional): Width of the output GIF (maintains aspect ratio if height not specified)
- `height` (optional): Height of the output GIF (maintains aspect ratio if width not specified)
- `start_time` (optional): Start time in seconds (default: 0)
- `duration` (optional): Duration in seconds (default: entire video)

## Examples

### Basic conversion
```json
{
  "video_path": "/path/to/video.mp4"
}
```

### Custom settings
```json
{
  "video_path": "/path/to/video.mp4",
  "fps": 15,
  "width": 480,
  "start_time": 5,
  "duration": 10
}
```

### Extract a specific portion
```json
{
  "video_path": "/path/to/long-video.mov",
  "start_time": 30,
  "duration": 5,
  "fps": 20
}
```

## Requirements

- Node.js
- FFmpeg (automatically installed via @ffmpeg-installer/ffmpeg)

## Notes

- The output GIF is saved in the same directory as the input video
- The filename is the same as the video file but with a .gif extension
- Large videos may take some time to process
- The tool uses optimized palette generation for better quality GIFs

## License

MIT
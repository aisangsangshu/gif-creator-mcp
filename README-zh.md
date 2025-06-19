[English](README.md) | [中文](README-zh.md)

# GIF Creator MCP

一个将视频文件转换为 GIF 动画的 MCP（模型上下文协议）服务器。
![gif-creator-demo](https://github.com/user-attachments/assets/0543d53f-8bc7-4a16-8a4b-e41ef13568c6)


## 功能

- 将任意视频文件转换为 GIF 格式
- 自定义输出设置（帧率、尺寸、时长）
- 提取视频的特定片段
- 高质量 GIF 生成，优化调色板

## 安装

```bash
npm install
npm run build
```

## 使用方法
- 使用goose已经打通 可使用
- 该goose版本的github或者采用DeepGoose方案可以使用deepseek的api key
- fork的仓库 https://github.com/aisangsangshu/DeepGoose#
在 Goose 中，可以通过进入"高级设置 > 扩展 > + 添加自定义扩展"，并在命令中粘贴：
node /path/to/gif-creator-mcp/dist/index.js

建议将超时时间增加到 1000。

### 测试
- 可测试运行一下，生成npm run build生成的dist/index.js文件中的尾部添加【否则一旦报错，在goose里面出现迟迟没有响应的现象】
```json
const test = async () => {
  await server['convertVideoToGif']({
    video_path: "/home/user/Desktop/gifcreator/ycy0.mp4",
    fps: 15,
    width: 480,
    start_time: 5,
    duration: 1,
    split_duration: 1
  });
};
test();
```

目前，Claude Desktop 不支持视频输入。建议使用其他客户端，如 [Goose](https://block.github.io/goose/)，并将其作为扩展添加。

```
```


对于其他 MCP 客户端，可以使用以下命令启动服务器：

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

## 工具

### convert_video_to_gif

将视频文件转换为 GIF 文件，并保存在源视频的同一目录下。

**参数：**
- `video_path`（必需）：要转换的视频文件路径
- `fps`（可选）：GIF 的帧率（1-30，默认：10）
- `width`（可选）：输出 GIF 的宽度（如果未指定高度，则保持宽高比）
- `height`（可选）：输出 GIF 的高度（如果未指定宽度，则保持宽高比）
- `start_time`（可选）：起始时间（秒，默认：0）
- `duration`（可选）：持续时间（秒，默认：整个视频）
- `split_duration`(可选):自动分割多个gif

## 示例

### 基本转换
```json
{
  "video_path": "/path/to/video.mp4"
}
```

### 自定义设置
```json
{
  "video_path": "/path/to/video.mp4",
  "fps": 15,
  "width": 480,
  "start_time": 5,
  "duration": 10
}
```
### 新增一个split_duration选项,
### 其目的可循序讲一个MP4安装起始时间到最大间隔时间之间再次切片生成多张gif命名为[xx.mp4][xx_0.gif,xx_1.gif...]

````json
{
"video_path": "/home/user/Desktop/gifcreator/ycy0.mp4",
"fps": 15,
"width": 480,
"start_time": 5,
"split_duration": 3,
"duration": 10
}
````

### 提取特定片段
```json
{
  "video_path": "/path/to/long-video.mov",
  "start_time": 30,
  "duration": 5,
  "fps": 20
}
```

## 依赖要求

- Node.js
- FFmpeg（通过 @ffmpeg-installer/ffmpeg 自动安装）
## 升级安装在windows平台
- 安装electron后启动main.cjs的命令是
```
npm start
```
- 安装打包工具electron-packager
```
npm install --save-dev electron-packager

```
- 打包为windows应用直接执行
```
npx electron-packager . gif-creator --platform=win32 --arch=x64 --out=release --overwrite
```
## 注意事项

- 输出的 GIF 保存在输入视频的同一目录下
- 文件名与视频文件相同，但扩展名为 .gif
- 大型视频处理可能需要一些时间
- 工具使用优化调色板生成更高质量的 GIF

## 许可证

MIT 
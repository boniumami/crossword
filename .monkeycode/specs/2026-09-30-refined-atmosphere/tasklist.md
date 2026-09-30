# 需求实施计划

- [x] 1. 升级种子氛围背景图生成器
  - 重写 `scripts/generate-assets.py` 的画面部分：1280×720、24 帧、120ms、无限循环
  - 六张图分层绘制，每帧至少 5 类景物、至少 8 种主色，角色圆润友善
  - 覆盖 Requirement 1、Requirement 2

- [x] 2. 升级种子氛围背景乐生成器
  - 将 `write_wav` 改为 44100 Hz 立体声、时长不少于 16 秒、旋律+伴奏五声音阶
  - 包络柔和、峰值不削波、首尾交叉淡化以便循环
  - 覆盖 Requirement 3.2、3.3、3.4

- [x] 3. 启动时同名覆盖种子文件
  - 修改 `server/db.js`：列出种子文件名，启动时用最新种子覆盖 `uploads/` 同名文件
  - 空库仍插入绑定；自定义上传文件名保持唯一化
  - 覆盖 Requirement 5.1、5.2、5.3、5.4

- [x] 4. 作答页媒体连续播放与可读性
  - 调整 `web/src/main.js` 的 `applyMedia`：同一诗题不换源、填字不打断乐曲
  - 调整 `web/src/styles.css` 背景遮罩，保证标题与字槽可读
  - 覆盖 Requirement 3.5、3.6、Requirement 4、Requirement 5.5

- [x] 5. 首页古风童趣装饰
  - 为 `.home` 增加云纹与灯笼（或花枝）CSS 装饰，首页保持静音
  - 覆盖 Requirement 6

- [x] 6. 检查点 - 生成资源并跑通测试
  - 运行资源生成脚本，校验 GIF/WAV 规格
  - 运行现有前后端测试

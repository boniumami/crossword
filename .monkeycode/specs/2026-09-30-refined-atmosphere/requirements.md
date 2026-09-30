# Requirements Document

## Introduction

本需求面向古诗词填写小游戏的氛围层：在作答过程中，孩子看到的背景画面与听到的背景音乐需更精致、更贴合诗意，并更能吸引儿童注意力。现有种子资源为低帧几何动画 GIF 与短促单音正弦波 WAV，画面元素少、音乐单薄。本需求升级默认背景图与默认背景音乐的观感与听感，并保证作答区可读、诗题绑定关系与上传自定义素材能力保持可用。

## Glossary

- **System**：古诗词填写小游戏，含首页、作答页、题库管理与后端媒体服务。
- **作答页**：展示当前诗题、字槽、字库与提交操作的界面。
- **氛围背景图**：铺满作答页底层的循环动画画面，与当前诗题绑定或使用默认图。
- **氛围背景乐**：作答页循环播放的背景音乐，与当前诗题绑定或使用默认曲。
- **种子资源**：仓库内 `seed-assets/` 中随题库初始化分发的默认图片与音乐。
- **诗题绑定媒体**：题库中某首诗通过 `imageId` / `musicId` 关联的图片与音乐。
- **儿童受众**：约 5 至 10 岁、正在学习古诗词的孩子。
- **可读性**：字槽、字库与标题文字在氛围背景之上可被清晰辨认。

## Requirements

### Requirement 1

**User Story:** AS 正在作答的孩子, I want 看到更精致、更有童趣的诗意背景画面, so that 我愿意盯着题目把字填完

#### Acceptance Criteria

1. WHEN 作答页展示一首已绑定氛围背景图的诗, the System SHALL 以铺满视口的循环动画呈现该诗的氛围背景图
2. WHILE 作答页正在展示氛围背景图, the System SHALL 在画面中同时呈现至少 5 类可辨认景物（例如天空、地面或水面、植物、动物、建筑、星月、人物剪影中的任意组合）
3. WHEN 生成或替换种子氛围背景图, the System SHALL 使用不少于 1280×720 像素、不少于 24 帧、单帧时长 80 至 160 毫秒、无限循环的动画
4. WHILE 氛围背景图播放, the System SHALL 使用高饱和且和谐的儿童向配色，单帧可区分的主色不少于 8 种
5. IF 氛围背景图包含角色或动物, the System SHALL 使用圆润、友善的造型，画面不含惊吓、血腥或恐怖元素

### Requirement 2

**User Story:** AS 正在作答的孩子, I want 每首诗的背景都像在讲这首诗的故事, so that 我能把画面和诗句对上号

#### Acceptance Criteria

1. WHEN 作答页打开《静夜思》, the System SHALL 展示含夜空、明月与窗棂意象的氛围背景图
2. WHEN 作答页打开《春晓》, the System SHALL 展示含晨光、花卉与飞鸟意象的氛围背景图
3. WHEN 作答页打开《咏鹅》, the System SHALL 展示含池水、白鹅与波纹意象的氛围背景图
4. WHEN 作答页打开《悯农》, the System SHALL 展示含田野、禾苗与日头意象的氛围背景图
5. WHEN 作答页打开《登鹳雀楼》, the System SHALL 展示含夕阳、山峦、河流与楼阁意象的氛围背景图
6. WHEN 作答页打开一首未绑定图片的诗, the System SHALL 展示默认氛围背景图，默认图需呈现宣纸、云纹或水墨山水中的至少两类意象

### Requirement 3

**User Story:** AS 正在作答的孩子, I want 听到更优雅、更典雅的循环古风音乐, so that 填字时心情安静又开心

#### Acceptance Criteria

1. WHEN 作答页展示一首已绑定氛围背景乐的诗, the System SHALL 循环播放该诗的氛围背景乐
2. WHEN 生成或替换种子氛围背景乐, the System SHALL 输出采样率不少于 44100 Hz、时长不少于 16 秒、可无缝或近无缝循环的音频
3. WHILE 氛围背景乐播放, the System SHALL 同时包含旋律声部与至少一个伴奏声部，并使用中国五声音阶
4. WHILE 氛围背景乐播放, the System SHALL 将默认播放音量保持在人耳舒适区间（相对峰值约 0.28 至 0.42），且音频峰值避免削波
5. WHEN 孩子未按下静音, the System SHALL 在作答页持续播放当前诗的氛围背景乐；WHEN 孩子按下静音, the System SHALL 立即停止播放并保持静音状态直到再次打开声音
6. WHEN 作答页打开一首未绑定音乐的诗, the System SHALL 播放默认氛围背景乐

### Requirement 4

**User Story:** AS 正在作答的孩子, I want 背景再漂亮也能看清字, so that 我不会把字填错格子

#### Acceptance Criteria

1. WHILE 作答页展示氛围背景图, the System SHALL 在字槽、字库、标题与操作按钮所在区域保持文字与控件可读
2. WHEN 氛围背景图亮度较高或对比变化较快, the System SHALL 通过半透明遮罩或纸面底板保证字槽字符与按钮标签对比度达到可辨认水平
3. WHEN 孩子点击字槽、字库或提交等操作, the System SHALL 保持当前氛围背景乐连续播放，避免因界面重绘而从头打断当前乐曲

### Requirement 5

**User Story:** AS 题库维护者, I want 升级后的默认资源自动跟着诗题走、自定义上传仍然可用, so that 已有题库和以后自己换图换曲都不受影响

#### Acceptance Criteria

1. WHEN 空数据库首次初始化, the System SHALL 将升级后的种子氛围背景图与氛围背景乐复制到媒体目录，并为五首内置诗及默认媒体建立绑定
2. WHEN 已有数据库中的种子文件名仍被五首内置诗引用, the System SHALL 在资源升级后继续通过原有文件名提供新画面与新乐曲
3. WHEN 系统启动且媒体目录中已存在与种子资源同名的文件, the System SHALL 用仓库内最新种子文件覆盖这些同名种子文件，使已有题库立即使用新画面与新乐曲
4. WHILE 题库管理页可用, the System SHALL 继续允许上传 PNG、JPEG、GIF、APNG、WebP 图片以及 MP3、WAV、OGG 音乐，并允许诗题绑定这些自定义媒体
5. WHEN 孩子返回首页, the System SHALL 停止作答页氛围背景乐

### Requirement 6

**User Story:** AS 刚打开游戏的孩子, I want 首页也有一点精致童趣的氛围, so that 我还没点开始就被吸引住

#### Acceptance Criteria

1. WHEN 孩子进入首页, the System SHALL 展示带有古风童趣装饰的首页背景（云纹、灯笼、花枝或山水剪影中的至少两类）
2. WHILE 孩子停留在首页, the System SHALL 保持首页静音，避免在未开始作答时自动播放音乐

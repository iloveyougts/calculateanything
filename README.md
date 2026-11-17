# 🐰 USAGI LIFE · 颜芷萱 (GAN TZI SHUAN) 的专属生活手账仪表盘 💖

> 💖 **Made with Love exclusively for 颜芷萱 (GAN TZI SHUAN)**  
> 专为最爱乌萨奇的芷萱小仙女量身定制的 **All-in-One 专属生活手账**。  
> 采用 **方案 A：私人独立登录与数据隔离系统**，配合可爱治愈的 Q 弹动画、Web Audio 8-bit 音效、漂落粒子动效、专属情侣纪念日与贴心生理期关怀！

---

## 🌟 包含的核心功能模块

### 0. 方案 A：私人独立登录系统
- **专属账号管理**：每个人拥有自己的账号与密码，支持多账号无缝切换。
- **严格数据隔离**：登录后仅可查看和记录自己的经期数据、日常开销账单与隐私日记。
- **数据安全与备份**：纯前端隔离存储，支持一键导出与导入 JSON 格式数据备份。

### 1. 效率、日程与日历记录
- 📅 **生活手账日历 (Interactive Calendar)**：全功能 7 列月历网格，支持按年/月任意翻看与一键回到“今天”；每日格子直观汇总展示**当日日程待办、经期状态与支出金额**；**点击任意一天**即可唤出专属弹窗，随手记录日程标题、具体时间、分类标签、颜色标记与详细日记随笔，支持一键打勾完成！
- 🟩 **习惯养成打卡 & 贡献热力图 (Habit Heatmap)**：类似 GitHub 的 140 天绿格子热力图，记录自律轨迹与连续打卡天数（Streak）。
- 💡 **碎片灵感备忘录 (Quick Notes)**：随手记录突然冒出的灵感金句、便签置顶、分类标签检索。
- ⏳ **待办清单与倒数日 (To-Do & Countdowns)**：核心任务打勾清单，纪念日/考试周/发薪日天数倒计时。

### 2. 财务与日常记账
- 💰 **日常记账本 (Expense Tracker)**：完整支持**按年份与按月份自由筛选**（多跨度年份选择、1~12月自由切换、快捷“上月 / 本月 / 下月”一键导航、整年数据汇总统计）、动态分类占比环形图、当月预算控制与结余计算。

### 3. 健康与身体状态
- 🌸 **生理期追踪 (Period Tracker)**：智能周期预测、排卵期/黄体期/经期阶段状态提示、经期历史记录与痛经程度分析。
- 💧 **饮水打卡**：动态波浪水杯视觉打卡（目标 8 杯 / 2000ml），达标触发彩带庆祝动画。
- 🌙 **作息与睡眠日记**：记录入睡/起床时间、睡眠总时长与睡眠质量感受。
- ⚖️ **体重与运动趋势**：体重变化折线图（Chart.js 动态绘制），运动类型与时长打卡。

### 2. 效率与日常习惯
- 🟩 **习惯养成打卡 & 贡献热力图 (Habit Heatmap)**：类似 GitHub 的 140 天绿格子热力图，记录自律轨迹与连续打卡天数（Streak）。
- 💡 **碎片灵感备忘录 (Quick Notes)**：随手记录突然冒出的灵感金句、便签置顶、分类标签检索。
- ⏳ **待办清单与倒数日 (To-Do & Countdowns)**：核心任务打勾清单，纪念日/考试周/发薪日天数倒计时。

### 3. 娱乐与个人收藏
- 🎵 **乌萨奇音乐点歌台 (YouTube Music Lounge)**：YouTube 纯净无痕嵌入点歌台，支持任意搜索歌名/歌手与粘贴链接，内置男友精选浪漫歌单（异地情歌、Lofi学习、晚安助眠、乌萨奇治愈音等），无繁杂弹窗与侧边栏广告！
- 🎬 **书影音 / 探店清单 (Watchlist & Wishlist)**：电影剧集评分打卡、心愿美食探店记录。
- 🧊 **购物冷静期清单 (Cooling-off List)**：冲动消费抑制器！记录想买的物品并设置 3 天倒数冷静期，帮你有效省钱。
- ✨ **感恩日记 / 每日高光 (Daily Highlight)**：睡前写下今天发生的一件好事与感恩的人，打造幸福记忆墙。

### 4. 乌萨奇 Usagi 主题特效
- 🥕 **背景粒子系统**：漂落的胡萝卜、闪烁星星、樱花花瓣（可一键开启/关闭）。
- 🔊 **Web Audio 8-bit Q 萌音效**：纯前端合成音效（乌萨奇 signature "YAHA!" 欢庆和弦、水滴音、金币音，零外部资源依赖，防断网与404）。
- 🐰 **悬浮乌萨奇吉祥物**：点击拍拍乌萨奇，触发随机鼓励金句与彩带粒子。

---

## 💾 数据存储与云端数据库说明 (Database Guide)

很多人好奇：**GitHub Pages 本身是静态托管，没有自带数据库，怎么存数据？**

本项目贴心设计了**【双模存储架构 (Dual-Mode)】**：

### 模式一：默认本地安全隔离存储（开箱即用，无需任何配置）
- 默认情况下，手账系统使用浏览器原生的 `localStorage` 隔离技术。
- **优点**：100% 免费、数据直接保存在您的手机或电脑中，绝不上传到任何外部第三方服务器，隐私极高，离线没网也能正常记账。
- **备份方式**：页面顶部提供 **📥 导出 JSON 备份** 与 **📤 导入备份** 按钮，可随时下载自己的数据副本。

### 模式二：Supabase 免费云端数据库（跨手机/电脑实时云同步）
您的专属 Supabase 项目已为您配置完毕：
- **Project URL**：`https://rlbovlevaddvbuchsxwz.supabase.co`（已预设）
- **Publishable Key**：`sb_publishable_v-jwAI5rZT3nq_kHRfHv5Q_8CdXbbjz`（已预设）

**只需最后 1 步一键建表：**
1. 登录您的 Supabase 项目页面：[https://supabase.com/dashboard/project/rlbovlevaddvbuchsxwz](https://supabase.com/dashboard/project/rlbovlevaddvbuchsxwz)
2. 点击左侧 **SQL Editor** -> **New query**。
3. 打开本项目内的 `database.sql`，全选复制代码粘贴进去，点击 **Run** 即可完成建表！
4. 打开手账网站，顶部导航栏右上角的 **☁️ 数据库** 呼吸灯即会常亮连接，跨设备自动实时同步！

> 💡 **特别说明**：即使不配置 Supabase，本地模式下双击 `index.html` 也可以立即无限制使用全部 11 大模块，**不需要上传到 GitHub 才能注册或登录**！本地账号数据全部保存在当前浏览器中，100% 独立私密！

---

## 🚀 如何上传到 GitHub 并开启 GitHub Pages 网站

本项目为 **100% 纯静态零依赖架构**，无需后端服务器即可在 GitHub Pages 上永久免费运行！

### 步骤 1：上传到 GitHub
1. 打开 [GitHub](https://github.com/) 并点击右上角 **New repository**（新建仓库）。
2. 仓库名称填写如：`usagi-life-dashboard`，设为 **Public**，点击 **Create repository**。
3. 将当前文件夹内的所有文件（`index.html`、`app.js`、`style.css`、`sound.js`、`particles.js`、`usagi_character.png` 等）全选直接拖拽上传到仓库中（无需子文件夹，直接平铺上传即可）。
   - 方式一（网页端）：直接在 GitHub 仓库界面点击 **Upload files** 拖拽上传并 Commit。
   - 方式二（Git 命令行）：
     ```bash
     git init
     git add .
     git commit -m "feat: initial usagi life dashboard"
     git branch -M main
     git remote add origin https://github.com/你的用户名/usagi-life-dashboard.git
     git push -u origin main
     ```

### 步骤 2：一键开启 GitHub Pages 免费在线访问
1. 进入 GitHub 仓库页面的 **Settings**（设置）选项卡。
2. 在左侧侧边栏点击 **Pages**。
3. 在 **Build and deployment** 下的 **Branch** 选择 `main` 分支，目录选择 `/ (root)`，点击 **Save**。
4. 等待约 1 分钟，刷新页面即可看到部署成功的网址：
   `https://<你的GitHub用户名>.github.io/usagi-life-dashboard/`
5. 用手机、平板或电脑打开该网址，即可随时随地记录你的生活！

---

## 💻 本地直接运行
直接双击打开 `index.html` 即可在任意浏览器中完美使用！

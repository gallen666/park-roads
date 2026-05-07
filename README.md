# Park-ROADS · 数字化转型升级指数政策沙盘

> 基于戴继涛博士论文《传统商业园区数字化转型升级中的挑战和对策——基于 OpenX@X 平台的实证研究》（香港岭南大学 DBA 2025）的政策沙盘软件。受 [En-ROADS](https://en-roads.climateinteractive.org/) 启发，把"系统动力学 + 滑杆 + 实时仪表 + 工作坊"四件套从气候领域移植到产业园场景。

## ✨ 一句话定位

**让政府、园区、资本、企业、科研、人才、社区——七类利益相关方第一次能在同一张沙盘上，看到自己的诉求与园区数字化转型升级指数（DTSI）的实时关系。**

## 🚀 快速部署（任选一种，5 分钟内上线）

### 方案 A · Netlify Drop（最快，无需账号）
1. 打开 https://app.netlify.com/drop
2. 把整个 `deploy/` 文件夹拖进页面
3. 立刻得到一个 `xxx.netlify.app` 的临时网址

### 方案 B · GitHub Pages（永久免费）
```bash
# 把 deploy/ 文件夹推到任意 GitHub 仓库
git init && git add . && git commit -m "init"
git remote add origin https://github.com/<你>/<仓库名>.git
git push -u origin main
```
然后到仓库 Settings → Pages → Source 选 `main` 分支根目录 → 保存。
约 1 分钟后访问 `https://<你>.github.io/<仓库名>/`。

### 方案 C · Vercel（专业级，自动 CI/CD）
1. 把 `deploy/` 推到 GitHub 仓库（同上）
2. 登录 https://vercel.com/new ，选中该仓库
3. 直接点 Deploy（已配 `vercel.json`，无需任何设置）
4. 自动得到 `xxx.vercel.app` 域名 + 自动 HTTPS + 全球 CDN

### 方案 D · Cloudflare Pages（国内访问较友好）
1. 推到 GitHub
2. 登录 https://dash.cloudflare.com → Pages → Create a project
3. 连接 GitHub 仓库 → 直接 Deploy

## 📁 文件结构

```
deploy/
├── index.html       # 主网站（约 80 KB，所有功能内置）
├── 404.html         # 深链回退页（处理直接访问 /sandbox 等路径）
├── _redirects       # Netlify / Cloudflare Pages 路由配置
├── vercel.json      # Vercel 路由配置
└── README.md        # 本说明
```

## 🎯 网站包含的 6 个页面

| 页面 | 路径 | 主要功能 |
|------|------|---------|
| 首页 | `/#home` | 项目介绍 + 6 张特性卡 + 数据卡 |
| **政策沙盘** | `/#sandbox` | **核心功能**：35 滑杆 + DTSI 实时仿真 + Undo/Redo/Share |
| 方法论 | `/#method` | DTSI 公式 + 7 主体 + 35 指标完整 AHP 权重表 |
| 案例库 | `/#cases` | 5 园区 3 年实测数据 + 园区 C 四阶段案例 |
| 工作坊指南 | `/#workshop` | 4 小时议程 + 7 角色卡 + 主持人话术 |
| 关于 | `/#about` | 学术引用 + 致谢 + 部署 + 路线图 |

## 🔧 自定义域名

部署后，三家平台都支持绑定自定义域名（GoDaddy / Namecheap / 阿里云 / 腾讯云购买）：
- **Netlify / Vercel / Cloudflare Pages**：在控制台 → Domains → Add custom domain → 按提示加 CNAME / A 记录到你的域名 DNS

## 🧪 本地测试

```bash
cd deploy
python3 -m http.server 8000
# 然后浏览器打开 http://localhost:8000
```

或者直接双击 `index.html` 即可（无需服务器）。

## 📚 学术引用

**戴继涛 (2025).** 传统商业园区数字化转型升级中的挑战和对策——基于 OpenX@X 平台的实证研究. *香港岭南大学全球数字经济与治理工商管理博士（DBA）学位论文。* https://commons.ln.edu.hk/otd_tpg/55/

导师：尚蔚鑫教授、李红军教授

## 🌍 设计灵感

[En-ROADS Climate Solutions Simulator](https://en-roads.climateinteractive.org/) — Climate Interactive × MIT Sloan

## ⚖️ 许可证

本网站为基于公开学位论文的演示工具。所有论文权重、案例数据来自原文，版权属作者与岭南大学。代码部分采用 MIT 风格授权（仅限学术与非营利用途的二次开发）。

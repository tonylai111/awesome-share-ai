# Tony — 个人学习站

Tony（小明同学）的中英双语个人学习站：文章、指南、关于页。

## 开发

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)（默认跳转 `/zh`）。

## 技术栈

- Next.js App Router
- Tailwind CSS
- next-intl（`/zh`、`/en`）
- next-themes（深色模式）
- MDX 内容（`content/articles`、`content/guides`）

## 部署

推荐 [Vercel](https://vercel.com)：导入本仓库后一键部署，Framework Preset 选 Next.js。

本地生产预览：

```bash
npm run build && npm start
```

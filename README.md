# Salt Experiment Classroom App

一个面向课堂使用的食盐溶解实验记录系统。

## 功能

- 教师登录后创建课堂并生成小组码。
- 学生平板输入小组码进入实验页面。
- 每次提交都会保存，不覆盖历史。
- 教师查看各组提交记录、正确率和错误类型统计。

## 本地运行

```bash
npm install
npm start
```

浏览器打开：

- 学生入口：`http://localhost:3000/`
- 教师入口：`http://localhost:3000/teacher.html`

默认教师账号：

- 用户名：`teacher`
- 密码：`teacher123`

## 测试

```bash
npm test
```

## 部署说明

- 应用是标准 Node.js 服务，可部署到任意支持 Node 的服务器。
- 默认数据库文件为项目根目录下的 `data.sqlite`。
- 生产环境建议：
  - 通过反向代理启用 HTTPS。
  - 将默认教师密码改成环境变量或正式账号体系。
  - 定期备份 `data.sqlite`。

## 当前限制

- 第一版通过轮询刷新教师看板，还没有 WebSocket 实时推送。
- 当前只内置一个默认教师账号。
- 课堂数据暂不支持导出。

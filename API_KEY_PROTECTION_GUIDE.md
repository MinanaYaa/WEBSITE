# API密钥保护指南

本指南介绍了如何在Netlify部署环境中保护您的API密钥，避免在前端代码中明文暴露。

## 问题分析

在原始代码中，您的API密钥以明文形式直接暴露在前端代码中：

1. 高德地图API密钥：在`mzTravel.html`文件中直接嵌入
2. 心知天气API密钥：在`weather-widget.js`文件中直接使用

这种做法存在安全风险，可能导致密钥泄露和滥用。

## 解决方案

我们采用了**API代理模式**来解决这个问题，具体实现如下：

### 1. 创建Netlify函数代理

我们在`netlify/functions/`目录下创建了两个代理函数：

- `weather-api.js`：代理心知天气API请求
- `map-api.js`：代理高德地图API请求

这些函数在服务器端运行，可以安全地访问环境变量中的API密钥，而不是在前端暴露。

### 2. 配置Netlify重定向规则

在`netlify.toml`中，我们配置了重定向规则，使得所有以`/api/`开头的请求都被转发到相应的Netlify函数：

```toml
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

### 3. 修改前端代码

我们修改了前端代码，使其通过代理函数发送API请求，而不是直接调用外部API：

1. 在`mzTravel.html`中，动态加载高德地图API，使用`/api/map-api`作为代理
2. 在`weather-widget.js`中，将API请求改为使用`/api/weather-api`作为代理

## 在Netlify上部署时的设置步骤

当您在Netlify上部署此项目时，请按照以下步骤设置环境变量：

1. 登录Netlify控制台，进入您的项目页面
2. 点击"Site settings" > "Environment variables"
3. 点击"Add a variable"按钮，添加以下环境变量：

| 环境变量名 | 描述 | 默认值（仅供参考，请使用您自己的API密钥） |
|----------|------|----------------------------------------|
| `WEATHER_API_KEY` | 心知天气API密钥 | SCiXMZJNat6-m7dVy |
| `MAP_API_KEY` | 高德地图API密钥 | 93336cce45884cdac08371812275ede4 |

4. 保存设置后，重新部署项目

## 开发环境说明

在本地开发环境中，我们的解决方案会：

1. 如果环境变量未设置，将使用默认的API密钥（仅为开发目的）
2. 代理函数会正常工作，但在本地HTTP服务器上不会运行Netlify函数

为了在本地完全模拟Netlify环境，建议：

1. 安装Netlify CLI：`npm install -g netlify-cli`
2. 使用`netlify dev`命令启动本地开发服务器
3. 在`.env`文件中设置您的API密钥（该文件不应提交到版本控制系统）

## 安全建议

1. 定期轮换您的API密钥，特别是在怀疑可能泄露时
2. 为API密钥设置适当的使用权限和额度限制
3. 不要将API密钥提交到版本控制系统中
4. 考虑使用API网关服务提供更高级的安全控制

## 故障排除

如果您在使用代理函数时遇到问题：

1. 检查Netlify函数日志以获取详细错误信息
2. 确保环境变量设置正确
3. 验证API密钥是否有效

如有其他问题，请参考[Netlify Functions文档](https://docs.netlify.com/functions/overview/)或联系Netlify支持。
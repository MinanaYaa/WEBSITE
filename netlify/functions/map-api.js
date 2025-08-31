// Netlify函数 - 代理高德地图API请求
const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  try {
    // 从环境变量获取API密钥
    const API_KEY = process.env.MAP_API_KEY || '93336cce45884cdac08371812275ede4';
    
    // 解析查询参数
    const { url, ...params } = event.queryStringParameters || {};
    
    // 如果没有提供URL，则返回错误
    if (!url) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': process.env.ACCESS_CONTROL_ALLOW_ORIGIN || '*'
        },
        body: JSON.stringify({ error: '缺少必要的URL参数' })
      };
    }
    
    // 构建完整的API请求URL，确保包含key参数
    let requestUrl = new URL(url);
    requestUrl.searchParams.set('key', API_KEY);
    
    // 添加其他查询参数
    Object.entries(params).forEach(([key, value]) => {
      if (key !== 'key') { // 避免覆盖API密钥
        requestUrl.searchParams.set(key, value);
      }
    });
    
    // 发送请求到高德地图API
    const response = await fetch(requestUrl.toString());
    
    // 获取响应头
    const headers = {
      'Access-Control-Allow-Origin': process.env.ACCESS_CONTROL_ALLOW_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'GET, POST',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
    
    // 根据原始响应设置Content-Type
    if (response.headers.get('Content-Type')) {
      headers['Content-Type'] = response.headers.get('Content-Type');
    }
    
    // 根据响应类型处理返回数据
    let body;
    if (headers['Content-Type'] && headers['Content-Type'].includes('application/json')) {
      body = JSON.stringify(await response.json());
    } else {
      body = await response.text();
    }
    
    // 返回结果给客户端
    return {
      statusCode: response.status,
      headers: headers,
      body: body
    };
  } catch (error) {
    console.error('Map API Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.ACCESS_CONTROL_ALLOW_ORIGIN || '*'
      },
      body: JSON.stringify({
        error: '获取地图数据失败',
        details: error.message
      })
    };
  }
};
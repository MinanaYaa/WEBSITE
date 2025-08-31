// Netlify函数 - 代理心知天气API请求
const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  try {
    // 从环境变量获取API密钥
    const API_KEY = process.env.WEATHER_API_KEY || 'SCiXMZJNat6-m7dVy';
    
    // 解析查询参数
    const { location = '广州', language = 'zh-Hans', unit = 'c', start = '0', days = '10' } = event.queryStringParameters || {};
    
    // 构建API URL
    const apiUrl = `https://api.seniverse.com/v3/weather/daily.json?key=${API_KEY}&location=${encodeURIComponent(location)}&language=${language}&unit=${unit}&start=${start}&days=${days}`;
    
    // 发送请求到心知天气API
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    // 返回结果给客户端
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.ACCESS_CONTROL_ALLOW_ORIGIN || '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Weather API Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.ACCESS_CONTROL_ALLOW_ORIGIN || '*'
      },
      body: JSON.stringify({
        error: '获取天气数据失败',
        details: error.message
      })
    };
  }
};
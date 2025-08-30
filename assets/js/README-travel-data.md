# 旅游数据处理模块使用说明

## 功能介绍

`travel-data.js` 是一个用于从旅游页面中提取数据并为页面元素提供动态内容的JavaScript模块。它能够自动识别页面中的旅游目的地、行程日期和景点信息，并为不同类型的元素（如天气小部件、行程概览、景点卡片和地图）提供相关的数据绑定功能。

## 核心功能

1. **自动数据提取**
   - 从URL和页面内容中提取旅游目的地
   - 从行程概览中提取旅游日期
   - 从景点卡片中提取景点信息（名称、位置、分类、描述、图片、评分、开放时间、门票价格）

2. **元素类型识别**
   - 自动识别天气小部件、行程概览、景点卡片和地图元素
   - 为不同类型的元素提供相应的数据绑定逻辑

3. **动态内容更新**
   - 根据旅游目的地更新天气小部件的显示位置
   - 根据天气状况为行程添加建议
   - 根据季节和景点类型添加参观提示
   - 支持地图组件的数据更新

## 使用方法

### 基本使用

模块会在页面加载完成后自动初始化并为所有相关元素绑定数据：

```javascript
// 页面加载完成后，模块会自动执行以下操作
window.TravelData.initialize(); // 初始化旅游数据
window.TravelData.bindToAllElements(); // 为所有相关元素绑定数据
```

### 手动使用

您也可以手动控制模块的行为：

```javascript
// 初始化旅游数据
window.TravelData.initialize();

// 获取旅游数据
const destination = window.TravelData.getDestination(); // 获取目的地代码
const destinationName = window.TravelData.getDestinationDisplayName(); // 获取目的地显示名称
const dates = window.TravelData.getDates(); // 获取旅游日期
const attractions = window.TravelData.getAttractions(); // 获取景点列表

// 为特定元素绑定数据
const element = document.querySelector('.some-element');
window.TravelData.bindToElement(element, { /* 选项 */ });
```

## 支持的元素类型

1. **天气小部件 (weather-widget)**
   - 更新显示位置名称
   - 触发天气数据更新

2. **行程概览 (itinerary)**
   - 添加基于天气状况的行程建议

3. **景点卡片 (attraction-card)**
   - 添加基于季节和景点类型的参观提示

4. **地图 (map)**
   - 支持与地图组件集成，更新地图显示内容

## 测试功能

`test-travel-data.js` 文件提供了模块功能的测试，可以帮助您验证模块是否正常工作。测试脚本会在控制台输出模块的运行状态和数据提取结果。

## 扩展开发

如果您需要扩展模块功能，可以修改以下关键函数：

1. `extractDestination()`, `extractTravelDates()`, `extractAttractions()` - 用于提取页面数据
2. `bindTravelDataToElement()` - 用于为元素绑定数据
3. `updateWeatherWidget()`, `updateItinerary()`, `updateAttractionCard()`, `updateMap()` - 用于更新不同类型的元素

## 注意事项

1. 模块依赖于页面的特定结构，请确保您的旅游页面遵循类似的HTML结构
2. 模块会在页面加载完成后延迟执行，以确保所有组件都已加载完毕
3. 如果您的页面结构发生变化，可能需要调整数据提取函数

## 浏览器兼容性

模块使用了现代JavaScript特性，兼容所有主流浏览器（Chrome、Firefox、Safari、Edge）。
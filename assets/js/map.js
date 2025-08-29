/**
 * 旅游网站地图功能模块
 * 支持目的地展示、路线规划和景点导航
 */

/**
 * 地图实例
 */
let mapInstance = null;
let markers = [];
let polylines = [];

/**
 * 初始化地图
 * @param {string} containerId - 地图容器ID
 * @param {Object} options - 地图配置选项
 * @returns {AMap.Map|null} 地图实例
 */
function initMap(containerId = 'travel-map', options = {}) {
    // 检查是否已加载高德地图API
    if (!window.AMap) {
        console.error('高德地图API未加载，请先引入地图API脚本');
        return null;
    }
    
    // 查找地图容器
    const mapContainer = document.getElementById(containerId);
    if (!mapContainer) {
        console.warn(`未找到ID为${containerId}的地图容器`);
        return null;
    }
    
    // 默认配置
    const defaultOptions = {
        zoom: 12,
        center: [116.013, 24.294], // 梅州中心坐标
        mapStyle: 'amap://styles/light',
        features: ['road', 'point', 'bg'],
        plugins: ['ToolBar', 'Scale', 'OverView', 'Geocoder', 'PlaceSearch']
    };
    
    // 合并配置
    const mergedOptions = { ...defaultOptions, ...options };
    
    // 创建地图实例
    mapInstance = new AMap.Map(containerId, mergedOptions);
    
    // 添加控件 - 使用正确的插件加载方式
    if (mergedOptions.plugins.includes('ToolBar')) {
        AMap.plugin(['AMap.ToolBar'], function() {
            mapInstance.addControl(new AMap.ToolBar({
                position: 'RT',
                offset: new AMap.Pixel(10, 10)
            }));
        });
    }
    
    if (mergedOptions.plugins.includes('Scale')) {
        AMap.plugin(['AMap.Scale'], function() {
            mapInstance.addControl(new AMap.Scale({
                position: 'LB',
                offset: new AMap.Pixel(10, 10)
            }));
        });
    }
    
    if (mergedOptions.plugins.includes('OverView')) {
        AMap.plugin(['AMap.OverView'], function() {
            mapInstance.addControl(new AMap.OverView({
                visible: true,
                position: 'RB',
                offset: new AMap.Pixel(10, 10)
            }));
        });
    }
    
    console.log('地图功能已初始化');
    return mapInstance;
}

/**
 * 添加景点标记
 * @param {AMap.Map} map - 地图实例
 * @param {Array} attractions - 景点数组
 * @returns {Array} 标记数组
 */
function addAttractionMarkers(map, attractions) {
    if (!map || !Array.isArray(attractions)) {
        return [];
    }
    
    const newMarkers = [];
    
    attractions.forEach(attraction => {
        // 创建自定义标记内容
        const markerContent = document.createElement('div');
        markerContent.className = 'custom-marker';
        markerContent.style.width = '30px';
        markerContent.style.height = '30px';
        markerContent.style.backgroundColor = attraction.color || '#667eea';
        markerContent.style.borderRadius = '50%';
        markerContent.style.display = 'flex';
        markerContent.style.alignItems = 'center';
        markerContent.style.justifyContent = 'center';
        markerContent.style.color = 'white';
        markerContent.style.fontWeight = 'bold';
        markerContent.style.cursor = 'pointer';
        markerContent.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        markerContent.style.transition = 'all 0.3s ease';
        markerContent.innerHTML = `<i class="fas fa-map-marker-alt"></i>`;
        
        // 鼠标悬停效果
        markerContent.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.2)';
            this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        });
        
        markerContent.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
            this.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        });
        
        // 创建标记
        const marker = new AMap.Marker({
            position: new AMap.LngLat(attraction.lng, attraction.lat),
            content: markerContent,
            offset: new AMap.Pixel(-15, -15),
            extData: attraction // 存储景点数据
        });
        
        // 添加点击事件
        marker.on('click', function() {
            if (attraction.name && attraction.address) {
                showMessage(`${attraction.name}: ${attraction.address}`, 'info');
            }
        });
        
        // 添加到地图和标记数组
        map.add(marker);
        newMarkers.push(marker);
    });
    
    // 更新全局标记数组
    markers = [...markers, ...newMarkers];
    
    return newMarkers;
}

/**
 * 绘制路线
 * @param {AMap.Map} map - 地图实例
 * @param {Array} points - 路线点数组
 * @param {Object} options - 路线配置
 * @returns {AMap.Polyline} 路线对象
 */
function drawRoute(map, points, options = {}) {
    if (!map || !Array.isArray(points) || points.length < 2) {
        return null;
    }
    
    // 默认配置
    const defaultOptions = {
        strokeColor: '#667eea',
        strokeWeight: 5,
        strokeOpacity: 0.7,
        strokeStyle: 'solid',
        showDir: true,
        lineJoin: 'round'
    };
    
    // 合并配置
    const mergedOptions = { ...defaultOptions, ...options };
    
    // 转换点格式
    const lnglatPoints = points.map(point => new AMap.LngLat(point.lng, point.lat));
    
    // 创建路线
    const polyline = new AMap.Polyline({
        path: lnglatPoints,
        ...mergedOptions
    });
    
    // 添加到地图
    map.add(polyline);
    
    // 更新全局路线数组
    polylines.push(polyline);
    
    return polyline;
}

/**
 * 调整地图视野以显示所有标记和路线
 * @param {AMap.Map} map - 地图实例
 * @param {Array} markers - 标记数组
 * @param {Array} polylines - 路线数组
 * @param {number} padding - 边距
 */
function fitMapView(map, markers = [], polylines = [], padding = 50) {
    if (!map) return;
    
    const overlays = [...markers, ...polylines].filter(item => item);
    
    if (overlays.length > 0) {
        map.setFitView(overlays, false, [padding, padding, padding, padding]);
    }
}

/**
 * 清除所有标记
 * @param {AMap.Map} map - 地图实例
 */
function clearAllMarkers(map) {
    if (map && markers.length > 0) {
        map.remove(markers);
        markers = [];
    }
}

/**
 * 清除所有路线
 * @param {AMap.Map} map - 地图实例
 */
function clearAllRoutes(map) {
    if (map && polylines.length > 0) {
        map.remove(polylines);
        polylines = [];
    }
}

/**
 * 添加地图交互事件
 */
function addMapInteractions() {
    // 缩放功能（简单模拟）
    const mapContainer = document.getElementById('travel-map');
    if (!mapContainer) return;
    
    let scale = 1;
    const maxScale = 1.5;
    const minScale = 0.8;
    const scaleStep = 0.1;
    
    // 添加缩放按钮
    const zoomControls = document.createElement('div');
    zoomControls.className = 'map-zoom-controls';
    zoomControls.style.position = 'absolute';
    zoomControls.style.top = '20px';
    zoomControls.style.right = '20px';
    zoomControls.style.display = 'flex';
    zoomControls.style.flexDirection = 'column';
    zoomControls.style.gap = '5px';
    
    // 放大按钮
    const zoomIn = document.createElement('button');
    zoomIn.textContent = '+';
    zoomIn.style.width = '30px';
    zoomIn.style.height = '30px';
    zoomIn.style.border = 'none';
    zoomIn.style.borderRadius = '5px';
    zoomIn.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    zoomIn.style.cursor = 'pointer';
    zoomIn.style.fontWeight = 'bold';
    zoomIn.style.color = '#667eea';
    
    // 缩小按钮
    const zoomOut = document.createElement('button');
    zoomOut.textContent = '-';
    zoomOut.style.width = '30px';
    zoomOut.style.height = '30px';
    zoomOut.style.border = 'none';
    zoomOut.style.borderRadius = '5px';
    zoomOut.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    zoomOut.style.cursor = 'pointer';
    zoomOut.style.fontWeight = 'bold';
    zoomOut.style.color = '#667eea';
    
    // 添加点击事件
    zoomIn.addEventListener('click', function() {
        if (scale < maxScale) {
            scale += scaleStep;
            mapContainer.style.transform = `scale(${scale})`;
            mapContainer.style.transformOrigin = 'center center';
        }
    });
    
    zoomOut.addEventListener('click', function() {
        if (scale > minScale) {
            scale -= scaleStep;
            mapContainer.style.transform = `scale(${scale})`;
            mapContainer.style.transformOrigin = 'center center';
        }
    });
    
    // 添加到地图容器
    zoomControls.appendChild(zoomIn);
    zoomControls.appendChild(zoomOut);
    mapContainer.appendChild(zoomControls);
}

// 添加CSS动画
function addMapCSS() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% {
                transform: translate(-50%, -50%) scale(0.8);
                opacity: 1;
            }
            100% {
                transform: translate(-50%, -50%) scale(2);
                opacity: 0;
            }
        }
        
        .map-marker:hover {
            z-index: 20 !important;
        }
        
        .map-info-window a {
            text-decoration: none;
        }
    `;
    document.head.appendChild(style);
}

// 导出地图模块
window.TravelMap = {
    initMap,
    addAttractionMarkers,
    drawRoute,
    fitMapView,
    clearAllMarkers,
    clearAllRoutes,
    mapInstance: null,
    markers: [],
    polylines: []
};

// 监听景点数据变化
window.addEventListener('travelAttractionsLoaded', (event) => {
    const attractions = event.detail || [];
    if (attractions.length > 0 && window.TravelMap.mapInstance) {
        window.TravelMap.clearAllMarkers(window.TravelMap.mapInstance);
        window.TravelMap.addAttractionMarkers(window.TravelMap.mapInstance, attractions);
        window.TravelMap.fitMapView(window.TravelMap.mapInstance, window.TravelMap.markers);
    }
});

// DOM加载完成后初始化地图
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        addMapCSS();
        window.TravelMap.mapInstance = initMap();
        window.TravelMap.markers = markers;
        window.TravelMap.polylines = polylines;
        
        // 如果有景点数据，则添加标记
        const attractions = window.travelAttractions || [];
        if (attractions.length > 0 && window.TravelMap.mapInstance) {
            window.TravelMap.addAttractionMarkers(window.TravelMap.mapInstance, attractions);
            window.TravelMap.fitMapView(window.TravelMap.mapInstance, window.TravelMap.markers);
        }
    });
}
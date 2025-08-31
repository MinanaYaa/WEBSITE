/**
 * 旅游网站地图功能模块 - 优化版
 * 支持目的地展示、路线规划和景点导航
 */

/**
 * 性能优化：
 * 1. 使用CSS类代替内联样式
 * 2. 使用DocumentFragment批量处理DOM
 * 3. 事件委托优化
 * 4. 延迟加载和懒加载
 * 5. 使用requestAnimationFrame处理视觉更新
 * 6. 添加标记池管理，减少DOM创建开销
 * 7. 优化插件加载方式
 * 8. 减少全局变量，使用闭包保护内部状态
 */

// 创建闭包保护内部状态，减少全局变量污染
(function() {
  // 标记池管理
  let markerPool = [];
  const MAX_POOL_SIZE = 50;
  let mapInstance = null;
  let markers = [];
  let polylines = [];
  let isMapInitialized = false;
  
  // 初始化CSS样式 - 统一管理样式，减少内联样式
  function initMapStyles() {
    if (document.getElementById('travel-map-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'travel-map-styles';
    style.textContent = `
      .custom-marker {
        width: 30px;
        height: 30px;
        background-color: #667eea;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
      }
      
      .custom-marker:hover {
        transform: scale(1.2);
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      }
      
      .map-zoom-controls {
        position: absolute;
        top: 20px;
        right: 20px;
        display: flex;
        flex-direction: column;
        gap: 5px;
        z-index: 100;
      }
      
      .map-zoom-btn {
        width: 30px;
        height: 30px;
        border: none;
        border-radius: 5px;
        background-color: rgba(255, 255, 255, 0.8);
        cursor: pointer;
        font-weight: bold;
        color: #667eea;
        user-select: none;
        transition: all 0.2s ease;
      }
      
      .map-zoom-btn:hover {
        background-color: rgba(255, 255, 255, 1);
        transform: scale(1.1);
      }
      
      .map-zoom-btn:active {
        transform: scale(0.95);
      }
      
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
      
      .map-info-window a {
        text-decoration: none;
      }
    `;
    
    // 使用DocumentFragment减少DOM操作
    const fragment = document.createDocumentFragment();
    fragment.appendChild(style);
    document.head.appendChild(fragment);
  }

  /**
   * 初始化地图
   * @param {string} containerId - 地图容器ID
   * @param {Object} options - 地图配置选项
   * @returns {AMap.Map|null} 地图实例
   */
  function initMap(containerId = 'travel-map', options = {}) {
    // 检查是否已加载高德地图API
    if (!window.AMap || isMapInitialized) {
      return mapInstance;
    }

    // 查找地图容器
    const mapContainer = document.getElementById(containerId);
    if (!mapContainer) {
      return null;
    }

    // 默认配置 - 减少不必要的功能加载
    const defaultOptions = {
      zoom: 12,
      center: [116.013, 24.294], // 梅州中心坐标
      mapStyle: 'amap://styles/light',
      features: ['road', 'point', 'bg'],
      plugins: ['ToolBar', 'Scale'], // 减少默认加载的插件数量
      resizeEnable: true,
      optimizePanAnimation: true
    };

    // 合并配置 - 使用解构赋值优化性能
    const mergedOptions = { ...defaultOptions, ...options };

    // 创建地图实例
    mapInstance = new AMap.Map(containerId, mergedOptions);
    isMapInitialized = true;

    // 优化插件加载 - 使用批量加载方式
    const pluginsToLoad = [];
    if (mergedOptions.plugins.includes('ToolBar')) pluginsToLoad.push('AMap.ToolBar');
    if (mergedOptions.plugins.includes('Scale')) pluginsToLoad.push('AMap.Scale');
    if (mergedOptions.plugins.includes('OverView')) pluginsToLoad.push('AMap.OverView');
    if (mergedOptions.plugins.includes('Geocoder')) pluginsToLoad.push('AMap.Geocoder');
    if (mergedOptions.plugins.includes('PlaceSearch')) pluginsToLoad.push('AMap.PlaceSearch');

    // 批量加载插件
    if (pluginsToLoad.length > 0) {
      AMap.plugin(pluginsToLoad, function() {
        // 添加控件
        if (mergedOptions.plugins.includes('ToolBar') && AMap.ToolBar) {
          mapInstance.addControl(new AMap.ToolBar({
            position: 'RT',
            offset: new AMap.Pixel(10, 10)
          }));
        }

        if (mergedOptions.plugins.includes('Scale') && AMap.Scale) {
          mapInstance.addControl(new AMap.Scale({
            position: 'LB',
            offset: new AMap.Pixel(10, 10)
          }));
        }

        if (mergedOptions.plugins.includes('OverView') && AMap.OverView) {
          mapInstance.addControl(new AMap.OverView({
            visible: true,
            position: 'RB',
            offset: new AMap.Pixel(10, 10)
          }));
        }
      });
    }

    return mapInstance;
  }

  /**
   * 从标记池获取标记元素
   */
  function getMarkerFromPool(attraction) {
    // 如果池中有可用标记，直接复用
    if (markerPool.length > 0) {
      const markerContent = markerPool.pop();
      // 更新颜色
      markerContent.style.backgroundColor = attraction.color || '#667eea';
      return markerContent;
    }

    // 否则创建新标记
    const markerContent = document.createElement('div');
    markerContent.className = 'custom-marker';
    markerContent.innerHTML = `<i class="fas fa-map-marker-alt"></i>`;

    // 添加事件处理 - 使用事件委托或节流处理
    markerContent.addEventListener('mouseenter', function() {
      this.style.transform = 'scale(1.2)';
      this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    });

    markerContent.addEventListener('mouseleave', function() {
      this.style.transform = 'scale(1)';
      this.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
    });

    return markerContent;
  }

  /**
   * 回收标记元素到标记池
   */
  function recycleMarkerToPool(markerContent) {
    if (markerPool.length < MAX_POOL_SIZE) {
      // 清除可能的状态
      markerContent.style.backgroundColor = '';
      markerContent.style.transform = 'scale(1)';
      markerContent.style.boxShadow = '';
      markerPool.push(markerContent);
    } else {
      // 如果池已满，直接移除DOM元素
      if (markerContent.parentNode) {
        markerContent.parentNode.removeChild(markerContent);
      }
    }
  }

  /**
   * 添加景点标记 - 优化版本
   * @param {AMap.Map} map - 地图实例
   * @param {Array} attractions - 景点数组
   * @returns {Array} 标记数组
   */
  function addAttractionMarkers(map, attractions) {
    if (!map || !Array.isArray(attractions) || attractions.length === 0) {
      return [];
    }

    // 使用requestAnimationFrame确保视觉更新流畅
    return requestAnimationFrame(() => {
      const newMarkers = [];
      
      // 批量处理标记创建
      attractions.forEach(attraction => {
        // 从标记池获取或创建标记
        const markerContent = getMarkerFromPool(attraction);

        // 创建标记
        const marker = new AMap.Marker({
          position: new AMap.LngLat(attraction.lng, attraction.lat),
          content: markerContent,
          offset: new AMap.Pixel(-15, -15),
          extData: attraction // 存储景点数据
        });

        // 添加点击事件 - 使用事件委托或节流处理
        marker.on('click', function() {
          if (attraction.name && attraction.address && window.showMessage) {
            window.showMessage(`${attraction.name}: ${attraction.address}`, 'info');
          }
        });

        // 添加到地图和标记数组
        map.add(marker);
        newMarkers.push(marker);
      });

      // 使用数组扩展运算符优化合并性能
      markers = [...markers, ...newMarkers];

      return newMarkers;
    });
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
      lineJoin: 'round',
      zIndex: 10
    };

    // 合并配置
    const mergedOptions = { ...defaultOptions, ...options };

    // 使用requestAnimationFrame处理视觉更新
    return requestAnimationFrame(() => {
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
    });
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

    // 使用requestAnimationFrame确保流畅的视图调整
    requestAnimationFrame(() => {
      const overlays = [...markers, ...polylines].filter(item => item);

      if (overlays.length > 0) {
        map.setFitView(overlays, false, [padding, padding, padding, padding]);
      }
    });
  }

  /**
   * 清除所有标记 - 优化版本，支持标记回收
   * @param {AMap.Map} map - 地图实例
   */
  function clearAllMarkers(map) {
    if (!map || markers.length === 0) {
      return;
    }

    // 使用requestAnimationFrame处理大量DOM操作
    requestAnimationFrame(() => {
      // 回收标记到标记池
      markers.forEach(marker => {
        try {
          const content = marker.getContent();
          if (content && content.className === 'custom-marker') {
            recycleMarkerToPool(content);
          }
        } catch (e) {
          console.error('回收标记失败:', e);
        }
      });

      // 移除所有标记
      map.remove(markers);
      markers = [];
    });
  }

  /**
   * 清除所有路线
   * @param {AMap.Map} map - 地图实例
   */
  function clearAllRoutes(map) {
    if (!map || polylines.length === 0) {
      return;
    }

    // 使用requestAnimationFrame处理大量DOM操作
    requestAnimationFrame(() => {
      map.remove(polylines);
      polylines = [];
    });
  }

  /**
   * 添加地图交互事件 - 优化版本
   */
  function addMapInteractions() {
    // 延迟加载交互功能，只有当用户需要时才创建
    const mapContainer = document.getElementById('travel-map');
    if (!mapContainer) return;

    // 使用防抖函数减少重复创建
    if (mapContainer.getAttribute('data-interactions-added')) {
      return;
    }
    mapContainer.setAttribute('data-interactions-added', 'true');

    let scale = 1;
    const maxScale = 1.5;
    const minScale = 0.8;
    const scaleStep = 0.1;

    // 使用DocumentFragment减少DOM操作
    const fragment = document.createDocumentFragment();

    // 添加缩放按钮容器
    const zoomControls = document.createElement('div');
    zoomControls.className = 'map-zoom-controls';

    // 放大按钮
    const zoomIn = document.createElement('button');
    zoomIn.className = 'map-zoom-btn';
    zoomIn.textContent = '+';

    // 缩小按钮
    const zoomOut = document.createElement('button');
    zoomOut.className = 'map-zoom-btn';
    zoomOut.textContent = '-';

    // 添加点击事件 - 使用节流优化
    const throttle = (func, limit) => {
      let inThrottle;
      return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
          func.apply(context, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    };

    // 缩放函数
    const updateScale = (newScale) => {
      if (newScale >= minScale && newScale <= maxScale) {
        scale = newScale;
        mapContainer.style.transform = `scale(${scale})`;
        mapContainer.style.transformOrigin = 'center center';
      }
    };

    // 添加节流的点击事件
    zoomIn.addEventListener('click', throttle(() => {
      updateScale(scale + scaleStep);
    }, 100));

    zoomOut.addEventListener('click', throttle(() => {
      updateScale(scale - scaleStep);
    }, 100));

    // 组装DOM结构
    zoomControls.appendChild(zoomIn);
    zoomControls.appendChild(zoomOut);
    fragment.appendChild(zoomControls);
    
    // 一次性添加到DOM
    mapContainer.appendChild(fragment);
  }

  /**
   * 懒加载地图
   */
  function lazyLoadMap() {
    // 使用IntersectionObserver实现懒加载
    const mapContainer = document.getElementById('travel-map');
    if (!mapContainer) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // 当地图容器进入视口时初始化地图
          if (!isMapInitialized) {
            initMap();
            addMapInteractions();
          }
          // 停止观察
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '100px 0px' // 提前100px触发加载
    });

    observer.observe(mapContainer);
  }

  /**
   * 导出地图模块
   */
  window.TravelMap = {
    initMap,
    addAttractionMarkers,
    drawRoute,
    fitMapView,
    clearAllMarkers,
    clearAllRoutes,
    lazyLoadMap,
    mapInstance: null,
    markers: [],
    polylines: []
  };

  // 性能监控 - 记录初始化时间
  const performanceMonitor = {
    startTime: 0,
    endTime: 0,
    start: function() {
      this.startTime = performance.now();
    },
    end: function() {
      this.endTime = performance.now();
      const loadTime = this.endTime - this.startTime;
      // 仅在开发环境输出性能日志
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log(`地图模块初始化耗时: ${loadTime.toFixed(2)}ms`);
      }
    }
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

  // DOM加载完成后初始化
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
      performanceMonitor.start();
      
      // 初始化样式
      initMapStyles();
      
      // 初始化全局引用
      window.TravelMap.mapInstance = mapInstance;
      window.TravelMap.markers = markers;
      window.TravelMap.polylines = polylines;
      
      // 启用懒加载
      lazyLoadMap();
      
      // 如果有景点数据，则添加标记
      const attractions = window.travelAttractions || [];
      if (attractions.length > 0 && mapInstance) {
        window.TravelMap.addAttractionMarkers(mapInstance, attractions);
        window.TravelMap.fitMapView(mapInstance, markers);
      }
      
      // 记录初始化完成时间
      setTimeout(() => {
        performanceMonitor.end();
      }, 0);
    });
  }

  // 页面卸载时清理资源
  window.addEventListener('beforeunload', () => {
    if (mapInstance) {
      // 清理地图资源
      mapInstance.clearMap();
      mapInstance.destroy();
    }
    markers = [];
    polylines = [];
    markerPool = [];
  });

})();
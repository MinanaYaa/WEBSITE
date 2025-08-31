// 旅游数据处理模块 - 性能优化版
(function () {
    // 存储全局旅游数据
    const travelData = {
        destination: '',
        dates: [],
        attractions: [],
        initialized: false
    };

    // DOM缓存，避免重复查询
    const domCache = {};

    // 数据缓存
    const dataCache = {};

    // 获取DOM元素的缓存版本
    function getElement(selector, single = false) {
        if (!domCache[selector]) {
            domCache[selector] = single
                ? document.querySelector(selector)
                : document.querySelectorAll(selector);
        }
        return domCache[selector];
    };

    /**
     * 从页面中提取旅游目的地信息
     * @returns {string} 旅游目的地代码
     */
    function extractDestination() {
        // 从URL中检测目的地
        const currentUrl = window.location.href;
        if (currentUrl.includes('meizhou')) return 'meizhou';
        if (currentUrl.includes('suzhou')) return 'suzhou';
        if (currentUrl.includes('chengdu')) return 'chengdu';
        if (currentUrl.includes('beijing')) return 'beijing';
        if (currentUrl.includes('shanghai')) return 'shanghai';
        return 'unknown';
    }

    /**
     * 从页面中提取旅游日期信息
     * @returns {Array} 日期数组
     */
    function extractTravelDates() {
        const dates = [];
        const dayHeaders = document.querySelectorAll('#overview h3');

        dayHeaders.forEach(header => {
            const text = header.textContent;
            const dateMatch = text.match(/(\d+月\d+日)/);
            if (dateMatch && dateMatch[1]) {
                dates.push(dateMatch[1]);
            }
        });

        return dates;
    }

    /**
     * 从页面中提取景点信息
     * @returns {Array} 景点数组
     */
    function extractAttractions() {
        // 检查缓存
        if (dataCache.attractions) {
            return dataCache.attractions;
        }

        const attractions = [];
        const attractionCards = getElement('.attraction-card');

        // 使用性能更优的for循环而非forEach
        for (let i = 0; i < attractionCards.length; i++) {
            const card = attractionCards[i];
            // 一次性获取所有需要的子元素
            const titleEl = card.querySelector('.attraction-title');
            const locationEl = card.querySelector('.attraction-location span');
            const categoryEl = card.querySelector('.attraction-category span');
            const descEl = card.querySelector('.attraction-description');
            const imgEl = card.querySelector('.attraction-image');
            const ratingEl = card.querySelector('.rating-score');

            // 使用更高效的选择器
            const openTimeElement = card.querySelector('.info-item i.fa-clock')?.nextElementSibling;
            const ticketElement = card.querySelector('.info-item i.fa-ticket-alt')?.nextElementSibling;

            // 提取数据
            attractions.push({
                id: i + 1,
                name: titleEl?.textContent || '',
                location: locationEl?.textContent || '',
                category: categoryEl?.textContent || '',
                description: descEl?.textContent || '',
                image: imgEl?.src || '',
                rating: ratingEl ? parseFloat(ratingEl.textContent) : 0,
                openTime: openTimeElement ? openTimeElement.textContent.replace('开放时间: ', '') : '',
                ticketPrice: ticketElement ? ticketElement.textContent.replace('门票: ', '') : ''
            });
        }

        // 缓存结果
        dataCache.attractions = attractions;
        return attractions;
    }

    /**
     * 初始化旅游数据
     */
    function initializeTravelData() {
        if (travelData.initialized) return;

        travelData.destination = extractDestination();
        travelData.dates = extractTravelDates();
        travelData.attractions = extractAttractions();
        travelData.initialized = true;
    }

    /**
     * 获取当前旅游目的地的显示名称
     * @returns {string} 目的地显示名称
     */
    function getDestinationDisplayName() {
        const locationMap = {
            'meizhou': '梅州',
            'suzhou': '苏州',
            'chengdu': '成都',
            'beijing': '北京',
            'shanghai': '上海',
            'unknown': '未知目的地'
        };

        return locationMap[travelData.destination] || '未知目的地';
    }

    /**
     * 为元素绑定旅游数据
     * @param {HTMLElement} element - 需要绑定数据的元素
     * @param {Object} options - 绑定选项
     */
    function bindTravelDataToElement(element, options = {}) {
        initializeTravelData();

        // 确定元素类型
        const elementType = getElementType(element);

        // 使用数据缓存避免重复计算
        const cacheKey = `${elementType}_${element.dataset.id || ''}`;
        if (dataCache[cacheKey]) {
            return dataCache[cacheKey];
        }

        switch (elementType) {
            case 'weather-widget':
                dataCache[cacheKey] = updateWeatherWidget(element, options);
                break;
            case 'itinerary':
                dataCache[cacheKey] = updateItinerary(element, options);
                break;
            case 'attraction-card':
                dataCache[cacheKey] = updateAttractionCard(element, options);
                break;
            case 'map':
                dataCache[cacheKey] = updateMap(element, options);
                break;
            default:
            // 静默处理未知元素类型
        }

        return dataCache[cacheKey];
    }

    /**
     * 确定元素类型
     * @param {HTMLElement} element - 要检查的元素
     * @returns {string} 元素类型
     */
    function getElementType(element) {
        // 使用classList.contains比closest性能更好
        if (element.classList.contains('weather-widget')) {
            return 'weather-widget';
        }

        if (element.closest('#overview')) {
            return 'itinerary';
        }

        if (element.classList.contains('attraction-card')) {
            return 'attraction-card';
        }

        if (element.id === 'mapContainer') {
            return 'map';
        }

        // 作为最后的检查
        if (element.closest('.weather-widget')) {
            return 'weather-widget';
        } else if (element.closest('.attraction-card')) {
            return 'attraction-card';
        } else if (element.closest('#map')) {
            return 'map';
        }

        return 'unknown';
    }

    /**
     * 更新天气小部件
     * @param {HTMLElement} element - 天气小部件元素
     * @param {Object} options - 更新选项
     */
    function updateWeatherWidget(element, options) {
        const locationElement = element.querySelector('#current-location');
        if (locationElement) {
            locationElement.textContent = getDestinationDisplayName();
        }

        // 如果有天气模块，调用它更新天气数据
        if (typeof updateWeatherData === 'function') {
            updateWeatherData(travelData.destination);
        }
    }

    /**
     * 更新行程概览
     * @param {HTMLElement} element - 行程概览元素
     * @param {Object} options - 更新选项
     */
    function updateItinerary(element, options) {
        // 获取当前天气数据
        const currentWeatherData = getCurrentWeatherData();

        if (currentWeatherData) {
            // 添加天气相关建议
            // 使用文档片段减少DOM操作次数
            const fragment = document.createDocumentFragment();

            let weatherAdvice = '';
            if (currentWeatherData.desc.includes('雨')) {
                weatherAdvice = '今日有雨，建议携带雨具，注意防滑。';
            } else if (parseInt(currentWeatherData.temp) > 30) {
                weatherAdvice = '今日气温较高，请注意防晒和补水。';
            } else if (parseInt(currentWeatherData.temp) < 10) {
                weatherAdvice = '今日气温较低，请注意保暖。';
            } else {
                weatherAdvice = '今日天气适宜出行，祝您旅途愉快！';
            }

            // 添加到每个行程日
            const dayContainers = element.querySelectorAll('.rounded-lg.shadow-md.overflow-hidden');
            dayContainers.forEach(container => {
                const dayContent = container.querySelector('.p-6');
                if (dayContent && !dayContent.querySelector('.weather-note')) {
                    // 为每个容器创建独立的元素，避免克隆操作
                    const weatherNote = document.createElement('div');
                    weatherNote.className = 'weather-note p-3 bg-blue-50 border-l-4 border-blue-500 rounded mt-4';
                    weatherNote.innerHTML = `<p class="text-sm text-blue-700"><i class="fas fa-info-circle mr-1"></i> ${weatherAdvice}</p>`;
                    fragment.appendChild(weatherNote);
                }
            });

            // 只进行一次DOM操作
            if (fragment.firstChild) {
                // 找到第一个合适的位置插入片段
                const firstDayContent = element.querySelector('.rounded-lg.shadow-md.overflow-hidden .p-6');
                if (firstDayContent && !firstDayContent.querySelector('.weather-note')) {
                    firstDayContent.appendChild(fragment);
                }
            }
        }

        return true;
    }

    /**
     * 更新景点卡片
     * @param {HTMLElement} element - 景点卡片元素
     * @param {Object} options - 更新选项
     */
    function updateAttractionCard(element, options) {
        // 检查是否已经添加过提示信息
        if (element.querySelector('.season-tip')) {
            return true;
        }

        const attractionName = element.querySelector('.attraction-title')?.textContent;
        if (attractionName) {
            const seasonTip = document.createElement('div');
            seasonTip.className = 'season-tip mt-2 text-xs text-gray-500';

            let tipText = '';
            const currentMonth = new Date().getMonth() + 1;

            // 使用switch-case代替多次if-else，提高可读性和性能
            if (attractionName.includes('瀑布') || attractionName.includes('水')) {
                // 使用更高效的范围检查
                tipText = (currentMonth >= 4 && currentMonth <= 9)
                    ? '当前是丰水期，水景最佳。'
                    : '当前是枯水期，水量可能较少。';
            } else if (attractionName.includes('博物馆')) {
                tipText = '建议参观时间1-2小时，可提前查看是否需要预约。';
            } else if (attractionName.includes('街区')) {
                tipText = '傍晚时分游览体验更佳，可以品尝当地特色小吃。';
            }

            if (tipText) {
                seasonTip.textContent = tipText;
                const actionsDiv = element.querySelector('.attraction-actions');
                if (actionsDiv) {
                    actionsDiv.parentNode.insertBefore(seasonTip, actionsDiv);
                }
            }
        }

        return true;
    }

    /**
     * 更新地图
     * @param {HTMLElement} element - 地图元素
     * @param {Object} options - 更新选项
     */
    function updateMap(element, options) {
        // 如果地图模块已加载，可以根据旅游数据更新地图
        if (window.TravelMap && window.TravelMap.updateMapWithTravelData) {
            window.TravelMap.updateMapWithTravelData(element, travelData);
        }
    }

    /**
     * 获取当前天气数据
     * @returns {Object|null} 天气数据对象或null
     */
    function getCurrentWeatherData() {
        // 检查缓存
        if (dataCache.currentWeatherData && Date.now() - dataCache.weatherCacheTime < 300000) { // 5分钟缓存
            return dataCache.currentWeatherData;
        }

        // 如果有WeatherWidget模块，优先从模块获取数据
        if (window.WeatherWidget && window.WeatherWidget.getCurrentWeatherData) {
            const weatherData = window.WeatherWidget.getCurrentWeatherData();
            if (weatherData) {
                dataCache.currentWeatherData = weatherData;
                dataCache.weatherCacheTime = Date.now();
                return weatherData;
            }
        }

        // 备选方案：从DOM获取数据
        const weatherTemp = getElement('.weather-temp', true)?.textContent;
        const weatherDesc = getElement('.weather-desc', true)?.textContent;

        if (weatherTemp && weatherDesc) {
            const weatherData = {
                temp: weatherTemp,
                desc: weatherDesc
            };

            // 缓存数据
            dataCache.currentWeatherData = weatherData;
            dataCache.weatherCacheTime = Date.now();
            return weatherData;
        }

        return null;
    }

    /**
     * 为所有相关div元素绑定旅游数据
     */
    function bindTravelDataToAllElements() {
        initializeTravelData();

        // 使用requestAnimationFrame批量处理DOM操作
        requestAnimationFrame(() => {
            // 使用文档片段进行批量操作
            const fragment = document.createDocumentFragment();

            // 为天气小部件绑定数据
            const weatherWidget = getElement('.weather-widget', true);
            if (weatherWidget) {
                bindTravelDataToElement(weatherWidget);
            }

            // 为行程概览绑定数据
            const itinerary = document.getElementById('overview');
            if (itinerary) {
                bindTravelDataToElement(itinerary);
            }

            // 为所有景点卡片绑定数据 - 使用更高效的方法
            // 创建一个代理容器来批量处理更新
            const tempContainer = document.createElement('div');
            const attractionCards = getElement('.attraction-card');

            for (let i = 0; i < attractionCards.length; i++) {
                const card = attractionCards[i];
                bindTravelDataToElement(card);
            }

            // 为地图绑定数据
            const mapContainer = document.getElementById('mapContainer');
            if (mapContainer) {
                bindTravelDataToElement(mapContainer);
            }

            // 一次性应用所有DOM更新
            if (fragment.firstChild) {
                document.body.appendChild(fragment);
            }
        });
    }

    /**
     * 智能等待组件加载完成
     * @param {function} callback - 回调函数
     * @param {number} maxWaitTime - 最大等待时间（毫秒）
     */
    function waitForComponents(callback, maxWaitTime = 5000) {
        let checkInterval = 100;
        let elapsedTime = 0;

        const checkComponents = () => {
            // 检查关键组件是否已加载
            const hasWeatherWidget = !!getElement('.weather-widget', true);
            const hasOverview = !!document.getElementById('overview');
            const hasAttractionCards = getElement('.attraction-card').length > 0;

            if (hasWeatherWidget && hasOverview && hasAttractionCards) {
                callback();
                return;
            }

            elapsedTime += checkInterval;
            if (elapsedTime >= maxWaitTime) {
                // 即使组件未完全加载，也执行回调
                callback();
                return;
            }

            // 增加检查间隔，减少CPU消耗
            checkInterval = Math.min(checkInterval * 1.5, 500);
            setTimeout(checkComponents, checkInterval);
        };

        checkComponents();
    }

    // 暴露公共API
    window.TravelData = {
        initialize: initializeTravelData,
        bindToElement: bindTravelDataToElement,
        bindToAllElements: bindTravelDataToAllElements,
        waitForComponents: waitForComponents,
        getDestination: () => travelData.destination,
        getDates: () => travelData.dates,
        getAttractions: () => travelData.attractions,
        getDestinationDisplayName: getDestinationDisplayName,
        // 清除缓存的方法，用于调试或特殊场景
        clearCache: () => {
            domCache = {};
            dataCache = {};
        }
    };

    // 页面加载完成后自动初始化
    document.addEventListener('DOMContentLoaded', function () {
        // 使用智能等待替代固定延迟，提高加载效率
        waitForComponents(bindTravelDataToAllElements);
    });
})();
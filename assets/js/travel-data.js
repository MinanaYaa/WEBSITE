// 旅游数据处理模块
(function() {
    // 存储全局旅游数据
    const travelData = {
        destination: '',
        dates: [],
        attractions: [],
        initialized: false
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
        const attractions = [];
        const attractionCards = document.querySelectorAll('.attraction-card');
        
        attractionCards.forEach((card, index) => {
            const title = card.querySelector('.attraction-title')?.textContent || '';
            const location = card.querySelector('.attraction-location span')?.textContent || '';
            const category = card.querySelector('.attraction-category span')?.textContent || '';
            const description = card.querySelector('.attraction-description')?.textContent || '';
            const image = card.querySelector('.attraction-image')?.src || '';
            const rating = card.querySelector('.rating-score')?.textContent || '0';
            
            const openTimeElement = card.querySelector('.info-item:has(.fa-clock) span');
            const openTime = openTimeElement ? openTimeElement.textContent.replace('开放时间: ', '') : '';
            
            const ticketElement = card.querySelector('.info-item:has(.fa-ticket-alt) span');
            const ticketPrice = ticketElement ? ticketElement.textContent.replace('门票: ', '') : '';
            
            attractions.push({
                id: index + 1,
                name: title,
                location: location,
                category: category,
                description: description,
                image: image,
                rating: parseFloat(rating),
                openTime: openTime,
                ticketPrice: ticketPrice
            });
        });
        
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
        
        console.log('旅游数据初始化完成:', travelData);
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
        
        switch (elementType) {
            case 'weather-widget':
                updateWeatherWidget(element, options);
                break;
            case 'itinerary':
                updateItinerary(element, options);
                break;
            case 'attraction-card':
                updateAttractionCard(element, options);
                break;
            case 'map':
                updateMap(element, options);
                break;
            default:
                console.warn('未知元素类型，无法绑定旅游数据');
        }
    }

    /**
     * 确定元素类型
     * @param {HTMLElement} element - 要检查的元素
     * @returns {string} 元素类型
     */
    function getElementType(element) {
        if (element.classList.contains('weather-widget') || 
            element.closest('.weather-widget')) {
            return 'weather-widget';
        }
        
        if (element.closest('#overview')) {
            return 'itinerary';
        }
        
        if (element.classList.contains('attraction-card') || 
            element.closest('.attraction-card')) {
            return 'attraction-card';
        }
        
        if (element.id === 'mapContainer' || 
            element.closest('#map')) {
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
        // 这里可以根据旅游日期和目的地更新行程信息
        // 例如，可以添加根据天气状况的行程建议
        
        // 获取当前天气数据
        const currentWeatherData = getCurrentWeatherData();
        
        if (currentWeatherData) {
            // 添加天气相关建议
            const weatherNote = document.createElement('div');
            weatherNote.className = 'weather-note p-3 bg-blue-50 border-l-4 border-blue-500 rounded mt-4';
            
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
            
            weatherNote.innerHTML = `<p class="text-sm text-blue-700"><i class="fas fa-info-circle mr-1"></i> ${weatherAdvice}</p>`;
            
            // 添加到每个行程日
            const dayContainers = element.querySelectorAll('.rounded-lg.shadow-md.overflow-hidden');
            dayContainers.forEach(container => {
                const dayContent = container.querySelector('.p-6');
                if (dayContent && !dayContent.querySelector('.weather-note')) {
                    dayContent.appendChild(weatherNote.cloneNode(true));
                }
            });
        }
    }

    /**
     * 更新景点卡片
     * @param {HTMLElement} element - 景点卡片元素
     * @param {Object} options - 更新选项
     */
    function updateAttractionCard(element, options) {
        // 这里可以根据目的地和日期更新景点信息
        // 例如，根据季节添加参观建议
        
        const attractionName = element.querySelector('.attraction-title')?.textContent;
        if (attractionName) {
            const seasonTip = document.createElement('div');
            seasonTip.className = 'season-tip mt-2 text-xs text-gray-500';
            
            let tipText = '';
            const currentMonth = new Date().getMonth() + 1;
            
            if (attractionName.includes('瀑布') || attractionName.includes('水')) {
                if ([4, 5, 6, 7, 8, 9].includes(currentMonth)) {
                    tipText = '当前是丰水期，水景最佳。';
                } else {
                    tipText = '当前是枯水期，水量可能较少。';
                }
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
        // 如果天气小部件已加载，尝试获取当前天气数据
        // 这里是一个简化实现，实际应该从天气模块获取数据
        const weatherTemp = document.querySelector('.weather-temp')?.textContent;
        const weatherDesc = document.querySelector('.weather-desc')?.textContent;
        
        if (weatherTemp && weatherDesc) {
            return {
                temp: weatherTemp,
                desc: weatherDesc
            };
        }
        
        return null;
    }

    /**
     * 为所有相关div元素绑定旅游数据
     */
    function bindTravelDataToAllElements() {
        initializeTravelData();
        
        // 为天气小部件绑定数据
        const weatherWidget = document.querySelector('.weather-widget');
        if (weatherWidget) {
            bindTravelDataToElement(weatherWidget);
        }
        
        // 为行程概览绑定数据
        const itinerary = document.getElementById('overview');
        if (itinerary) {
            bindTravelDataToElement(itinerary);
        }
        
        // 为所有景点卡片绑定数据
        document.querySelectorAll('.attraction-card').forEach(card => {
            bindTravelDataToElement(card);
        });
        
        // 为地图绑定数据
        const mapContainer = document.getElementById('mapContainer');
        if (mapContainer) {
            bindTravelDataToElement(mapContainer);
        }
    }

    // 暴露公共API
    window.TravelData = {
        initialize: initializeTravelData,
        bindToElement: bindTravelDataToElement,
        bindToAllElements: bindTravelDataToAllElements,
        getDestination: () => travelData.destination,
        getDates: () => travelData.dates,
        getAttractions: () => travelData.attractions,
        getDestinationDisplayName: getDestinationDisplayName
    };

    // 页面加载完成后自动初始化
    document.addEventListener('DOMContentLoaded', function() {
        // 等待组件加载完成
        setTimeout(bindTravelDataToAllElements, 1000);
    });
})();
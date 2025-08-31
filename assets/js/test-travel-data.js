// 旅游数据处理模块测试脚本
(function () {
    // 性能监控 - 记录开始时间
    const startTime = performance.now();

    // DOM元素缓存 - 一次性查询所有需要的元素
    const getElements = function () {
        return {
            weatherWidget: document.querySelector('.weather-widget'),
            itinerary: document.getElementById('overview'),
            attractionCard: document.querySelector('.attraction-card'),
            mapContainer: document.getElementById('mapContainer')
        };
    };

    // 数据验证函数
    const validateTravelData = function (travelData) {
        const destination = travelData.getDestination();
        const dates = travelData.getDates();
        const attractions = travelData.getAttractions();

        // 合并条件检查，减少判断次数
        const isDestinationValid = destination && destination !== 'unknown';
        const isDatesValid = Array.isArray(dates) && dates.length > 0;
        const isAttractionsValid = Array.isArray(attractions) && attractions.length > 0;

        return {
            isValid: isDestinationValid && isDatesValid && isAttractionsValid,
            destination, dates, attractions
        };
    };

    // 元素数据绑定函数
    const bindDataToElements = function (travelData, elements) {
        // 使用对象映射替代多个if条件
        const elementsToBind = [
            { element: elements.weatherWidget, shouldBind: !!elements.weatherWidget },
            { element: elements.itinerary, shouldBind: !!elements.itinerary },
            { element: elements.attractionCard, shouldBind: !!elements.attractionCard },
            { element: elements.mapContainer, shouldBind: !!elements.mapContainer }
        ];

        // 批量绑定数据
        elementsToBind.forEach(item => {
            if (item.shouldBind) {
                travelData.bindToElement(item.element);
            }
        });
    };

    // 主测试函数
    const runTravelDataTests = function () {
        try {
            // 移除不必要的延迟，直接检查TravelData对象
            if (window.TravelData) {
                // 初始化旅游数据
                window.TravelData.initialize();

                // 获取DOM元素
                const elements = getElements();

                // 验证数据
                const validationResult = validateTravelData(window.TravelData);

                // 绑定数据到元素
                bindDataToElements(window.TravelData, elements);

                // 性能监控 - 记录完成时间
                const endTime = performance.now();

                // 用于内部性能分析的标记（不产生控制台输出）
                if (window.__perfMonitoring) {
                    window.__perfMonitoring.travelDataTestTime = endTime - startTime;
                }
            }
        } catch (error) {
            // 静默错误处理，避免影响用户体验
            // 可选择在开发模式下启用错误日志
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                // 开发环境下可以添加调试信息
            }
        }
    };

    // 智能等待机制 - 检查模块是否已加载
    const checkModuleAndExecute = function (moduleName, callback, maxAttempts = 5, delay = 300) {
        let attempts = 0;

        const check = function () {
            attempts++;

            if (window[moduleName]) {
                callback();
            } else if (attempts < maxAttempts) {
                setTimeout(check, delay);
            }
        };

        check();
    };

    // 使用requestAnimationFrame确保在DOM完全渲染后执行
    document.addEventListener('DOMContentLoaded', function () {
        requestAnimationFrame(function () {
            // 使用智能等待机制等待TravelData模块加载
            checkModuleAndExecute('TravelData', runTravelDataTests);
        });
    });
})();
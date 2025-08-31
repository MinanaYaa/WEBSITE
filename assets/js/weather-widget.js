/**
 * 天气小部件模块 - 提供天气数据获取和UI更新功能
 */
const WeatherWidget = {
    /**
     * 初始化天气小部件
     */
    init: function () {

        this.waitForTravelData().then(travelDataModule => {

            this.initializeWidget(travelDataModule);
        });
    },

    /**
 * 等待TravelData模块加载完成 - 优化版本
 */
    waitForTravelData: function () {

        return new Promise(resolve => {
            // 立即尝试一次，避免不必要的延迟
            if (window.TravelData && window.TravelData.destination && window.TravelData.destination.latitude && window.TravelData.destination.longitude) {

                resolve(window.TravelData);
                return;
            }

            // 设置最大等待时间（5秒 - 减少等待时间）
            const maxWaitTime = 5000;
            // 设置轮询间隔（逐步增加 - 减少CPU消耗）
            let pollInterval = 100;
            // 记录已经等待的时间
            let elapsedTime = 0;

            const poll = () => {
                if (window.TravelData) {

                    resolve(window.TravelData);
                    return;
                }

                // 如果超过最大等待时间
                if (elapsedTime >= maxWaitTime) {
                    clearInterval(interval);

                    resolve(null);
                    return;
                }

                // 增加已等待时间
                elapsedTime += pollInterval;
                // 逐步增加轮询间隔，减少CPU消耗
                pollInterval = Math.min(pollInterval * 1.5, 500);
            };

            const interval = setInterval(poll, pollInterval);

            // 设置超时
            setTimeout(() => {
                clearInterval(interval);
                if (!window.TravelData) {

                    resolve(null);
                }
            }, maxWaitTime);
        });
    },

    /**
     * 初始化天气小部件 - 使用TravelData模块或默认初始化
     */
    initializeWidget: function (travelDataModule) {
        // 获取天气小部件元素
        const weatherWidget = document.querySelector('.weather-widget');

        if (travelDataModule && weatherWidget) {

            // 使用TravelData模块初始化和绑定数据
            travelDataModule.initialize();
            travelDataModule.bindToElement(weatherWidget);

            // 获取目的地信息
            const destination = travelDataModule.getDestination();
            const destinationName = travelDataModule.getDestinationDisplayName();


            // 如果有目的地信息，则获取天气数据
            if (destination && destination !== 'unknown') {
                // 更新显示的城市名称
                const locationNameElement = document.getElementById('current-location');
                if (locationNameElement) {
                    locationNameElement.textContent = destinationName;
                }

                // 尝试从心知天气API获取天气数据

                this.fetchWeatherDataFromXinzhiAPI(destinationName);
            } else {

                // 使用默认的位置显示和数据获取
                this.defaultInit();
            }
        } else {
            // 使用默认的位置显示和数据获取
            this.defaultInit();
        }
    },

    /**
     * 默认初始化（当TravelData模块不可用时）
     */
    defaultInit: function () {
        // 获取默认位置或用户选择的位置
        const locationSelector = document.getElementById('weather-location');
        let selectedLocation = locationSelector ? locationSelector.value : '';

        // 直接更新显示的城市名称
        const locationNameElement = document.getElementById('current-location');
        if (locationNameElement) {
            locationNameElement.textContent = selectedLocation || '-';
        }

        // 尝试从心知天气API获取天气数据
        this.fetchWeatherDataFromXinzhiAPI(selectedLocation);

        // 添加位置变更监听
        if (locationSelector) {
            locationSelector.addEventListener('change', function () {
                selectedLocation = this.value;

                // 更新显示的城市名称
                if (locationNameElement) {
                    locationNameElement.textContent = selectedLocation || '-';
                }

                // 重新获取天气数据
                this.fetchWeatherDataFromXinzhiAPI(selectedLocation);
            });
        }
    },

    /**
 * 从心知天气API获取天气数据 - 优化版本，添加缓存机制
 */
    fetchWeatherDataFromXinzhiAPI: function (location) {
        // 生成缓存键
        const cacheKey = `weather_${location}`;
        // 检查本地缓存（有效期15分钟）
        const cachedData = localStorage.getItem(cacheKey);
        const cacheTime = localStorage.getItem(`${cacheKey}_time`);
        const now = Date.now();
        const cacheValidity = 15 * 60 * 1000; // 15分钟

        // 如果缓存存在且有效，直接使用缓存数据
        if (cachedData && cacheTime && (now - parseInt(cacheTime)) < cacheValidity) {

            try {
                const weatherInfo = JSON.parse(cachedData);
                if (weatherInfo && weatherInfo.results) {
                    const processedData = this.processWeatherAPIResponse(weatherInfo);
                    this.updateWeatherUI(processedData);
                    this.updateWeatherForecast(processedData.forecast || []);
                }
                return;
            } catch (e) {
                console.error('解析缓存数据失败:', e);
            }
        }



        try {
            // 获取城市的名称
            let cityName = location;

            /**
             * 简化处理城市名：
             * 心知天气API支持中文城市名，直接使用trim处理即可
             */
            function getProcessedCityName(cityName) {
                if (!cityName) return "";
                return cityName.trim();
            }

            // 使用处理后的城市名
            cityName = getProcessedCityName(cityName);

            // 检查城市名是否为空
            if (!cityName) {
                console.warn('城市名为空，无法获取天气数据');
                return;
            }



            // 构建API URL，使用Netlify代理函数，避免在前端暴露API密钥
            const apiUrl = `/api/weather-api?location=${encodeURIComponent(cityName)}&language=zh-Hans&unit=c&start=0&days=10`;


            // 通过Netlify代理函数获取天气数据，添加优先获取策略
            fetch(apiUrl, {
                priority: 'high', // 提示浏览器优先获取此资源
                cache: 'force-cache' // 优先使用缓存
            })
                .then(response => {
                    // 检查HTTP响应状态码
                    if (!response.ok) {

                        // 尝试获取错误信息
                        return response.json().then(errorData => {

                            throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
                        }).catch(e => {

                            throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
                        });
                    }
                    return response.json();
                })
                .then(weatherInfo => {


                    // 保存到本地缓存
                    try {
                        localStorage.setItem(cacheKey, JSON.stringify(weatherInfo));
                        localStorage.setItem(`${cacheKey}_time`, now.toString());
                    } catch (e) {

                    }

                    // 处理API返回的数据
                    if (weatherInfo && weatherInfo.results) {
                        const processedData = this.processWeatherAPIResponse(weatherInfo);
                        this.updateWeatherUI(processedData);
                        this.updateWeatherForecast(processedData.forecast || []);
                    } else {

                    }
                })
                .catch(error => {

                    // 保持显示为"-"
                });
        } catch (error) {

            // 保持显示为"-"
        }
    },

    /**
 * 处理天气API返回的数据 - 优化版本，减少重复计算
 */
    processWeatherAPIResponse: function (response) {
        // 根据心知天气API的实际返回格式进行处理
        const results = response.results || [];
        if (!results.length) {

            return {
                temp: 'API错误',
                feels_like: 'API错误',
                condition: 'API错误',
                humidity: 'API错误',
                wind_speed: 'API错误',
                sunrise: 'API错误',
                forecast: []
            };
        }

        const locationData = response.results[0];
        const dailyData = locationData.daily || [];

        // 检查dailyData是否存在且有数据
        if (!dailyData || dailyData.length === 0) {

            return {
                temp: 'API错误',
                feels_like: 'API错误',
                condition: 'API错误',
                humidity: 'API错误',
                wind_speed: 'API错误',
                sunrise: 'API错误',
                forecast: []
            };
        }

        // 取当天的数据作为当前天气信息
        const currentDay = dailyData[0] || {};

        // 将风速从km/h转换为m/s (1 km/h = 1000/3600 m/s ≈ 0.2778 m/s)
        const convertKmHToMs = (kmh) => {
            if (!kmh || isNaN(parseFloat(kmh))) return '-';
            return (parseFloat(kmh) * 1000 / 3600).toFixed(1);
        };

        // 提取当前天气数据
        const temp = currentDay.high || currentDay.low;
        const condition = currentDay.text_day || currentDay.text_night;
        const humidity = currentDay.humidity;
        const wind_speed = convertKmHToMs(currentDay.wind_speed);
        const sunrise = currentDay.sunrise || '--:--';

        // 计算体感温度（简化计算，实际应根据湿度、风速等因素综合计算）
        let feels_like = '*';
        if (temp && humidity) {
            const tempValue = parseFloat(temp);
            const humidityValue = parseFloat(humidity);

            if (!isNaN(tempValue) && !isNaN(humidityValue)) {
                // 简化的体感温度计算公式（适合摄氏度）
                // 参考：https://en.wikipedia.org/wiki/Heat_index
                feels_like = tempValue + (humidityValue - 50) * 0.1;
                feels_like = feels_like.toFixed(1);
            }
        }

        // 处理多日天气预报数据
        const forecast = dailyData.map(day => ({
            date: this.formatDate(new Date(day.date)),
            day: this.getDayOfWeek(new Date(day.date)),
            temp_min: day.low,
            temp_max: day.high,
            temp: `${day.low}°/${day.high}°`, // 显示最低和最高温度
            condition: day.text_day || day.text_night
        }));

        return {
            temp,
            feels_like: feels_like,
            condition,
            humidity,
            wind_speed,
            sunrise: sunrise,
            forecast
        };
    },

    /**
     * 获取星期几
     */
    getDayOfWeek: function (date) {
        const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        return days[date.getDay()];
    },

    /**
     * 格式化日期
     */
    formatDate: function (date) {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}/${day}`;
    },

    /**
 * 更新天气UI - 优化版本，批量处理DOM操作
 */
    updateWeatherUI: function (weatherData) {
        // 确保weatherData存在
        if (!weatherData) {

            this.clearWeatherData();
            return;
        }

        // 批量获取DOM元素，减少DOM查询次数
        const elements = {
            temp: document.getElementById('weather-temp'),
            desc: document.getElementById('weather-desc'),
            icon: document.getElementById('weather-main-icon'),
            humidity: document.getElementById('weather-humidity'),
            wind: document.getElementById('weather-wind'),
            feels_like: document.getElementById('weather-feels-like'),
            sunrise: document.getElementById('weather-sunrise')
        };

        // 批量更新文本内容
        elements.temp.textContent = `${weatherData.temp}°C`;
        elements.desc.textContent = weatherData.condition;
        elements.humidity.textContent = `${weatherData.humidity}%`;
        elements.wind.textContent = `${weatherData.wind_speed}m/s`;
        elements.feels_like.textContent = `${weatherData.feels_like}°C`;
        elements.sunrise.textContent = `${weatherData.sunrise}`;

        // 更新天气图标 - 优化类操作
        const iconElement = elements.icon;
        // 移除所有fas fa-*类
        const oldClasses = Array.from(iconElement.classList).filter(cls => cls.startsWith('fa-'));
        oldClasses.forEach(cls => iconElement.classList.remove(cls));

        // 添加新图标类
        const iconClass = this.getWeatherIconClass(weatherData.condition || '-');
        iconElement.classList.add(iconClass);

        // 调用天气动画效果
        this.addWeatherAnimation(weatherData.condition);

        // 隐藏骨架屏
        this.hideSkeleton();
    },

    /**
     * 获取天气对应的图标类
     */
    getWeatherIconClass: function (condition) {
        if (condition === "-") {
            return 'fa-question';
        }

        const iconMap = {
            '晴': 'fa-sun',
            '多云': 'fa-cloud-sun',
            '阴': 'fa-cloud',
            '小雨': 'fa-cloud-rain',
            '中雨': 'fa-cloud-showers-heavy',
            '大雨': 'fa-cloud-bolt-rain',
            '雪': 'fa-snowflake'
        };

        // 查找精确匹配
        if (iconMap[condition]) {
            return iconMap[condition];
        }

        // 根据关键词匹配
        if (condition.includes('雨')) {
            return 'fa-cloud-rain';
        } else if (condition.includes('雪')) {
            return 'fa-snowflake';
        } else if (condition.includes('云')) {
            return 'fa-cloud';
        } else if (condition.includes('晴')) {
            return 'fa-sun';
        } else {
            return 'fa-question'; // 默认使用问号图标
        }
    },

    /**
     * 更新天气预报
     */
    updateWeatherForecast: function (forecast) {
        const container = document.getElementById('forecast-container');
        if (!container) {

            return;
        }

        // 清空容器
        container.innerHTML = '';

        // 如果没有预报数据，显示提示
        if (!forecast || forecast.length === 0) {
            const noDataItem = document.createElement('div');
            noDataItem.className = 'forecast-day';
            noDataItem.innerHTML = `
                <span class="forecast-date">--</span>
                <span class="forecast-day-name">--</span>
                <i class="fas fa-question forecast-icon"></i>
                <span class="forecast-temp">-°</span>
            `;
            container.appendChild(noDataItem);
            return;
        }

        // 添加天气预报项
        forecast.forEach(day => {
            if (!day) return; // 跳过无效的预报数据

            const forecastDay = document.createElement('div');
            forecastDay.className = 'forecast-day';

            // 构建温度显示内容
            let tempDisplay = '-°';
            if (day.temp) {
                tempDisplay = `${day.temp}°`;
            } else if (day.temp_min && day.temp_max) {
                tempDisplay = `${day.temp_min}°/${day.temp_max}°`;
            } else if (day.temp_min) {
                tempDisplay = `${day.temp_min}°`;
            } else if (day.temp_max) {
                tempDisplay = `${day.temp_max}°`;
            }

            forecastDay.innerHTML = `
                <span class="forecast-date">${day.date || '--'}</span>
                <span class="forecast-day-name">${day.day || '--'}</span>
                <i class="fas ${this.getWeatherIconClass(day.condition || '-')} forecast-icon"></i>
                <span class="forecast-temp">${tempDisplay}</span>
            `;

            container.appendChild(forecastDay);
        });

        // 初始化水平滚动功能
        this.initHorizontalScroll();

        // 添加滚动指示箭头
        this.addScrollIndicators();
    },

    /**
 * 初始化水平滚动功能 - 优化版本，使用passive事件监听器
 */
    initHorizontalScroll: function () {
        const container = document.querySelector('.weather-forecast-container');
        if (!container) return;

        // 鼠标滚轮水平滚动 - 使用passive优化
        container.addEventListener('wheel', function (e) {
            e.preventDefault();
            this.scrollLeft += e.deltaY;
        }, { passive: false }); // 对于需要preventDefault的事件，必须设为false

        // 触摸滑动 - 使用passive优化
        let touchStartX = 0;
        let scrollLeft = 0;

        container.addEventListener('touchstart', function (e) {
            touchStartX = e.touches[0].pageX;
            scrollLeft = this.scrollLeft;
        }, { passive: true });

        container.addEventListener('touchmove', function (e) {
            const touchX = e.touches[0].pageX;
            const walk = (touchX - touchStartX) * 2; // 滚动速度因子
            this.scrollLeft = scrollLeft - walk;
        }, { passive: true });
    },

    /**
     * 添加滚动指示箭头
     */
    addScrollIndicators: function () {
        const container = document.querySelector('.weather-forecast-container');
        if (!container) return;

        // 检查是否已经有指示箭头
        if (document.querySelector('.scroll-indicator')) {
            return;
        }

        // 创建指示箭头容器
        const indicatorContainer = document.createElement('div');
        indicatorContainer.className = 'scroll-indicator';

        // 创建左右箭头
        const leftArrow = document.createElement('div');
        leftArrow.className = 'scroll-arrow scroll-arrow-left';
        leftArrow.innerHTML = '<i class="fas fa-chevron-left"></i>';

        const rightArrow = document.createElement('div');
        rightArrow.className = 'scroll-arrow scroll-arrow-right';
        rightArrow.innerHTML = '<i class="fas fa-chevron-right"></i>';

        // 添加点击事件
        leftArrow.addEventListener('click', function () {
            container.scrollBy({ left: -200, behavior: 'smooth' });
        });

        rightArrow.addEventListener('click', function () {
            container.scrollBy({ left: 200, behavior: 'smooth' });
        });

        // 添加到容器
        indicatorContainer.appendChild(leftArrow);
        indicatorContainer.appendChild(rightArrow);
        container.parentNode.appendChild(indicatorContainer);
    },

    /**
 * 添加天气动画效果 - 优化版本，实际调用并优化性能
 */
    addWeatherAnimation: function (condition) {
        // 检查是否支持动画且有条件参数
        if (!condition) return;

        // 使用requestAnimationFrame优化动画性能
        requestAnimationFrame(() => {
            const icon = document.querySelector('.weather-icon i');
            if (!icon) return;

            // 简单的颜色变化动画，避免复杂效果
            if (condition.includes('晴')) {
                icon.style.color = '#FFD700';
            } else if (condition.includes('雨')) {
                icon.style.color = '#87CEEB';
            } else if (condition.includes('雪')) {
                icon.style.color = '#E0FFFF';
            } else {
                // 重置为默认颜色
                icon.style.color = '';
            }
        });
    },

    /**
     * 清空天气数据
     */
    clearWeatherData: function () {
        // 清空所有显示的值为占位符
        document.getElementById('weather-temp').textContent = '-°C';
        document.getElementById('weather-desc').textContent = '-';
        document.getElementById('weather-humidity').textContent = '-%';
        document.getElementById('weather-wind').textContent = '-m/s';
        document.getElementById('weather-feels-like').textContent = '-°C';
        document.getElementById('weather-sunrise').textContent = '--:--';

        // 清空预报数据
        const container = document.getElementById('forecast-container');
        if (container) {
            container.innerHTML = '';
        }
    },
    /**
     * 延迟初始化非关键功能
     */
    initNonCriticalFeatures: function () {
        // 使用setTimeout延迟加载非关键功能
        setTimeout(() => {
            this.initHorizontalScroll();
            this.addScrollIndicators();
        }, 1000); // 延迟1秒执行
    },

    /**
     * 显示骨架屏，提升用户感知性能
     */
    showSkeleton: function () {
        // 如果已经有数据，不显示骨架屏
        if (document.getElementById('weather-temp').textContent !== '-°C') {
            return;
        }

        // 骨架屏样式已在CSS中定义
        const widget = document.querySelector('.weather-widget');
        if (widget) {
            widget.classList.add('skeleton-loading');
        }
    },

    /**
     * 隐藏骨架屏
     */
    hideSkeleton: function () {
        const widget = document.querySelector('.weather-widget');
        if (widget) {
            widget.classList.remove('skeleton-loading');
        }
    }
};

// 导出模块，使其可以在其他地方使用
window.WeatherWidget = WeatherWidget;

// 当DOM加载完成后，初始化天气小部件
document.addEventListener('DOMContentLoaded', function () {
    WeatherWidget.showSkeleton();
    WeatherWidget.init();
    WeatherWidget.initNonCriticalFeatures();
});
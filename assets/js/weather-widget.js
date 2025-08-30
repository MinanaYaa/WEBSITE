/**
 * 天气小部件模块 - 提供天气数据获取和UI更新功能
 */
const WeatherWidget = {
    /**
     * 初始化天气小部件
     */
    init: function () {
        console.log('开始初始化天气小部件');
        this.waitForTravelData().then(travelDataModule => {
            console.log('TravelData模块加载结果:', travelDataModule);
            this.initializeWidget(travelDataModule);
        });
    },

    /**
     * 等待TravelData模块加载完成
     */
    waitForTravelData: function () {
        console.log('当前window.TravelData状态:', window.TravelData ? '已存在' : '不存在');
        return new Promise(resolve => {
            if (window.TravelData) {
                console.log('TravelData模块已加载:', window.TravelData);
                resolve(window.TravelData);
                return;
            }
            const interval = setInterval(() => {
                if (window.TravelData) {
                    clearInterval(interval);
                    console.log('TravelData模块延迟加载完成');
                    resolve(window.TravelData);
                }
            }, 100);
            // 设置超时
            setTimeout(() => {
                clearInterval(interval);
                console.log('TravelData模块加载超时');
                resolve(null);
            }, 3000);
        });
    },

    /**
     * 初始化天气小部件 - 使用TravelData模块或默认初始化
     */
    initializeWidget: function (travelDataModule) {
        // 获取天气小部件元素
        const weatherWidget = document.querySelector('.weather-widget');
        console.log('天气小部件元素:', weatherWidget);

        if (travelDataModule && weatherWidget) {
            console.log('使用TravelData模块进行初始化');
            // 使用TravelData模块初始化和绑定数据
            travelDataModule.initialize();
            travelDataModule.bindToElement(weatherWidget);

            // 获取目的地信息
            const destination = travelDataModule.getDestination();
            const destinationName = travelDataModule.getDestinationDisplayName();
            console.log('获取到的目的地信息:', { destination, destinationName });

            // 如果有目的地信息，则获取天气数据
            if (destination && destination !== 'unknown') {
                // 更新显示的城市名称
                const locationNameElement = document.getElementById('current-location');
                if (locationNameElement) {
                    locationNameElement.textContent = destinationName;
                }

                // 尝试从心知天气API获取天气数据
                console.log('准备调用心知天气API获取数据');
                this.fetchWeatherDataFromXinzhiAPI(destinationName);
            } else {
                console.warn('未能通过TravelData模块获取目的地信息，使用默认初始化');
                // 使用默认的位置显示和数据获取
                this.defaultInit();
            }
        } else {
            console.warn('TravelData模块未加载或未找到天气小部件，使用默认初始化');
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
     * 从心知天气API获取天气数据
     */
    fetchWeatherDataFromXinzhiAPI: function (location) {
        console.log(`从心知天气API获取${location}的天气数据`);

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

            console.log(`处理后的城市名: ${cityName}`);

            // 构建API URL，使用用户提供的API密钥和动态替换location参数
            const apiUrl = `https://api.seniverse.com/v3/weather/daily.json?key=SCiXMZJNat6-m7dVy&location=${cityName}&language=zh-Hans&unit=c&start=0&days=10`;

            console.log(`API请求URL: ${apiUrl}`);

            // 调用心知天气API获取实时天气
            fetch(apiUrl)
                .then(response => {
                    // 检查HTTP响应状态码
                    if (!response.ok) {
                        console.error(`API请求失败，状态码: ${response.status}, 状态文本: ${response.statusText}`);
                        // 尝试获取错误信息
                        return response.json().then(errorData => {
                            console.error('API错误详情:', errorData);
                            throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
                        }).catch(e => {
                            console.error('无法解析API错误响应:', e);
                            throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
                        });
                    }
                    return response.json();
                })
                .then(weatherInfo => {
                    console.log('完整的天气API返回值:', JSON.stringify(weatherInfo, null, 2));

                    // 处理API返回的数据
                    if (weatherInfo && weatherInfo.results) {
                        const processedData = this.processWeatherAPIResponse(weatherInfo);
                        this.updateWeatherUI(processedData);
                        this.updateWeatherForecast(processedData.forecast || []);
                    } else {
                        console.warn('API返回数据格式不正确或结果为空:', weatherInfo);
                    }
                })
                .catch(error => {
                    console.error('从心知天气API获取天气数据失败:', error);
                    // 保持显示为"-"
                });
        } catch (error) {
            console.error('从心知天气API获取天气数据失败:', error);
            // 保持显示为"-"
        }
    },

    /**
     * 处理天气API返回的数据
     */
    processWeatherAPIResponse: function (response) {
        // 根据心知天气API的实际返回格式进行处理
        const results = response.results || [];
        if (!results.length) {
            console.warn('API返回结果为空');
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

        const locationData = results[0];
        const dailyData = locationData.daily || [];

        // 检查dailyData是否存在且有数据
        if (!dailyData || dailyData.length === 0) {
            console.warn('API返回的每日数据为空');
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
     * 更新天气UI
     */
    updateWeatherUI: function (weatherData) {
        // 确保weatherData存在
        if (!weatherData) {
            console.warn('没有天气数据可供更新UI');
            this.clearWeatherData();
            return;
        }

        // 更新温度 - 直接赋值
        const tempElement = document.getElementById('weather-temp');
        tempElement.textContent = `${weatherData.temp}°C`;

        // 更新天气描述 - 无条件替换占位符
        const descElement = document.getElementById('weather-desc');
        descElement.textContent = weatherData.condition;

        // 更新天气图标 - 无条件替换占位符
        const iconElement = document.getElementById('weather-main-icon');
        // 移除所有fas fa-*类
        const oldClasses = Array.from(iconElement.classList).filter(cls => cls.startsWith('fa-'));
        oldClasses.forEach(cls => iconElement.classList.remove(cls));

        // 添加新图标类
        const iconClass = this.getWeatherIconClass(weatherData.condition || '-');
        iconElement.classList.add(iconClass);

        // 更新详细信息 - 无条件替换占位符
        document.getElementById('weather-humidity').textContent = `${weatherData.humidity}%`;

        document.getElementById('weather-wind').textContent = `${weatherData.wind_speed}m/s`;

        document.getElementById('weather-feels-like').textContent = `${weatherData.feels_like}°C`;

        document.getElementById('weather-sunrise').textContent = `${weatherData.sunrise}`;
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
            console.warn('未找到天气预报容器');
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
     * 初始化水平滚动功能
     */
    initHorizontalScroll: function () {
        const container = document.querySelector('.weather-forecast-container');
        if (!container) return;

        // 鼠标滚轮水平滚动
        container.addEventListener('wheel', function (e) {
            e.preventDefault();
            this.scrollLeft += e.deltaY;
        });

        // 触摸滑动
        let touchStartX = 0;
        let scrollLeft = 0;

        container.addEventListener('touchstart', function (e) {
            touchStartX = e.touches[0].pageX;
            scrollLeft = this.scrollLeft;
        });

        container.addEventListener('touchmove', function (e) {
            const touchX = e.touches[0].pageX;
            const walk = (touchX - touchStartX) * 2; // 滚动速度因子
            this.scrollLeft = scrollLeft - walk;
        });
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
     * 添加天气动画效果
     */
    addWeatherAnimation: function () {
        // 天气类型对应的动画效果
        const weatherAnimations = {
            '晴': () => {
                // 晴天动画效果
                const icon = document.querySelector('.weather-icon i');
                if (icon) {
                    icon.style.color = '#FFD700';
                }
            },
            '雨': () => {
                // 雨天动画效果
                const icon = document.querySelector('.weather-icon i');
                if (icon) {
                    icon.style.color = '#87CEEB';
                }
            },
            '雪': () => {
                // 雪天动画效果
                const icon = document.querySelector('.weather-icon i');
                if (icon) {
                    icon.style.color = '#E0FFFF';
                }
            }
        };
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
    }
};

// 导出模块，使其可以在其他地方使用
window.WeatherWidget = WeatherWidget;

// 当DOM加载完成后，初始化天气小部件
document.addEventListener('DOMContentLoaded', function () {
    WeatherWidget.init();
});
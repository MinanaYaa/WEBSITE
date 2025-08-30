// 旅游数据处理模块测试脚本
(function () {
    console.log('开始测试旅游数据处理模块...');

    // 等待页面加载完成
    document.addEventListener('DOMContentLoaded', function () {
        setTimeout(function () {
            // 检查TravelData对象是否存在
            if (window.TravelData) {
                console.log('✓ TravelData模块已成功加载');

                // 初始化并获取旅游数据
                window.TravelData.initialize();

                const destination = window.TravelData.getDestination();
                const destinationName = window.TravelData.getDestinationDisplayName();
                const dates = window.TravelData.getDates();
                const attractions = window.TravelData.getAttractions();

                console.log('目的地代码:', destination);
                console.log('目的地名称:', destinationName);
                console.log('旅游日期:', dates);
                console.log('景点数量:', attractions.length);

                // 验证数据提取是否成功
                if (destination && destination !== 'unknown') {
                    console.log('✓ 成功提取目的地数据');
                } else {
                    console.warn('✗ 未能成功提取目的地数据');
                }

                if (dates.length > 0) {
                    console.log('✓ 成功提取旅游日期数据');
                } else {
                    console.warn('✗ 未能成功提取旅游日期数据');
                }

                if (attractions.length > 0) {
                    console.log('✓ 成功提取景点数据');
                    console.log('第一个景点:', attractions[0].name);
                } else {
                    console.warn('✗ 未能成功提取景点数据');
                }

                // 测试手动绑定数据到元素
                const weatherWidget = document.querySelector('.weather-widget');
                if (weatherWidget) {
                    window.TravelData.bindToElement(weatherWidget);
                    console.log('✓ 成功绑定数据到天气小部件');
                }

                const itinerary = document.getElementById('overview');
                if (itinerary) {
                    window.TravelData.bindToElement(itinerary);
                    console.log('✓ 成功绑定数据到行程概览');
                }

                const firstAttractionCard = document.querySelector('.attraction-card');
                if (firstAttractionCard) {
                    window.TravelData.bindToElement(firstAttractionCard);
                    console.log('✓ 成功绑定数据到景点卡片');
                }

                const mapContainer = document.getElementById('mapContainer');
                if (mapContainer) {
                    window.TravelData.bindToElement(mapContainer);
                    console.log('✓ 成功绑定数据到地图');
                }

                console.log('旅游数据处理模块测试完成！');
            } else {
                console.error('✗ TravelData模块未加载');
            }
        }, 2000);
    });
})();
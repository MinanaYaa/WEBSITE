/**
 * 旅游网站主JavaScript文件 - 性能优化版
 */

// 性能监控对象
const performanceMonitor = {
    startTime: null,
    marks: {},
    start() {
        this.startTime = performance.now();
    },
    mark(name) {
        this.marks[name] = performance.now();
    },
    getDuration(startMark, endMark) {
        return this.marks[endMark] - this.marks[startMark];
    }
};

// 初始化性能监控
performanceMonitor.start();

// CSS样式初始化
function initStyles() {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        /* 消息提示样式 */
        .message {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            opacity: 0;
            transform: translateX(100%);
            transition: opacity 0.3s ease, transform 0.3s ease;
        }
        .message.success {
            background-color: #48bb78;
        }
        .message.error {
            background-color: #f56565;
        }
        .message.info {
            background-color: #4299e1;
        }
        .message-show {
            opacity: 1 !important;
            transform: translateX(0) !important;
        }
        .message-hide {
            opacity: 0 !important;
            transform: translateX(100%) !important;
        }
        /* 目的地卡片悬停效果 */
        .destination-card {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .destination-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
    `;
    document.head.appendChild(styleSheet);
}

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function () {
    performanceMonitor.mark('domLoaded');
    
    // 初始化CSS样式
    initStyles();
    
    // 加载组件
    loadComponents().then(() => {
        performanceMonitor.mark('componentsLoaded');
        
        // 使用requestAnimationFrame确保DOM渲染完成后再执行初始化
        requestAnimationFrame(() => {
            // 初始化页面功能
            initPage();

            // 平滑滚动功能
            initSmoothScroll();

            // 导航栏滚动效果
            initNavbarScroll();

            // 淡入效果
            initFadeInEffects();
            
            performanceMonitor.mark('pageInitialized');
            
            // 只在开发环境显示性能日志
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.log('页面初始化耗时:', performanceMonitor.getDuration('domLoaded', 'pageInitialized'), 'ms');
            }
        });
    });
});

/**
 * 组件缓存
 */
const componentCache = new Map();

/**
 * 加载页面组件 - 优化版
 * @returns {Promise} 加载完成的Promise
 */
function loadComponents() {
    // 组件配置
    const components = [
        {
            containerId: 'header-container',
            componentUrl: '../../components/header.html'
        },
        {
            containerId: 'navigation-container',
            componentUrl: '../../components/navigation.html'
        },
        {
            containerId: 'footer-container',
            componentUrl: '../../components/footer.html'
        }
    ];

    // 预加载组件（使用并发请求）
    const promises = components.map(component => {
        // 检查缓存
        if (componentCache.has(component.componentUrl)) {
            return Promise.resolve(componentCache.get(component.componentUrl));
        }
        return loadComponent(component.containerId, component.componentUrl);
    });

    return Promise.all(promises);
}

/**
 * 加载单个组件 - 优化版
 * @param {string} containerId - 容器ID
 * @param {string} componentUrl - 组件URL
 * @returns {Promise} 加载完成的Promise
 */
function loadComponent(containerId, componentUrl) {
    return new Promise((resolve, reject) => {
        const container = document.getElementById(containerId);
        if (!container) {
            resolve();
            return;
        }

        fetch(componentUrl, {
            cache: 'force-cache' // 启用缓存
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`组件加载失败: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                // 使用DocumentFragment减少DOM操作
                const fragment = document.createDocumentFragment();
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                
                // 将所有子节点移动到fragment
                while (tempDiv.firstChild) {
                    fragment.appendChild(tempDiv.firstChild);
                }
                
                // 一次性更新DOM
                container.innerHTML = '';
                container.appendChild(fragment);
                
                // 缓存组件
                componentCache.set(componentUrl, html);
                
                resolve();
            })
            .catch(error => {
                console.error(`加载组件 ${containerId} 失败:`, error);
                resolve(); // 即使失败也继续执行
            });
    });
}

/**
 * 初始化页面基本功能 - 优化版
 */
function initPage() {
    performanceMonitor.mark('initPageStart');
    
    // 设置当前年份
    const yearElement = document.querySelector('.current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    // 目的地卡片交互效果已通过CSS类实现，无需JavaScript事件监听器
    // 注：已在initStyles()中添加了.destination-card:hover样式
    
    performanceMonitor.mark('initPageEnd');
}

/**
 * 初始化平滑滚动功能 - 优化版
 */
function initSmoothScroll() {
    performanceMonitor.mark('initSmoothScrollStart');
    
    // 使用事件委托代替为每个锚点添加单独的事件监听器
    document.addEventListener('click', function(e) {
        // 检查点击的是否是以#开头的链接
        const anchor = e.target.closest('a[href^="#"]');
        if (!anchor) return;
        
        e.preventDefault();
        
        const targetId = anchor.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            // 使用requestAnimationFrame确保平滑滚动
            requestAnimationFrame(() => {
                window.scrollTo({
                    top: targetElement.offsetTop - 70, // 考虑导航栏高度
                    behavior: 'smooth'
                });
            });
        }
    });
    
    performanceMonitor.mark('initSmoothScrollEnd');
}

/**
 * 节流函数 - 限制函数执行频率
 * @param {Function} func - 要执行的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 节流后的函数
 */
function throttle(func, delay) {
    let lastCall = 0;
    return function(...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            func.apply(this, args);
        }
    };
}

/**
 * 初始化导航栏滚动效果 - 优化版
 */
function initNavbarScroll() {
    performanceMonitor.mark('initNavbarScrollStart');
    
    const navbar = document.querySelector('nav');
    if (!navbar) return;
    
    // 缓存样式值
    const navbarBgColor = getComputedStyle(navbar).backgroundColor;
    
    // 使用节流函数优化滚动事件
    const handleScroll = throttle(function() {
        if (window.scrollY > 100) {
            // 使用requestAnimationFrame确保样式更新的平滑性
            requestAnimationFrame(() => {
                navbar.style.backgroundColor = navbarBgColor;
                navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                navbar.style.padding = '5px 0';
            });
        } else {
            requestAnimationFrame(() => {
                navbar.style.backgroundColor = navbarBgColor;
                navbar.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
                navbar.style.padding = '15px 0';
            });
        }
    }, 100); // 100ms执行一次
    
    window.addEventListener('scroll', handleScroll);
    
    // 添加清理函数，在页面卸载时移除事件监听
    window.addEventListener('beforeunload', function() {
        window.removeEventListener('scroll', handleScroll);
    });
    
    performanceMonitor.mark('initNavbarScrollEnd');
}

/**
 * 初始化元素淡入效果 - 优化版
 */
function initFadeInEffects() {
    performanceMonitor.mark('initFadeInEffectsStart');
    
    // 获取所有需要淡入的元素
    const fadeElements = document.querySelectorAll('.fade-in');
    
    // 如果没有元素，直接返回
    if (fadeElements.length === 0) {
        performanceMonitor.mark('initFadeInEffectsEnd');
        return;
    }
    
    // 创建统一的CSS类定义淡入动画
    const style = document.createElement('style');
    style.textContent = `
        .fade-in {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .fade-in-visible {
            opacity: 1;
            transform: translateY(0);
        }
    `;
    document.head.appendChild(style);
    
    // 配置IntersectionObserver
    const observer = new IntersectionObserver((entries) => {
        // 使用requestAnimationFrame批处理DOM更新
        requestAnimationFrame(() => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // 使用class切换代替直接操作style
                    entry.target.classList.add('fade-in-visible');
                    // 停止观察已显示的元素
                    observer.unobserve(entry.target);
                }
            });
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px' // 添加提前触发的边距
    });
    
    // 开始观察所有元素
    fadeElements.forEach(element => {
        observer.observe(element);
    });
    
    performanceMonitor.mark('initFadeInEffectsEnd');
}

/**
 * 消息池管理 - 用于消息提示的复用
 */
const messagePool = {
    pool: [],
    maxPoolSize: 3,
    
    // 获取消息元素（从池或创建新的）
    getMessageElement() {
        if (this.pool.length > 0) {
            return this.pool.pop();
        }
        
        // 创建新的消息元素
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        
        // 样式已在initStyles()中定义
        
        return messageElement;
    },
    
    // 回收消息元素到池
    returnToPool(element) {
        // 重置元素状态
        element.className = 'message';
        element.style.display = 'none';
        element.textContent = '';
        
        // 限制池的大小
        if (this.pool.length < this.maxPoolSize) {
            this.pool.push(element);
        } else {
            // 如果池已满，则彻底移除元素
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }
    }
};

/**
 * HTML转义函数 - 防止XSS攻击
 * @param {string} str - 输入字符串
 * @returns {string} 转义后的字符串
 */
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * 显示提示消息 - 优化版
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型：'success', 'error', 'info'
 */
function showMessage(message, type = 'info') {
    performanceMonitor.mark('showMessageStart');
    
    try {
        // 获取消息元素（复用或创建）
        const messageElement = messagePool.getMessageElement();
        
        // 添加内容和类型类
        messageElement.textContent = escapeHtml(message);
        messageElement.className = `message ${type}`;
        messageElement.style.display = 'block';
        
        // 确保元素不在文档中
        if (messageElement.parentNode) {
            messageElement.parentNode.removeChild(messageElement);
        }
        
        // 添加到页面
        document.body.appendChild(messageElement);
        
        // 使用requestAnimationFrame确保流畅动画
        requestAnimationFrame(() => {
            messageElement.classList.add('message-show');
        });
        
        // 3秒后隐藏消息
        setTimeout(() => {
            messageElement.classList.remove('message-show');
            messageElement.classList.add('message-hide');
            
            // 动画完成后回收或移除元素
            setTimeout(() => {
                messagePool.returnToPool(messageElement);
            }, 300);
        }, 3000);
        
    } catch (error) {
        console.error('显示消息时出错:', error);
    }
    
    performanceMonitor.mark('showMessageEnd');
}
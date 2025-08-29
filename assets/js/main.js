/**
 * 旅游网站主JavaScript文件
 */

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function () {
    // 加载组件
    loadComponents().then(() => {
        // 初始化页面功能
        initPage();

        // 平滑滚动功能
        initSmoothScroll();

        // 导航栏滚动效果
        initNavbarScroll();

        // 淡入效果
        initFadeInEffects();
    });
});

/**
 * 加载页面组件
 * @returns {Promise} 加载完成的Promise
 */
function loadComponents() {
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

    const promises = components.map(component => {
        return loadComponent(component.containerId, component.componentUrl);
    });

    return Promise.all(promises);
}

/**
 * 加载单个组件
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

        fetch(componentUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`组件加载失败: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                container.innerHTML = html;
                resolve();
            })
            .catch(error => {
                console.error(`加载组件 ${containerId} 失败:`, error);
                resolve(); // 即使失败也继续执行
            });
    });
}

/**
 * 初始化页面基本功能
 */
function initPage() {
    console.log('旅游网站页面已加载');

    // 设置当前年份
    const yearElement = document.querySelector('.current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    // 为目的地卡片添加点击事件
    const destinationCards = document.querySelectorAll('.destination-card');
    destinationCards.forEach(card => {
        // 已在HTML中设置了链接，这里可以添加额外的交互效果
        card.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
        });

        card.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
        });
    });
}

/**
 * 初始化平滑滚动功能
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 70, // 考虑导航栏高度
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * 初始化导航栏滚动效果
 */
function initNavbarScroll() {
    const navbar = document.querySelector('nav');
    if (!navbar) return;

    const navbarHeight = navbar.offsetHeight;
    const navbarBgColor = getComputedStyle(navbar).backgroundColor;

    window.addEventListener('scroll', function () {
        if (window.scrollY > 100) {
            navbar.style.backgroundColor = navbarBgColor;
            navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
            navbar.style.padding = '5px 0';
        } else {
            navbar.style.backgroundColor = navbarBgColor;
            navbar.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
            navbar.style.padding = '15px 0';
        }
    });
}

/**
 * 初始化元素淡入效果
 */
function initFadeInEffects() {
    const fadeElements = document.querySelectorAll('.fade-in');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    fadeElements.forEach(element => {
        element.style.opacity = 0;
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });
}

/**
 * 显示提示消息
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型：'success', 'error', 'info'
 */
function showMessage(message, type = 'info') {
    // 创建消息元素
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = message;

    // 添加样式
    messageElement.style.position = 'fixed';
    messageElement.style.top = '20px';
    messageElement.style.right = '20px';
    messageElement.style.padding = '15px 20px';
    messageElement.style.borderRadius = '5px';
    messageElement.style.color = 'white';
    messageElement.style.fontWeight = 'bold';
    messageElement.style.zIndex = '10000';
    messageElement.style.opacity = '0';
    messageElement.style.transform = 'translateX(100%)';
    messageElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

    // 根据类型设置背景色
    switch (type) {
        case 'success':
            messageElement.style.backgroundColor = '#48bb78';
            break;
        case 'error':
            messageElement.style.backgroundColor = '#f56565';
            break;
        case 'info':
        default:
            messageElement.style.backgroundColor = '#4299e1';
    }

    // 添加到页面
    document.body.appendChild(messageElement);

    // 显示消息
    setTimeout(() => {
        messageElement.style.opacity = '1';
        messageElement.style.transform = 'translateX(0)';
    }, 100);

    // 3秒后隐藏消息
    setTimeout(() => {
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translateX(100%)';

        // 移除元素
        setTimeout(() => {
            document.body.removeChild(messageElement);
        }, 300);
    }, 3000);
}
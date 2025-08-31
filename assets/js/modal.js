/**
 * 模态框功能JavaScript文件 - 性能优化版
 */

// 性能监控 - 标记开始时间
const performanceMarks = {};

/**
 * 初始化CSS样式
 */
function initModalStyles() {
    // 检查是否已添加样式
    if (document.getElementById('modal-styles')) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'modal-styles';
    style.textContent = `
        /* 模态框基础样式 */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
            backdrop-filter: blur(2px);
            will-change: opacity;
        }
        
        .modal-overlay.visible {
            opacity: 1;
        }
        
        .modal-container {
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            display: flex;
            flex-direction: column;
            transform: translateY(-20px);
            transition: transform 0.3s ease;
            will-change: transform;
        }
        
        .modal-overlay.visible .modal-container {
            transform: translateY(0);
        }
        
        .modal-header {
            padding: 20px;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .modal-title {
            margin: 0;
            color: #333;
        }
        
        .modal-close-btn {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #999;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            justify-content: center;
            align-items: center;
            border-radius: 50%;
            transition: all 0.3s ease;
        }
        
        .modal-close-btn:hover {
            background-color: #f0f0f0;
            color: #666;
        }
        
        .modal-body {
            padding: 20px;
            overflow-y: auto;
            flex: 1;
        }
        
        .modal-body p {
            margin: 0;
            color: #666;
            line-height: 1.6;
        }
        
        .modal-footer {
            padding: 15px 20px;
            border-top: 1px solid #e0e0e0;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        }
        
        .modal-footer .btn {
            margin-left: 10px;
        }
        
        /* 加载动画样式 */
        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f0f0f0;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* 响应式调整 */
        @media (max-width: 767px) {
            .modal-container {
                width: 95% !important;
                margin: 20px;
            }
            
            .modal-header,
            .modal-body,
            .modal-footer {
                padding: 15px !important;
            }
        }
    `;
    document.head.appendChild(style);
}

// 模态框池 - 用于缓存和复用模态框DOM结构
const modalPool = {
    pool: [],
    maxSize: 3,

    get() {
        if (this.pool.length > 0) {
            return this.pool.pop();
        }
        return this.create();
    },

    create() {
        const fragment = document.createDocumentFragment();

        // 创建模态框背景
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';

        // 创建模态框容器
        const modalContainer = document.createElement('div');
        modalContainer.className = 'modal-container';

        // 创建模态框头部
        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';

        // 添加标题
        const modalTitle = document.createElement('h3');
        modalTitle.className = 'modal-title';
        modalHeader.appendChild(modalTitle);

        // 添加关闭按钮
        const closeButton = document.createElement('button');
        closeButton.className = 'modal-close-btn';
        closeButton.innerHTML = '&times;';
        closeButton.addEventListener('click', closeModal);
        modalHeader.appendChild(closeButton);

        // 创建模态框内容
        const modalBody = document.createElement('div');
        modalBody.className = 'modal-body';

        // 创建模态框底部
        const modalFooter = document.createElement('div');
        modalFooter.className = 'modal-footer';

        // 组装模态框
        modalContainer.appendChild(modalHeader);
        modalContainer.appendChild(modalBody);
        modalContainer.appendChild(modalFooter);
        modalOverlay.appendChild(modalContainer);
        fragment.appendChild(modalOverlay);

        // 为阻止冒泡添加一次事件监听器
        modalContainer.addEventListener('click', function (e) {
            e.stopPropagation();
        });

        return modalOverlay;
    },

    release(modalOverlay) {
        if (this.pool.length < this.maxSize) {
            // 清理内容，准备复用
            const modalTitle = modalOverlay.querySelector('.modal-title');
            const modalBody = modalOverlay.querySelector('.modal-body');
            const modalFooter = modalOverlay.querySelector('.modal-footer');

            modalTitle.textContent = '';
            modalBody.innerHTML = '';

            // 保留关闭按钮，移除其他按钮
            while (modalFooter.children.length > 0) {
                modalFooter.removeChild(modalFooter.firstChild);
            }

            // 移除所有自定义属性
            delete modalOverlay._cleanupFunctions;
            delete modalOverlay._onCloseCallback;

            this.pool.push(modalOverlay);
        } else if (document.body.contains(modalOverlay)) {
            document.body.removeChild(modalOverlay);
        }
    }
};

/**
 * 处理ESC键关闭事件的单例函数
 */
function handleEscKey(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
}

/**
 * 创建并显示模态框
 * @param {Object} options - 模态框配置选项
 * @param {string} options.title - 模态框标题
 * @param {string} options.content - 模态框内容（HTML字符串）
 * @param {Array} options.buttons - 按钮配置数组
 * @param {function} options.onClose - 关闭回调函数
 * @param {boolean} options.closeOnOutsideClick - 点击外部是否关闭模态框
 */
function showModal(options = {}) {
    // 记录性能开始时间
    const startTime = performance.now();

    // 初始化样式
    initModalStyles();

    // 检查是否已存在模态框，如果有则关闭
    closeModal();

    // 默认配置
    const defaultOptions = {
        title: '提示',
        content: '',
        buttons: [
            {
                text: '确定',
                className: 'btn-primary',
                onClick: closeModal
            }
        ],
        onClose: null,
        closeOnOutsideClick: true
    };

    // 合并配置
    const modalOptions = { ...defaultOptions, ...options };

    // 从池中获取或创建模态框
    const modalOverlay = modalPool.get();
    const modalContainer = modalOverlay.querySelector('.modal-container');
    const modalTitle = modalOverlay.querySelector('.modal-title');
    const modalBody = modalOverlay.querySelector('.modal-body');
    const modalFooter = modalOverlay.querySelector('.modal-footer');

    // 设置内容
    modalTitle.textContent = modalOptions.title;
    modalBody.innerHTML = modalOptions.content;

    // 添加按钮 - 使用DocumentFragment批量添加
    const buttonFragment = document.createDocumentFragment();
    modalOptions.buttons.forEach(button => {
        const btn = document.createElement('button');
        btn.className = `btn ${button.className || ''}`;
        btn.textContent = button.text;

        // 添加点击事件
        btn.addEventListener('click', function onClickHandler() {
            let shouldClose = true;
            if (button.onClick) {
                shouldClose = button.onClick() !== false;
            }

            if (shouldClose) {
                // 移除事件监听器防止内存泄漏
                btn.removeEventListener('click', onClickHandler);
                closeModal();
            }
        });

        buttonFragment.appendChild(btn);
    });
    modalFooter.appendChild(buttonFragment);

    // 添加到页面
    document.body.appendChild(modalOverlay);

    // 使用requestAnimationFrame确保流畅动画
    requestAnimationFrame(() => {
        // 显示模态框
        modalOverlay.classList.add('visible');

        // 记录性能结束时间
        performanceMarks.showModal = performance.now() - startTime;
    });

    // 点击外部关闭模态框
    if (modalOptions.closeOnOutsideClick) {
        const handleOverlayClick = function (e) {
            if (e.target === modalOverlay) {
                modalOverlay.removeEventListener('click', handleOverlayClick);
                closeModal();
            }
        };
        modalOverlay.addEventListener('click', handleOverlayClick);
    }

    // 添加ESC键关闭功能
    document.addEventListener('keydown', handleEscKey);

    // 保存关闭时需要清理的事件监听器
    modalOverlay._cleanupFunctions = [
        () => document.removeEventListener('keydown', handleEscKey)
    ];

    // 保存onClose回调
    if (typeof modalOptions.onClose === 'function') {
        modalOverlay._onCloseCallback = modalOptions.onClose;
    }
}

/**
 * 关闭模态框
 */
function closeModal() {
    const startTime = performance.now();

    const modalOverlay = document.querySelector('.modal-overlay');
    if (!modalOverlay) return;

    // 使用CSS类切换动画效果
    modalOverlay.classList.remove('visible');

    // 等待动画完成后移除元素或放入池中
    requestAnimationFrame(() => {
        setTimeout(() => {
            // 执行清理函数
            if (modalOverlay._cleanupFunctions) {
                modalOverlay._cleanupFunctions.forEach(fn => fn());
            }

            // 执行关闭回调
            if (typeof modalOverlay._onCloseCallback === 'function') {
                modalOverlay._onCloseCallback();
            }

            // 将模态框释放到池中而非直接删除
            modalPool.release(modalOverlay);

            // 记录性能
            performanceMarks.closeModal = performance.now() - startTime;
        }, 300); // 与CSS动画持续时间匹配
    });
}

/**
 * 显示确认对话框
 * @param {string} message - 确认消息
 * @param {function} onConfirm - 确认回调函数
 * @param {function} onCancel - 取消回调函数
 * @param {string} title - 对话框标题
 */
function showConfirm(message, onConfirm, onCancel, title = '确认') {
    // 记录性能开始时间
    const startTime = performance.now();

    // 转义内容以避免XSS
    const escapedMessage = escapeHtml(message);

    showModal({
        title: title,
        content: `<p>${escapedMessage}</p>`,
        buttons: [
            {
                text: '取消',
                className: 'btn-secondary',
                onClick: onCancel
            },
            {
                text: '确认',
                className: 'btn-primary',
                onClick: onConfirm
            }
        ]
    });

    // 记录性能
    performanceMarks.showConfirm = performance.now() - startTime;
}

/**
 * 显示提示对话框
 * @param {string} message - 提示消息
 * @param {string} type - 消息类型：'success', 'error', 'info', 'warning'
 * @param {function} onClose - 关闭回调函数
 */
function showAlert(message, type = 'info', onClose) {
    // 记录性能开始时间
    const startTime = performance.now();

    // 根据类型设置图标和标题
    let icon = 'ℹ️';
    let title = '提示';

    // 使用对象映射代替switch语句
    const alertConfig = {
        success: { icon: '✅', title: '成功' },
        error: { icon: '❌', title: '错误' },
        warning: { icon: '⚠️', title: '警告' },
        info: { icon: 'ℹ️', title: '提示' }
    };

    const config = alertConfig[type] || alertConfig.info;

    // 转义内容以避免XSS
    const escapedMessage = escapeHtml(message);

    showModal({
        title: config.title,
        content: `<div style="text-align: center; font-size: 48px; margin-bottom: 15px;">${config.icon}</div><p style="text-align: center;">${escapedMessage}</p>`,
        buttons: [
            {
                text: '确定',
                className: 'btn-primary',
                onClick: onClose
            }
        ],
        closeOnOutsideClick: false
    });

    // 记录性能
    performanceMarks.showAlert = performance.now() - startTime;
}

/**
 * 显示加载对话框
 * @param {string} message - 加载消息
 * @returns {function} 关闭加载对话框的函数
 */
function showLoading(message = '加载中...') {
    // 记录性能开始时间
    const startTime = performance.now();

    // 转义内容以避免XSS
    const escapedMessage = escapeHtml(message);

    showModal({
        title: '',
        content: `<div style="text-align: center;">
            <div class="loading-spinner" style="margin: 0 auto 20px;"></div>
            <p>${escapedMessage}</p>
        </div>`,
        buttons: [],
        closeOnOutsideClick: false
    });

    // 记录性能
    performanceMarks.showLoading = performance.now() - startTime;

    // 返回关闭函数
    return closeModal;
}

/**
 * HTML转义函数，防止XSS攻击
 * @param {string} text - 需要转义的文本
 * @returns {string} 转义后的文本
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// DOM加载完成后初始化
if (typeof document !== 'undefined') {
    // 使用requestAnimationFrame延迟初始化，不阻塞主渲染
    document.addEventListener('DOMContentLoaded', function () {
        requestAnimationFrame(() => {
            // 缓存所有[data-modal]元素
            const modalElements = document.querySelectorAll('[data-modal]');

            // 为带有data-modal属性的元素批量添加事件委托
            if (modalElements.length > 0) {
                // 寻找最近的共同祖先来进行事件委托
                let commonParent = modalElements[0].parentNode;
                modalElements.forEach(el => {
                    while (!commonParent.contains(el) && commonParent.parentNode) {
                        commonParent = commonParent.parentNode;
                    }
                });

                // 添加事件委托
                commonParent.addEventListener('click', function (e) {
                    const target = e.target.closest('[data-modal]');
                    if (target) {
                        const modalId = target.getAttribute('data-modal');
                        const modalElement = document.getElementById(modalId);

                        if (modalElement) {
                            const title = modalElement.getAttribute('data-title') || '提示';
                            const content = modalElement.innerHTML;

                            showModal({
                                title: title,
                                content: content
                            });
                        }
                    }
                });
            }
        });
    });
}
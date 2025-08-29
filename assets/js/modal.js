/**
 * 模态框功能JavaScript文件
 */

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
    
    // 创建模态框背景
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.style.position = 'fixed';
    modalOverlay.style.top = '0';
    modalOverlay.style.left = '0';
    modalOverlay.style.width = '100%';
    modalOverlay.style.height = '100%';
    modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modalOverlay.style.display = 'flex';
    modalOverlay.style.justifyContent = 'center';
    modalOverlay.style.alignItems = 'center';
    modalOverlay.style.zIndex = '10000';
    modalOverlay.style.opacity = '0';
    modalOverlay.style.transition = 'opacity 0.3s ease';
    
    // 创建模态框容器
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal-container';
    modalContainer.style.backgroundColor = 'white';
    modalContainer.style.borderRadius = '10px';
    modalContainer.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
    modalContainer.style.maxWidth = '500px';
    modalContainer.style.width = '90%';
    modalContainer.style.maxHeight = '80vh';
    modalContainer.style.display = 'flex';
    modalContainer.style.flexDirection = 'column';
    modalContainer.style.transform = 'translateY(-20px)';
    modalContainer.style.transition = 'transform 0.3s ease';
    
    // 创建模态框头部
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    modalHeader.style.padding = '20px';
    modalHeader.style.borderBottom = '1px solid #e0e0e0';
    modalHeader.style.display = 'flex';
    modalHeader.style.justifyContent = 'space-between';
    modalHeader.style.alignItems = 'center';
    
    // 添加标题
    const modalTitle = document.createElement('h3');
    modalTitle.className = 'modal-title';
    modalTitle.textContent = modalOptions.title;
    modalTitle.style.margin = '0';
    modalTitle.style.color = '#333';
    modalHeader.appendChild(modalTitle);
    
    // 添加关闭按钮
    const closeButton = document.createElement('button');
    closeButton.className = 'modal-close-btn';
    closeButton.innerHTML = '&times;';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.fontSize = '24px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.color = '#999';
    closeButton.style.padding = '0';
    closeButton.style.width = '30px';
    closeButton.style.height = '30px';
    closeButton.style.display = 'flex';
    closeButton.style.justifyContent = 'center';
    closeButton.style.alignItems = 'center';
    closeButton.style.borderRadius = '50%';
    closeButton.style.transition = 'all 0.3s ease';
    
    // 添加悬停效果
    closeButton.addEventListener('mouseenter', function() {
        this.style.backgroundColor = '#f0f0f0';
        this.style.color = '#666';
    });
    
    closeButton.addEventListener('mouseleave', function() {
        this.style.backgroundColor = 'transparent';
        this.style.color = '#999';
    });
    
    // 添加点击事件
    closeButton.addEventListener('click', function() {
        closeModal();
    });
    
    modalHeader.appendChild(closeButton);
    
    // 创建模态框内容
    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    modalBody.style.padding = '20px';
    modalBody.style.overflowY = 'auto';
    modalBody.style.flex = '1';
    modalBody.innerHTML = modalOptions.content;
    
    // 创建模态框底部
    const modalFooter = document.createElement('div');
    modalFooter.className = 'modal-footer';
    modalFooter.style.padding = '15px 20px';
    modalFooter.style.borderTop = '1px solid #e0e0e0';
    modalFooter.style.display = 'flex';
    modalFooter.style.justifyContent = 'flex-end';
    modalFooter.style.gap = '10px';
    
    // 添加按钮
    modalOptions.buttons.forEach(button => {
        const btn = document.createElement('button');
        btn.className = `btn ${button.className || ''}`;
        btn.textContent = button.text;
        btn.style.marginLeft = '10px';
        
        // 添加点击事件
        btn.addEventListener('click', function() {
            if (button.onClick) {
                // 如果回调返回false，则不关闭模态框
                if (button.onClick() !== false) {
                    closeModal();
                }
            } else {
                closeModal();
            }
        });
        
        modalFooter.appendChild(btn);
    });
    
    // 组装模态框
    modalContainer.appendChild(modalHeader);
    modalContainer.appendChild(modalBody);
    modalContainer.appendChild(modalFooter);
    modalOverlay.appendChild(modalContainer);
    
    // 添加到页面
    document.body.appendChild(modalOverlay);
    
    // 显示模态框（添加延迟以启用过渡效果）
    setTimeout(() => {
        modalOverlay.style.opacity = '1';
        modalContainer.style.transform = 'translateY(0)';
    }, 10);
    
    // 点击外部关闭模态框
    if (modalOptions.closeOnOutsideClick) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }
    
    // 阻止事件冒泡
    modalContainer.addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    // 添加ESC键关闭功能
    function handleEscKey(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    }
    
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
    const modalOverlay = document.querySelector('.modal-overlay');
    if (!modalOverlay) return;
    
    // 添加关闭动画
    modalOverlay.style.opacity = '0';
    
    const modalContainer = modalOverlay.querySelector('.modal-container');
    if (modalContainer) {
        modalContainer.style.transform = 'translateY(-20px)';
    }
    
    // 等待动画完成后移除元素
    setTimeout(() => {
        // 执行清理函数
        if (modalOverlay._cleanupFunctions) {
            modalOverlay._cleanupFunctions.forEach(fn => fn());
        }
        
        // 执行关闭回调
        if (typeof modalOverlay._onCloseCallback === 'function') {
            modalOverlay._onCloseCallback();
        }
        
        // 移除元素
        if (document.body.contains(modalOverlay)) {
            document.body.removeChild(modalOverlay);
        }
    }, 300);
}

/**
 * 显示确认对话框
 * @param {string} message - 确认消息
 * @param {function} onConfirm - 确认回调函数
 * @param {function} onCancel - 取消回调函数
 * @param {string} title - 对话框标题
 */
function showConfirm(message, onConfirm, onCancel, title = '确认') {
    showModal({
        title: title,
        content: `<p>${message}</p>`,
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
}

/**
 * 显示提示对话框
 * @param {string} message - 提示消息
 * @param {string} type - 消息类型：'success', 'error', 'info', 'warning'
 * @param {function} onClose - 关闭回调函数
 */
function showAlert(message, type = 'info', onClose) {
    // 根据类型设置图标和标题
    let icon = 'ℹ️';
    let title = '提示';
    
    switch(type) {
        case 'success':
            icon = '✅';
            title = '成功';
            break;
        case 'error':
            icon = '❌';
            title = '错误';
            break;
        case 'warning':
            icon = '⚠️';
            title = '警告';
            break;
        case 'info':
        default:
            icon = 'ℹ️';
            title = '提示';
    }
    
    showModal({
        title: title,
        content: `<div style="text-align: center; font-size: 48px; margin-bottom: 15px;">${icon}</div><p style="text-align: center;">${message}</p>`,
        buttons: [
            {
                text: '确定',
                className: 'btn-primary',
                onClick: onClose
            }
        ],
        closeOnOutsideClick: false
    });
}

/**
 * 显示加载对话框
 * @param {string} message - 加载消息
 * @returns {function} 关闭加载对话框的函数
 */
function showLoading(message = '加载中...') {
    showModal({
        title: '',
        content: `<div style="text-align: center;">
            <div class="loading-spinner" style="margin: 0 auto 20px;"></div>
            <p>${message}</p>
        </div>`,
        buttons: [],
        closeOnOutsideClick: false
    });
    
    // 添加加载动画样式
    addLoadingSpinnerStyle();
    
    // 返回关闭函数
    return closeModal;
}

/**
 * 添加加载动画样式
 */
function addLoadingSpinnerStyle() {
    // 检查是否已添加样式
    if (document.getElementById('loading-spinner-style')) {
        return;
    }
    
    const style = document.createElement('style');
    style.id = 'loading-spinner-style';
    style.textContent = `
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
        
        .modal-overlay {
            backdrop-filter: blur(2px);
        }
        
        .modal-body p {
            margin: 0;
            color: #666;
            line-height: 1.6;
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

// DOM加载完成后初始化
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        // 为带有data-modal属性的元素添加点击事件
        document.querySelectorAll('[data-modal]').forEach(element => {
            element.addEventListener('click', function() {
                const modalId = this.getAttribute('data-modal');
                const modalElement = document.getElementById(modalId);
                
                if (modalElement) {
                    const title = modalElement.getAttribute('data-title') || '提示';
                    const content = modalElement.innerHTML;
                    
                    showModal({
                        title: title,
                        content: content
                    });
                }
            });
        });
    });
}
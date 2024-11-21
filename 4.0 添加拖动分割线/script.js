let isInitialized = false;

class EventManager {
    constructor() {
        // 初始化状态
        this.events = [];
        this.partitions = [];
        this.currentPartition = null;
        this.titleSize = 20;
        this.titleColor = '#333333';
        this.showCreationDate = false;
        this.urgentIcon = 'warning';
        this.urgentIconColor = '#ff0000';
        this.currentView = 'all';
        this.currentMode = 'grid';
        this.listColumns = 1;
        this.sortMode = 'deadline';
        this.sortDirection = 'asc';
        this.currentTheme = 'theme1';

        // 添加调试日志
        console.log('EventManager 实例已创建');

        // 等待 DOM 加载完成后初始化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                console.log('DOM已加载，开始初始化');
                this.initializeApp();
            });
        } else {
            console.log('DOM已经加载完成，直接初始化');
            this.initializeApp();
        }
    }

    initializeApp() {
        if (isInitialized) return; // 防止重复初始化
        
        try {
            console.log('开始初始化应用');
            
            // 初始化 DOM 元素
            this.initializeDOM();
            console.log('DOM元素初始化完成');

            // 加载保存的数据
            this.loadEvents();
            console.log('事件加载完成，当前事件数量:', this.events.length);
            
            this.loadPartitions();
            console.log('分区加载完成，当前分区数量:', this.partitions.length);

            // 绑定事件监听器
            this.bindEvents();
            console.log('事件监听器绑定完成');

            // 初始化控件
            this.initializeControls();
            console.log('控件初始化完成');

            // 初始化排序控件
            this.initializeSortControls();
            console.log('排序控件初始化完成');

            // 绑定分区相关事件
            this.bindPartitionEvents();
            console.log('分区事件绑定完成');

            // 渲染分区列表
            this.renderPartitionList();
            console.log('分区列表渲染完成');

            // 开始倒计时更新
            this.startCountdown();
            console.log('倒计时更新已启动');

            // 初始渲染
            this.renderEvents();
            console.log('初始渲染完成');

            // 更新分区选择下拉框
            this.updatePartitionSelect();

            // 初始化侧边栏调整器
            this.initializeSidebarResizer();
            
            isInitialized = true;
        } catch (error) {
            console.error('应用初始化错误:', error);
        }
    }

    initializeDOM() {
        try {
            // 事件相关元素
            this.eventList = document.getElementById('eventList');
            console.log('事件列表容器:', this.eventList);

            this.addEventBtn = document.getElementById('addEventBtn');
            console.log('添加事件按钮:', this.addEventBtn);

            this.eventModal = document.getElementById('event-modal');
            console.log('事件模态框:', this.eventModal);

            this.eventForm = document.getElementById('event-form');
            console.log('事件表单:', this.eventForm);

            this.eventCloseBtn = this.eventModal?.querySelector('.close-modal');
            console.log('事件关闭按钮:', this.eventCloseBtn);

            // 分区相关元素
            this.addPartitionBtn = document.querySelector('.add-partition-btn');
            console.log('添加分区按钮:', this.addPartitionBtn);

            this.partitionModal = document.getElementById('partition-modal');
            console.log('分区模态框:', this.partitionModal);

            this.partitionForm = document.getElementById('partition-form');
            console.log('分区表单:', this.partitionForm);

            this.partitionList = document.getElementById('partition-list');
            console.log('分区列表:', this.partitionList);

            // 控制相关元素
            this.viewButtons = document.querySelectorAll('.toggle-buttons button');
            this.showCreationDateCheckbox = document.getElementById('showCreationDate');
            this.urgentIconSelect = document.getElementById('urgentIcon');
            this.urgentIconColorInput = document.getElementById('urgentIconColor');
            this.sortModeSelect = document.getElementById('sortMode');
            this.titleSizeInput = document.getElementById('titleSize');
            this.toggleHistoryBtn = document.getElementById('toggleHistory');

            // 验证必要的元素是否存在
            if (!this.eventList) throw new Error('事件列表容器未找到');
            if (!this.addEventBtn) throw new Error('添加事件按钮未找到');
            if (!this.eventModal) throw new Error('事件模态框未找到');
            if (!this.eventForm) throw new Error('事件表单未找到');
            if (!this.addPartitionBtn) console.warn('添加分区按钮未找到');
            if (!this.partitionModal) console.warn('分区模态框未找到');
            if (!this.partitionForm) console.warn('分区表单未找到');
            if (!this.partitionList) console.warn('分区列表未找到');

        } catch (error) {
            console.error('DOM初始化错误:', error);
            throw error; // 重新抛出错误以便上层捕获
        }
    }

    loadEvents() {
        try {
            const savedEvents = localStorage.getItem('events');
            console.log('从localStorage加载的事件数据:', savedEvents);
            
            if (savedEvents) {
                this.events = JSON.parse(savedEvents);
                console.log('解析后的事件数据:', this.events);
            } else {
                console.log('没有找到保存的事件数据');
            }
        } catch (error) {
            console.error('加载事件错误:', error);
        }
    }

    renderEvents() {
        try {
            console.log('开始渲染事件，当前视图:', this.currentView);
            
            if (!this.eventList) {
                throw new Error('事件列表容器未找到');
            }

            // 清空事件列表
            this.eventList.innerHTML = '';
            
            // 根据当前视图筛选事件
            let filteredEvents = [...this.events];
            
            // 先进行视图筛选
            switch (this.currentView) {
                case 'history':
                    filteredEvents = filteredEvents.filter(event => event.completed);
                    break;
                case 'urgent':
                    filteredEvents = filteredEvents.filter(event => {
                        const timeLeft = this.calculateTimeLeft(event.deadline);
                        return !event.completed && timeLeft.total <= (event.urgentTime || 24) * 60 * 60 * 1000;
                    });
                    break;
                default:
                    if (this.currentPartition) {
                        filteredEvents = filteredEvents.filter(event => 
                            event.partitionId === this.currentPartition && !event.completed
                        );
                    } else {
                        filteredEvents = filteredEvents.filter(event => !event.completed);
                    }
                    break;
            }

            // 根据显示模式渲染事件
            if (this.currentMode === 'partition') {
                // 创建分区到事件的映射
                const partitionEvents = new Map();
                
                // 初始化分区的事件数组
                this.partitions.forEach(partition => {
                    partitionEvents.set(partition.id, []);
                });
                
                // 初始化"无分区"组
                partitionEvents.set(null, []);
                
                // 将事件分配到对应的分区
                filteredEvents.forEach(event => {
                    const partitionId = event.partitionId || null;
                    const events = partitionEvents.get(partitionId) || [];
                    events.push(event);
                    partitionEvents.set(partitionId, events);
                });
                
                // 对每个分区内的事件进行排序
                partitionEvents.forEach((events, partitionId) => {
                    events.sort((a, b) => {
                        switch (this.sortMode) {
                            case 'deadline':
                                const timeA = new Date(a.deadline).getTime();
                                const timeB = new Date(b.deadline).getTime();
                                return this.sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
                            
                            case 'created-desc':
                                const createTimeA = new Date(a.created).getTime();
                                const createTimeB = new Date(b.created).getTime();
                                return this.sortDirection === 'asc' ? createTimeA - createTimeB : createTimeB - createTimeA;
                            
                            case 'priority-desc':
                                const priorityMap = { high: 3, medium: 2, low: 1 };
                                const priorityA = priorityMap[a.priority] || 0;
                                const priorityB = priorityMap[b.priority] || 0;
                                return this.sortDirection === 'asc' ? priorityA - priorityB : priorityB - priorityA;
                            
                            case 'status':
                                return this.sortDirection === 'asc' 
                                    ? (a.completed ? 1 : 0) - (b.completed ? 1 : 0)
                                    : (b.completed ? 1 : 0) - (a.completed ? 1 : 0);
                            
                            default:
                                return 0;
                        }
                    });
                });
                
                // 渲染每个分区
                this.partitions.forEach(partition => {
                    const events = partitionEvents.get(partition.id) || [];
                    this.createPartitionSection(partition.name, partition, events, this.eventList);
                });
                
                // 渲染未分类事件
                const unclassifiedEvents = partitionEvents.get(null) || [];
                this.createPartitionSection('未分类事件', null, unclassifiedEvents, this.eventList);
                
            } else {
                // 网格视图或列表视图的排序和渲染逻辑保持不变
                filteredEvents.sort((a, b) => {
                    switch (this.sortMode) {
                        case 'deadline':
                            const timeA = new Date(a.deadline).getTime();
                            const timeB = new Date(b.deadline).getTime();
                            return this.sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
                        
                        case 'created-desc':
                            const createTimeA = new Date(a.created).getTime();
                            const createTimeB = new Date(b.created).getTime();
                            return this.sortDirection === 'asc' ? createTimeA - createTimeB : createTimeB - createTimeA;
                        
                        case 'priority-desc':
                            const priorityMap = { high: 3, medium: 2, low: 1 };
                            const priorityA = priorityMap[a.priority] || 0;
                            const priorityB = priorityMap[b.priority] || 0;
                            return this.sortDirection === 'asc' ? priorityA - priorityB : priorityB - priorityA;
                        
                        case 'status':
                            return this.sortDirection === 'asc' 
                                ? (a.completed ? 1 : 0) - (b.completed ? 1 : 0)
                                : (b.completed ? 1 : 0) - (a.completed ? 1 : 0);
                        
                        default:
                            return 0;
                    }
                });

                filteredEvents.forEach(event => {
                    const eventElement = this.createEventElement(event);
                    this.eventList.appendChild(eventElement);
                });
            }

            // 如果没有事件显示提示信息
            if (filteredEvents.length === 0) {
                const message = this.currentView === 'history' ? '暂无已完成事件' : 
                               this.currentPartition ? '该分区暂无事件' : '暂无事件';
                this.eventList.innerHTML = `<div class="no-events">${message}</div>`;
            }

        } catch (error) {
            console.error('渲染事件错误:', error);
        }
    }

    bindEvents() {
        try {
            // 事件模态框相关
            if (this.addEventBtn) {
                this.addEventBtn.addEventListener('click', () => {
                    console.log('点击添加事件按钮');
                    if (this.eventModal) {
                        this.eventForm.reset();
                        const now = new Date();
                        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                        document.getElementById('event-deadline').value = now.toISOString().slice(0, 16);
                        this.eventModal.style.display = 'block';
                    }
                });
            }

            // 绑定表单提交事件
            if (this.eventForm) {
                this.eventForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    console.log('提交事件表单');
                    this.createEvent();
                });
            }

            // 绑定关闭按钮事件
            if (this.eventCloseBtn) {
                this.eventCloseBtn.addEventListener('click', () => {
                    this.eventModal.style.display = 'none';
                });
            }

            // 点击模态框外部关闭
            window.addEventListener('click', (e) => {
                if (e.target === this.eventModal) {
                    this.eventModal.style.display = 'none';
                }
            });

            // 修改导航栏点击事件处
            document.querySelectorAll('.nav-links li').forEach(item => {
                item.addEventListener('click', (e) => {
                    // 移除所有激活状态
                    document.querySelectorAll('.nav-links li').forEach(li => {
                        li.classList.remove('active');
                    });
                    
                    // 添加当前项的激活状态
                    item.classList.add('active');
                    
                    // 获取并设置当前视图
                    const view = item.dataset.view;
                    this.currentView = view;
                    
                    // 重要：当点击"所有事件"时，重置当前分区
                    if (view === 'all') {
                        this.currentPartition = null;
                    }
                    
                    console.log('切换到视图:', view, '当前分区:', this.currentPartition);
                    
                    // 重新渲染事件列表
                    this.renderEvents();
                });
            });

        } catch (error) {
            console.error('绑定事件错误:', error);
        }
    }

    createEvent() {
        try {
            const title = document.getElementById('event-title').value.trim();
            const deadline = document.getElementById('event-deadline').value;
            const priority = document.getElementById('event-priority').value;
            const description = document.getElementById('event-description').value.trim();
            const urgentTime = parseInt(document.getElementById('event-urgent-time').value) || 24;
            const partitionId = document.getElementById('event-partition').value;

            console.log('创建事件:', { title, deadline, priority, description, urgentTime, partitionId });

            if (!title || !deadline) {
                alert('请填写必要信息！');
                return;
            }

            const event = {
                id: Date.now(),
                title,
                deadline: new Date(deadline),
                priority,
                description,
                urgentTime,
                partitionId: partitionId ? parseInt(partitionId) : null,
                created: new Date(),
                completed: false
            };

            this.events.push(event);
            console.log('事件已添加到列表，当前事件数量:', this.events.length);
            
            this.saveEvents();
            this.renderEvents();
            
            this.eventModal.style.display = 'none';
            this.eventForm.reset();
            
            // 显示成功提示
            this.showToast('事件创建成功');

        } catch (error) {
            console.error('创建事件错误:', error);
            alert('创建事件失败，请重试！');
        }
    }

    saveEvents() {
        try {
            localStorage.setItem('events', JSON.stringify(this.events));
            console.log('事件已保存到localStorage');
        } catch (error) {
            console.error('保存事件错误:', error);
        }
    }

    createEventElement(event) {
        try {
            console.log('创建事件元素:', event);
            
            const timeLeft = this.calculateTimeLeft(event.deadline);
            const isUrgent = timeLeft.total <= (event.urgentTime || 24) * 60 * 60 * 1000;
            const partition = this.partitions.find(p => p.id === event.partitionId);

            const eventElement = document.createElement('div');
            eventElement.className = `event-card ${event.priority} ${event.completed ? 'completed' : ''}`;
            eventElement.dataset.eventId = event.id;

            eventElement.innerHTML = `
                <div class="checkbox-wrapper">
                    <input type="checkbox" ${event.completed ? 'checked' : ''}>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    ${isUrgent && !event.completed ? 
                        `<span class="material-icons urgent-icon" style="color: ${this.urgentIconColor}">${this.urgentIcon}</span>` 
                        : ''
                    }
                    <h3 class="event-title">${event.title}</h3>
                </div>
                <div class="countdown">${this.formatTimeLeft(timeLeft, event)}</div>
                <p class="event-description">${event.description || '无描述'}</p>
                ${this.showCreationDate ? 
                    `<div class="creation-date">创建于: ${new Date(event.created).toLocaleString()}</div>` 
                    : ''
                }
                <div class="event-footer">
                    <span class="priority-badge">${this.getPriorityText(event.priority)}</span>
                    ${partition ? 
                        `<span class="partition-badge" style="background-color: ${partition.color}20; color: ${partition.color}">
                            <span class="material-icons" style="font-size: 14px;">folder</span>
                            ${partition.name}
                        </span>` 
                        : ''
                    }
                </div>
            `;

            // 修改复选框事件监听器
            const checkbox = eventElement.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('click', (e) => {
                e.stopPropagation();  // 阻止事件冒泡
            });
            
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();  // 阻止事件冒泡
                this.toggleEventComplete(event.id);
            });

            // 修改卡片点击事件
            eventElement.addEventListener('click', (e) => {
                // 如果点击的是复选框，不打开编辑模态框
                if (!e.target.matches('input[type="checkbox"]')) {
                    this.showEventEditModal(event);
                }
            });

            return eventElement;
        } catch (error) {
            console.error('创建事件元素错误:', error);
            return document.createElement('div');
        }
    }

    calculateTimeLeft(deadline) {
        try {
            const total = new Date(deadline) - new Date();
            const seconds = Math.floor((total / 1000) % 60);
            const minutes = Math.floor((total / 1000 / 60) % 60);
            const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
            const days = Math.floor(total / (1000 * 60 * 60 * 24));

            return { total, days, hours, minutes, seconds };
        } catch (error) {
            console.error('计算剩余时间错误:', error);
            return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
        }
    }

    formatTimeLeft(timeLeft, event) {
        if (timeLeft.total <= 0) {
            return '<span style="color: var(--danger-color)">已过期</span>';
        }

        if (timeLeft.days > 0) {
            return `剩余 ${timeLeft.days} 天 ${timeLeft.hours} 小时`;
        }

        // 计算总小时数（用于与紧急时间比较）
        const totalHours = timeLeft.days * 24 + timeLeft.hours + timeLeft.minutes / 60 + timeLeft.seconds / 3600;
        
        // 如果总小时数小于等于紧急时间，使用"剩余"前缀
        if (totalHours <= (event.urgentTime || 24)) {
            return `剩余${timeLeft.hours} h ${String(timeLeft.minutes).padStart(2, '0')} min ${String(timeLeft.seconds).padStart(2, '0')} s`;
        }

        // 其他情况
        return `${timeLeft.hours} h ${String(timeLeft.minutes).padStart(2, '0')} min ${String(timeLeft.seconds).padStart(2, '0')} s`;
    }

    getPriorityText(priority) {
        const priorityMap = {
            'low': '低优先级',
            'medium': '中优先级',
            'high': '高优先级'
        };
        return priorityMap[priority] || priority;
    }

    toggleEventComplete(id) {
        const event = this.events.find(e => e.id === id);
        if (event) {
            event.completed = !event.completed;
            if (event.completed) {
                event.completedAt = new Date().getTime();
            } else {
                delete event.completedAt;
            }
            this.saveEvents();
            this.renderEvents();
        }
    }

    startCountdown() {
        setInterval(() => {
            if (this.currentView !== 'history') {
                this.renderEvents();
            }
        }, 1000);
    }

    loadPartitions() {
        try {
            const savedPartitions = localStorage.getItem('partitions');
            console.log('从localStorage加载的分区数据:', savedPartitions);
            
            if (savedPartitions) {
                this.partitions = JSON.parse(savedPartitions);
                console.log('解析后的分区数据:', this.partitions);
            } else {
                console.log('没有找到保存的分区数据');
                this.partitions = []; // 确保分区数组被初始化
            }
        } catch (error) {
            console.error('加载分区错误:', error);
            this.partitions = []; // 出错时也确保分区数组被初始化
        }
    }

    savePartitions() {
        try {
            localStorage.setItem('partitions', JSON.stringify(this.partitions));
            console.log('分区已保存到localStorage');
        } catch (error) {
            console.error('保存分区错误:', error);
        }
    }

    renderPartitionList() {
        try {
            if (!this.partitionList) {
                console.warn('分区列表容器未找到');
                return;
            }

            this.partitionList.innerHTML = '';
            this.partitions.forEach(partition => {
                const li = document.createElement('li');
                li.dataset.partitionId = partition.id;
                li.innerHTML = `
                    <div class="partition-list-item">
                        <span class="material-icons" style="color: ${partition.color}">folder</span>
                        <span>${partition.name}</span>
                    </div>
                `;

                // 左键点击筛选事件
                li.addEventListener('click', () => this.filterByPartition(partition.id));

                // 右键菜单
                li.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.showPartitionContextMenu(e, partition);
                });

                this.partitionList.appendChild(li);
            });
        } catch (error) {
            console.error('渲染分区列表错误:', error);
        }
    }

    showPartitionContextMenu(event, partition) {
        // 移除已存在的上下文菜单
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        // 创建上下文菜单
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.innerHTML = `
            <div class="context-menu-item" data-action="rename">
                <span class="material-icons">edit</span>
                重命名
            </div>
            <div class="context-menu-item" data-action="delete">
                <span class="material-icons">delete</span>
                删除分区
            </div>
        `;

        // 设置菜单位置
        menu.style.left = `${event.pageX}px`;
        menu.style.top = `${event.pageY}px`;

        // 添加菜单项点击事件
        menu.addEventListener('click', (e) => {
            const action = e.target.closest('.context-menu-item')?.dataset.action;
            if (action === 'rename') {
                this.renamePartition(partition);
            } else if (action === 'delete') {
                this.deletePartition(partition.id);
            }
            menu.remove();
        });

        // 点击其他地方关闭菜单
        document.addEventListener('click', () => menu.remove(), { once: true });

        document.body.appendChild(menu);
    }

    renamePartition(partition) {
        const newName = prompt('请输入新的分区名称：', partition.name);
        if (newName && newName.trim() !== '') {
            partition.name = newName.trim();
            this.savePartitions();
            this.renderPartitionList();
            this.updatePartitionSelect();
            this.showToast('分区已重命名');
        }
    }

    filterByPartition(partitionId) {
        try {
            this.currentPartition = partitionId;
            this.currentView = 'all'; // 切换到所有事件视图
            
            // 更新导航栏选中状态
            document.querySelectorAll('.nav-links li').forEach(item => {
                item.classList.remove('active');
            });
            
            // 如果是分区视图，高亮显示对应的分区项
            const partitionItem = document.querySelector(`[data-partition-id="${partitionId}"]`);
            if (partitionItem) {
                partitionItem.classList.add('active');
            }

            console.log('过滤分区:', partitionId);
            this.renderEvents();
        } catch (error) {
            console.error('过滤分区错误:', error);
        }
    }

    initializeControls() {
        try {
            console.log('开始初始化控件');

            // 显示模式控制
            this.viewButtons.forEach(button => {
                button.addEventListener('click', () => {
                    console.log('切换显示模式:', button.dataset.mode);
                    this.changeView(button.dataset.mode);
                });
            });

            // 显示创建日期控制
            if (this.showCreationDateCheckbox) {
                this.showCreationDateCheckbox.addEventListener('change', (e) => {
                    console.log('切换显示创建日期:', e.target.checked);
                    this.showCreationDate = e.target.checked;
                    this.renderEvents();
                });
            }

            // 紧急图标控制
            if (this.urgentIconSelect) {
                this.urgentIconSelect.addEventListener('change', (e) => {
                    console.log('更改紧急图标:', e.target.value);
                    this.urgentIcon = e.target.value;
                    this.renderEvents();
                });
            }

            if (this.urgentIconColorInput) {
                this.urgentIconColorInput.addEventListener('input', (e) => {
                    console.log('更改紧急图标颜色:', e.target.value);
                    this.urgentIconColor = e.target.value;
                    this.renderEvents();
                });
            }

            // 标题设置控制
            if (this.titleSizeInput) {
                this.titleSizeInput.addEventListener('input', (e) => {
                    const newSize = e.target.value;
                    console.log('更改事件标题大小:', newSize + 'px');
                    
                    // 直接设置到所有事件标题
                    const eventTitles = document.querySelectorAll('.event-title');
                    eventTitles.forEach(title => {
                        title.style.fontSize = `${newSize}px`;
                    });
                    
                    // 同时更新CSS变量
                    document.documentElement.style.setProperty('--title-size', `${newSize}px`);
                    
                    // 保存到localStorage
                    localStorage.setItem('titleSize', newSize);
                });
                
                // 加载保存的大小
                const savedSize = localStorage.getItem('titleSize');
                if (savedSize) {
                    this.titleSizeInput.value = savedSize;
                    document.documentElement.style.setProperty('--title-size', `${savedSize}px`);
                }
            }

            // 添加列数控制
            const listColumnsSelect = document.getElementById('listColumns');
            if (listColumnsSelect) {
                listColumnsSelect.value = this.listColumns;
                listColumnsSelect.addEventListener('change', (e) => {
                    console.log('更改列数:', e.target.value);
                    this.listColumns = parseInt(e.target.value);
                    if (this.currentMode === 'list') {
                        this.changeView('list');
                    }
                });
            }

            // 初始化主题切换
            const themeSelect = document.getElementById('themeSelect');
            if (themeSelect) {
                // 从本地存储加载保存的主题
                const savedTheme = localStorage.getItem('theme') || 'theme1';
                this.currentTheme = savedTheme;
                themeSelect.value = savedTheme;
                document.body.className = savedTheme;

                themeSelect.addEventListener('change', (e) => {
                    const newTheme = e.target.value;
                    console.log('切换主题:', newTheme);
                    
                    // 移除旧主题类名
                    document.body.classList.remove(this.currentTheme);
                    
                    // 添加新主题类名
                    document.body.classList.add(newTheme);
                    
                    // 更新当前主题
                    this.currentTheme = newTheme;
                    
                    // 保存主题设置到本地存储
                    localStorage.setItem('theme', newTheme);
                });
            }

            console.log('控件初始化完成');
        } catch (error) {
            console.error('初始化控件错误:', error);
        }
    }

    changeView(mode) {
        try {
            console.log('切换视图模式:', mode);
            this.currentMode = mode;
            
            if (this.eventList) {
                // 清除所有已有的类名
                this.eventList.className = '';
                
                // 添加新的视图类名
                switch(mode) {
                    case 'list':
                        this.eventList.classList.add('list-view');
                        this.eventList.classList.add(`columns-${this.listColumns}`);
                        document.querySelector('.list-columns-control').style.display = 'flex';
                        break;
                    case 'partition':
                        this.eventList.classList.add('partition-view');
                        document.querySelector('.list-columns-control').style.display = 'none';
                        break;
                    default: // grid
                        this.eventList.classList.add('grid-view');
                        document.querySelector('.list-columns-control').style.display = 'none';
                        break;
                }
                
                // 更新按钮状态
                this.viewButtons.forEach(button => {
                    button.classList.toggle('active', button.dataset.mode === mode);
                });
                
                // 重新渲染事件列表
                this.renderEvents();
            }
        } catch (error) {
            console.error('切换视图错误:', error);
        }
    }

    initializeSortControls() {
        try {
            console.log('初始化排序控件');
            
            if (this.sortModeSelect) {
                // 设置初始值
                this.sortModeSelect.value = this.sortMode;
                
                // 添加事件监听器
                this.sortModeSelect.addEventListener('change', (e) => {
                    console.log('更改排序方式:', e.target.value);
                    this.sortMode = e.target.value;
                    this.renderEvents();
                });
            }

            // 排序方向按钮
            const toggleSortDirectionBtn = document.getElementById('toggleSortDirection');
            if (toggleSortDirectionBtn) {
                toggleSortDirectionBtn.addEventListener('click', () => {
                    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
                    console.log('切换排序方向:', this.sortDirection);
                    
                    const icon = toggleSortDirectionBtn.querySelector('.material-icons');
                    if (icon) {
                        icon.textContent = this.sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
                    }
                    
                    this.renderEvents();
                });
            }

            console.log('排序控件初始化完成');
        } catch (error) {
            console.error('初始化排序控件错误:', error);
        }
    }

    bindPartitionEvents() {
        // 添加分区按钮点击事件
        if (this.addPartitionBtn) {
            this.addPartitionBtn.addEventListener('click', () => {
                this.partitionModal.style.display = 'block';
                this.partitionForm.reset();
            });
        }

        // 分区表单提交事件
        if (this.partitionForm) {
            this.partitionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createPartition();
            });
        }

        // 分区模态框关闭按钮
        const partitionCloseBtn = this.partitionModal?.querySelector('.close-modal');
        if (partitionCloseBtn) {
            partitionCloseBtn.addEventListener('click', () => {
                this.partitionModal.style.display = 'none';
            });
        }

        // 点击模态框外部关闭
        window.addEventListener('click', (e) => {
            if (e.target === this.partitionModal) {
                this.partitionModal.style.display = 'none';
            }
        });

        // 分区编辑和删除
        document.getElementById('delete-partition-btn')?.addEventListener('click', () => {
            if (this.currentPartition) {
                this.deletePartition(this.currentPartition);
            }
        });
    }

    createPartition() {
        try {
            const name = document.getElementById('partition-name').value.trim();
            const color = document.getElementById('partition-color').value;

            if (!name) {
                alert('请输入分区名称！');
                return;
            }

            const partition = {
                id: Date.now(),
                name,
                color,
                created: new Date()
            };

            this.partitions.push(partition);
            this.savePartitions();
            this.renderPartitionList();
            this.partitionModal.style.display = 'none';
            this.partitionForm.reset();

            // 更新分区选择下拉框
            this.updatePartitionSelect();
            
            // 添加成功提示
            this.showToast('分区创建成功');

            console.log('创建分区成功:', partition);

        } catch (error) {
            console.error('创建分区错误:', error);
            alert('创建分区失败，请重试！');
        }
    }

    deletePartition(partitionId) {
        try {
            if (confirm('确定要删除这个分区吗？分区内的件将被移至未分类。')) {
                // 更新所有属于该分区的事件
                this.events = this.events.map(event => {
                    if (event.partitionId === partitionId) {
                        return { ...event, partitionId: null };
                    }
                    return event;
                });

                // 删除分区
                this.partitions = this.partitions.filter(p => p.id !== partitionId);
                
                // 保存更改
                this.savePartitions();
                this.saveEvents();
                
                // 更新UI
                this.renderPartitionList();
                this.renderEvents();
                
                // 关闭编辑模态框
                document.getElementById('partition-edit-modal').style.display = 'none';
                
                // 显示成功提示
                this.showToast('分区已删除');
            }
        } catch (error) {
            console.error('删除分区错误:', error);
            alert('删除分区失败，请重试！');
        }
    }

    editPartition(partitionId) {
        const partition = this.partitions.find(p => p.id === partitionId);
        if (!partition) return;

        // 填充编表单
        document.getElementById('edit-partition-name').value = partition.name;
        document.getElementById('edit-partition-color').value = partition.color;
        
        // 记录当前编辑的分区ID
        this.currentPartition = partitionId;
        
        // 显示编辑模态框
        document.getElementById('partition-edit-modal').style.display = 'block';
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        // 2秒后移除提示
        setTimeout(() => {
            toast.remove();
        }, 2000);
    }

    // 更新分区选择下拉框
    updatePartitionSelect() {
        try {
            const partitionSelects = document.querySelectorAll('.partition-select');
            partitionSelects.forEach(select => {
                // 保存当前选中的值
                const currentValue = select.value;
                
                // 更新选项
                select.innerHTML = `
                    <option value="">无分区</option>
                    ${this.partitions.map(partition => `
                        <option value="${partition.id}" 
                                ${currentValue === partition.id.toString() ? 'selected' : ''}>
                            ${partition.name}
                        </option>
                    `).join('')}
                `;
            });

            console.log('更新分区选择器:', {
                selectorsCount: partitionSelects.length,
                availablePartitions: this.partitions
            });
        } catch (error) {
            console.error('更新分区选择器错误:', error);
        }
    }

    showEventEditModal(event) {
        try {
            const editModal = document.getElementById('edit-event-modal');
            const editForm = document.getElementById('edit-event-form');
            
            // 确保编辑模态框中的分区选择器有正确的类名
            const partitionSelect = document.getElementById('edit-event-partition');
            if (!partitionSelect.classList.contains('partition-select')) {
                partitionSelect.classList.add('partition-select');
            }
            
            // 更新分区选择器选项
            this.updatePartitionSelect();
            
            // 填充表单数据
            document.getElementById('edit-event-title').value = event.title;
            document.getElementById('edit-event-deadline').value = new Date(event.deadline).toISOString().slice(0, 16);
            document.getElementById('edit-event-priority').value = event.priority;
            document.getElementById('edit-event-description').value = event.description || '';
            document.getElementById('edit-event-completed').checked = event.completed;
            document.getElementById('edit-event-partition').value = event.partitionId || '';

            console.log('打开编辑模态框:', {
                eventId: event.id,
                currentPartitionId: event.partitionId,
                availablePartitions: this.partitions
            });

            // 显示模态框
            editModal.style.display = 'block';

            // 移除旧的事件监听器（如果存在）
            const oldHandler = editForm._submitHandler;
            if (oldHandler) {
                editForm.removeEventListener('submit', oldHandler);
            }

            // 创建新的提交处理函数
            const handleSubmit = (e) => {
                e.preventDefault();
                const newPartitionId = document.getElementById('edit-event-partition').value;
                
                this.updateEvent(event.id, {
                    title: document.getElementById('edit-event-title').value,
                    deadline: new Date(document.getElementById('edit-event-deadline').value),
                    priority: document.getElementById('edit-event-priority').value,
                    description: document.getElementById('edit-event-description').value,
                    completed: document.getElementById('edit-event-completed').checked,
                    partitionId: newPartitionId === '' ? null : newPartitionId
                });
                
                console.log('提交编辑表单:', {
                    eventId: event.id,
                    newPartitionId: newPartitionId
                });

                editModal.style.display = 'none';
            };

            // 保存处理函数引用以便后续移除
            editForm._submitHandler = handleSubmit;
            editForm.addEventListener('submit', handleSubmit);

            // 关闭按钮事件
            const closeBtn = editModal.querySelector('.close-modal');
            closeBtn.onclick = () => {
                editModal.style.display = 'none';
            };

            // 点击模态框外部关闭
            const handleClickOutside = (e) => {
                if (e.target === editModal) {
                    editModal.style.display = 'none';
                }
            };
            editModal.addEventListener('click', handleClickOutside);

        } catch (error) {
            console.error('显示编辑模态框错误:', error);
            this.showToast('打开编辑窗口失败，请重试');
        }
    }

    updateEvent(eventId, newData) {
        try {
            const event = this.events.find(e => e.id === eventId);
            if (event) {
                // 确保 partitionId 被正确处理：转换为数字或 null
                const updatedEvent = {
                    ...event,
                    ...newData,
                    partitionId: newData.partitionId ? parseInt(newData.partitionId) : null
                };

                console.log('更新事件:', {
                    eventId,
                    oldPartitionId: event.partitionId,
                    newPartitionId: updatedEvent.partitionId,
                    rawNewPartitionId: newData.partitionId
                });

                // 更新事件数组中的事件
                this.events = this.events.map(e => 
                    e.id === eventId ? updatedEvent : e
                );

                // 保存到本地存储
                this.saveEvents();

                // 如果前在分区视图，且事件的分区发生改变
                if (this.currentPartition) {
                    // 如果事件被移出当前分区，返回到所有事件视图
                    if (parseInt(this.currentPartition) !== updatedEvent.partitionId) {
                        this.currentPartition = null;
                        this.currentView = 'all';
                        // 更新导航栏状态
                        document.querySelectorAll('.nav-links li').forEach(item => {
                            item.classList.remove('active');
                        });
                        document.querySelector('[data-view="all"]').classList.add('active');
                    }
                }

                // 重新渲染事件列表
                this.renderEvents();
                
                // 显示成功提示
                this.showToast('事件已更新');
            }
        } catch (error) {
            console.error('更新事件错误:', error);
            this.showToast('更新事件失败，请重试');
        }
    }

    createPartitionSection(name, partition, events, container) {
        // 创建分区容器
        const partitionContainer = document.createElement('div');
        partitionContainer.className = 'partition';
        partitionContainer.style.display = 'flex'; // 添加flex布局
        
        // 创建分区标题
        const partitionHeader = document.createElement('div');
        partitionHeader.className = 'partition-header';
        
        if (partition) {
            partitionHeader.style.backgroundColor = `${partition.color}10`;
            partitionHeader.innerHTML = `
                <div class="partition-title-group">
                    <h3 class="partition-name" style="color: ${partition.color}">${name}</h3>
                    <span class="partition-count">${events.length} 个事件</span>
                </div>
            `;
        } else {
            partitionHeader.innerHTML = `
                <div class="partition-title-group">
                    <h3 class="partition-name">未分类事件</h3>
                    <span class="partition-count">${events.length} 个事件</span>
                </div>
            `;
        }
        
        // 创建事件容器
        const eventsContainer = document.createElement('div');
        eventsContainer.className = this.currentMode === 'list' 
            ? `list-view columns-${this.listColumns}`
            : 'grid-view';
        eventsContainer.style.flex = '1'; // 添加flex属性
        
        if (events.length > 0) {
            events.forEach(event => {
                const eventElement = this.createEventElement(event);
                eventsContainer.appendChild(eventElement);
            });
        } else {
            eventsContainer.innerHTML = `
                <div class="no-events">
                    <span class="material-icons">inbox</span>
                    <p>暂无事件</p>
                </div>
            `;
        }
        
        partitionContainer.appendChild(partitionHeader);
        partitionContainer.appendChild(eventsContainer);
        container.appendChild(partitionContainer);
    }

    initializeSidebarResizer() {
        const resizer = document.querySelector('.sidebar-resizer');
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        
        if (!resizer || !sidebar || !mainContent) {
            console.error('Required elements not found');
            return;
        }

        let startX, startWidth;

        const doResize = (e) => {
            const newWidth = Math.max(200, Math.min(500, startWidth + (e.pageX - startX)));
            sidebar.style.width = `${newWidth}px`;
            mainContent.style.marginLeft = `${newWidth}px`;
            resizer.style.left = `${newWidth}px`;
            localStorage.setItem('sidebarWidth', newWidth);
        };

        const stopResize = () => {
            document.body.classList.remove('resizing');
            resizer.classList.remove('resizing');
            // 移除临时事件监听器
            document.removeEventListener('mousemove', doResize);
            document.removeEventListener('mouseup', stopResize);
        };

        const startResize = (e) => {
            startX = e.pageX;
            startWidth = parseInt(getComputedStyle(sidebar).width);
            document.body.classList.add('resizing');
            resizer.classList.add('resizing');
            // 添加临时事件监听器
            document.addEventListener('mousemove', doResize);
            document.addEventListener('mouseup', stopResize);
        };

        // 只在 mousedown 时绑定事件监听器
        resizer.addEventListener('mousedown', startResize);

        // 加载保存的宽度
        const savedWidth = localStorage.getItem('sidebarWidth');
        if (savedWidth) {
            const width = parseInt(savedWidth);
            sidebar.style.width = `${width}px`;
            mainContent.style.marginLeft = `${width}px`;
            resizer.style.left = `${width}px`;
        }
    }
}

// 确保在 DOM 加载完成后再初始化应用
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM内容加载完成，准备初始化EventManager');
    window.eventManager = new EventManager();
});
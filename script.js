document.addEventListener('DOMContentLoaded', () => {
    // Инициализация состояния приложения
    const appState = {
        currentUser: null,
        currentGroup: null,
        userGroups: [],
        groups: [],
        files: [],
        selectedFiles: [],
        isAuthenticated: false
    };

    // DOM элементы
    const elements = {
        // Кнопки авторизации
        loginBtn: document.getElementById('loginBtn'),
        registerBtn: document.getElementById('registerBtn'),
        logoutBtn: document.getElementById('logoutBtn'),
        
        // Секции пользователя
        authButtons: document.getElementById('authButtons'),
        userProfile: document.getElementById('userProfile'),
        userAvatar: document.getElementById('userAvatar'),
        userName: document.getElementById('userName'),
        
        // Группы
        userGroups: document.getElementById('userGroups'),
        createGroupBtn: document.getElementById('createGroupBtn'),
        
        // Файлы
        fileList: document.getElementById('fileList'),
        uploadFileBtn: document.getElementById('uploadFileBtn'),
        fileSearchInput: document.getElementById('fileSearchInput'),
        uploadFileList: document.getElementById('uploadFileList'),
        
        // Информация о группе
        currentGroupName: document.getElementById('currentGroupName'),
        membersList: document.getElementById('membersList'),
        tasksList: document.getElementById('tasksList'),
        
        // Чат
        chatMessages: document.getElementById('chatMessages'),
        messageInput: document.getElementById('messageInput'),
        sendMessageBtn: document.getElementById('sendMessageBtn'),
        attachFileBtn: document.getElementById('attachFileBtn'),
        
        // Модальные окна
        loginModal: document.getElementById('loginModal'),
        registerModal: document.getElementById('registerModal'),
        createGroupModal: document.getElementById('createGroupModal'),
        uploadFileModal: document.getElementById('uploadFileModal'),
        assignTaskModal: document.getElementById('assignTaskModal'),
        
        // Тултип
        groupTooltip: document.getElementById('groupTooltip'),
        
        // Тосты
        toastContainer: document.getElementById('toastContainer')
    };

    // Загрузка данных из JSON файлов
    function loadData() {
        let groupsLoaded = false;
        let filesLoaded = false;
        
        // Проверка загрузки всех данных
        function checkDataLoaded() {
            if (groupsLoaded && filesLoaded) {
                // Генерирую событие о завершении загрузки данных
                const dataLoadedEvent = new CustomEvent('data-loaded');
                document.dispatchEvent(dataLoadedEvent);
            }
        }
        
        // Загрузка групп
        fetch('data/groups.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                appState.groups = data;
                console.log('Группы загружены:', appState.groups.length);
                groupsLoaded = true;
                checkDataLoaded();
            })
            .catch(error => {
                console.error('Ошибка загрузки групп:', error);
                showToast('error', 'Ошибка', 'Не удалось загрузить данные групп');
                groupsLoaded = true; // Отмечаем как загруженные, чтобы не блокировать остальной функционал
                checkDataLoaded();
            });

        // Загрузка файлов
        fetch('data/files.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                appState.files = data;
                console.log('Файлы загружены:', appState.files.length);
                filesLoaded = true;
                checkDataLoaded();
            })
            .catch(error => {
                console.error('Ошибка загрузки файлов:', error);
                showToast('error', 'Ошибка', 'Не удалось загрузить данные файлов');
                filesLoaded = true; // Отмечаем как загруженные, чтобы не блокировать остальной функционал
                checkDataLoaded();
            });
    }

    // Обработчики авторизации
    elements.loginBtn.addEventListener('click', () => showModal(elements.loginModal));
    elements.registerBtn.addEventListener('click', () => showModal(elements.registerModal));
    
    // Полностью перерабатываем логику меню пользователя
    function setupUserMenu() {
        const userMenuToggle = document.querySelector('.user-menu-toggle');
        
        if (!userMenuToggle) return;
        
        // Получаем меню из родительского элемента
        const userMenu = userMenuToggle.querySelector('.user-menu');
        
        if (!userMenu) return;
        
        // Очищаем все существующие обработчики
        const newUserMenuToggle = userMenuToggle.cloneNode(true);
        userMenuToggle.parentNode.replaceChild(newUserMenuToggle, userMenuToggle);
        
        // Получаем новое меню после клонирования
        const newUserMenu = newUserMenuToggle.querySelector('.user-menu');
        
        // Добавляем новый обработчик клика
        newUserMenuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            newUserMenu.classList.toggle('show');
            
            // Добавляем обработчик для закрытия меню при клике вне его
            if (newUserMenu.classList.contains('show')) {
                setTimeout(() => {
                    document.addEventListener('click', closeUserMenu);
                }, 10);
            }
        });
        
        // Функция закрытия меню
        function closeUserMenu(e) {
            if (!newUserMenu.contains(e.target) && !newUserMenuToggle.contains(e.target)) {
                newUserMenu.classList.remove('show');
                document.removeEventListener('click', closeUserMenu);
            }
        }
        
        // Добавляем обработчики для элементов меню
        const profileEditOption = newUserMenu.querySelector('.edit-profile-option');
        if (profileEditOption) {
            profileEditOption.addEventListener('click', function(e) {
                e.stopPropagation();
                newUserMenu.classList.remove('show');
                document.removeEventListener('click', closeUserMenu);
                showProfileEditModal();
            });
        }
        
        const settingsOption = newUserMenu.querySelector('.settings-option');
        if (settingsOption) {
            settingsOption.addEventListener('click', function(e) {
                e.stopPropagation();
                newUserMenu.classList.remove('show');
                document.removeEventListener('click', closeUserMenu);
                // Здесь можно добавить открытие настроек
                showToast('info', 'Настройки', 'Функция будет доступна в ближайшем обновлении');
            });
        }
        
        const logoutOption = newUserMenu.querySelector('.logout-option');
        if (logoutOption) {
            logoutOption.addEventListener('click', function(e) {
                e.stopPropagation();
                newUserMenu.classList.remove('show');
                document.removeEventListener('click', closeUserMenu);
                handleLogout();
            });
        }
    }
    
    // Обработчики групп
    elements.createGroupBtn.addEventListener('click', () => {
        if (!appState.isAuthenticated) {
            showToast('warning', 'Требуется авторизация', 'Пожалуйста, войдите в систему');
            return;
        }
        showModal(elements.createGroupModal);
    });
    
    // Обработчики файлов
    elements.uploadFileBtn.addEventListener('click', () => {
        if (!appState.isAuthenticated) {
            showToast('warning', 'Требуется авторизация', 'Пожалуйста, войдите в систему');
            return;
        }
        if (!appState.currentGroup) {
            showToast('warning', 'Выберите группу', 'Пожалуйста, выберите группу для загрузки файла');
            return;
        }
        showModal(elements.uploadFileModal);
    });
    
    // Добавляем обработчик для кнопки приглашения участника
    const inviteMemberBtn = document.getElementById('inviteMemberBtn');
    if (inviteMemberBtn) {
        inviteMemberBtn.addEventListener('click', () => {
            if (!appState.isAuthenticated) {
                showToast('warning', 'Требуется авторизация', 'Пожалуйста, войдите в систему');
                return;
            }
            if (!appState.currentGroup) {
                showToast('warning', 'Выберите группу', 'Пожалуйста, выберите группу для приглашения участника');
                return;
            }
            showInviteMemberModal();
        });
    }
    
    elements.fileSearchInput.addEventListener('input', handleFileSearch);
    
    // Обработчик изменения файлов при загрузке
    const fileUploadInput = document.getElementById('fileUploadInput');
    fileUploadInput.addEventListener('change', handleFileSelection);
    
    // Обработчики чата
    elements.sendMessageBtn.addEventListener('click', handleSendMessage);
    elements.attachFileBtn.addEventListener('click', handleAttachFile);
    
    // Закрытие модальных окон
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.remove('active');
            });
        });
    });
    
    // Обработка форм
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('createGroupForm').addEventListener('submit', handleCreateGroup);
    document.getElementById('uploadFileForm').addEventListener('submit', handleUploadFile);
    document.getElementById('assignTaskForm').addEventListener('submit', handleAssignTask);
    
    // Переключение фильтров файлов
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterFiles(btn.dataset.filter);
        });
    });
    
    // Прослушивание события авторизации пользователя
    document.addEventListener('userAuthenticated', (event) => {
        const user = event.detail.user;
        appState.currentUser = user;
        appState.isAuthenticated = true;
        updateUIAfterAuth();
        
        // Загрузка групп пользователя
        loadUserGroups();
    });
    
    // Прослушивание события выхода пользователя
    document.addEventListener('userLoggedOut', () => {
        appState.currentUser = null;
        appState.isAuthenticated = false;
        appState.userGroups = [];
        appState.currentGroup = null;
        
        updateUIAfterAuth();
    });
    
    // Функции
    
    // Авторизация
    function handleLogin(e) {
        e.preventDefault();
        // Обработка формы происходит в auth.js
    }
    
    function handleRegister(e) {
        e.preventDefault();
        // Обработка формы происходит в auth.js
    }
    
    function handleLogout() {
        // Вызов функции выхода из auth.js
        if (window.auth && typeof window.auth.logout === 'function') {
            window.auth.logout();
        }
    }
    
    // Обновляем UI после аутентификации и настраиваем меню пользователя
    function updateUIAfterAuth() {
        if (appState.isAuthenticated) {
            elements.authButtons.style.display = 'none';
            elements.userProfile.style.display = 'flex';
            elements.userAvatar.src = appState.currentUser.avatar;
            elements.userName.textContent = appState.currentUser.name;
            
            // Сброс содержимого группы
            elements.currentGroupName.textContent = 'Выберите группу';
            elements.membersList.innerHTML = '';
            elements.tasksList.innerHTML = '';
            elements.chatMessages.innerHTML = '<div class="empty-chat-message"><i class="fas fa-comments"></i><p>Выберите группу, чтобы начать общение</p></div>';
            elements.fileList.innerHTML = '<div class="empty-files-message"><i class="fas fa-folder-open"></i><p>Нет загруженных файлов</p><button class="upload-btn">Загрузить первый файл</button></div>';
            
            // Настраиваем меню пользователя после отображения профиля
            setTimeout(() => {
                setupUserMenu();
            }, 100);
            
            // Обработчик клика на кнопку загрузки
            document.querySelector('.upload-btn').addEventListener('click', () => {
                if (appState.currentGroup) {
                    showModal(elements.uploadFileModal);
                } else {
                    showToast('warning', 'Выберите группу', 'Пожалуйста, выберите группу для загрузки файла');
                }
            });
        } else {
            elements.authButtons.style.display = 'flex';
            elements.userProfile.style.display = 'none';
            
            // Сброс содержимого
            elements.userGroups.innerHTML = '<div class="empty-groups-message">Войдите, чтобы увидеть ваши группы</div>';
            elements.fileList.innerHTML = '<div class="empty-files-message"><i class="fas fa-folder-open"></i><p>Войдите, чтобы просматривать файлы</p></div>';
            elements.membersList.innerHTML = '';
            elements.tasksList.innerHTML = '';
            elements.chatMessages.innerHTML = '<div class="empty-chat-message"><i class="fas fa-comments"></i><p>Войдите, чтобы использовать чат</p></div>';
            elements.currentGroupName.textContent = 'Выберите группу';
        }
    }
    
    // Группы
    function loadUserGroups() {
        if (!appState.isAuthenticated || !appState.currentUser || !appState.currentUser.groups) {
            return;
        }
        
        // Получение групп пользователя
        appState.userGroups = appState.groups.filter(group => 
            appState.currentUser.groups.includes(group.id)
        );
        
        renderUserGroups();
    }
    
    function renderUserGroups() {
        if (!appState.isAuthenticated || appState.userGroups.length === 0) {
            elements.userGroups.innerHTML = '<div class="empty-groups-message">Нет доступных групп</div>';
            return;
        }
        
        elements.userGroups.innerHTML = '';
        
        appState.userGroups.forEach(group => {
            const groupElement = document.createElement('div');
            groupElement.className = 'group-pill';
            if (appState.currentGroup && appState.currentGroup.id === group.id) {
                groupElement.classList.add('active');
            }
            groupElement.textContent = group.name;
            groupElement.dataset.groupId = group.id;
            
            groupElement.addEventListener('click', () => selectGroup(group));
            groupElement.addEventListener('mouseenter', (e) => showGroupTooltip(e, group));
            groupElement.addEventListener('mouseleave', hideGroupTooltip);
            
            elements.userGroups.appendChild(groupElement);
        });
    }
    
    function selectGroup(group) {
        appState.currentGroup = group;
        
        // Обновление UI
        document.querySelectorAll('.group-pill').forEach(pill => {
            pill.classList.remove('active');
            if (parseInt(pill.dataset.groupId) === group.id) {
                pill.classList.add('active');
            }
        });
        
        elements.currentGroupName.textContent = group.name;
        
        // Загрузка данных группы
        loadGroupData(group.id);
    }
    
    function loadGroupData(groupId) {
        const group = appState.groups.find(g => g.id === groupId);
        
        if (!group) {
            showToast('error', 'Ошибка', 'Группа не найдена');
            return;
        }
        
        // Получение информации о пользователях в группе
        const members = group.members.map(member => {
            const user = window.auth.getUserById(member.userId);
            return {
                id: member.userId,
                name: user ? user.name : 'Неизвестный пользователь',
                role: member.role,
                avatar: user ? user.avatar : 'images/default-avatar.png'
            };
        });
        
        // Получение заданий
        const tasks = group.tasks.map(task => {
            const assignee = window.auth.getUserById(task.assigneeId);
            return {
                id: task.id,
                title: task.title,
                description: task.description,
                assignee: assignee ? assignee.name : 'Неизвестный пользователь',
                status: task.status,
                dueDate: task.dueDate
            };
        });
        
        // Получение сообщений чата
        const messages = group.messages.map(message => {
            const author = window.auth.getUserById(message.authorId);
            return {
                id: message.id,
                author: author ? author.name : 'Неизвестный пользователь',
                authorAvatar: author ? author.avatar : 'images/default-avatar.png',
                text: message.text,
                timestamp: new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                isOwnMessage: appState.currentUser && message.authorId === appState.currentUser.id,
                attachments: message.attachments
            };
        });
        
        // Получение файлов группы
        const files = appState.files.filter(file => file.groupId === groupId).map(file => {
            const uploader = window.auth.getUserById(file.uploadedBy);
            return {
                id: file.id,
                name: file.name,
                type: file.type,
                icon: file.icon,
                size: file.size,
                uploadedBy: uploader ? uploader.name : 'Неизвестный пользователь',
                uploadDate: new Date(file.uploadDate).toLocaleDateString(),
                path: file.path
            };
        });
        
        renderGroupMembers(members);
        renderGroupTasks(tasks);
        renderChatMessages(messages);
        renderFiles(files);
    }
    
    function renderGroupMembers(members) {
        elements.membersList.innerHTML = '';
        
        members.forEach(member => {
            const memberElement = document.createElement('div');
            memberElement.className = 'member-item';
            memberElement.innerHTML = `
                <div class="member-avatar">
                    <img src="${member.avatar}" alt="${member.name}">
                </div>
                <div class="member-info">
                    <div class="member-name">${member.name}</div>
                    <div class="member-role">${member.role}</div>
                </div>
                <div class="member-actions">
                    <i class="fas fa-ellipsis-v"></i>
                </div>
            `;
            
            // Добавление обработчика для действий с участником
            const actionButton = memberElement.querySelector('.member-actions i');
            actionButton.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Создание выпадающего меню
                const menu = document.createElement('div');
                menu.className = 'context-menu';
                menu.innerHTML = `
                    <div class="context-menu-item" data-action="message">Отправить сообщение</div>
                    <div class="context-menu-item" data-action="assign">Назначить задание</div>
                    <div class="context-menu-item" data-action="role">Изменить роль</div>
                `;
                
                // Позиционирование меню
                const rect = actionButton.getBoundingClientRect();
                menu.style.top = `${rect.bottom + 5}px`;
                menu.style.left = `${rect.left - 100}px`;
                
                // Добавление меню на страницу
                document.body.appendChild(menu);
                
                // Обработчики действий в меню
                menu.querySelectorAll('.context-menu-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const action = item.dataset.action;
                        
                        if (action === 'message') {
                            // Фокус на поле ввода сообщения и добавление упоминания
                            elements.messageInput.focus();
                            elements.messageInput.value = `@${member.name} `;
                        } else if (action === 'assign') {
                            // Открытие модального окна назначения задания
                            prepareAssignTaskModal(member.id);
                            showModal(elements.assignTaskModal);
                        } else if (action === 'role') {
                            // Будет добавлено в следующей версии
                            showToast('info', 'В разработке', 'Эта функция будет доступна в ближайшем обновлении');
                        }
                        
                        // Удаление меню
                        menu.remove();
                    });
                });
                
                // Удаление меню при клике вне его
                document.addEventListener('click', function removeMenu(e) {
                    if (!menu.contains(e.target) && e.target !== actionButton) {
                        menu.remove();
                        document.removeEventListener('click', removeMenu);
                    }
                });
            });
            
            elements.membersList.appendChild(memberElement);
        });
    }
    
    function renderGroupTasks(tasks) {
        elements.tasksList.innerHTML = '';
        
        if (tasks.length === 0) {
            elements.tasksList.innerHTML = '<div class="empty-tasks-message"><i class="fas fa-tasks"></i><p>В этой группе еще нет заданий</p></div>';
            return;
        }
        
        tasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = 'task-item';
            taskElement.innerHTML = `
                <div class="task-header">
                    <div class="task-title">${task.title}</div>
                    <span class="task-status ${task.status}">${getStatusText(task.status)}</span>
                </div>
                <div class="task-details">${task.description}</div>
                <div class="task-meta">
                    <div class="task-assignee">
                        <img src="images/default-avatar.png" alt="${task.assignee}" class="task-assignee-avatar">
                        ${task.assignee}
                    </div>
                    <div class="task-due-date">
                        <i class="fas fa-calendar-alt"></i>
                        ${formatDate(task.dueDate)}
                    </div>
                </div>
            `;
            
            // Добавление обработчика для изменения статуса задания
            taskElement.querySelector('.task-status').addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Создание выпадающего меню статусов
                const statusMenu = document.createElement('div');
                statusMenu.className = 'status-menu';
                statusMenu.innerHTML = `
                    <div class="status-menu-item" data-status="pending">Ожидает</div>
                    <div class="status-menu-item" data-status="in-progress">В процессе</div>
                    <div class="status-menu-item" data-status="completed">Выполнено</div>
                `;
                
                // Позиционирование меню
                const rect = e.target.getBoundingClientRect();
                statusMenu.style.top = `${rect.bottom + 5}px`;
                statusMenu.style.left = `${rect.left}px`;
                
                // Добавление меню на страницу
                document.body.appendChild(statusMenu);
                
                // Обработчики выбора статуса
                statusMenu.querySelectorAll('.status-menu-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const newStatus = item.dataset.status;
                        
                        // Обновление статуса задания
                        updateTaskStatus(task.id, newStatus);
                        
                        // Удаление меню
                        statusMenu.remove();
                    });
                });
                
                // Удаление меню при клике вне его
                document.addEventListener('click', function removeStatusMenu(e) {
                    if (!statusMenu.contains(e.target) && !e.target.classList.contains('task-status')) {
                        statusMenu.remove();
                        document.removeEventListener('click', removeStatusMenu);
                    }
                });
            });
            
            elements.tasksList.appendChild(taskElement);
        });
        
        // Добавляем обработчик для кнопки добавления задания вне renderGroupTasks
        const addTaskBtn = document.getElementById('addTaskBtn');
        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', () => {
                if (!appState.isAuthenticated) {
                    showToast('warning', 'Требуется авторизация', 'Пожалуйста, войдите в систему');
                    return;
                }
                
                if (!appState.currentGroup) {
                    showToast('warning', 'Выберите группу', 'Пожалуйста, выберите группу для добавления задания');
                    return;
                }
                
                prepareAssignTaskModal();
                showModal(elements.assignTaskModal);
            });
        }
    }
    
    function prepareAssignTaskModal(preselectedUserId) {
        const taskAssigneeSelect = document.getElementById('taskAssignee');
        taskAssigneeSelect.innerHTML = '';
        
        // Заполнение списка участников
        const group = appState.currentGroup;
        if (group && group.members) {
            group.members.forEach(member => {
                const user = window.auth.getUserById(member.userId);
                if (user) {
                    const option = document.createElement('option');
                    option.value = member.userId;
                    option.textContent = user.name;
                    
                    if (preselectedUserId && member.userId === preselectedUserId) {
                        option.selected = true;
                    }
                    
                    taskAssigneeSelect.appendChild(option);
                }
            });
        }
    }
    
    function updateTaskStatus(taskId, newStatus) {
        if (!appState.currentGroup) return;
        
        // В реальном приложении здесь будет запрос к API
        // Для демонстрации обновляем локально
        
        // Найти задание в текущей группе
        const taskIndex = appState.currentGroup.tasks.findIndex(t => t.id === taskId);
        
        if (taskIndex !== -1) {
            // Обновить статус
            appState.currentGroup.tasks[taskIndex].status = newStatus;
            
            // Обновление отображения
            loadGroupData(appState.currentGroup.id);
            
            showToast('success', 'Статус обновлен', 'Статус задания успешно обновлен');
        }
    }
    
    function renderChatMessages(messages) {
        elements.chatMessages.innerHTML = '';
        
        if (messages.length === 0) {
            elements.chatMessages.innerHTML = '<div class="empty-chat-message"><i class="fas fa-comments"></i><p>В этой группе еще нет сообщений</p></div>';
            return;
        }
        
        messages.forEach(message => {
            const messageElement = document.createElement('div');
            messageElement.className = `chat-message ${message.isOwnMessage ? 'own' : ''}`;
            
            let attachmentsHTML = '';
            if (message.attachments && message.attachments.length > 0) {
                attachmentsHTML = message.attachments.map(attachment => {
                    return `
                        <div class="chat-message-attachment">
                            <div class="chat-message-attachment-icon">
                                <i class="${attachment.icon}"></i>
                            </div>
                            <div class="chat-message-attachment-info">
                                <div class="chat-message-attachment-name">${attachment.name}</div>
                                <div class="chat-message-attachment-meta">${attachment.size}</div>
                            </div>
                            <a href="${attachment.path}" class="chat-message-attachment-action" download>
                                <i class="fas fa-download"></i>
                            </a>
                        </div>
                    `;
                }).join('');
            }
            
            messageElement.innerHTML = `
                <div class="chat-message-avatar">
                    <img src="${message.authorAvatar}" alt="${message.author}">
                </div>
                <div class="chat-message-content">
                    <div class="chat-message-header">
                        <span class="chat-message-author">${message.author}</span>
                        <span class="chat-message-time">${message.timestamp}</span>
                    </div>
                    <div class="chat-message-text">${message.text}</div>
                    ${attachmentsHTML}
                </div>
            `;
            
            elements.chatMessages.appendChild(messageElement);
        });
        
        // Прокрутка чата вниз
        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    }
    
    function renderFiles(files) {
        if (files.length === 0) {
            elements.fileList.innerHTML = '<div class="empty-files-message"><i class="fas fa-folder-open"></i><p>Нет загруженных файлов</p><button class="upload-btn">Загрузить первый файл</button></div>';
            
            // Добавление обработчика на кнопку загрузки
            const uploadBtn = elements.fileList.querySelector('.upload-btn');
            if (uploadBtn) {
                uploadBtn.addEventListener('click', () => {
                    showModal(elements.uploadFileModal);
                });
            }
            
            return;
        }
        
        elements.fileList.innerHTML = '';
        
        files.forEach(file => {
            const fileElement = document.createElement('div');
            fileElement.className = 'file-item';
            fileElement.innerHTML = `
                <div class="file-icon ${file.type}">
                    <i class="${file.icon}"></i>
                </div>
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-meta">
                        <span><i class="fas fa-weight-hanging"></i> ${file.size}</span>
                        <span><i class="fas fa-user"></i> ${file.uploadedBy}</span>
                        <span><i class="fas fa-calendar-day"></i> ${file.uploadDate}</span>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="file-action-btn download-file" title="Скачать">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="file-action-btn share-file" title="Поделиться">
                        <i class="fas fa-share-alt"></i>
                    </button>
                    <button class="file-action-btn delete-file" title="Удалить">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
            
            // Добавление обработчиков для кнопок файлов
            fileElement.querySelector('.download-file').addEventListener('click', (e) => {
                e.stopPropagation();
                downloadFile(file);
            });
            
            fileElement.querySelector('.share-file').addEventListener('click', (e) => {
                e.stopPropagation();
                shareFile(file);
            });
            
            fileElement.querySelector('.delete-file').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteFile(file.id);
            });
            
            elements.fileList.appendChild(fileElement);
        });
    }
    
    function downloadFile(file) {
        // В реальном приложении здесь будет загрузка файла
        showToast('info', 'Скачивание файла', `Скачивание ${file.name} началось`);
        
        // Создание временной ссылки для скачивания
        const a = document.createElement('a');
        a.href = file.path;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
    
    function shareFile(file) {
        // В реальном приложении здесь будет модальное окно для отправки ссылки
        
        // Создание временной ссылки на файл
        const fileLink = `${window.location.origin}/${file.path}`;
        
        // Копирование ссылки в буфер обмена
        navigator.clipboard.writeText(fileLink)
            .then(() => {
                showToast('success', 'Ссылка скопирована', 'Ссылка на файл скопирована в буфер обмена');
            })
            .catch(err => {
                console.error('Ошибка при копировании ссылки:', err);
                showToast('error', 'Ошибка', 'Не удалось скопировать ссылку');
            });
    }
    
    function deleteFile(fileId) {
        // В реальном приложении здесь будет запрос к API
        
        // Подтверждение удаления
        if (confirm('Вы уверены, что хотите удалить этот файл?')) {
            // Удаление файла из списка
            appState.files = appState.files.filter(file => file.id !== fileId);
            
            // Обновление отображения
            if (appState.currentGroup) {
                loadGroupData(appState.currentGroup.id);
            }
            
            showToast('success', 'Файл удален', 'Файл успешно удален');
        }
    }
    
    function filterFiles(filter) {
        if (!appState.currentGroup) return;
        
        document.querySelectorAll('.file-item').forEach(item => {
            const fileType = item.querySelector('.file-icon').className.split(' ')[1];
            if (filter === 'all' || fileType === filter) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    function handleFileSearch(e) {
        const searchTerm = e.target.value.toLowerCase();
        
        document.querySelectorAll('.file-item').forEach(item => {
            const fileName = item.querySelector('.file-name').textContent.toLowerCase();
            if (fileName.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    function handleFileSelection(e) {
        const files = e.target.files;
        elements.uploadFileList.innerHTML = '';
        appState.selectedFiles = [];
        
        if (files.length === 0) return;
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            appState.selectedFiles.push(file);
            
            const fileItem = document.createElement('div');
            fileItem.className = 'upload-file-item';
            
            // Определение типа и иконки файла
            let fileType = 'other';
            let fileIcon = 'fas fa-file';
            
            if (file.type.startsWith('image/')) {
                fileType = 'images';
                fileIcon = 'fas fa-file-image';
            } else if (file.type === 'application/pdf') {
                fileType = 'documents';
                fileIcon = 'fas fa-file-pdf';
            } else if (file.type === 'text/html' || file.type === 'text/css' || file.type === 'application/javascript') {
                fileType = 'code';
                fileIcon = 'fas fa-file-code';
            } else if (file.type.includes('zip') || file.type.includes('rar')) {
                fileType = 'archive';
                fileIcon = 'fas fa-file-archive';
            } else if (file.type.includes('word')) {
                fileType = 'documents';
                fileIcon = 'fas fa-file-word';
            } else if (file.type.includes('excel') || file.type.includes('spreadsheet')) {
                fileType = 'documents';
                fileIcon = 'fas fa-file-excel';
            }
            
            fileItem.innerHTML = `
                <div class="upload-file-icon ${fileType}">
                    <i class="${fileIcon}"></i>
                </div>
                <div class="upload-file-info">
                    <div class="upload-file-name">${file.name}</div>
                    <div class="upload-file-size">${formatFileSize(file.size)}</div>
                </div>
                <button class="upload-file-remove" data-index="${i}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            elements.uploadFileList.appendChild(fileItem);
        }
        
        // Добавление обработчиков для кнопок удаления
        document.querySelectorAll('.upload-file-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const index = parseInt(e.currentTarget.dataset.index);
                
                // Удаление файла из списка
                appState.selectedFiles.splice(index, 1);
                
                // Обновление отображения
                handleFileSelection({ target: { files: appState.selectedFiles } });
            });
        });
    }
    
    // Чат
    function handleSendMessage() {
        const messageText = elements.messageInput.value.trim();
        
        if (!messageText || !appState.currentGroup) {
            return;
        }
        
        // Добавление нового сообщения в группу
        const newMessage = {
            id: Date.now(),
            authorId: appState.currentUser.id,
            text: messageText,
            timestamp: new Date().toISOString(),
            attachments: []
        };
        
        // В реальном приложении здесь будет запрос к API
        // Для демонстрации добавляем сообщение локально
        appState.currentGroup.messages.push(newMessage);
        
        // Обновление отображения чата
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message own';
        messageElement.innerHTML = `
            <div class="chat-message-avatar">
                <img src="${appState.currentUser.avatar}" alt="${appState.currentUser.name}">
            </div>
            <div class="chat-message-content">
                <div class="chat-message-header">
                    <span class="chat-message-author">${appState.currentUser.name}</span>
                    <span class="chat-message-time">${getCurrentTime()}</span>
                </div>
                <div class="chat-message-text">${messageText}</div>
            </div>
        `;
        
        elements.chatMessages.appendChild(messageElement);
        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
        
        // Очистка поля ввода
        elements.messageInput.value = '';
    }
    
    function handleAttachFile() {
        if (!appState.currentGroup) {
            showToast('warning', 'Выберите группу', 'Пожалуйста, выберите группу для отправки файла');
            return;
        }
        
        // Создание скрытого инпута для выбора файла
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            // Определение типа и иконки файла
            let fileType = 'other';
            let fileIcon = 'fas fa-file';
            
            if (file.type.startsWith('image/')) {
                fileType = 'images';
                fileIcon = 'fas fa-file-image';
            } else if (file.type === 'application/pdf') {
                fileType = 'documents';
                fileIcon = 'fas fa-file-pdf';
            } else if (file.type === 'text/html' || file.type === 'text/css' || file.type === 'application/javascript') {
                fileType = 'code';
                fileIcon = 'fas fa-file-code';
            }
            
            // Создание объекта вложения
            const attachment = {
                id: Date.now(),
                name: file.name,
                size: formatFileSize(file.size),
                type: fileType,
                icon: fileIcon,
                path: URL.createObjectURL(file)
            };
            
            // Добавление сообщения с вложением
            const newMessage = {
                id: Date.now(),
                authorId: appState.currentUser.id,
                text: '',
                timestamp: new Date().toISOString(),
                attachments: [attachment]
            };
            
            // В реальном приложении здесь будет запрос к API
            // Для демонстрации добавляем сообщение локально
            appState.currentGroup.messages.push(newMessage);
            
            // Обновление отображения чата
            const messageElement = document.createElement('div');
            messageElement.className = 'chat-message own';
            messageElement.innerHTML = `
                <div class="chat-message-avatar">
                    <img src="${appState.currentUser.avatar}" alt="${appState.currentUser.name}">
                </div>
                <div class="chat-message-content">
                    <div class="chat-message-header">
                        <span class="chat-message-author">${appState.currentUser.name}</span>
                        <span class="chat-message-time">${getCurrentTime()}</span>
                    </div>
                    <div class="chat-message-attachment">
                        <div class="chat-message-attachment-icon">
                            <i class="${attachment.icon}"></i>
                        </div>
                        <div class="chat-message-attachment-info">
                            <div class="chat-message-attachment-name">${attachment.name}</div>
                            <div class="chat-message-attachment-meta">${attachment.size}</div>
                        </div>
                        <a href="${attachment.path}" class="chat-message-attachment-action" download>
                            <i class="fas fa-download"></i>
                        </a>
                    </div>
                </div>
            `;
            
            elements.chatMessages.appendChild(messageElement);
            elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
            
            // Удаление инпута
            document.body.removeChild(fileInput);
        });
        
        document.body.appendChild(fileInput);
        fileInput.click();
    }
    
    // Обработка задач
    function handleCreateGroup(e) {
        e.preventDefault();
        
        if (!appState.isAuthenticated) {
            showToast('warning', 'Требуется авторизация', 'Пожалуйста, войдите в систему');
            return;
        }
        
        const groupName = document.getElementById('groupName').value;
        const groupDescription = document.getElementById('groupDescription').value;
        
        if (!groupName) {
            showToast('warning', 'Введите название', 'Пожалуйста, введите название группы');
            return;
        }
        
        // В реальном приложении здесь будет запрос к API
        const newGroupId = appState.groups.length > 0 ? Math.max(...appState.groups.map(g => g.id)) + 1 : 1;
        
        const newGroup = {
            id: newGroupId,
            name: groupName,
            description: groupDescription,
            members: [
                {
                    userId: appState.currentUser.id,
                    role: 'Администратор'
                }
            ],
            tasks: [],
            messages: [],
            files: []
        };
        
        // Добавление новой группы
        appState.groups.push(newGroup);
        
        // Добавление id группы к пользователю
        appState.currentUser.groups.push(newGroupId);
        
        // Обновление списка групп пользователя
        appState.userGroups.push(newGroup);
        renderUserGroups();
        
        // Выбор новой группы
        selectGroup(newGroup);
        
        showToast('success', 'Группа создана', `Группа "${groupName}" успешно создана`);
        hideModal(elements.createGroupModal);
        
        // Очистка формы
        document.getElementById('groupName').value = '';
        document.getElementById('groupDescription').value = '';
    }
    
    function handleUploadFile(e) {
        e.preventDefault();
        
        if (!appState.isAuthenticated) {
            showToast('warning', 'Требуется авторизация', 'Пожалуйста, войдите в систему');
            return;
        }
        
        if (!appState.currentGroup) {
            showToast('warning', 'Выберите группу', 'Пожалуйста, выберите группу для загрузки файла');
            return;
        }
        
        if (appState.selectedFiles.length === 0) {
            showToast('warning', 'Выберите файлы', 'Пожалуйста, выберите файлы для загрузки');
            return;
        }
        
        // В реальном приложении здесь будет загрузка файлов на сервер
        
        // Добавление файлов в список
        appState.selectedFiles.forEach(file => {
            // Определение типа и иконки файла
            let fileType = 'other';
            let fileIcon = 'fas fa-file';
            
            if (file.type.startsWith('image/')) {
                fileType = 'images';
                fileIcon = 'fas fa-file-image';
            } else if (file.type === 'application/pdf') {
                fileType = 'documents';
                fileIcon = 'fas fa-file-pdf';
            } else if (file.type === 'text/html' || file.type === 'text/css' || file.type === 'application/javascript') {
                fileType = 'code';
                fileIcon = 'fas fa-file-code';
            } else if (file.type.includes('zip') || file.type.includes('rar')) {
                fileType = 'archive';
                fileIcon = 'fas fa-file-archive';
            } else if (file.type.includes('word')) {
                fileType = 'documents';
                fileIcon = 'fas fa-file-word';
            } else if (file.type.includes('excel') || file.type.includes('spreadsheet')) {
                fileType = 'documents';
                fileIcon = 'fas fa-file-excel';
            }
            
            // Создание нового файла
            const newFileId = appState.files.length > 0 ? Math.max(...appState.files.map(f => f.id)) + 1 : 1;
            const path = `uploads/${file.name}`;
            
            const newFile = {
                id: newFileId,
                name: file.name,
                type: fileType,
                icon: fileIcon,
                size: formatFileSize(file.size),
                uploadedBy: appState.currentUser.id,
                uploadDate: new Date().toISOString(),
                groupId: appState.currentGroup.id,
                path: path
            };
            
            // Добавление файла в список
            appState.files.push(newFile);
        });
        
        // Обновление отображения
        loadGroupData(appState.currentGroup.id);
        
        showToast('success', 'Файлы загружены', 'Файлы успешно загружены');
        hideModal(elements.uploadFileModal);
        
        // Очистка списка выбранных файлов
        appState.selectedFiles = [];
        elements.uploadFileList.innerHTML = '';
        document.getElementById('fileUploadInput').value = '';
    }
    
    function handleAssignTask(e) {
        e.preventDefault();
        
        if (!appState.isAuthenticated) {
            showToast('warning', 'Требуется авторизация', 'Пожалуйста, войдите в систему');
            return;
        }
        
        if (!appState.currentGroup) {
            showToast('warning', 'Выберите группу', 'Пожалуйста, выберите группу для назначения задания');
            return;
        }
        
        const taskTitle = document.getElementById('taskTitle').value;
        const taskDescription = document.getElementById('taskDescription').value;
        const taskAssignee = document.getElementById('taskAssignee').value;
        const taskDueDate = document.getElementById('taskDueDate').value;
        
        if (!taskTitle || !taskAssignee) {
            showToast('warning', 'Заполните обязательные поля', 'Пожалуйста, заполните название задания и выберите исполнителя');
            return;
        }
        
        // Создание нового задания
        const newTaskId = appState.currentGroup.tasks.length > 0 
            ? Math.max(...appState.currentGroup.tasks.map(t => t.id)) + 1 
            : 1;
        
        const newTask = {
            id: newTaskId,
            title: taskTitle,
            description: taskDescription,
            assigneeId: parseInt(taskAssignee),
            status: 'pending',
            dueDate: taskDueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) // дедлайн через неделю по умолчанию
        };
        
        // Добавление задания в группу
        appState.currentGroup.tasks.push(newTask);
        
        // Обновление отображения
        loadGroupData(appState.currentGroup.id);
        
        showToast('success', 'Задание создано', `Задание "${taskTitle}" назначено`);
        hideModal(elements.assignTaskModal);
        
        // Очистка формы
        document.getElementById('taskTitle').value = '';
        document.getElementById('taskDescription').value = '';
        document.getElementById('taskDueDate').value = '';
    }
    
    // Всплывающий тултип групп
    function showGroupTooltip(e, group) {
        const tooltip = elements.groupTooltip;
        const tooltipGroupName = document.getElementById('tooltipGroupName');
        const tooltipUserRole = document.getElementById('tooltipUserRole');
        const tooltipActiveTask = document.getElementById('tooltipActiveTask');
        const tooltipCompletedTasks = document.getElementById('tooltipCompletedTasks');
        
        const groupData = appState.groups.find(g => g.id === group.id);
        if (!groupData) return;
        
        tooltipGroupName.textContent = group.name;
        
        // Определение роли пользователя в группе
        const member = groupData.members.find(m => m.userId === appState.currentUser.id);
        tooltipUserRole.textContent = `Роль: ${member ? member.role : 'Участник'}`;
        
        // Активные задания
        const userActiveTasks = groupData.tasks.filter(
            t => t.assigneeId === appState.currentUser.id && t.status !== 'completed'
        );
        
        if (userActiveTasks.length > 0) {
            tooltipActiveTask.textContent = userActiveTasks[0].title;
        } else {
            tooltipActiveTask.textContent = 'Нет активных заданий';
        }
        
        // Выполненные задания
        tooltipCompletedTasks.innerHTML = '';
        
        const userCompletedTasks = groupData.tasks.filter(
            t => t.assigneeId === appState.currentUser.id && t.status === 'completed'
        );
        
        if (userCompletedTasks.length > 0) {
            userCompletedTasks.forEach(task => {
                const li = document.createElement('li');
                li.textContent = task.title;
                tooltipCompletedTasks.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'Нет выполненных заданий';
            tooltipCompletedTasks.appendChild(li);
        }
        
        // Позиционирование тултипа - теперь влево от группы
        const rect = e.target.getBoundingClientRect();
        tooltip.style.top = `${rect.top}px`;
        tooltip.style.left = `${rect.left - tooltip.offsetWidth - 10}px`;
        
        // Если тултип выходит за левую границу экрана, отображаем его справа
        if (rect.left - tooltip.offsetWidth - 10 < 0) {
            tooltip.style.left = `${rect.right + 10}px`;
        }
        
        // Отображение тултипа
        tooltip.classList.add('active');
    }
    
    function hideGroupTooltip() {
        elements.groupTooltip.classList.remove('active');
    }
    
    // Вспомогательные функции
    function showModal(modal) {
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
        modal.classList.add('active');
    }
    
    function hideModal(modal) {
        modal.classList.remove('active');
    }
    
    function showToast(type, title, message) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas ${getToastIcon(type)}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <div class="toast-close">&times;</div>
        `;
        
        elements.toastContainer.appendChild(toast);
        
        // Автоматическое удаление через 5 секунд
        setTimeout(() => {
            toast.remove();
        }, 5000);
        
        // Кнопка закрытия
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });
    }
    
    function getToastIcon(type) {
        switch (type) {
            case 'success': return 'fa-check-circle';
            case 'error': return 'fa-exclamation-circle';
            case 'warning': return 'fa-exclamation-triangle';
            case 'info': return 'fa-info-circle';
            default: return 'fa-info-circle';
        }
    }
    
    function getStatusText(status) {
        switch (status) {
            case 'pending': return 'Ожидает';
            case 'in-progress': return 'В процессе';
            case 'completed': return 'Выполнено';
            default: return status;
        }
    }
    
    function formatDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    function getCurrentTime() {
        const now = new Date();
        return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // Функции для обработки действий настроек
    function sortFiles(sortBy) {
        if (!appState.currentGroup) return;
        
        showToast('info', 'Сортировка', `Файлы отсортированы по ${sortBy === 'name' ? 'имени' : sortBy === 'date' ? 'дате' : 'размеру'}`);
        
        // Получение файлов текущей группы
        const files = appState.files.filter(file => file.groupId === appState.currentGroup.id);
        
        // Сортировка файлов
        if (sortBy === 'name') {
            files.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortBy === 'date') {
            files.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
        } else if (sortBy === 'size') {
            files.sort((a, b) => {
                const sizeA = parseFileSize(a.size);
                const sizeB = parseFileSize(b.size);
                return sizeB - sizeA;
            });
        }
        
        // Отрисовка отсортированных файлов
        renderFiles(files.map(file => {
            const uploader = window.auth.getUserById(file.uploadedBy);
            return {
                id: file.id,
                name: file.name,
                type: file.type,
                icon: file.icon,
                size: file.size,
                uploadedBy: uploader ? uploader.name : 'Неизвестный пользователь',
                uploadDate: new Date(file.uploadDate).toLocaleDateString(),
                path: file.path
            };
        }));
    }
    
    function parseFileSize(sizeStr) {
        const regex = /^([\d.]+)\s*([KMGT]B|B)$/i;
        const match = sizeStr.match(regex);
        
        if (!match) return 0;
        
        const size = parseFloat(match[1]);
        const unit = match[2].toUpperCase();
        
        const units = {
            'B': 1,
            'KB': 1024,
            'MB': 1024 * 1024,
            'GB': 1024 * 1024 * 1024,
            'TB': 1024 * 1024 * 1024 * 1024
        };
        
        return size * units[unit];
    }
    
    function changeFileView(viewType) {
        const fileList = elements.fileList;
        
        if (viewType === 'grid') {
            fileList.classList.remove('list-view');
            fileList.classList.add('grid-view');
            showToast('info', 'Вид изменен', 'Файлы отображаются плиткой');
        } else {
            fileList.classList.remove('grid-view');
            fileList.classList.add('list-view');
            showToast('info', 'Вид изменен', 'Файлы отображаются списком');
        }
    }
    
    function handleEditGroup() {
        if (!appState.currentGroup) return;
        
        // Создание модального окна для редактирования группы
        const modal = document.getElementById('createGroupModal');
        const modalTitle = modal.querySelector('.modal-header h2');
        const groupNameInput = document.getElementById('groupName');
        const groupDescriptionInput = document.getElementById('groupDescription');
        const submitButton = modal.querySelector('button[type="submit"]');
        
        // Изменение названия модального окна и кнопки
        modalTitle.textContent = 'Редактировать группу';
        submitButton.textContent = 'Сохранить';
        
        // Заполнение полей значениями текущей группы
        groupNameInput.value = appState.currentGroup.name;
        groupDescriptionInput.value = appState.currentGroup.description || '';
        
        // Временно меняем обработчик отправки формы
        const originalSubmitHandler = document.getElementById('createGroupForm').onsubmit;
        document.getElementById('createGroupForm').onsubmit = function(e) {
            e.preventDefault();
            
            // Обновление данных группы
            appState.currentGroup.name = groupNameInput.value;
            appState.currentGroup.description = groupDescriptionInput.value;
            
            // Обновление интерфейса
            elements.currentGroupName.textContent = appState.currentGroup.name;
            renderUserGroups();
            
            // Возвращаем оригинальный обработчик
            document.getElementById('createGroupForm').onsubmit = originalSubmitHandler;
            
            // Сброс названия модального окна и кнопки
            modalTitle.textContent = 'Создать группу';
            submitButton.textContent = 'Создать';
            
            showToast('success', 'Группа обновлена', 'Изменения сохранены');
            hideModal(modal);
        };
        
        showModal(modal);
    }
    
    function handleAddMember() {
        if (!appState.currentGroup) return;
        
        showToast('info', 'В разработке', 'Эта функция будет доступна в ближайшем обновлении');
    }
    
    function handleLeaveGroup() {
        if (!appState.currentGroup || !appState.currentUser) return;
        
        if (confirm('Вы уверены, что хотите покинуть группу?')) {
            // Удаление группы из списка групп пользователя
            appState.currentUser.groups = appState.currentUser.groups.filter(id => id !== appState.currentGroup.id);
            
            // Удаление пользователя из участников группы
            const groupIndex = appState.groups.findIndex(g => g.id === appState.currentGroup.id);
            if (groupIndex !== -1) {
                appState.groups[groupIndex].members = appState.groups[groupIndex].members.filter(
                    m => m.userId !== appState.currentUser.id
                );
            }
            
            // Обновление списка групп пользователя
            appState.userGroups = appState.userGroups.filter(g => g.id !== appState.currentGroup.id);
            appState.currentGroup = null;
            
            // Обновление интерфейса
            renderUserGroups();
            elements.currentGroupName.textContent = 'Выберите группу';
            elements.membersList.innerHTML = '';
            elements.tasksList.innerHTML = '';
            elements.chatMessages.innerHTML = '<div class="empty-chat-message"><i class="fas fa-comments"></i><p>Выберите группу, чтобы начать общение</p></div>';
            elements.fileList.innerHTML = '<div class="empty-files-message"><i class="fas fa-folder-open"></i><p>Нет загруженных файлов</p><button class="upload-btn">Загрузить первый файл</button></div>';
            
            showToast('success', 'Группа покинута', 'Вы больше не состоите в этой группе');
        }
    }
    
    function handleDeleteGroup() {
        if (!appState.currentGroup || !appState.currentUser) return;
        
        // Проверка, является ли пользователь администратором
        const member = appState.currentGroup.members.find(m => m.userId === appState.currentUser.id);
        if (!member || member.role !== 'Администратор') {
            showToast('error', 'Отказано', 'Только администратор может удалить группу');
            return;
        }
        
        if (confirm('Вы уверены, что хотите удалить группу? Это действие нельзя отменить.')) {
            const groupId = appState.currentGroup.id;
            
            // Удаление группы из списка всех групп
            appState.groups = appState.groups.filter(g => g.id !== groupId);
            
            // Удаление группы из списка групп пользователя
            appState.userGroups = appState.userGroups.filter(g => g.id !== groupId);
            
            // Удаление группы из списка групп всех участников
            const users = window.auth.getUsers();
            users.forEach(user => {
                if (user.groups && user.groups.includes(groupId)) {
                    user.groups = user.groups.filter(id => id !== groupId);
                }
            });
            
            // Удаление файлов группы
            appState.files = appState.files.filter(file => file.groupId !== groupId);
            
            // Сброс текущей группы
            appState.currentGroup = null;
            
            // Обновление интерфейса
            renderUserGroups();
            elements.currentGroupName.textContent = 'Выберите группу';
            elements.membersList.innerHTML = '';
            elements.tasksList.innerHTML = '';
            elements.chatMessages.innerHTML = '<div class="empty-chat-message"><i class="fas fa-comments"></i><p>Выберите группу, чтобы начать общение</p></div>';
            elements.fileList.innerHTML = '<div class="empty-files-message"><i class="fas fa-folder-open"></i><p>Нет загруженных файлов</p><button class="upload-btn">Загрузить первый файл</button></div>';
            
            showToast('success', 'Группа удалена', 'Группа успешно удалена');
        }
    }
    
    // Функция для отображения модального окна редактирования профиля
    function showProfileEditModal() {
        // Проверяем, что пользователь авторизован
        if (!appState.isAuthenticated || !appState.currentUser) {
            showToast('warning', 'Требуется авторизация', 'Пожалуйста, войдите в систему');
            return;
        }
        
        // Создаем модальное окно редактирования профиля
        const modalHTML = `
            <div id="editProfileModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Редактировать профиль</h2>
                        <button class="close-modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="editProfileForm">
                            <div class="form-group">
                                <label for="profileName">Имя</label>
                                <input type="text" id="profileName" value="${appState.currentUser.name}" required>
                            </div>
                            <div class="form-group">
                                <label for="profileEmail">Email</label>
                                <input type="email" id="profileEmail" value="${appState.currentUser.email}" required>
                            </div>
                            <div class="form-group">
                                <label for="profilePassword">Новый пароль</label>
                                <input type="password" id="profilePassword" placeholder="Оставьте пустым, чтобы не менять">
                            </div>
                            <div class="form-group">
                                <label for="profileConfirmPassword">Подтвердите пароль</label>
                                <input type="password" id="profileConfirmPassword" placeholder="Оставьте пустым, чтобы не менять">
                            </div>
                            <div class="form-group">
                                <label for="profileAvatar">Аватар</label>
                                <select id="profileAvatar">
                                    <option value="images/default-avatar.png" ${appState.currentUser.avatar === 'images/default-avatar.png' ? 'selected' : ''}>Стандартный</option>
                                    <option value="images/avatar1.png" ${appState.currentUser.avatar === 'images/avatar1.png' ? 'selected' : ''}>Аватар 1</option>
                                    <option value="images/avatar2.png" ${appState.currentUser.avatar === 'images/avatar2.png' ? 'selected' : ''}>Аватар 2</option>
                                </select>
                            </div>
                            <div class="form-actions">
                                <button type="submit" class="btn primary">Сохранить</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        // Добавляем модальное окно на страницу
        const modalElement = document.createElement('div');
        modalElement.innerHTML = modalHTML;
        document.body.appendChild(modalElement.firstElementChild);
        
        // Получаем созданное модальное окно
        const editProfileModal = document.getElementById('editProfileModal');
        
        // Добавляем обработчик закрытия
        editProfileModal.querySelector('.close-modal').addEventListener('click', () => {
            editProfileModal.remove();
        });
        
        // Добавляем обработчик формы
        document.getElementById('editProfileForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('profileName').value;
            const email = document.getElementById('profileEmail').value;
            const password = document.getElementById('profilePassword').value;
            const confirmPassword = document.getElementById('profileConfirmPassword').value;
            const avatar = document.getElementById('profileAvatar').value;
            
            // Валидация
            if (!name || !email) {
                showToast('error', 'Ошибка', 'Имя и email обязательны для заполнения');
                return;
            }
            
            if (password && password !== confirmPassword) {
                showToast('error', 'Ошибка', 'Пароли не совпадают');
                return;
            }
            
            // Проверяем, изменился ли email и не существует ли уже пользователь с таким email
            if (email !== appState.currentUser.email && window.auth.userExists(email)) {
                showToast('error', 'Ошибка', 'Пользователь с таким email уже существует');
                return;
            }
            
            // Создаем объект с обновленными данными
            const updatedData = {
                name,
                email,
                avatar
            };
            
            // Если пароль был введен, добавляем его в объект
            if (password) {
                updatedData.password = password;
            }
            
            // Обновляем данные пользователя
            if (window.auth.updateUserData(appState.currentUser.id, updatedData)) {
                // Обновляем данные в appState
                appState.currentUser.name = name;
                appState.currentUser.email = email;
                appState.currentUser.avatar = avatar;
                
                // Обновляем отображение
                elements.userName.textContent = name;
                elements.userAvatar.src = avatar;
                
                showToast('success', 'Профиль обновлен', 'Данные профиля успешно обновлены');
                
                // Закрываем модальное окно
                editProfileModal.remove();
            } else {
                showToast('error', 'Ошибка', 'Не удалось обновить данные профиля');
            }
        });
        
        // Показываем модальное окно
        showModal(editProfileModal);
    }
    
    // Добавляем функцию обработки кнопок настроек
    function setupSettingsButtons() {
        document.querySelectorAll('.control-button.settings').forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                
                // Создание выпадающего меню настроек
                const settingsMenu = document.createElement('div');
                settingsMenu.className = 'context-menu settings-menu';
                
                // Определяем, какая кнопка настроек нажата по родительскому элементу
                const parentPanel = button.closest('.panel');
                
                if (parentPanel.classList.contains('file-exchange')) {
                    settingsMenu.innerHTML = `
                        <div class="context-menu-item" data-action="sort-name">Сортировать по имени</div>
                        <div class="context-menu-item" data-action="sort-date">Сортировать по дате</div>
                        <div class="context-menu-item" data-action="sort-size">Сортировать по размеру</div>
                        <div class="context-menu-item" data-action="view-grid">Вид: плитка</div>
                        <div class="context-menu-item" data-action="view-list">Вид: список</div>
                    `;
                } else if (parentPanel.classList.contains('group-info')) {
                    settingsMenu.innerHTML = `
                        <div class="context-menu-item" data-action="edit-group">Редактировать группу</div>
                        <div class="context-menu-item" data-action="add-member">Добавить участника</div>
                        <div class="context-menu-item" data-action="leave-group">Покинуть группу</div>
                        <div class="context-menu-item" data-action="delete-group">Удалить группу</div>
                    `;
                }
                
                // Позиционирование меню
                const rect = button.getBoundingClientRect();
                settingsMenu.style.top = `${rect.bottom + 5}px`;
                settingsMenu.style.right = `${window.innerWidth - rect.right}px`;
                
                // Добавление меню на страницу
                document.body.appendChild(settingsMenu);
                
                // Обработчики для пунктов меню
                settingsMenu.querySelectorAll('.context-menu-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const action = item.dataset.action;
                        
                        // Обработка действий для файлового обмена
                        if (action === 'sort-name') {
                            sortFiles('name');
                        } else if (action === 'sort-date') {
                            sortFiles('date');
                        } else if (action === 'sort-size') {
                            sortFiles('size');
                        } else if (action === 'view-grid') {
                            changeFileView('grid');
                        } else if (action === 'view-list') {
                            changeFileView('list');
                        }
                        
                        // Обработка действий для группы
                        else if (action === 'edit-group') {
                            handleEditGroup();
                        } else if (action === 'add-member') {
                            handleAddMember();
                        } else if (action === 'leave-group') {
                            handleLeaveGroup();
                        } else if (action === 'delete-group') {
                            handleDeleteGroup();
                        }
                        
                        // Удаление меню
                        settingsMenu.remove();
                    });
                });
                
                // Скрытие при клике вне меню
                document.addEventListener('click', function hideSettingsMenu(e) {
                    if (!settingsMenu.contains(e.target) && e.target !== button) {
                        settingsMenu.remove();
                        document.removeEventListener('click', hideSettingsMenu);
                    }
                });
            });
        });
    }
    
    // Функция для открытия модального окна приглашения
    function showInviteMemberModal() {
        const modal = document.getElementById('inviteMemberModal');
        showModal(modal);
    }

    // Функция для обработки отправки приглашения
    function handleInviteMember(e) {
        e.preventDefault();
        
        const email = document.getElementById('inviteEmail').value;
        const role = document.getElementById('inviteRole').value;
        const currentGroup = appState.currentGroup;
        
        if (!currentGroup) {
            showToast('error', 'Ошибка', 'Группа не выбрана');
            return;
        }
        
        // Проверяем, существует ли пользователь с таким email
        const userExists = appState.groups.some(group => group.members.some(member => member.email === email));
        
        if (!userExists) {
            showToast('error', 'Ошибка', 'Пользователь с таким email не найден');
            return;
        }
        
        // Проверяем, не является ли пользователь уже участником группы
        const isAlreadyMember = currentGroup.members.some(member => member.email === email);
        if (isAlreadyMember) {
            showToast('error', 'Ошибка', 'Этот пользователь уже является участником группы');
            return;
        }
        
        // Создаем приглашение
        const invitation = {
            id: Date.now(),
            groupId: currentGroup.id,
            groupName: currentGroup.name,
            invitedBy: appState.currentUser.email,
            role: role,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        
        // Добавляем приглашение в список приглашений пользователя
        const invitedUser = appState.groups.find(group => group.id === currentGroup.id);
        if (!invitedUser.invitations) {
            invitedUser.invitations = [];
        }
        invitedUser.invitations.push(invitation);
        
        // Сохраняем изменения
        localStorage.setItem('groups', JSON.stringify(appState.groups));
        
        // Показываем уведомление
        showToast('success', 'Успешно', 'Приглашение отправлено');
        
        // Закрываем модальное окно
        hideModal(document.getElementById('inviteMemberModal'));
        
        // Очищаем форму
        document.getElementById('inviteMemberForm').reset();
    }

    // Функция для обработки ответа на приглашение
    function handleInvitationResponse(invitationId, accepted) {
        const invitation = findInvitation(invitationId);
        if (!invitation) return;
        
        const invitedUser = appState.groups.find(group => group.id === invitation.groupId);
        const group = appState.groups.find(g => g.id === invitation.groupId);
        
        if (accepted) {
            // Добавляем пользователя в группу
            group.members.push({
                email: invitedUser.email,
                role: invitation.role,
                joinedAt: new Date().toISOString()
            });
            
            // Удаляем приглашение
            invitedUser.invitations = invitedUser.invitations.filter(inv => inv.id !== invitationId);
            
            // Показываем уведомление пользователю
            showToast('success', 'Успешно', `Вы присоединились к группе "${group.name}"`);
            
            // Если текущий пользователь - организатор группы, показываем ему уведомление
            if (group.organizer === appState.currentUser.email) {
                showToast('info', 'Новый участник', `${invitedUser.email} присоединился к группе "${group.name}"`);
            }
        } else {
            // Показываем уведомление организатору группы
            const organizer = appState.groups.find(user => user.email === group.organizer);
            if (organizer) {
                showToast('warning', 'Отклонено', `${invitedUser.email} отклонил приглашение в группу "${group.name}"`);
            }
            
            // Удаляем приглашение
            invitedUser.invitations = invitedUser.invitations.filter(inv => inv.id !== invitationId);
        }
        
        // Сохраняем изменения
        localStorage.setItem('groups', JSON.stringify(appState.groups));
    }

    // Вспомогательная функция для поиска приглашения
    function findInvitation(invitationId) {
        for (const group of appState.groups) {
            if (group.invitations) {
                const invitation = group.invitations.find(inv => inv.id === invitationId);
                if (invitation) return invitation;
            }
        }
        return null;
    }
    
    // Инициализация
    loadData();
    
    // Прослушиваем событие, когда данные групп загружены
    document.addEventListener('data-loaded', () => {
        // Проверяем наличие аутентифицированного пользователя
        if (appState.isAuthenticated && appState.currentUser) {
            // Загружаем группы пользователя
            loadUserGroups();
        }
    });
    
    // Вызываем setupUserMenu при загрузке DOM
    setupUserMenu();
    setupSettingsButtons();
}); 
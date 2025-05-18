document.addEventListener('DOMContentLoaded', () => {
    // Получение элементов формы авторизации
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Модальные окна
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    
    // Секции отображения пользователя
    const authButtons = document.getElementById('authButtons');
    const userProfile = document.getElementById('userProfile');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    
    // Состояние аутентификации
    let isAuthenticated = false;
    let currentUser = null;
    
    // Загрузка данных пользователей
    let users = [];
    
    // Загрузка пользователей из JSON-файла
    function loadUsers() {
        // Сначала проверяем, есть ли сохраненные пользователи в localStorage
        const storedUsers = localStorage.getItem('userlist');
        
        if (storedUsers) {
            try {
                // Если есть, парсим их
                users = JSON.parse(storedUsers);
                console.log('Пользователи загружены из localStorage:', users.length);
                
                // После загрузки пользователей проверяем сессию
                checkSession();
                
                // Попытка синхронизации с сервером в фоне
                syncUsersWithServer();
                return;
            } catch (error) {
                console.error('Ошибка при загрузке пользователей из localStorage:', error);
            }
        }
        
        // Если нет сохраненных пользователей или произошла ошибка, загружаем с сервера
        fetch('data/users.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                users = data;
                console.log('Пользователи загружены с сервера:', users.length);
                
                // Сохраняем загруженных пользователей в localStorage
                localStorage.setItem('userlist', JSON.stringify(users));
                
                // После загрузки пользователей проверяем сессию
                checkSession();
            })
            .catch(error => {
                console.error('Ошибка загрузки пользователей:', error);
                showNotification('error', 'Ошибка', 'Не удалось загрузить данные пользователей');
            });
    }
    
    // Функция для синхронизации пользователей с сервером (в реальном приложении)
    function syncUsersWithServer() {
        // В реальном приложении здесь был бы запрос к API для синхронизации пользователей
        // Сейчас просто для демонстрации попробуем загрузить данные с сервера
        fetch('data/users.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(serverUsers => {
                // Здесь в реальном приложении можно было бы сравнить локальных и серверных 
                // пользователей и выполнить слияние данных при необходимости
                
                // Для простоты просто обновляем список, сохраняя наших локальных пользователей
                const localUsers = JSON.parse(localStorage.getItem('userlist')) || [];
                
                // Конвертируем массивы в Map для быстрого поиска по id
                const serverUsersMap = new Map(serverUsers.map(user => [user.id, user]));
                const localUsersMap = new Map(localUsers.map(user => [user.id, user]));
                
                // Объединяем пользователей, отдавая приоритет локальным данным
                const mergedUsers = [];
                
                // Добавляем всех локальных пользователей
                localUsersMap.forEach(user => {
                    mergedUsers.push(user);
                });
                
                // Добавляем серверных пользователей, которых нет локально
                serverUsersMap.forEach(user => {
                    if (!localUsersMap.has(user.id)) {
                        mergedUsers.push(user);
                    }
                });
                
                // Обновляем пользователей и сохраняем
                users = mergedUsers;
                localStorage.setItem('userlist', JSON.stringify(users));
                
                console.log('Пользователи синхронизированы с сервером:', users.length);
            })
            .catch(error => {
                console.warn('Не удалось синхронизировать пользователей с сервером:', error);
            });
    }
    
    // Проверка существующей сессии
    function checkSession() {
        const storedUserId = localStorage.getItem('userId');
        
        if (storedUserId) {
            const userId = parseInt(storedUserId);
            const user = users.find(u => u.id === userId);
            
            if (user) {
                currentUser = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                    groups: user.groups
                };
                isAuthenticated = true;
                updateUI();
                
                // Публикация события об авторизации пользователя при восстановлении сессии
                const authEvent = new CustomEvent('userAuthenticated', {
                    detail: { user: currentUser }
                });
                document.dispatchEvent(authEvent);
            } else {
                // Если пользователь не найден, очищаем локальное хранилище
                localStorage.removeItem('userId');
            }
        }
    }
    
    // Обновление интерфейса в зависимости от состояния аутентификации
    function updateUI() {
        if (isAuthenticated) {
            authButtons.style.display = 'none';
            userProfile.style.display = 'flex';
            userAvatar.src = currentUser.avatar || 'images/default-avatar.png';
            userName.textContent = currentUser.name;
            
            // Публикация события об авторизации пользователя
            const authEvent = new CustomEvent('userAuthenticated', {
                detail: { user: currentUser }
            });
            document.dispatchEvent(authEvent);
        } else {
            authButtons.style.display = 'flex';
            userProfile.style.display = 'none';
            
            // Публикация события о выходе пользователя
            const logoutEvent = new CustomEvent('userLoggedOut');
            document.dispatchEvent(logoutEvent);
        }
    }
    
    // Обработчик входа
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        // Валидация
        if (!email || !password) {
            showError('Пожалуйста, заполните все поля');
            return;
        }
        
        // Поиск пользователя
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            login(user);
        } else {
            showError('Неверный email или пароль');
        }
    });
    
    // Обработчик регистрации
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        
        // Валидация
        if (!name || !email || !password || !confirmPassword) {
            showError('Пожалуйста, заполните все поля');
            return;
        }
        
        if (password !== confirmPassword) {
            showError('Пароли не совпадают');
            return;
        }
        
        if (password.length < 6) {
            showError('Пароль должен содержать минимум 6 символов');
            return;
        }
        
        // Проверка, что пользователь с таким email не существует
        if (users.some(u => u.email === email)) {
            showError('Пользователь с таким email уже существует');
            return;
        }
        
        // Создание нового пользователя
        const newUser = {
            id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
            name: name,
            email: email,
            password: password,
            avatar: 'images/default-avatar.png',
            groups: []
        };
        
        // Добавление нового пользователя
        users.push(newUser);
        
        // Сохранение данных пользователей в JSON-файл
        saveUsers(users);
        
        // Авторизация нового пользователя
        login(newUser);
        
        // Показываем сообщение об успешной регистрации
        showNotification('success', 'Успешная регистрация', 'Ваш аккаунт создан');
        
        // Закрытие модального окна
        if (typeof hideModal === 'function') {
            hideModal(registerModal);
        } else {
            registerModal.classList.remove('active');
        }
    });
    
    // Обработчик выхода
    logoutBtn.addEventListener('click', () => {
        logout();
    });
    
    // Функции авторизации
    
    function login(user) {
        // Удаляем пароль из объекта пользователя перед сохранением в сессии
        currentUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            groups: user.groups
        };
        
        isAuthenticated = true;
        
        // Сохранение ID пользователя в локальном хранилище для автоматической авторизации
        localStorage.setItem('userId', user.id.toString());
        
        // Обновление интерфейса
        updateUI();
        
        // Закрытие модального окна
        if (loginModal) {
            // Используем внешнюю функцию hideModal, если она определена
            if (typeof hideModal === 'function') {
                hideModal(loginModal);
            } else {
                loginModal.classList.remove('active');
            }
        }
        
        // Показ уведомления
        showNotification('success', 'Успешный вход', 'Вы вошли в систему');
    }
    
    function logout() {
        // Удаление данных из localStorage
        localStorage.removeItem('userId');
        
        currentUser = null;
        isAuthenticated = false;
        
        // Обновление интерфейса
        updateUI();
        
        // Показ уведомления
        showNotification('info', 'Выход из системы', 'Вы вышли из системы');
    }
    
    // Вспомогательные функции
    
    function showError(message) {
        showNotification('error', 'Ошибка', message);
    }
    
    function showNotification(type, title, message) {
        // Используем внешнюю функцию showToast, если она определена
        if (typeof showToast === 'function') {
            showToast(type, title, message);
            return;
        }
        
        // Запасной вариант, если функция showToast не определена
        const toast = document.createElement('div');
        toast.className = 'toast toast-' + type;
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
        
        // Добавление в контейнер или в body
        const toastContainer = document.getElementById('toastContainer') || document.body;
        toastContainer.appendChild(toast);
        
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
    
    // Экспорт функций для других скриптов
    window.auth = {
        login,
        logout,
        isAuthenticated: () => isAuthenticated,
        getCurrentUser: () => currentUser,
        getUsers: () => users,
        getUserById: (id) => users.find(u => u.id === id),
        
        // Добавляем метод для обновления данных пользователя
        updateUserData: (userId, updatedData) => {
            // Находим пользователя в массиве
            const userIndex = users.findIndex(u => u.id === userId);
            
            if (userIndex !== -1) {
                // Обновляем данные пользователя
                users[userIndex] = { ...users[userIndex], ...updatedData };
                
                // Если обновили текущего пользователя, обновляем и его
                if (currentUser && currentUser.id === userId) {
                    currentUser = {
                        id: users[userIndex].id,
                        name: users[userIndex].name,
                        email: users[userIndex].email,
                        avatar: users[userIndex].avatar,
                        groups: users[userIndex].groups
                    };
                    
                    // Обновляем интерфейс
                    updateUI();
                }
                
                // Сохраняем обновленные данные
                saveUsers(users);
                
                return true;
            }
            
            return false;
        },
        
        // Проверка существования пользователя с указанным email
        userExists: (email) => {
            return users.some(u => u.email === email);
        }
    };
    
    // Функция для сохранения данных пользователей
    function saveUsers(usersData) {
        // В реальном приложении здесь был бы запрос к API для сохранения пользователей на сервере
        // Для демонстрации будем сохранять в localStorage
        localStorage.setItem('userlist', JSON.stringify(usersData));
        
        // Отправляем данные на сервер (имитация)
        if (navigator.onLine) {
            try {
                // Создаем Blob с данными пользователей
                const usersBlob = new Blob([JSON.stringify(usersData, null, 2)], {type: 'application/json'});
                
                // Имитация отправки данных
                showNotification('info', 'Сохранение', 'Данные пользователей сохранены');
                
                // В реальном приложении здесь был бы код для отправки данных на сервер через fetch или XMLHttpRequest
            } catch (error) {
                console.error('Ошибка при сохранении пользователей:', error);
                showNotification('error', 'Ошибка', 'Не удалось сохранить данные пользователей');
            }
        } else {
            showNotification('warning', 'Офлайн', 'Данные будут синхронизированы, когда соединение будет восстановлено');
        }
    }
    
    // Инициализация: загрузка пользователей
    loadUsers();
}); 
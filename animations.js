document.addEventListener('DOMContentLoaded', () => {
    // Фоновые частицы
    const canvas = document.getElementById('particles-bg');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Установка размеров холста
    function setupCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    // Инициализация при загрузке и изменении размера окна
    setupCanvas();
    window.addEventListener('resize', setupCanvas);
    
    // Параметры частиц
    const particlesArray = [];
    const numberOfParticles = 100;
    
    // Класс частицы
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 5 + 1;
            this.speedX = Math.random() * 1 - 0.5;
            this.speedY = Math.random() * 1 - 0.5;
            this.color = getRandomColor();
        }
        
        // Обновление положения
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            
            // Отражение от границ
            if (this.x > canvas.width || this.x < 0) {
                this.speedX = -this.speedX;
            }
            if (this.y > canvas.height || this.y < 0) {
                this.speedY = -this.speedY;
            }
        }
        
        // Отрисовка
        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
        }
    }
    
    // Создание частиц
    function init() {
        for (let i = 0; i < numberOfParticles; i++) {
            particlesArray.push(new Particle());
        }
    }
    
    // Анимация частиц
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
            particlesArray[i].draw();
            
            // Соединение частиц линиями
            connectParticles(particlesArray[i], particlesArray);
        }
        
        requestAnimationFrame(animate);
    }
    
    // Соединение близких частиц линиями
    function connectParticles(particle, particles) {
        const maxDistance = 100;
        
        for (let i = 0; i < particles.length; i++) {
            const otherParticle = particles[i];
            const distance = Math.sqrt(
                Math.pow(particle.x - otherParticle.x, 2) + 
                Math.pow(particle.y - otherParticle.y, 2)
            );
            
            if (distance < maxDistance) {
                const opacity = 1 - (distance / maxDistance);
                ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.2})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(particle.x, particle.y);
                ctx.lineTo(otherParticle.x, otherParticle.y);
                ctx.stroke();
            }
        }
    }
    
    // Генерация случайного цвета
    function getRandomColor() {
        const colors = [
            'rgba(124, 77, 255, 0.7)', // Пурпурный
            'rgba(0, 180, 216, 0.7)',  // Голубой
            'rgba(0, 200, 83, 0.7)',   // Зеленый
            'rgba(255, 145, 0, 0.7)'   // Оранжевый
        ];
        
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    // Запуск анимации
    init();
    animate();
    
    // Переключение фона
    const bgToggle = document.getElementById('bgToggle');
    const spaceBackground = document.querySelector('.space-background');
    const networkBackground = document.getElementById('network-wrapper');
    
    if (bgToggle && spaceBackground && networkBackground) {
        bgToggle.addEventListener('click', () => {
            if (spaceBackground.style.display === 'block') {
                spaceBackground.style.display = 'none';
                networkBackground.style.opacity = '1';
            } else {
                spaceBackground.style.display = 'block';
                networkBackground.style.opacity = '0.3';
            }
        });
    }
    
    // Плавное появление элементов при скролле
    const fadeElements = document.querySelectorAll('.fade-in');
    
    function checkFadeElements() {
        fadeElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 150;
            
            if (elementTop < window.innerHeight - elementVisible) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    }
    
    // Первоначальная проверка видимости
    checkFadeElements();
    
    // Проверка при скролле
    window.addEventListener('scroll', checkFadeElements);
    
    // Анимация появления модальных окон
    const modals = document.querySelectorAll('.modal');
    
    modals.forEach(modal => {
        modal.addEventListener('transitionend', (e) => {
            if (!modal.classList.contains('active') && e.propertyName === 'opacity') {
                modal.style.display = 'none';
            }
        });
    });
    
    // Функция для показа модального окна с анимацией
    window.showModal = function(modal) {
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
    };
    
    // Функция для скрытия модального окна с анимацией
    window.hideModal = function(modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            if (!modal.classList.contains('active')) {
                modal.style.display = 'none';
            }
        }, 300);
    };
}); 
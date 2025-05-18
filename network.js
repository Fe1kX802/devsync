document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('network-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Размеры холста
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Параметры сети
    const nodes = [];
    const maxNodes = 80; // Количество узлов
    const nodeSize = 2;  // Размер узла
    const nodeSpeed = 0.5; // Скорость узлов
    const connectionDistance = 150; // Максимальное расстояние для соединения
    
    // Инициализация узлов
    function createNodes() {
        for (let i = 0; i < maxNodes; i++) {
            nodes.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: Math.random() * nodeSpeed * 2 - nodeSpeed,
                vy: Math.random() * nodeSpeed * 2 - nodeSpeed,
                connections: []
            });
        }
    }
    
    // Обновление положения узлов
    function updateNodes() {
        nodes.forEach(node => {
            // Движение
            node.x += node.vx;
            node.y += node.vy;
            
            // Отражение от границ
            if (node.x < 0 || node.x > canvas.width) {
                node.vx = -node.vx;
            }
            
            if (node.y < 0 || node.y > canvas.height) {
                node.vy = -node.vy;
            }
            
            // Сброс соединений
            node.connections = [];
        });
        
        // Поиск соединений
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < connectionDistance) {
                    nodes[i].connections.push({
                        node: nodes[j],
                        distance: distance
                    });
                    
                    nodes[j].connections.push({
                        node: nodes[i],
                        distance: distance
                    });
                }
            }
        }
    }
    
    // Отрисовка
    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Отрисовка соединений
        nodes.forEach(node => {
            node.connections.forEach(connection => {
                const opacity = 1 - (connection.distance / connectionDistance);
                ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.2})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(node.x, node.y);
                ctx.lineTo(connection.node.x, connection.node.y);
                ctx.stroke();
            });
        });
        
        // Отрисовка узлов
        nodes.forEach(node => {
            const gradient = ctx.createRadialGradient(
                node.x, node.y, 0,
                node.x, node.y, nodeSize * 2
            );
            
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(node.x, node.y, nodeSize * 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(node.x, node.y, nodeSize, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    // Анимация
    function animate() {
        updateNodes();
        render();
        requestAnimationFrame(animate);
    }
    
    // Реакция на движение мыши
    let mouseNode = {
        x: 0,
        y: 0,
        connections: []
    };
    
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseNode.x = e.clientX - rect.left;
        mouseNode.y = e.clientY - rect.top;
        
        // Сброс соединений
        mouseNode.connections = [];
        
        // Поиск соединений с курсором
        nodes.forEach(node => {
            const dx = mouseNode.x - node.x;
            const dy = mouseNode.y - node.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < connectionDistance * 1.5) {
                mouseNode.connections.push({
                    node: node,
                    distance: distance
                });
                
                // Добавление небольшого движения к узлу при наведении
                const angle = Math.atan2(dy, dx);
                const force = 0.2 * (1 - distance / (connectionDistance * 1.5));
                
                node.vx -= Math.cos(angle) * force;
                node.vy -= Math.sin(angle) * force;
                
                // Ограничение скорости
                const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
                if (speed > nodeSpeed * 2) {
                    node.vx = (node.vx / speed) * nodeSpeed * 2;
                    node.vy = (node.vy / speed) * nodeSpeed * 2;
                }
            }
        });
    });
    
    // Обновление отрисовки при наведении
    function renderMouse() {
        mouseNode.connections.forEach(connection => {
            const opacity = 1 - (connection.distance / (connectionDistance * 1.5));
            ctx.strokeStyle = `rgba(124, 77, 255, ${opacity * 0.4})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(mouseNode.x, mouseNode.y);
            ctx.lineTo(connection.node.x, connection.node.y);
            ctx.stroke();
        });
    }
    
    // Расширенная функция отрисовки с курсором
    const originalRender = render;
    render = function() {
        originalRender();
        renderMouse();
    };
    
    // Запуск
    createNodes();
    animate();
}); 
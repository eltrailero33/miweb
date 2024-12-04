let currentIndex = 0; // Índice de la imagen activa
    const items = document.querySelectorAll('.carousel-item'); // Selecciona todas las imágenes

    function showImage(index) {
        // Oculta todas las imágenes
        items.forEach((item) => {
            item.classList.remove('active');
        });
        // Muestra la imagen en el índice actual
        items[index].classList.add('active');
    }

    function changeImage(direction) {
        currentIndex += direction;
        // Resetea el índice si excede los límites
        if (currentIndex < 0) {
            currentIndex = items.length - 1;
        } else if (currentIndex >= items.length) {
            currentIndex = 0;
        }
        showImage(currentIndex);
    }

    // Cambia automáticamente la imagen cada 5 segundos
    setInterval(() => {
        changeImage(1); // Cambia a la siguiente imagen
    }, 2000); // 5000 milisegundos = 5 segundos

    // Muestra la primera imagen al cargar
    showImage(currentIndex);
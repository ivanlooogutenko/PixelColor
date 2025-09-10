// Данные для нашей картинки (в будущем это будет приходить с Firebase)
const artData = {
    width: 10,
    height: 10,
    palette: [
        { id: 1, color: "#4CAF50" }, // Зеленый
        { id: 2, color: "#FFC107" }, // Желтый
        { id: 3, color: "#2196F3" }  // Синий
    ],
    pixels: [
        { x: 4, y: 0, paletteId: 2 }, { x: 5, y: 0, paletteId: 2 },
        { x: 3, y: 1, paletteId: 2 }, { x: 6, y: 1, paletteId: 2 },
        { x: 2, y: 2, paletteId: 2 }, { x: 7, y: 2, paletteId: 2 },
        { x: 2, y: 3, paletteId: 2 }, { x: 7, y: 3, paletteId: 2 },
        { x: 0, y: 4, paletteId: 1 }, { x: 1, y: 4, paletteId: 1 }, { x: 8, y: 4, paletteId: 1 }, { x: 9, y: 4, paletteId: 1 },
        { x: 0, y: 5, paletteId: 1 }, { x: 2, y: 5, paletteId: 3 }, { x: 3, y: 5, paletteId: 3 }, { x: 4, y: 5, paletteId: 3 }, { x: 5, y: 5, paletteId: 3 }, { x: 6, y: 5, paletteId: 3 }, { x: 7, y: 5, paletteId: 3 }, { x: 9, y: 5, paletteId: 1 },
        { x: 0, y: 6, paletteId: 1 }, { x: 2, y: 6, paletteId: 3 }, { x: 7, y: 6, paletteId: 3 }, { x: 9, y: 6, paletteId: 1 },
        { x: 0, y: 7, paletteId: 1 }, { x: 2, y: 7, paletteId: 3 }, { x: 7, y: 7, paletteId: 3 }, { x: 9, y: 7, paletteId: 1 },
        { x: 0, y: 8, paletteId: 1 }, { x: 3, y: 8, paletteId: 1 }, { x: 4, y: 8, paletteId: 1 }, { x: 5, y: 8, paletteId: 1 }, { x: 6, y: 8, paletteId: 1 }, { x: 9, y: 8, paletteId: 1 },
        { x: 0, y: 9, paletteId: 1 }, { x: 9, y: 9, paletteId: 1 }
    ]
};

const gridContainer = document.getElementById('grid-container');
const paletteContainer = document.getElementById('palette-container');

let selectedColorId = null;
const pixelMap = new Map();

// 1. Создаем палитру
artData.palette.forEach(colorItem => {
    const colorBox = document.createElement('div');
    colorBox.className = 'color-box';
    colorBox.style.backgroundColor = colorItem.color;
    colorBox.textContent = colorItem.id;
    colorBox.dataset.colorId = colorItem.id;

    colorBox.addEventListener('click', () => {
        // Снимаем выделение с предыдущего цвета
        const currentSelected = document.querySelector('.color-box.selected');
        if (currentSelected) {
            currentSelected.classList.remove('selected');
        }
        // Выделяем новый
        colorBox.classList.add('selected');
        selectedColorId = colorItem.id;
    });

    paletteContainer.appendChild(colorBox);
});

// 2. Создаем сетку
gridContainer.style.gridTemplateColumns = `repeat(${artData.width}, 1fr)`;
for (let i = 0; i < artData.width * artData.height; i++) {
    const cell = document.createElement('div');
    cell.className = 'grid-cell';
    gridContainer.appendChild(cell);
}

// 3. Расставляем номера по сетке
artData.pixels.forEach(pixel => {
    const index = pixel.y * artData.width + pixel.x;
    const cell = gridContainer.children[index];
    cell.textContent = pixel.paletteId;
    cell.dataset.correctColorId = pixel.paletteId;

    cell.addEventListener('click', () => {
        if (selectedColorId && selectedColorId == cell.dataset.correctColorId) {
            const correctColor = artData.palette.find(p => p.id === selectedColorId).color;
            cell.style.backgroundColor = correctColor;
            cell.textContent = ''; // Убираем номер
        }
    });
});
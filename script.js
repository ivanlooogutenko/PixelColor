const MORTAR_COLOR = '#1b1714'; // более тёмный фон/затирка
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

let stoneSize;
let stones = [];
let selectedColorId = null;
let isPaletteGenerated = false;

function setup() {
    createCanvas(100, 100).parent('canvas-container'); // Временный холст
    initializeMosaic();
    if (!isPaletteGenerated) {
        generatePalette();
        isPaletteGenerated = true;
    }
    noLoop();
}

function windowResized() {
    initializeMosaic();
}

// --- Глобальные структуры для согласованных кривых рёбер ---
let gridPts = [];      // [y][x] точки узлов сетки (width+1 x height+1)
let edgesH = [];       // горизонтальные рёбра [y][x] (y:0..h, x:0..w-1)
let edgesV = [];       // вертикальные рёбра [y][x] (y:0..h-1, x:0..w)
let globalSeed = 1337; // фиксированное зерно для детерминированности

function initializeMosaic() {
    // Рассчитываем размер камня исходя из размера окна
    const padding = 40; // Отступы по бокам
    const availableWidth = windowWidth - padding;
    // Оставляем место для палитры и заголовка
    const availableHeight = windowHeight * 0.6;

    const sizeFromWidth = availableWidth / artData.width;
    const sizeFromHeight = availableHeight / artData.height;

    stoneSize = floor(min(sizeFromWidth, sizeFromHeight));

    let canvasWidth = artData.width * stoneSize;
    let canvasHeight = artData.height * stoneSize;

    resizeCanvas(canvasWidth, canvasHeight);

    // Генерируем согласованные точки и кривые рёбра
    buildGridAndEdges();

    stones = [];
    let stoneMap = new Map();
    artData.pixels.forEach(p => stoneMap.set(`${p.x},${p.y}`, p.paletteId));

    for (let y = 0; y < artData.height; y++) {
        for (let x = 0; x < artData.width; x++) {
            stones.push(new Stone(x, y, stoneMap.get(`${x},${y}`)));
        }
    }
    redraw();
}

function buildGridAndEdges() {
    // Делаем генерацию детерминированной при каждом пересчёте
    randomSeed(globalSeed);
    noiseSeed(globalSeed);

    const h = artData.height;
    const w = artData.width;

    // 1) Точки узлов с лёгким смещением (но так, чтобы не вывезти за край холста)
    gridPts = new Array(h + 1);
    const jitter = stoneSize * 0.12;
    for (let y = 0; y <= h; y++) {
        gridPts[y] = new Array(w + 1);
        for (let x = 0; x <= w; x++) {
            let baseX = x * stoneSize;
            let baseY = y * stoneSize;
            // Сохраняем крайние точки на сетке без смещения, чтобы не было зазоров у рамки
            let dx = (x === 0 || x === w) ? 0 : random(-jitter, jitter);
            let dy = (y === 0 || y === h) ? 0 : random(-jitter, jitter);
            gridPts[y][x] = createVector(baseX + dx, baseY + dy);
        }
    }

    // 2) Рёбра как кубические Безье, общие для соседних камней
    // Горизонтальные (включая верхнюю и нижнюю границы)
    edgesH = new Array(h + 1);
    for (let y = 0; y <= h; y++) {
        edgesH[y] = new Array(w);
        for (let x = 0; x < w; x++) {
            const A = gridPts[y][x];
            const B = gridPts[y][x + 1];
            edgesH[y][x] = makeCurvedEdge(A, B);
        }
    }
    // Вертикальные (включая левую и правую границы)
    edgesV = new Array(h);
    for (let y = 0; y < h; y++) {
        edgesV[y] = new Array(w + 1);
        for (let x = 0; x <= w; x++) {
            const A = gridPts[y][x];
            const B = gridPts[y + 1][x];
            edgesV[y][x] = makeCurvedEdge(A, B);
        }
    }
}

function makeCurvedEdge(A, B) {
    // Кривая Безье 3-го порядка с двумя контрольными точками по нормали к отрезку
    const dir = p5.Vector.sub(B, A);
    const len = max(1, dir.mag());
    const n = createVector(-dir.y / len, dir.x / len); // нормаль
    const ampBase = stoneSize * 0.18; // сила изгиба
    const sign = random() < 0.5 ? -1 : 1;
    const k1 = random(0.55, 1.1);
    const k2 = random(0.55, 1.1);
    const amp = ampBase * sign;
    const P1 = p5.Vector.lerp(A, B, 1 / 3).add(p5.Vector.mult(n, amp * k1));
    const P2 = p5.Vector.lerp(A, B, 2 / 3).add(p5.Vector.mult(n, amp * k2));
    return { a: A.copy(), b: B.copy(), c1: P1, c2: P2 };
}

function draw() {
    background(MORTAR_COLOR);
    for (let stone of stones) {
        stone.draw();
    }
    // Трещины в углах между камнями (поверх всего)
    drawCornerCracks();
}

function mousePressed() {
    if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;

    const gridX = floor(mouseX / stoneSize);
    const gridY = floor(mouseY / stoneSize);

    // Проверяем, что координаты в пределах массива
    if (gridX >= 0 && gridX < artData.width && gridY >= 0 && gridY < artData.height) {
        const clickedStone = stones[gridY * artData.width + gridX];
        if (clickedStone && selectedColorId !== null && selectedColorId == clickedStone.correctColorId) {
            clickedStone.isColored = true;
            redraw();
        }
    }
}


// --- Утилиты для оценки точки/касательной на кубике Безье ---
function bezierPoint2D(edge, t) {
    const u = 1 - t;
    const uu = u * u, tt = t * t;
    const uuu = uu * u, ttt = tt * t;
    const x = edge.a.x * uuu + 3 * edge.c1.x * t * uu + 3 * edge.c2.x * tt * u + edge.b.x * ttt;
    const y = edge.a.y * uuu + 3 * edge.c1.y * t * uu + 3 * edge.c2.y * tt * u + edge.b.y * ttt;
    return createVector(x, y);
}
function bezierTangent2D(edge, t) {
    const u = 1 - t;
    const x = 3 * (edge.c1.x - edge.a.x) * u * u + 6 * (edge.c2.x - edge.c1.x) * u * t + 3 * (edge.b.x - edge.c2.x) * t * t;
    const y = 3 * (edge.c1.y - edge.a.y) * u * u + 6 * (edge.c2.y - edge.c1.y) * u * t + 3 * (edge.b.y - edge.c2.y) * t * t;
    return createVector(x, y);
}
function rnd01(x, y, slot) {
    // детерминированный «рандом» на основе noise и координат
    return noise((x * 37.17 + slot * 11.3 + globalSeed * 0.01) * 0.21,
        (y * 61.7 + slot * 7.9 + globalSeed * 0.01) * 0.21);
}

function generatePalette() {
    const paletteContainer = document.getElementById('palette-container');
    paletteContainer.innerHTML = ''; // Очищаем палитру перед генерацией
    artData.palette.forEach(colorItem => {
        const colorBox = document.createElement('div');
        colorBox.className = 'color-box';
        colorBox.style.backgroundColor = colorItem.color;
        colorBox.dataset.colorId = colorItem.id;
        colorBox.textContent = colorItem.id;

        colorBox.addEventListener('click', () => {
            const currentSelected = document.querySelector('.color-box.selected');
            if (currentSelected) {
                currentSelected.classList.remove('selected');
            }
            colorBox.classList.add('selected');
            selectedColorId = colorItem.id;
        });
        paletteContainer.appendChild(colorBox);
    });
}

function drawCornerCracks() {
    const h = artData.height;
    const w = artData.width;
    const gap = max(0.5, stoneSize * 0.04);
    const weight = max(0.5, gap * 0.9);
    push();
    stroke(MORTAR_COLOR);
    strokeWeight(weight);
    strokeCap(ROUND);
    noFill();
    for (let y = 0; y <= h; y++) {
        for (let x = 0; x <= w; x++) {
            const p = gridPts[y][x];
            const branches = 2 + floor(rnd01(x, y, 900) * 3); // 2..4
            for (let b = 0; b < branches; b++) {
                // Базовый угол в одну из 8 направлений, чтобы выглядело естественнее
                const oct = floor(rnd01(x, y, 901 + b) * 8); // 0..7
                const baseAngle = oct * (PI / 4);
                const len = stoneSize * (0.12 + rnd01(x, y, 902 + b) * 0.18); // 0.12..0.30
                const steps = 6 + floor(rnd01(x, y, 903 + b) * 4); // 6..9
                const step = len / steps;
                let cx = p.x, cy = p.y;
                beginShape();
                vertex(cx, cy);
                for (let i = 0; i < steps; i++) {
                    // Небольшая дрожь угла с перлин-шумом
                    const t = i / max(1, steps - 1);
                    const j = (noise((x + i) * 0.27 + globalSeed * 0.013, (y + b) * 0.29) - 0.5) * 0.6; // ~-0.3..0.3 рад
                    const a = baseAngle + j + (rnd01(x, y, 910 + b * 13 + i) - 0.5) * 0.25;
                    cx += cos(a) * step;
                    cy += sin(a) * step;
                    vertex(cx, cy);
                }
                endShape();
                // Небольшие ответвления (иногда)
                if (rnd01(x, y, 920 + b) > 0.6) {
                    const a2 = baseAngle + (rnd01(x, y, 921 + b) - 0.5) * 0.8;
                    const l2 = len * 0.45;
                    const s2 = floor(steps * 0.5);
                    let px = p.x, py = p.y;
                    beginShape();
                    vertex(px, py);
                    for (let i = 0; i < s2; i++) {
                        const a = a2 + (rnd01(x, y, 922 + i + b) - 0.5) * 0.35;
                        px += cos(a) * (l2 / s2);
                        py += sin(a) * (l2 / s2);
                        vertex(px, py);
                    }
                    endShape();
                }
            }
        }
    }
    pop();
}
class Stone {
    constructor(x, y, correctColorId) {
        this.gridX = x;
        this.gridY = y;
        this.correctColorId = correctColorId;
        this.isColored = false;
        this.updatePosition();
        // Уникальное "зерно" для шума, чтобы узоры не повторялись
        this.noiseSeed = random(1000);
    }

    updatePosition() {
        this.px = this.gridX * stoneSize;
        this.py = this.gridY * stoneSize;
    }

    // Вспомогательная функция: обвести форму камня по согласованным кривым
    traceShapePath() {
        const gx = this.gridX;
        const gy = this.gridY;
        const A = gridPts[gy][gx]; // левый-верхний
        // Рёбра этого камня (по часовой стрелке): верх, правое, низ, левое
        const top = edgesH[gy][gx];
        const right = edgesV[gy][gx + 1];
        const bottom = edgesH[gy + 1][gx];
        const left = edgesV[gy][gx];

        // Начинаем с вершины A
        beginShape();
        vertex(A.x, A.y);
        // Верх (из A в B)
        bezierVertex(top.c1.x, top.c1.y, top.c2.x, top.c2.y, top.b.x, top.b.y);
        // Правое (из правого-верхнего в правый-нижний)
        bezierVertex(right.c1.x, right.c1.y, right.c2.x, right.c2.y, right.b.x, right.b.y);
        // Низ (НАЗАД: из правого-нижнего в левый-нижний)
        bezierVertex(bottom.c2.x, bottom.c2.y, bottom.c1.x, bottom.c1.y, bottom.a.x, bottom.a.y);
        // Левое (НАЗАД: из левого-нижнего в левый-верхний)
        bezierVertex(left.c2.x, left.c2.y, left.c1.x, left.c1.y, left.a.x, left.a.y);
        endShape(CLOSE);
    }

    // Та же форма, но как путь Canvas 2D без отрисовки — для clip()
    buildPathOnContext(ctx) {
        const gx = this.gridX;
        const gy = this.gridY;
        const A = gridPts[gy][gx];
        const top = edgesH[gy][gx];
        const right = edgesV[gy][gx + 1];
        const bottom = edgesH[gy + 1][gx];
        const left = edgesV[gy][gx];

        ctx.beginPath();
        ctx.moveTo(A.x, A.y);
        ctx.bezierCurveTo(top.c1.x, top.c1.y, top.c2.x, top.c2.y, top.b.x, top.b.y);
        ctx.bezierCurveTo(right.c1.x, right.c1.y, right.c2.x, right.c2.y, right.b.x, right.b.y);
        ctx.bezierCurveTo(bottom.c2.x, bottom.c2.y, bottom.c1.x, bottom.c1.y, bottom.a.x, bottom.a.y);
        ctx.bezierCurveTo(left.c2.x, left.c2.y, left.c1.x, left.c1.y, left.a.x, left.a.y);
        ctx.closePath();
    }

    // ⭐ НОВАЯ ФУНКЦИЯ ДЛЯ ОТРИСОВКИ ТЕКСТУРЫ ⭐
    drawTexture() {
        // Создаем "маску" по форме камня, чтобы текстура не вылезала за края
        const ctx = drawingContext;
        ctx.save();
        this.buildPathOnContext(ctx);
        ctx.clip();

        // Рисуем несколько "прожилок" с помощью шума
        for (let i = 0; i < 3; i++) { // 3 главные вены
            let veinX = this.px + stoneSize / 2;
            let veinY = this.py - 10; // Начинаем чуть сверху

            // У каждой вены свой уникальный путь
            let noiseShift = i * 100;

            for (let j = 0; j < 50; j++) { // Вена состоит из 50 сегментов
                // Шум Перлина определяет угол движения
                let angle = noise(this.noiseSeed + veinX * 0.05, this.noiseSeed + veinY * 0.05 + noiseShift) * TWO_PI * 2;

                veinX += cos(angle) * 2;
                veinY += sin(angle) * 2;

                // Рисуем полупрозрачный эллипс как сегмент вены
                noStroke();
                fill(255, 255, 255, 30); // Полупрозрачный белый
                ellipse(veinX, veinY, 3, 3);
            }
        }
        ctx.restore(); // Снимаем маску
    }

    drawShadow() {
        const ctx = drawingContext;
        ctx.save();
        this.buildPathOnContext(ctx);
        ctx.clip();

        const colorInfo = artData.palette.find(p => p.id === this.correctColorId);
        const baseC = color(colorInfo.color);

        // Уменьшаем яркость для тени
        colorMode(HSB);
        const shadowColor = color(
            hue(baseC),
            saturation(baseC) * 1.1, // Немного увеличиваем насыщенность
            brightness(baseC) * 0.7 // Уменьшаем яркость
        );
        colorMode(RGB);

        fill(shadowColor);
        noStroke();

        // Координаты углов треугольника
        const cornerX = this.px;
        const cornerY = this.py + stoneSize;
        const size = stoneSize * 0.6; // Размер тени

        // Рисуем закругленный треугольник
        push();
        translate(cornerX, cornerY);
        beginShape();
        // Используем curveVertex для сглаживания
        curveVertex(0, size * 0.2);  // "Ручка"
        curveVertex(0, 0);           // Левый нижний угол
        curveVertex(size, 0);        // Нижняя сторона
        curveVertex(0, -size);       // Левая сторона
        curveVertex(-size * 0.2, 0); // "Ручка"
        endShape(CLOSE);
        pop();

        ctx.restore();
    }

    drawHighlight() {
        const ctx = drawingContext;
        ctx.save();
        this.buildPathOnContext(ctx);
        ctx.clip();

        const colorInfo = artData.palette.find(p => p.id === this.correctColorId);
        const baseC = color(colorInfo.color);
        
        // Смешиваем основной цвет с белым для получения блика
        const whiteColor = color(255, 255, 255);
        const highlightColor = lerpColor(baseC, whiteColor, 0.4); // 40% к белому

        fill(highlightColor);
        noStroke();

        // Координаты углов треугольника
        const cornerX = this.px + stoneSize;
        const cornerY = this.py;
        const size = stoneSize * 0.6; // Размер блика

        // Рисуем закругленный треугольник
        push();
        translate(cornerX, cornerY);
        beginShape();
        // Используем curveVertex для сглаживания, добавляя "фантомные" точки
        curveVertex(0, -size * 0.2); // "Ручка" для сглаживания верхнего угла
        curveVertex(0, 0);           // Верхний правый угол
        curveVertex(-size, 0);       // Верхняя сторона
        curveVertex(0, size);        // Правая сторона
        curveVertex(size * 0.2, 0);  // "Ручка" для сглаживания правого угла
        endShape(CLOSE);
        pop();

        ctx.restore();
    }

    drawGrain() {
        // Этот метод теперь будет управлять шумом пикселей.
        // Мы будем вызывать loadPixels() и updatePixels() в основном цикле отрисовки.
        const x_start = floor(this.px);
        const y_start = floor(this.py);
        const x_end = ceil(this.px + stoneSize);
        const y_end = ceil(this.py + stoneSize);

        const d = pixelDensity();
        const grainAmount = 80; // Интенсивность зерна (0-255)

        for (let x = x_start; x < x_end; x++) {
            for (let y = y_start; y < y_end; y++) {
                // Пропускаем пиксели за пределами холста
                if (x < 0 || x >= width || y < 0 || y >= height) continue;

                // Генерируем значение шума для каждого пикселя
                const noiseValue = (random() - 0.5) * grainAmount;

                for (let i = 0; i < d; i++) {
                    for (let j = 0; j < d; j++) {
                        const pixelIndex = 4 * ((y * d + j) * width * d + (x * d + i));
                        
                        // Применяем шум к RGB каналам пикселя
                        pixels[pixelIndex]     += noiseValue;
                        pixels[pixelIndex + 1] += noiseValue;
                        pixels[pixelIndex + 2] += noiseValue;
                    }
                }
            }
        }
    }

    draw() {
        // 1. Рисуем основную форму и цвет камня
        stroke(MORTAR_COLOR);
        const gap = max(0.5, stoneSize * 0.04); // ширина «затирки» (в 2 раза тоньше)
        strokeWeight(gap);

        let baseColor;
        if (this.isColored) {
            const colorInfo = artData.palette.find(p => p.id === this.correctColorId);
            baseColor = color(colorInfo.color);
        } else {
            baseColor = color('#eceff1');
        }
        fill(baseColor);
        this.traceShapePath();

        // 2. ⭐ Рисуем текстуру поверх основного цвета
        if (this.isColored) {
            this.drawShadow();
            this.drawHighlight();
            this.drawGrain();
            this.drawTexture();
        }
        // 2.1. Небольшие сколы по краям (рисуются цветом затирки поверх камня)
        this.drawChips();

        // 3. Рисуем номер, если нужно
        if (!this.isColored && this.correctColorId) {
            noStroke();
            fill(50);
            textAlign(CENTER, CENTER);
            textSize(stoneSize * 0.4);
            text(this.correctColorId, this.px + stoneSize / 2, this.py + stoneSize / 2);
        }
    }
    drawChips() {
        const gx = this.gridX, gy = this.gridY;
        const edges = [
            edgesH[gy][gx],          // top (A->B)
            edgesV[gy][gx + 1],      // right (A->B)
            edgesH[gy + 1][gx],      // bottom (A->B)
            edgesV[gy][gx]           // left (A->B)
        ];
        const ctx = drawingContext;
        ctx.save();
        this.buildPathOnContext(ctx);
        ctx.clip();
        noStroke();
        fill(MORTAR_COLOR);

        const chipsPerStone = 2 + floor(rnd01(gx, gy, 100) * 3); // 2..4
        const chipR = stoneSize * 0.1;
        for (let i = 0; i < chipsPerStone; i++) {
            const eIdx = floor(rnd01(gx, gy, 200 + i) * 4);
            const e = edges[eIdx];
            const t = constrain(rnd01(gx, gy, 300 + i), 0.15, 0.85);
            const p = bezierPoint2D(e, t);
            const tan = bezierTangent2D(e, t);
            if (tan.mag() < 0.0001) continue;
            tan.normalize();
            let n = createVector(-tan.y, tan.x);
            if (eIdx === 2 || eIdx === 3) n.mult(-1);
            const inset = stoneSize * (0.06 + rnd01(gx, gy, 400 + i) * 0.08);
            const cx = p.x + n.x * inset;
            const cy = p.y + n.y * inset;
            const r = chipR * (0.7 + rnd01(gx, gy, 500 + i) * 0.8);
            push();
            translate(cx, cy);
            rotate(atan2(tan.y, tan.x));
            // уменьшена ширина скола (было r*1.2)
            ellipse(0, 0, r * 0.6, r * 0.7);
            pop();
        }
        ctx.restore();
    }
}
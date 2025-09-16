// Переработанная версия: корректные вертикальные узоры + внутренний отступ
class MeanderBorder {
    constructor(borderSize, speed = 0.15, innerPadding = 4) {
        this.borderSize = borderSize;      // Толщина полосы рамки
        this.speed = speed;                // Скорость движения узора
        this.innerPadding = innerPadding;  // Отступ внутри полосы для узора
        this.offset = 0;                   // Текущее смещение анимации
        this.lineColor = '#40311E';
        this.bgColor = '#C8A989';
        this.strokeW = 2;
    }

    update() {
        // Шаг зависит от «ширины» элемента (берём высоту полосы минус отступы)
        const unitH = max(4, this.borderSize - this.innerPadding * 2);
        const stepW = unitH * 1.5; // из оригинального узора
        this.offset = (this.offset + this.speed) % stepW;
    }

    draw() {
        this.update();
        const bs = this.borderSize;
        const pad = this.innerPadding;
        const w = width;
        const h = height;
        push();
        noStroke();
        fill(this.bgColor);
        // Четыре полосы рамки
        rect(0, 0, w, bs);             // top
        rect(0, h - bs, w, bs);        // bottom
        rect(0, bs, bs, h - 2 * bs);   // left (между углами)
        rect(w - bs, bs, bs, h - 2 * bs); // right (между углами)

        // Рисуем узор поверх
        stroke(this.lineColor);
        strokeWeight(this.strokeW);
        strokeCap(SQUARE);
        noFill();

    // 1) Вертикальные полосы (сначала, чтобы горизонтальные лежали сверху)
    this.drawBand({ x: 0, y: bs, length: h - 2 * bs, horizontal: false, reverse: false, pad, thickness: bs });
    this.drawBand({ x: w - bs, y: bs, length: h - 2 * bs, horizontal: false, reverse: true, pad, thickness: bs });

    // 2) Тени от горизонтальных на вертикальные
    this.drawCastShadows(w, h, bs, pad);

    // 3) Горизонтальные полосы (верх / низ) поверх теней
    this.drawBand({ x: 0, y: 0, length: w, horizontal: true, reverse: false, pad, thickness: bs });
    this.drawBand({ x: 0, y: h - bs, length: w, horizontal: true, reverse: true, pad, thickness: bs });

        pop();
    }

    // Зернистые тени, «падающие» с верхней и нижней горизонтали на вертикали
    drawCastShadows(w, h, bs, pad) {
        const ctx = drawingContext;
        const leftX = 0;
        const rightX = w - bs;
        const vertY = bs;
        const vertH = h - 2 * bs;
        if (vertH <= 0) return;

        const shadowDepth = min(bs * 1.2, vertH * 0.25); // глубина падения

        // Функция рисует градиент + зерно для одной полосы
        const drawShadowBlock = (x1, x2) => {
            if (x2 <= x1) return;
            // Градиент вниз от верхней горизонтали
            for (let y = 0; y < shadowDepth; y++) {
                const t = y / shadowDepth; // 0..1
                const fall = pow(1 - t, 1.4); // плавное затухание
                const alpha = 70 * fall; // базовая прозрачность
                ctx.fillStyle = `rgba(64,49,30,${(alpha/255).toFixed(3)})`;
                ctx.fillRect(x1, vertY + y, x2 - x1, 1);
            }
            // Градиент вверх от нижней горизонтали
            for (let y = 0; y < shadowDepth; y++) {
                const t = y / shadowDepth;
                const fall = pow(1 - t, 1.4);
                const alpha = 55 * fall;
                ctx.fillStyle = `rgba(64,49,30,${(alpha/255).toFixed(3)})`;
                ctx.fillRect(x1, vertY + vertH - 1 - y, x2 - x1, 1);
            }
            // Зерно: детерминированный шаблон без мерцания
            const widthBand = x2 - x1;
            const grainStep = 2; // шаг сетки для пиксельного вида
            const colorPalette = [
                [80, 60, 40], // reddish brown
                [70, 55, 35], // yellowish brown
                [50, 40, 25], // dark brown
                [64, 49, 30], // original
            ];

            for (let gy = 0; gy < shadowDepth; gy += grainStep) {
                const t = gy / shadowDepth;
                const fall = pow(1 - t, 1.2);
                for (let gx = 0; gx < widthBand; gx += grainStep) {
                    // Шахматный узор: рисуем только на "черных" клетках
                    if (((gx / grainStep) + (gy / grainStep)) % 2 === 0) {
                        const hash = (gx * 131 + gy * 977) & 255;
                        if (hash < 200 * fall) { // Увеличим вероятность для шахматного узора
                            const color = colorPalette[hash % colorPalette.length];
                            const a = (0.35 + (hash / 255) * 0.35) * fall;
                            ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${a.toFixed(3)})`;
                            ctx.fillRect(x1 + gx, vertY + gy, grainStep, grainStep);
                        }
                    }
                }
            }
            // Нижняя часть зерна (от нижнего края вверх)
            for (let gy = 0; gy < shadowDepth; gy += grainStep) {
                const t = gy / shadowDepth;
                const fall = pow(1 - t, 1.2);
                for (let gx = 0; gx < widthBand; gx += grainStep) {
                     if (((gx / grainStep) + (gy / grainStep)) % 2 === 0) {
                        const hash = ( (gx+17) * 197 + (gy+23) * 487 ) & 255;
                        if (hash < 180 * fall) {
                            const color = colorPalette[hash % colorPalette.length];
                            const a = (0.30 + (hash / 255) * 0.30) * fall;
                            ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${a.toFixed(3)})`;
                            ctx.fillRect(x1 + gx, vertY + vertH - 1 - gy, grainStep, grainStep);
                        }
                    }
                }
            }
        };

        drawShadowBlock(leftX, leftX + bs);
        drawShadowBlock(rightX, rightX + bs);
    }

    drawBand({ x, y, length, horizontal, reverse, pad, thickness }) {
        const innerSize = thickness - pad * 2; // рабочая «толщина» для узора
        if (innerSize <= 2) return;
        const unit = innerSize; // базовый квадрат узора
        const step = unit * 1.5;
        const count = Math.ceil(length / step) + 2;
        const start = -step + (reverse ? (step - this.offset) : this.offset);

        if (horizontal) {
            // --- Горизонтальная версия ---
            push();
            translate(x, y);
            drawingContext.save();
            drawingContext.beginPath();
            drawingContext.rect(0, pad, length, innerSize);
            drawingContext.clip();
            beginShape();
            vertex(start - unit, pad + innerSize);
            const topY = pad;
            for (let i = 0; i < count; i++) {
                const cx = start + i * step;
                // элемент
                vertex(cx, topY + innerSize);   // нижняя линия слева
                vertex(cx, topY);               // вверх
                vertex(cx + unit, topY);        // вправо верх
                vertex(cx + unit, topY + innerSize / 2); // вниз до середины
                vertex(cx + unit / 2, topY + innerSize / 2); // влево в середине
                vertex(cx + unit / 2, topY + innerSize);     // вниз
                vertex(cx + unit, topY + innerSize);         // вправо низ
                if (i < count - 1) {
                    const after = cx + unit + (step - unit);
                    vertex(after, topY + innerSize); // соединительная линия по низу
                }
            }
            endShape();
            drawingContext.restore();
            pop();
        } else {
            // --- Вертикальная версия ---
            push();
            translate(x, y);
            drawingContext.save();
            drawingContext.beginPath();
            // Клип: ширина полосы = thickness, рабочая зона = pad..pad+innerSize по X, длина по Y
            drawingContext.rect(pad, 0, innerSize, length);
            drawingContext.clip();
            beginShape();
            // Стартовая вертикальная линия
            vertex(pad + innerSize, start - unit); // вход сверху
            const leftX = pad; // левый край рабочей зоны
            for (let i = 0; i < count; i++) {
                const cy = start + i * step;
                // элемент (аналог повернутого на 90°)
                vertex(pad + innerSize, cy);          // правая вертикаль сверху
                vertex(leftX, cy);                    // влево верх
                vertex(leftX, cy + unit);             // вниз левый
                vertex(leftX + innerSize / 2, cy + unit);   // вправо низ середины
                vertex(leftX + innerSize / 2, cy + unit / 2); // вверх в середине
                vertex(pad + innerSize, cy + unit / 2);       // вправо середина
                vertex(pad + innerSize, cy + unit);           // вниз право
                if (i < count - 1) {
                    const afterY = cy + unit + (step - unit);
                    vertex(pad + innerSize, afterY); // соединительная вертикальная линия по правому краю
                }
            }
            endShape();
            drawingContext.restore();
            pop();
        }
    }
}
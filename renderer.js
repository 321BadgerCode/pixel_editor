const canvas = document.getElementById("pixel-canvas");
const ctx = canvas.getContext("2d");
let gridWidth = 16, gridHeight = 16;
let cellSize = 20;
let pixelData = [];

const colorPicker = document.getElementById("color-picker");
const royDropdown = document.getElementById("roygbiv-dropdown");
const toolSelect = document.getElementById("tool");

function initGrid() {
	canvas.width = gridWidth * cellSize;
	canvas.height = gridHeight * cellSize;
	pixelData = Array.from({ length: gridHeight }, () =>
		Array(gridWidth).fill("#ffffff00")
	);
	drawGrid();
}

function drawGrid() {
	for (let y = 0; y < gridHeight; y++) {
		for (let x = 0; x < gridWidth; x++) {
			ctx.fillStyle = pixelData[y][x] || "#ffffff00";
			ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
			ctx.strokeStyle = "#ccc";
			ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
		}
	}
}

function drawLine(x1, y1, x2, y2) {
	const dx = Math.abs(x2 - x1);
	const dy = Math.abs(y2 - y1);
	const sx = (x1 < x2) ? 1 : -1;
	const sy = (y1 < y2) ? 1 : -1;
	let err = dx - dy;

	while (true) {
		pixelData[y1][x1] = colorPicker.value;
		if (x1 === x2 && y1 === y2) break;
		const err2 = err * 2;
		if (err2 > -dy) {
			err -= dy;
			x1 += sx;
		}
		if (err2 < dx) {
			err += dx;
			y1 += sy;
		}
	}
}

function getContrastYIQ(hex) {
	let r = parseInt(hex.substr(1,2),16);
	let g = parseInt(hex.substr(3,2),16);
	let b = parseInt(hex.substr(5,2),16);
	let yiq = ((r*299)+(g*587)+(b*114))/1000;
	return (yiq >= 128) ? '#000' : '#fff';
}

function updateRoyDropdownColor(color) {
	royDropdown.style.backgroundColor = color;
	royDropdown.style.color = getContrastYIQ(color);
}

let firstX = -1, firstY = -1;
let lastX = -1, lastY = -1;
let count = 0;

colorPicker.addEventListener('input', () => {
	updateRoyDropdownColor(colorPicker.value);
});

royDropdown.addEventListener("change", () => {
	const selectedColor = royDropdown.value;
	colorPicker.value = selectedColor;
	updateRoyDropdownColor(selectedColor);
});

canvas.addEventListener("click", (e) => {
	const x = Math.floor(e.offsetX / cellSize);
	const y = Math.floor(e.offsetY / cellSize);
	const tool = toolSelect.value;
	if (tool === "pencil") {
		pixelData[y][x] = colorPicker.value;
		count = (count + 1) % 3;
		if (count === 1) {
			firstX = x; firstY = y;
		} else if (count === 2) {
			lastX = x; lastY = y;
		}
		if (colorPicker.value === pixelData[y][x] && (count === 0 && (x === firstX && y === firstY))) {
			drawLine(firstX, firstY, lastX, lastY);
		}
	}
	else if (tool === "eraser") pixelData[y][x] = "#ffffff00";
	else if (tool === "fill") fillColor(x, y, pixelData[y][x], colorPicker.value);
	drawGrid();
});

function fillColor(x, y, targetColor, newColor) {
	if (x < 0 || y < 0 || x >= gridWidth || y >= gridHeight) return;
	if (pixelData[y][x] !== targetColor || pixelData[y][x] === newColor) return;

	pixelData[y][x] = newColor;
	fillColor(x + 1, y, targetColor, newColor);
	fillColor(x - 1, y, targetColor, newColor);
	fillColor(x, y + 1, targetColor, newColor);
	fillColor(x, y - 1, targetColor, newColor);
}

function resizePixelData(pixelData, newWidth, newHeight) {
	const oldHeight = pixelData.length;
	const oldWidth = pixelData[0].length;

	const newPixelData = Array.from({ length: newHeight }, () =>
		Array(newWidth).fill("#ffffff00")
	);

	for (let y = 0; y < newHeight; y++) {
		for (let x = 0; x < newWidth; x++) {
			const srcX = Math.floor((x / newWidth) * oldWidth);
			const srcY = Math.floor((y / newHeight) * oldHeight);
			newPixelData[y][x] = pixelData[srcY][srcX];
		}
	}

	return newPixelData;
}

document.getElementById("resize-btn").onclick = () => {
	gridWidth = parseInt(document.getElementById("grid-width").value);
	gridHeight = parseInt(document.getElementById("grid-height").value);
	if (isNaN(gridWidth) || isNaN(gridHeight) || isNaN(cellSize) || gridWidth <= 0 || gridHeight <= 0 || cellSize <= 0) {
		alert("Please enter valid dimensions.");
		return;
	}
	pixelData = resizePixelData(pixelData, gridWidth, gridHeight);
	canvas.width = gridWidth * cellSize;
	canvas.height = gridHeight * cellSize;
	drawGrid();
};

document.getElementById("clear-btn").onclick = () => {
	initGrid();
};

document.getElementById("export-btn").onclick = () => {
	const exportCanvas = document.createElement("canvas");
	exportCanvas.width = gridWidth;
	exportCanvas.height = gridHeight;
	const exportCtx = exportCanvas.getContext("2d");
	for (let y = 0; y < gridHeight; y++) {
		for (let x = 0; x < gridWidth; x++) {
			exportCtx.fillStyle = pixelData[y][x] || "#ffffff00";
			exportCtx.fillRect(x, y, 1, 1);
		}
	}
	const link = document.createElement('a');
	link.download = "pixel-art.png";
	link.href = exportCanvas.toDataURL();
	link.click();
};

document.getElementById("import-btn").onclick = () => {
	const input = document.createElement("input");
	input.type = "file";
	input.accept = "image/png, image/jpeg, image/bmp";
	input.onchange = (event) => {
		const file = event.target.files[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			const img = new Image();
			img.onload = () => {
				gridWidth = img.width;
				gridHeight = img.height;
				cellSize = 20;
				document.getElementById("grid-width").value = gridWidth;
				document.getElementById("grid-height").value = gridHeight;
				initGrid();
				ctx.drawImage(img, 0, 0, gridWidth, gridHeight);
				const data = ctx.getImageData(0, 0, gridWidth, gridHeight).data;
				for (let y = 0; y < gridHeight; y++) {
					for (let x = 0; x < gridWidth; x++) {
						const index = (y * gridWidth + x) * 4;
						const r = data[index];
						const g = data[index + 1];
						const b = data[index + 2];
						const a = data[index + 3] / 255;
						pixelData[y][x] = `rgba(${r}, ${g}, ${b}, ${a})`;
					}
				}
				drawGrid();
			};
			img.src = e.target.result;
		};
		reader.readAsDataURL(file);
	};
	input.click();
}

initGrid();
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const canvas = document.getElementById('canvas');
const saveBtn = document.getElementById('save-btn');
const cropBtn = document.getElementById('crop-btn');
const effectBtn = document.getElementById('effect-btn');
const effectOptions = document.getElementById('effect-options');
const effectSelect = document.getElementById('effect-select');
const dimensionOptions = document.getElementById('dimension-options');
const textOptions = document.getElementById('text-options');
const deleteBtn = document.getElementById('delete-btn');
const ctx = canvas.getContext('2d');

let img = null;
let selectionStartX = 0;
let selectionStartY = 0;
let selectedArea = null;
let isSelecting = false;

function showUI() {
    canvas.style.display = 'block';
    histogramCanvas.style.display = 'block';
    cropBtn.style.display = 'inline-block';
    saveBtn.style.display = 'inline-block';
    effectBtn.style.display = 'inline-block';
    effectOptions.style.display = 'inline-block';
    dimensionOptions.style.display = 'inline-block';
    textOptions.style.display = 'inline-block';
    deleteBtn.style.display = 'inline-block';
    scaleBtn.style.display = 'inline-block';
    addTextBtn.style.display = 'inline-block';
}

//Loading imagine
function loadImage(file) {
    const reader = new FileReader();
    reader.onload = function () {
        img = new Image();
        img.onload = function () {
            canvas.width = img.width / 2.5;
            canvas.height = img.height / 2.5;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            showUI();
        };
        img.src = reader.result;
    };
    reader.readAsDataURL(file);
}

function clearSelection() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
}

//Saving imagine
saveBtn.addEventListener('click', function () {
    const link = document.createElement('a');
    link.download = 'edited-image.png';

    //Create a link to the image data
    link.href = canvas.toDataURL('image/png');
    link.click();
});

//Upload imagine
fileInput.addEventListener('change', function () {
    const file = fileInput.files[0];
    if (file && file.type.startsWith('image/')) {
        loadImage(file);
    }
});

//Drag and drop
uploadArea.addEventListener('dragover', function (e) {
    e.preventDefault();
    uploadArea.style.borderColor = '#007bff';
});

uploadArea.addEventListener('dragleave', function () {
    uploadArea.style.borderColor = '#ccc';
});

uploadArea.addEventListener('drop', function (e) {
    e.preventDefault();
    uploadArea.style.borderColor = '#ccc';
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        loadImage(file);
    }
});

//Selection
canvas.addEventListener('mousedown', function (e) {
    isSelecting = true;
    selectionStartX = e.offsetX;
    selectionStartY = e.offsetY;
    updateHistogram();
});

canvas.addEventListener('mouseup', function () {
    isSelecting = false;
    if (selectedArea) {
        if (selectedArea.width < 0) {
            selectedArea.x += selectedArea.width;
            selectedArea.width = -selectedArea.width;
        }
        if (selectedArea.height < 0) {
            selectedArea.y += selectedArea.height;
            selectedArea.height = -selectedArea.height;
        }
    }
    updateHistogram();
});

//Crop
cropBtn.addEventListener('click', function () {
    if (selectedArea != null) {
        //Get the cropped image data
        const imageData = ctx.getImageData(
            selectedArea.x, selectedArea.y, selectedArea.width, selectedArea.height
        );

        clearSelection();
        canvas.width = selectedArea.width;
        canvas.height = selectedArea.height;
        ctx.putImageData(imageData, 0, 0);

        //Update the img object with the cropped image
        img = new Image();
        img.onload = function () {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = canvas.toDataURL();

        selectedArea = null;
    } else {
        alert('Select the area you want to crop.');
    }
});

//Effects
effectBtn.addEventListener('click', function () {
    if (selectedArea != null) {
        clearSelection();

        const x = selectedArea.x;
        const y = selectedArea.y;
        const w = selectedArea.width;
        const h = selectedArea.height;

        const imageData = ctx.getImageData(x, y, w, h);
        const data = imageData.data;

        const effect = effectSelect.value;

        if (effect == 'grayscale') {
            for (let i = 0; i < data.length; i += 4) {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                data[i] = avg; // R
                data[i + 1] = avg; // G
                data[i + 2] = avg; // B
            }
        } else if (effect == 'sepia') {
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                data[i] = 0.393 * r + 0.769 * g + 0.189 * b; // R
                data[i + 1] = 0.349 * r + 0.686 * g + 0.168 * b; // G
                data[i + 2] = 0.272 * r + 0.534 * g + 0.131 * b; // B
            }
        } else if (effect == 'invert') {
            for (let i = 0; i < data.length; i += 4) {
                data[i] = 255 - data[i]; // R
                data[i + 1] = 255 - data[i + 1]; // G
                data[i + 2] = 255 - data[i + 2]; // B
            }
        }

        ctx.putImageData(imageData, x, y);

        img = new Image();
        img.onload = function () {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = canvas.toDataURL();

        selectedArea = null;
    } else {
        alert('Select the area where you want to apply the effect.');
    }
});

//Scaling
const scaleBtn = document.getElementById('scale-btn');
const newWidthInput = document.getElementById('new-width-number');
const newHeightInput = document.getElementById('new-height-number');

scaleBtn.addEventListener('click', function () {
    const newWidth = parseInt(newWidthInput.value);
    const newHeight = parseInt(newHeightInput.value);

    if (newWidth && !newHeight) {
        //If only the width is provided, calculate the height based on the aspect ratio
        const aspectRatio = img.height / img.width;
        const calculatedHeight = newWidth * aspectRatio;

        //Resize the canvas and redraw the image
        canvas.width = newWidth;
        canvas.height = calculatedHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, newWidth, calculatedHeight);

    } else if (!newWidth && newHeight) {
        //If only the height is provided, calculate the width based on the aspect ratio
        const aspectRatio = img.width / img.height;
        const calculatedWidth = newHeight * aspectRatio;

        canvas.width = calculatedWidth;
        canvas.height = newHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, calculatedWidth, newHeight);
    } else {
        alert('Select either the width or height.');
    }
});

//Add text
const textInput = document.getElementById('text-input');
const fontSizeInput = document.getElementById('font-size');
const textColorInput = document.getElementById('text-color');
const textXInput = document.getElementById('text-x');
const textYInput = document.getElementById('text-y');
const addTextBtn = document.getElementById('add-text-btn');

addTextBtn.addEventListener('click', function () {
    const text = textInput.value;
    const fontSize = parseInt(fontSizeInput.value);
    const textColor = textColorInput.value;
    const posX = parseInt(textXInput.value);
    const posY = parseInt(textYInput.value);

    if (!text) {
        alert('You have to add some text!');
        return;
    }
    if (!fontSize || !posX || !posY) {
        alert('You have to provide a font size and XY positions!');
        return;
    }

    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = textColor;

    ctx.fillText(text, posX, posY);
});

//Histogram
const histogramCanvas = document.getElementById('histogramCanvas');
const histogramCtx = histogramCanvas.getContext('2d');

let histogramData = { red: [], green: [], blue: [] };

function calculateHistogram(imageData) {
    const data = imageData.data;
    const red = Array(256).fill(0);
    const green = Array(256).fill(0);
    const blue = Array(256).fill(0);

    for (let i = 0; i < data.length; i += 4) {
        red[data[i]]++;
        green[data[i + 1]]++;
        blue[data[i + 2]]++;
    }

    return { red, green, blue };
}

//Draw the histogram
function drawHistogram() {
    histogramCtx.clearRect(0, 0, histogramCanvas.width, histogramCanvas.height);

    const maxValue = Math.max(...histogramData.red, ...histogramData.green, ...histogramData.blue);

    drawColorHistogram(histogramData.red, 'red', 0);
    drawColorHistogram(histogramData.green, 'green', 1);
    drawColorHistogram(histogramData.blue, 'blue', 2);
}

function drawColorHistogram(data, color, index) {
    histogramCtx.strokeStyle = color;
    histogramCtx.fillStyle = color;
    histogramCtx.beginPath();
    const width = histogramCanvas.width / 256;
    for (let i = 0; i < 256; i++) {
        const height = (data[i] / Math.max(...data)) * histogramCanvas.height;
        histogramCtx.fillRect(i * width, histogramCanvas.height - height, width, height);
    }
}

function updateHistogram() {
    if (selectedArea != null) {
        const imageData = ctx.getImageData(
            selectedArea.x, selectedArea.y, selectedArea.width, selectedArea.height
        );
        histogramData = calculateHistogram(imageData);
        drawHistogram();
    }
}

//Update histogram when selecting an area
canvas.addEventListener('mousemove', function (e) {
    if (isSelecting) {
        const width = e.offsetX - selectionStartX;
        const height = e.offsetY - selectionStartY;

        selectedArea = { x: selectionStartX, y: selectionStartY, width: width, height: height };

        updateHistogram();

        clearSelection();
        ctx.beginPath();
        ctx.rect(selectionStartX, selectionStartY, width, height);
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
});

//Delete
let whitePixels = [];

function clearSelection() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    whitePixels.forEach((pixel) => {
        ctx.putImageData(pixel.imageData, pixel.x, pixel.y);
    });
}

deleteBtn.addEventListener('click', function () {
    if (selectedArea != null) {
        const imageData = ctx.getImageData(selectedArea.x, selectedArea.y, selectedArea.width, selectedArea.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            data[i] = 255;       // R
            data[i + 1] = 255;   // G
            data[i + 2] = 255;   // B
        }

        whitePixels.push({
            imageData: imageData,
            x: selectedArea.x,
            y: selectedArea.y
        });

        ctx.putImageData(imageData, selectedArea.x, selectedArea.y);

        selectedArea = null;
    } else {
        alert('You have to select an area to delete.');
    }
});
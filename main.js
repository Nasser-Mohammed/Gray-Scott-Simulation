const canvas = document.getElementById("canvas2d");
const ctx = canvas.getContext("2d");

const size = 400;

canvas.width = size;
canvas.height = size;

// Pattern-forming Gray–Scott parameters
let Du = 0.16, Dv = 0.08, F = 0.037, k = 0.060;
const dt = 0.75;

let U, V, nextU, nextV;
let painting = false;
let paintButton = 0; // 0 = left(V), 2 = right(U)

function initialize() {
  U = new Float32Array(size * size).fill(1);
  V = new Float32Array(size * size).fill(0);
  nextU = new Float32Array(size * size);
  nextV = new Float32Array(size * size);
}

function lap(arr, x, y) {
  const i = x + y * size;
  let sum = 0;
  sum += arr[(x + 1) % size + y * size];
  sum += arr[(x - 1 + size) % size + y * size];
  sum += arr[x + ((y + 1) % size) * size];
  sum += arr[x + ((y - 1 + size) % size) * size];
  sum += arr[(x + 1) % size + ((y + 1) % size) * size];
  sum += arr[(x - 1 + size) % size + ((y + 1) % size) * size];
  sum += arr[(x + 1) % size + ((y - 1 + size) % size) * size];
  sum += arr[(x - 1 + size) % size + ((y - 1 + size) % size) * size];
  sum -= 8 * arr[i];
  return sum;
}

function update() {
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const i = x + y * size;
      const u = U[i];
      const v = V[i];

      const du = Du * lap(U, x, y) - u * v * v + F * (1 - u);
      const dv = Dv * lap(V, x, y) + u * v * v - (F + k) * v;

      nextU[i] = u + du * dt;
      nextV[i] = v + dv * dt;
    }
  }

  [U, nextU] = [nextU, U];
  [V, nextV] = [nextV, V];
}

function draw() {
  const image = ctx.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const u = U[i];
    const v = V[i];
    const idx = i * 4;

    //  Original dark color scheme
    const r = Math.floor((u - v) * 255);
    const g = Math.floor(v * 255);
    const b = Math.floor((1 - u) * 255);

    image.data[idx] = Math.max(0, Math.min(255, r));
    image.data[idx + 1] = Math.max(0, Math.min(255, g));
    image.data[idx + 2] = Math.max(0, Math.min(255, b));
    image.data[idx + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
}

function step() {
  for (let i = 0; i < 10; i++) update();
  draw();
  requestAnimationFrame(step);
}

initialize();
step();

// --- Continuous Painting ---
function paint(x, y, button) {
  const radius = 8;
  for (let j = -radius; j <= radius; j++) {
    for (let i = -radius; i <= radius; i++) {
      const dx = x + i, dy = y + j;
      if (dx >= 0 && dx < size && dy >= 0 && dy < size && i * i + j * j < radius * radius) {
        const idx = dx + dy * size;
        if (button === 0) {
          // Left click — add V (blue)
          V[idx] = 1.0;
        } else if (button === 2) {
          // Right click — add U (erase / reset)
          U[idx] = 1.0;
          V[idx] = 0.0;
        }
      }
    }
  }
}

function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor(((e.clientX - rect.left) / rect.width) * size);
  const y = Math.floor(((e.clientY - rect.top) / rect.height) * size);
  return { x, y };
}

canvas.addEventListener("mousedown", e => {
  e.preventDefault();
  painting = true;
  paintButton = e.button;
  const { x, y } = getMousePos(e);
  paint(x, y, e.button);
});

canvas.addEventListener("mouseup", () => painting = false);
canvas.addEventListener("mouseleave", () => painting = false);
canvas.addEventListener("mousemove", e => {
  if (!painting) return;
  const { x, y } = getMousePos(e);
  paint(x, y, paintButton);
});

canvas.addEventListener("contextmenu", e => e.preventDefault());

// --- Controls ---
document.getElementById("feed").oninput = e => {
  F = parseFloat(e.target.value);
  document.getElementById("feed-val").textContent = F.toFixed(3);
};
document.getElementById("kill").oninput = e => {
  k = parseFloat(e.target.value);
  document.getElementById("kill-val").textContent = k.toFixed(3);
};
document.getElementById("du").oninput = e => {
  Du = parseFloat(e.target.value);
  document.getElementById("du-val").textContent = Du.toFixed(2);
};
document.getElementById("dv").oninput = e => {
  Dv = parseFloat(e.target.value);
  document.getElementById("dv-val").textContent = Dv.toFixed(2);
};
document.getElementById("reset-btn").onclick = initialize;

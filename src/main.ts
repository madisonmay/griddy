// src/main.ts
import * as monaco from 'monaco-editor';

const palette = [
  "#FF3F3F", // 0 - red
  "#FF7F00", // 1 - orange
  "#FBBF24", // 2 - yellow
  "#A3E635", // 3 - yellow-green
  "#4ADE80", // 4 - green
  "#22D3EE", // 5 - cyan
  "#60A5FA", // 6 - blue
  "#818CF8", // 7 - indigo
  "#C084FC", // 8 - violet
  "#F472B6", // 9 - pink
];

type PresetKey = 'basic' | 'waves' | 'spiral' | 'checkerboard' | 'circles';

const presets: Record<PresetKey, string> = {
  basic: `
/*
   Simple diagonal stripe pattern
*/
function color(x, y, time) {
  return (x + y + time) % ${palette.length};
}`,

  waves: `
/*
   Rippling wave pattern emanating from center
*/
function color(x, y, time) {
  const distance = Math.sqrt(Math.pow(x - 20, 2) + Math.pow(y - 20, 2));
  const wave = Math.sin(distance / 4 - time / 2);
  return Math.floor((wave + 1) * ${palette.length / 2}) % ${palette.length};
}`,

  spiral: `
/*
   Mesmerizing spiral pattern with wave modulation
*/
function color(x, y, time) {
  // Center coordinates
  const centerX = 20;
  const centerY = 20;
  
  // Calculate angle and distance from center
  const dx = x - centerX;
  const dy = y - centerY;
  const angle = Math.atan2(dy, dx);
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Create spiral effect by combining angle and distance
  const spiral = (angle + distance / 2 + time / 4) % (2 * Math.PI);
  
  // Add wave modulation to the spiral
  const wave = Math.sin(spiral * 4 + time / 3) * Math.cos(distance / 4);
  
  // Combine effects and map to color palette
  const colorValue = (spiral + wave + time / 8) * ${palette.length / (2 * Math.PI)};
  return Math.floor(Math.abs(colorValue)) % ${palette.length};
}`,

  checkerboard: `
/*
   Animated checkerboard pattern
*/
function color(x, y, time) {
  const size = 4; // Size of each square
  const xBlock = Math.floor(x / size);
  const yBlock = Math.floor(y / size);
  return (xBlock + yBlock + time) % ${palette.length};
}`,

  circles: `
/*
   Concentric circles with phase shift
*/
function color(x, y, time) {
  const centerX = 20;
  const centerY = 20;
  const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
  return Math.floor(distance + time) % ${palette.length};
}`
};

function createPresetMenu() {
  const menu = document.createElement('select');
  menu.id = 'preset-menu';

  Object.keys(presets).forEach(presetName => {
    const option = document.createElement('option');
    option.value = presetName;
    option.text = presetName.charAt(0).toUpperCase() + presetName.slice(1);
    menu.appendChild(option);
  });

  document.getElementById('view')!.appendChild(menu);
  return menu;
}

function createEditor() {
  // Initialize Monaco in the #editor element
  const editor = monaco.editor.create(document.getElementById('editor')!, {
    value: presets.basic,
    language: 'javascript',
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 14,
    theme: 'vs-dark'
  });

  return editor;
}

function renderGrid(canvas: HTMLCanvasElement, code: string, time: number) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Evaluate user code to extract the color function
  let userColorFunction: (x: number, y: number, time: number) => number;
  try {
    const userFunc = new Function(`${code}; return color;`);
    userColorFunction = userFunc();
  } catch (error) {
    console.error("Error evaluating code:", error);
    return;
  }

  // Clear canvas with dark background
  ctx.fillStyle = '#1E1E1E';  // Dark background matching Monaco's dark theme
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Smaller grid: 20x20 with larger cells (15px)
  const gridWidth = 40;
  const gridHeight = 40;
  const cellSize = 10;
  canvas.width = gridWidth * cellSize;
  canvas.height = gridHeight * cellSize;

  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      let colorIndex = 0;
      try {
        colorIndex = userColorFunction(x, y, time);
      } catch (e) {
        console.error("Error calling color(x, y, time):", e);
      }
      const fillColor = palette[colorIndex] ?? "#000000";
      ctx.fillStyle = fillColor;
      ctx.fillRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);  // Small gap between cells
    }
  }
}

function main() {
  const editor = createEditor();
  const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
  const presetMenu = createPresetMenu();
  let timeCounter = 0;
  let animationInterval: number | null = null;

  const updateGrid = () => {
    const code = editor.getValue();
    renderGrid(canvas, code, timeCounter);
  }

  const startAnimation = () => {
    if (animationInterval) {
      clearInterval(animationInterval);
    }
    timeCounter = 0;
    animationInterval = setInterval(() => {
      timeCounter++;
      updateGrid();
    }, 500); // Update every half second
  }

  // Handle preset selection
  presetMenu.addEventListener('change', (e) => {
    const selectedPreset = (e.target as HTMLSelectElement).value as PresetKey;
    editor.setValue(presets[selectedPreset].trim());
    startAnimation();
  });

  // Re-render the grid and restart animation when content changes
  editor.onDidChangeModelContent(() => {
    startAnimation();
  });

  // Initial render and animation start
  startAnimation();

  // Run when editor loses focus
  editor.onDidBlurEditorText(updateGrid);

  // Add keyboard shortcut (Ctrl+Enter or Cmd+Enter)
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
    startAnimation();
  });
}

main();
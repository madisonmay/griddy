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

function createEditor() {
  // Default code for the user to edit
  const defaultCode = `
/*
   Edit this function to control colors. 
   Return an integer 0..${palette.length - 1} for each (x, y).
*/
function color(x, y) {
  return (x + y) % ${palette.length};
}
`;

  // Initialize Monaco in the #editor element
  const editor = monaco.editor.create(document.getElementById('editor')!, {
    value: defaultCode.trim(),
    language: 'javascript',
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 14,
    theme: 'vs-dark'
  });

  return editor;
}

function renderGrid(canvas: HTMLCanvasElement, code: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Evaluate user code to extract the color function
  let userColorFunction: (x: number, y: number) => number;
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
  const gridWidth = 20;
  const gridHeight = 20;
  const cellSize = 20;
  canvas.width = gridWidth * cellSize;
  canvas.height = gridHeight * cellSize;

  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      let colorIndex = 0;
      try {
        colorIndex = userColorFunction(x, y);
      } catch (e) {
        console.error("Error calling color(x, y):", e);
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

  const updateGrid = () => {
    const code = editor.getValue();
    renderGrid(canvas, code);
  }
  // Re-render the grid each time the editor's content changes
  editor.onDidChangeModelContent(() => {

  });

  // Render an initial version
  renderGrid(canvas, editor.getValue());


  // Run when editor loses focus
  editor.onDidBlurEditorText(updateGrid);

  // Add keyboard shortcut (Ctrl+Enter or Cmd+Enter)
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, updateGrid);
}

main();
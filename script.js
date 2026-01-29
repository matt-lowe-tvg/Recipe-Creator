function renderPaginatedSteps() {
  const steps1 = document.getElementById('steps-preview');
  const steps2 = document.getElementById('steps-preview-cont');
  const page1  = document.getElementById('page1');
  const page2  = document.getElementById('page2');
  const page2Subtitle = page2.querySelector('h2');
  const page2MainTitle = document.getElementById('page2-title');

  // Clear existing lists
  steps1.innerHTML = '';
  steps2.innerHTML = '';

  // Early out if no steps
  if (!state.steps || state.steps.length === 0) {
    page2.classList.toggle('hidden', !state.tpl2URL);
    if (page2MainTitle) page2MainTitle.style.display = 'none';
    return;
  }

  // Check if all directions should go on page 2
  if (state.allDirectionsOnPage2) {
    // Hide directions on page 1
    const directionsBlock = document.getElementById('directions-block');
    if (directionsBlock) {
      directionsBlock.style.display = 'none';
    }

    // Put all steps on page 2
    state.steps.forEach(step => {
      const li = document.createElement('li');
      li.textContent = step;
      steps2.appendChild(li);
    });

    // Update page 2 titles
    if (page2Subtitle) {
      page2Subtitle.textContent = 'Directions';
    }

    // Show and populate the main recipe title on page 2
    if (page2MainTitle) {
      page2MainTitle.textContent = state.title || 'Recipe Title';
      page2MainTitle.style.display = '';
    }

    // Always show page 2 when all directions are there
    page2.classList.remove('hidden');

    // Reset counter for page 2
    steps2.style.counterReset = 'list-item 0';
    return;
  } else {
    // Show directions block on page 1
    const directionsBlock = document.getElementById('directions-block');
    if (directionsBlock && state.showDirections) {
      directionsBlock.style.display = '';
    }

    // Update page 2 subtitle back to "Continued"
    if (page2Subtitle) {
      page2Subtitle.textContent = 'Directions Continued';
    }

    // Hide the main title on page 2 when in split mode
    if (page2MainTitle) {
      page2MainTitle.style.display = 'none';
    }
  }

  // Original pagination logic
  const pageRect  = page1.getBoundingClientRect();
  const stepsRect = steps1.getBoundingClientRect();
  let availableHeight = page1.clientHeight - Math.round(stepsRect.top - pageRect.top) - 24;

  let firstPageCount = 0;

  // Add as many steps as will visually fit
  for (let i = 0; i < state.steps.length; i++) {
    const li = document.createElement('li');
    li.textContent = state.steps[i];
    li.style.visibility = 'hidden';
    steps1.appendChild(li);

    const h = li.offsetHeight;

    if (h <= availableHeight) {
      li.style.visibility = '';
      availableHeight -= li.offsetHeight;
      firstPageCount++;
    } else {
      steps1.removeChild(li);
      break;
    }
  }

  // Put the remainder on page 2
  for (let i = firstPageCount; i < state.steps.length; i++) {
    const li = document.createElement('li');
    li.textContent = state.steps[i];
    steps2.appendChild(li);
  }

  // Show page 2 if needed or if a template is loaded
  const needsPage2 = steps2.children.length > 0 || state.tpl2URL;
  page2.classList.toggle('hidden', !needsPage2);

  // Continue numbering on page 2
  if (steps2.children.length > 0) {
    steps2.style.counterReset = `list-item ${firstPageCount}`;
  } else {
    steps2.style.removeProperty('counter-reset');
  }
}
// ===============
// Accordions (UI)
// ===============
(function initAccordions() {
  const leftColumn = document.querySelector('section.space-y-6');
  if (!leftColumn) return;

  const style = document.createElement('style');
  style.textContent = `
    .section-header{display:flex;align-items:center;justify-content:space-between}
    .section-container > [role="button"] {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }
    [role="button"] .caret{
      transition:transform .2s ease;
      font-size:.9em;
      margin-left: auto;
      flex-shrink: 0;
    }
    [role="button"][aria-expanded="true"] .caret{transform:rotate(90deg)}
    .accordion-body{display:none}
    .accordion-body.open{display:block}
  `;
  document.head.appendChild(style);

  leftColumn.querySelectorAll('.section-container').forEach((sec, idx) => {
    const header = sec.querySelector('.section-header');
    if (!header) return;

    // Find the header wrapper (could be the header itself or a parent div)
    let headerWrapper = header.parentElement;
    if (headerWrapper === sec) {
      // Header is direct child, no wrapper
      headerWrapper = header;
    }

    let body = sec.querySelector('.accordion-body');
    if (!body) {
      body = document.createElement('div');
      body.className = 'accordion-body';
      const toMove = [];
      // Move everything after the header wrapper into the body
      for (let node = headerWrapper.nextElementSibling; node; node = headerWrapper.nextElementSibling) {
        toMove.push(node);
        sec.removeChild(node);
      }
      toMove.forEach(n => body.appendChild(n));
      sec.appendChild(body);
    }

    if (!headerWrapper.querySelector('.caret')) {
      const caret = document.createElement('span');
      caret.className = 'caret';
      caret.textContent = '▸';
      headerWrapper.appendChild(caret);
    }

    headerWrapper.setAttribute('role', 'button');
    headerWrapper.setAttribute('tabindex', '0');
    headerWrapper.style.cursor = 'pointer';

    headerWrapper.setAttribute('aria-expanded', 'false');
    body.classList.remove('open');

    const key = `accordion_open_${idx}`;
    const toggle = () => {
      const open = headerWrapper.getAttribute('aria-expanded') === 'true';
      headerWrapper.setAttribute('aria-expanded', String(!open));
      body.classList.toggle('open', !open);
      try { localStorage.setItem(key, !open ? '1' : '0'); } catch {}
    };

    headerWrapper.addEventListener('click', (e) => {
      // Don't toggle if clicking on a checkbox, input, or button
      if (e.target.matches('input, button, label')) return;
      toggle();
    });
    headerWrapper.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });

    try {
      const saved = localStorage.getItem(key);
      if (saved === '1') {
        headerWrapper.setAttribute('aria-expanded', 'true');
        body.classList.add('open');
      }
    } catch {}
  });
})();


// ==================
// App State & Utils
// ==================
const state = {
stepsManualEnabled: false,
stepsOffset: 0,
allDirectionsOnPage2: false,


  mealTypePosition: 95,
  showTableBorders: true,
  dietaryPosition: 90,
  leftPanelOpacity: 1,
  infoMacroGap: 40,
  title: '',
  titleColor: '#ffffff',
  padLeft: 0,
  padRight: 0,
  recipeImageURL: '',
  logoURL: '',
  showLogo: false,
  mealType: '',
  dietary: { gf: false, sf: false, nf: false, wf: false },
  serves: '',
  prep: '',
  cook: '',
  cal: '',
  pro: '',
  carb: '',
  fat: '',
  textSections: [],
  tables: [],
  steps: [],
  tpl1URL: '',
  tpl2URL: '',
  leftPanelColor: '#0d1b2a',
  leftPanelFontColor: '#ffffff',
  leftPanelBorderEnabled: false,
  leftPanelBorderColor: '#ffffff',
  leftPanelBorderWidth: 2,
  leftPanelBorderRadius: 6,
  leftPanelScale: 100,
  leftPanelX: 0,
  leftPanelY: 0,
  rightPanelScale: 100,
  rightPanelX: 0,
  rightPanelY: 0,
  panelsLinked: true,
  showTitle: true,
  showRecipeImage: true,
  showMealType: true,
  showDietary: true,
  showInfoSection: true,
  showMacros: true,
  showMacrosTitle: false,
  macrosTitleText: 'Individual Serving',
  showIngredients: true,
  showDirections: true,
  showTextSections: true,
  infoLayoutVertical: false,
  macrosLayoutVertical: false,
  logoSize: 200,
  mealTypeBackgroundColor: '#ffffff',
  mealTypeTextColor: '#0f172a',
  leftPanelFont: 14,
  titleFont: 36
};

const el = id => document.getElementById(id);
const $  = sel => document.querySelector(sel);

function readFileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = e => resolve(e.target.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

// ==================
// Master Paste Parser
// ==================
function parseMasterPaste(text) {
  const sections = {};
  const lines = text.split('\n');
  let currentSection = null;
  let currentContent = [];

  // Parse into sections
  for (let line of lines) {
    const sectionMatch = line.match(/^::\s*([A-Z]+)(?:\s+([^:]+))?\s*::$/i);
    if (sectionMatch) {
      // Save previous section
      if (currentSection) {
        if (!sections[currentSection]) sections[currentSection] = [];
        sections[currentSection].push({ name: null, lines: currentContent });
      }
      currentSection = sectionMatch[1].toUpperCase();
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  }
  // Save last section
  if (currentSection) {
    if (!sections[currentSection]) sections[currentSection] = [];
    sections[currentSection].push({ name: null, lines: currentContent });
  }

  const result = {
    title: '',
    meal_type: '',
    dietary_indicators: { gf: false, sf: false, nf: false, wf: false },
    serves: '',
    prep_time: '',
    cook_time: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    extra_text_sections: [],
    tables: [],
    directions: []
  };

  // Parse META
  if (sections.META && sections.META[0]) {
    const metaLine = sections.META[0].lines.find(l => l.trim());
    if (metaLine) {
      const parts = metaLine.split(';').map(p => p.trim());
      result.title = parts[0] || '';
      result.meal_type = parts[1] || '';

      // Parse dietary flags
      const dietary = (parts[2] || '').toLowerCase();
      result.dietary_indicators.gf = dietary.includes('gf');
      result.dietary_indicators.sf = dietary.includes('sf');
      result.dietary_indicators.nf = dietary.includes('nf');
      result.dietary_indicators.wf = dietary.includes('wf');

      result.serves = parts[3] || '';
      result.prep_time = parts[4] || '';
      result.cook_time = parts[5] || '';
      result.calories = parts[6] || '';
      result.protein = parts[7] || '';
      result.carbs = parts[8] || '';
      result.fat = parts[9] || '';
    }
  }

  // Parse TEXT sections
  if (sections.TEXT) {
    sections.TEXT.forEach(block => {
      const nonEmpty = block.lines.filter(l => l.trim());
      if (nonEmpty.length === 0) return;

      let title = '';
      let text = '';

      if (nonEmpty.length === 1) {
        text = nonEmpty[0].trim();
      } else {
        title = nonEmpty[0].trim();
        text = nonEmpty.slice(1).join('\n').trim();
      }

      result.extra_text_sections.push({ title, text });
    });
  }

  // Parse INGREDIENTS
  if (sections.INGREDIENTS && sections.INGREDIENTS[0]) {
    const ingredientLines = sections.INGREDIENTS[0].lines;
    const tableMatches = [];

    // Check for ::TABLE tags
    for (let i = 0; i < ingredientLines.length; i++) {
      const match = ingredientLines[i].match(/^::\s*TABLE\s+([^:]+)\s*::$/i);
      if (match) {
        tableMatches.push({ index: i, name: match[1].trim() });
      }
    }

    if (tableMatches.length > 0) {
      // Multi-table mode
      for (let t = 0; t < tableMatches.length; t++) {
        const start = tableMatches[t].index + 1;
        const end = t + 1 < tableMatches.length ? tableMatches[t + 1].index : ingredientLines.length;
        const tableLines = ingredientLines.slice(start, end).filter(l => l.trim());

        if (tableLines.length > 0) {
          const rows = tableLines.map(line => line.split(';').map(cell => cell.trim()));
          result.tables.push({
            name: tableMatches[t].name,
            rows: rows.length,
            cols: rows[0]?.length || 3,
            data: rows
          });
        }
      }
    } else {
      // Single table mode
      const tableLines = ingredientLines.filter(l => l.trim());
      if (tableLines.length > 0) {
        const rows = tableLines.map(line => line.split(';').map(cell => cell.trim()));

        // Check if first row looks like a header, if not add default
        const firstRow = rows[0];
        const looksLikeHeader = firstRow && firstRow.length === 3 &&
          (firstRow[0].toLowerCase().includes('ingredient') ||
           firstRow[1].toLowerCase().includes('amount'));

        const finalRows = looksLikeHeader ? rows : [['Ingredient', 'Amount (US)', 'Amount (Metric)'], ...rows];

        result.tables.push({
          name: 'Ingredients 1',
          rows: finalRows.length,
          cols: 3,
          data: finalRows
        });
      }
    }
  }

  // Parse DIRECTIONS
  if (sections.DIRECTIONS && sections.DIRECTIONS[0]) {
    result.directions = sections.DIRECTIONS[0].lines
      .filter(l => l.trim())
      .map(l => l.trim());
  }

  return result;
}

// Initialize CSS custom properties for font sizes
document.documentElement.style.setProperty('--lp-font-size', `${state.leftPanelFont}px`);
document.documentElement.style.setProperty('--title-font-size', `${state.titleFont}px`);


// =======================
// Left Panel Font Controls
// =======================
const lpSlider = el('lp-font');
const lpManual = el('lp-font-manual');
const lpValue  = el('lp-font-value');

if (lpSlider && lpManual && lpValue) {
  lpSlider.value = String(state.leftPanelFont);
  lpManual.value = String(state.leftPanelFont);
  lpValue.textContent = `${state.leftPanelFont}px`;

  lpSlider.addEventListener('input', e => {
    const value = parseInt(e.target.value, 10);
    state.leftPanelFont = value;
    lpManual.value = value;
    lpValue.textContent = `${value}px`;
    document.documentElement.style.setProperty('--lp-font-size', `${value}px`);
    refreshPreview();
  });

  lpManual.addEventListener('input', e => {
    const value = parseInt(e.target.value, 10);
    if (value >= 10 && value <= 20) {
      state.leftPanelFont = value;
      lpSlider.value = value;
      lpValue.textContent = `${value}px`;
      document.documentElement.style.setProperty('--lp-font-size', `${value}px`);
      refreshPreview();
    }
  });
}


// ==================
// Title Font Controls
// ==================
const titleSlider = el('title-font');
const titleManual = el('title-font-manual');
const titleValue  = el('title-font-value');

if (titleSlider && titleManual && titleValue) {
  titleSlider.value = String(state.titleFont);
  titleManual.value = String(state.titleFont);
  titleValue.textContent = `${state.titleFont}px`;

  // after grabbing titleSlider/titleManual/titleValue
  document.documentElement.style.setProperty('--title-font-size', `${titleSlider.value}px`);

  titleSlider.addEventListener('input', e => {
    const value = parseInt(e.target.value, 10);
    state.titleFont = value;
    titleManual.value = value;
    titleValue.textContent = `${value}px`;
    document.documentElement.style.setProperty('--title-font-size', `${value}px`);
    refreshPreview();
  });

  titleManual.addEventListener('input', e => {
    const value = parseInt(e.target.value, 10);
    if (value >= 20 && value <= 60) {
      state.titleFont = value;
      titleSlider.value = value;
      titleValue.textContent = `${value}px`;
      document.documentElement.style.setProperty('--title-font-size', `${value}px`);
      refreshPreview();
    }
  });
}


// ==========================
// Main Style: Color Pickers
// ==========================
const leftBgColor     = el('left-bg-color');
const leftFontColor   = el('left-font-color');
const leftBorderColor = el('left-border-color');

if (leftBgColor) {
  leftBgColor.value = state.leftPanelColor || '#0d1b2a';
  leftBgColor.addEventListener('input', e => {
    state.leftPanelColor = e.target.value;
    refreshPreview();
  });
}
if (leftFontColor) {
  leftFontColor.value = state.leftPanelFontColor || '#ffffff';
  leftFontColor.addEventListener('input', e => {
    state.leftPanelFontColor = e.target.value;
    refreshPreview();
  });
}
if (leftBorderColor) {
  leftBorderColor.value = state.leftPanelBorderColor || '#ffffff';
  leftBorderColor.addEventListener('input', e => {
    state.leftPanelBorderColor = e.target.value;
    refreshPreview();
  });
}


// =====================
// Opacity (new IDs)
// =====================
const opacitySlider = el('opacity');
const opacityManual = el('opacity-manual');
const opacityValue  = el('opacity-value');

if (opacitySlider && opacityManual && opacityValue) {
  opacitySlider.value = String(state.leftPanelOpacity);
  opacityManual.value = String(state.leftPanelOpacity);
  opacityValue.textContent = `${Math.round(state.leftPanelOpacity * 100)}%`;

  opacitySlider.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    opacityValue.textContent = `${Math.round(value * 100)}%`;
    opacityManual.value = value;
    state.leftPanelOpacity = value;
    refreshPreview();
  });

  opacityManual.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    if (value >= 0 && value <= 1) {
      opacityValue.textContent = `${Math.round(value * 100)}%`;
      opacitySlider.value = value;
      state.leftPanelOpacity = value;
      refreshPreview();
    }
  });
}


// =====================
// Border (new IDs)
// =====================
const borderEnabled = el('show-border');
const borderSize    = el('border-size');
const borderSizeMan = el('border-size-manual');
const borderSizeVal = el('border-size-value');

if (borderEnabled) {
  borderEnabled.checked = !!state.leftPanelBorderEnabled;
  borderEnabled.addEventListener('change', e => {
    state.leftPanelBorderEnabled = e.target.checked;
    refreshPreview();
  });
}

function setBorderWidth(val) {
  const v = Math.max(0, Math.min(10, parseInt(val || '0', 10)));
  state.leftPanelBorderWidth = isNaN(v) ? 0 : v;
  if (borderSize)    borderSize.value = state.leftPanelBorderWidth;
  if (borderSizeMan) borderSizeMan.value = state.leftPanelBorderWidth;
  if (borderSizeVal) borderSizeVal.textContent = `${state.leftPanelBorderWidth} px`;
  refreshPreview();
}

if (borderSize)    borderSize.addEventListener('input', e => setBorderWidth(e.target.value));
if (borderSizeMan) borderSizeMan.addEventListener('input', e => setBorderWidth(e.target.value));

// init border width
setBorderWidth(typeof state.leftPanelBorderWidth === 'number' ? state.leftPanelBorderWidth : 2);


// =====================
// Border Radius
// =====================
const borderRadius = el('border-radius');
const borderRadiusMan = el('border-radius-manual');
const borderRadiusVal = el('border-radius-value');

function setBorderRadius(val) {
  const v = Math.max(0, Math.min(30, parseInt(val || '0', 10)));
  state.leftPanelBorderRadius = isNaN(v) ? 6 : v;
  if (borderRadius)    borderRadius.value = state.leftPanelBorderRadius;
  if (borderRadiusMan) borderRadiusMan.value = state.leftPanelBorderRadius;
  if (borderRadiusVal) borderRadiusVal.textContent = `${state.leftPanelBorderRadius}px`;
  refreshPreview();
}

if (borderRadius)    borderRadius.addEventListener('input', e => setBorderRadius(e.target.value));
if (borderRadiusMan) borderRadiusMan.addEventListener('input', e => setBorderRadius(e.target.value));

// init border radius
setBorderRadius(typeof state.leftPanelBorderRadius === 'number' ? state.leftPanelBorderRadius : 6);


// =====================
// Panel Scale
// =====================
const panelScale = el('panel-scale');
const panelScaleMan = el('panel-scale-manual');
const panelScaleVal = el('panel-scale-value');

function setPanelScale(val) {
  const v = Math.max(50, Math.min(150, parseInt(val || '100', 10)));
  state.leftPanelScale = isNaN(v) ? 100 : v;
  if (panelScale)    panelScale.value = state.leftPanelScale;
  if (panelScaleMan) panelScaleMan.value = state.leftPanelScale;
  if (panelScaleVal) panelScaleVal.textContent = `${state.leftPanelScale}%`;
  refreshPreview();
}

if (panelScale)    panelScale.addEventListener('input', e => setPanelScale(e.target.value));
if (panelScaleMan) panelScaleMan.addEventListener('input', e => setPanelScale(e.target.value));

// init scale
setPanelScale(typeof state.leftPanelScale === 'number' ? state.leftPanelScale : 100);


// =====================
// Panel X Position
// =====================
const panelX = el('panel-x');
const panelXMan = el('panel-x-manual');
const panelXVal = el('panel-x-value');

function setPanelX(val) {
  const v = Math.max(-100, Math.min(100, parseInt(val || '0', 10)));
  state.leftPanelX = isNaN(v) ? 0 : v;
  if (panelX)    panelX.value = state.leftPanelX;
  if (panelXMan) panelXMan.value = state.leftPanelX;
  if (panelXVal) panelXVal.textContent = `${state.leftPanelX}px`;
  refreshPreview();
}

if (panelX)    panelX.addEventListener('input', e => setPanelX(e.target.value));
if (panelXMan) panelXMan.addEventListener('input', e => setPanelX(e.target.value));

// init X
setPanelX(typeof state.leftPanelX === 'number' ? state.leftPanelX : 0);


// =====================
// Panel Y Position
// =====================
const panelY = el('panel-y');
const panelYMan = el('panel-y-manual');
const panelYVal = el('panel-y-value');

function setPanelY(val) {
  const v = Math.max(-100, Math.min(100, parseInt(val || '0', 10)));
  state.leftPanelY = isNaN(v) ? 0 : v;
  if (panelY)    panelY.value = state.leftPanelY;
  if (panelYMan) panelYMan.value = state.leftPanelY;
  if (panelYVal) panelYVal.textContent = `${state.leftPanelY}px`;
  refreshPreview();
}

if (panelY)    panelY.addEventListener('input', e => setPanelY(e.target.value));
if (panelYMan) panelYMan.addEventListener('input', e => setPanelY(e.target.value));

// init Y
setPanelY(typeof state.leftPanelY === 'number' ? state.leftPanelY : 0);


// =====================
// Link Panels Toggle
// =====================
const linkPanels = el('link-panels');
if (linkPanels) {
  linkPanels.checked = !!state.panelsLinked;
  linkPanels.addEventListener('change', e => {
    state.panelsLinked = e.target.checked;

    // Disable/enable right panel controls
    const rightControls = [
      el('right-panel-scale'), el('right-panel-scale-manual'),
      el('right-panel-x'), el('right-panel-x-manual'),
      el('right-panel-y'), el('right-panel-y-manual')
    ];

    rightControls.forEach(ctrl => {
      if (ctrl) ctrl.disabled = state.panelsLinked;
    });

    refreshPreview();
  });
}


// =====================
// Right Panel Scale
// =====================
const rightPanelScale = el('right-panel-scale');
const rightPanelScaleMan = el('right-panel-scale-manual');
const rightPanelScaleVal = el('right-panel-scale-value');

function setRightPanelScale(val) {
  const v = Math.max(50, Math.min(150, parseInt(val || '100', 10)));
  state.rightPanelScale = isNaN(v) ? 100 : v;
  if (rightPanelScale)    rightPanelScale.value = state.rightPanelScale;
  if (rightPanelScaleMan) rightPanelScaleMan.value = state.rightPanelScale;
  if (rightPanelScaleVal) rightPanelScaleVal.textContent = `${state.rightPanelScale}%`;
  refreshPreview();
}

if (rightPanelScale)    rightPanelScale.addEventListener('input', e => setRightPanelScale(e.target.value));
if (rightPanelScaleMan) rightPanelScaleMan.addEventListener('input', e => setRightPanelScale(e.target.value));

// init scale
setRightPanelScale(typeof state.rightPanelScale === 'number' ? state.rightPanelScale : 100);


// =====================
// Right Panel X Position
// =====================
const rightPanelX = el('right-panel-x');
const rightPanelXMan = el('right-panel-x-manual');
const rightPanelXVal = el('right-panel-x-value');

function setRightPanelX(val) {
  const v = Math.max(-100, Math.min(100, parseInt(val || '0', 10)));
  state.rightPanelX = isNaN(v) ? 0 : v;
  if (rightPanelX)    rightPanelX.value = state.rightPanelX;
  if (rightPanelXMan) rightPanelXMan.value = state.rightPanelX;
  if (rightPanelXVal) rightPanelXVal.textContent = `${state.rightPanelX}px`;
  refreshPreview();
}

if (rightPanelX)    rightPanelX.addEventListener('input', e => setRightPanelX(e.target.value));
if (rightPanelXMan) rightPanelXMan.addEventListener('input', e => setRightPanelX(e.target.value));

// init X
setRightPanelX(typeof state.rightPanelX === 'number' ? state.rightPanelX : 0);


// =====================
// Right Panel Y Position
// =====================
const rightPanelY = el('right-panel-y');
const rightPanelYMan = el('right-panel-y-manual');
const rightPanelYVal = el('right-panel-y-value');

function setRightPanelY(val) {
  const v = Math.max(-100, Math.min(100, parseInt(val || '0', 10)));
  state.rightPanelY = isNaN(v) ? 0 : v;
  if (rightPanelY)    rightPanelY.value = state.rightPanelY;
  if (rightPanelYMan) rightPanelYMan.value = state.rightPanelY;
  if (rightPanelYVal) rightPanelYVal.textContent = `${state.rightPanelY}px`;
  refreshPreview();
}

if (rightPanelY)    rightPanelY.addEventListener('input', e => setRightPanelY(e.target.value));
if (rightPanelYMan) rightPanelYMan.addEventListener('input', e => setRightPanelY(e.target.value));

// init Y
setRightPanelY(typeof state.rightPanelY === 'number' ? state.rightPanelY : 0);

// Initialize right panel control states based on link
if (linkPanels) {
  const rightControls = [
    el('right-panel-scale'), el('right-panel-scale-manual'),
    el('right-panel-x'), el('right-panel-x-manual'),
    el('right-panel-y'), el('right-panel-y-manual')
  ];

  rightControls.forEach(ctrl => {
    if (ctrl) ctrl.disabled = state.panelsLinked;
  });
}


// =======================
// Reset Buttons
// =======================

// Reset Colors
el('reset-colors')?.addEventListener('click', () => {
  state.leftPanelColor = '#0d1b2a';
  state.leftPanelFontColor = '#ffffff';
  state.leftPanelBorderColor = '#000000';

  if (leftBgColor) leftBgColor.value = state.leftPanelColor;
  if (leftFontColor) leftFontColor.value = state.leftPanelFontColor;
  if (leftBorderColor) leftBorderColor.value = state.leftPanelBorderColor;

  refreshPreview();
});

// Reset Font Sizes
el('reset-fonts')?.addEventListener('click', () => {
  state.titleFont = 36;
  state.leftPanelFont = 14;

  document.documentElement.style.setProperty('--title-font-size', '36px');
  document.documentElement.style.setProperty('--lp-font-size', '14px');

  if (titleSlider) titleSlider.value = 36;
  if (titleManual) titleManual.value = 36;
  if (titleValue) titleValue.textContent = '36px';

  if (lpSlider) lpSlider.value = 14;
  if (lpManual) lpManual.value = 14;
  if (lpValue) lpValue.textContent = '14px';

  refreshPreview();
});

// Reset Appearance
el('reset-appearance')?.addEventListener('click', () => {
  state.leftPanelOpacity = 1;
  state.leftPanelBorderRadius = 6;

  if (opacitySlider) opacitySlider.value = 1;
  if (opacityManual) opacityManual.value = 1;
  if (opacityValue) opacityValue.textContent = '100%';

  setBorderRadius(6);

  refreshPreview();
});

// Reset Left Panel Position & Scale
el('reset-left-position')?.addEventListener('click', () => {
  setPanelScale(100);
  setPanelX(0);
  setPanelY(0);
});

// Reset Right Panel Position & Scale
el('reset-right-position')?.addEventListener('click', () => {
  setRightPanelScale(100);
  setRightPanelX(0);
  setRightPanelY(0);
});

// Reset Border
el('reset-border')?.addEventListener('click', () => {
  state.leftPanelBorderEnabled = false;
  state.leftPanelBorderWidth = 2;

  if (borderEnabled) borderEnabled.checked = false;
  setBorderWidth(2);

  refreshPreview();
});


// =======================
// Element Visibility Toggles
// =======================
const visibilityToggles = {
  'show-title': 'showTitle',
  'show-recipe-image': 'showRecipeImage',
  'show-logo': 'showLogo',
  'show-meal-type': 'showMealType',
  'show-dietary': 'showDietary',
  'show-info-section': 'showInfoSection',
  'show-macros': 'showMacros',
  'show-macros-title': 'showMacrosTitle',
  'show-ingredients': 'showIngredients',
  'show-directions': 'showDirections',
  'show-text-sections': 'showTextSections'
};

Object.entries(visibilityToggles).forEach(([id, stateKey]) => {
  const toggle = el(id);
  if (toggle) {
    toggle.addEventListener('change', e => {
      state[stateKey] = e.target.checked;
      refreshPreview();
    });
  }
});

// Info layout toggle
el('info-layout-vertical')?.addEventListener('change', e => {
  state.infoLayoutVertical = e.target.checked;
  refreshPreview();
});

// Macros layout toggle
el('macros-layout-vertical')?.addEventListener('change', e => {
  state.macrosLayoutVertical = e.target.checked;
  refreshPreview();
});

// =======================
// Style Presets
// =======================
const PRESETS_KEY = 'recipe_style_presets';

function getStylePreset() {
  return {
    leftPanelColor: state.leftPanelColor,
    leftPanelFontColor: state.leftPanelFontColor,
    leftPanelBorderEnabled: state.leftPanelBorderEnabled,
    leftPanelBorderColor: state.leftPanelBorderColor,
    leftPanelBorderWidth: state.leftPanelBorderWidth,
    leftPanelBorderRadius: state.leftPanelBorderRadius,
    leftPanelOpacity: state.leftPanelOpacity,
    leftPanelScale: state.leftPanelScale,
    leftPanelX: state.leftPanelX,
    leftPanelY: state.leftPanelY,
    rightPanelScale: state.rightPanelScale,
    rightPanelX: state.rightPanelX,
    rightPanelY: state.rightPanelY,
    panelsLinked: state.panelsLinked,
    titleColor: state.titleColor,
    titleFont: state.titleFont,
    leftPanelFont: state.leftPanelFont
  };
}

function applyStylePreset(preset) {
  state.leftPanelColor = preset.leftPanelColor;
  state.leftPanelFontColor = preset.leftPanelFontColor;
  state.leftPanelBorderEnabled = preset.leftPanelBorderEnabled;
  state.leftPanelBorderColor = preset.leftPanelBorderColor;
  state.leftPanelBorderWidth = preset.leftPanelBorderWidth;
  state.leftPanelBorderRadius = preset.leftPanelBorderRadius;
  state.leftPanelOpacity = preset.leftPanelOpacity;
  state.leftPanelScale = preset.leftPanelScale;
  state.leftPanelX = preset.leftPanelX;
  state.leftPanelY = preset.leftPanelY;
  state.rightPanelScale = preset.rightPanelScale;
  state.rightPanelX = preset.rightPanelX;
  state.rightPanelY = preset.rightPanelY;
  state.panelsLinked = preset.panelsLinked;
  state.titleColor = preset.titleColor;
  state.titleFont = preset.titleFont;
  state.leftPanelFont = preset.leftPanelFont;

  // Update UI controls
  if (leftBgColor) leftBgColor.value = state.leftPanelColor;
  if (leftFontColor) leftFontColor.value = state.leftPanelFontColor;
  if (leftBorderColor) leftBorderColor.value = state.leftPanelBorderColor;
  if (borderEnabled) borderEnabled.checked = state.leftPanelBorderEnabled;
  if (el('title-color')) el('title-color').value = state.titleColor;

  setBorderWidth(state.leftPanelBorderWidth);
  setBorderRadius(state.leftPanelBorderRadius);
  setPanelScale(state.leftPanelScale);
  setPanelX(state.leftPanelX);
  setPanelY(state.leftPanelY);
  setRightPanelScale(state.rightPanelScale);
  setRightPanelX(state.rightPanelX);
  setRightPanelY(state.rightPanelY);

  if (linkPanels) linkPanels.checked = state.panelsLinked;
  if (opacitySlider) opacitySlider.value = state.leftPanelOpacity;
  if (opacityManual) opacityManual.value = state.leftPanelOpacity;
  if (opacityValue) opacityValue.textContent = `${Math.round(state.leftPanelOpacity * 100)}%`;

  document.documentElement.style.setProperty('--title-font-size', `${state.titleFont}px`);
  document.documentElement.style.setProperty('--lp-font-size', `${state.leftPanelFont}px`);

  if (titleSlider) titleSlider.value = state.titleFont;
  if (titleManual) titleManual.value = state.titleFont;
  if (titleValue) titleValue.textContent = `${state.titleFont}px`;

  if (lpSlider) lpSlider.value = state.leftPanelFont;
  if (lpManual) lpManual.value = state.leftPanelFont;
  if (lpValue) lpValue.textContent = `${state.leftPanelFont}px`;

  refreshPreview();
}

function loadPresets() {
  try {
    const saved = localStorage.getItem(PRESETS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function savePresets(presets) {
  try {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  } catch (e) {
    console.error('Failed to save presets:', e);
  }
}

function renderPresets() {
  const grid = el('presets-grid');
  if (!grid) return;

  const presets = loadPresets();
  grid.innerHTML = '';

  // Render existing presets
  presets.forEach((preset, idx) => {
    const card = document.createElement('div');
    card.className = 'preset-card';

    const preview = document.createElement('div');
    preview.className = 'preview';

    const previewPanel = document.createElement('div');
    previewPanel.className = 'preview-panel';
    previewPanel.style.backgroundColor = preset.style.leftPanelColor;
    previewPanel.style.opacity = preset.style.leftPanelOpacity;
    previewPanel.style.borderRadius = `${preset.style.leftPanelBorderRadius}px`;
    if (preset.style.leftPanelBorderEnabled) {
      previewPanel.style.border = `${preset.style.leftPanelBorderWidth}px solid ${preset.style.leftPanelBorderColor}`;
    }
    previewPanel.textContent = 'Aa';
    previewPanel.style.color = preset.style.leftPanelFontColor;

    preview.appendChild(previewPanel);
    card.appendChild(preview);

    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = preset.name;
    card.appendChild(title);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.title = 'Delete preset';
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      if (confirm(`Delete preset "${preset.name}"?`)) {
        const updated = presets.filter((_, i) => i !== idx);
        savePresets(updated);
        renderPresets();
      }
    };
    card.appendChild(deleteBtn);

    card.onclick = () => {
      applyStylePreset(preset.style);
    };

    grid.appendChild(card);
  });

  // Add "new preset" card
  const addCard = document.createElement('div');
  addCard.className = 'preset-card add-new';

  const addPreview = document.createElement('div');
  addPreview.className = 'preview';
  addPreview.textContent = '+';
  addCard.appendChild(addPreview);

  const addTitle = document.createElement('div');
  addTitle.className = 'title';
  addTitle.textContent = 'New Preset';
  addCard.appendChild(addTitle);

  addCard.onclick = () => {
    const name = prompt('Enter a name for this preset:');
    if (name && name.trim()) {
      const newPreset = {
        name: name.trim(),
        style: getStylePreset()
      };
      const updated = [...presets, newPreset];
      savePresets(updated);
      renderPresets();
    }
  };

  grid.appendChild(addCard);
}

// Initialize presets
renderPresets();


// =======================
// Other Controls & Logic
// =======================
const gapSlider  = el('info-macro-gap');
const gapManual  = el('info-macro-gap-manual');
const gapValueEl = el('info-macro-gap-value');
if (gapSlider && gapManual && gapValueEl) {
  gapSlider.addEventListener('input', (e) => {
    const value = e.target.value;
    gapValueEl.textContent = `${value} px`;
    gapManual.value = value;
    state.infoMacroGap = parseInt(value, 10);
    refreshPreview();
  });
  gapManual.addEventListener('input', (e) => {
    const value = e.target.value;
    gapValueEl.textContent = `${value} px`;
    gapSlider.value = value;
    state.infoMacroGap = parseInt(value, 10);
    refreshPreview();
  });
}

const mealTypeSlider = el('mealtype-position');
const mealTypeManual = el('mealtype-position-manual');
const mealTypeValue  = el('mealtype-position-value');
if (mealTypeSlider && mealTypeManual && mealTypeValue) {
  mealTypeSlider.value = String(state.mealTypePosition);
  mealTypeManual.value = String(state.mealTypePosition);
  mealTypeValue.textContent = `${state.mealTypePosition}%`;

  mealTypeSlider.addEventListener('input', e => {
    const value = parseInt(e.target.value, 10);
    mealTypeValue.textContent = `${value}%`;
    mealTypeManual.value = value;
    state.mealTypePosition = value;
    refreshPreview();
  });
  mealTypeManual.addEventListener('input', e => {
    const value = parseInt(e.target.value, 10);
    if (value >= 0 && value <= 100) {
      mealTypeValue.textContent = `${value}%`;
      mealTypeSlider.value = value;
      state.mealTypePosition = value;
      refreshPreview();
    }
  });
}

const dietarySlider = el('dietary-position');
const dietaryManual = el('dietary-position-manual');
const dietaryValue  = el('dietary-position-value');
if (dietarySlider && dietaryManual && dietaryValue) {
  dietarySlider.value = String(state.dietaryPosition);
  dietaryManual.value = String(state.dietaryPosition);
  dietaryValue.textContent = `${state.dietaryPosition}%`;

  dietarySlider.addEventListener('input', (e) => {
    const value = parseInt(e.target.value, 10);
    dietaryValue.textContent = `${value}%`;
    dietaryManual.value = value;
    state.dietaryPosition = value;
    refreshPreview();
  });
  dietaryManual.addEventListener('input', (e) => {
    const value = parseInt(e.target.value, 10);
    if (value >= 0 && value <= 100) {
      dietaryValue.textContent = `${value}%`;
      dietarySlider.value = value;
      state.dietaryPosition = value;
      refreshPreview();
    }
  });
}

function applyRowHeights() {
  const tables = el('tables-preview').querySelectorAll('table.ing-table');
  tables.forEach(table => {
    table.querySelectorAll('.cell-content').forEach(content => {
      content.style.removeProperty('height');
    });
  });
}

const showBordersChk = el('show-table-borders');
if (showBordersChk) {
  showBordersChk.checked = state.showTableBorders;
  showBordersChk.addEventListener('change', e => {
    state.showTableBorders = e.target.checked;
    refreshPreview();
  });
}

const btnReset = el('btn-reset');
if (btnReset) {
  btnReset.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset? All unsaved changes will be lost.')) {
      location.reload();
    }
  });
}


// ==================
// Preview Rendering
// ==================
function refreshPreview() {
  // Section spacing will be applied to macros-title if visible, otherwise macros-grid
  // This is handled later in the macros visibility section

  // Title visibility
  const titleEl = el('title-el');
  if (state.showTitle) {
    titleEl.textContent = state.title || 'Recipe Title';
    titleEl.style.color = state.titleColor || '#ffffff';
    const pageWidth = 612;
    const maxWidth = Math.max(80, pageWidth - (state.padLeft + state.padRight));
    titleEl.style.paddingLeft = state.padLeft + 'px';
    titleEl.style.maxWidth = maxWidth + 'px';
    titleEl.style.display = '';
  } else {
    titleEl.style.display = 'none';
  }

  // Recipe image visibility
  const img = el('recipe-img-el');
  if (state.showRecipeImage && state.recipeImageURL) {
    img.crossOrigin = 'anonymous';
    img.src = state.recipeImageURL;
    img.classList.remove('hidden');
  } else {
    img.removeAttribute('src');
    img.classList.add('hidden');
  }

  // Text sections visibility
  const extra = el('extra-text');
  extra.innerHTML = '';
  if (state.showTextSections) {
    state.textSections.forEach(sec => {
      if (sec.title) {
        const h = document.createElement('div');
        h.className = 'font-bold text-sm';
        h.style.color = 'inherit';
        h.textContent = sec.title;
        extra.appendChild(h);
      }
      if (sec.text) {
        const p = document.createElement('div');
        p.className = 'text-sm';
        p.style.color = 'inherit';
        p.textContent = sec.text;
        extra.appendChild(p);
      }
    });
  }

  // Info section visibility and layout
  const servesEl = el('serves-el');
  const prepEl = el('prep-el');
  const cookEl = el('cook-el');
  const infoContainer = el('info-section-container');

  if (state.showInfoSection) {
    servesEl.textContent = state.serves || '';
    prepEl.textContent = state.prep || '';
    cookEl.textContent = state.cook || '';

    // Hide individual fields if they're 0 or empty
    const servesHasValue = state.serves && state.serves !== '0';
    const prepHasValue = state.prep && state.prep !== '0';
    const cookHasValue = state.cook && state.cook !== '0';

    servesEl.parentElement.parentElement.style.display = servesHasValue ? '' : 'none';
    prepEl.parentElement.parentElement.style.display = prepHasValue ? '' : 'none';
    cookEl.parentElement.parentElement.style.display = cookHasValue ? '' : 'none';

    // Toggle between horizontal and vertical layout
    if (state.infoLayoutVertical) {
      infoContainer.className = 'mt-6 uppercase flex flex-col gap-2 text-sm text-left';
    } else {
      infoContainer.className = 'mt-6 uppercase grid grid-cols-3 gap-4 text-sm text-left';
    }

    // Hide entire container if all fields are empty
    const hasAnyValue = servesHasValue || prepHasValue || cookHasValue;
    infoContainer.style.display = hasAnyValue ? '' : 'none';
  } else {
    servesEl.parentElement.parentElement.style.display = 'none';
    prepEl.parentElement.parentElement.style.display = 'none';
    cookEl.parentElement.parentElement.style.display = 'none';
    infoContainer.style.display = 'none';
  }

  // Macros visibility
  const macrosGrid = el('macros-grid');
  const macrosTitle = el('macros-title');
  if (state.showMacros) {
    const calEl = el('cal-el');
    const proEl = el('pro-el');
    const carbEl = el('carb-el');
    const fatEl = el('fat-el');

    // Set text content
    calEl.textContent = state.cal || '0';
    proEl.textContent = (state.pro || '0') + ' g';
    carbEl.textContent = (state.carb || '0') + ' g';
    fatEl.textContent = (state.fat || '0') + ' g';

    // Hide individual fields if they're 0 or empty
    const calHasValue = state.cal && state.cal !== '0';
    const proHasValue = state.pro && state.pro !== '0';
    const carbHasValue = state.carb && state.carb !== '0';
    const fatHasValue = state.fat && state.fat !== '0';

    calEl.parentElement.style.display = calHasValue ? '' : 'none';
    proEl.parentElement.style.display = proHasValue ? '' : 'none';
    carbEl.parentElement.style.display = carbHasValue ? '' : 'none';
    fatEl.parentElement.style.display = fatHasValue ? '' : 'none';

    // Hide entire grid if all fields are empty
    const hasAnyValue = calHasValue || proHasValue || carbHasValue || fatHasValue;
    macrosGrid.style.display = hasAnyValue ? '' : 'none';

    // Show/hide macros title and apply section spacing
    const showTitle = state.showMacrosTitle && hasAnyValue;
    macrosTitle.style.display = showTitle ? '' : 'none';
    macrosTitle.textContent = state.macrosTitleText || 'Individual Serving';

    // Apply section spacing to title if visible, otherwise to grid
    if (showTitle) {
      macrosTitle.style.marginTop = state.infoMacroGap + 'px';
      macrosGrid.style.marginTop = '0';
    } else {
      macrosTitle.style.marginTop = '0';
      macrosGrid.style.marginTop = state.infoMacroGap + 'px';
    }

    // Toggle between horizontal and vertical layout
    if (state.macrosLayoutVertical) {
      macrosGrid.className = 'grid grid-cols-1 gap-2 text-sm';
    } else {
      macrosGrid.className = 'grid grid-cols-2 gap-y-2 gap-x-8 text-sm';
    }
  } else {
    macrosGrid.style.display = 'none';
    macrosGrid.style.marginTop = '0';
    macrosTitle.style.display = 'none';
    macrosTitle.style.marginTop = '0';
  }

  // Dietary pills visibility
  const dietPills = el('diet-pills');
  dietPills.innerHTML = '';
  if (state.showDietary) {
    [['gf','GF'],['sf','SF'],['nf','NF'],['wf','WF']].forEach(([k,label]) => {
      if (state.dietary[k]) {
        const d = document.createElement('div');
      d.className = 'pill text-sm';
      d.textContent = label;
      dietPills.appendChild(d);
      }
    });
    dietPills.style.position = 'absolute';
    dietPills.style.top = `${state.dietaryPosition}%`;
    dietPills.style.left = '50%';
    dietPills.style.transform = 'translateX(-50%)';
    dietPills.style.width = '100%';
    dietPills.style.display = '';
  } else {
    dietPills.style.display = 'none';
  }

  // Meal type pill visibility
  const mealPill = el('meal-pill');
  mealPill.innerHTML = '';
  if (state.showMealType && state.mealType) {
    const m = document.createElement('div');
    m.className = 'pill text-sm font-bold text-center';
    m.textContent = state.mealType;
    mealPill.appendChild(m);
    mealPill.style.position = 'absolute';
    mealPill.style.top = `${state.mealTypePosition}%`;
    mealPill.style.left = '50%';
    mealPill.style.transform = 'translateX(-50%)';
    mealPill.style.width = '100%';
    mealPill.style.display = '';
  } else {
    mealPill.style.display = 'none';
  }

  document.querySelectorAll('.left-panel').forEach(panel => {
    const hex = state.leftPanelColor;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    panel.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${state.leftPanelOpacity})`;
    panel.style.color = state.leftPanelFontColor || '#ffffff';
    panel.style.borderRadius = `${state.leftPanelBorderRadius}px`;

    // Apply scale and position
    const scale = state.leftPanelScale / 100;
    const translateX = state.leftPanelX;
    const translateY = state.leftPanelY;
    panel.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    panel.style.transformOrigin = 'top left';

    if (state.leftPanelBorderEnabled && Number(state.leftPanelBorderWidth) > 0) {
      panel.style.border = `${state.leftPanelBorderWidth}px solid ${state.leftPanelBorderColor}`;
    } else {
      panel.style.border = 'none';
    }

    // Find the parent grid container and adjust right panel
    const gridContainer = panel.closest('.grid-cols-12');
    if (gridContainer) {
      const leftCol = panel.closest('.col-span-5');
      const rightCol = gridContainer.querySelector('.col-span-7');

      if (leftCol && rightCol) {
        if (state.panelsLinked) {
          // LINKED MODE: Right panel scales dynamically based on left panel
          const leftScaledWidth = 5 * scale; // Effective columns the left panel takes

          // Calculate right scale to fit remaining space
          const rightScale = Math.max(0.5, Math.min(1.5, (12 - leftScaledWidth) / 7));

          // Apply transform to right column
          rightCol.style.transform = `scale(${rightScale})`;
          rightCol.style.transformOrigin = 'top left';
          rightCol.style.marginLeft = `${(leftScaledWidth - 5) * 8.33}%`; // Adjust for scaled left panel
        } else {
          // UNLINKED MODE: Right panel uses its own independent settings
          const rightScale = state.rightPanelScale / 100;
          const rightTranslateX = state.rightPanelX;
          const rightTranslateY = state.rightPanelY;

          rightCol.style.transform = `translate(${rightTranslateX}px, ${rightTranslateY}px) scale(${rightScale})`;
          rightCol.style.transformOrigin = 'top left';
          rightCol.style.marginLeft = '0'; // Reset margin
        }
      }
    }
  });

  // Ingredients tables visibility
  const tablesWrap = el('tables-preview');
  tablesWrap.innerHTML = '';
  if (state.showIngredients) {
    const showTitles = el('show-table-titles')?.checked;

    state.tables.forEach(t => {
    const wrap = document.createElement('div');
    if (showTitles && t.name) {
      const h = document.createElement('div');
      h.className = 'font-bold mb-1 text-lg';
      h.textContent = t.name;
      wrap.appendChild(h);
    }
    const table = document.createElement('table');
    table.className = `ing-table w-full text-sm ${!state.showTableBorders ? 'no-borders' : ''}`;
    const tb = document.createElement('tbody');
    t.rows.forEach((row, idx) => {
      const tr = document.createElement('tr');
      row.forEach(cell => {
        const cellEl = document.createElement(idx === 0 ? 'th' : 'td');
        const contentEl = document.createElement('div');
        contentEl.className = 'cell-content';
        contentEl.textContent = cell || '';
        cellEl.appendChild(contentEl);
        tr.appendChild(cellEl);
      });
      tb.appendChild(tr);
    });
      table.appendChild(tb);
      wrap.appendChild(table);
      tablesWrap.appendChild(wrap);
    });
    tablesWrap.style.display = '';
  } else {
    tablesWrap.style.display = 'none';
  }

  // Logo visibility
  const logoContainer = el('logo-container');
  const logoImg = el('logo-img');
  if (state.showLogo && state.logoURL) {
    logoImg.src = state.logoURL;
    logoImg.style.maxWidth = state.logoSize + 'px';
    logoContainer.style.display = '';
  } else {
    logoContainer.style.display = 'none';
  }




  // Directions visibility and offset
  const dirBlock = el('directions-block');
  if (dirBlock) {
    if (state.showDirections) {
      let offset = state.stepsOffset;
      if (state.stepsManualEnabled) {
        // If we are exporting, apply an extra nudge upward
        if (document.body.classList.contains('exporting')) {
          offset -= 20; // tweak this number until the gap is gone
        }
        dirBlock.style.marginTop = `${offset}px`;
      } else {
        dirBlock.style.marginTop = '';
      }
      dirBlock.style.display = '';
    } else {
      dirBlock.style.display = 'none';
    }
  }




  applyRowHeights();

  renderPaginatedSteps();

}


// ==================
// Inputs wiring
// ==================
el('title')?.addEventListener('input', e => { state.title = e.target.value; refreshPreview(); });
el('title-color')?.addEventListener('input', e => { state.titleColor = e.target.value; refreshPreview(); });
el('macros-title-text')?.addEventListener('input', e => { state.macrosTitleText = e.target.value; refreshPreview(); });
el('pad-left')?.addEventListener('input', e => { state.padLeft = parseInt(e.target.value || '0', 10); refreshPreview(); });
el('pad-right')?.addEventListener('input', e => { state.padRight = parseInt(e.target.value || '0', 10); refreshPreview(); });

el('recipe-img')?.addEventListener('change', async e => {
  const f = e.target.files?.[0];
  if (!f) return;
  state.recipeImageURL = await readFileToDataURL(f);
  el('img-name').textContent = f.name;
  refreshPreview();
});
el('clear-img')?.addEventListener('click', () => {
  state.recipeImageURL = '';
  el('img-name').textContent = 'No image';
  refreshPreview();
});

el('logo-upload')?.addEventListener('change', async e => {
  const f = e.target.files?.[0];
  if (!f) return;
  state.logoURL = await readFileToDataURL(f);
  el('logo-name').textContent = f.name;
  refreshPreview();
});
el('clear-logo')?.addEventListener('click', () => {
  state.logoURL = '';
  el('logo-name').textContent = 'No logo';
  refreshPreview();
});

el('logo-size')?.addEventListener('input', e => {
  state.logoSize = parseInt(e.target.value, 10);
  el('logo-size-value').textContent = state.logoSize + 'px';
  refreshPreview();
});

el('reset-logo-size')?.addEventListener('click', () => {
  state.logoSize = 200;
  el('logo-size').value = 200;
  el('logo-size-value').textContent = '200px';
  refreshPreview();
});

document.querySelectorAll('input[name="meal"]').forEach(r =>
  r.addEventListener('change', e => { state.mealType = e.target.value; refreshPreview(); })
);
el('gf')?.addEventListener('change', e => { state.dietary.gf = e.target.checked; refreshPreview(); });
el('sf')?.addEventListener('change', e => { state.dietary.sf = e.target.checked; refreshPreview(); });
el('nf')?.addEventListener('change', e => { state.dietary.nf = e.target.checked; refreshPreview(); });
el('wf')?.addEventListener('change', e => { state.dietary.wf = e.target.checked; refreshPreview(); });

el('serves')?.addEventListener('input', e => { state.serves = e.target.value; refreshPreview(); });
el('prep')?.addEventListener('input',   e => { state.prep   = e.target.value; refreshPreview(); });
el('cook')?.addEventListener('input',   e => { state.cook   = e.target.value; refreshPreview(); });
el('cal')?.addEventListener('input',    e => { state.cal    = e.target.value; refreshPreview(); });
el('pro')?.addEventListener('input',    e => { state.pro    = e.target.value; refreshPreview(); });
el('carb')?.addEventListener('input',   e => { state.carb   = e.target.value; refreshPreview(); });
el('fat')?.addEventListener('input',    e => { state.fat    = e.target.value; refreshPreview(); });


// ==================
// Text Sections UI
// ==================
function renderTextSections() {
  const wrap = el('text-sections'); if (!wrap) return;
  wrap.innerHTML = '';
  state.textSections.forEach((sec, idx) => {
    const row = document.createElement('div');
    row.className = 'bg-slate-800 rounded p-2 grid grid-cols-1 gap-2';
    row.innerHTML = `
      <div class="flex gap-2 items-center">
        <input class="flex-1 px-2 py-1 rounded bg-slate-900" placeholder="Section Title" value="${sec.title || ''}" />
        <button class="px-2 py-1 bg-slate-700 rounded">Delete</button>
      </div>
      <input class="px-2 py-1 rounded bg-slate-900" placeholder="Section text" value="${sec.text || ''}" />
    `;
    const [titleIn, delBtn, textIn] = [row.children[0].children[0], row.children[0].children[1], row.children[1]];
    titleIn.addEventListener('input', e => { sec.title = e.target.value; refreshPreview(); });
    textIn.addEventListener('input',  e => { sec.text  = e.target.value; refreshPreview(); });
    delBtn.addEventListener('click', () => { state.textSections.splice(idx, 1); renderTextSections(); refreshPreview(); });
    wrap.appendChild(row);
  });
}
el('add-text')?.addEventListener('click', () => { state.textSections.push({ title: '', text: '' }); renderTextSections(); refreshPreview(); });


// ==============
// Tables UI
// ==============
function renderTables() {
  const wrap = el('tables'); if (!wrap) return;
  wrap.innerHTML = '';

  state.tables.forEach((t, tIdx) => {
    const cont = document.createElement('div');
    cont.className = 'bg-slate-800 rounded p-3 space-y-3';

    cont.innerHTML = `
      <div class="flex items-center gap-2 flex-wrap">
        <input class="flex-1 min-w-32 px-2 py-1 rounded bg-slate-900" placeholder="Table Name" value="${t.name || ''}" />
        <button class="px-2 py-1 bg-slate-700 rounded delete-table">Delete Table</button>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div class="flex items-center gap-2">
          <label class="text-sm">Rows:</label>
          <input type="number" min="1" max="20" value="${t.rows.length}" class="w-16 px-2 py-1 rounded bg-slate-900 text-sm rows-input" />
        </div>
        <div class="flex items-center gap-2">
          <label class="text-sm">Cols:</label>
          <input type="number" min="1" max="10" value="${t.rows[0]?.length || 3}" class="w-16 px-2 py-1 rounded bg-slate-900 text-sm cols-input" />
        </div>
        <button class="px-2 py-1 bg-emerald-600 rounded text-sm apply-size">Apply Size</button>
        <button class="px-2 py-1 bg-blue-600 rounded text-sm add-row">Add Row</button>
      </div>
      <div class="flex gap-2">
        <textarea class="flex-1 px-2 py-1 rounded bg-slate-900 text-sm" rows="2" placeholder="Paste data with semicolons...">${t.paste || ''}</textarea>
        <button class="px-2 py-1 bg-slate-700 rounded fill-table">Fill Table</button>
      </div>
      <div class="overflow-auto max-h-64">
        <table class="w-full text-sm border-collapse">
          <tbody class="table-body"></tbody>
        </table>
      </div>
    `;

    const nameInput = cont.querySelector('input[placeholder="Table Name"]');
    const deleteBtn = cont.querySelector('.delete-table');
    const rowsInput = cont.querySelector('.rows-input');
    const colsInput = cont.querySelector('.cols-input');
    const applySizeBtn = cont.querySelector('.apply-size');
    const addRowBtn = cont.querySelector('.add-row');
    const pasteTA = cont.querySelector('textarea');
    const fillBtn = cont.querySelector('.fill-table');
    const tbody = cont.querySelector('.table-body');

    function drawTable() {
      tbody.innerHTML = '';
      t.rows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        row.forEach((cell, cIdx) => {
          const td = document.createElement('td');
          td.className = 'border border-slate-600 p-1';
          const input = document.createElement('input');
          input.className = 'w-full px-1 py-1 rounded bg-slate-900 text-xs';
          input.value = cell || '';
          input.addEventListener('input', e => {
            t.rows[rIdx][cIdx] = e.target.value;
            refreshPreview();
          });
          td.appendChild(input);
          tr.appendChild(td);
        });

        const deleteTd = document.createElement('td');
        deleteTd.className = 'border border-slate-600 p-1';
        const deleteRowBtn = document.createElement('button');
        deleteRowBtn.className = 'px-1 py-1 bg-red-600 rounded text-xs';
        deleteRowBtn.textContent = '×';
        deleteRowBtn.addEventListener('click', () => {
          if (t.rows.length > 1) {
            t.rows.splice(rIdx, 1);
            drawTable();
            refreshPreview();
          }
        });
        deleteTd.appendChild(deleteRowBtn);
        tr.appendChild(deleteTd);
        tbody.appendChild(tr);
      });
    }

    nameInput.addEventListener('input', e => {
      t.name = e.target.value;
      refreshPreview();
    });

    deleteBtn.addEventListener('click', () => {
      state.tables.splice(tIdx, 1);
      renderTables();
      refreshPreview();
    });

    applySizeBtn.addEventListener('click', () => {
      const newRows = parseInt(rowsInput.value, 10) || 1;
      const newCols = parseInt(colsInput.value, 10) || 3;

      while (t.rows.length < newRows) t.rows.push(new Array(newCols).fill(''));
      while (t.rows.length > newRows) t.rows.pop();

      t.rows.forEach(row => {
        while (row.length < newCols) row.push('');
        while (row.length > newCols) row.pop();
      });

      drawTable();
      refreshPreview();
    });

    addRowBtn.addEventListener('click', () => {
      const cols = t.rows[0]?.length || 3;
      t.rows.push(new Array(cols).fill(''));
      rowsInput.value = t.rows.length;
      drawTable();
      refreshPreview();
    });

    fillBtn.addEventListener('click', () => {
      const raw = pasteTA.value.trim();
      t.paste = raw;
      if (!raw) return;

      const items = raw.split(';').map(s => s.trim());
      const cols = Math.max(1, (t.rows[0]?.length) || 3);
      const rowsNeeded = Math.ceil(items.length / cols);

      t.rows = Array.from({ length: rowsNeeded }, (_, r) =>
        Array.from({ length: cols }, (_, c) => items[r * cols + c] || '')
      );

      rowsInput.value = t.rows.length;
      drawTable();
      refreshPreview();
    });

    drawTable();
    wrap.appendChild(cont);
  });
}

el('add-table')?.addEventListener('click', () => {
  state.tables.push({
    name: `Ingredients ${state.tables.length + 1}`,
    rows: [['Ingredients', 'Amount', 'Notes'], ['', '', '']],
    paste: ''
  });
  renderTables();
  refreshPreview();
});
el('show-table-titles')?.addEventListener('change', refreshPreview);


// ==============
// Steps UI
// ==============
function renderSteps() {
  const wrap = el('steps'); if (!wrap) return;
  wrap.innerHTML = '';
  state.steps.forEach((s, idx) => {
    const row = document.createElement('div');
    row.className = 'flex items-start gap-2';
    row.innerHTML = `<div class="pt-2 text-sm w-6 text-right">${idx + 1}.</div><textarea class="flex-1 px-2 py-1 rounded bg-slate-800" rows="3">${s}</textarea><button class="px-2 py-1 bg-slate-700 rounded">-</button>`;
    const ta  = row.children[1];
    const del = row.children[2];
    ta.addEventListener('input', e => { state.steps[idx] = e.target.value; refreshPreview(); });
    del.addEventListener('click', () => { state.steps.splice(idx, 1); renderSteps(); refreshPreview(); });
    wrap.appendChild(row);
  });
}
el('add-step')?.addEventListener('click', () => { state.steps.push(''); renderSteps(); refreshPreview(); });
el('fill-steps')?.addEventListener('click', () => {
  const raw = el('paste-steps').value.trim();
  if (!raw) return;
  state.steps = raw.split(';').map(s => s.trim()).filter(Boolean);
  renderSteps();
  refreshPreview();
});

// All Directions on Page 2 Toggle
el('all-directions-page2')?.addEventListener('change', e => {
  state.allDirectionsOnPage2 = e.target.checked;
  refreshPreview();
});

// ==============
// Directions Positioning Controls
// ==============
const stepsManualEnabled = el('steps-manual-enabled');
const stepsOffsetSlider  = el('steps-offset');
const stepsOffsetManual  = el('steps-offset-manual');
const stepsOffsetValue   = el('steps-offset-value');

if (stepsManualEnabled && stepsOffsetSlider && stepsOffsetManual && stepsOffsetValue) {
  // initialize UI from state
  stepsManualEnabled.checked = !!state.stepsManualEnabled;
  stepsOffsetSlider.value    = String(state.stepsOffset);
  stepsOffsetManual.value    = String(state.stepsOffset);
  stepsOffsetValue.textContent = `${state.stepsOffset} px`;

  const setStepsOffset = (v) => {
    const n = Math.max(-200, Math.min(600, parseInt(v || '0', 10)));
    state.stepsOffset = isNaN(n) ? 0 : n;
    stepsOffsetSlider.value   = String(state.stepsOffset);
    stepsOffsetManual.value   = String(state.stepsOffset);
    stepsOffsetValue.textContent = `${state.stepsOffset} px`;
    refreshPreview();
  };

  stepsManualEnabled.addEventListener('change', e => {
    state.stepsManualEnabled = e.target.checked;
    stepsOffsetSlider.disabled = !state.stepsManualEnabled;
    stepsOffsetManual.disabled = !state.stepsManualEnabled;
    refreshPreview();
  });

  stepsOffsetSlider.addEventListener('input', e => setStepsOffset(e.target.value));
  stepsOffsetManual.addEventListener('input', e => setStepsOffset(e.target.value));

  // reflect initial disabled state
  stepsOffsetSlider.disabled = !state.stepsManualEnabled;
  stepsOffsetManual.disabled = !state.stepsManualEnabled;
}

// ==============
// Templates I/O
// ==============
el('tpl1')?.addEventListener('change', async e => {
  const f = e.target.files?.[0]; if (!f) return;
  state.tpl1URL = await readFileToDataURL(f);
  el('tpl1-name').textContent = f.name;
  refreshPreview();
});
el('tpl2')?.addEventListener('change', async e => {
  const f = e.target.files?.[0]; if (!f) return;
  state.tpl2URL = await readFileToDataURL(f);
  el('tpl2-name').textContent = f.name;
  refreshPreview();
});

function getRecipeJSON() {
  return JSON.stringify({
    show_table_borders: state.showTableBorders,
    dietary_position: state.dietaryPosition,
    meal_type_background_color: state.mealTypeBackgroundColor,
    meal_type_text_color: state.mealTypeTextColor,
    left_panel_opacity: state.leftPanelOpacity,
    info_macro_gap: state.infoMacroGap,
    title: state.title,
    left_panel_font_color: state.leftPanelFontColor,
    title_color: state.titleColor,
    serves: state.serves,
    prep_time: state.prep,
    cook_time: state.cook,
    protein: state.pro,
    fat: state.fat,
    carbs: state.carb,
    calories: state.cal,
    template_path: state.tpl1URL || null,
    template_path_2: state.tpl2URL || null,
    recipe_image_path: state.recipeImageURL || null,
    logo_url: state.logoURL || null,
    logo_size: state.logoSize,
    meal_type: state.mealType,
    dietary_indicators: state.dietary,
    extra_text_sections: state.textSections,
    directions: state.steps,
    tables: state.tables.map(t => ({
      name: t.name,
      rows: t.rows.length,
      cols: t.rows[0]?.length || 0,
      data: t.rows
    })),
    left_panel_color: state.leftPanelColor,
    left_panel_border_enabled: state.leftPanelBorderEnabled,
    left_panel_border_color: state.leftPanelBorderColor,
    left_panel_border_width: state.leftPanelBorderWidth,
    left_panel_border_radius: state.leftPanelBorderRadius,
    left_panel_scale: state.leftPanelScale,
    left_panel_x: state.leftPanelX,
    left_panel_y: state.leftPanelY,
    right_panel_scale: state.rightPanelScale,
    right_panel_x: state.rightPanelX,
    right_panel_y: state.rightPanelY,
    panels_linked: state.panelsLinked,
    show_title: state.showTitle,
    show_recipe_image: state.showRecipeImage,
    show_logo: state.showLogo,
    show_meal_type: state.showMealType,
    show_dietary: state.showDietary,
    show_info_section: state.showInfoSection,
    info_layout_vertical: state.infoLayoutVertical,
    show_macros: state.showMacros,
    show_macros_title: state.showMacrosTitle,
    macros_title_text: state.macrosTitleText,
    macros_layout_vertical: state.macrosLayoutVertical,
    show_ingredients: state.showIngredients,
    show_directions: state.showDirections,
    show_text_sections: state.showTextSections,
    steps_manual_enabled: state.stepsManualEnabled,
    steps_offset: state.stepsOffset,
    all_directions_on_page2: state.allDirectionsOnPage2




  }, null, 2);
}

el('btn-save')?.addEventListener('click', () => {
  const blob = new Blob([getRecipeJSON()], { type: 'application/json' });
  const a = document.createElement('a');
  const title = state.title?.trim() || 'Recipe';
  const safe = title.replace(/[^a-z0-9_\- ]/gi, '_');
  const filename = `${safe}.recipe`;
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  addToRecentFiles(filename);
  updateCurrentFileName(filename);
});

el('btn-open')?.addEventListener('click', () => el('open-file').click());
el('open-file')?.addEventListener('change', async e => {
  const f = e.target.files?.[0]; if (!f) return;
  const text = await f.text();
  try {
    const data = JSON.parse(text);
    // Update filename display and recent files
    addToRecentFiles(f.name);
    updateCurrentFileName(f.name);

    state.title = data.title || '';
    state.titleColor = data.title_color || '#ffffff';
    el('title-color').value = state.titleColor;
    state.dietaryPosition = typeof data.dietary_position === 'number' ? data.dietary_position : 90;
    state.serves = data.serves || '';
    state.prep = data.prep_time || '';
    state.cook = data.cook_time || '';
    state.pro  = data.protein || '';
    state.fat  = data.fat || '';
    state.carb = data.carbs || '';
    state.cal  = data.calories || '';
    state.mealTypeBackgroundColor = data.meal_type_background_color || '#ffffff';
    state.mealTypeTextColor = data.meal_type_text_color || '#0f172a';
    state.mealType = data.meal_type || '';
    state.dietary = data.dietary_indicators || { gf: false, sf: false, nf: false, wf: false };
    state.textSections = data.extra_text_sections || [];
    state.steps = data.directions || [];
    state.tables = (data.tables || []).map(t => ({ name: t.name, rows: t.data || [[]] }));
    state.recipeImageURL = data.recipe_image_path || '';
    state.logoURL = data.logo_url || '';
    state.logoSize = typeof data.logo_size === 'number' ? data.logo_size : 200;
    state.tpl1URL = data.template_path || '';
    state.tpl2URL = data.template_path_2 || '';
    state.leftPanelColor = data.left_panel_color || '#0d1b2a';
    state.leftPanelFontColor = data.left_panel_font_color || '#ffffff';
    state.leftPanelBorderEnabled = !!data.left_panel_border_enabled;
    state.leftPanelBorderColor = data.left_panel_border_color || '#ffffff';
    state.leftPanelBorderWidth = typeof data.left_panel_border_width === 'number' ? data.left_panel_border_width : 2;
    state.leftPanelBorderRadius = typeof data.left_panel_border_radius === 'number' ? data.left_panel_border_radius : 6;
    state.leftPanelScale = typeof data.left_panel_scale === 'number' ? data.left_panel_scale : 100;
    state.leftPanelX = typeof data.left_panel_x === 'number' ? data.left_panel_x : 0;
    state.leftPanelY = typeof data.left_panel_y === 'number' ? data.left_panel_y : 0;
    state.rightPanelScale = typeof data.right_panel_scale === 'number' ? data.right_panel_scale : 100;
    state.rightPanelX = typeof data.right_panel_x === 'number' ? data.right_panel_x : 0;
    state.rightPanelY = typeof data.right_panel_y === 'number' ? data.right_panel_y : 0;
    state.panelsLinked = data.panels_linked !== false;
    state.showTitle = data.show_title !== false;
    state.showRecipeImage = data.show_recipe_image !== false;
    state.showLogo = !!data.show_logo;
    state.showMealType = data.show_meal_type !== false;
    state.showDietary = data.show_dietary !== false;
    state.showInfoSection = data.show_info_section !== false;
    state.infoLayoutVertical = !!data.info_layout_vertical;
    state.showMacros = data.show_macros !== false;
    state.showMacrosTitle = !!data.show_macros_title;
    state.macrosTitleText = data.macros_title_text || 'Individual Serving';
    state.macrosLayoutVertical = !!data.macros_layout_vertical;
    state.showIngredients = data.show_ingredients !== false;
    state.showDirections = data.show_directions !== false;
    state.showTextSections = data.show_text_sections !== false;
    state.leftPanelOpacity = typeof data.left_panel_opacity === 'number' ? data.left_panel_opacity : 1;
    state.showTableBorders = data.show_table_borders !== false;
    state.stepsManualEnabled = !!data.steps_manual_enabled;
    state.stepsOffset = (typeof data.steps_offset === 'number') ? data.steps_offset : 0;
    state.allDirectionsOnPage2 = !!data.all_directions_on_page2;

    // Sync the UI controls if they exist
    const sm = el('steps-manual-enabled');
    const so = el('steps-offset');
    const som = el('steps-offset-manual');
    const sov = el('steps-offset-value');
    const allDirPage2 = el('all-directions-page2');

    if (sm) sm.checked = state.stepsManualEnabled;
    if (so && som && sov) {
      so.value = String(state.stepsOffset);
      som.value = String(state.stepsOffset);
      sov.textContent = `${state.stepsOffset} px`;
      so.disabled = !state.stepsManualEnabled;
      som.disabled = !state.stepsManualEnabled;
    }
    if (allDirPage2) allDirPage2.checked = state.allDirectionsOnPage2;

    // reflect to UI when present
    if (leftBgColor)     leftBgColor.value = state.leftPanelColor;
    if (leftFontColor)   leftFontColor.value = state.leftPanelFontColor;
    if (leftBorderColor) leftBorderColor.value = state.leftPanelBorderColor;
    if (borderEnabled)   borderEnabled.checked = state.leftPanelBorderEnabled;
    setBorderWidth(state.leftPanelBorderWidth);
    setBorderRadius(state.leftPanelBorderRadius);
    setPanelScale(state.leftPanelScale);
    setPanelX(state.leftPanelX);
    setPanelY(state.leftPanelY);
    setRightPanelScale(state.rightPanelScale);
    setRightPanelX(state.rightPanelX);
    setRightPanelY(state.rightPanelY);

    // Update link toggle and control states
    if (linkPanels) {
      linkPanels.checked = state.panelsLinked;
      const rightControls = [
        el('right-panel-scale'), el('right-panel-scale-manual'),
        el('right-panel-x'), el('right-panel-x-manual'),
        el('right-panel-y'), el('right-panel-y-manual')
      ];
      rightControls.forEach(ctrl => {
        if (ctrl) ctrl.disabled = state.panelsLinked;
      });
    }

    // Update visibility toggles
    Object.entries(visibilityToggles).forEach(([id, stateKey]) => {
      const toggle = el(id);
      if (toggle) toggle.checked = state[stateKey];
    });

    // Update info layout toggle
    const infoLayoutToggle = el('info-layout-vertical');
    if (infoLayoutToggle) infoLayoutToggle.checked = state.infoLayoutVertical;

    // Update macros layout toggle
    const macrosLayoutToggle = el('macros-layout-vertical');
    if (macrosLayoutToggle) macrosLayoutToggle.checked = state.macrosLayoutVertical;

    // Update macros title toggle and text
    const macrosTitleToggle = el('show-macros-title');
    if (macrosTitleToggle) macrosTitleToggle.checked = state.showMacrosTitle;
    const macrosTitleTextInput = el('macros-title-text');
    if (macrosTitleTextInput) macrosTitleTextInput.value = state.macrosTitleText;

    // Update logo size
    const logoSizeSlider = el('logo-size');
    const logoSizeValue = el('logo-size-value');
    if (logoSizeSlider) logoSizeSlider.value = state.logoSize;
    if (logoSizeValue) logoSizeValue.textContent = state.logoSize + 'px';

    if (opacitySlider && opacityManual && opacityValue) {
      opacitySlider.value = state.leftPanelOpacity;
      opacityManual.value = state.leftPanelOpacity;
      opacityValue.textContent = `${Math.round(state.leftPanelOpacity * 100)}%`;
    }

    el('title').value = state.title;
    el('serves').value = state.serves;
    el('prep').value   = state.prep;
    el('cook').value   = state.cook;
    el('cal').value    = state.cal;
    el('pro').value    = state.pro;
    el('carb').value   = state.carb;
    el('fat').value    = state.fat;
    document.querySelectorAll('input[name="meal"]').forEach(r => r.checked = (r.value === state.mealType));
    el('gf').checked = !!state.dietary.gf;
    el('sf').checked = !!state.dietary.sf;
    el('nf').checked = !!state.dietary.nf;
    el('wf').checked = !!state.dietary.wf;
    el('img-name').textContent = state.recipeImageURL ? 'Image loaded' : 'No image';
    el('logo-name').textContent = state.logoURL ? 'Logo loaded' : 'No logo';
    el('tpl1-name').textContent = state.tpl1URL ? 'Template 1 loaded' : 'No template';
    el('tpl2-name').textContent = state.tpl2URL ? 'Optional' : 'Optional';

    renderTextSections();
    renderTables();
    renderSteps();
    refreshPreview();
  } catch (err) {
    alert('Failed to open .recipe file');
  }
});


/**
 * Export the current preview to a high-quality Letter PDF.
 */
el('btn-export-pdf')?.addEventListener('click', async () => {
  refreshPreview();

  // Add exporting class for export-specific CSS
  document.body.classList.add('exporting');
  refreshPreview();

  const section = el('preview-section');
  const prevPosition = section.style.position;
  section.style.position = 'static';

  const pages = [el('page1')];
  const hasPage2 = !el('page2').classList.contains('hidden');
  if (hasPage2) pages.push(el('page2'));

  // Ensure all <img> tags use CORS
  pages.forEach(p => p.querySelectorAll('img').forEach(img => img.crossOrigin = 'anonymous'));

  // Wait for styles/DOM to settle
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

  // Preload all images
  const urls = collectImageUrls(pages);
  try { await preloadUrls(urls); } catch (e) {
    console.warn('Some images failed to preload:', e);
  }

  const baseName = (state.title?.trim() || 'Recipe').replace(/[^a-z0-9_\- ]/gi, '_');

  // html2canvas options for high quality
  const canvasOptions = {
    scale: 4,  // Higher scale = better quality
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#ffffff',
    imageTimeout: 20000,
    removeContainer: true
  };

  try {
    // Create a dummy element to get jsPDF from html2pdf
    const tempEl = document.createElement('div');
    const opt = {
      margin: 0,
      jsPDF: { unit: 'pt', format: 'letter', orientation: 'portrait' }
    };

    // Get the jsPDF instance
    const pdf = await html2pdf().set(opt).from(tempEl).toPdf().get('pdf');

    // Clear the first page that was created
    pdf.deletePage(1);

    // Render each page and add to PDF
    for (let i = 0; i < pages.length; i++) {
      const canvas = await html2canvas(pages[i], canvasOptions);
      const imgData = canvas.toDataURL('image/jpeg', 1);

      // Add a new page
      pdf.addPage('letter', 'portrait');

      // Add image at top-left (0,0), scaled to fill letter size (612 x 792 points)
      pdf.addImage(imgData, 'JPEG', 0, 0, 612, 792);
    }

    pdf.save(`${baseName}.pdf`);
  } catch (err) {
    console.error('PDF Export error:', err);
    alert('PDF export failed. This usually means a remote image blocked CORS.\n' +
          'Try uploading images directly or use the JPEG export as a fallback.');
  } finally {
    document.body.classList.remove('exporting');
    refreshPreview();
    section.style.position = prevPosition || '';
  }
});


// ==================
// Export to JPEG
// ==================
// ---------- helpers ----------
function getBgUrl(el) {
  const bg = (el && el.style && el.style.backgroundImage) || '';
  const m = bg.match(/url\(["']?(.*?)["']?\)/i);
  return m ? m[1] : null;
}

function collectImageUrls(nodes) {
  const urls = new Set();
  nodes.forEach(n => {
    // <img> tags inside the page
    n.querySelectorAll('img').forEach(img => {
      if (img.src) urls.add(img.src);
    });
    // CSS backgrounds on known containers (your templates)
    const tpl1 = n.querySelector('#tpl1-bg');
    const tpl2 = n.querySelector('#tpl2-bg');
    [tpl1, tpl2].forEach(el => {
      const u = el ? getBgUrl(el) : null;
      if (u) urls.add(u);
    });
  });
  return Array.from(urls);
}

async function preloadUrls(urls) {
  // skip data URLs
  const httpUrls = urls.filter(u => !/^data:/i.test(u));
  await Promise.all(httpUrls.map(u => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.decoding = 'async';
      img.onload = () => {
        if (img.decode) {
          img.decode().then(resolve).catch(() => resolve());
        } else {
          resolve();
        }
      };
      img.onerror = () => reject(new Error('Failed to load ' + u));
      img.src = u;
    });
  }));
}

function canvasToJpegBlob(canvas, quality = 0.95) {
  return new Promise(resolve => {
    canvas.toBlob(b => {
      if (b) return resolve(b);
      // Fallback for browsers that return null
      try {
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        // turn dataURL into Blob
        const byteString = atob(dataUrl.split(',')[1]);
        const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
        resolve(new Blob([ab], { type: mimeString }));
      } catch {
        resolve(null);
      }
    }, 'image/jpeg', quality);
  });
}

async function downloadBlob(blob, filename) {
  if (!blob || blob.size === 0) throw new Error('Empty blob');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // revoke after a short delay so the download can start
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

// ---------- robust export ----------
el('btn-export-jpeg')?.addEventListener('click', async () => {
  refreshPreview();

  // Capture state
// Capture state
document.body.classList.add('exporting');
refreshPreview();  // reflow with export CSS
const section = el('preview-section');

  const prevPosition = section.style.position;
  section.style.position = 'static';

  const pages = [el('page1')];
  const hasPage2 = !el('page2').classList.contains('hidden');
  if (hasPage2) pages.push(el('page2'));

  // Ensure all <img> tags use CORS (safe for data URLs, too)
  pages.forEach(p => p.querySelectorAll('img').forEach(img => img.crossOrigin = 'anonymous'));

  // Wait a frame so styles/DOM updates settle
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

  // Preload all images (including background templates)
  const urls = collectImageUrls(pages);
  try { await preloadUrls(urls); } catch (e) {
    console.warn('Some images failed to preload:', e);
    // keep going; html2canvas will skip failed ones if allowTaint=false
  }

  const baseName = (state.title?.trim() || 'Recipe').replace(/[^a-z0-9_\- ]/gi, '_');

  try {
    for (let i = 0; i < pages.length; i++) {
      const node = pages[i];

      const canvas = await html2canvas(node, {
        scale: 2,
        useCORS: true,
        allowTaint: false,          // avoid tainted canvas => null blob
        backgroundColor: '#ffffff',
        imageTimeout: 20000,
        removeContainer: true
      });

      const blob = await canvasToJpegBlob(canvas, 0.95);
      if (!blob) throw new Error('toBlob and toDataURL both failed');

      const filename = pages.length > 1 ? `${baseName} - Page ${i + 1}.jpg` : `${baseName}.jpg`;
      await downloadBlob(blob, filename);
    }
  } catch (err) {
    console.error('Export error:', err);
    alert('Export failed. This usually means a remote image blocked CORS or the browser aborted the canvas.\n' +
          'Try uploading images (data URLs) or hosting them with CORS enabled, then export again.');
  } finally {
document.body.classList.remove('exporting');
refreshPreview();  // restore normal layout
section.style.position = prevPosition || '';

  }
});



// ==================
// Copy ChatGPT Instructions
// ==================
el('copy-instructions-btn')?.addEventListener('click', async () => {
  const instructions = `Task: Convert the attached recipe into my Master Paste format.

Produce the Master Paste text with these sections, exactly as shown:

::META::
title;mealtype;dietary;serves;preptime;cooktime;calories;protein;carbs;fat

::TEXT::  (optional, repeatable for multiple text blocks)
<Label line>
<Paragraph text>

::INGREDIENTS::
Either a single default table with 3 semicolon columns:
Ingredient;Amount (US);Amount (Metric)
<Row 1>
<Row 2>
…
OR multiple named tables, each started by:
::TABLE <name>::
Ingredient;Amount (US);Amount (Metric)
<Row 1>
<Row 2>

::DIRECTIONS::
One step per line (no numbering)

RULES:
- mealtype must be one of: Breakfast, Lunch/Dinner, Snack, Dessert, Sauce
- dietary is a comma list from: gf, sf, nf, wf (leave empty if none apply)
- Keep ingredient names verbatim from the recipe
- Keep amounts in both US and Metric with units
- Times are numbers in minutes only (no units)
- Macros are numbers only (no units)
- Do not number the directions
- If the recipe has multiple ingredient sections (like "Bowl" and "Sauce"), use ::TABLE <name>:: for each

EXAMPLE OUTPUT:

::META::
Ultimate Tofu Bowl;Lunch/Dinner;gf,wf;4;10;20;520;38;62;14

::TEXT::
Notes
Use extra-firm tofu and press well.

::INGREDIENTS::
::TABLE Bowl::
Ingredient;Amount (US);Amount (Metric)
Firm Tofu, cooked;28 oz;794 g
Brown Rice, cooked;3 cups;600 g
Baby Spinach;6 cups;180 g

::TABLE Sauce::
Ingredient;Amount (US);Amount (Metric)
Soy Sauce, low sodium;3 tbsp;45 ml
Maple Syrup;1 tbsp;15 ml
Rice Vinegar;1 tbsp;15 ml

::DIRECTIONS::
Press and cube tofu.
Sear tofu until golden.
Whisk sauce and add to pan.
Toss with rice and spinach. Serve hot.`;

  const btn = el('copy-instructions-btn');
  const statusEl = el('master-paste-status');

  try {
    await navigator.clipboard.writeText(instructions);
    const originalText = btn.textContent;
    btn.textContent = '✓ Copied!';
    statusEl.textContent = 'Instructions copied to clipboard - paste with your recipe screenshot in ChatGPT';
    statusEl.className = 'text-sm text-blue-400';

    setTimeout(() => {
      btn.textContent = originalText;
      statusEl.textContent = '';
    }, 3000);
  } catch (err) {
    // Fallback for browsers without clipboard API
    const textarea = document.createElement('textarea');
    textarea.value = instructions;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);

    const originalText = btn.textContent;
    btn.textContent = '✓ Copied!';
    statusEl.textContent = 'Instructions copied to clipboard - paste with your recipe screenshot in ChatGPT';
    statusEl.className = 'text-sm text-blue-400';

    setTimeout(() => {
      btn.textContent = originalText;
      statusEl.textContent = '';
    }, 3000);
  }
});

// ==================
// Copy Ingredients Prompt
// ==================
el('copy-ingredients-prompt-btn')?.addEventListener('click', async () => {
  const instructions = `Task: Extract ingredients from the attached recipe image and format as semicolon-separated data.

Output Format:
For each ingredient, provide exactly 3 fields separated by semicolons:
Ingredient Name;Amount (US);Amount (Metric)

RULES:
1. Keep ingredient names exactly as shown in the recipe
2. Include full US measurements with units (cups, tbsp, tsp, oz, lb, etc.)
3. Convert to metric with units (ml, g, kg, L, etc.)
4. If the recipe has multiple ingredient sections (like "For the Bowl" and "For the Sauce"), separate them with a blank line and add a section label
5. Each ingredient should be on its own line
6. Use semicolons (;) as separators, NOT commas
7. Maintain the order of ingredients as they appear in the recipe

EXAMPLE OUTPUT:

For the Bowl:
Firm Tofu, pressed and cubed;28 oz;794 g
Brown Rice, cooked;3 cups;600 g
Baby Spinach;6 cups;180 g
Red Bell Pepper, diced;1 medium;150 g

For the Sauce:
Soy Sauce, low sodium;3 tbsp;45 ml
Maple Syrup;1 tbsp;15 ml
Rice Vinegar;1 tbsp;15 ml
Sesame Oil;1 tsp;5 ml

Instructions:
1. Copy this prompt
2. Open ChatGPT and paste it
3. Attach a photo of your recipe's ingredient list
4. Copy the output and paste it into the table's "Paste data" field
5. Click "Fill Table" to populate the ingredient table`;

  const btn = el('copy-ingredients-prompt-btn');
  const statusEl = el('ingredients-prompt-status');

  try {
    await navigator.clipboard.writeText(instructions);
    const originalText = btn.textContent;
    btn.textContent = '✓ Copied!';
    statusEl.textContent = 'Prompt copied to clipboard - paste with your ingredient list image in ChatGPT';
    statusEl.className = 'text-sm text-blue-400';

    setTimeout(() => {
      btn.textContent = originalText;
      statusEl.textContent = '';
    }, 3000);
  } catch (err) {
    // Fallback for browsers without clipboard API
    const textarea = document.createElement('textarea');
    textarea.value = instructions;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);

    const originalText = btn.textContent;
    btn.textContent = '✓ Copied!';
    statusEl.textContent = 'Prompt copied to clipboard - paste with your ingredient list image in ChatGPT';
    statusEl.className = 'text-sm text-blue-400';

    setTimeout(() => {
      btn.textContent = originalText;
      statusEl.textContent = '';
    }, 3000);
  }
});

// ==================
// Master Paste Fill
// ==================
el('fill-all-btn')?.addEventListener('click', () => {
  const textarea = el('master-paste');
  const statusEl = el('master-paste-status');
  const text = textarea.value.trim();

  if (!text) {
    statusEl.textContent = 'Please paste recipe text first';
    statusEl.className = 'text-sm text-red-400';
    return;
  }

  try {
    const parsed = parseMasterPaste(text);

    // Apply to state
    state.title = parsed.title;
    state.titleColor = state.titleColor || '#ffffff';
    state.mealType = parsed.meal_type;
    state.dietary = parsed.dietary_indicators;
    state.serves = parsed.serves;
    state.prep = parsed.prep_time;
    state.cook = parsed.cook_time;
    state.cal = parsed.calories;
    state.pro = parsed.protein;
    state.carb = parsed.carbs;
    state.fat = parsed.fat;
    state.textSections = parsed.extra_text_sections;
    state.tables = parsed.tables.map(t => ({
      name: t.name,
      rows: t.data,
      paste: ''
    }));
    state.steps = parsed.directions;

    // Update UI elements
    el('title').value = state.title;
    el('serves').value = state.serves;
    el('prep').value = state.prep;
    el('cook').value = state.cook;
    el('cal').value = state.cal;
    el('pro').value = state.pro;
    el('carb').value = state.carb;
    el('fat').value = state.fat;

    // Set meal type radio
    document.querySelectorAll('input[name="meal"]').forEach(r => {
      r.checked = (r.value === state.mealType);
    });

    // Set dietary checkboxes
    el('gf').checked = !!state.dietary.gf;
    el('sf').checked = !!state.dietary.sf;
    el('nf').checked = !!state.dietary.nf;
    el('wf').checked = !!state.dietary.wf;

    // Re-render sections
    renderTextSections();
    renderTables();
    renderSteps();
    refreshPreview();

    statusEl.textContent = '✓ Recipe loaded successfully!';
    statusEl.className = 'text-sm text-emerald-400';

    // Clear status after 3 seconds
    setTimeout(() => {
      statusEl.textContent = '';
    }, 3000);

  } catch (err) {
    console.error('Parse error:', err);
    statusEl.textContent = '✗ Parse error: ' + err.message;
    statusEl.className = 'text-sm text-red-400';
  }
});

// =======
// Menu Bar
// =======
const RECENT_FILES_KEY = 'recipe_recent_files';
const MAX_RECENT_FILES = 10;

function getRecentFiles() {
  try {
    const saved = localStorage.getItem(RECENT_FILES_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function addToRecentFiles(filename) {
  const recent = getRecentFiles();
  // Remove if already exists
  const filtered = recent.filter(f => f.name !== filename);
  // Add to front
  filtered.unshift({ name: filename, date: Date.now() });
  // Keep only MAX_RECENT_FILES
  const trimmed = filtered.slice(0, MAX_RECENT_FILES);
  try {
    localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(trimmed));
  } catch {}
  renderRecentFiles();
}

function clearRecentFiles() {
  try {
    localStorage.removeItem(RECENT_FILES_KEY);
  } catch {}
  renderRecentFiles();
}

function renderRecentFiles() {
  const list = document.getElementById('recent-files-list');
  if (!list) return;

  const recent = getRecentFiles();

  if (recent.length === 0) {
    list.innerHTML = '<div class="px-4 py-2 text-sm text-slate-500 italic">No recent files</div>';
    return;
  }

  list.innerHTML = recent.map(file => `
    <button class="recent-file-item w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 truncate" data-filename="${file.name}" title="${file.name}">
      ${file.name}
    </button>
  `).join('');

  // Add click handlers
  list.querySelectorAll('.recent-file-item').forEach(btn => {
    btn.addEventListener('click', () => {
      // Recent files just show the name - actual file needs to be opened via dialog
      alert(`To open "${btn.dataset.filename}", use File > Open and select the file.`);
    });
  });
}

function updateCurrentFileName(name) {
  const el = document.getElementById('current-file-name');
  if (el) {
    el.textContent = name || 'Untitled';
  }
}

function newRecipe() {
  if (confirm('Create a new recipe? This will clear all current data.')) {
    // Reset state to defaults
    Object.assign(state, {
      title: '',
      recipeImageURL: '',
      logoURL: '',
      showLogo: false,
      mealType: '',
      dietary: { gf: false, sf: false, nf: false, wf: false },
      serves: '',
      prep: '',
      cook: '',
      cal: '',
      pro: '',
      carb: '',
      fat: '',
      textSections: [],
      tables: [],
      steps: [],
      tpl1URL: '',
      tpl2URL: ''
    });

    // Clear form fields
    el('title').value = '';
    el('serves').value = '';
    el('prep').value = '';
    el('cook').value = '';
    el('cal').value = '';
    el('pro').value = '';
    el('carb').value = '';
    el('fat').value = '';
    el('master-paste').value = '';

    document.querySelectorAll('input[name="meal"]').forEach(r => r.checked = false);
    el('gf').checked = false;
    el('sf').checked = false;
    el('nf').checked = false;
    el('wf').checked = false;

    el('img-name').textContent = 'No image';
    el('logo-name').textContent = 'No logo';
    el('tpl1-name').textContent = 'No template';
    el('tpl2-name').textContent = 'Optional';

    renderTextSections();
    renderTables();
    renderSteps();
    refreshPreview();
    updateCurrentFileName('Untitled');
  }
}

function resetAllStyles() {
  if (confirm('Reset all styles to defaults?')) {
    state.leftPanelColor = '#0d1b2a';
    state.leftPanelFontColor = '#ffffff';
    state.leftPanelBorderEnabled = false;
    state.leftPanelBorderColor = '#000000';
    state.leftPanelBorderWidth = 2;
    state.leftPanelBorderRadius = 6;
    state.leftPanelOpacity = 1;
    state.leftPanelScale = 100;
    state.leftPanelX = 0;
    state.leftPanelY = 0;
    state.rightPanelScale = 100;
    state.rightPanelX = 0;
    state.rightPanelY = 0;
    state.panelsLinked = true;
    state.titleColor = '#ffffff';
    state.titleFont = 36;
    state.leftPanelFont = 14;

    // Update UI
    if (leftBgColor) leftBgColor.value = state.leftPanelColor;
    if (leftFontColor) leftFontColor.value = state.leftPanelFontColor;
    if (leftBorderColor) leftBorderColor.value = state.leftPanelBorderColor;
    if (borderEnabled) borderEnabled.checked = false;
    if (el('title-color')) el('title-color').value = state.titleColor;
    if (linkPanels) linkPanels.checked = true;

    document.documentElement.style.setProperty('--title-font-size', '36px');
    document.documentElement.style.setProperty('--lp-font-size', '14px');

    setBorderWidth(2);
    setBorderRadius(6);
    setPanelScale(100);
    setPanelX(0);
    setPanelY(0);
    setRightPanelScale(100);
    setRightPanelX(0);
    setRightPanelY(0);

    if (opacitySlider) opacitySlider.value = 1;
    if (opacityManual) opacityManual.value = 1;
    if (opacityValue) opacityValue.textContent = '100%';

    if (titleSlider) titleSlider.value = 36;
    if (titleManual) titleManual.value = 36;
    if (titleValue) titleValue.textContent = '36px';

    if (lpSlider) lpSlider.value = 14;
    if (lpManual) lpManual.value = 14;
    if (lpValue) lpValue.textContent = '14px';

    refreshPreview();
  }
}

function showKeyboardShortcuts() {
  alert(`Keyboard Shortcuts:

Ctrl+N - New Recipe
Ctrl+O - Open Recipe
Ctrl+S - Save Recipe
Ctrl+Shift+S - Save As

Ctrl+E - Export PDF
Ctrl+Shift+E - Export JPEG`);
}

function showAbout() {
  alert(`Recipe Creator

A tool for creating beautiful recipe cards.

Version 1.0`);
}

// Toggle action bar visibility
function toggleActionBar() {
  const actionBar = el('action-bar');
  const menuItem = document.querySelector('[data-action="toggle-action-bar"]');
  const checkmark = menuItem?.querySelector('.checkmark');

  if (actionBar) {
    const isVisible = actionBar.style.display !== 'none';
    actionBar.style.display = isVisible ? 'none' : '';
    if (checkmark) {
      checkmark.style.display = isVisible ? 'none' : '';
    }
    // Save preference to localStorage
    localStorage.setItem('actionBarVisible', !isVisible);
  }
}

// Restore action bar visibility on load
(function restoreActionBarState() {
  const saved = localStorage.getItem('actionBarVisible');
  if (saved === 'false') {
    const actionBar = el('action-bar');
    const menuItem = document.querySelector('[data-action="toggle-action-bar"]');
    const checkmark = menuItem?.querySelector('.checkmark');
    if (actionBar) actionBar.style.display = 'none';
    if (checkmark) checkmark.style.display = 'none';
  }
})();

// Menu action handlers
document.querySelectorAll('.menu-action').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const action = btn.dataset.action;

    switch (action) {
      case 'new':
        newRecipe();
        break;
      case 'open':
        el('open-file')?.click();
        break;
      case 'save':
      case 'save-as':
        el('btn-save')?.click();
        break;
      case 'export-pdf':
        el('btn-export-pdf')?.click();
        break;
      case 'export-jpeg':
        el('btn-export-jpeg')?.click();
        break;
      case 'clear-all':
        newRecipe();
        break;
      case 'reset-styles':
        resetAllStyles();
        break;
      case 'clear-recent':
        clearRecentFiles();
        break;
      case 'keyboard-shortcuts':
        showKeyboardShortcuts();
        break;
      case 'about':
        showAbout();
        break;
      case 'toggle-action-bar':
        toggleActionBar();
        break;
    }

    // Close menus after action
    document.querySelectorAll('.menu-dropdown').forEach(m => m.classList.remove('open'));
  });
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

  if (ctrlKey && !e.shiftKey) {
    switch (e.key.toLowerCase()) {
      case 'n':
        e.preventDefault();
        newRecipe();
        break;
      case 'o':
        e.preventDefault();
        el('open-file')?.click();
        break;
      case 's':
        e.preventDefault();
        el('btn-save')?.click();
        break;
      case 'e':
        e.preventDefault();
        el('btn-export-pdf')?.click();
        break;
    }
  } else if (ctrlKey && e.shiftKey) {
    switch (e.key.toLowerCase()) {
      case 's':
        e.preventDefault();
        el('btn-save')?.click();
        break;
      case 'e':
        e.preventDefault();
        el('btn-export-jpeg')?.click();
        break;
    }
  }
});

// Close menus when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.menu-item')) {
    document.querySelectorAll('.menu-dropdown').forEach(m => m.classList.remove('open'));
  }
});

// Toggle menu on click
document.querySelectorAll('.menu-trigger').forEach(trigger => {
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const dropdown = trigger.nextElementSibling;
    const isOpen = dropdown.classList.contains('open');

    // Close all other menus
    document.querySelectorAll('.menu-dropdown').forEach(m => m.classList.remove('open'));

    if (!isOpen) {
      dropdown.classList.add('open');
    }
  });
});

// Initialize recent files
renderRecentFiles();

// ====================
// OpenAI Integration
// ====================

function getOpenAIKey() {
  // Read from config.js (which is gitignored)
  return typeof OPENAI_API_KEY !== 'undefined' ? OPENAI_API_KEY : '';
}

function getMasterPastePrompt() {
  return `Task: Convert the attached recipe into my Master Paste format.

Produce the Master Paste text with these sections, exactly as shown:

::META::
title;mealtype;dietary;serves;preptime;cooktime;calories;protein;carbs;fat

::TEXT::  (optional, repeatable for multiple text blocks)
<Label line>
<Paragraph text>

::INGREDIENTS::
Either a single default table with 3 semicolon columns:
Ingredient;Amount (US);Amount (Metric)
<Row 1>
<Row 2>
…
OR multiple named tables, each started by:
::TABLE <name>::
Ingredient;Amount (US);Amount (Metric)
<Row 1>
<Row 2>

::DIRECTIONS::
One step per line (no numbering)

RULES:
- mealtype must be one of: Breakfast, Lunch/Dinner, Smoothie, Snack, Dessert, Sauce
- dietary is a comma list from: gf, sf, nf, wf (leave empty if none apply)
- Keep ingredient names verbatim from the recipe
- Keep amounts in both US and Metric with units
- Times are numbers in minutes only (no units)
- Macros are numbers only (no units)
- Do not number the directions
- If the recipe has multiple ingredient sections (like "Bowl" and "Sauce"), use ::TABLE <name>:: for each

EXAMPLE OUTPUT:

::META::
Ultimate Tofu Bowl;Lunch/Dinner;gf,wf;4;10;20;520;38;62;14

::TEXT::
Notes
Use extra-firm tofu and press well.

::INGREDIENTS::
::TABLE Bowl::
Ingredient;Amount (US);Amount (Metric)
Firm Tofu, cooked;28 oz;794 g
Brown Rice, cooked;3 cups;600 g
Baby Spinach;6 cups;180 g

::TABLE Sauce::
Ingredient;Amount (US);Amount (Metric)
Soy Sauce, low sodium;3 tbsp;45 ml
Maple Syrup;1 tbsp;15 ml
Rice Vinegar;1 tbsp;15 ml

::DIRECTIONS::
Press and cube tofu.
Sear tofu until golden.
Whisk sauce and add to pan.
Toss with rice and spinach. Serve hot.

IMPORTANT: Return ONLY the Master Paste text. No explanations, no markdown formatting, no code blocks.`;
}

async function aiImportFromImage(file) {
  const apiKey = getOpenAIKey();
  if (!apiKey) {
    const statusEl = el('master-paste-status');
    statusEl.textContent = 'AI Import not configured. Please add your API key to config.js';
    statusEl.className = 'text-sm text-red-400';
    console.error('OpenAI API key not found. Create config.js with: const OPENAI_API_KEY = "your-key";');
    return;
  }

  const statusEl = el('master-paste-status');
  const btn = el('ai-import-btn');
  const textarea = el('master-paste');
  const originalText = btn.textContent;

  btn.textContent = 'Processing...';
  btn.disabled = true;
  statusEl.textContent = 'Sending image to OpenAI...';
  statusEl.className = 'text-sm text-blue-400';

  try {
    // Convert image to base64
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Determine media type
    const mediaType = file.type || 'image/jpeg';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getOpenAIKey()}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: getMasterPastePrompt()
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mediaType};base64,${base64}`
                }
              }
            ]
          }
        ],
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData.error?.message || `HTTP ${response.status}`;
      throw new Error(errMsg);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    // Strip markdown code fences if the model wrapped it
    const cleaned = content.replace(/^```[\s\S]*?\n/, '').replace(/\n```\s*$/, '');

    // Put the result in the master paste textarea
    textarea.value = cleaned;

    statusEl.textContent = 'AI extraction complete - click "Fill All" to populate fields, or edit the text first';
    statusEl.className = 'text-sm text-emerald-400';

  } catch (err) {
    console.error('OpenAI API error:', err);
    if (err.message.includes('401') || err.message.includes('Incorrect API key')) {
      statusEl.textContent = 'Invalid API key. Go to Settings > OpenAI API Key to update it.';
    } else if (err.message.includes('429')) {
      statusEl.textContent = 'Rate limited. Please wait a moment and try again.';
    } else {
      statusEl.textContent = 'AI error: ' + err.message;
    }
    statusEl.className = 'text-sm text-red-400';
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

// AI Import button handler
el('ai-import-btn')?.addEventListener('click', () => {
  el('ai-import-file')?.click();
});

el('ai-import-file')?.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (file) {
    aiImportFromImage(file);
    e.target.value = ''; // reset so same file can be re-selected
  }
});

// Also support paste image directly into master-paste textarea
el('master-paste')?.addEventListener('paste', (e) => {
  const items = e.clipboardData?.items;
  if (!items) return;

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      e.preventDefault();
      const file = item.getAsFile();
      if (file) {
        aiImportFromImage(file);
      }
      return;
    }
  }
});

// =======
// Boot
// =======
renderTextSections();
renderTables();
renderSteps();
refreshPreview();

const STORAGE_KEY = "valuadorInmobiliarioV1";

const nameInput = document.getElementById("prop-name");
const m2Input = document.getElementById("prop-m2");
const typeSelect = document.getElementById("prop-type");
const stateSelect = document.getElementById("prop-state");
const comp1Input = document.getElementById("comp1");
const comp2Input = document.getElementById("comp2");
const comp3Input = document.getElementById("comp3");

const calcBtn = document.getElementById("calc-btn");
const clearBtn = document.getElementById("clear-btn");

const resultsSection = document.getElementById("results");
const summaryEl = document.getElementById("summary");
const avgCompsEl = document.getElementById("avg-comps");
const suggestedEl = document.getElementById("suggested");
const rangeLowEl = document.getElementById("range-low");
const rangeHighEl = document.getElementById("range-high");
const adviceEl = document.getElementById("advice");
const saveStatusEl = document.getElementById("save-status");

// Helpers
function formatMoney(value) {
  if (isNaN(value)) return "-";
  return value.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0
  });
}

function showSaved() {
  saveStatusEl.textContent = "Guardado ✓";
  saveStatusEl.style.color = "#22c55e";
  setTimeout(() => {
    saveStatusEl.textContent = "";
    saveStatusEl.style.color = "#6b7280";
  }, 1500);
}

// Cargar/guardar datos
function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.warn("No se pudo leer STORAGE_KEY", e);
    return null;
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  showSaved();
}

function fillForm(data) {
  if (!data) return;
  nameInput.value = data.name || "";
  m2Input.value = data.m2 || "";
  typeSelect.value = data.type || "departamento";
  stateSelect.value = data.state || "medio";
  comp1Input.value = data.comp1 || "";
  comp2Input.value = data.comp2 || "";
  comp3Input.value = data.comp3 || "";
}

function getFormData() {
  return {
    name: nameInput.value.trim(),
    m2: Number(m2Input.value),
    type: typeSelect.value,
    state: stateSelect.value,
    comp1: Number(comp1Input.value) || 0,
    comp2: Number(comp2Input.value) || 0,
    comp3: Number(comp3Input.value) || 0
  };
}

// Lógica de valuación
function getTypeFactor(type) {
  switch (type) {
    case "casa":
      return 1.05;
    case "terreno":
      return 0.85;
    case "departamento":
    default:
      return 1.0;
  }
}

function getStateFactor(state) {
  switch (state) {
    case "bajo":
      return 0.9;
    case "alto":
      return 1.1;
    case "medio":
    default:
      return 1.0;
  }
}

function calcValuation(data) {
  const comps = [data.comp1, data.comp2, data.comp3].filter((v) => v > 0);
  if (!data.m2 || comps.length < 2) {
    return { error: "Necesitas al menos 2 comparables y los metros cuadrados." };
  }

  const sumComps = comps.reduce((acc, v) => acc + v, 0);
  const avgComps = sumComps / comps.length;

  const typeFactor = getTypeFactor(data.type);
  const stateFactor = getStateFactor(data.state);

  let suggested = avgComps * typeFactor * stateFactor;

  // Rango +/- 8%
  const rangeLow = suggested * 0.92;
  const rangeHigh = suggested * 1.08;

  return {
    avgComps,
    suggested,
    rangeLow,
    rangeHigh
  };
}

function getAdviceText(data, valuation) {
  const { suggested, rangeLow, rangeHigh } = valuation;

  let typeText = "";
  if (data.type === "departamento") typeText = "departamento";
  else if (data.type === "casa") typeText = "casa";
  else typeText = "terreno";

  let stateText = "";
  if (data.state === "alto") stateText = "en excelente estado";
  else if (data.state === "medio") stateText = "en estado normal";
  else stateText = "que requiere reforma";

  return (
    `Este rango considera un ${typeText} ${stateText}, basado en tus comparables. ` +
    `Si quieres vender rápido, acércate al rango bajo (${formatMoney(rangeLow)}). ` +
    `Si puedes esperar y la demanda es alta, puedes acercarte al rango alto (${formatMoney(rangeHigh)}).`
  );
}

// Render de resultados
function showResults(data, valuation) {
  resultsSection.classList.remove("hidden");

  const name = data.name || "Esta propiedad";
  summaryEl.textContent = `${name} con ${data.m2} m² tiene un precio sugerido de ${formatMoney(
    valuation.suggested
  )} basado en los comparables que ingresaste.`;

  avgCompsEl.textContent = formatMoney(valuation.avgComps);
  suggestedEl.textContent = formatMoney(valuation.suggested);
  rangeLowEl.textContent = formatMoney(valuation.rangeLow);
  rangeHighEl.textContent = formatMoney(valuation.rangeHigh);

  adviceEl.textContent = getAdviceText(data, valuation);

  // Forzar re-animación
  resultsSection.classList.remove("fade-restart");
  void resultsSection.offsetWidth;
  resultsSection.classList.add("fade-restart");
}

// Eventos
calcBtn.addEventListener("click", () => {
  const data = getFormData();

  // Guardar datos del formulario
  saveData(data);

  const valuation = calcValuation(data);
  if (valuation.error) {
    alert(valuation.error);
    return;
  }

  showResults(data, valuation);
});

clearBtn.addEventListener("click", () => {
  if (!confirm("¿Seguro que quieres limpiar todos los datos?")) return;
  localStorage.removeItem(STORAGE_KEY);

  nameInput.value = "";
  m2Input.value = "";
  typeSelect.value = "departamento";
  stateSelect.value = "medio";
  comp1Input.value = "";
  comp2Input.value = "";
  comp3Input.value = "";
  resultsSection.classList.add("hidden");
  saveStatusEl.textContent = "";
});

// Init
document.addEventListener("DOMContentLoaded", () => {
  const saved = loadData();
  if (saved) fillForm(saved);
});

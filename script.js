/**
 * TipSplit — Tip Calculator & Bill Splitter
 * Vanilla JS, no frameworks, no dependencies.
 */
(function () {
  'use strict';

  const MAX_TIP = 100;

  // ── DOM refs ──────────────────────────────────────────────────
  const billInput    = document.getElementById('bill-amount');
  const customTip    = document.getElementById('custom-tip');
  const peopleInput  = document.getElementById('num-people');
  const tipBtns      = document.querySelectorAll('.tip-btn');
  const resetBtn     = document.getElementById('reset-btn');

  const billError    = document.getElementById('bill-error');
  const tipError     = document.getElementById('tip-error');
  const peopleError  = document.getElementById('people-error');

  const valTip       = document.getElementById('val-tip');
  const valTotal     = document.getElementById('val-total');
  const valPer       = document.getElementById('val-per');

  const splitVisual  = document.getElementById('split-visual');
  const splitBillBar = document.getElementById('split-bill-bar');
  const splitTipBar  = document.getElementById('split-tip-bar');

  // ── State ─────────────────────────────────────────────────────
  let activePreset = null; // '10' | '15' | '20' | null

  // ── Validation helpers ────────────────────────────────────────
  function validateBill(raw) {
    const str = raw.trim();
    if (str === '') return { valid: false, error: 'Please enter a bill amount.' };
    // Reject scientific notation
    if (/e/i.test(str)) return { valid: false, error: 'Please enter a plain number.' };
    const n = Number(str);
    if (isNaN(n))   return { valid: false, error: 'Please enter a valid number.' };
    if (n <= 0)     return { valid: false, error: 'Bill amount must be greater than 0.' };
    return { valid: true, value: n };
  }

  function validateTip(presetVal, customRaw) {
    if (presetVal !== null) {
      return { valid: true, value: Number(presetVal) };
    }
    const str = customRaw.trim();
    if (str === '') return { valid: true, value: 0 }; // no tip selected = 0%
    if (/e/i.test(str)) return { valid: false, error: 'Please enter a plain number.' };
    const n = Number(str);
    if (isNaN(n))   return { valid: false, error: 'Please enter a valid tip percentage.' };
    if (n < 0)      return { valid: false, error: 'Tip cannot be negative.' };
    if (n > MAX_TIP) return { valid: false, error: `Tip cannot exceed ${MAX_TIP}%.` };
    return { valid: true, value: n };
  }

  function validatePeople(raw) {
    const str = raw.trim();
    if (str === '') return { valid: false, error: 'Please enter number of people.' };
    if (/[.\-]/.test(str)) {
      return { valid: false, error: 'Must be a whole number (1 or more).' };
    }
    const n = Number(str);
    if (isNaN(n) || !Number.isInteger(n)) return { valid: false, error: 'Must be a whole number (1 or more).' };
    if (n < 1)   return { valid: false, error: 'Must be at least 1 person.' };
    return { valid: true, value: n };
  }

  // ── Calculation ───────────────────────────────────────────────
  function calculate(bill, tipPct, people) {
    const tip   = Math.round(bill * (tipPct / 100) * 100) / 100;
    const total = Math.round((bill + tip) * 100) / 100;
    const per   = Math.round((total / people) * 100) / 100;
    return { tip, total, per };
  }

  // ── Formatting ────────────────────────────────────────────────
  function fmt(n) {
    return n.toFixed(2);
  }

  // ── Set error state on a wrap element ─────────────────────────
  function setError(wrap, msg) {
    if (wrap) wrap.classList.toggle('has-error', msg !== '');
  }

  // ── Update outputs ────────────────────────────────────────────
  function setOutputs(tip, total, per, bill) {
    const hasValues = tip !== null;
    valTip.textContent   = hasValues ? fmt(tip)   : '—';
    valTotal.textContent = hasValues ? fmt(total) : '—';
    valPer.textContent   = hasValues ? fmt(per)   : '—';

    // Split bar
    if (hasValues && total > 0) {
      const billPct = Math.round((bill / total) * 1000) / 10;
      const tipPct  = Math.round((tip  / total) * 1000) / 10;
      splitBillBar.style.width = billPct + '%';
      splitTipBar.style.width  = tipPct  + '%';
      splitVisual.classList.add('visible');
    } else {
      splitVisual.classList.remove('visible');
    }
  }

  // ── Main update ───────────────────────────────────────────────
  function update() {
    const bRes = validateBill(billInput.value);
    const tRes = validateTip(activePreset, customTip.value);
    const pRes = validatePeople(peopleInput.value);

    // Show errors only for fields with actual user input (not blank-on-load)
    const bTouched = billInput.value.trim() !== '';
    const tTouched = customTip.value.trim() !== '' && activePreset === null;
    const pTouched = peopleInput.value.trim() !== '';

    const bErr = bTouched && !bRes.valid ? bRes.error : '';
    const tErr = tTouched && !tRes.valid ? tRes.error : '';
    const pErr = pTouched && !pRes.valid ? pRes.error : '';

    billError.textContent   = bErr;
    tipError.textContent    = tErr;
    peopleError.textContent = pErr;

    setError(document.getElementById('bill-wrap'),  bErr);
    setError(document.getElementById('people-wrap'), pErr);

    if (bRes.valid && tRes.valid && pRes.valid) {
      const { tip, total, per } = calculate(bRes.value, tRes.value, pRes.value);
      setOutputs(tip, total, per, bRes.value);
    } else {
      setOutputs(null, null, null, null);
    }
  }

  // ── Preset button logic ───────────────────────────────────────
  function activatePreset(btn) {
    tipBtns.forEach(b => {
      b.classList.remove('is-active');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('is-active');
    btn.setAttribute('aria-pressed', 'true');
    activePreset = btn.dataset.tip;
    customTip.value = '';
    tipError.textContent = '';
  }

  function deactivatePresets() {
    tipBtns.forEach(b => {
      b.classList.remove('is-active');
      b.setAttribute('aria-pressed', 'false');
    });
    activePreset = null;
  }

  // ── Reset ─────────────────────────────────────────────────────
  function reset() {
    billInput.value    = '';
    customTip.value    = '';
    peopleInput.value  = '';

    deactivatePresets();

    billError.textContent   = '';
    tipError.textContent    = '';
    peopleError.textContent = '';

    setError(document.getElementById('bill-wrap'),   '');
    setError(document.getElementById('people-wrap'), '');

    setOutputs(null, null, null, null);
  }

  // ── Prevent scientific notation on paste ──────────────────────
  function sanitizeNumericPaste(e) {
    const pasted = (e.clipboardData || window.clipboardData).getData('text');
    if (/[^\d.\-]/.test(pasted) || /e/i.test(pasted)) {
      e.preventDefault();
    }
  }

  // ── Prevent Enter from submitting / reloading ─────────────────
  function blockEnter(e) {
    if (e.key === 'Enter') e.preventDefault();
  }

  // ── Event Listeners ───────────────────────────────────────────
  billInput.addEventListener('input',  update);
  billInput.addEventListener('paste',  sanitizeNumericPaste);
  billInput.addEventListener('keydown', blockEnter);

  customTip.addEventListener('input', function () {
    deactivatePresets();
    update();
  });
  customTip.addEventListener('paste',  sanitizeNumericPaste);
  customTip.addEventListener('keydown', blockEnter);

  peopleInput.addEventListener('input', function () {
    // Reject decimal point as you type
    if (this.value.includes('.')) {
      this.value = this.value.replace('.', '');
    }
    update();
  });
  peopleInput.addEventListener('paste', sanitizeNumericPaste);
  peopleInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); return; }
    // Block decimal point key
    if (e.key === '.') e.preventDefault();
  });

  tipBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      activatePreset(this);
      update();
    });
  });

  resetBtn.addEventListener('click', reset);

  // ── Init ──────────────────────────────────────────────────────
  reset();
})();

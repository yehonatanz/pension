function totalFees({
  percentageOfDeposit,
  percentageOfAccumulation,
  currentAge,
  retirementAge,
  monthlyDeposit,
  currentAcc,
  yearlyGrowthPercentage,
}) {
  const yearlyGrowthRate = 1 + yearlyGrowthPercentage / 100;
  const depositRate = percentageOfDeposit / 100;
  const accRate = percentageOfAccumulation / 100;
  let accWithoutFees = currentAcc;
  let accWithFees = currentAcc;
  const yearlyDeposit = monthlyDeposit * 12;
  const perYear = [];
  let totalFees = 0;

  for (let age = currentAge + 1; age <= retirementAge; age++) {
    accWithoutFees = accWithoutFees * yearlyGrowthRate + yearlyDeposit;
    const fees = accWithFees * accRate + yearlyDeposit * depositRate;
    accWithFees = accWithFees * yearlyGrowthRate + yearlyDeposit - fees;
    totalFees += fees;
    perYear.push({
      age,
      acc: accWithFees,
      fees,
    });
  }
  const loss = accWithoutFees - accWithFees;
  return {
    accWithFees,
    accWithoutFees,
    fees: totalFees,
    loss,
    relativeLoss: loss / accWithoutFees,
    perYear,
  };
}

function roundFraction(num, digits) {
  const factor = 10 ** digits;
  return (Math.round(num * factor) / factor)
    .toFixed(digits)
    .replace(/\.0+$/, '');
}

function formatSum(sum) {
  if (sum > 1_000_000) {
    return `₪${roundFraction(sum / 1_000_000, 1)}M`;
  }
  if (sum > 1_000) {
    return `₪${roundFraction(sum / 1_000, 1)}K`;
  }
  return `₪${roundFraction(sum, 1)}`;
}

function formatPercentage(percentage) {
  return `${roundFraction(percentage * 100, 1)}%`;
}

function displayResults({
  accWithoutFees,
  accWithFees,
  loss,
  relativeLoss,
  perYear,
}) {
  document.getElementById('output-total').textContent = formatSum(accWithFees);
  document.getElementById('output-total-without-fees').textContent =
    formatSum(accWithoutFees);
  document.getElementById('output-loss').textContent = formatSum(loss);
  document.getElementById('output-relative-loss').textContent =
    formatPercentage(relativeLoss);
  const perYearOutput = document.getElementById('per-year-output');
  perYearOutput.innerHTML = '';
  for (const year of perYear) {
    const row = document.createElement('tr');
    for (const [key, value] of Object.entries(year)) {
      const td = document.createElement('td');
      td.textContent = key === 'age' ? value : formatSum(value);
      td.className = key;
      row.appendChild(td);
    }
    perYearOutput.appendChild(row);
  }
}

function getInputsState() {
  const inputs = {};
  for (const input of document.querySelectorAll('input')) {
    if (!input.value) {
      return null;
    }
    inputs[input.id] =
      input.type === 'number' ? Number.parseFloat(input.value) : input.value;
  }
  return inputs;
}

function recalculate() {
  const inputs = getInputsState();
  if (!inputs) {
    return;
  }
  displayResults(totalFees(inputs));
}

function onChange(event) {
  const url = new URL(window.location);
  url.searchParams.set(event.target.id, event.target.value);
  history.pushState(null, '', url);
  recalculate();
  renderSavedOffers(savedOffers);
}

function persistSavedOffers(savedOffers) {
  localStorage.setItem('savedOffers', JSON.stringify(savedOffers));
}

function loadSavedOffers() {
  return JSON.parse(localStorage.getItem('savedOffers')) || [];
}

const savedOffers = loadSavedOffers();

function saveOffer() {
  const inputs = getInputsState();
  if (!inputs) {
    return;
  }
  const fees = {
    percentageOfAccumulation: inputs.percentageOfAccumulation,
    percentageOfDeposit: inputs.percentageOfDeposit,
  };
  if (
    savedOffers.some(
      (offer) => JSON.stringify(offer.fees) === JSON.stringify(fees),
    )
  ) {
    return;
  }
  savedOffers.push({
    name: `הצעה #${savedOffers.length + 1}`,
    fees,
  });
  persistSavedOffers(savedOffers);
  renderSavedOffers(savedOffers);
}

function createTr(fields) {
  const tr = document.createElement('tr');
  for (const [key, value] of Object.entries(fields)) {
    const td = document.createElement('td');
    td.className = key;
    td.textContent = value;
    tr.appendChild(td);
  }
  return tr;
}

function renderSavedOffers(savedOffers) {
  const table = document.getElementById('saved-offers-container');
  if (!savedOffers.length) {
    table.hidden = true;
    return;
  }
  table.hidden = false;
  const tbody = document.getElementById('saved-offers');
  tbody.innerHTML = '';
  const inputs = getInputsState();
  const offersAndResults = savedOffers.map((offer) => ({
    offer,
    results: inputs && totalFees({ ...inputs, ...offer.fees }),
  }));
  const minLoss = Math.min(
    ...offersAndResults.map(({ results }) => results?.loss),
  );
  tbody.append(
    ...offersAndResults.map(({ offer, results }, index) => {
      const tr = createTr({
        name: offer.name,
        deposit: `${offer.fees.percentageOfDeposit}%`,
        accumulation: `${offer.fees.percentageOfAccumulation}%`,
        loss: results ? formatSum(results.loss) : '',
        relativeLoss: results ? formatPercentage(results.relativeLoss) : '',
      });
      const tdName = tr.children[0];
      const renameOrDelete = () => {
        const newName = prompt(
          'שם חדש להצעה (ריק כדי למחוק)',
          tdName.textContent,
        );
        if (newName === null) {
          return;
        }
        if (newName) {
          tdName.textContent = newName;
          offer.name = newName;
        } else {
          tr.remove();
          savedOffers.splice(index, 1);
        }
        renderSavedOffers(savedOffers);
        persistSavedOffers(savedOffers);
      };
      tr.addEventListener('dblclick', renameOrDelete);
      onLongPress(tr, renameOrDelete);
      if (results && results.loss === minLoss) {
        tr.classList.add('best');
      }
      return tr;
    }),
  );
}
function onLongPress(element, callback) {
  let timer;

  element.addEventListener('touchstart', () => {
    timer = setTimeout(() => {
      timer = null;
      callback();
    }, 500);
  });

  function cancel() {
    clearTimeout(timer);
  }

  element.addEventListener('touchend', cancel);
  element.addEventListener('touchmove', cancel);
}

function init() {
  const searchParams = new URLSearchParams(document.location.search);
  for (const input of document.querySelectorAll('input')) {
    input.addEventListener('change', onChange);
    input.addEventListener('keyup', onChange);
    if (searchParams.has(input.id)) {
      input.value = searchParams.get(input.id);
    }
  }
  recalculate();
  renderSavedOffers(savedOffers);
}

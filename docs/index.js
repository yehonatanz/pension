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
}

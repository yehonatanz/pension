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

  for (let age = currentAge; age < retirementAge; age++) {
    accWithoutFees = accWithoutFees * yearlyGrowthRate + yearlyDeposit;
    const fees = accWithFees * accRate + yearlyDeposit * depositRate;
    accWithFees = accWithFees * yearlyGrowthRate + yearlyDeposit - fees;
    perYear.push({
      age,
      acc: accWithFees,
      fees,
    });
  }
  const fees = accWithoutFees - accWithFees;
  return {
    accWithFees,
    accWithoutFees,
    fees,
    relativeFess: fees / accWithoutFees,
    perYear,
  };
}

function formatSum(sum) {
  return `${(sum / 1000).toFixed(1)}K`;
}

function recalculate() {
  const params = Object.fromEntries(
    [...document.querySelectorAll('input').values()].map((input) => [
      input.id,
      input.value,
    ]),
  );
  if (Object.values(params).some((value) => !value)) {
    return;
  }
  const output = document.getElementById('output-total-sum');
  const { fees, perYear } = totalFees(params);
  output.textContent = formatSum(fees);
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


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

  for (let age = currentAge; age < retirementAge; age++) {
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
  return {
    accWithFees,
    accWithoutFees,
    fees: totalFees,
    relativeFess: totalFees / accWithoutFees,
    perYear,
  };
}

function roundFraction(num, digits) {
    const factor = 10 ** digits;
    return (Math.round(num * factor) / factor).toFixed(digits);
}

function formatSum(sum) {
  if (sum > 1_000_000) {
    return `₪${roundFraction(sum / 1_000_000, 1)}M`;
  } else if (sum > 1_000) {
    return `₪${roundFraction(sum / 1_000, 1)}K`;
  } else {
    return `₪${roundFraction(sum, 1)}`;
  }
}

function displayResults({ fees, accWithoutFees, relativeFess, perYear }) {
  document.getElementById('output-total-fees').textContent = formatSum(fees);
  document.getElementById('output-total-fees-percentage').textContent =
    `${roundFraction(relativeFess * 100, 1)}%`;
  document.getElementById('output-total-without-fees').textContent = formatSum(accWithoutFees);
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
  displayResults(totalFees(params));
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
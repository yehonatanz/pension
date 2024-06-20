function totalFees({
	percentageOfDeposit,
	percentageOfAccumulation,
	retirementAge,
	monthlyDeposit,
	currentAcc,
	yearlyGrowthPercentage,
}) {
	const yearlyGrowthRate = 1 + yearlyGrowthPercentage / 100;
	const depositRate = 1 - percentageOfDeposit / 100;
	const accRate = 1 - percentageOfAccumulation / 100;
	let accWithoutFees = currentAcc;
	let accWithFees = currentAcc;
	const yearlyDeposit = monthlyDeposit * 12;

	for (let i = 29; i < retirementAge; i++) {
		accWithoutFees = accWithoutFees * yearlyGrowthRate + yearlyDeposit;
		accWithFees =
			accWithFees * yearlyGrowthRate * accRate + yearlyDeposit * depositRate;
	}
	const fees = accWithoutFees - accWithFees;
	return {
		accWithFees,
		accWithoutFees,
		fees,
		relativeFess: fees / accWithoutFees,
	};
}

function recalculate() {
	const params = Object.fromEntries(
		[...document.querySelectorAll("input").values()].map((input) => [
			input.id,
			input.value,
		]),
	);
	if (Object.values(params).some((value) => !value)) {
		return;
	}
	const output = document.getElementById("output");
	output.textContent = `${Math.floor(totalFees(params).fees / 1000)}K`;
}

function onChange(event) {
	const url = new URL(window.location);
	url.searchParams.set(event.target.id, event.target.value);
	history.pushState(null, "", url);
	recalculate();
}

function init() {
	const searchParams = new URLSearchParams(document.location.search);
	document.querySelectorAll("input").forEach((input) => {
		input.addEventListener("change", onChange);
		input.addEventListener("keyup", onChange);
		if (searchParams.has(input.id)) {
			input.value = searchParams.get(input.id);
		}
	});
	recalculate();
}

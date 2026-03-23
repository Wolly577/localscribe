document.addEventListener("DOMContentLoaded", () => {
    const monthsSlider = document.getElementById("monthsSlider");
    const monthsLabel = document.getElementById("monthsLabel");
    const cloudCostElement = document.getElementById("cloudCost");
    const savingsResult = document.getElementById("savingsResult");

    const cloudMonthlyCost = 20; // EUR per month for comparison
    const localScribeCost = 39;  // one-time fee

    const isEn = document.documentElement.lang === 'en';

    function monthLabel(n) {
        return isEn
            ? `${n} month${n !== 1 ? 's' : ''}`
            : `${n} Monat${n !== 1 ? 'e' : ''}`;
    }

    function updateCalculations() {
        if (!monthsSlider || !monthsLabel || !cloudCostElement || !savingsResult) return;

        let months = parseInt(monthsSlider.value, 10);
        if (!Number.isFinite(months) || months < 2) months = 2;
        if (months > 36) months = 36;
        monthsLabel.textContent = monthLabel(months);

        const totalCloudCost = months * cloudMonthlyCost;
        cloudCostElement.textContent = isEn ? `€${totalCloudCost}` : `${totalCloudCost} €`;

        const savings = totalCloudCost - localScribeCost;

        if (savings > 0) {
            savingsResult.textContent = isEn
                ? `You save €${savings}!`
                : `Sie sparen ${savings} €!`;
            savingsResult.style.color = 'var(--accent-color)';
        } else if (savings < 0) {
            savingsResult.textContent = isEn
                ? `Cloud is €${Math.abs(savings)} cheaper.`
                : `Cloud ist ${Math.abs(savings)} € günstiger.`;
            savingsResult.style.color = 'var(--text-secondary)';
        } else {
            savingsResult.textContent = isEn
                ? 'Costs are identical.'
                : 'Kosten sind identisch.';
            savingsResult.style.color = 'var(--text-secondary)';
        }
    }

    if (monthsSlider) {
        monthsSlider.addEventListener("input", updateCalculations);
        updateCalculations();
    }
});

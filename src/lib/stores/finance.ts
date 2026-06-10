import { writable, get } from 'svelte/store';
import { makeId, getDaysInMonth, getDayOfWeek } from '$lib/stores/general'

// roundCurrency(value: number): number
// Rounds a number to 2 decimal places to avoid floating-point precision issues
function roundCurrency(value: number): number {
    return Math.round(value * 100) / 100;
}

export const financeExpandedYears = writable<Record<string, boolean>>({});
export const financeExpandedMonths = writable<Record<string, boolean>>({});
export const financeExpandedWeeks = writable<Record<string, boolean>>({});

export interface FinanceNames {
    checking: string;
    primaryCard: string;
    secondaryCard: string;
}

export const financeNames = writable<FinanceNames>({
    checking: "HB",
    primaryCard: "Disc",
    secondaryCard: "AmeriX"
});

// Finance
export interface FinanceEntry {
    id: string;
    addAmount: string;
    subAmount: string;
    description: string;
    isHB: boolean; //Checking
    isDisc: boolean; //Primary Credit Card
    isAmerX: boolean; //Secondary Credit Card
    isGas: boolean;
    isFood: boolean;
    isOther: boolean;
}

export interface FinanceDay {
    id: string;
    dayNumber: number;
    dayOfWeek: string;
    entries: FinanceEntry[];
}

export interface FinanceWeek {
    id: string;
    weekNumber: number;
    startDay: number;
    endDay: number;
    balanceWeek: string;
    days: FinanceDay[];
}

export interface FinanceMonth {
    id: string;
    monthNumber: number;
    discAmount: string; //Primary Credit Card
    discIntAmount: string;//Primary CC Interest
    amerXAmount: string;//Secondary Credit Card
    amerXIntAmount: string;//Secondarry CC Interest
    foodAmount: string;
    gasAmount: string;
    balanceMonth: string;
    weeks: FinanceWeek[];
}

export interface FinanceYear {
    id: string;
    year: number; // 2026, 2027, etc.
    months: FinanceMonth[];
}

export const financeData = writable<FinanceYear[]>([]);

// OnMount Generate Finance structure up to a specific date
// generateFinanceStructureToDate(targetDate: Date): void
export function generateFinanceStructureToDate(targetDate: Date): void {
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth() + 1; // 1-12
    const targetDay = targetDate.getDate();

    financeData.update((years) => {
        const updatedYears = [...years];
        console.log(`In generateFinancialStructureToDate`);
        // Find or create year
        let yearEntry = updatedYears.find(y => y.year === targetYear);
        if (!yearEntry) {
            yearEntry = {
                id: makeId(),
                year: targetYear,
                months: []
            };
            updatedYears.push(yearEntry);
        }

        // Generate months up to target month
        for (let monthNum = 1; monthNum <= targetMonth; monthNum++) {
            let monthEntry = yearEntry.months.find(m => m.monthNumber === monthNum);
            if (!monthEntry) {
                // Get previous month to carry forward values
                let discAmount = '';
                let discIntAmount = '';
                let amerXAmount = '';
                let amerXIntAmount = '';

                if (monthNum > 1) {
                    const prevMonth = yearEntry.months.find(m => m.monthNumber === monthNum - 1);
                    if (prevMonth) {
                        discAmount = prevMonth.discAmount || '';
                        discIntAmount = prevMonth.discIntAmount || '';
                        amerXAmount = prevMonth.amerXAmount || '';
                        amerXIntAmount = prevMonth.amerXIntAmount || '';
                    }
                }

                monthEntry = {
                    id: makeId(),
                    monthNumber: monthNum,
                    discAmount,
                    discIntAmount,
                    amerXAmount,
                    amerXIntAmount,
                    foodAmount: '',
                    gasAmount: '',
                    balanceMonth: '',
                    weeks: []
                };
                yearEntry.months.push(monthEntry);
                yearEntry.months.sort((a, b) => a.monthNumber - b.monthNumber);
            }

            // Determine how many days to generate for this month
            const daysInMonth = getDaysInMonth(targetYear, monthNum);
            const lastDayToGenerate = monthNum === targetMonth ? targetDay : daysInMonth;

            // Generate weeks and days
            for (let dayNum = 1; dayNum <= lastDayToGenerate; dayNum++) {
                const weekNum = Math.ceil(dayNum / 7);
                const startDay = (weekNum - 1) * 7 + 1;
                const endDay = Math.min(weekNum * 7, daysInMonth);
                const balanceWeek = '';
                // Find or create week
                let weekEntry = monthEntry.weeks.find(w => w.weekNumber === weekNum);
                if (!weekEntry) {
                    weekEntry = {
                        id: makeId(),
                        weekNumber: weekNum,
                        startDay,
                        endDay,
                        balanceWeek,
                        days: []
                    };
                    monthEntry.weeks.push(weekEntry);
                    monthEntry.weeks.sort((a, b) => a.weekNumber - b.weekNumber);
                }

                // Check if day already exists
                const dayExists = weekEntry.days.find(d => d.dayNumber === dayNum);

                if (!dayExists) {
                    const dayOfWeek = getDayOfWeek(targetYear, monthNum, dayNum);
                    const dayEntry: FinanceDay = {
                        id: makeId(),
                        dayNumber: dayNum,
                        dayOfWeek,
                        entries: [{
                            id: makeId(),
                            addAmount: '',
                            subAmount: '',
                            description: '',
                            isHB: true,
                            isDisc: false,
                            isAmerX: false,
                            isGas: false,
                            isFood: false,
                            isOther: false,
                        }],
                    };

                    weekEntry.days.push(dayEntry);
                    weekEntry.days.sort((a, b) => a.dayNumber - b.dayNumber);
                }
            }
        }

        return updatedYears;
    });
}

// Add entry to a specific day
// addFinanceEntry(yearId: string, monthId: string, weekId: string, dayId: string): string
export function addFinanceEntry(
    yearId: string,
    monthId: string,
    weekId: string,
    dayId: string
): string {
    const entryId = makeId();
    financeData.update((years) =>
        years.map((y) => {
            if (y.id === yearId) {
                return {
                    ...y,
                    months: y.months.map((m) => {
                        if (m.id === monthId) {
                            return {
                                ...m,
                                weeks: m.weeks.map((w) => {
                                    if (w.id === weekId) {
                                        return {
                                            ...w,
                                            days: w.days.map((d) => {
                                                if (d.id === dayId) {
                                                    return {
                                                        ...d,
                                                        entries: [...d.entries, {
                                                            id: entryId, addAmount: '', subAmount: '', description: '',
                                                            isHB: true, isDisc: false, isAmerX: false, isGas: false, isFood: false,
                                                            isOther: false
                                                        }]
                                                    };
                                                }
                                                return d;
                                            })
                                        };
                                    }
                                    return w;
                                })
                            };
                        }
                        return m;
                    })
                };
            }
            return y;
        })
    );
    return entryId;
}

// Delete entry from a day
// deleteFinanceEntry(yearId: string, monthId: string, weekId: string, dayId: string, entryId: string): void
export function deleteFinanceEntry(
    yearId: string,
    monthId: string,
    weekId: string,
    dayId: string,
    entryId: string
): void {
    financeData.update((years) =>
        years.map((y) => {
            if (y.id === yearId) {
                return {
                    ...y,
                    months: y.months.map((m) => {
                        if (m.id === monthId) {
                            return {
                                ...m,
                                weeks: m.weeks.map((w) => {
                                    if (w.id === weekId) {
                                        return {
                                            ...w,
                                            days: w.days.map((d) => {
                                                if (d.id === dayId) {
                                                    return {
                                                        ...d,
                                                        entries: d.entries.filter(e => e.id !== entryId)
                                                    };
                                                }
                                                return d;
                                            })
                                        };
                                    }
                                    return w;
                                })
                            };
                        }
                        return m;
                    })
                };
            }
            return y;
        })
    );
}

// Update entry checkbox field
// updateFinanceEntryCheckbox(yearId: string, monthId: string, weekId: string, dayId: string, entryId: string, field: 'isHB' | 'isDisc' | 'isAmerX' | 'isGas' | 'isFood' | 'isOther', value: boolean): void
export function updateFinanceEntryCheckbox(
    yearId: string,
    monthId: string,
    weekId: string,
    dayId: string,
    entryId: string,
    field: 'isHB' | 'isDisc' | 'isAmerX' | 'isGas' | 'isFood' | 'isOther',
    value: boolean
): void {
    financeData.update((years) =>
        years.map((y) => {
            if (y.id === yearId) {
                return {
                    ...y,
                    months: y.months.map((m) => {
                        if (m.id === monthId) {
                            // Find the entry to get current values
                            let currentEntry: FinanceEntry | undefined;
                            for (const w of m.weeks) {
                                for (const d of w.days) {
                                    const found = d.entries.find(e => e.id === entryId);
                                    if (found) {
                                        currentEntry = found;
                                        break;
                                    }
                                }
                                if (currentEntry) break;
                            }

                            let discAmountAdjustment = 0;
                            let amerXAmountAdjustment = 0;
                            let foodAmountAdjustment = 0;
                            let gasAmountAdjustment = 0;

                            if (currentEntry) {
                                const subVal = parseFloat(currentEntry.subAmount) || 0;
                                const amount = Math.abs(subVal);

                                // Handle HB radio button (Home Bank - regular checking)
                                if (field === 'isHB') {
                                    if (value) {
                                        // Selecting HB - remove from credit cards if previously selected
                                        if (currentEntry.isDisc) {
                                            discAmountAdjustment = -amount;
                                            // Also subtract from Food/Gas if they were checked with Disc
                                            if (currentEntry.isFood) {
                                                foodAmountAdjustment = -amount;
                                            }
                                            if (currentEntry.isGas) {
                                                gasAmountAdjustment = -amount;
                                            }
                                        }
                                        if (currentEntry.isAmerX) {
                                            amerXAmountAdjustment = -amount;
                                            // Also subtract from Food/Gas if they were checked with AmerX
                                            if (currentEntry.isFood) {
                                                foodAmountAdjustment = -amount;
                                            }
                                            if (currentEntry.isGas) {
                                                gasAmountAdjustment = -amount;
                                            }
                                        }
                                    }
                                }

                                // Handle Disc radio button
                                if (field === 'isDisc') {
                                    if (value) {
                                        // Selecting Disc - add amount to Disc total
                                        discAmountAdjustment = amount;
                                        // If AmerX was previously selected, subtract from AmerX
                                        if (currentEntry.isAmerX) {
                                            amerXAmountAdjustment = -amount;
                                            // Also subtract from Food/Gas if they were checked with AmerX
                                            if (currentEntry.isFood) {
                                                foodAmountAdjustment = -amount;
                                            }
                                            if (currentEntry.isGas) {
                                                gasAmountAdjustment = -amount;
                                            }
                                        }
                                        // Add to Food/Gas if they are checked
                                        if (currentEntry.isFood) {
                                            foodAmountAdjustment += amount;
                                        }
                                        if (currentEntry.isGas) {
                                            gasAmountAdjustment += amount;
                                        }
                                    }
                                }

                                // Handle AmerX radio button
                                if (field === 'isAmerX') {
                                    if (value) {
                                        // Selecting AmerX - add amount to AmerX total
                                        amerXAmountAdjustment = amount;
                                        // If Disc was previously selected, subtract from Disc
                                        if (currentEntry.isDisc) {
                                            discAmountAdjustment = -amount;
                                            // Also subtract from Food/Gas if they were checked with Disc
                                            if (currentEntry.isFood) {
                                                foodAmountAdjustment = -amount;
                                            }
                                            if (currentEntry.isGas) {
                                                gasAmountAdjustment = -amount;
                                            }
                                        }
                                        // Add to Food/Gas if they are checked
                                        if (currentEntry.isFood) {
                                            foodAmountAdjustment += amount;
                                        }
                                        if (currentEntry.isGas) {
                                            gasAmountAdjustment += amount;
                                        }
                                    }
                                }

                                // Handle Food radio button
                                if (field === 'isFood') {
                                    // Only update Food amount if a credit card is checked
                                    if (currentEntry.isDisc || currentEntry.isAmerX) {
                                        if (value) {
                                            // Selecting Food - add amount to Food total
                                            foodAmountAdjustment = amount;
                                            // If Gas was previously selected, subtract from Gas
                                            if (currentEntry.isGas) {
                                                gasAmountAdjustment = -amount;
                                            }
                                        }
                                    }
                                }

                                // Handle Gas radio button
                                if (field === 'isGas') {
                                    // Only update Gas amount if a credit card is checked
                                    if (currentEntry.isDisc || currentEntry.isAmerX) {
                                        if (value) {
                                            // Selecting Gas - add amount to Gas total
                                            gasAmountAdjustment = amount;
                                            // If Food was previously selected, subtract from Food
                                            if (currentEntry.isFood) {
                                                foodAmountAdjustment = -amount;
                                            }
                                        }
                                    }
                                }

                                // Handle Other radio button (no additional amounts to track)
                                // Other is just a category marker
                            }

                            return {
                                ...m,
                                discAmount: roundCurrency((parseFloat(m.discAmount) || 0) + discAmountAdjustment).toString(),
                                amerXAmount: roundCurrency((parseFloat(m.amerXAmount) || 0) + amerXAmountAdjustment).toString(),
                                foodAmount: roundCurrency((parseFloat(m.foodAmount) || 0) + foodAmountAdjustment).toString(),
                                gasAmount: roundCurrency((parseFloat(m.gasAmount) || 0) + gasAmountAdjustment).toString(),
                                weeks: m.weeks.map((w) => {
                                    if (w.id === weekId) {
                                        return {
                                            ...w,
                                            days: w.days.map((d) => {
                                                if (d.id === dayId) {
                                                    return {
                                                        ...d,
                                                        entries: d.entries.map(e => {
                                                            if (e.id === entryId) {
                                                                // Update the field and uncheck other radio buttons in same group
                                                                const updated = { ...e, [field]: value };

                                                                // Payment method radio group (HB, Disc, AmerX)
                                                                if (field === 'isHB' && value) {
                                                                    updated.isDisc = false;
                                                                    updated.isAmerX = false;
                                                                }
                                                                if (field === 'isDisc' && value) {
                                                                    updated.isHB = false;
                                                                    updated.isAmerX = false;
                                                                }
                                                                if (field === 'isAmerX' && value) {
                                                                    updated.isHB = false;
                                                                    updated.isDisc = false;
                                                                }
                                                                // If selecting Food, uncheck Gas and Other
                                                                if (field === 'isFood' && value) {
                                                                    updated.isGas = false;
                                                                    updated.isOther = false;
                                                                }
                                                                // If selecting Gas, uncheck Food and Other
                                                                if (field === 'isGas' && value) {
                                                                    updated.isFood = false;
                                                                    updated.isOther = false;
                                                                }
                                                                // If selecting Other, uncheck Food and Gas
                                                                if (field === 'isOther' && value) {
                                                                    updated.isFood = false;
                                                                    updated.isGas = false;
                                                                }

                                                                return updated;
                                                            }
                                                            return e;
                                                        })
                                                    };
                                                }
                                                return d;
                                            })
                                        };
                                    }
                                    return w;
                                })
                            };
                        }
                        return m;
                    })
                };
            }
            return y;
        })
    );
}

// Update entry field
// updateFinanceEntry(yearId: string, monthId: string, weekId: string, dayId: string, entryId: string, field: 'addAmount' | 'subAmount' | 'description', value: string): void
export function updateFinanceEntry(
    yearId: string,
    monthId: string,
    weekId: string,
    dayId: string,
    entryId: string,
    field: 'addAmount' | 'subAmount' | 'description',
    value: string
): void {
    financeData.update((years) =>
        years.map((y) => {
            if (y.id === yearId) {
                return {
                    ...y,
                    months: y.months.map((m) => {
                        if (m.id === monthId) {
                            // Get the old entry to update amounts based on amount changes
                            let getFinanceEntry: FinanceEntry | undefined;
                            let discAmountAdjustment = 0;
                            let amerXAmountAdjustment = 0;
                            let foodAmountAdjustment = 0;
                            let gasAmountAdjustment = 0;

                            // Find old entry
                            for (const w of m.weeks) {
                                for (const d of w.days) {
                                    const found = d.entries.find(e => e.id === entryId);
                                    if (found) {
                                        getFinanceEntry = found;
                                        break;
                                    }
                                }
                                if (getFinanceEntry) break;
                            }

                            // Recalculate amounts if addAmount or subAmount field is being updated
                            if (getFinanceEntry) {
                                if (field === 'subAmount') {
                                    console.log("IN SUBAMOUNT and value is " + value);

                                    //parseFloat turns string into decimal number
                                    const oldSubVal = parseFloat(getFinanceEntry.subAmount) || 0;
                                    const newSubVal = parseFloat(value) || 0;
                                    //returns only positive. If -50 will return 50
                                    const oldAmount = Math.abs(oldSubVal);
                                    const newAmount = Math.abs(newSubVal);
                                    const amountDiff = newAmount - oldAmount;

                                    // Update Disc amount if Disc is checked
                                    if (getFinanceEntry.isDisc) {
                                        discAmountAdjustment = -Math.abs(amountDiff);
                                    }
                                    // Update AmerX amount if AmerX is checked
                                    if (getFinanceEntry.isAmerX) {
                                        amerXAmountAdjustment = -Math.abs(amountDiff);
                                    }
                                }

                                // Handle addAmount changes (paying off credit card)
                                if (field === 'addAmount') {
                                    const oldAddVal = parseFloat(getFinanceEntry.addAmount) || 0;
                                    const newAddVal = parseFloat(value) || 0;
                                    const amountDiff = newAddVal - oldAddVal;

                                    // Add to Disc amount if Disc is checked
                                    if (getFinanceEntry.isDisc) {
                                        discAmountAdjustment = amountDiff;
                                        if (getFinanceEntry.isFood) {
                                            foodAmountAdjustment = amountDiff;
                                        }
                                        if (getFinanceEntry.isGas) {
                                            gasAmountAdjustment = amountDiff;
                                        }
                                    }

                                    // Add to AmerX amount if AmerX is checked
                                    if (getFinanceEntry.isAmerX) {
                                        amerXAmountAdjustment = amountDiff;
                                    }
                                }
                                console.log("in RETURN and discAmountAdjusment is " + discAmountAdjustment + "and gas amount is " + m.gasAmount);
                            }

                            return {
                                ...m,
                                discAmount: roundCurrency((parseFloat(m.discAmount) || 0) + discAmountAdjustment).toString(),
                                amerXAmount: roundCurrency((parseFloat(m.amerXAmount) || 0) + amerXAmountAdjustment).toString(),
                                foodAmount: roundCurrency((parseFloat(m.foodAmount) || 0) + foodAmountAdjustment).toString(),
                                gasAmount: roundCurrency((parseFloat(m.gasAmount) || 0) + gasAmountAdjustment).toString(),
                                weeks: m.weeks.map((w) => {

                                    if (w.id === weekId) { //The specific week in
                                        return {
                                            ...w,
                                            days: w.days.map((d) => {
                                                if (d.id === dayId) {
                                                    return {
                                                        ...d,
                                                        entries: d.entries.map(e => e.id === entryId ? { ...e, [field]: value } : e)
                                                    };
                                                }
                                                return d;
                                            })
                                        };
                                    }
                                    return w;
                                })
                            };
                        }
                        return m;
                    })
                };
            }
            return y;
        })
    );
}

// Calculate day total (sum of adds - sum of subs)
// calculateDayTotal(day: FinanceDay): number
export function calculateDayTotal(day: FinanceDay): number {
    let total = 0;
    if (day.entries) {
        for (const entry of day.entries) {
            const addVal = parseFloat(entry.addAmount) || 0;
            const subVal = parseFloat(entry.subAmount) || 0;
            total += addVal - subVal;
        }
    }
    return total;
}

// Calculate week total (only HB entries - net change for the week)
// calculateWeekTotal(week: FinanceWeek): number
export function calculateWeekTotal(week: FinanceWeek): number {
    let total = 0;
    if (week.days) {
        for (const day of week.days) {
            if (day.entries) {
                for (const entry of day.entries) {
                    // Only count HB (Home Bank) entries
                    if (entry.isHB) {
                        const addVal = parseFloat(entry.addAmount) || 0;
                        const subVal = parseFloat(entry.subAmount) || 0;
                        total += addVal - subVal;
                    }
                }
            }
        }
    }
    return total;
}

//Accesses the Month Food total by FinanceMonth
export function calculateMonthFoodTotal(month: FinanceMonth): number {
    let total = 0;
    if (month.weeks) {
        for (const week of month.weeks) {
            if (week.days) {
                for (const day of week.days) {
                    if (day.entries) {
                        for (const entry of day.entries) {
                            if (entry.isFood) {
                                const subVal = parseFloat(entry.subAmount) || 0;
                                const addVal = parseFloat(entry.addAmount) || 0;
                                if (entry.isDisc || entry.isAmerX) {
                                    total += Math.abs(addVal);
                                } else {
                                    total += subVal;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return total;
}

//Accesses the Month Gas total by FinanceMonth
export function calculateMonthGasTotal(month: FinanceMonth): number {
    let total = 0;
    if (month.weeks) {
        for (const week of month.weeks) {
            if (week.days) {
                for (const day of week.days) {
                    if (day.entries) {
                        for (const entry of day.entries) {
                            if (entry.isGas) {
                                const subVal = parseFloat(entry.subAmount) || 0;
                                const addVal = parseFloat(entry.addAmount) || 0;
                                // If it's a card purchase (Disc/AmerX), use subAmount as positive; otherwise use subAmount as-is
                                if (entry.isDisc || entry.isAmerX) {
                                    total += addVal;
                                } else {
                                    total += subVal;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return total;
}

// Calculate month total (excluding Disc and AmerX entries unless they also have Food/Gas)
// calculateMonthTotal(month: FinanceMonth): number
export function calculateMonthTotal(month: FinanceMonth): number {
    let total = 0;
    if (month.weeks) {
        for (const week of month.weeks) {
            if (week.days) {
                for (const day of week.days) {
                    if (day.entries) {
                        for (const entry of day.entries) {
                            // Only exclude from total if Disc/AmerX is checked and does NOT have Food/Gas
                            if ((entry.isDisc || entry.isAmerX) && !entry.isFood && !entry.isGas) {
                                // Skip this entry - it's a pure Disc or AmerX entry
                                continue;
                            }

                            const addVal = parseFloat(entry.addAmount) || 0;
                            const subVal = parseFloat(entry.subAmount) || 0;
                            total += addVal - subVal;
                        }
                    }
                }
            }
        }
    }
    return total;
}

// Calculate HB balance for a month (starting balance from balanceMonth + this month's HB transactions)
// calculateMonthHBBalance(year: FinanceYear, month: FinanceMonth): number
export function calculateMonthHBBalance(year: FinanceYear, month: FinanceMonth): number {
    //This fwd's the balance to the next month. 
    const startingBalance = parseFloat(month.balanceMonth) || 0;
    let initBalance = "";

    if (startingBalance === 0 && month.monthNumber === 1
        && isPriorYearPresent(year)) {
        //get prior year, 12th month balance and set it to 
        //year-month monthBalance
        //return
        const priorMonth = get(financeData).find(y =>
            y.year === year.year - 1)?.months.find(m => m.monthNumber === 12);
        if (priorMonth?.balanceMonth) {
            initBalance = priorMonth?.balanceMonth;
            return parseFloat(initBalance);
        }
    } else if (startingBalance === 0 && month.monthNumber != 1) {
        const priorMonth = get(financeData).find(y =>
            y.year === year.year)?.months.find(m => m.monthNumber === month.monthNumber - 1);
        if (priorMonth?.balanceMonth) {
            initBalance = priorMonth?.balanceMonth;
            return parseFloat(initBalance);
        }
    }


    // Calculate this month's HB transactions
    let monthHBTotal = 0;
    if (month.weeks) {
        for (const week of month.weeks) {
            monthHBTotal += calculateWeekTotal(week); // Week total already only counts HB
        }
    }

    return startingBalance + monthHBTotal;
}

// Calculate year total (returns the latest month's HB balance)
// calculateYearTotal(year: FinanceYear): number
export function calculateYearTotal(year: FinanceYear): number {
    if (year.months && year.months.length > 0) {
        const lastMonth = year.months[year.months.length - 1];
        return calculateMonthHBBalance(year, lastMonth);
    }
    return 0;
}

// Format amount as currency
// formatCurrency(amount: number): string
export function formatCurrency(amount: number): string {
    const sign = amount >= 0 ? '' : '-';
    const abs = Math.abs(amount);
    return `${sign}$${abs.toFixed(2)}`;
}

// Update month Disc, AmerX, or balance amount
// updateFinanceMonthAmount(yearId: string, monthId: string, field: 'discAmount' | 'discIntAmount' | 'amerXAmount' | 'amerXIntAmount' | 'balanceMonth', value: string): void
export function updateFinanceMonthAmount(
    yearId: string,
    monthId: string,
    field: 'discAmount' | 'discIntAmount' | 'amerXAmount' | 'amerXIntAmount' | 'balanceMonth',
    value: string
): void {
    console.log("***********************");
    financeData.update((years) =>
        years.map((y) => {
            if (y.id === yearId) {
                return {
                    ...y,
                    months: y.months.map((m) => {
                        if (m.id === monthId) {
                            return { ...m, [field]: value };
                        }
                        return m;
                    })
                };
            }
            return y;
        })
    );
}

export function getFinanceMonthFin(financeData: FinanceYear[], financeYear: number, financeMonth: number): FinanceMonth | undefined {
    return financeData
        .find(y => y.year === financeYear)
        ?.months.find(m => m.monthNumber === financeMonth);

}

export function getFinanceYearFin(financeData: FinanceYear[], financeYear: number): FinanceYear | undefined {
    return financeData
        .find(y => y.year === financeYear)
}

//Access the FoodGasOther total in financeData through financeData and year-month number - for MonthSliderStatus
export function calculateFoodGasOtherTotal(financeYears: FinanceYear[], financeYear: number, financeMonth: number): string {
    const foundMonth = financeYears
        .find(y => y.year === financeYear)
        ?.months.find(m => m.monthNumber === financeMonth);

    if (!foundMonth) {
        return "";
    }

    let total = 0;
    if (foundMonth.weeks) {
        for (const week of foundMonth.weeks) {
            if (week.days) {
                for (const day of week.days) {
                    if (day.entries) {
                        for (const entry of day.entries) {
                            const addVal = parseFloat(entry.addAmount) || 0;
                            const subVal = parseFloat(entry.subAmount) || 0;
                            if (entry.isDisc || entry.isAmerX) {
                                if (entry.isFood || entry.isGas || entry.isOther) {
                                    total += addVal;
                                    console.log(`entryId is ${entry.id} and description is ${entry.description} and amount is ${entry.addAmount}`);
                                }
                            } else {
                                total += Math.abs(subVal);
                                console.log(`entryId is ${entry.id} and description is ${entry.description} and amount is ${entry.subAmount}`);
                            }
                        }
                    }
                }
            }
        }
    }
    let rettotal = total.toFixed(2);
    console.log(`in expenses total in month ${rettotal}`);
    return rettotal;
}

export function calculateFoodTotal(financeYears: FinanceYear[], financeYear: number, financeMonth: number): string {
    const foundMonth = financeYears
        .find(y => y.year === financeYear)
        ?.months.find(m => m.monthNumber === financeMonth);

    if (!foundMonth) {
        return "";
    }

    let foodTotal = 0;
    if (foundMonth.weeks) {
        for (const week of foundMonth.weeks) {
            if (week.days) {
                for (const day of week.days) {
                    if (day.entries) {
                        for (const entry of day.entries) {
                            const addVal = parseFloat(entry.addAmount) || 0;
                            const subVal = parseFloat(entry.subAmount) || 0;
                            if (entry.isFood) {
                                if (entry.isDisc || entry.isAmerX) {
                                    foodTotal += addVal;
                                    console.log(`entryId is ${entry.id} and description is ${entry.description} and amount is ${entry.addAmount}`);
                                } else {
                                    foodTotal += Math.abs(subVal);
                                    console.log(`entryId is ${entry.id} and description is ${entry.description} and amount is ${entry.subAmount}`);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    let rettotal = String(Math.round(foodTotal));
    return rettotal;
}

export function calculateGasTotal(financeYears: FinanceYear[], financeYear: number, financeMonth: number): string {
    const foundMonth = financeYears
        .find(y => y.year === financeYear)
        ?.months.find(m => m.monthNumber === financeMonth);

    if (!foundMonth) {
        return "";
    }

    let gasTotal = 0;
    if (foundMonth.weeks) {
        for (const week of foundMonth.weeks) {
            if (week.days) {
                for (const day of week.days) {
                    if (day.entries) {
                        for (const entry of day.entries) {
                            const addVal = parseFloat(entry.addAmount) || 0;
                            const subVal = parseFloat(entry.subAmount) || 0;
                            if (entry.isGas) {
                                if (entry.isDisc || entry.isAmerX) {
                                    gasTotal += addVal;
                                    console.log(`entryId is ${entry.id} and description is ${entry.description} and amount is ${entry.addAmount}`);
                                } else {
                                    gasTotal += Math.abs(subVal);
                                    console.log(`entryId is ${entry.id} and description is ${entry.description} and amount is ${entry.subAmount}`);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    let rettotal = String(Math.round(gasTotal));
    return rettotal;
}

export function calculateOtherTotal(financeYears: FinanceYear[], financeYear: number, financeMonth: number): string {
    const foundMonth = financeYears
        .find(y => y.year === financeYear)
        ?.months.find(m => m.monthNumber === financeMonth);

    if (!foundMonth) {
        return "";
    }

    let otherTotal = 0;
    if (foundMonth.weeks) {
        for (const week of foundMonth.weeks) {
            if (week.days) {
                for (const day of week.days) {
                    if (day.entries) {
                        for (const entry of day.entries) {
                            const addVal = parseFloat(entry.addAmount) || 0;
                            const subVal = parseFloat(entry.subAmount) || 0;
                            if (entry.isOther) {
                                if ((entry.isDisc || entry.isAmerX) && entry.description.includes('@')) {
                                    otherTotal += addVal;
                                    console.log(`entryId is ${entry.id} and description is ${entry.description} and amount is ${entry.addAmount}`);
                                } else if (entry.description.includes('@')) {
                                    otherTotal += Math.abs(subVal);
                                    console.log(`entryId is ${entry.id} and description is ${entry.description} and amount is ${entry.subAmount}`);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    let rettotal = String(Math.round(otherTotal));
    return rettotal;
}

export function isPriorYearPresent(year: FinanceYear): boolean {
    return get(financeData).some(y => y.year === year.year - 1);
}
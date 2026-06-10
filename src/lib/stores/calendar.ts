//There is expenses functionality to look at in finance.ts

import { get, writable } from 'svelte/store';
import { makeId, getDaysInMonth } from '$lib/stores/general';

export interface miscExpenses {
    id: string;
    name: string;
    cost: string;
}

export interface CalendarFinanceDayEntry {
    id: string;
    name: string;
    amount: string;
    datePaid: string;
    dateDue: string;
    isPaycheck: boolean;
    note: string;
}

export interface CalendarDay {
    id: string;
    dayNumber: number;
    calEntries: CalendarFinanceDayEntry[];
}

export interface CalendarMonth {
    id: string;
    monthNumber: number;
    projectedEarnings: string;
    projectedExpenses?: string;
    monthBalLimit: string;
    monthSpent: string;
    foodLimit: string;
    gasLimit: string;
    otherLimit: string;

    days: CalendarDay[];
}

export interface CalendarYear {
    id: string;
    yearNumber: number;
    months: CalendarMonth[];
}

export const calendarData = writable<CalendarYear[]>([]);

export function generateCalendarStructureToDate(targetDate: Date): void {
    //Getting year of
    const targetYear = targetDate.getFullYear();
    //record is providing number of months in a year and number of days in each month
    const record: Record<number, number> = createMonthDaysMap(targetYear);

    calendarData.update((years) => {
        let yearEntry = years.find(y => y.yearNumber === targetYear);

        if (!yearEntry) {
            yearEntry = {
                id: makeId(),
                yearNumber: targetYear,
                months: []
            };
            years.push(yearEntry);
        }

        for (let monthNum = 1; monthNum <= 12; monthNum++) {

            // ✅ Create month ONLY if missing
            if (!yearEntry.months[monthNum - 1]) {
                yearEntry.months[monthNum - 1] = {
                    id: makeId(),
                    monthNumber: monthNum,
                    projectedEarnings: "",
                    monthBalLimit: "",
                    monthSpent: "",
                    foodLimit: "",
                    gasLimit: "",
                    otherLimit: "",
                    days: [],
                };
            }

            const month = yearEntry.months[monthNum - 1];

            // ✅ DO NOT reset id every time
            if (!month.id) month.id = makeId();
            month.monthNumber = monthNum;

            const numDays = record[monthNum];

            month.days = Array.from({ length: numDays }, (_, i) => {
                const existing = month.days?.[i];
            console.log(`Existing month.days?.[] is ${existing}`);
                return existing?.id
                    ? existing
                    : {
                        id: makeId(),
                        dayNumber: i + 1,
                        calEntries: []
                    };
            });

        }

        return years
    });
}

export function addOrUpdateFinancial(
    payType: string,
    name: string,
    amount: string,
    datePaid: string | "",
    day: number,
    month: number,
    year: number,
    note: string,
    entry: CalendarFinanceDayEntry
): void {
    console.log("addOrUpdateFinancial", { payType, name, amount, datePaid, day, month, year, note, entry });
    console.log(`In addOrUpdateFinancial and entry.id is ${entry.id}`);
    const entryId = entry?.id || makeId();
    console.log(`after - entry?.id || makeId(); entryId is ${entryId}`);
    
    calendarData.update((years) => {
        const updatedYears = years.map((y) =>
            y.yearNumber !== year
                ? y
                : {
                    ...y,
                    months: y.months.map((m) =>
                        m.monthNumber !== month
                            ? m
                            : {
                                ...m,
                                days: m.days.map((d) =>
                                    d.dayNumber !== day
                                        ? d
                                        : {
                                            ...d,
                                            calEntries:
                                                entry?.id && entry.id !== ""
                                                    ? d.calEntries.map((e) =>
                                                        e.id === entry.id
                                                            ? {
                                                                ...e,
                                                                name,
                                                                amount,
                                                                isPaycheck: payType !== "expense",
                                                                dateDue: String(day),
                                                                datePaid,
                                                                note,
                                                            }
                                                            : e
                                                    )
                                                    : [
                                                        ...d.calEntries,
                                                        {
                                                            id: entryId,
                                                            name,
                                                            amount,
                                                            datePaid: "",
                                                            dateDue: String(day),
                                                            isPaycheck: payType !== "expense",
                                                            note,
                                                        }
                                                    ]
                                        }
                                )
                            }
                    )
                }
        );

        return updatedYears;
    });
}

export function removeFinancialEntry(
    entry: CalendarFinanceDayEntry,
    day: number,
    month: number,
    year: number
): void {
    const entryId: string = entry?.id;
    console.log(`In removeFinanceEntry and entryId is ${entryId}`);
    console.log(`In removeFinanceEntry and month is ${month}`);
    console.log(`In removeFinanceEntry and year is ${year}`);
    calendarData.update((years) => {
        const removeFinEntry = years.map((y) => {
            return y.yearNumber !== year
                ? y
                : {
                    ...y,
                    months: y.months.map((m) =>
                        m.monthNumber !== month
                            ? m
                            : {
                                ...m,
                                days: m.days.map((d) =>
                                    d.dayNumber !== day
                                        ? d
                                        : {
                                            ...d,
                                            calEntries: d.calEntries.filter(
                                                (entry) => entry.id !== entryId
                                            )
                                        }
                                )
                            }
                    )
                }
        });
        return removeFinEntry;
    });
}

export function createMonthDaysMap(year: number): Record<number, number> {
    const monthDays: Record<number, number> = {};

    for (let month = 1; month <= 12; month++) {
        monthDays[month] = getDaysInMonth(year, month);
    }

    return monthDays;
}

// getDaysInMonthCal(data: CalendarYear[], month: number, year: number): CalendarMonth | undefined
export function getDaysInMonthCal(data: CalendarYear[], month: number, year: number): CalendarMonth | undefined {
    const yearEntry = data.find((y) => y.yearNumber === year);

    if (!yearEntry) { console.log("undefined"); return undefined; }

    const monthEntry = yearEntry.months.find((m) => m.monthNumber === month);
    return monthEntry;
}
// Not good. Neets to have an argument that inputs the year that is active on the tabs.
export function getFinanceYearCal(calYears: CalendarYear[], calYear: CalendarYear): CalendarYear | undefined {
    return calYears
        .find(y => y.yearNumber === calYear.yearNumber)

}
// Not good. Neets to have an argument that inputs the year that is active on the tabs.
export function getFinanceMonthCal(calYears: CalendarYear[], calYear: number, calMonth: number): CalendarMonth | undefined {
    return calYears
        .find(y => y.yearNumber === calYear)
        ?.months.find(m => m.monthNumber === calMonth);
}
////Is triggered by getMonthStatus in clicking Go button
// setCalMonthLimits(calYear: number, calMonth: number, incomeLimit: string, foodLimit: string, gasLimit: string): void
export function setCalMonthLimits(calYear: number,
    calMonth: number, projectedEarnings: string, projectedExpenses:string, incomeLimit: string,
    foodLimit: string, gasLimit: string, otherLimit: string): void {
    console.log("In setCalMonthIncomeLimit");
    console.log(`Cal Year is ${calYear} and Cal Month is ${calMonth} and incomeLimit is ${incomeLimit} and foodLimit is ${foodLimit}`)
    calendarData.update((years) =>
        years.map((y) =>
            y.yearNumber !== calYear
                ? y
                : {
                    ...y,
                    months: y.months.map((m) =>
                        m.monthNumber !== calMonth
                            ? m
                            : {
                                ...m,
                                projectedEarnings,
                                projectedExpenses,
                                monthBalLimit: incomeLimit,
                                foodLimit,
                                gasLimit,
                                otherLimit,
                            }
                    )
                }
        )
    );
}

export function getMonthExpensesSpent(years: CalendarYear[],
    year: number, month: number): number {
    const foundMonth = years
        .find(y => y.yearNumber === year)
        ?.months.find(m => m.monthNumber === month);

    if (!foundMonth) return 0;

    return foundMonth.days.reduce((monthTotal, day) => {
        const dayTotal = day.calEntries.reduce((entryTotal, entry) => {
            if (!entry.name || entry.name.trim() === "") return entryTotal;

            const amount = Number(entry.amount) || 0;

            return entryTotal + amount;
        }, 0);
        console.log(`Month Expense total is ${monthTotal + dayTotal}`)
        return monthTotal + dayTotal;
    }, 0);
}




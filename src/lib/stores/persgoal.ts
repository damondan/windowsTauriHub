import { writable, get } from 'svelte/store';

import { makeId, getDayOfWeek, getDaysInMonth } from './general';
import { persOrder } from '$lib/stores/projects';

export const LockState = {
    LOCKED: 'locked',
    UNLOCKED: 'unlocked',
    NOT_SET: 'not_set'
} as const;

export const persGoalExpandedYears = writable<Record<string, boolean>>({});
export const persGoalExpandedMonths = writable<Record<string, boolean>>({});
export const persGoalExpandedWeeks = writable<Record<string, boolean>>({});

export const persGoalEncryptedCache = writable<string | null>(null);
export const persGoalHighlightEncryptedCache = writable<string | null>(null);

export const persLockState = writable<PersLockState>(LockState.NOT_SET);

type DirtyType = "year" | "month" | "week" | "day";
export const dirtyNodes = writable<Set<string>>(new Set());

export type ProfImage = {
    id: string;
    dataUrl: string;
};

interface HighlightLevel3 {
    text: string;
    one: boolean;
    me: boolean;
}

export interface HighlightLevel2 {
    text: string;
    children: Record<string, HighlightLevel3>;
    patterns?: Record<string, string[]>;
    imagePatterns?: Record<string, ProfImage[]>;
}

export interface HighlightLevel1 {
    text: string;
    children: Record<string, HighlightLevel2>;
}

export const persGoalHighlights = writable<Record<string, HighlightLevel1>>({});

export type PersLockState = typeof LockState[keyof typeof LockState];

type PersImage = {
    id: string;
    dataUrl: string;
};

export interface PersGoalDay {
    id: string;
    dayNumber: number;
    title?: string;
    dayOfWeek: string;
    dayPrivateGoals?: string;
    dayImage?: PersImage;
    isDream?: boolean;
    highlight?: boolean;
    dayTags?: string[];
}

export interface PersGoalWeek {
    id: string;
    weekNumber: number; // 1, 2, 3, 4, 5
    startDay: number; // First day number in week (e.g., 1, 8, 15)
    endDay: number; // Last day number in week (e.g., 7, 14, 21)
    weekPrivateGoals?: string; // TV-related goals
    priGoalCompleted?: boolean; // Week private goal completed
    priGoalRejected?: boolean; // Week private goal rejected
    weekImage?: PersImage;
    days: PersGoalDay[];
}

export interface PersGoalMonth {
    id: string;
    monthNumber: number; // 1-12 (1=January, 2=February, etc.)
    monthGoals?: string; // Month- Goals
    monthPrivateGoals?: string; // TV-related goals
    priGoalCompleted?: boolean; // Month private goal completed
    priGoalRejected?: boolean; // Month private goal rejected
    monthImage?: PersImage;
    weeks: PersGoalWeek[];
}

export interface PersGoalYear {
    id: string;
    year: number; // 2026, 2027, etc.
    yearHealthGoal?: string; // Year-level goals
    yearPrivateGoal?: string; // Yearly private goal
    yearPrivateGoalChangeCount: number; // Count of private goal changes
    yearImage?: PersImage;
    months: PersGoalMonth[];
}

export const persGoalData = writable<PersGoalYear[]>([]);

export function generatePersGoalStructureToDate(targetDate: Date): void {
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth() + 1; // 1-12
    const targetDay = targetDate.getDate();

    persGoalData.update((years) => {
        const updatedYears = [...years];

        // Find or create year
        let yearEntry = updatedYears.find(y => y.year === targetYear);
        if (!yearEntry) {
            yearEntry = {
                id: makeId(),
                year: targetYear,
                yearPrivateGoalChangeCount: 0,
                months: []
            };
            updatedYears.push(yearEntry);
        }

        // Generate months up to target month
        for (let monthNum = 1; monthNum <= targetMonth; monthNum++) {
            let monthEntry = yearEntry.months.find(m => m.monthNumber === monthNum);
            if (!monthEntry) {
                monthEntry = {
                    id: makeId(),
                    monthNumber: monthNum,
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

                // Find or create week
                let weekEntry = monthEntry.weeks.find(w => w.weekNumber === weekNum);
                if (!weekEntry) {
                    weekEntry = {
                        id: makeId(),
                        weekNumber: weekNum,
                        startDay,
                        endDay,
                        days: []
                    };
                    monthEntry.weeks.push(weekEntry);
                    monthEntry.weeks.sort((a, b) => a.weekNumber - b.weekNumber);
                }

                // Check if day already exists
                const dayExists = weekEntry.days.find(d => d.dayNumber === dayNum);
                if (!dayExists) {
                    const dayOfWeek = getDayOfWeek(targetYear, monthNum, dayNum);
                    const dayEntry: PersGoalDay = {
                        id: makeId(),
                        dayNumber: dayNum,
                        dayOfWeek,
                    };
                    weekEntry.days.push(dayEntry);
                    weekEntry.days.sort((a, b) => a.dayNumber - b.dayNumber);
                }
            }
        }

        return updatedYears;
    });
}

export function initPersOrder(persGoalHighlights: Record<string, HighlightLevel1>) {
	if (!persGoalHighlights || Object.keys(persGoalHighlights).length === 0) return;
	persOrder.update((currentOrder) => {
		if (currentOrder && Object.keys(currentOrder).length > 0) {
			return currentOrder;
		}
        console.log(`Initializing persOrder`);
		const orderData: Record<string, string[]> = {};

		for (const levelOne of Object.values(persGoalHighlights)) {
			orderData[levelOne.text] = Object.values(levelOne.children).map(
				(levelTwo) => levelTwo.text
			);
		}

		return orderData;
	});
}
// Update year private goal
// updateYearPrivateGoal(yearId: string, value: string): void
export function updateYearPrivateGoal(
    yearId: string,
    value: string
): void {
    persGoalData.update((years) =>
        years.map((y) => {
            if (y.id === yearId) {
                return {
                    ...y,
                    yearPrivateGoal: value,
                    yearPrivateGoalChangeCount: y.yearPrivateGoalChangeCount + 1
                };
            }
            return y;
        })
    );
}

export function updateYearByNumberPrivateGoal(
    yearNum: number,
    value: string
): void {
    persGoalData.update((years) =>
        years.map((y) => {
            if (y.year === yearNum) {
                return {
                    ...y,
                    yearPrivateGoal: value,
                    yearPrivateGoalChangeCount: y.yearPrivateGoalChangeCount + 1
                };
            }
            return y;
        })
    );
}

export function initHighlightLevel1(initHighLevel: string): void {
    persGoalHighlights.update((highlights) => ({
        ...highlights,
        level1: {
            text: initHighLevel,
            children: {}
        }
    }));
}

// Update month private goals
// updateMonthPrivateGoals(yearId: string, monthId: string, value: string): void
export function updateMonthPrivateGoals(
    yearId: string,
    monthId: string,
    value: string
): void {
    persGoalData.update((years) =>
        years.map((y) => {
            if (y.id === yearId) {
                return {
                    ...y,
                    months: y.months.map((m) => {
                        if (m.id === monthId) {
                            return { ...m, monthPrivateGoals: value };
                        }
                        return m;
                    })
                };
            }
            return y;
        })
    );
}

// Update week private goals
// updateWeekPrivateGoals(yearId: string, monthId: string, weekId: string, value: string): void
export function updateWeekPrivateGoals(
    yearId: string,
    monthId: string,
    weekId: string,
    value: string
): void {
    persGoalData.update((years) =>
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
                                        return { ...w, weekPrivateGoals: value };
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

export function updateDayImage(dataUrl: string, year: string, month: string, week: string, day: string): void {
    persGoalData.update((years) =>
        years.map((y) => {
            if (y.id === year) {
                return {
                    ...y,
                    months: y.months.map((m) => {
                        if (m.id === month) {
                            return {
                                ...m,
                                weeks: m.weeks.map((w) => {
                                    if (w.id === week) {
                                        return {
                                            ...w,
                                            days: w.days.map((d) => {
                                                if (d.id === day) {
                                                    return {
                                                        ...d,
                                                        dayImage: {
                                                            id: makeId(),
                                                            dataUrl
                                                        }
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

export function updateWeekImage(dataUrl: string, year: string, month: string, week: string): void {
    persGoalData.update((years) =>
        years.map((y) => {
            if (y.id === year) {
                return {
                    ...y,
                    months: y.months.map((m) => {
                        if (m.id === month) {
                            return {
                                ...m,
                                weeks: m.weeks.map((w) => {
                                    if (w.id === week) {
                                        return {
                                            ...w,
                                            weekImage: {
                                                id: makeId(),
                                                dataUrl
                                            }
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

export function updateMonthImage(dataUrl: string, year: string, month: string): void {
    persGoalData.update((years) =>
        years.map((y) => {
            if (y.id === year) {
                return {
                    ...y,
                    months: y.months.map((m) => {
                        if (m.id === month) {
                            return {
                                ...m,
                                monthImage: {
                                    id: makeId(),
                                    dataUrl
                                }
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

export function updateYearImage(dataUrl: string, year: string): void {
    persGoalData.update((years) =>
        years.map((y) => {
            if (y.id === year) {
                return {
                    ...y,
                    yearImage: {
                        id: makeId(),
                        dataUrl
                    }
                };
            }
            return y;
        })
    );
}

export function updateDayPrivateGoals(
    yearId: string,
    monthId: string,
    weekId: string,
    dayId: string,
    value: string,
    title?: string,
    tags?: string[]
): void {
    console.log(`In updateDayPrivateGoals`);
    console.log(`title is ${title}`);
    persGoalData.update((years) =>
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
                                                    const updated = {
                                                        ...d,
                                                        dayPrivateGoals: value,
                                                        ...(title !== undefined ? { title } : {}),
                                                        ...(tags !== undefined ? { dayTags: tags } : {})
                                                    };

                                                    console.log("UPDATED DAY:", updated);

                                                    return updated;
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

export function removeDayImage(year: string, month: string, week: string, day: string): void {
    persGoalData.update((years) =>
        years.map((y) => {
            if (y.id === year) {
                return {
                    ...y,
                    months: y.months.map((m) => {
                        if (m.id === month) {
                            return {
                                ...m,
                                weeks: m.weeks.map((w) => {
                                    if (w.id === week) {
                                        return {
                                            ...w,
                                            days: w.days.map((d) => {
                                                if (d.id === day) {
                                                    return {
                                                        ...d,
                                                        dayImage: undefined
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

export function removeWeekImage(year: string, month: string, week: string): void {
    persGoalData.update((years) =>
        years.map((y) => {
            if (y.id === year) {
                return {
                    ...y,
                    months: y.months.map((m) => {
                        if (m.id === month) {
                            return {
                                ...m,
                                weeks: m.weeks.map((w) => {
                                    if (w.id === week) {
                                        return {
                                            ...w,
                                            weekImage: undefined
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

export function removeMonthImage(year: string, month: string): void {
    persGoalData.update((years) =>
        years.map((y) => {
            if (y.id === year) {
                return {
                    ...y,
                    months: y.months.map((m) => {
                        if (m.id === month) {
                            return {
                                ...m,
                                monthImage: undefined
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

export function removeYearImage(year: string): void {
    persGoalData.update((years) =>
        years.map((y) => {
            if (y.id === year) {
                return {
                    ...y,
                    yearImage: undefined
                };
            }
            return y;
        })
    );
}

export function updateDayIsDream(year: string, month: string, week: string, day: string, value: boolean): void {
    persGoalData.update(years =>
        years.map(y =>
            y.id === year
                ? {
                    ...y,
                    months: y.months.map(m =>
                        m.id === month
                            ? {
                                ...m,
                                weeks: m.weeks.map(w =>
                                    w.id === week
                                        ? {
                                            ...w,
                                            days: w.days.map(d =>
                                                d.id === day
                                                    ? { ...d, isDream: value }
                                                    : d
                                            )
                                        }
                                        : w
                                )
                            }
                            : m
                    )
                }
                : y
        )
    );
}

export function updateHighlight(
    yearid: string,
    monthid: string,
    weekid: string,
    dayid: string,
    value: boolean
): void {
    persGoalData.update(years =>
        years.map(y =>
            y.id === yearid
                ? {
                    ...y,
                    months: y.months.map(m =>
                        m.id === monthid
                            ? {
                                ...m,
                                weeks: m.weeks.map(w =>
                                    w.id === weekid
                                        ? {
                                            ...w,
                                            days: w.days.map(d =>
                                                d.id === dayid
                                                    ? { ...d, highlight: value }
                                                    : d
                                            )
                                        }
                                        : w
                                )
                            }
                            : m
                    )
                }
                : y
        )
    );
}

// updateDaySleepScreen(yearId: string, monthId: string, weekId: string, dayId: string, field: 'sleepTime' | 'sleepWake' | 'sleepTimeBack' | 'sleepWakeAgain' | 'sleepTotal' | 'screenGoal', value: string): void
export function updateDaySleepScreen(
    yearId: string,
    monthId: string,
    weekId: string,
    dayId: string,
    field: 'sleepTime' | 'sleepWake' | 'sleepTimeBack' | 'sleepWakeAgain' | 'sleepTotal' | 'screenGoal',
    value: string
): void {
    persGoalData.update((years) =>
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
                                                    return { ...d, [field]: value };
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

// Toggle day private checkbox
// toggleDayPrivateCompleted(yearId: string, monthId: string, weekId: string, dayId: string, completed?: boolean): void
export function toggleDayPrivateCompleted(
    yearId: string,
    monthId: string,
    weekId: string,
    dayId: string,
    completed?: boolean
): void {
    persGoalData.update((years) =>
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
                                                    if (completed === true) {
                                                        // User clicked Yes
                                                        return {
                                                            ...d,
                                                            priGoalCompleted: true,
                                                            priGoalRejected: false
                                                        };
                                                    } else if (completed === false) {
                                                        // User clicked No
                                                        return {
                                                            ...d,
                                                            priGoalCompleted: false,
                                                            priGoalRejected: true
                                                        };
                                                    } else {
                                                        // Toggle (reset)
                                                        return {
                                                            ...d,
                                                            priGoalCompleted: false,
                                                            priGoalRejected: false
                                                        };
                                                    }
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

// Toggle week private checkbox
// toggleWeekPrivateCompleted(yearId: string, monthId: string, weekId: string, completed?: boolean): void
export function toggleWeekPrivateCompleted(
    yearId: string,
    monthId: string,
    weekId: string,
    completed?: boolean
): void {
    persGoalData.update((years) =>
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
                                        if (completed === true) {
                                            return {
                                                ...w,
                                                priGoalCompleted: true,
                                                priGoalRejected: false
                                            };
                                        } else if (completed === false) {
                                            return {
                                                ...w,
                                                priGoalCompleted: false,
                                                priGoalRejected: true
                                            };
                                        } else {
                                            return {
                                                ...w,
                                                priGoalCompleted: false,
                                                priGoalRejected: false
                                            };
                                        }
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

// Toggle month private checkbox
// toggleMonthPrivateCompleted(yearId: string, monthId: string, completed?: boolean): void
export function toggleMonthPrivateCompleted(
    yearId: string,
    monthId: string,
    completed?: boolean
): void {
    persGoalData.update((years) =>
        years.map((y) => {
            if (y.id === yearId) {
                return {
                    ...y,
                    months: y.months.map((m) => {
                        if (m.id === monthId) {
                            if (completed === true) {
                                return {
                                    ...m,
                                    priGoalCompleted: true,
                                    priGoalRejected: false
                                };
                            } else if (completed === false) {
                                return {
                                    ...m,
                                    priGoalCompleted: false,
                                    priGoalRejected: true
                                };
                            } else {
                                return {
                                    ...m,
                                    priGoalCompleted: false,
                                    priGoalRejected: false
                                };
                            }
                        }
                        return m;
                    })
                };
            }
            return y;
        })
    );
}

//PersGoalHighlight functions
export function addHighlightItem() {
    const id = makeId();

    persGoalHighlights.update((highlights) => ({
        ...highlights,
        [id]: {
            text: "",
            children: {}
        }
    }));
}

//Add persOrder update
export function addSubHighlight(
    parentId: string
) {
    const id = makeId();

    persGoalHighlights.update((highlights) => ({
        ...highlights,
        [parentId]: {
            ...highlights[parentId],
            children: {
                ...highlights[parentId].children,
                [id]: {
                    text: "",
                    children: {}
                }
            }
        }
    }));
     persOrder.update((order) => ({
        ...order,
        [parentId]: [
            ...(order[parentId] ?? []),
            id
        ]
    }));
}

export function addDetailHighlight(
    parentId: string,
    childId: string
) {
    const id = makeId();

    persGoalHighlights.update((highlights) => ({
        ...highlights,
        [parentId]: {
            ...highlights[parentId],
            children: {
                ...highlights[parentId].children,
                [childId]: {
                    ...highlights[parentId]
                        .children![childId],
                    children: {
                        ...highlights[parentId]
                            .children![childId]
                            .children,
                        [id]: {
                            text: "", one: false, me: false
                        }
                    }
                }
            }
        }
    }));
}

export function removeHighlight(
    id: string
) {
    persGoalHighlights.update((highlights) => {
        const updated = { ...highlights };
        delete updated[id];
        return updated;
    });
}

export function removeSubHighlight(
    parentId: string,
    childId: string
) {
    persGoalHighlights.update((highlights) => {
        const updated = { ...highlights };

        delete updated[parentId]
            .children?.[childId];

        return updated;
    });

     persOrder.update((order) => ({
        ...order,
        [parentId]: (order[parentId] ?? []).filter(
            (id) => id !== childId
        )
    }));
}

export function removeDetailHighlight(
    parentId: string,
    childId: string,
    detailId: string
) {
    persGoalHighlights.update((highlights) => {
        const updated = { ...highlights };

        delete updated[parentId]
            .children?.[childId]
            .children?.[detailId];

        return updated;
    });
}

export function updateTopHighlight(
    id: string,
    value: string
) {
    persGoalHighlights.update((highlights) => ({
        ...highlights,
        [id]: {
            ...highlights[id],
            text: value
        }
    }));
}

export function updateSubHighlight(
    parentId: string,
    childId: string,
    value: string
) {
    persGoalHighlights.update((highlights) => ({
        ...highlights,
        [parentId]: {
            ...highlights[parentId],
            children: {
                ...highlights[parentId].children,
                [childId]: {
                    ...highlights[parentId]
                        .children![childId],
                    text: value
                }
            }
        }
    }));
}

export function updateDetailHighlight(
    parentId: string,
    childId: string,
    detailId: string,
    value: string
) {
    persGoalHighlights.update((highlights) => ({
        ...highlights,
        [parentId]: {
            ...highlights[parentId],
            children: {
                ...highlights[parentId].children,
                [childId]: {
                    ...highlights[parentId]
                        .children![childId],
                    children: {
                        ...highlights[parentId]
                            .children![childId]
                            .children,
                        [detailId]: {
                            ...highlights[parentId]
                                .children![childId]
                                .children![detailId],
                            text: value
                        }
                    }
                }
            }
        }
    }));
}

export function addPersDayTitle(yearid: string, monthid: string, weekid: string, dayid: string, title: string) {
    persGoalData.update((years) =>
        years.map((y) => {
            if (y.id === yearid) {
                return {
                    ...y,
                    months: y.months.map((m) => {
                        if (m.id === monthid) {
                            return {
                                ...m,
                                weeks: m.weeks.map((w) => {
                                    if (w.id === weekid) {
                                        return {
                                            ...w,
                                            days: w.days.map((d) => {
                                                if (d.id === dayid) {
                                                    return { ...d, title: title };
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

export function addPersDayTag(yearid: string, monthid: string, weekid: string, dayid: string, tags: string[]) {
    persGoalData.update((years) =>
        years.map((y) => {
            if (y.id === yearid) {
                return {
                    ...y,
                    months: y.months.map((m) => {
                        if (m.id === monthid) {
                            return {
                                ...m,
                                weeks: m.weeks.map((w) => {
                                    if (w.id === weekid) {
                                        return {
                                            ...w,
                                            days: w.days.map((d) => {
                                                if (d.id === dayid) {
                                                    return {
                                                        ...d, dayTags: [
                                                            ...(d.dayTags ?? []),
                                                            ...tags
                                                        ]
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


export function migratePersGoalHighlights(
    data: any
): Record<string, HighlightLevel1> {
    // No migration needed yet.
    // This exists to support future schema changes.

    return data as Record<string, HighlightLevel1>;
}

export function migratePersGoal(
    data: any
): PersGoalYear[] {
    // No migration needed yet.
    // This exists to support future schema changes.

    return data as PersGoalYear[];
}

export function updateDialogM(parentId: string,
    childId: string,
    detailId: string,
    value: boolean) {
    persGoalHighlights.update((highlights) => ({
        ...highlights,
        [parentId]: {
            ...highlights[parentId],
            children: {
                ...highlights[parentId].children,
                [childId]: {
                    ...highlights[parentId]
                        .children![childId],
                    children: {
                        ...highlights[parentId]
                            .children![childId]
                            .children,
                        [detailId]: {
                            ...highlights[parentId]
                                .children![childId]
                                .children![detailId],
                            me: value
                        }
                    }
                }
            }
        }
    }));
}

export function updateDialogO(parentId: string,
    childId: string,
    detailId: string,
    value: boolean) {
    persGoalHighlights.update((highlights) => ({
        ...highlights,
        [parentId]: {
            ...highlights[parentId],
            children: {
                ...highlights[parentId].children,
                [childId]: {
                    ...highlights[parentId]
                        .children![childId],
                    children: {
                        ...highlights[parentId]
                            .children![childId]
                            .children,
                        [detailId]: {
                            ...highlights[parentId]
                                .children![childId]
                                .children![detailId],
                            one: value
                        }
                    }
                }
            }
        }
    }));
}

export function updateDetailHighlightPattern(
    parentId: string,
    childId: string,
) {
    console.log(`In updateDetailhighlightPattern`);
    const newPatternId = makeId();

    persGoalHighlights.update((highlights) => ({
        ...highlights,

        [parentId]: {
            ...highlights[parentId],

            children: {
                ...highlights[parentId].children,

                [childId]: {
                    ...highlights[parentId].children[childId],

                    patterns: {
                        ...(highlights[parentId]
                            .children[childId]
                            .patterns ?? {}),

                        [newPatternId]: [""]
                    }
                }
            }
        }
    }));
}

export function updateDetailHighlightImagePattern(
    id: string,
    childid: string
): void {
    persGoalHighlights.update((data) => {
        const levelTwo = data[id]?.children?.[childid];

        if (!levelTwo) return data;

        levelTwo.imagePatterns ??= {};

        levelTwo.imagePatterns[crypto.randomUUID()] = [];

        return { ...data };
    });
}

export function updatePatternSteps(
    parentId: string,
    childId: string,
    patternId: string,
    index: number,
    stepValue: string
) {
    persGoalHighlights.update((currentHighlights) => {
        const existingPattern =
            currentHighlights[parentId]
                .children[childId]
                .patterns?.[patternId] ?? [];

        const updatedPattern = [...existingPattern];

        updatedPattern[index] = stepValue;

        return {
            ...currentHighlights,

            [parentId]: {
                ...currentHighlights[parentId],

                children: {
                    ...currentHighlights[parentId].children,

                    [childId]: {
                        ...currentHighlights[parentId].children[childId],

                        patterns: {
                            ...(currentHighlights[parentId]
                                .children[childId]
                                .patterns ?? {}),

                            [patternId]: updatedPattern
                        }
                    }
                }
            }
        };
    });
}

export function initStep(parentId: string,
    childId: string,
    patternId: string) {
    persGoalHighlights.update((currentHighlights) => {
        const existingPattern =
            currentHighlights[parentId]
                .children[childId]
                .patterns?.[patternId] ?? [];

        const updatedPattern = [...existingPattern];

        updatedPattern.push("");

        return {
            ...currentHighlights,

            [parentId]: {
                ...currentHighlights[parentId],

                children: {
                    ...currentHighlights[parentId].children,

                    [childId]: {
                        ...currentHighlights[parentId].children[childId],

                        patterns: {
                            ...(currentHighlights[parentId]
                                .children[childId]
                                .patterns ?? {}),

                            [patternId]: updatedPattern
                        }
                    }
                }
            }
        };
    });
}

export function removeStep(
    parentId: string,
    childId: string,
    patternId: string
) {
    persGoalHighlights.update((currentHighlights) => {

        const existingPattern =
            currentHighlights[parentId]
                .children[childId]
                .patterns?.[patternId] ?? [];

        const updatedPattern = [...existingPattern];

        updatedPattern.pop();

        const childPatterns =
            currentHighlights[parentId]
                .children[childId]
                .patterns ?? {};

        // 👇 IF EMPTY → REMOVE KEY
        if (updatedPattern.length === 0) {

            const { [patternId]: _, ...remainingPatterns } = childPatterns;

            return {
                ...currentHighlights,

                [parentId]: {
                    ...currentHighlights[parentId],

                    children: {
                        ...currentHighlights[parentId].children,

                        [childId]: {
                            ...currentHighlights[parentId].children[childId],

                            patterns: remainingPatterns
                        }
                    }
                }
            };
        }

        // 👇 ELSE → KEEP KEY UPDATED
        return {
            ...currentHighlights,

            [parentId]: {
                ...currentHighlights[parentId],

                children: {
                    ...currentHighlights[parentId].children,

                    [childId]: {
                        ...currentHighlights[parentId].children[childId],

                        patterns: {
                            ...childPatterns,
                            [patternId]: updatedPattern
                        }
                    }
                }
            }
        };
    });
}

export function addImagePatternStep(
  id: string,
  childid: string,
  imagePatternId: string,
  image: ProfImage
): void {
  persGoalHighlights.update((data) => {
    const levelTwo = data[id]?.children?.[childid];

    if (!levelTwo) return data;

    if (!levelTwo.imagePatterns) {
      levelTwo.imagePatterns = {};
    }

    if (!levelTwo.imagePatterns[imagePatternId]) {
      levelTwo.imagePatterns[imagePatternId] = [];
    }

    levelTwo.imagePatterns[imagePatternId] = [
      ...levelTwo.imagePatterns[imagePatternId],
      image
    ];

    return data;
  });
}

export function removeImagePatternStep(
  parentId: string,
  childId: string,
  imagePatternId: string
) {
  persGoalHighlights.update((currentHighlights) => {
    const existingPattern =
      currentHighlights[parentId]
        .children[childId]
        .imagePatterns?.[imagePatternId] ?? [];

    const updatedPattern = [...existingPattern];

    updatedPattern.pop();

    const childImagePatterns =
      currentHighlights[parentId]
        .children[childId]
        .imagePatterns ?? {};

    if (updatedPattern.length === 0) {
      const { [imagePatternId]: _, ...remainingImagePatterns } =
        childImagePatterns;

      return {
        ...currentHighlights,
        [parentId]: {
          ...currentHighlights[parentId],
          children: {
            ...currentHighlights[parentId].children,
            [childId]: {
              ...currentHighlights[parentId].children[childId],
              imagePatterns: remainingImagePatterns
            }
          }
        }
      };
    }

    return {
      ...currentHighlights,
      [parentId]: {
        ...currentHighlights[parentId],
        children: {
          ...currentHighlights[parentId].children,
          [childId]: {
            ...currentHighlights[parentId].children[childId],
            imagePatterns: {
              ...childImagePatterns,
              [imagePatternId]: updatedPattern
            }
          }
        }
      }
    };
  });
}

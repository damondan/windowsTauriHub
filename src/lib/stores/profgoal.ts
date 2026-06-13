import { writable } from 'svelte/store';

import { makeId, getDayOfWeek, getDaysInMonth } from './general';

export type ProfImage = {
    id: string;
    dataUrl: string;
};

export const profGoalExpandedYears = writable<Record<string, boolean>>({});
export const profGoalExpandedMonths = writable<Record<string, boolean>>({});
export const profGoalExpandedWeeks = writable<Record<string, boolean>>({});

interface HighlightLevel3 {
    text: string;
    one: boolean;
    me: boolean;
}

export interface HighlightLevel2 {
    text: string;
    children: Record<string, HighlightLevel3>;
    patterns?: Record<string, string[]>;
    imagePatterns?: Record<string,ProfImage[]>;
}

export interface HighlightLevel1 {
    text: string;
    children: Record<string, HighlightLevel2>;
}

export const profGoalHighlights = writable<Record<string, HighlightLevel1>>({});

export interface ProfGoalEntry {
    id: string;
    description: string;
}

export interface ProfGoalDay {
    id: string;
    dayNumber: number;
    dayOfWeek: string;
    dayProfessionalGoals: string;
    proGoalCompleted: boolean;
    proGoalRejected: boolean;
    entries: ProfGoalEntry[];
}

export interface ProfGoalWeek {
    id: string;
    weekNumber: number; // 1, 2, 3, 4, 5
    startDay: number; // First day number in week (e.g., 1, 8, 15)
    endDay: number; // Last day number in week (e.g., 7, 14, 21)
    weekPrivateGoals: string; // TV-related goals
    weekProfessionalGoals: string; // Sleep-related goals
    proGoalCompleted: boolean; // Week professional goal completed
    proGoalRejected: boolean; // Week professional goal rejected
    days: ProfGoalDay[];
}

export interface ProfGoalMonth {
    id: string;
    monthNumber: number; // 1-12 (1=January, 2=February, etc.)
    monthGoals: string; // Month- Goals
    monthProfessionalGoals: string; // Sleep-related goals
    proGoalCompleted: boolean; // Month professional goal completed
    proGoalRejected: boolean; // Month professional goal rejected
    weeks: ProfGoalWeek[];
}

export interface ProfGoalYear {
    id: string;
    year: number; // 2026, 2027, etc.
    yearProfessionalGoal: string; // Yearly professional goal
    yearProfessionalGoalChangeCount: number; // Count of professional goal changes
    months: ProfGoalMonth[];
}

export const profGoalData = writable<ProfGoalYear[]>([]);
export const profOrder = writable<Record<string, string[]>>({});

export function generateProfGoalStructureToDate(targetDate: Date): void {
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth() + 1; // 1-12
    const targetDay = targetDate.getDate();

    profGoalData.update((years) => {
        const updatedYears = [...years];

        // Find or create year
        let yearEntry = updatedYears.find(y => y.year === targetYear);
        if (!yearEntry) {
            yearEntry = {
                id: makeId(),
                year: targetYear,
                yearProfessionalGoal: '',
                yearProfessionalGoalChangeCount: 0,
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
                    monthGoals: '',
                    monthProfessionalGoals: '',
                    proGoalCompleted: false,
                    proGoalRejected: false,
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
                        weekPrivateGoals: '',
                        weekProfessionalGoals: '',
                        proGoalCompleted: false,
                        proGoalRejected: false,
                        days: []
                    };
                    monthEntry.weeks.push(weekEntry);
                    monthEntry.weeks.sort((a, b) => a.weekNumber - b.weekNumber);
                }

                // Check if day already exists
                const dayExists = weekEntry.days.find(d => d.dayNumber === dayNum);
                if (!dayExists) {
                    const dayOfWeek = getDayOfWeek(targetYear, monthNum, dayNum);
                    const dayEntry: ProfGoalDay = {
                        id: makeId(),
                        dayNumber: dayNum,
                        dayOfWeek,
                        dayProfessionalGoals: '',
                        proGoalCompleted: false,
                        proGoalRejected: false,
                        entries: [{
                            id: makeId(),
                            description: ''
                        }]
                    };
                    weekEntry.days.push(dayEntry);
                    weekEntry.days.sort((a, b) => a.dayNumber - b.dayNumber);
                }
            }
        }

        return updatedYears;
    });
}

// Update year professional goal
// updateYearProfessionalGoal(yearId: string, value: string): void
export function updateYearProfessionalGoal(
    yearId: string,
    value: string
): void {
    profGoalData.update((years) =>
        years.map((y) => {
            if (y.id === yearId) {
                return {
                    ...y,
                    yearProfessionalGoal: value,
                    yearProfessionalGoalChangeCount: y.yearProfessionalGoalChangeCount + 1
                };
            }
            return y;
        })
    );
}

// Update month professional goals
// updateMonthProfessionalGoals(yearId: string, monthId: string, value: string): void
export function updateMonthProfessionalGoals(
    yearId: string,
    monthId: string,
    value: string
): void {
    profGoalData.update((years) =>
        years.map((y) => {
            if (y.id === yearId) {
                return {
                    ...y,
                    months: y.months.map((m) => {
                        if (m.id === monthId) {
                            return { ...m, monthProfessionalGoals: value };
                        }
                        return m;
                    })
                };
            }
            return y;
        })
    );
}

// Update week professional goals
// updateWeekProfessionalGoals(yearId: string, monthId: string, weekId: string, value: string): void
export function updateWeekProfessionalGoals(
    yearId: string,
    monthId: string,
    weekId: string,
    value: string
): void {
    profGoalData.update((years) =>
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
                                        return { ...w, weekProfessionalGoals: value };
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


// Update day professional goals
// updateDayProfessionalGoals(yearId: string, monthId: string, weekId: string, dayId: string, value: string): void
export function updateDayProfessionalGoals(
    yearId: string,
    monthId: string,
    weekId: string,
    dayId: string,
    value: string
): void {
    profGoalData.update((years) =>
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
                                                    return { ...d, dayProfessionalGoals: value };
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

// Toggle day professional checkbox
// toggleDayProfessionalCompleted(yearId: string, monthId: string, weekId: string, dayId: string, completed?: boolean): void
export function toggleDayProfessionalCompleted(
    yearId: string,
    monthId: string,
    weekId: string,
    dayId: string,
    completed?: boolean
): void {
    profGoalData.update((years) =>
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
                                                            proGoalCompleted: true,
                                                            proGoalRejected: false
                                                        };
                                                    } else if (completed === false) {
                                                        // User clicked No
                                                        return {
                                                            ...d,
                                                            proGoalCompleted: false,
                                                            proGoalRejected: true
                                                        };
                                                    } else {
                                                        // Toggle (reset)
                                                        return {
                                                            ...d,
                                                            proGoalCompleted: false,
                                                            proGoalRejected: false
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

// Toggle week professional checkbox
// toggleWeekProfessionalCompleted(yearId: string, monthId: string, weekId: string, completed?: boolean): void
export function toggleWeekProfessionalCompleted(
    yearId: string,
    monthId: string,
    weekId: string,
    completed?: boolean
): void {
    profGoalData.update((years) =>
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
                                                proGoalCompleted: true,
                                                proGoalRejected: false
                                            };
                                        } else if (completed === false) {
                                            return {
                                                ...w,
                                                proGoalCompleted: false,
                                                proGoalRejected: true
                                            };
                                        } else {
                                            return {
                                                ...w,
                                                proGoalCompleted: false,
                                                proGoalRejected: false
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

// Toggle month professional checkbox
// toggleMonthProfessionalCompleted(yearId: string, monthId: string, completed?: boolean): void
export function toggleMonthProfessionalCompleted(
    yearId: string,
    monthId: string,
    completed?: boolean
): void {
    profGoalData.update((years) =>
        years.map((y) => {
            if (y.id === yearId) {
                return {
                    ...y,
                    months: y.months.map((m) => {
                        if (m.id === monthId) {
                            if (completed === true) {
                                return {
                                    ...m,
                                    proGoalCompleted: true,
                                    proGoalRejected: false
                                };
                            } else if (completed === false) {
                                return {
                                    ...m,
                                    proGoalCompleted: false,
                                    proGoalRejected: true
                                };
                            } else {
                                return {
                                    ...m,
                                    proGoalCompleted: false,
                                    proGoalRejected: false
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

    profGoalHighlights.update((highlights) => ({
        ...highlights,
        [id]: {
            text: "",
            children: {}
        }
    }));
}

export function addSubHighlight(
    parentId: string
) {
    const id = makeId();

    profGoalHighlights.update((highlights) => ({
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
      profOrder.update((order) => ({
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

    profGoalHighlights.update((highlights) => ({
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
                            text: "",one:false,me:false
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
    profGoalHighlights.update((highlights) => {
        const updated = { ...highlights };
        delete updated[id];
        return updated;
    });
}

export function removeSubHighlight(
    parentId: string,
    childId: string
) {
    console.log(`In removeSubHighlight`);
    profGoalHighlights.update((highlights) => {
        const updated = { ...highlights };

        delete updated[parentId]
            .children?.[childId];

        return updated;
    });
      profOrder.update((order) => ({
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
    profGoalHighlights.update((highlights) => {
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
    profGoalHighlights.update((highlights) => ({
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
    profGoalHighlights.update((highlights) => ({
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
    profGoalHighlights.update((highlights) => ({
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

export function updateDetailHighlightPattern(
    parentId: string,
    childId: string,
) {
    console.log(`In updateDetailhighlightPattern`);
    const newPatternId = makeId();

    profGoalHighlights.update((highlights) => ({
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

export function updatePatternSteps(
    parentId: string,
    childId: string,
    patternId: string,
    index: number,
    stepValue: string
) {
    profGoalHighlights.update((currentHighlights) => {
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

export function updateDetailHighlightRemovePattern(
    parentId: string,
    childId: string,
    patternId: string
) {
    profGoalHighlights.update((highlights) => {

        const patterns =
            highlights[parentId]
                .children[childId]
                .patterns ?? {};

        const {
            [patternId]: _,
            ...remainingPatterns
        } = patterns;

        return {
            ...highlights,

            [parentId]: {
                ...highlights[parentId],

                children: {
                    ...highlights[parentId].children,

                    [childId]: {
                        ...highlights[parentId].children[childId],

                        patterns: remainingPatterns
                    }
                }
            }
        };
    });
}

export function initStep(parentId: string,
    childId: string,
    patternId: string) {
    profGoalHighlights.update((currentHighlights) => {
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
    profGoalHighlights.update((currentHighlights) => {

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

export function updateDialogM( parentId: string,
    childId: string,
    detailId: string,
    value: boolean){
     profGoalHighlights.update((highlights) => ({
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

export function updateDialogO( parentId: string,
    childId: string,
    detailId: string,
    value: boolean){
     profGoalHighlights.update((highlights) => ({
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

export function updateDetailHighlightImagePattern(
  id: string,
  childid: string
): void {
  profGoalHighlights.update((data) => {
    const levelTwo = data[id]?.children?.[childid];

    if (!levelTwo) return data;

    levelTwo.imagePatterns ??= {};

    levelTwo.imagePatterns[crypto.randomUUID()] = [];

    return { ...data };
  });
}

export function addImagePatternStep(
  id: string,
  childid: string,
  imagePatternId: string,
  image: ProfImage
): void {
  profGoalHighlights.update((data) => {
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
  profGoalHighlights.update((currentHighlights) => {
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

export function initProfOrder(profGoalHighlights: Record<string, HighlightLevel1>) {
    if (!profGoalHighlights || Object.keys(profGoalHighlights).length === 0) return;
    profOrder.update((currentOrder) => {
        if (currentOrder && Object.keys(currentOrder).length > 0) {
            return currentOrder;
        }
        console.log(`Initializing persOrder`);
        const orderData: Record<string, string[]> = {};

        for (const levelOne of Object.values(profGoalHighlights)) {
            orderData[levelOne.text] = Object.values(levelOne.children).map(
                (levelTwo) => levelTwo.text
            );
        }

        return orderData;
    });
}
 import { writable } from 'svelte/store';

export type GoalMeasurementType = 'time' | 'count' | 'none';

export type GoalIterationType = 'day' | 'week' | 'month';

export type GoalEntryStatus =
	| 'pending'
	| 'done'
	| 'not_done'
	| 'yes'
	| 'no'
	| 'projected'
	| 'missed';

export interface GoalEntry {
	entryId: string;
	goalId: string;

	value?: number;
	description?: string;

	status?: GoalEntryStatus;
	progressMarker?: boolean;

	consequenceDescription?: string;
	isConsequenceActive?: boolean;
	isConsequenceCompleted?: boolean;

	isCompleted?: boolean;
	isSucceeded?: boolean;
	hasFailed?: boolean;

	createdAt?: string;
	updatedAt?: string;

}

export interface GoalDay {
	id: string;
	dayNumber: number;
	entries: GoalEntry[];
}

export interface GoalMonth {
	id: string;
	monthNumber: number;
	days: GoalDay[];
}

export interface GoalYear {
	id: string;
	year: number;
	months: GoalMonth[];
}

export interface Goal {
    goalId: string;

	title?: string;
	description?: string;
	color?: string;

	dateStart?: string;
	dateEnd?: string;

	startAmount?: number;
	measurementAmount?: number;

	iterationType?: GoalIterationType;
	iterationAmount?: number;

	highLimit?: number;
	lowLimit?: number;

	maxFailuresAllowed?: number;
	failureCount?: number;

	consequenceDescription?: string;

	isExpanded?: boolean;
	isPersisted?: boolean;
	isInitialized?: boolean;

	isCompleted?: boolean;
	isSucceeded?: boolean;
	hasFailed?: boolean;
}

export interface GoalThread {
	threadId: string;

	title?: string;
	description?: string;
	color?: string;

	measurementType?: GoalMeasurementType;

	isExpanded?: boolean;
	isPersisted?: boolean;
	isInitialized?: boolean;

	iterateGoalMode?: boolean;
	activeGoalId?: string;

	goals: Goal[];

	goalCalendar: Record<number, GoalYear>;
}

export const goalData = writable<GoalThread[]>([]);
export const goalOrder = writable<string[]>([]);

export function makeId(): string {
	return crypto.randomUUID();
}

export function createMonthDaysMap(year: number): Record<number, number> {
	const record: Record<number, number> = {};

	for (let month = 1; month <= 12; month++) {
		record[month] = new Date(year, month, 0).getDate();
	}

	return record;
}

export function createTodayDateString(): string {
	return new Date().toISOString().slice(0, 10);
}

export function createEmptyGoal(): Goal {
	return {
		goalId: makeId(),

		title: '',
		description: '',
		color: '#f59e0b',

		dateStart: createTodayDateString(),
		dateEnd: '',

		startAmount: 0,
		measurementAmount: 0,

		iterationType: 'day',
		iterationAmount: 1,

		highLimit: 0,
		lowLimit: 0,

		maxFailuresAllowed: 10,
		failureCount: 10,

		consequenceDescription: '',

		isExpanded: false,
		isPersisted: false,
		isInitialized: false,

		isCompleted: false,
		isSucceeded: false,
		hasFailed: false
	};
}

export function createEmptyGoalThread(): GoalThread {
	return {
		threadId: makeId(),

		title: '',
		description: '',
		color: '#f59e0b',

		measurementType: 'count',
		iterateGoalMode: false,
		activeGoalId: '',

		isExpanded: true,
		isPersisted: false,
		isInitialized: false,

		goals: [],

		goalCalendar: {}
	};
}

export function generateTheGoalStructureToDate(targetDate: Date): void {
	const targetYear = targetDate.getFullYear();
	const record: Record<number, number> = createMonthDaysMap(targetYear);

	goalData.update((threads) => {
		return threads.map((thread) => {
			const existingYear = thread.goalCalendar[targetYear];

			const yearEntry: GoalYear = existingYear ?? {
				id: makeId(),
				year: targetYear,
				months: []
			};

			for (let monthNum = 1; monthNum <= 12; monthNum++) {
				if (!yearEntry.months[monthNum - 1]) {
					yearEntry.months[monthNum - 1] = {
						id: makeId(),
						monthNumber: monthNum,
						days: []
					};
				}

				const month = yearEntry.months[monthNum - 1];
				const numDays = record[monthNum];

				if (!month.days || month.days.length === 0) {
					month.days = Array.from({ length: numDays }, (_, i) => ({
						id: makeId(),
						dayNumber: i + 1,
						entries: []
					}));
				}

				if (month.days.length !== numDays) {
					const existingDays = month.days;

					month.days = Array.from({ length: numDays }, (_, i) => {
						return (
							existingDays[i] ?? {
								id: makeId(),
								dayNumber: i + 1,
								entries: []
							}
						);
					});
				}
			}

			return {
				...thread,
				goalCalendar: {
					...thread.goalCalendar,
					[targetYear]: yearEntry
				}
			};
		});
	});
}

export function addGoalThread(): void {
	const thread = createEmptyGoalThread();

	goalData.update((threads) => [...threads, thread]);
	goalOrder.update((order) => [...order, thread.threadId]);

	generateTheGoalStructureToDate(new Date());
}

export function deleteGoalThread(threadId: string): void {
	goalData.update((threads) => {
		return threads.filter((thread) => thread.threadId !== threadId);
	});

	goalOrder.update((order) => {
		return order.filter((id) => id !== threadId);
	});
}

export function toggleGoalThread(threadId: string): void {
	goalData.update((threads) => {
		return threads.map((thread) => {
			if (thread.threadId !== threadId) return thread;

			return {
				...thread,
				isExpanded: !thread.isExpanded
			};
		});
	});
}

export function initGoalThread(threadId: string): void {
	goalData.update((threads) => {
		return threads.map((thread) => {
			if (thread.threadId !== threadId) return thread;

			return {
				...thread,
				isInitialized: true,
				isExpanded: true
			};
		});
	});

	generateTheGoalStructureToDate(new Date());
}

export function updateGoalThreadField<K extends keyof GoalThread>(
	threadId: string,
	field: K,
	value: GoalThread[K]
): void {
	goalData.update((threads) => {
		return threads.map((thread) => {
			if (thread.threadId !== threadId) return thread;

			return {
				...thread,
				[field]: value
			};
		});
	});
}

export function addGoalToThread(threadId: string): void {
	const goal = createEmptyGoal();

	goalData.update((threads) => {
		return threads.map((thread) => {
			if (thread.threadId !== threadId) return thread;

			return {
				...thread,
				isExpanded: true,
				goals: [...thread.goals, goal]
			};
		});
	});
}

export function deleteGoalFromThread(threadId: string, goalId: string): void {
	goalData.update((threads) => {
		return threads.map((thread) => {
			if (thread.threadId !== threadId) return thread;

			return {
				...thread,
				goals: thread.goals.filter((goal) => goal.goalId !== goalId)
			};
		});
	});
}

export function toggleGoal(threadId: string, goalId: string): void {
	goalData.update((threads) => {
		return threads.map((thread) => {
			if (thread.threadId !== threadId) return thread;

			return {
				...thread,
				goals: thread.goals.map((goal) => {
					if (goal.goalId !== goalId) return goal;

					return {
						...goal,
						isExpanded: !goal.isExpanded
					};
				})
			};
		});
	});
}

export function initGoal(threadId: string, goalId: string): void {
	goalData.update((threads) => {
		return threads.map((thread) => {
			if (thread.threadId !== threadId) return thread;

			return {
				...thread,
				goals: thread.goals.map((goal) => {
					if (goal.goalId !== goalId) return goal;

					return {
						...goal,
						isInitialized: true,
						isExpanded: true
					};
				})
			};
		});
	});

	generateTheGoalStructureToDate(new Date());
}

export function updateGoalField<K extends keyof Goal>(
	threadId: string,
	goalId: string,
	field: K,
	value: Goal[K]
): void {
	goalData.update((threads) => {
		return threads.map((thread) => {
			if (thread.threadId !== threadId) return thread;

			return {
				...thread,
				goals: thread.goals.map((goal) => {
					if (goal.goalId !== goalId) return goal;

					return {
						...goal,
						[field]: value
					};
				})
			};
		});
	});
}

export function updateRealGoalEntry(
		threadId: string,
		goalId: string,
		entryId: string,
		updates: Partial<GoalEntry>,
	) {
		goalData.update((threads) => {
			return threads.map((thread) => {
				if (thread.threadId !== threadId) return thread;

				const updatedCalendar = { ...thread.goalCalendar };

				for (const yearKey of Object.keys(updatedCalendar)) {
					const year = updatedCalendar[Number(yearKey)];

					for (const month of year.months) {
						for (const day of month.days) {
							day.entries = day.entries.map((entry) => {
								if (
									entry.goalId !== goalId ||
									entry.entryId !== entryId
								) {
									return entry;
								}

								return {
									...entry,
									...updates,
									updatedAt: new Date().toISOString(),
								};
							});
						}
					}
				}

				return {
					...thread,
					goalCalendar: updatedCalendar,
				};
			});
		});
	}

	export function hasPendingGoalForDate(
	threads: GoalThread[],
	date: Date,
): boolean {
	const yearNumber = date.getFullYear();
	const monthIndex = date.getMonth();
	const dayIndex = date.getDate() - 1;

	for (const thread of threads) {
		const year = thread.goalCalendar[yearNumber];
		if (!year) continue;

		const month = year.months[monthIndex];
		if (!month) continue;

		const day = month.days[dayIndex];
		if (!day) continue;

		const hasPendingEntry = day.entries.some(
			(entry) => entry.status === "pending",
		);

		if (hasPendingEntry) return true;
	}

	return false;
}

export function updateGoalFailureCount(
	threadId: string,
	goalId: string,
	nextFailureCount: number,
): void {
	goalData.update((threads) => {
		return threads.map((thread) => {
			if (thread.threadId !== threadId) return thread;

			return {
				...thread,
				goals: thread.goals.map((goal) => {
					if (goal.goalId !== goalId) return goal;

					return {
						...goal,
						failureCount: nextFailureCount,
						hasFailed: nextFailureCount <= 0,
					};
				}),
			};
		});
	});
}

export function decreaseGoalFailureCount(
	threadId: string,
	goalId: string,
): number {
	let nextFailureCountResult = 0;

	goalData.update((threads) => {
		return threads.map((thread) => {
			if (thread.threadId !== threadId) return thread;

			return {
				...thread,
				goals: thread.goals.map((goal) => {
					if (goal.goalId !== goalId) return goal;

					const currentFailureCount = Number(goal.failureCount ?? 0);
					const nextFailureCount = Math.max(currentFailureCount - 1, 0);

					nextFailureCountResult = nextFailureCount;

					return {
						...goal,
						failureCount: nextFailureCount,
						hasFailed: nextFailureCount <= 0,
						isCompleted: nextFailureCount <= 0 ? true : goal.isCompleted,
					};
				}),
			};
		});
	});

	return nextFailureCountResult;
}

export function updateFutureConsequenceState(
		threadId: string,
		goalId: string,
		fromDateString: string,
		isConsequenceActive: boolean,
	): void {
		goalData.update((threads) => {
			return threads.map((thread) => {
				if (thread.threadId !== threadId) return thread;

				const updatedCalendar = { ...thread.goalCalendar };

				for (const yearKey of Object.keys(updatedCalendar)) {
					const year = updatedCalendar[Number(yearKey)];

					year.months = year.months.map((month) => {
						return {
							...month,
							days: month.days.map((day) => {
								return {
									...day,
									entries: day.entries.map((entry) => {
										if (entry.goalId !== goalId)
											return entry;
										if (!entry.createdAt) return entry;
										if (entry.createdAt < fromDateString)
											return entry;

										return {
											...entry,
											isConsequenceActive,
											updatedAt: new Date().toISOString(),
										};
									}),
								};
							}),
						};
					});
				}

				return {
					...thread,
					goalCalendar: updatedCalendar,
				};
			});
		});
	}
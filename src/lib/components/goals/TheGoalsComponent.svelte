<script lang="ts">
	import { onMount } from "svelte";
	import { fly } from "svelte/transition";
	import { buttonStyles } from "$lib/styles";
	import InfoModal from "$lib/components/util/InfoModal.svelte";
	import GoalEntryNode from "$lib/components/goals/GoalEntryNode.svelte";
	import GoalEntryEditor from "$lib/components/goals/GoalEntryEditor.svelte";
	import {
		logGoalToProjects,
		type ProjectTaskStatus,
	} from "$lib/stores/projects";
	import {
		goalData,
		addGoalThread,
		deleteGoalThread,
		toggleGoalThread,
		initGoalThread,
		updateGoalThreadField,
		addGoalToThread,
		deleteGoalFromThread,
		toggleGoal,
		initGoal,
		updateGoalField,
		generateTheGoalStructureToDate,
		updateGoalFailureCount,
		updateFutureConsequenceState,
		decreaseGoalFailureCount,
		type GoalMonth,
		type GoalThread,
		type Goal,
		type GoalEntry,
		updateRealGoalEntry,
	} from "$lib/stores/thegoals";

	let displayYear: number = $state(0);
	let displayMonth: number = $state(0);
	let displayDay: number = $state(0);
	let todayDate: Date = $state(new Date());

	//InfoModal
	let showInfoModal = $state(false);
	let infoModalTitle = $state("Notice");
	let infoModalMessage = $state("");
	let infoModalReason = $state<
		"dateEnd" | "isCompleted" | "failureCount" | ""
	>("");

	function openInfoModal(
		reason: "dateEnd" | "isCompleted" | "failureCount",
		title: string,
		message: string,
	): void {
		infoModalReason = reason;
		infoModalTitle = title;
		infoModalMessage = message;
		showInfoModal = true;
	}

	function closeInfoModal(): void {
		showInfoModal = false;
		infoModalTitle = "Notice";
		infoModalMessage = "";
		infoModalReason = "";
	}

	function triggerDateEndInfoModal(): void {
		openInfoModal(
			"dateEnd",
			"Goal Ended",
			"This goal has reached its end date. It will be logged in the Log component.",
		);
	}

	function triggerGoalCompletedInfoModal(): void {
		openInfoModal(
			"isCompleted",
			"Goal Completed",
			"This goal has been completed and will be logged in the Log component.",
		);
	}

	function triggerFailureCountInfoModal(): void {
		openInfoModal(
			"failureCount",
			"Failure Count Updated",
			"Your failure count has gone down.",
		);
	}

	function triggerGoalFailedInfoModal(): void {
		openInfoModal(
			"failureCount",
			"Goal Failed",
			"You have reached the maximum failure rates. This goal has ended and will be logged in the Log component. Have a good day.",
		);
	}

	function getNextFailureCount(goal: Goal): number {
		const currentFailureCount = Number(goal.failureCount ?? 0);

		return Math.max(currentFailureCount - 1, 0);
	}

	function didEntryGoBelowLowLimit(
		thread: GoalThread,
		goal: Goal,
		value: number,
	): boolean {
		if (thread.measurementType === "none") return false;

		const lowLimit = Number(goal.lowLimit ?? 0);

		return value < lowLimit;
	}

	function handleFailureCountModal(
		thread: GoalThread,
		goal: Goal,
		nextFailureCount: number,
	): void {
		if (nextFailureCount <= 0) {
			failGoalAndLog(thread, goal);
			return;
		}

		triggerFailureCountInfoModal();
	}

	function handleGoalCompletedChange(
		threadId: string,
		goalId: string,
		isCompleted: boolean,
	): void {
		const thread = $goalData.find(
			(existingThread) => existingThread.threadId === threadId,
		);

		if (!thread) return;

		const goal = thread.goals.find(
			(existingGoal) => existingGoal.goalId === goalId,
		);

		if (!goal) return;

		if (isCompleted) {
			completeGoalAndLog(thread, goal);
			return;
		}

		updateGoalField(threadId, goalId, "isCompleted", isCompleted);
	}

	function completeGoalAndLog(thread: GoalThread, goal: Goal): void {
		logAndRemoveGoal(thread, goal, "completed");
		triggerGoalCompletedInfoModal();
	}

	function endGoalAndLog(thread: GoalThread, goal: Goal): void {
		logAndRemoveGoal(thread, goal, "ended");
		triggerDateEndInfoModal();
	}

	function logAndRemoveGoal(
		thread: GoalThread,
		goal: Goal,
		status: ProjectTaskStatus,
	): void {
		const wasLogged = logGoalToProjects(
			"Goals",
			goal.title ?? "",
			goal,
			status,
		);

		if (!wasLogged) {
			openInfoModal(
				"failureCount",
				"Logging Failed",
				"This goal could not be logged. Make sure the goal title uses #Project @Subproject Description.",
			);

			return;
		}
		deleteGoalFromThread(thread.threadId, goal.goalId);
	}

	function failGoalAndLog(thread: GoalThread, goal: Goal): void {
		logAndRemoveGoal(thread, goal, "failed");
		triggerGoalFailedInfoModal();
	}

	function getTodayDate(): Date {
		return todayDate;
	}

	let selectedGoalEntryData = $state<{
		thread: GoalThread;
		goal: Goal;
		entry: GoalEntry;
	} | null>(null);

	onMount(() => {
		const currentDate = getTodayDate();

		displayDay = currentDate.getDate();
		displayYear = currentDate.getFullYear();
		displayMonth = currentDate.getMonth() + 1;

		generateTheGoalStructureToDate(currentDate);
		createGoalEntriesForDate(currentDate);
	});

	function daysBetween(startDate: Date, currentDate: Date): number {
		const start = new Date(
			startDate.getFullYear(),
			startDate.getMonth(),
			startDate.getDate(),
		);

		const current = new Date(
			currentDate.getFullYear(),
			currentDate.getMonth(),
			currentDate.getDate(),
		);

		const diffMs = current.getTime() - start.getTime();

		return Math.floor(diffMs / (1000 * 60 * 60 * 24));
	}

	function isGoalScheduledForDate(goal: Goal, date: Date): boolean {
		if (!goal.dateStart) return false;
		if (!goal.isInitialized) return false;

		const startDate = new Date(goal.dateStart + "T00:00:00");

		if (date < startDate) return false;

		if (!goal.isPersisted && goal.dateEnd) {
			const endDate = new Date(goal.dateEnd + "T00:00:00");

			if (date > endDate) return false;
		}

		const iterationAmount = Number(goal.iterationAmount ?? 1);

		if (iterationAmount <= 0) return false;

		const diffDays = daysBetween(startDate, date);

		if (goal.iterationType === "day") {
			return diffDays % iterationAmount === 0;
		}

		if (goal.iterationType === "week") {
			return diffDays % (iterationAmount * 7) === 0;
		}

		if (goal.iterationType === "month") {
			const monthDiff =
				(date.getFullYear() - startDate.getFullYear()) * 12 +
				(date.getMonth() - startDate.getMonth());

			return (
				monthDiff % iterationAmount === 0 &&
				date.getDate() === startDate.getDate()
			);
		}

		return false;
	}

	function createPendingGoalEntry(
		thread: GoalThread,
		goal: Goal,
		date: Date,
	): GoalEntry {
		return {
			entryId: crypto.randomUUID(),
			goalId: goal.goalId,
			value: getLastGoalValueBeforeDate(thread, goal, date),
			description: "",
			status: "pending",
			isCompleted: false,
			isSucceeded: false,
			hasFailed: false,
			isConsequenceActive: getLastConsequenceStateBeforeDate(
				thread,
				goal,
				date,
			),
			createdAt: date.toISOString().slice(0, 10),
			updatedAt: new Date().toISOString(),
		};
	}

	function createGoalEntriesForDate(date: Date): void {
		generateTheGoalStructureToDate(date);

		const yearNumber = date.getFullYear();
		const monthIndex = date.getMonth();
		const dayIndex = date.getDate() - 1;

		goalData.update((threads) => {
			return threads.map((thread) => {
				const year = thread.goalCalendar[yearNumber];
				if (!year) return thread;

				const month = year.months[monthIndex];
				if (!month) return thread;

				const day = month.days[dayIndex];
				if (!day) return thread;

				let didGoalStatusChange = false;

				const updatedGoals = thread.goals.map((goal) => {
					const dateEndReached = checkGoalDateEndReached(goal, date);

					if (dateEndReached && !goal.isCompleted) {
						didGoalStatusChange = true;
						endGoalAndLog(thread, goal);

						return {
							...goal,
							isCompleted: true,
						};
					}

					return goal;
				});

				const entriesToAdd: GoalEntry[] = [];

				for (const goal of updatedGoals) {
					if (goal.isCompleted) continue;

					if (!isGoalScheduledForDate(goal, date)) continue;

					const alreadyExists = day.entries.some(
						(entry) => entry.goalId === goal.goalId,
					);

					if (alreadyExists) continue;

					entriesToAdd.push(
						createPendingGoalEntry(thread, goal, date),
					);
				}

				const didAddEntries = entriesToAdd.length > 0;

				if (!didGoalStatusChange && !didAddEntries) {
					return thread;
				}

				if (!didAddEntries) {
					return {
						...thread,
						goals: updatedGoals,
					};
				}

				const updatedDay = {
					...day,
					entries: [...day.entries, ...entriesToAdd],
				};

				const updatedMonth = {
					...month,
					days: month.days.map((existingDay, index) =>
						index === dayIndex ? updatedDay : existingDay,
					),
				};

				const updatedYear = {
					...year,
					months: year.months.map((existingMonth, index) =>
						index === monthIndex ? updatedMonth : existingMonth,
					),
				};

				return {
					...thread,
					goals: updatedGoals,
					goalCalendar: {
						...thread.goalCalendar,
						[yearNumber]: updatedYear,
					},
				};
			});
		});
	}

	function checkGoalDateEndReached(goal: Goal, date: Date): boolean {
		if (!goal.dateEnd) return false;

		// Persisted means the goal has no end date.
		if (goal.isPersisted) return false;

		const endDate = new Date(goal.dateEnd + "T00:00:00");

		const currentDateOnly = new Date(
			date.getFullYear(),
			date.getMonth(),
			date.getDate(),
		);

		const endDateOnly = new Date(
			endDate.getFullYear(),
			endDate.getMonth(),
			endDate.getDate(),
		);

		return currentDateOnly >= endDateOnly;
	}

	function getLastGoalValueBeforeDate(
		thread: GoalThread,
		goal: Goal,
		date: Date,
	): number {
		const targetDateString = date.toISOString().slice(0, 10);

		let lastValue = Number(goal.startAmount ?? 0);

		for (const year of Object.values(thread.goalCalendar)) {
			for (const month of year.months) {
				for (const day of month.days) {
					for (const entry of day.entries) {
						if (entry.goalId !== goal.goalId) continue;
						if (!entry.createdAt) continue;
						if (entry.createdAt >= targetDateString) continue;

						lastValue = Number(entry.value ?? lastValue);
					}
				}
			}
		}

		return lastValue;
	}

	function addGoal() {
		addGoalThread();
	}

	function openAllRows() {
		goalData.update((threads) => {
			return threads.map((thread) => ({
				...thread,
				isExpanded: true,
				goals: thread.goals.map((goal) => ({
					...goal,
					isExpanded: true,
				})),
			}));
		});
	}

	function prevMonth() {
		if (displayMonth === 1) {
			displayMonth = 12;
			displayYear--;
		} else {
			displayMonth--;
		}

		const displayedDate = new Date(displayYear, displayMonth - 1, 1);

		generateTheGoalStructureToDate(new Date(displayedDate));
	}

	function nextMonth() {
		if (displayMonth === 12) {
			displayMonth = 1;
			displayYear++;
		} else {
			displayMonth++;
		}

		const displayedDate = new Date(displayYear, displayMonth - 1, 1);

		generateTheGoalStructureToDate(new Date(displayedDate));
	}

	function getMonthName(month: number): string {
		return new Date(displayYear, month - 1, 1).toLocaleString("default", {
			month: "long",
		});
	}

	function getGoalMonth(thread: GoalThread): GoalMonth | undefined {
		return thread.goalCalendar[displayYear]?.months?.[displayMonth - 1];
	}

	function escapeDateInput(e: KeyboardEvent) {
		if (e.key === "Escape") {
			(e.currentTarget as HTMLInputElement).blur();
		}
	}

	function roundAxisLimit(value: number): number {
		if (!value || value <= 0) return 12;

		return value + 25;
	}

	function getThreadAxisLimit(thread: GoalThread): number {
		if (thread.measurementType === "none") {
			return 12;
		}

		const highestValue = Math.max(
			0,
			...thread.goals.map((goal) =>
				Math.max(
					Number(goal.highLimit ?? 0),
					Number(goal.startAmount ?? 0),
				),
			),
		);

		return roundAxisLimit(highestValue);
	}

	function getMonthDayNumbers(thread: GoalThread): number[] {
		const month = getGoalMonth(thread);

		if (!month) return [];

		return month.days.map((day) => day.dayNumber);
	}

	function getYAxisLabels(axisLimit: number): number[] {
		return [axisLimit, axisLimit / 2, 0, -axisLimit / 2, -axisLimit];
	}

	function shouldShowThreadGrid(thread: GoalThread): boolean {
		return thread.goals.some((goal) => goal.isInitialized);
	}

	function getYPercent(value: number, axisLimit: number): number {
		const zeroLinePercent = 75;

		if (!axisLimit || axisLimit <= 0) return zeroLinePercent;

		if (value >= 0) {
			return zeroLinePercent - (value / axisLimit) * zeroLinePercent;
		}

		return (
			zeroLinePercent +
			(Math.abs(value) / axisLimit) * (100 - zeroLinePercent)
		);
	}

	function getXPercent(dayNumber: number, totalDays: number): number {
		return ((dayNumber - 1) / Math.max(totalDays - 1, 1)) * 100;
	}

	function getGoalStartDay(goal: Goal): number | null {
		if (!goal.dateStart) return null;

		const startDate = new Date(goal.dateStart + "T00:00:00");

		if (
			startDate.getFullYear() !== displayYear ||
			startDate.getMonth() + 1 !== displayMonth
		) {
			return null;
		}

		return startDate.getDate();
	}

	function createStartEntry(goal: Goal): GoalEntry {
		return {
			entryId: `start-${goal.goalId}`,
			goalId: goal.goalId,
			value: Number(goal.startAmount ?? 0),
			description: "Starting amount",
			status: "pending",
			isCompleted: false,
			isSucceeded: false,
			hasFailed: false,
			isConsequenceActive: false,
			createdAt: goal.dateStart ?? "",
		};
	}

	type PlottedGoalNode = {
		key: string;
		entry: GoalEntry;
		dayNumber: number;
		xPercent: number;
		yPercent: number;
		color: string;
		isPending: boolean;
	};

	function getEntryNodeColor(entry: GoalEntry, goal: Goal): string {
		if (entry.status === "pending") return "#9ca3af";
		if (entry.status === "not_done" || entry.status === "no")
			return "#ef4444";

		return goal.color ?? "#ffffff";
	}

	function getEntryLineColor(entry: GoalEntry, goal: Goal): string {
		if (entry.status === "pending") return "#9ca3af";
		if (entry.status === "not_done" || entry.status === "no")
			return "#ef4444";

		return goal.color ?? "#ffffff";
	}

	function getPlottedNodesForGoal(
		thread: GoalThread,
		goal: Goal,
		axisLimit: number,
		totalDays: number,
	): PlottedGoalNode[] {
		const nodes: PlottedGoalNode[] = [];

		const startDay = getGoalStartDay(goal);

		if (
			goal.isInitialized &&
			startDay !== null &&
			goal.startAmount !== undefined
		) {
			const startEntry = createStartEntry(goal);

			nodes.push({
				key: startEntry.entryId,
				entry: startEntry,
				dayNumber: startDay,
				xPercent: getXPercent(startDay, totalDays),
				yPercent: getYPercent(
					getGoalNodeYValue(thread, goal, Number(goal.startAmount)),
					axisLimit,
				),
				color: "#ffffff",
				isPending: false,
			});
		}

		const month = getGoalMonth(thread);

		if (!month) return nodes;

		for (const day of month.days) {
			for (const entry of day.entries) {
				if (entry.goalId !== goal.goalId) continue;

				nodes.push({
					key: entry.entryId,
					entry,
					dayNumber: day.dayNumber,
					xPercent: getXPercent(day.dayNumber, totalDays),
					yPercent: getYPercent(
						getGoalNodeYValue(
							thread,
							goal,
							Number(entry.value ?? 0),
						),
						axisLimit,
					),
					color: getEntryNodeColor(entry, goal),
					isPending: entry.status === "pending",
				});
			}
		}

		return nodes.sort((a, b) => a.dayNumber - b.dayNumber);
	}

	function getLatestPlottedNode(
		nodes: PlottedGoalNode[],
	): PlottedGoalNode | null {
		if (nodes.length === 0) return null;

		return nodes[nodes.length - 1];
	}

	function openGoalEntryEditor(
		thread: GoalThread,
		goal: Goal,
		entry: GoalEntry,
	) {
		selectedGoalEntryData = {
			thread,
			goal,
			entry,
		};
	}

	function closeGoalEntryEditor() {
		selectedGoalEntryData = null;
	}

	function handleEntryDone(
		entry: GoalEntry,
		value: number,
		description: string,
		isConsequenceActive: boolean,
		progressMarker: boolean,
	) {
		if (!selectedGoalEntryData) return;

		const { thread, goal } = selectedGoalEntryData;

		const recordedValue =
			isConsequenceActive && thread.measurementType !== "none"
				? value / 2
				: value;

		const wentBelowLowLimit = didEntryGoBelowLowLimit(
			thread,
			goal,
			recordedValue,
		);

		const lowerLimit = Number(goal.lowLimit ?? 0);

		const shouldActivateConsequence =
			thread.measurementType !== "none" &&
			(isConsequenceActive || recordedValue < lowerLimit);

		if (entry.entryId.startsWith("start-")) {
			updateGoalField(
				thread.threadId,
				goal.goalId,
				"startAmount",
				recordedValue,
			);
			closeGoalEntryEditor();
			return;
		}

		updateRealGoalEntry(thread.threadId, goal.goalId, entry.entryId, {
			value: recordedValue,
			description,
			isCompleted: true,
			isSucceeded: true,
			hasFailed: false,
			status: thread.measurementType === "none" ? "yes" : "done",
			isConsequenceActive: shouldActivateConsequence,
			progressMarker,
		});

		if (wentBelowLowLimit) {
			const nextFailureCount = decreaseGoalFailureCount(
				thread.threadId,
				goal.goalId,
			);

			handleFailureCountModal(thread, goal, nextFailureCount);
		}

		if (entry.createdAt) {
			updateFutureConsequenceState(
				thread.threadId,
				goal.goalId,
				entry.createdAt,
				shouldActivateConsequence,
			);
		}

		closeGoalEntryEditor();
	}

	function handleEntryNotDone(
		entry: GoalEntry,
		description: string,
		isConsequenceActive: boolean,
		progressMarker: boolean,
	) {
		if (!selectedGoalEntryData) return;

		const { thread, goal } = selectedGoalEntryData;

		if (entry.entryId.startsWith("start-")) {
			closeGoalEntryEditor();
			return;
		}

		const wasAlreadyFailed = entry.hasFailed === true;

		updateRealGoalEntry(thread.threadId, goal.goalId, entry.entryId, {
			description,
			isCompleted: true,
			isSucceeded: false,
			hasFailed: true,
			status: thread.measurementType === "none" ? "no" : "not_done",
			isConsequenceActive: true,
			progressMarker,
		});

		if (!wasAlreadyFailed) {
			const nextFailureCount = decreaseGoalFailureCount(
				thread.threadId,
				goal.goalId,
			);

			handleFailureCountModal(thread, goal, nextFailureCount);
		}

		closeGoalEntryEditor();
	}

	function handleEntryUpdate(
	entry: GoalEntry,
	description: string,
	isConsequenceActive: boolean,
	progressMarker: boolean,
) {
	if (!selectedGoalEntryData) return;

	const { thread, goal } = selectedGoalEntryData;

	if (entry.entryId.startsWith("start-")) {
		closeGoalEntryEditor();
		return;
	}

	updateRealGoalEntry(thread.threadId, goal.goalId, entry.entryId, {
		description,
		isConsequenceActive,
		progressMarker,
	});

	if (entry.createdAt) {
		updateFutureConsequenceState(
			thread.threadId,
			goal.goalId,
			entry.createdAt,
			isConsequenceActive,
		);
	}

	closeGoalEntryEditor();
}

	function threadHasGoalForDate(thread: GoalThread, date: Date): boolean {
		const yearNumber = date.getFullYear();
		const monthIndex = date.getMonth();
		const dayIndex = date.getDate() - 1;

		const year = thread.goalCalendar[yearNumber];
		if (!year) return false;

		const month = year.months[monthIndex];
		if (!month) return false;

		const day = month.days[dayIndex];
		if (!day) return false;

		return day.entries.length > 0;
	}

	function threadHasGoalForToday(thread: GoalThread): boolean {
		return threadHasGoalForDate(thread, getTodayDate());
	}

	function getLastConsequenceStateBeforeDate(
		thread: GoalThread,
		goal: Goal,
		date: Date,
	): boolean {
		const targetDateString = date.toISOString().slice(0, 10);

		let lastState = false;

		for (const year of Object.values(thread.goalCalendar)) {
			for (const month of year.months) {
				for (const day of month.days) {
					for (const entry of day.entries) {
						if (entry.goalId !== goal.goalId) continue;
						if (!entry.createdAt) continue;
						if (entry.createdAt >= targetDateString) continue;

						lastState = entry.isConsequenceActive ?? false;
					}
				}
			}
		}

		return lastState;
	}

	function getGoalLabelYOffset(thread: GoalThread, goal: Goal): number {
		if (thread.iterateGoalMode) {
			return 0;
		}

		const index = thread.goals.findIndex(
			(existingGoal) => existingGoal.goalId === goal.goalId,
		);

		const offsets = [0, -18, 18, -36, 36];

		return offsets[index % offsets.length];
	}

	function getActiveGoal(thread: GoalThread): Goal | undefined {
		if (thread.goals.length === 0) return undefined;

		const activeGoal = thread.goals.find(
			(goal) => goal.goalId === thread.activeGoalId,
		);

		return activeGoal ?? thread.goals[0];
	}

	function getVisibleGoalsForThread(thread: GoalThread): Goal[] {
		if (!thread.iterateGoalMode) {
			return thread.goals;
		}

		const activeGoal = getActiveGoal(thread);

		return activeGoal ? [activeGoal] : [];
	}

	function toggleIterateGoalMode(thread: GoalThread): void {
		const firstGoalId = thread.goals[0]?.goalId ?? "";

		updateGoalThreadField(
			thread.threadId,
			"iterateGoalMode",
			!thread.iterateGoalMode,
		);

		if (!thread.iterateGoalMode && !thread.activeGoalId && firstGoalId) {
			updateGoalThreadField(thread.threadId, "activeGoalId", firstGoalId);
		}
	}

	function cycleActiveGoal(thread: GoalThread): void {
		if (thread.goals.length === 0) return;

		const currentIndex = thread.goals.findIndex(
			(goal) => goal.goalId === thread.activeGoalId,
		);

		const nextIndex =
			currentIndex === -1 || currentIndex === thread.goals.length - 1
				? 0
				: currentIndex + 1;

		const nextGoal = thread.goals[nextIndex];

		updateGoalThreadField(thread.threadId, "activeGoalId", nextGoal.goalId);
	}

	function isNoneMeasurementThread(thread: GoalThread): boolean {
		return thread.measurementType === "none";
	}

	function getNoneGoalLaneValue(thread: GoalThread, goal: Goal): number {
		const lanes = [9, 3, -3, -9];

		const index = thread.goals.findIndex(
			(existingGoal) => existingGoal.goalId === goal.goalId,
		);

		return lanes[index] ?? 0;
	}

	function getGoalNodeYValue(
		thread: GoalThread,
		goal: Goal,
		value: number,
	): number {
		if (thread.measurementType === "none") {
			return getNoneGoalLaneValue(thread, goal);
		}

		return value;
	}
</script>

<div class="mb-6 flex items-center justify-end gap-3">
	<button
		class="rounded border border-white/30 bg-white/10 px-3 py-2 text-sm text-white/40 hover:bg-black/70 hover:text-white/80"
		onclick={openAllRows}
	>
		Open All
	</button>

	<button onclick={addGoal} class={buttonStyles.largeGreenButton}> + </button>
</div>

{#if $goalData.length === 0}
	<div class="text-white/70 italic">
		No goals yet. Click the green plus button and create a goal!
	</div>
{/if}

{#each $goalData as thread (thread.threadId)}
	<div class="mb-3">
		<!-- Level 1: Goal Thread Row -->
		<div class="rounded-xl bg-white/10 p-3">
			<div class="flex items-center gap-3">
				<button
					class="w-8 border text-3xl text-white {threadHasGoalForToday(
						thread,
					)
						? 'border-green-400/70'
						: 'border-white/10'}"
					onclick={() => toggleGoalThread(thread.threadId)}
				>
					{thread.isExpanded ? "▼" : "▷"}
				</button>

				<input
					type="text"
					class="flex-1 rounded border border-white/20 bg-white/5 px-3 py-2 text-2xl text-white placeholder-white/40"
					placeholder="Goal thread title..."
					value={thread.title}
					oninput={(e) =>
						updateGoalThreadField(
							thread.threadId,
							"title",
							(e.target as HTMLInputElement).value,
						)}
				/>

				<input
					type="text"
					class="flex-1 rounded border border-white/20 bg-white/5 px-3 py-2 text-xl text-white placeholder-white/40"
					placeholder="Description..."
					value={thread.description}
					oninput={(e) =>
						updateGoalThreadField(
							thread.threadId,
							"description",
							(e.target as HTMLInputElement).value,
						)}
				/>

				<input
					type="color"
					class="h-10 w-12 rounded border border-white/20 bg-white/10"
					value={thread.color}
					oninput={(e) =>
						updateGoalThreadField(
							thread.threadId,
							"color",
							(e.target as HTMLInputElement).value,
						)}
				/>

				<select
					class="rounded border border-white/20 bg-black/70 px-3 py-2 text-black"
					value={thread.measurementType}
					onchange={(e) =>
						updateGoalThreadField(
							thread.threadId,
							"measurementType",
							(e.target as HTMLSelectElement)
								.value as GoalThread["measurementType"],
						)}
				>
					<option value="time">Time</option>
					<option value="count">Count</option>
					<option value="none">Yes/No</option>
				</select>

				<button
					class={thread.isInitialized
						? "rounded bg-green-500/60 px-3 py-1 text-green-100 hover:bg-green-500/50"
						: "rounded bg-amber-500/30 px-3 py-1 text-amber-100 hover:bg-amber-500/50"}
					onclick={() => initGoalThread(thread.threadId)}
				>
					Init
				</button>

				<button
					class="rounded bg-green-600/30 px-3 py-1 text-white/50 hover:bg-green-700/80 hover:text-white"
					onclick={() => addGoalToThread(thread.threadId)}
				>
					+
				</button>

				<button
					class="rounded-lg bg-red-500/20 px-3 py-1 text-red-400 transition-colors hover:bg-red-500 hover:text-white"
					onclick={() => deleteGoalThread(thread.threadId)}
				>
					Del
				</button>
			</div>

			{#if thread.isPersisted}
				<div class="mt-2 text-sm text-emerald-300/80">
					Thread initialized
				</div>
			{/if}
		</div>

		<!-- Level 2 and Level 3 -->
		{#if thread.isExpanded}
			<div
				class="ml-10 mr-10 mt-2 space-y-2"
				in:fly={{ x: -20, duration: 250 }}
			>
				{#if thread.goals.length === 0}
					<div class="rounded-lg bg-white/5 p-3 text-white/50 italic">
						No goals inside this thread yet. Click the thread +
						button.
					</div>
				{/if}

				<!-- Level 2: Goal Rows -->
				{#each thread.goals as goal (goal.goalId)}
					<div class="rounded-xl bg-white/10 p-3">
						<div class="flex flex-wrap items-end gap-3">
							<button
								class="w-8 text-3xl text-white"
								onclick={() =>
									toggleGoal(thread.threadId, goal.goalId)}
							>
								{goal.isExpanded ? "▼" : "▷"}
							</button>

							<div class="flex min-w-64 flex-1 flex-col">
								<label
									class="invisible mb-1 text-xs text-white/40"
									>Title</label
								>
								<input
									type="text"
									class="rounded border border-white/20 bg-white/5 px-3 py-2 text-xl text-white placeholder-white/40"
									placeholder="Goal title..."
									value={goal.title}
									oninput={(e) =>
										updateGoalField(
											thread.threadId,
											goal.goalId,
											"title",
											(e.target as HTMLInputElement)
												.value,
										)}
								/>
							</div>

							<div class="flex min-w-64 flex-1 flex-col">
								<label
									class="invisible mb-1 text-xs text-white/40"
									>Description</label
								>
								<input
									type="text"
									class="rounded border border-white/20 bg-white/5 px-3 py-2 text-lg text-white placeholder-white/40"
									placeholder="Goal description..."
									value={goal.description}
									oninput={(e) =>
										updateGoalField(
											thread.threadId,
											goal.goalId,
											"description",
											(e.target as HTMLInputElement)
												.value,
										)}
								/>
							</div>

							<div class="flex flex-col">
								<label
									class="invisible mb-1 text-xs text-white/40"
									>Color</label
								>
								<input
									type="color"
									class="h-10 w-12 rounded border border-white/20 bg-white/10"
									value={goal.color}
									oninput={(e) =>
										updateGoalField(
											thread.threadId,
											goal.goalId,
											"color",
											(e.target as HTMLInputElement)
												.value,
										)}
								/>
							</div>

							<div class="flex flex-col">
								<label class="mb-1 text-xs text-white/40"
									>Start</label
								>
								<input
									type="date"
									class="rounded border border-white/20 bg-white/5 px-3 py-2 text-white"
									value={goal.dateStart}
									onkeydown={escapeDateInput}
									oninput={(e) =>
										updateGoalField(
											thread.threadId,
											goal.goalId,
											"dateStart",
											(e.target as HTMLInputElement)
												.value,
										)}
								/>
							</div>

							<div
								class={`flex flex-col ${
									goal.isPersisted
										? "opacity-30 pointer-events-none"
										: ""
								}`}
							>
								<label class="mb-1 text-xs text-white/40"
									>End</label
								>
								<input
									type="date"
									class="rounded border border-white/20 bg-white/5 px-3 py-2 text-white"
									value={goal.dateEnd}
									disabled={goal.isPersisted}
									onkeydown={escapeDateInput}
									oninput={(e) =>
										updateGoalField(
											thread.threadId,
											goal.goalId,
											"dateEnd",
											(e.target as HTMLInputElement)
												.value,
										)}
								/>
							</div>

							<div
								class={`flex flex-col ${
									isNoneMeasurementThread(thread)
										? "opacity-30 pointer-events-none"
										: ""
								}`}
							>
								<label class="mb-1 text-xs text-white/40"
									>Start Amt</label
								>
								<input
									type="number"
									class="w-28 rounded border border-white/20 bg-white/5 px-3 py-2 text-white"
									placeholder="Start"
									value={goal.startAmount}
									disabled={isNoneMeasurementThread(thread)}
									oninput={(e) =>
										updateGoalField(
											thread.threadId,
											goal.goalId,
											"startAmount",
											Number(
												(e.target as HTMLInputElement)
													.value,
											),
										)}
								/>
							</div>

							<div
								class={`flex flex-col ${
									isNoneMeasurementThread(thread)
										? "opacity-30 pointer-events-none"
										: ""
								}`}
							>
								<label class="mb-1 text-xs text-white/40"
									>Goal Amt</label
								>
								<input
									type="number"
									class="w-28 rounded border border-white/20 bg-white/5 px-3 py-2 text-white"
									placeholder="Amount"
									value={goal.measurementAmount}
									disabled={isNoneMeasurementThread(thread)}
									oninput={(e) =>
										updateGoalField(
											thread.threadId,
											goal.goalId,
											"measurementAmount",
											Number(
												(e.target as HTMLInputElement)
													.value,
											),
										)}
								/>
							</div>

							<div class="flex flex-col">
								<label
									class="invisible mb-1 text-xs text-white/40"
									>Iteration</label
								>
								<select
									class="rounded border border-white/20 bg-black/70 px-3 py-2 text-black"
									value={goal.iterationType}
									onchange={(e) =>
										updateGoalField(
											thread.threadId,
											goal.goalId,
											"iterationType",
											(e.target as HTMLSelectElement)
												.value as Goal["iterationType"],
										)}
								>
									<option value="day">Day</option>
									<option value="week">Week</option>
									<option value="month">Month</option>
								</select>
							</div>

							<div class="flex flex-col">
								<label
									class="invisible mb-1 text-xs text-white/40"
									>Every</label
								>
								<input
									type="number"
									class="w-28 rounded border border-white/20 bg-white/5 px-3 py-2 text-white"
									placeholder="Every..."
									value={goal.iterationAmount}
									oninput={(e) =>
										updateGoalField(
											thread.threadId,
											goal.goalId,
											"iterationAmount",
											Number(
												(e.target as HTMLInputElement)
													.value,
											),
										)}
								/>
							</div>

							<div
								class={`flex flex-col ${
									isNoneMeasurementThread(thread)
										? "opacity-30 pointer-events-none"
										: ""
								}`}
							>
								<label class="mb-1 text-xs text-white/40"
									>Low</label
								>
								<input
									type="number"
									class="w-24 rounded border border-white/20 bg-white/5 px-3 py-2 text-white"
									placeholder="Low"
									value={goal.lowLimit}
									disabled={isNoneMeasurementThread(thread)}
									oninput={(e) =>
										updateGoalField(
											thread.threadId,
											goal.goalId,
											"lowLimit",
											Number(
												(e.target as HTMLInputElement)
													.value,
											),
										)}
								/>
							</div>

							<div
								class={`flex flex-col ${
									isNoneMeasurementThread(thread)
										? "opacity-30 pointer-events-none"
										: ""
								}`}
							>
								<label class="mb-1 text-xs text-white/40"
									>High</label
								>
								<input
									type="number"
									class="w-24 rounded border border-white/20 bg-white/5 px-3 py-2 text-white"
									placeholder="High"
									value={goal.highLimit}
									disabled={isNoneMeasurementThread(thread)}
									oninput={(e) =>
										updateGoalField(
											thread.threadId,
											goal.goalId,
											"highLimit",
											Number(
												(e.target as HTMLInputElement)
													.value,
											),
										)}
								/>
							</div>

							<div class="flex flex-col">
								<label class="mb-1 text-xs text-white/40"
									>Max Fails</label
								>
								<input
									type="number"
									class="w-28 rounded border border-white/20 bg-white/5 px-3 py-2 text-white"
									placeholder="Max"
									value={goal.maxFailuresAllowed}
									oninput={(e) => {
										updateGoalField(
											thread.threadId,
											goal.goalId,
											"maxFailuresAllowed",
											Number(
												(e.target as HTMLInputElement)
													.value,
											),
										);
										updateGoalField(
											thread.threadId,
											goal.goalId,
											"failureCount",
											Number(
												(e.target as HTMLInputElement)
													.value,
											),
										);
									}}
								/>
							</div>

							<div class="flex min-w-64 flex-1 flex-col">
								<label class="mb-1 text-xs text-white/40"
									>Consequence</label
								>
								<input
									type="text"
									class="rounded border border-white/20 bg-white/5 px-3 py-2 text-white placeholder-white/40"
									placeholder="Consequence if not done..."
									value={goal.consequenceDescription}
									oninput={(e) =>
										updateGoalField(
											thread.threadId,
											goal.goalId,
											"consequenceDescription",
											(e.target as HTMLInputElement)
												.value,
										)}
								/>
							</div>

							<div class="flex flex-col">
								<label
									class="invisible mb-1 text-xs text-white/40"
									>Completed</label
								>
								<label
									class="flex h-10 items-center gap-2 rounded border border-white/10 bg-white/5 px-3 py-2 text-white/70"
								>
									<input
										type="checkbox"
										checked={goal.isCompleted}
										onchange={(e) =>
											handleGoalCompletedChange(
												thread.threadId,
												goal.goalId,
												(e.target as HTMLInputElement)
													.checked,
											)}
									/>
									Completed
								</label>
							</div>

							<div class="flex flex-col">
								<label
									class="invisible mb-1 text-xs text-white/40"
									>Persisting</label
								>
								<label
									class="flex h-10 items-center gap-2 rounded border border-white/10 bg-white/5 px-3 py-2 text-white/70"
								>
									<input
										type="checkbox"
										checked={goal.isPersisted}
										onchange={(e) =>
											updateGoalField(
												thread.threadId,
												goal.goalId,
												"isPersisted",
												(e.target as HTMLInputElement)
													.checked,
											)}
									/>
									Persisting
								</label>
							</div>

							<div class="flex flex-col">
								<label
									class="invisible mb-1 text-xs text-white/40"
									>Init</label
								>
								<button
									class={goal.isInitialized
										? "h-10 rounded bg-green-500/60 px-3 py-1 text-green-100 hover:bg-green-500/50"
										: "h-10 rounded bg-amber-500/30 px-3 py-1 text-amber-100 hover:bg-amber-500/50"}
									onclick={() =>
										initGoal(thread.threadId, goal.goalId)}
								>
									Init
								</button>
							</div>

							<div class="flex flex-col">
								<label
									class="invisible mb-1 text-xs text-white/40"
									>Delete</label
								>
								<button
									class="h-10 rounded-lg bg-red-500/20 px-3 py-1 text-red-400 transition-colors hover:bg-red-500 hover:text-white"
									onclick={() =>
										deleteGoalFromThread(
											thread.threadId,
											goal.goalId,
										)}
								>
									Del
								</button>
							</div>
						</div>
					</div>
				{/each}

				<!-- Level 3: Shared lineGrid -->
				{#if shouldShowThreadGrid(thread)}
					{@const axisLimit = getThreadAxisLimit(thread)}
					{@const dayNumbers = getMonthDayNumbers(thread)}
					{@const yAxisLabels = getYAxisLabels(axisLimit)}

					<div
						class="mt-4 rounded-xl border border-white/10 bg-black/30 p-3"
					>
						<div
							class="mb-3 flex items-center justify-between gap-4"
						>
							<button
								class="px-2 text-xl text-white hover:text-white/70"
								onclick={prevMonth}
							>
								◀
							</button>

							<div class="flex flex-col items-center gap-2">
								<div class="text-3xl font-semibold text-white">
									{getMonthName(displayMonth)}
									{displayYear}
								</div>

								<div class="flex items-center gap-3 text-sm">
									<label
										class="flex items-center gap-2 rounded border border-white/10 bg-white/5 px-3 py-1 text-white/70"
									>
										<input
											type="checkbox"
											checked={thread.iterateGoalMode}
											onchange={() =>
												toggleIterateGoalMode(thread)}
										/>

										Iterate Goal Mode
									</label>

									{#if thread.iterateGoalMode}
										<button
											class="rounded border border-white/20 bg-white/10 px-3 py-1
											text-white/70 hover:bg-white/20 hover:text-white"
											onclick={() =>
												cycleActiveGoal(thread)}
										>
											Next Goal
										</button>

										<div class="text-white/50">
											Viewing:
											{getActiveGoal(thread)?.title ||
												"Untitled Goal"}
										</div>
										<div class="text-white/50">
											Failures Remaining:
											{getActiveGoal(thread)
												?.failureCount ?? 0}
										</div>
									{:else}
										<div class="text-white/40">
											Thread Mode: read-only overview
										</div>
									{/if}
								</div>
							</div>

							<button
								class="px-2 text-xl text-white hover:text-white/70"
								onclick={nextMonth}
							>
								▶
							</button>
						</div>

						<div class="mb-2 text-md text-white/40">
							Y-axis: +{axisLimit} to -{axisLimit}
						</div>

						<div class="grid grid-cols-[4rem_1fr] gap-2">
							<!-- Y-axis labels -->
							<div
								class="relative h-[37rem] border-r border-white/20 pr-2"
							>
								{#each yAxisLabels as label}
									<div
										class="absolute right-2 -translate-y-1/2 text-xs text-white/50"
										style:top={getYPercent(
											label,
											axisLimit,
										) + "%"}
									>
										{label}
									</div>
								{/each}
							</div>

							<!-- Grid area -->
							<div
								class="relative h-[37rem] border border-white/20 bg-white/5"
							>
								<!-- Horizontal grid lines -->
								{#each yAxisLabels as label}
									<div
										class="absolute left-0 w-full border-t border-white/10"
										style:top={getYPercent(
											label,
											axisLimit,
										) + "%"}
									></div>
								{/each}

								<!-- Zero line -->
								<div
									class="absolute left-0 w-full border-t-2 border-white/40"
									style:top={getYPercent(0, axisLimit) + "%"}
								></div>

								<!-- Vertical day lines -->
								{#each dayNumbers as dayNumber}
									<div
										class="absolute top-0 h-full border-l border-white/10"
										style:left={((dayNumber - 1) /
											Math.max(
												dayNumbers.length - 1,
												1,
											)) *
											100 +
											"%"}
									></div>
								{/each}

								<!-- Goal lines and nodes -->
								{#each getVisibleGoalsForThread(thread) as plottedGoal (plottedGoal.goalId)}
									{@const plottedNodes =
										getPlottedNodesForGoal(
											thread,
											plottedGoal,
											axisLimit,
											dayNumbers.length,
										)}
									{@const highLimitPercent = getYPercent(
										Number(plottedGoal.highLimit ?? 0),
										axisLimit,
									)}
									{@const lowLimitPercent = getYPercent(
										Number(plottedGoal.lowLimit ?? 0),
										axisLimit,
									)}
									{@const measurementAmountPercent =
										getYPercent(
											Number(
												plottedGoal.measurementAmount ??
													0,
											),
											axisLimit,
										)}
									{@const goalLabelYOffset =
										getGoalLabelYOffset(
											thread,
											plottedGoal,
										)}

									{#if thread.iterateGoalMode && thread.measurementType !== "none"}
										<!-- Goal amount guide -->
										<div
											class="pointer-events-none absolute left-0 w-full border-t border-green-500 opacity-80"
											style:top={measurementAmountPercent +
												"%"}
										></div>

										<div
											class="pointer-events-none absolute left-2 rounded bg-black/80 px-2 py-0.5 text-sm text-green-500"
											style:top={"calc(" +
												measurementAmountPercent +
												"% + " +
												goalLabelYOffset +
												"px)"}
										>
											Goal {plottedGoal.measurementAmount}
										</div>
										<!-- High limit guide -->
										<div
											class="pointer-events-none absolute left-0 w-full border-2 border-dashed opacity-60"
											style:top={highLimitPercent + "%"}
											style:border-color={plottedGoal.color ??
												"#ffffff"}
										></div>

										<div
											class="pointer-events-none absolute left-2 -translate-y-1/2 rounded bg-black/80 px-2 py-0.5 text-sm"
											style:top={highLimitPercent + "%"}
											style:color="#ffffff"
										>
											High {plottedGoal.highLimit}
										</div>

										<!-- Low limit guide -->
										<div
											class="pointer-events-none absolute left-0 w-full border-2 border-dashed opacity-60"
											style:top={lowLimitPercent + "%"}
											style:border-color={plottedGoal.color ??
												"#ffffff"}
										></div>

										<div
											class="pointer-events-none absolute left-2 -translate-y-1/2 rounded bg-black/80 px-2 py-0.5 text-sm"
											style:top={lowLimitPercent + "%"}
											style:color="#ffffff"
										>
											Low {plottedGoal.lowLimit}
										</div>
									{/if}
									{@const latestNode =
										getLatestPlottedNode(plottedNodes)}
									{#if latestNode}
										<!-- Latest value horizontal guide -->
										<div
											class="pointer-events-none absolute left-0 w-full"
											style:top={latestNode.yPercent +
												"%"}
										></div>

										<div
											class="pointer-events-none absolute left-2 -translate-y-1/2 rounded bg-black/80 px-2 py-0.5 text-sm text-white"
											style:top={latestNode.yPercent +
												"%"}
										>
											{latestNode.entry.value}
										</div>
									{/if}
									<!-- Line layer -->
									<svg
										class="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
									>
										{#each plottedNodes as node, index (node.key)}
											{#if index > 0}
												{@const previousNode =
													plottedNodes[index - 1]}

												{#if node.entry.isConsequenceActive}
													<line
														x1={previousNode.xPercent +
															"%"}
														y1={previousNode.yPercent +
															"%"}
														x2={node.xPercent + "%"}
														y2={node.yPercent + "%"}
														stroke={getEntryLineColor(
															node.entry,
															plottedGoal,
														)}
														stroke-width="2"
														stroke-linecap="round"
														opacity={node.isPending
															? "0.45"
															: "0.9"}
														transform="translate(0,-3)"
													/>

													<line
														x1={previousNode.xPercent +
															"%"}
														y1={previousNode.yPercent +
															"%"}
														x2={node.xPercent + "%"}
														y2={node.yPercent + "%"}
														stroke={getEntryLineColor(
															node.entry,
															plottedGoal,
														)}
														stroke-width="2"
														stroke-linecap="round"
														opacity={node.isPending
															? "0.45"
															: "0.9"}
														transform="translate(0,3)"
													/>
												{:else}
													<line
														x1={previousNode.xPercent +
															"%"}
														y1={previousNode.yPercent +
															"%"}
														x2={node.xPercent + "%"}
														y2={node.yPercent + "%"}
														stroke={getEntryLineColor(
															node.entry,
															plottedGoal,
														)}
														stroke-width="2"
														stroke-linecap="round"
														opacity={node.isPending
															? "0.45"
															: "0.9"}
													/>
												{/if}
											{/if}
										{/each}
									</svg>

									<!-- Node layer -->
									{#each plottedNodes as node (node.key)}
										{#if node.entry.progressMarker && thread.measurementType !== "none"}
											<div
												class="pointer-events-none absolute top-0 h-full w-px bg-white/30"
												style:left={node.xPercent + "%"}
											></div>

											<div
												class="pointer-events-none absolute -translate-x-1/2 rounded-full bg-black/80 px-2 py-0.5 text-md font-bold text-white"
												style:left={node.xPercent + "%"}
												style:top={"calc(" +
													node.yPercent +
													"% - 70px)"}
											>
												{node.entry.value ?? 0}
											</div>
										{/if}

										<GoalEntryNode
											entry={node.entry}
											xPercent={node.xPercent}
											yPercent={node.yPercent}
											color={node.color}
											isPending={node.isPending}
											onOpen={(entry) => {
												if (!thread.iterateGoalMode)
													return;

												openGoalEntryEditor(
													thread,
													plottedGoal,
													entry,
												);
											}}
										/>
									{/each}
								{/each}
							</div>

							<div></div>

							<!-- X-axis day labels -->
							<div class="relative h-8">
								{#each dayNumbers as dayNumber}
									<div
										class="absolute -translate-x-1/2 text-lg text-white/50"
										style:left={((dayNumber - 1) /
											Math.max(
												dayNumbers.length - 1,
												1,
											)) *
											100 +
											"%"}
									>
										{dayNumber}
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/each}

{#if selectedGoalEntryData}
	<GoalEntryEditor
		thread={selectedGoalEntryData.thread}
		goal={selectedGoalEntryData.goal}
		entry={selectedGoalEntryData.entry}
		onDone={handleEntryDone}
		onNotDone={handleEntryNotDone}
		onUpdate={handleEntryUpdate}
		onCancel={closeGoalEntryEditor}
	/>
{/if}
{#if showInfoModal}
	<InfoModal
		title={infoModalTitle}
		message={infoModalMessage}
		onClose={closeInfoModal}
	/>
{/if}

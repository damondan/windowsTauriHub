<script lang="ts">
	import type { Goal, GoalEntry, GoalThread } from "$lib/stores/thegoals";

	interface Props {
		thread: GoalThread;
		goal: Goal;
		entry: GoalEntry;
		onDone: (
			entry: GoalEntry,
			value: number,
			description: string,
			consequenceCompleted: boolean,
			progressMarker:boolean
		) => void;
		onNotDone: (
			entry: GoalEntry,
			description: string,
			consequenceCompleted: boolean,
			progressMarker: boolean
		) => void;
		onUpdate: (
			entry: GoalEntry,
			description: string,
			consequenceCompleted: boolean,
			progressMarker: boolean
		) => void;
		onCancel: () => void;
	}

	let {
	thread,
	goal,
	entry,
	onDone,
	onNotDone,
	onUpdate,
	onCancel
}: Props = $props();

	let entryValue = $state<number>(Number(entry.value ?? 0));
	let entryDescription = $state<string>(entry.description ?? "");
	let isConsequenceActive = $state<boolean>(
		entry.isConsequenceActive ?? false,
	);
	let isMarkerOn = $state<boolean>(entry.progressMarker ?? false);

	const isNoneGoal = $derived(thread.measurementType === "none");
	const isCountGoal = $derived(thread.measurementType === "count");
	const isTimeGoal = $derived(thread.measurementType === "time");

	const question = $derived.by(() => {
		if (isCountGoal) {
			return `How many ${goal.title || "items"} did you do today?`;
		}

		if (isTimeGoal) {
			return `How long did you ${goal.title || "this goal"} today?`;
		}

		return `Did you fulfill your goal ${goal.title || "for today"}?`;
	});
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
	<div
		class="w-full max-w-2xl rounded-xl border border-white/20 bg-zinc-950 p-5 text-white shadow-xl"
	>
		<div class="mb-4 flex items-start justify-between gap-4">
			<div>
				<h2 class="text-2xl font-semibold">Goal Entry</h2>

				<p class="mt-1 text-white/60">
					{question}
				</p>
			</div>

			<button
				type="button"
				class="rounded bg-white/10 px-3 py-1 text-white/60 hover:bg-white/20 hover:text-white"
				onclick={onCancel}
			>
				X
			</button>
		</div>

		<div class="space-y-4">
			<div class="flex flex-col">
				<label class="mb-1 text-sm text-white/50"> Description </label>

				<textarea
					rows="3"
					class="resize-none rounded border border-white/20 bg-white/5 px-3 py-2 text-white placeholder-white/30"
					placeholder="Add notes about this entry..."
					bind:value={entryDescription}
				></textarea>
			</div>

			<div class="flex flex-col">
				<label class="mb-1 text-sm text-white/50"> Value </label>

				<input
					type="number"
					class={`rounded border border-white/20 px-3 py-2 text-white ${
						isNoneGoal
							? "cursor-not-allowed bg-white/5 opacity-30"
							: "bg-white/5"
					}`}
					placeholder={isTimeGoal
						? "Time amount..."
						: isCountGoal
							? "Count amount..."
							: "Disabled for yes/no goal"}
					bind:value={entryValue}
					disabled={isNoneGoal}
				/>
			</div>

			<div class="flex flex-col">
				<label class="mb-1 text-sm text-white/50"> Consequence </label>

				<textarea
					rows="2"
					class="resize-none rounded border border-white/20 bg-white/5 px-3 py-2 text-white/70 placeholder-white/30"
					value={goal.consequenceDescription ?? ""}
					readonly
				></textarea>
			</div>
			<div class="flex flex-row">
				<label
					class="flex items-center gap-2 rounded border border-white/10 bg-white/5 px-3 py-2 text-white/70 mx-auto"
				>
					<input type="checkbox" bind:checked={isConsequenceActive} />

					Consequence Active?
				</label>
				<label
					class="flex items-center gap-2 rounded border border-white/10 bg-white/5 px-3 py-2 text-white/70 mx-auto"
				>
					<input type="checkbox" bind:checked={isMarkerOn} />

					Set Progress Marker?
				</label>
			</div>
		</div>

		<div class="mt-5 flex justify-end gap-3">
	<button
		type="button"
		class="rounded bg-blue-500/20 px-4 py-2 text-blue-200 hover:bg-blue-500 hover:text-white"
		onclick={() =>
			onUpdate(
				entry,
				entryDescription,
				isConsequenceActive,
				isMarkerOn
			)}
	>
		Update
	</button>

	<button
		type="button"
		class="rounded bg-white/10 px-4 py-2 text-white/60 hover:bg-white/20 hover:text-white"
		onclick={onCancel}
	>
		Cancel
	</button>

			{#if isNoneGoal}
				<button
					type="button"
					class="rounded bg-red-500/20 px-4 py-2 text-red-300 hover:bg-red-500 hover:text-white"
					onclick={() =>
						onNotDone(entry, entryDescription, true, isMarkerOn)}
				>
					No
				</button>

				<button
					type="button"
					class="rounded bg-emerald-500/30 px-4 py-2 text-emerald-100 hover:bg-emerald-500 hover:text-white"
					onclick={() =>
						onDone(
							entry,
							0,
							entryDescription,
							isConsequenceActive,
							isMarkerOn,
						)}
				>
					Yes
				</button>
			{:else}
				<button
					type="button"
					class="rounded bg-red-500/20 px-4 py-2 text-red-300 hover:bg-red-500 hover:text-white"
					onclick={() =>
						onNotDone(entry, entryDescription, true, isMarkerOn)}
				>
					Not Done
				</button>

				<button
					type="button"
					class="rounded bg-emerald-500/30 px-4 py-2 text-emerald-100 hover:bg-emerald-500 hover:text-white"
					onclick={() =>
						onDone(
							entry,
							Number(entryValue),
							entryDescription,
							isConsequenceActive,
							isMarkerOn,
						)}
				>
					Done
				</button>
			{/if}
		</div>
	</div>
</div>

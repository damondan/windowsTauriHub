<script lang="ts">
	import type { GoalEntry } from '$lib/stores/thegoals';

	interface Props {
		entry: GoalEntry;
		xPercent: number;
		yPercent: number;
		color?: string;
		isPending?: boolean;
		onOpen: (entry: GoalEntry) => void;
	}

	let {
		entry,
		xPercent,
		yPercent,
		color = '#ffffff',
		isPending = false,
		onOpen
	}: Props = $props();
</script>

<button
	type="button"
	class="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white transition-transform hover:scale-125"
	class:opacity-50={isPending}
	style:left={xPercent + '%'}
	style:top={yPercent + '%'}
	style:background-color={color}
	title={entry.description ?? 'Goal entry'}
	onclick={() => onOpen(entry)}
></button>
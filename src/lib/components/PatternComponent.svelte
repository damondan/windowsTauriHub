<script lang="ts">
   import type { HighlightLevel2 } from "$lib/stores/profgoal";
    import  ChevronRight from "@lucide/svelte/icons/chevron-right";

    interface Props {
    id: string;
    childid: string;
    levelTwo: HighlightLevel2;

    updatePatternSteps: (
        id: string,
        childid: string,
        patternId: string,
        valueIndex: number,
        value: string,
    ) => void;

    initStep: (id: string, childid: string, patternId: string) => void;
    removeStep: (id: string, childid: string, patternId: string) => void;
}

let {
    id,
    childid,
    levelTwo,
    updatePatternSteps,
    initStep,
    removeStep,
}: Props = $props();
 
</script>

<div class="ml-15 flex items-center px-16 w-[90%] mt-0">
	<div class="w-6 mr-2 flex-none"></div>

	<div class="flex-1 flex flex-col">
	{#each Object.entries(levelTwo.patterns ?? {}) as [patternId, values]}
		<div class="flex flex-row flex-wrap gap-2 items-center py-3 my-2">
			{#if patternId != ""}
				<div class="flex flex-col mr-6">
					<button
						class="bg-white/15 hover:bg-emerald-400/25
						text-emerald-200 hover:text-emerald-50
						px-3 py-1 rounded-lg transition-colors"
						onclick={() => initStep(id, childid, patternId)}
					>
						+
					</button>

					<button
						class="bg-white/15 hover:bg-rose-400/25
						text-rose-200 hover:text-rose-50
						px-3 py-1 rounded-lg transition-colors"
						onclick={() => removeStep(id, childid, patternId)}
					>
						-
					</button>
				</div>
			{/if}

			{#each values as value, valueIndex}
				{#if valueIndex > 0}
					<ChevronRight
						class="mt-5 mr-2 w-10 h-10 
						text-gray-400
						hover:text-green-500
						hover:translate-x-4
						transition-all
						duration-200"
					/>
				{/if}

				<input
					type="text"
					{value}
					placeholder="step?"
					oninput={(e) => {
						updatePatternSteps(
							id,
							childid,
							patternId,
							valueIndex,
							(e.target as HTMLInputElement).value,
						);
					}}
					class={`patternstep mt-4 bg-transparent border rounded px-2 py-1 text-center text-xl outline-none w-64 mr-5
					${valueIndex === values.length - 1
						? "border-4 border-green-400/30 text-green-700"
						: "border-white/10 text-white"}`}
				/>
			{/each}
		</div>
	{/each}
</div>
</div>
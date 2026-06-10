<script lang="ts">
	interface Props {
		message: string;
		title?: string;
		onClose: () => void;
	}

	let {
		message,
		title = "Notice",
		onClose
	}: Props = $props();
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
	<div
		class="w-full max-w-xl rounded-2xl border border-white/20 
		bg-gradient-to-t from-black via-zinc-900 to-white/20 
		p-6 text-white shadow-2xl"
	>
		<div class="mb-4 border-b border-white/20 pb-2">
			<h2 class="text-2xl font-semibold text-white/90">
				{title}
			</h2>
		</div>

		<p class="whitespace-pre-line text-lg leading-relaxed text-white/80">
			{message}
		</p>

		<div class="mt-6 flex justify-end">
			<button
				type="button"
				class="rounded-lg border border-white/30 bg-black/40 px-4 py-2 
				text-white/80 hover:border-white hover:bg-white/10 hover:text-white"
				onclick={onClose}
			>
				OK
			</button>
		</div>
	</div>
</div>
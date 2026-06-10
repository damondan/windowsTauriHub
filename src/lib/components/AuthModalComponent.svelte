<script lang="ts">
import { onMount, tick } from 'svelte';
	type Props = {
		passwordInput: string;
		cancelAuth: () => void;
		submitAuth: (password: string) => void;
	};

	let {
		passwordInput = $bindable(""),
		cancelAuth,
		submitAuth
	}: Props = $props();

	function focusOnMount(node: HTMLInputElement) {
		node.focus();
	}

	onMount(async () => {
		console.log(`AuthModal mounted`);
	})

</script>

<div class="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
	<div class="bg-zinc-900 rounded-xl p-6 w-[400px] shadow-xl">
		<h2 class="text-xl font-semibold text-white mb-4">
			Enter Password
		</h2>

		<form
			onsubmit={(e) => {
				e.preventDefault();
				submitAuth(passwordInput);
			}}
		>
			<input
				use:focusOnMount
				type="password"
				bind:value={passwordInput}
				placeholder="Password"
				class="w-full px-4 py-2 rounded-lg bg-zinc-800 text-white outline-none border border-zinc-700 mb-4"
			/>

			<div class="flex justify-end gap-3">
				<button
					type="button"
					onclick={cancelAuth}
					class="px-4 py-2 rounded-lg bg-zinc-700 text-white"
				>
					Cancel
				</button>

				<button
					type="submit"
					class="px-4 py-2 rounded-lg bg-blue-600 text-white"
				>
					Submit
				</button>
			</div>
		</form>
	</div>
</div>
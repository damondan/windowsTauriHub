<!-- src/lib/components/Navigation.svelte -->
<script lang="ts">
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { get } from "svelte/store";
	import {
		pass,
		authError,
		authTargetTab,
		showAuthModal,
		unlockPers,
		initLoginWithEncryption,
	} from "$lib/stores/auth";
	import {
		persLockState,
		LockState,
		persGoalData,
		persGoalHighlights,
	} from "$lib/stores/persgoal";
	import { goalData, hasPendingGoalForDate } from "$lib/stores/thegoals";
	import AuthModalComponent from "./AuthModalComponent.svelte";
	import { onMount } from "svelte";

	let passwordInput = $state("");
	let hasPendingGoalToday = $state(false);

	const tabs = [
		{ path: "/", label: "Services" },
		{ path: "/personal", label: "Pers" },
		{ path: "/articulate", label: "Artic" },
		{ path: "/professional", label: "Prof" },
		{ path: "/finances", label: "Finance" },
		{ path: "/thegoals", label: "Goals" },
		{ path: "/todo", label: "ToDo" },
		{ path: "/howto", label: "HowTo" },
		{ path: "/commands", label: "Commands" },
		{ path: "/notifications", label: "Notifs" },
		{ path: "/projects", label: "Logs" },
		{ path: "/workspace_a", label: "XSpaceA" },
		{ path: "/workspace_b", label: "XSpaceB" },
	];

	onMount(() => {
		$effect(() => {
			const today = new Date();

			hasPendingGoalToday = hasPendingGoalForDate($goalData, today);
		});
	});

	export function cancelAuth() {
		showAuthModal.set(false);
		authTargetTab.set(null);
		authError.set(null);
	}

	export async function submitAuth(password: string) {
		console.log("[AUTH] In submitAuth");

		passwordInput = "";
		let success = false;
		pass.set(password);

		const lockState = get(persLockState);

		try {
			if (lockState === LockState.NOT_SET) {
				console.log("[AUTH] Starting initLoginWithEncryption");

				success = await initLoginWithEncryption(password);

				console.log(
					"[AUTH] Finished initLoginWithEncryption:",
					success,
				);

				// CHANGED:
				// Converted second if to else-if so only one branch executes
			} else if (lockState === LockState.LOCKED) {
				console.log("[AUTH] Starting unlockPers");

				success = await unlockPers(password);

				console.log("[AUTH] Finished unlockPers:", success);

				// NEW:
				// Handle already unlocked state explicitly
			} else {
				success = true;
			}

			// NEW:
			// Single try/catch around all auth operations
		} catch (e) {
			console.error("[AUTH] Auth/decrypt error:", e);

			authError.set("Authentication failed");

			// NEW:
			// Return immediately on exception
			return false;
		}

		// NEW:
		// Early return if auth failed
		if (!success) {
			authError.set("Incorrect password");
			return false;
		}

		// CHANGED:
		// Navigation target retrieved AFTER successful auth/decrypt
		const target = get(authTargetTab);

		showAuthModal.set(false);
		authError.set(null);

		if (target) {
			// CHANGED:
			// Await navigation so it happens after decrypt completion
			await goto(target);

			authTargetTab.set(null);
		}

		// NEW:
		// Explicit success return
		return true;
	}

	function setlock() {
		console.log(`In setLock and setting to locked`);
		persLockState.set(LockState.LOCKED);

		persGoalData.set([]);
		persGoalHighlights.set({});
	}
</script>

<nav class="flex gap-2 mb-6 border-b border-white/20 pb-2 font-mono">
	{#each tabs as tab}
		<button
			onclick={() => {
				console.log("tab:", tab.path);

				if (
					($persLockState == LockState.LOCKED ||
						$persLockState == LockState.NOT_SET) &&
					tab.label == "Pers"
				) {
					authTargetTab.set(tab.path);
					showAuthModal.set(true);
					//return exits onclick
					return;
				}

				console.log("about to go to goto");
				goto(tab.path);
			}}
			ondblclick={() => setlock()}
			class="px-6 py-3 rounded-t-lg font-semibold transition-all
			{page.url.pathname === tab.path
				? 'bg-white/20 border-b-2 border-white text-white'
				: tab.label === 'Goals' && hasPendingGoalToday
					? 'bg-green-400/10 border-b-2 border-green-400/50 text-green-100 hover:bg-green-400/15'
					: 'bg-white/5 hover:bg-white/10 text-white/30'}"
		>
			{tab.label}
		</button>
	{/each}
</nav>

{#if $showAuthModal}
	<AuthModalComponent bind:passwordInput {cancelAuth} {submitAuth} />
{/if}

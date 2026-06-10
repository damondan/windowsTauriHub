<script lang="ts">
	import "../app.css";
	import favicon from "$lib/assets/favicon.svg";
	import { onMount, onDestroy } from "svelte";
	import { invoke } from "@tauri-apps/api/core";
	import {Play, Pause, Square} from "@lucide/svelte";
	import Navigation from "$lib/components/Navigation.svelte";
	import {
		loadUserData,
		loadUserDataEncryption,
		initPersistence,
		setHydrated,
		saveUserData,
		saveUserEncryptionData,
	} from "$lib/persistence";
	import { persLockState, LockState } from "$lib/stores/persgoal";
	import { get } from "svelte/store";

	let backupStatus = $state<"idle" | "saving" | "done">("idle");

	let ramUsed = $state(0);
	let ramTotal = $state(0);
	let ramPercent = $state(0);
	let gpuUsed = $state(0);
	let gpuTotal = $state(0);
	let gpuPercent = $state(0);
	let gpuAvailable = $state(true);
	let diskTotal = $state(0);
	let diskAvailable = $state(0);
	let diskUsed = $state(0);
	let recordingStatus: RecordingStatus = $state("Idle");
	let transcribedText = $state("");
	let inputLanguage = $state<"en" | "es">("en");
	let outputLanguage = $state<"en" | "es">("en");
	let { children } = $props();
	let audio: HTMLAudioElement | null = null;

	type RecordingStatus = "Idle" | "Recording" | "Paused" | "Processing";

	let showFocus = $state(false);
	let hideTop = $state(false);
	let hasPendingGoalToday = $state(false);

	async function bootstrapApp() {
		await loadUserData();

		await loadUserDataEncryption();

		if (get(persLockState) === LockState.UNLOCKED) {
			persLockState.set(LockState.LOCKED);
		}
		console.log(
			`in onMount before initPersistence and lock state is ${get(persLockState)}`,
		);
		initPersistence();
		setHydrated(true);
	}

	onMount(() => {
		console.log(`in onMount`);
		bootstrapApp();

		updateRamUsage();
		updateGpuUsage();
		updateDiskUsage();
		// Update RAM and GPU every 500ms
		const ramInterval = setInterval(updateRamUsage, 1000);
		const gpuInterval = setInterval(updateGpuUsage, 1000);
		const diskInterval = setInterval(updateDiskUsage, 1000);

		//Play background audio
		// audio = new Audio("/jorelToSuperman.mp3");
		// audio
		// 	.play()
		// 	.catch((err) => console.log("Audio autoplay blocked:", err));

		return () => {
			clearInterval(ramInterval);
			clearInterval(gpuInterval);
			clearInterval(diskInterval);
			if (audio) {
				audio.pause();
				audio.src = "";
			}
		};
	});

	// Clean up when component unmounts
	// onDestroy(): void
	onDestroy(() => {
		if (audio) {
			audio.pause();
			audio.src = "";
			audio = null;
		}
	});

	// backupData(): Promise<void>
	// Invokes backup_user_data Rust command and shows brief status feedback
	async function backupData() {
		console.log(`IN back up data function`);
		alert("Backing up data");
		try {
			backupStatus = "saving";
			await invoke("backup_user_data");
			backupStatus = "done";
			setTimeout(() => {
				backupStatus = "idle";
			}, 2000);
		} catch (error) {
			console.error("Failed to backup:", error);
			backupStatus = "idle";
		}
	}

	async function updateRamUsage() {
		try {
			const [used, total, percent] =
				await invoke<[number, number, number]>("get_ram_usage");
			ramUsed = used;
			ramTotal = total;
			ramPercent = percent;
		} catch (error) {
			console.error("Failed to get RAM usage:", error);
		}
	}

	async function updateGpuUsage() {
		try {
			const [used, total, percent] =
				await invoke<[number, number, number]>("get_gpu_usage");
			gpuUsed = used;
			gpuTotal = total;
			gpuPercent = percent;
			gpuAvailable = true;
		} catch (error) {
			console.error("Failed to get GPU usage:", error);
			gpuAvailable = false;
		}
	}

	async function updateDiskUsage() {
		try {
			const [used, avail, total] =
				await invoke<[number, number, number]>("get_disk_usage");
			diskUsed = used;
			diskAvailable = avail;
			diskTotal = total;
		} catch (error) {
			console.error("Failed to get DISK usage:", error);
		}
	}

	function handlePlayPause() {
		console.log("in handlePlayPause");
		if (recordingStatus === "Idle") {
			startRecording();
		} else if (recordingStatus === "Recording") {
			pauseRecording();
		} else if (recordingStatus === "Paused") {
			resumeRecording();
		}
	}

	// Speech-to-text functions
	async function startRecording() {
		try {
			await invoke("start_recording");
			recordingStatus = "Recording";
			transcribedText = "";
		} catch (error) {
			console.error("Failed to start recording:", error);
			alert("Failed to start recording: " + error);
		}
	}

	async function pauseRecording() {
		try {
			await invoke("pause_recording");
			recordingStatus = "Paused";
		} catch (error) {
			console.error("Failed to pause recording:", error);
			alert("Failed to pause recording: " + error);
		}
	}

	async function resumeRecording() {
		try {
			await invoke("resume_recording");
			recordingStatus = "Recording";
		} catch (error) {
			console.error("Failed to resume recording:", error);
			alert("Failed to resume recording: " + error);
		}
	}

	async function stopRecordingAndTranscribe() {
		try {
			recordingStatus = "Processing";
			const text = await invoke<string>("stop_recording_and_transcribe", {
				inputLang: inputLanguage,
				outputLang: outputLanguage,
			});
			transcribedText = text;
			recordingStatus = "Idle";
		} catch (error) {
			console.error("Failed to stop and transcribe:", error);
			alert("Failed to transcribe: " + error);
			recordingStatus = "Idle";
		}
	}

	function handleBackup() {
		console.log("✅ Backup button clicked");

		backupData(); // or whatever your actual backup function is
	}

	// Language selection handlers
	function handleInputLanguageChange(lang: "en" | "es") {
		inputLanguage = lang;
		// If switching to English input and Spanish output is selected, reset to English output
		if (lang === "en" && outputLanguage === "es") {
			outputLanguage = "en";
		}
	}

	function handleOutputLanguageChange(lang: "en" | "es") {
		// Prevent EN input -> SP output (invalid combination)
		if (inputLanguage === "en" && lang === "es") {
			return; // Disallow this combination
		}
		outputLanguage = lang;
	}

	// Keyboard shortcuts handler
	function handleKeydown(e: KeyboardEvent) {
		// Ignore modifier keys by themselves
		if (
			e.key === "Control" ||
			e.key === "Shift" ||
			e.key === "Alt" ||
			e.key === "Meta"
		) {
			return;
		}

		if (e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
			if (e.key === "3") {
				e.preventDefault();
				console.log("Alt+3 detected! Starting handlePlayPause");
				handlePlayPause();
			} else if (e.key === "4") {
				e.preventDefault();
				console.log("Alt+4 detected! Status:", recordingStatus);
				if (
					recordingStatus !== "Idle" &&
					recordingStatus !== "Processing"
				) {
					stopRecordingAndTranscribe();
				}
			}
		}
	}

	let focusTextClass = $derived(showFocus ? "text-white/30" : "text-white");
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<svelte:window on:keydown={handleKeydown} />

<div class="h-screen bg-black overflow-y-auto font-mono">
	<button
		class="mt-4 w-10 h-8 rounded p-1 border border-transparent bg-white/10 hover:border-white float-right transition-all"
		onclick={() => (hideTop = !hideTop)}
	>
	</button>
	<div class="mx-auto px-8 py-4 max-w-[95%]">
		<div
			class={hideTop
				? "h-0 min-h-0 max-h-0 p-0 m-0 opacity-0 overflow-hidden border-0 flex-none scale-y-0 origin-top"
				: ""}
		>
			<div class="bg-white/10 backdrop-blur-sm rounded-xl p-1 mb-2">
				<div class="grid grid-cols-2 gap-6">
					<!-- RAM Monitor -->
					<div class="flex items-center gap-4">
						<span
							class="text-white font-semibold text-lg {focusTextClass}"
							>RAM:</span
						>
						<div class="flex-1">
							<div class="flex items-center gap-2">
								<span
									class="text-sm {showFocus
										? 'text-white/30'
										: 'text-white'}"
								>
									{ramUsed.toFixed(2)} GB / {ramTotal.toFixed(
										2,
									)} GB
								</span>
								<span class="text-white/60 text-sm"
									>({ramPercent.toFixed(1)}%)</span
								>
							</div>
							<div
								class="w-full bg-gray-700 rounded-full h-2 mt-2"
							>
								<div
									class="h-2 rounded-full transition-all duration-300
    								{showFocus
										? 'bg-white/30'
										: ramPercent < 50
											? 'bg-green-500/70'
											: ramPercent < 80
												? 'bg-yellow-500'
												: 'bg-red-500'}"
									style="width: {ramPercent}%"
								></div>
							</div>
						</div>
					</div>

					<!-- GPU Monitor -->
					<div class="flex items-center gap-4">
						<span
							class="text-white font-semibold text-lg {showFocus
								? 'text-white/30'
								: 'text-white'}">GPU:</span
						>
						<div class="flex-1">
							{#if gpuAvailable}
								<div class="flex items-center gap-2">
									<span
										class="text-white text-sm {showFocus
											? 'text-white/30'
											: 'text-white'}"
									>
										{gpuUsed.toFixed(2)} GB / {gpuTotal.toFixed(
											2,
										)} GB
									</span>
									<span class="text-white/60 text-sm"
										>({gpuPercent.toFixed(1)}%)</span
									>
								</div>
								<div
									class="w-full bg-gray-700 rounded-full h-2 mt-2"
								>
									<div
										class="h-2 rounded-full transition-all duration-300
									{showFocus
											? 'bg-white/30'
											: gpuPercent < 50
												? 'bg-green-500/70'
												: gpuPercent >= 50 &&
													  gpuPercent < 80
													? 'bg-yellow-500'
													: 'bg-red-500'}"
										style="width: {gpuPercent}%"
									></div>
								</div>
							{:else}
								<span class="text-white/60 text-sm"
									>No NVIDIA GPU detected</span
								>
							{/if}
						</div>
						<button
							class="rounded text-sm p-1 bg-white/10 text-white/30 hover:bg-black/70 hover:text-white/80 float-right transition-all"
							onclick={() => (showFocus = !showFocus)}
						>
							Dim
						</button>
					</div>
				</div>
			</div>

			<!-- Speech To Text -->
			<div class="flex flex-wrap gap-4 mb-4 items-stretch">
				<!-- Backup Button -->
				<button
					onclick={handleBackup}
					disabled={backupStatus === "saving"}
					class="px-3 h-[52px] rounded-lg font-semibold text-sm transition-all
						{showFocus
						? 'bg-white/30'
						: backupStatus === 'done'
							? 'bg-green-600/40'
							: 'bg-blue-600/30 hover:bg-blue-700'}
						text-white/70 disabled:opacity-50"
				>
					{#if backupStatus === "saving"}
						💾...
					{:else if backupStatus === "done"}
						✅
					{:else}
						💾
					{/if}
				</button>

				<!-- Disk Usage and Language Selection -->
				<div class="flex flex-col justify-between h-[52px]">
					<!--Disk Usage-->
					<h1
						class="text-lg leading-tight {showFocus
							? 'text-white/30'
							: 'text-white'}"
					>
						AD {(diskAvailable / 1073741824).toFixed(1)}
					</h1>

					<!-- Language Selection -->
					<div class="flex flex-col gap-0.5 text-xs">
						<!-- English row -->
						<div
							class="flex items-center gap-2 {showFocus
								? 'text-white/30'
								: 'text-white'}"
						>
							<span class="w-6">en</span>
							<label
								class="flex items-center gap-1 cursor-pointer"
							>
								<input
									type="checkbox"
									checked={inputLanguage === "en"}
									onchange={() =>
										handleInputLanguageChange("en")}
									class="w-3 h-3 cursor-pointer {showFocus
										? 'opacity-50'
										: 'opacity-80'}"
								/>
								<span class="text-[10px]">in</span>
							</label>
							<label
								class="flex items-center gap-1 cursor-pointer"
							>
								<input
									type="checkbox"
									checked={outputLanguage === "en"}
									onchange={() =>
										handleOutputLanguageChange("en")}
									class="w-3 h-3 cursor-pointer {showFocus
										? 'opacity-50'
										: 'opacity-80'}"
								/>
								<span class="text-[10px]">out</span>
							</label>
						</div>

						<!-- Spanish row -->
						<div
							class="flex items-center gap-2 {showFocus
								? 'text-white/30'
								: 'text-white'}"
						>
							<span class="w-6">sp</span>
							<label
								class="flex items-center gap-1 cursor-pointer"
							>
								<input
									type="checkbox"
									checked={inputLanguage === "es"}
									onchange={() =>
										handleInputLanguageChange("es")}
									class="w-3 h-3 cursor-pointer {showFocus
										? 'opacity-50'
										: 'opacity-80'}"
								/>
								<span class="text-[10px]">in</span>
							</label>
							<label
								class="flex items-center gap-1 cursor-pointer"
								class:opacity-50={inputLanguage === "en"}
								class:cursor-not-allowed={inputLanguage ===
									"en"}
							>
								<input
									type="checkbox"
									checked={outputLanguage === "es"}
									onchange={() =>
										handleOutputLanguageChange("es")}
									disabled={inputLanguage === "en"}
									class="w-3 h-3 {showFocus
										? 'opacity-50'
										: 'opacity-80'}"
									class:cursor-pointer={inputLanguage !==
										"en"}
									class:cursor-not-allowed={inputLanguage ===
										"en"}
								/>
								<span class="text-[10px]">out</span>
							</label>
						</div>
					</div>
				</div>
				<!-- Speech to Text Controls -->
				<div
					class="bg-white/10 backdrop-blur-sm rounded-2xl p-1 w-55 h-[52px]"
				>
					<div class="flex items-center gap-2">
						<!-- Play/Pause Button -->
						<button
							onclick={handlePlayPause}
							disabled={recordingStatus === "Processing"}
							class="w-12 h-12 rounded-lg font-bold text-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
							class:bg-green-800={recordingStatus === "Recording"}
							class:hover:bg-green-900={recordingStatus ===
								"Recording"}
							class:bg-yellow-700={recordingStatus === "Paused"}
							class:hover:bg-yellow-800={recordingStatus ===
								"Paused"}
							class:bg-gray-700={recordingStatus === "Idle"}
							class:hover:bg-gray-600={recordingStatus === "Idle"}
							class:text-white={true}
						>
							{#if recordingStatus === "Recording"}
								 <Pause class="w-10 h-10 text-amber-300/40" />
							{:else if recordingStatus === "Processing"}
								⏳
							{:else}
								{#if showFocus}
									<Play class="w-10 h-10 text-amber-300/40" />
								{/if}
								{#if !showFocus}
									<Play class="w-10 h-10 text-amber-300/70" />
								{/if}
							{/if}
						</button>

						<!-- Stop Button -->
						<button
							onclick={stopRecordingAndTranscribe}
							disabled={recordingStatus === "Idle" ||
								recordingStatus === "Processing"}
							class="w-12 h-12 rounded-lg bg-red-600/50 hover:bg-red-700 text-white font-bold text-xl
						transition-all disabled:opacity-30 disabled:cursor-not-allowed"
						>
							<Square class="w-10 h-10 text-amber-300" />
						</button>

						<!-- Status Text -->
						<div class="ml-2 flex-1">
							<p
								class="font-semibold text-sm {showFocus
									? 'text-white/30'
									: 'text-white'}"
							>
								{#if recordingStatus === "Recording"}
									Recording...
								{:else if recordingStatus === "Paused"}
									Paused
								{:else if recordingStatus === "Processing"}
									Processing...
								{:else}
									Ready
								{/if}
							</p>
							{#if transcribedText}
								<p class="text-green-300/70 text-xs mt-0.5">
									✓ Copied
								</p>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>

		<Navigation />
		{@render children?.()}
	</div>
</div>

<script lang="ts">
	import { onMount } from "svelte";
	import { invoke } from "@tauri-apps/api/core";
	import type { TauriApp } from "$lib/types";
	import { borderNTextNBg, } from "$lib/styles";

	let apps = $state<TauriApp[]>([]);
	let loading = $state(false);
	let showAddDialog = $state(false);
	// let ossecRunning = $state(false);
	// let alertsLogModified = $state(false);
	// let ossecNotificationsEnabled = $state(true);
	// let showOssecTooltip = $state(false);
	// let ossecTooltipTimeout: number | null = null;
	// let showAideTooltip = $state(false);
	// let aideTooltipTimeout: number | null = null;
	// let showAideUpdateTooltip = $state(false);
	// let aideUpdateTooltipTimeout: number | null = null;
	// let aideLastCheckDate = $state("");
	// let aideRunning = false;
	// let opensnitchRunning = $state(false);
	// let showOpenSnitchTooltip = $state(false);
	// let openSnitchTooltipTimeout: number | null = null;
	// let openwebuiRunning = $state(false);
	// let lmstudioRunning = $state(false);
	// let ollamaRunning = $state(false);
	// let warpRunning = $state(false);
	// let dockerEnabled = $state(false);
	// let dockerActive = $state(false);
	// let dockerDesktopEnabled = $state(false);
	// let dockerDesktopActive = $state(false);

	let contextMenu = $state<{
		show: boolean;
		x: number;
		y: number;
		appId: string;
	}>({
		show: false,
		x: 0,
		y: 0,
		appId: "",
	});
	let newApp = $state<{
		id: string;
		name: string;
		description: string;
		path: string;
		executable: string;
		icon: string;
	}>({
		id: "",
		name: "",
		description: "",
		path: "",
		executable: "",
		icon: "",
	});

	async function loadApps() {
		loading = true;
		try {
			apps = await invoke<TauriApp[]>("get_registered_apps");
		} catch (error) {
			console.error("Failed to load apps:", error);
		} finally {
			loading = false;
		}
	}

	async function launchApp(appId: string) {
		try {
			await invoke("launch_app", { appId });
			await loadApps(); // Refresh to get updated status
		} catch (error) {
			console.error("Failed to launch app:", error);
			alert("Failed to launch app: " + error);
		}
	}

	async function stopApp(appId: string) {
		try {
			await invoke("stop_app", { appId });
			await loadApps(); // Refresh to get updated status
		} catch (error) {
			console.error("Failed to stop app:", error);
			alert("Failed to stop app: " + error);
		}
	}

	async function addApp() {
		if (!newApp.name || !newApp.path || !newApp.executable) {
			alert("Please fill in all required fields");
			return;
		}

		newApp.id = Date.now().toString(); // Simple ID generation

		try {
			const appToAdd = {
				...newApp,
				status: "Stopped" as const,
			};
			await invoke("register_app", { app: appToAdd });
			showAddDialog = false;
			newApp = {
				id: "",
				name: "",
				description: "",
				path: "",
				executable: "",
				icon: "",
			};
			await loadApps();
		} catch (error) {
			console.error("Failed to add app:", error);
			alert("Failed to add app: " + error);
		}
	}

	function showContextMenu(event: MouseEvent, appId: string) {
		event.preventDefault();
		contextMenu = {
			show: true,
			x: event.clientX,
			y: event.clientY,
			appId,
		};
	}

	function hideContextMenu() {
		contextMenu.show = false;
	}

	async function removeApp(appId: string) {
		try {
			await invoke("remove_app", { appId });
			hideContextMenu();
			await loadApps();
		} catch (error) {
			console.error("Failed to remove app:", error);
			alert("Failed to remove app: " + error);
		}
	}

	function getStatusColor(status: string) {
		switch (status) {
			case "Running":
				return "bg-green-100 text-green-800";
			case "Stopped":
				return "bg-red-100 text-red-800";
			case "Error":
				return "bg-yellow-100 text-yellow-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	}

	function getStatusIcon(status: string) {
		switch (status) {
			case "Running":
				return "🟢";
			case "Stopped":
				return "🔴";
			case "Error":
				return "🟡";
			default:
				return "⚪";
		}
	}

	// OSSEC functions
	// async function checkOssecStatus() {
	// 	try {
	// 		ossecRunning = await invoke<boolean>("check_ossec_status");
	// 	} catch (error) {
	// 		console.error("Failed to check OSSEC status:", error);
	// 	}
	// }

	// async function checkAlertsLogModified() {
	// 	try {
	// 		alertsLogModified = await invoke<boolean>(
	// 			"check_alerts_log_modified",
	// 		);
	// 	} catch (error) {
	// 		console.error("Failed to check alerts log:", error);
	// 	}
	// }

	// async function toggleOssec() {
	// 	try {
	// 		await invoke("toggle_ossec", { start: !ossecRunning });
	// 		await checkOssecStatus();
	// 	} catch (error) {
	// 		console.error("Failed to toggle OSSEC:", error);
	// 		alert("Failed to toggle OSSEC: " + error);
	// 	}
	// }

	// async function openAlertsLog() {
	// 	try {
	// 		await invoke("open_file_in_terminal", {
	// 			filePath: "/var/ossec/logs/alerts/alerts.log",
	// 		});
	// 		// Reset the baseline after opening
	// 		await invoke("reset_alerts_log_baseline");
	// 		alertsLogModified = false;
	// 	} catch (error) {
	// 		console.error("Failed to open alerts log:", error);
	// 		alert("Failed to open alerts log: " + error);
	// 	}
	// }

	// async function openOssecConfig() {
	// 	try {
	// 		await invoke("open_file_in_terminal", {
	// 			filePath: "/var/ossec/etc/ossec.conf",
	// 		});
	// 	} catch (error) {
	// 		console.error("Failed to open OSSEC config:", error);
	// 		alert("Failed to open OSSEC config: " + error);
	// 	}
	// }

	// function handleOssecTooltipEnter() {
	// 	ossecTooltipTimeout = window.setTimeout(() => {
	// 		showOssecTooltip = true;
	// 	}, 1000);
	// }

	// function handleOssecTooltipLeave() {
	// 	if (ossecTooltipTimeout) {
	// 		clearTimeout(ossecTooltipTimeout);
	// 		ossecTooltipTimeout = null;
	// 	}
	// 	showOssecTooltip = false;
	// }

	// async function checkOssecNotificationsEnabled() {
	// 	try {
	// 		ossecNotificationsEnabled = await invoke<boolean>(
	// 			"get_ossec_notifications_enabled",
	// 		);
	// 	} catch (error) {
	// 		console.error("Failed to check OSSEC notifications:", error);
	// 	}
	// }

	// async function toggleOssecNotifications() {
	// 	try {
	// 		const newState = !ossecNotificationsEnabled;
	// 		await invoke("toggle_ossec_notifications", { enabled: newState });
	// 		ossecNotificationsEnabled = newState;
	// 	} catch (error) {
	// 		console.error("Failed to toggle OSSEC notifications:", error);
	// 		alert("Failed to toggle notifications: " + error);
	// 	}
	// }

	// // AIDE functions
	// async function openAideLog() {
	// 	try {
	// 		await invoke("open_file_in_terminal", {
	// 			filePath: "/var/log/aide/aide.log",
	// 		});
	// 	} catch (error) {
	// 		console.error("Failed to open AIDE log:", error);
	// 		alert("Failed to open AIDE log: " + error);
	// 	}
	// }

	// async function runAideCheck() {
	// 	if (aideRunning) {
	// 		alert("AIDE is already running. Please wait for it to complete.");
	// 		return;
	// 	}
	// 	try {
	// 		aideRunning = true;
	// 		const result = await invoke<string>("aide_check");
	// 		console.log("AIDE check result:", result);
	// 		// Update last check date
	// 		const now = new Date();
	// 		aideLastCheckDate = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;
	// 		localStorage.setItem("aideLastCheckDate", aideLastCheckDate);
	// 		alert("AIDE check completed. Check console for details.");
	// 	} catch (error) {
	// 		console.error("Failed to run AIDE check:", error);
	// 		const errorMsg = String(error);
	// 		if (errorMsg.includes("cannot get lock")) {
	// 			alert(
	// 				"AIDE is already running. Please wait for the current operation to finish.",
	// 			);
	// 		} else {
	// 			alert("Failed to run AIDE check: " + error);
	// 		}
	// 	} finally {
	// 		aideRunning = false;
	// 	}
	// }

	// async function runAideUpdate() {
	// 	if (aideRunning) {
	// 		alert("AIDE is already running. Please wait for it to complete.");
	// 		return;
	// 	}
	// 	try {
	// 		aideRunning = true;
	// 		const result = await invoke<string>("aide_update");
	// 		alert(result);
	// 	} catch (error) {
	// 		console.error("Failed to update AIDE database:", error);
	// 		const errorMsg = String(error);
	// 		if (errorMsg.includes("cannot get lock")) {
	// 			alert(
	// 				"AIDE is already running. Please wait for the current operation to finish.",
	// 			);
	// 		} else {
	// 			alert("Failed to update AIDE database: " + error);
	// 		}
	// 	} finally {
	// 		aideRunning = false;
	// 	}
	// }

	// function handleAideTooltipEnter() {
	// 	aideTooltipTimeout = window.setTimeout(() => {
	// 		showAideTooltip = true;
	// 	}, 1000);
	// }

	// function handleAideTooltipLeave() {
	// 	if (aideTooltipTimeout) {
	// 		clearTimeout(aideTooltipTimeout);
	// 		aideTooltipTimeout = null;
	// 	}
	// 	showAideTooltip = false;
	// }

	// function handleAideUpdateTooltipEnter() {
	// 	aideUpdateTooltipTimeout = window.setTimeout(() => {
	// 		showAideUpdateTooltip = true;
	// 	}, 1000);
	// }

	// function handleAideUpdateTooltipLeave() {
	// 	if (aideUpdateTooltipTimeout) {
	// 		clearTimeout(aideUpdateTooltipTimeout);
	// 		aideUpdateTooltipTimeout = null;
	// 	}
	// 	showAideUpdateTooltip = false;
	// }

	// OpenSnitch functions
	// async function checkOpenSnitchStatus() {
	// 	try {
	// 		opensnitchRunning = await invoke<boolean>(
	// 			"check_opensnitch_status",
	// 		);
	// 	} catch (error) {
	// 		console.error("Failed to check OpenSnitch status:", error);
	// 	}
	// }

	// async function toggleOpenSnitch() {
	// 	try {
	// 		await invoke("toggle_opensnitch", { start: !opensnitchRunning });
	// 		await checkOpenSnitchStatus();
	// 	} catch (error) {
	// 		console.error("Failed to toggle OpenSnitch:", error);
	// 		alert("Failed to toggle OpenSnitch: " + error);
	// 	}
	// }

	// function handleOpenSnitchTooltipEnter() {
	// 	openSnitchTooltipTimeout = window.setTimeout(() => {
	// 		showOpenSnitchTooltip = true;
	// 	}, 1000);
	// }

	// function handleOpenSnitchTooltipLeave() {
	// 	if (openSnitchTooltipTimeout) {
	// 		clearTimeout(openSnitchTooltipTimeout);
	// 		openSnitchTooltipTimeout = null;
	// 	}
	// 	showOpenSnitchTooltip = false;
	// }

	// Open WebUI functions
	// async function checkOpenWebUIStatus() {
	// 	try {
	// 		openwebuiRunning = await invoke<boolean>("check_openwebui_status");
	// 	} catch (error) {
	// 		console.log("IN Error at checkOpenWebUIStatus");
	// 		console.error("Failed to check Open WebUI status:", error);
	// 	}
	// }

	// Open WebUI functions
	// async function checkLMStudioStatus() {
	// 	try {
	// 		lmstudioRunning = await invoke<boolean>("check_lmstudio_status");
	// 	} catch (error) {
	// 		console.error("Failed to check LM studio status:", error);
	// 	}
	// }

	// Open WebUI functions
	// async function checkOllamaStatus() {
	// 	try {
	// 		ollamaRunning = await invoke<boolean>("check_ollama_status");
	// 	} catch (error) {
	// 		console.error("Failed to check Ollama status:", error);
	// 	}
	// }

	// Open WebUI functions
	// async function checkWarpStatus() {
	// 	try {
	// 		warpRunning = await invoke<boolean>("check_warp_status");
	// 	} catch (error) {
	// 		console.error("Failed to check Warp status:", error);
	// 	}
	// }

	// async function toggleOpenWebUI() {
	// 	console.log("toggle OpenWebUI");
	// 	try {
	// 		await invoke("toggle_openwebui", { start: !openwebuiRunning });
	// 		await checkOpenWebUIStatus();
	// 	} catch (error) {
	// 		console.error("Failed to toggle Open WebUI:", error);
	// 		alert("Failed to toggle Open WebUI: " + error);
	// 	}
	// }

	// async function toggleLMStudio() {
	// 	try {
	// 		await invoke("toggle_lmstudio", { start: !lmstudioRunning });
	// 		await checkLMStudioStatus();
	// 	} catch (error) {
	// 		console.error("Failed to toggle LM Studio:", error);
	// 		alert("Failed to toggle LM Studio: " + error);
	// 	}
	// }

	// async function toggleOllama() {
	// 	try {
	// 		await invoke("toggle_ollama", { start: !ollamaRunning });
	// 		await checkOllamaStatus();
	// 	} catch (error) {
	// 		console.error("Failed to toggle Ollama:", error);
	// 		alert("Failed to toggle Ollama: " + error);
	// 	}
	// }

	// async function toggleWarp() {
	// 	try {
	// 		await invoke("toggle_warp", { start: !warpRunning });
	// 		await checkWarpStatus();
	// 	} catch (error) {
	// 		console.error("Failed to toggle Warp:", error);
	// 		alert("Failed to toggle Warp: " + error);
	// 	}
	// }

	// Docker functions
	// async function checkDockerStatus() {
	// 	try {
	// 		dockerEnabled = await invoke<boolean>("check_docker_enabled");
	// 		dockerActive = await invoke<boolean>("check_docker_active");
	// 	} catch (error) {
	// 		console.error("Failed to check Docker status:", error);
	// 	}
	// }

	// async function toggleDockerEnable() {
	// 	try {
	// 		await invoke("toggle_docker_enable", { enable: !dockerEnabled });
	// 		await checkDockerStatus();
	// 	} catch (error) {
	// 		console.error("Failed to toggle Docker enable:", error);
	// 		alert("Failed to toggle Docker enable: " + error);
	// 	}
	// }

	// async function toggleDockerActive() {
	// 	try {
	// 		await invoke("toggle_docker_active", { start: !dockerActive });
	// 		await checkDockerStatus();
	// 	} catch (error) {
	// 		console.error("Failed to toggle Docker active:", error);
	// 		alert("Failed to toggle Docker active: " + error);
	// 	}
	// }

	// Docker Desktop functions
	// async function checkDockerDesktopStatus() {
	// 	try {
	// 		dockerDesktopEnabled = await invoke<boolean>(
	// 			"check_docker_desktop_enabled",
	// 		);
	// 		dockerDesktopActive = await invoke<boolean>(
	// 			"check_docker_desktop_active",
	// 		);
	// 	} catch (error) {
	// 		console.error("Failed to check Docker Desktop status:", error);
	// 	}
	// }

	// async function toggleDockerDesktopEnable() {
	// 	try {
	// 		await invoke("toggle_docker_desktop_enable", {
	// 			enable: !dockerDesktopEnabled,
	// 		});
	// 		await checkDockerDesktopStatus();
	// 	} catch (error) {
	// 		console.error("Failed to toggle Docker Desktop enable:", error);
	// 		alert("Failed to toggle Docker Desktop enable: " + error);
	// 	}
	// }

	// async function toggleDockerDesktopActive() {
	// 	try {
	// 		await invoke("toggle_docker_desktop_active", {
	// 			start: !dockerDesktopActive,
	// 		});
	// 		await checkDockerDesktopStatus();
	// 	} catch (error) {
	// 		console.error("Failed to toggle Docker Desktop active:", error);
	// 		alert("Failed to toggle Docker Desktop active: " + error);
	// 	}
	// }

	onMount(() => {
		loadApps();
//		checkOssecStatus();
		// checkAlertsLogModified(); // Disabled to prevent password prompt on startup
		// checkOssecNotificationsEnabled();
		// checkOpenSnitchStatus();
		// checkOpenWebUIStatus();
		// checkLMStudioStatus();
		// checkOllamaStatus();
		// checkWarpStatus();
		// checkDockerStatus();
		// checkDockerDesktopStatus();

		// Load AIDE last check date from localStorage
//		const savedDate = localStorage.getItem("aideLastCheckDate");
		// if (savedDate) {
		// 	aideLastCheckDate = savedDate;
		// }

		// Hide context menu on click anywhere
		document.addEventListener("click", hideContextMenu);
		return () => {
			document.removeEventListener("click", hideContextMenu);
		};
	});
</script>

<!-- Services Tab Content -->
<div class="tab-content">
	<!-- Apps Grid -->
	{#if loading}
		<div class="flex justify-center items-center h-64">
			<div
				class="animate-spin rounded-full h-12 w-12 border-b-2 border-white"
			></div>
		</div>
	{:else if apps.length === 0}
		<div class="text-center py-20">
			<div
				class="bg-white/10 backdrop-blur-sm rounded-2xl p-12 max-w-md mx-auto"
			>
				<h3 class="text-2xl font-semibold text-white mb-4">
					No applications registered yet
				</h3>
				<p class="text-white/80 mb-6">
					Add your first Tauri application to get started
				</p>
				<button
					onclick={() => (showAddDialog = true)}
					class="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
				>
					➕ Add Application
				</button>
			</div>
		</div>
	{:else}
		<div class="flex flex-wrap gap-6">
			{#each apps as app (app.id)}
				<div
					class="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105 w-94 h-44 flex flex-col"
					oncontextmenu={(e) => showContextMenu(e, app.id)}
				>
					<div class="flex items-start justify-between mb-4">
						<h3 class="text-xl font-semibold text-white">
							{app.name}
						</h3>
						<span
							class="px-3 py-1 rounded-full text-xs font-medium {getStatusColor(
								app.status,
							)} whitespace-nowrap ml-2"
						>
							{getStatusIcon(app.status)}
							{app.status}
						</span>
					</div>

					<!-- <p class="text-white/80 text-sm mb-4">{app.description}</p> -->
					<p class="text-white/60 text-xs mb-auto">
						📁 {app.path}
					</p>

					<div class="flex gap-2" style="margin-top: 10px;">
						{#if app.status === "Running"}
							<button
								onclick={() => stopApp(app.id)}
								class="flex-1 mb-5 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
							>
								⏹️ Stop
							</button>
						{:else}
							<button
								onclick={() => launchApp(app.id)}
								class="flex-1 border-transparent border bg-black/20 hover:border-white text-white px-4 py-2 rounded-lg font-medium transition-colors"
							>
								▶️ Launch
							</button>
						{/if}
					</div>
				</div>
			{/each}
		</div>

		<!-- Controls -->
		<!--New-->
		<div>
			<div class="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mt-8">
				<!-- Hub Controls Sub-Container -->
				 <h2
						class="text-xl font-semibold text-center {borderNTextNBg.lightText} mb-3"
					>
						Hub Controls
					</h2>
				<div
					class=""
				>
					
					<div class="flex flex-wrap gap-4 items-stretch h-[72px]">
						<button
							onclick={loadApps}
							class="border-white/20 border bg-black/20 hover:border-white {borderNTextNBg.lightText} px-6 py-2 rounded-lg font-mono flex justify-center gap-2 h-[62px] w-[150px] transition-colors"
						>
							🔄 Refresh Apps
						</button>
						<button
							onclick={() => (showAddDialog = true)}
							class="bg-black/20 border-white/20 border hover:border-white {borderNTextNBg.lightText} px-6 rounded-lg font-semibold transition-colors flex justify-center items-center gap-2 h-[62px] w-[150px]"
						>
							➕ AddApps
						</button>
					</div>
				</div>
				<!--New-->
			</div>
			<!-- Prog Services Sub-Container -->
			<div class="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mt-8">
			<h2
						class="text-xl font-semibold text-center {borderNTextNBg.lightText} mb-3"
					>
						Prog Services
					</h2>
				
				</div>
			

			
			<!-- AI Services Sub-Container -->
			<div
				class="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mt-8">
				<h2
					class="text-xl text-center font-semibold text-gray-800 mb-3 {borderNTextNBg.lightText}"
				>
					AI Services
				</h2>
				
					</div>

			<!-- SecOp Services Sub-Container -->
			<div
				class="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mt-8">
				<h2
					class="text-xl text-center font-semibold text-gray-800 mb-3 {borderNTextNBg.lightText}"
				>
					SecOp Services
				</h2>
				<div class="flex flex-wrap gap-4 items-stretch">
				
						</div>
			</div>
			</div>
		{/if}
				

		<!-- Add App Dialog -->
		{#if showAddDialog}
			<div
				class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
			>
				<div class="bg-white rounded-2xl p-8 w-full max-w-md">
					<h3 class="text-2xl font-bold mb-6">Add New Application</h3>

					<div class="space-y-4">
						<div>
							<label
								class="block text-sm font-medium text-gray-700 mb-2"
								>Name *</label
							>
							<input
								bind:value={newApp.name}
								type="text"
								class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								placeholder="My Tauri App"
							/>
						</div>

						<div>
							<label
								class="block text-sm font-medium text-gray-700 mb-2"
								>Description</label
							>
							<textarea
								bind:value={newApp.description}
								class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								rows="3"
								placeholder="Description of your application"
							></textarea>
						</div>

						<div>
							<label
								class="block text-sm font-medium text-gray-700 mb-2"
								>Path *</label
							>
							<input
								bind:value={newApp.path}
								type="text"
								class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								placeholder="/path/to/app/directory"
							/>
						</div>

						<div>
							<label
								class="block text-sm font-medium text-gray-700 mb-2"
								>Executable *</label
							>
							<input
								bind:value={newApp.executable}
								type="text"
								class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								placeholder="./target/release/my-app"
							/>
						</div>

						<div>
							<label
								class="block text-sm font-medium text-gray-700 mb-2"
								>Icon (emoji)</label
							>
							<input
								bind:value={newApp.icon}
								type="text"
								class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								placeholder="📱"
							/>
						</div>
					</div>

					<div class="flex gap-4 mt-8">
						<button
							onclick={() => (showAddDialog = false)}
							class="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
						>
							Cancel
						</button>
						<button
							onclick={addApp}
							class="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
						>
							Add App
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Context Menu -->
		{#if contextMenu.show}
			<div
				class="fixed bg-white rounded-lg shadow-xl py-2 z-50 min-w-[150px]"
				style="left: {contextMenu.x}px; top: {contextMenu.y}px;"
			>
				<button
					onclick={() => removeApp(contextMenu.appId)}
					class="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 font-medium transition-colors flex items-center gap-2"
				>
					🗑️ Remove App
				</button>
			</div>
		{/if}
	
</div>

import { writable, get } from 'svelte/store';
import { invoke } from '@tauri-apps/api/core';
import { persGoalEncryptedCache, updateYearByNumberPrivateGoal, persGoalData, 
	persLockState, LockState, initHighlightLevel1, 
	persGoalHighlights,
	persGoalHighlightEncryptedCache} from './persgoal';
import { appPersState } from './state.svelte';
import { saveUserEncryptionData } from '$lib/persistence';

export const pass = writable<string | null>(null);

export const authTargetTab = writable<string | null>(null);
export const authError = writable<string | null>(null);
export const showAuthModal = writable(false);

export function persAuth(route: string) {
	console.log(`In persAuth and setting showAuthModal to true`);
	authTargetTab.set(route);
	authError.set(null);
	showAuthModal.set(true);
}

export async function unlockPers(password: string): Promise<boolean> {
	console.log(`In unlock function`);
	console.log(`Password is ${password}`);

	const encrypted = get(persGoalEncryptedCache);
	const encryptedHL = get(persGoalHighlightEncryptedCache);
	try {
		console.log(`In unLockPers for decryption`);
		const decrypted = await invoke<string>("decrypt_highlights", {
			password,
			encrypted
		});
		const parsed = JSON.parse(decrypted);
		persGoalData.set(parsed);

		const decryptedHL = await invoke<string>("decrypt_highlights", {
			password,
			encrypted: encryptedHL
		});
		const parsedHL = JSON.parse(decryptedHL);
		persGoalHighlights.set(parsedHL);

		persLockState.set(LockState.UNLOCKED);
		return true;
	} catch (e) {
		console.log(`decryption failed with ${e}`);
		return false;
	}
}

export async function initLoginWithEncryption(password: string): Promise<boolean> {
	const presentYear = new Date().getFullYear();
	let initialPersEncrypt: string = "";
	let initialHighlightEncrypt: string = "";

	console.log("FIRST RUN - NO ENCRYPTED DATA");
	updateYearByNumberPrivateGoal(presentYear, "Initialize Encryption Text - Erase...");
	initHighlightLevel1("Initialized");
	try {
		initialPersEncrypt = await invoke<string>("encrypt_highlights", {
			password,
			data: JSON.stringify(get(persGoalData))
		});
	} catch (e) {
		console.error('Failed Initial Encryption:', e);
		return false;
	}

	try {
		initialHighlightEncrypt = await invoke<string>("encrypt_highlights", {
			password,
			data: JSON.stringify(get(persGoalHighlights))
		});
	} catch (e) {
		console.error('Failed Initial Encryption:', e);
		return false;
	}

	persGoalEncryptedCache.set(initialPersEncrypt);
	persGoalHighlightEncryptedCache.set(initialHighlightEncrypt);
	persLockState.set(LockState.UNLOCKED);
	console.log(`In initLoginWithEncryption and saving data`);
	saveUserEncryptionData();
	return true;
}
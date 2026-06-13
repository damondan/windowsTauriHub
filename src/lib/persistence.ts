// src/lib/persistence.ts
//5.8.26 - saying password is incorrect or data is corrupted. 
import { invoke } from '@tauri-apps/api/core';
import { todosByDate, todoField1, todoField2, todoExpandedState } from '$lib/stores/todo';
import { commandData, commandExpandedCategories, commandExpandedSubcategories } from '$lib/stores/commands';
import { projectsData, projectExpandedProjects, projectExpandedSubprojects, projectExpandedTasks, projectOrder, persOrder, initProjectOrder } from '$lib/stores/projects';
import { howtoData, howtoExpandedCategories, howtoExpandedSubcategories, howtoExpandedTopics } from '$lib/stores/howto';
import { financeData, financeExpandedYears, financeExpandedMonths, 
	financeExpandedWeeks, financeNames, type FinanceNames } from '$lib/stores/finance';
import { calendarData } from '$lib/stores/calendar';
import {
	persGoalData, persGoalEncryptedCache, persGoalExpandedYears, persGoalExpandedMonths, persGoalExpandedWeeks, persGoalHighlights,
	migratePersGoal, migratePersGoalHighlights, persGoalHighlightEncryptedCache, persLockState, type HighlightLevel1,
	LockState,
	type PersLockState
} from '$lib/stores/persgoal';
import { profGoalData, profGoalExpandedYears, profGoalExpandedMonths, profGoalExpandedWeeks, 
	profGoalHighlights, profOrder } from '$lib/stores/profgoal';
import { workspaceContentA, workspaceContentB } from '$lib/stores/workspace';
import { goalData, goalOrder, type GoalThread } from './stores/thegoals';
import { pass } from "$lib/stores/auth";
import { get } from 'svelte/store';

type PersistDomain =
	| "todos"
	| "commands"
	| "howto"
	| "projects"
	| "howto"
	| "finance"
	| "calendar"
	| "persgoal"
	| "profgoal"
	| "profhighlights"
	| "workspaces"
	| "fields"
	| "projects"
	| "goal";

let pendingDomain: PersistDomain | null = null;

let isHydrated = false;
let persDirty = false;

export function setHydrated(value: boolean) {
	console.log(`In setHydrated is true`);
	isHydrated = value;
}

interface UserData {
	todos: Record<string, any>;
	commands?: any[];
	commandsOld?: Record<string, any>;
	projects?: Record<string, any>;
	howto?: any[];
	finance?: any[];
	calendar?: any[];                         
	profgoal?: any[];
	profhighlights?: Record<string, HighlightLevel1>;        
	workspaceA?: string;
	workspaceB?: string;
	field1?: string;
	field2?: string;
	todoExpandedState?: Record<string, boolean>;
	projectExpandedProjects?: Record<string, boolean>;
	projectExpandedSubprojects?: Record<string, boolean>;
	projectExpandedTasks?: Record<string, boolean>;
	projectorder?: string[];
	persorder?: Record<string,string[]>;
	proforder?: Record<string, string[]>;
	howtoExpandedCategories?: Record<string, boolean>;
	howtoExpandedSubcategories?: Record<string, boolean>;
	howtoExpandedTopics?: Record<string, boolean>;
	financeExpandedYears?: Record<string, boolean>;
	financeExpandedMonths?: Record<string, boolean>;
	financeExpandedWeeks?: Record<string, boolean>;
	profGoalExpandedYears?: Record<string, boolean>;
	profGoalExpandedMonths?: Record<string, boolean>;
	profGoalExpandedWeeks?: Record<string, boolean>;
	commandExpandedCategories?: Record<string, boolean>;
	commandExpandedSubcategories?: Record<string, boolean>;
	financenames:FinanceNames;
	goaldata: GoalThread[];
	goalorder: string[];
}

interface UserEncryptData {
	persgoalencryption?: string;
	persgoalhighlightsencrypted?: string;
	persGoalExpandedYears?: Record<string, boolean>;
	persGoalExpandedMonths?: Record<string, boolean>;
	persGoalExpandedWeeks?: Record<string, boolean>;
	perslockstate: PersLockState;
}

let saveTimeout: number | null = null;

// Every 1 second there is no activity on a scheduleSave for a data structure, scheduleSave is called.
//This needs to add encryptPersHighlightGoals after encryptPersGoals.
//This than calls the encryptPersGoals
function scheduleSave(domain: PersistDomain) {
	pendingDomain = domain;

	if (saveTimeout !== null) {
		clearTimeout(saveTimeout);
	}

	saveTimeout = window.setTimeout(async () => {
		if (!pendingDomain) return;

		const domainToSave = pendingDomain;

		pendingDomain = null;

		await saveUserData(domainToSave);
	}, 500);
}

function scheduleSaveEncrypt(domain:PersistDomain) {
	console.log(`In scheduleSaveEncrypt`);
	pendingDomain = domain;
	if (saveTimeout !== null) {
		console.log(`in saveTimeOut != null`);
		clearTimeout(saveTimeout);
	}
	saveTimeout = window.setTimeout(async () => {
		if (!pendingDomain) {
			return;
		}
		const domainToSave = pendingDomain;

		pendingDomain = null;

		if (persDirty) {
			console.log(`persDirty is true. Next fire encryptPersGoals()`);
			await encryptPersGoals();
		}
	}, 1000);
}

//This is called to ecrypt the PersGoal Data - takes in the persGoalData
//After this is called, persGoalEncryptedCache is set to cache that encryption
//This encrypts and caches the encryption. It does not save it to backend yet.
//GOOD DONE
export async function encryptPersGoals() {
	console.log(`In encryptPersGoals`);

	const password = get(pass);

	// 🔒 Only encrypt if allowed AND actually changed
	if (
		get(persLockState) === LockState.UNLOCKED &&
		password &&
		persDirty
	) {
		console.log(`Lock state,password, and isDirty ${get(persLockState)} 
		${password} ${persDirty}`)
		const persEncrypted = await invoke<string>(
			"encrypt_highlights",
			{
				password,
				data: JSON.stringify(get(persGoalData))
			}
		);

		const persHLEncrypted = await invoke<string>(
			"encrypt_highlights",
			{
				password,
				data: JSON.stringify(get(persGoalHighlights))
			}
		);
		console.log(`In encryptPersGoals and set encrypted to cache store`);
		persGoalEncryptedCache.set(persEncrypted);
		persGoalHighlightEncryptedCache.set(persHLEncrypted);
		// ✅ reset dirty flag AFTER successful encryption
		persDirty = false;
	}
}

// TODO : save from domain to be more efficient
export async function saveUserData(domain: PersistDomain): Promise<void> {
	try {
		const data: UserData = {
			todos: get(todosByDate),
			commands: get(commandData),
			commandExpandedCategories: get(commandExpandedCategories),
			commandExpandedSubcategories: get(commandExpandedSubcategories),
			projects: get(projectsData),
			howto: get(howtoData),
			finance: get(financeData),
			calendar: get(calendarData),
			profgoal: get(profGoalData),
			profhighlights: get(profGoalHighlights),
			workspaceA: get(workspaceContentA),
			workspaceB: get(workspaceContentB),
			field1: get(todoField1),
			field2: get(todoField2),
			todoExpandedState: get(todoExpandedState),
			projectExpandedProjects: get(projectExpandedProjects),
			projectExpandedSubprojects: get(projectExpandedSubprojects),
			projectExpandedTasks: get(projectExpandedTasks),
			projectorder: get(projectOrder),
			persorder: get(persOrder),
			proforder:get(profOrder),
			howtoExpandedCategories: get(howtoExpandedCategories),
			howtoExpandedSubcategories: get(howtoExpandedSubcategories),
			howtoExpandedTopics: get(howtoExpandedTopics),
			financeExpandedYears: get(financeExpandedYears),
			financeExpandedMonths: get(financeExpandedMonths),
			financeExpandedWeeks: get(financeExpandedWeeks),
			profGoalExpandedYears: get(profGoalExpandedYears),
			profGoalExpandedMonths: get(profGoalExpandedMonths),
			profGoalExpandedWeeks: get(profGoalExpandedWeeks),
			financenames: get(financeNames),
			goaldata: get(goalData),
			goalorder: get(goalOrder)
		};
		await invoke('save_user_data', { data: JSON.stringify(data) });
		console.log('User data saved');
	} catch (error) {
		console.error('Failed to save user data:', error);
	}
}

// For Pers, gets the data.persgoalencryption and sets persGoalEncryptionCache. This
//sets the cache so that it can than be decrypted when Pers tab is clicked. 
export async function loadUserData(): Promise<void> {
	console.log(`In loadUserData`);
	try {
		const dataStr = await invoke<string>('load_user_data');
		const data: UserData = JSON.parse(dataStr);

		if (data.todos) {
			todosByDate.set(data.todos);
		}
		if (data.commands && Array.isArray(data.commands)) {
			commandData.set(data.commands);
		}
		if (data.commandExpandedCategories) {
			commandExpandedCategories.set(data.commandExpandedCategories);
		}
		if (data.commandExpandedSubcategories) {
			commandExpandedSubcategories.set(data.commandExpandedSubcategories);
		}
		if (data.projects) {
			projectsData.set(data.projects);
		}
		if (data.howto) {
			howtoData.set(data.howto);
		}
		if (data.field1 !== undefined) {
			todoField1.set(data.field1);
		}
		if (data.field2 !== undefined) {
			todoField2.set(data.field2);
		}
		if (data.todoExpandedState) {
			todoExpandedState.set(data.todoExpandedState);
		}
		if (data.projectExpandedProjects) {
			projectExpandedProjects.set(data.projectExpandedProjects);
		}
		if (data.projectExpandedSubprojects) {
			projectExpandedSubprojects.set(data.projectExpandedSubprojects);
		}
		if (data.projectExpandedTasks) {
			projectExpandedTasks.set(data.projectExpandedTasks);
		}
		if (!data.projectorder) {
			projectOrder.set(initProjectOrder());
		}else{
			projectOrder.set(data.projectorder);
		}
		if (data.persorder) {
			persOrder.set(data.persorder ?? []);
		}
		if (data.proforder) {
			profOrder.set(data.proforder ?? []);
		}
		if (data.howtoExpandedCategories) {
			howtoExpandedCategories.set(data.howtoExpandedCategories);
		}
		if (data.howtoExpandedSubcategories) {
			howtoExpandedSubcategories.set(data.howtoExpandedSubcategories);
		}
		if (data.howtoExpandedTopics) {
			howtoExpandedTopics.set(data.howtoExpandedTopics);
		}
		if (data.finance) {
			financeData.set(data.finance);
		}
		if (data.financenames) {
			financeNames.set(data.financenames);
		}
		if (data.calendar) {
			calendarData.set(data.calendar);
		}
		if (data.financeExpandedYears) {
			financeExpandedYears.set(data.financeExpandedYears);
		}
		if (data.financeExpandedMonths) {
			financeExpandedMonths.set(data.financeExpandedMonths);
		}
		if (data.financeExpandedWeeks) {
			financeExpandedWeeks.set(data.financeExpandedWeeks);
		}
		if (data.profgoal) {
			profGoalData.set(data.profgoal);
		}
		if (data.profhighlights) {
			profGoalHighlights.set(data.profhighlights);
		}
		if (data.profGoalExpandedYears) {
			profGoalExpandedYears.set(data.profGoalExpandedYears);
		}
		if (data.profGoalExpandedMonths) {
			profGoalExpandedMonths.set(data.profGoalExpandedMonths);
		}
		if (data.profGoalExpandedWeeks) {
			persGoalExpandedWeeks.set(data.profGoalExpandedWeeks);
		}
		if (data.goaldata) {
			goalData.set(data.goaldata);
		}
		if (data.goalorder) {
			goalOrder.set(data.goalorder);
		}
		if (data.workspaceA !== undefined) {
			workspaceContentA.set(data.workspaceA);
		}
		if (data.workspaceB !== undefined) {
			workspaceContentB.set(data.workspaceB);
		}
		console.log('User data loaded');
		console.log(`persLockState set locally with ${get(persLockState)}`);
	} catch (error) {
		console.error('Failed to load user data:', error);
	}
}

export async function loadUserDataEncryption(): Promise<void> {
	try {
		console.log(`IN loadUserDataEncryption`);
		const dataStr = await invoke<string>('load_user_data_encryption');
		const data: UserEncryptData = JSON.parse(dataStr);

		if (data.persGoalExpandedYears) {
			persGoalExpandedYears.set(data.persGoalExpandedYears);
		}
		if (data.persGoalExpandedMonths) {
			persGoalExpandedMonths.set(data.persGoalExpandedMonths);
		}
		if (data.persGoalExpandedWeeks) {
			persGoalExpandedWeeks.set(data.persGoalExpandedWeeks);
		}
		persGoalEncryptedCache.set(data.persgoalencryption ?? "");
		persGoalHighlightEncryptedCache.set(data.persgoalhighlightsencrypted ?? "");
		persLockState.set(data.perslockstate ?? LockState.NOT_SET);

		console.log('User data encryption loaded');
		console.log(`persLockState set locally with ${get(persLockState)}`);
	} catch (error) {
		console.error('Failed to load user data:', error);
	}
}

export async function saveUserEncryptionData (): Promise<void>{
	try {
		console.log(`In saveUserEncryptionData function`);
		const dataEncrypted: UserEncryptData = {
			persgoalencryption: get(persGoalEncryptedCache) ?? "",
			persgoalhighlightsencrypted: get(persGoalHighlightEncryptedCache) ?? "",
			persGoalExpandedYears: get(persGoalExpandedYears),
			persGoalExpandedMonths: get(persGoalExpandedMonths),
			persGoalExpandedWeeks: get(persGoalExpandedWeeks),
			perslockstate: get(persLockState)
					};
		await invoke('save_user_data_encryption', { data: JSON.stringify(dataEncrypted) });
		console.log('User data encryption saved');
	} catch (error) {
		console.error('Failed to save user encrypt data:', error);
		alert("Data save failed in persistence.ts saveUserEncryptionData");
	}
}

// Subscribe to store changes and auto-save
export function initPersistence() {

	// Subscribe to todos changes
	todosByDate.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave("todos");
	});

	// Subscribe to commands changes
	commandData.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave("commands");
	});

	commandExpandedCategories.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave("commands");
	});

	commandExpandedSubcategories.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave("commands");
	});

	// Subscribe to projects changes
	projectsData.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave("projects");
	});

	// Subscribe to field changes
	todoField1.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave("todos");
	});

	todoField2.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave("todos");
	});

	// Subscribe to expanded state changes
	todoExpandedState.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave("todos");
	});

	projectExpandedProjects.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave("projects");
	});

	projectExpandedSubprojects.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave("projects");
	});

	projectExpandedTasks.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave("projects");
	});

	projectOrder.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave("projects");
	});
//did not want to mess with encryption - adding this pers functionality to projects. 
	persOrder.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave("projects");
	});
	profOrder.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave("profgoal");
	});

	// Subscribe to howto changes
	howtoData.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave("howto");
	});

	howtoExpandedCategories.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave("howto");
	});

	howtoExpandedSubcategories.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave("howto");
	});

	howtoExpandedTopics.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave("howto");
	});

	// Subscribe to finance changes
	financeData.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave("finance");
	});

	financeNames.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave("finance");
	});

	calendarData.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave("calendar");
	});

	financeExpandedYears.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave("finance");
	});

	financeExpandedMonths.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave("finance");
	});

	financeExpandedWeeks.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave("finance");
	});

	persGoalExpandedYears.subscribe(() => {
		console.log(`inpersgoalexpandedYears.subscribe`);
		if (!isHydrated) return;
		persDirty = true;
		scheduleSaveEncrypt("persgoal");
	});

	persGoalExpandedMonths.subscribe(() => {
		console.log(`inpersgoalexpandedmonths.subscribe`);
		if (!isHydrated) return;
		persDirty = true;
		console.log(`inpersgoalexpandedmonths.subscribe and persDirty is true`);
		scheduleSaveEncrypt("persgoal");
	});

	persGoalExpandedWeeks.subscribe(() => {
		if (!isHydrated) return;
		persDirty = true;
		scheduleSaveEncrypt("persgoal");
	});

	// Subscribe to goal changes
	persGoalData.subscribe(() => {
		if (!isHydrated) return;
		console.log("In persGoalData.subscribe");
		persDirty = true;
		scheduleSaveEncrypt("persgoal");
	});

	persGoalHighlights.subscribe(() => {
		if (!isHydrated) return;
		console.log("In persGoalHighlights.subscribe");
		persDirty = true;
		scheduleSaveEncrypt("persgoal");
	});

	persLockState.subscribe(() => {
		if (!isHydrated) return;
		scheduleSaveEncrypt("persgoal");
	});

	// Subscribe to goal changes
	profGoalData.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave("profgoal");
	});

	profGoalHighlights.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave("profgoal");
	});

	profGoalExpandedYears.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave("profgoal");
	});

	profGoalExpandedMonths.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave("profgoal");
	});

	profGoalExpandedWeeks.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave("profgoal");
	});

	goalData.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave("goal");
	});

	goalOrder.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave("goal");
	});

	// Subscribe to workspace changes
	workspaceContentA.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave("workspaces");
	});
	workspaceContentB.subscribe(() => {
		if (!isHydrated) return;
		scheduleSave("workspaces");
	});
}

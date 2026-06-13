import { writable,get } from 'svelte/store';
import { todosByDate, removeTodoItem } from "./todo";
import type { TodoItem, TodoRow } from "./todo";
import type { Goal } from './thegoals';
export const projectExpandedProjects = writable<Record<string, boolean>>({});
export const projectExpandedSubprojects = writable<Record<string, boolean>>({});
export const projectExpandedTasks = writable<Record<string, boolean>>({});

export type ProjectTaskSource = "todo" | "goal";

export type ProjectTaskStatus = "completed" | "failed" | "ended";

export interface ProjectTask {
	id: string;
	sourceType: ProjectTaskSource;
	status?: ProjectTaskStatus;
	description: string;  // "Create Projects Tab Functionality"
	startDate: string;    // from TodoItem.date
	endDate: string;      // timestamp when Send is clicked
	rows?: TodoRow[];      // the actual todo rows with their completion status
	goals?: Goal[];
}

export interface ProjectSubproject {
	name: string;         // "TauriHub"
	tasks: ProjectTask[];
}

export interface Project {
	name: string;         // "Prog"
	subprojects: Record<string, ProjectSubproject>;  // keyed by subproject name
}

export const projectsData = writable<Record<string, Project>>({});
export const projectOrder = writable<string[]>([]);
//encryption is persOrder - encrypting this is unneeded - adding it in here
export const persOrder = writable<Record<string, string[]>>({});
// Delete a project
// deleteProject(projectName: string): void
export function deleteProject(projectName: string): void {
	projectsData.update((projects) => {
		const next = { ...projects };
		delete next[projectName];
		return next;
	});
	projectOrder.update((order) => {
 	return order.filter((id) => id !== projectName);
	});
}

export function deleteSubProject(
	projectName: string,
	subProjectName: string,
): void {
	projectsData.update((projects) => {
		const project = projects[projectName];

		if (!project) return projects;

		const next = {
			...projects,
			[projectName]: {
				...project,
				subprojects: {
					...project.subprojects,
				},
			},
		};

		delete next[projectName].subprojects[subProjectName];

		return next;
	});
}

// deleteTask(projectName: string, subprojectName: string, taskId: string): void
export function deleteTask(projectName: string, subprojectName: string, taskId: string): void {
	projectsData.update((projects) => {
		const project = projects[projectName];
		if (!project) return projects;
		
		const subproject = project.subprojects[subprojectName];
		if (!subproject) return projects;
		
		return {
			...projects,
			[projectName]: {
				...project,
				subprojects: {
					...project.subprojects,
					[subprojectName]: {
						...subproject,
						tasks: subproject.tasks.filter(t => t.id !== taskId)
					}
				}
			}
		};
	});
}

export function initProjectOrder(): string[]{
	const getStringArray = get(projectsData);
	return Object.keys(getStringArray);
}

export function addTaskToProjects(
	project: string,
	subproject: string,
	task: ProjectTask,
): void {
	projectsData.update((projects) => {
		const updatedProjects = { ...projects };

		if (!updatedProjects[project]) {
			updatedProjects[project] = {
				name: project,
				subprojects: {},
			};
		}

		if (!updatedProjects[project].subprojects[subproject]) {
			updatedProjects[project].subprojects[subproject] = {
				name: subproject,
				tasks: [],
			};
		}

		updatedProjects[project].subprojects[subproject].tasks.push(task);

		return updatedProjects;
	});

	projectOrder.update((order) => {
		if (order.includes(project)) return order;
		return [...order, project];
	});
}

export function sendTodoToProjects(date: string, itemId: string): boolean {
	let todoItem: TodoItem | null = null;

	todosByDate.update((map) => {
		const items = map[date] ?? [];
		const item = items.find((it) => it.id === itemId);

		if (item) {
			todoItem = item;
		}

		return map;
	});

	if (!todoItem) return false;

	const item: TodoItem = todoItem;

	const parsed = parseTodoTitle(item.title);
	if (!parsed) return false;

	const { project, subproject, description } = parsed;
	const endDate = new Date().toISOString();

	const task: ProjectTask = {
		id: item.id,
		sourceType: "todo",
		status: "completed",
		description,
		startDate: item.date,
		endDate,
		rows: item.rows,
	};

	addTaskToProjects(project, subproject, task);

	removeTodoItem(date, itemId);

	return true;
}

//ProjectTaskSource = "todo" | "goal";
//ProjectTaskStatus = "completed" | "failed" | "ended";
export function logGoalToProjects(
	project: string,
	subproject: string,
	goal: Goal,
	status: ProjectTaskStatus,
): boolean {
	const endDate = new Date().toISOString();

	const task: ProjectTask = {
		id: goal.goalId,
		sourceType: "goal",
		status,
		description: goal.title ?? "Untitled Goal",
		startDate: goal.dateStart ?? endDate,
		endDate,
		goals: [goal],
	};

	addTaskToProjects(project, subproject, task);

	return true;
}

// parseTodoTitle(title: string): { project: string; subproject: string; description: string } | null
function parseTodoTitle(title: string): { project: string; subproject: string; description: string } | null {
	const words = title.trim().split(/\s+/);
	let project = '';
	let subproject = '';
	const descriptionWords: string[] = [];

	for (const word of words) {
		if (word.startsWith('#')) {
			project = word.substring(1);
		} else if (word.startsWith('@')) {
			subproject = word.substring(1);
		} else {
			descriptionWords.push(word);
		}
	}

	if (!project || !subproject || descriptionWords.length === 0) {
		return null;
	}

	return {
		project,
		subproject,
		description: descriptionWords.join(' ')
	};
}


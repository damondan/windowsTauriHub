// src/lib/stores/commands.ts
import { writable } from 'svelte/store';
import { makeId } from '$lib/stores/general';

export const commandExpandedCategories = writable<Record<string, boolean>>({});
export const commandExpandedSubcategories = writable<Record<string, boolean>>({});

export interface CommandTask {
	id: string;
	text: string;
}

export interface CommandSubcategory {
	id: string;
	name: string;
	tasks: CommandTask[];
}

export interface CommandCategory {
	id: string;
	name: string;
	subcategories: CommandSubcategory[];
}

export const commandData = writable<CommandCategory[]>([]);

// addCommandCategory(): string
export function addCommandCategory(): string {
	const id = makeId();
	commandData.update((categories) => [
		...categories,
		{ id, name: '', subcategories: [] }
	]);
	return id;
}

// deleteCommandCategory(categoryId: string): void
export function deleteCommandCategory(categoryId: string): void {
	commandData.update((categories) => categories.filter((c) => c.id !== categoryId));
}

// updateCommandCategoryName(categoryId: string, name: string): void
export function updateCommandCategoryName(categoryId: string, name: string): void {
	commandData.update((categories) =>
		categories.map((c) => (c.id === categoryId ? { ...c, name } : c))
	);
}

// addCommandSubcategory(categoryId: string): string
export function addCommandSubcategory(categoryId: string): string {
	const id = makeId();
	commandData.update((categories) =>
		categories.map((c) =>
			c.id === categoryId
				? { ...c, subcategories: [...c.subcategories, { id, name: '', tasks: [] }] }
				: c
		)
	);
	return id;
}

// updateCommandSubcategoryName(categoryId: string, subcategoryId: string, name: string): void
export function updateCommandSubcategoryName(categoryId: string, subcategoryId: string, name: string): void {
	commandData.update((categories) =>
		categories.map((c) =>
			c.id === categoryId
				? {
						...c,
						subcategories: c.subcategories.map((sub) =>
							sub.id === subcategoryId ? { ...sub, name } : sub
						)
				  }
				: c
		)
	);
}

// deleteCommandSubcategory(categoryId: string, subcategoryId: string): void
export function deleteCommandSubcategory(categoryId: string, subcategoryId: string): void {
	commandData.update((categories) =>
		categories.map((c) =>
			c.id === categoryId
				? { ...c, subcategories: c.subcategories.filter((sub) => sub.id !== subcategoryId) }
				: c
		)
	);
}

// addCommandTask(categoryId: string, subcategoryId: string): string
export function addCommandTask(categoryId: string, subcategoryId: string): string {
	const id = makeId();
	commandData.update((categories) =>
		categories.map((c) =>
			c.id === categoryId
				? {
						...c,
						subcategories: c.subcategories.map((sub) =>
							sub.id === subcategoryId
								? { ...sub, tasks: [...sub.tasks, { id, text: '' }] }
								: sub
						)
				  }
				: c
		)
	);
	return id;
}

// updateCommandTaskText(categoryId: string, subcategoryId: string, taskId: string, text: string): void
export function updateCommandTaskText(
	categoryId: string,
	subcategoryId: string,
	taskId: string,
	text: string
): void {
	commandData.update((categories) =>
		categories.map((c) =>
			c.id === categoryId
				? {
						...c,
						subcategories: c.subcategories.map((sub) =>
							sub.id === subcategoryId
								? {
										...sub,
										tasks: sub.tasks.map((task) =>
											task.id === taskId ? { ...task, text } : task
										)
								  }
								: sub
						)
				  }
				: c
		)
	);
}

// deleteCommandTask(categoryId: string, subcategoryId: string, taskId: string): void
export function deleteCommandTask(
	categoryId: string,
	subcategoryId: string,
	taskId: string
): void {
	commandData.update((categories) =>
		categories.map((c) =>
			c.id === categoryId
				? {
						...c,
						subcategories: c.subcategories.map((sub) =>
							sub.id === subcategoryId
								? { ...sub, tasks: sub.tasks.filter((task) => task.id !== taskId) }
								: sub
						)
				  }
				: c
		)
	);
}

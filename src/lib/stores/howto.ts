import { writable } from 'svelte/store';
import { makeId } from '$lib/stores/general';

export const howtoExpandedCategories = writable<Record<string, boolean>>({});
export const howtoExpandedSubcategories = writable<Record<string, boolean>>({});
export const howtoExpandedTopics = writable<Record<string, boolean>>({});

export interface HowToTask {
	id: string;
	text: string;
}

export interface HowToTopic {
	id: string;
	name: string;
	tasks: HowToTask[];
}

export interface HowToSubcategory {
	id: string;
	name: string;
	topics: HowToTopic[];
}

export interface HowToCategory {
	id: string;
	name: string;
	subcategories: HowToSubcategory[];
}

export const howtoData = writable<HowToCategory[]>([]);

export function addHowToCategory(): string {
	const id = makeId();
	howtoData.update((categories) => [
		...categories,
		{ id, name: '', subcategories: [] }
	]);
	return id;
}

// Delete a HowTo category
export function deleteHowToCategory(categoryId: string): void {
	howtoData.update((categories) => categories.filter((c) => c.id !== categoryId));
}

export function deleteHowToSubCategory(
	categoryId: string,
	subcategoryId: string,
): void {
	howtoData.update((categories) =>
		categories.map((category) => {
			if (category.id !== categoryId) {
				return category;
			}

			return {
				...category,
				subcategories: category.subcategories.filter(
					(subcategory) => subcategory.id !== subcategoryId,
				),
			};
		}),
	);
}

export function deleteHowToTopic(
	categoryId: string,
	subcategoryId: string,
	topicId: string,
): void {
	howtoData.update((categories) =>
		categories.map((category) => {
			if (category.id !== categoryId) {
				return category;
			}

			return {
				...category,
				subcategories: category.subcategories.map((subcategory) => {
					if (subcategory.id !== subcategoryId) {
						return subcategory;
					}

					return {
						...subcategory,
						topics: subcategory.topics.filter(
							(topic) => topic.id !== topicId,
						),
					};
				}),
			};
		}),
	);
}



// Update HowTo category name
export function updateHowToCategoryName(categoryId: string, name: string): void {
	howtoData.update((categories) =>
		categories.map((c) => (c.id === categoryId ? { ...c, name } : c))
	);
}

// Add subcategory to a category
export function addHowToSubcategory(categoryId: string): string {
	const id = makeId();
	howtoData.update((categories) =>
		categories.map((c) =>
			c.id === categoryId
				? { ...c, subcategories: [...c.subcategories, { id, name: '', topics: [] }] }
				: c
		)
	);
	return id;
}

// Update subcategory name
export function updateHowToSubcategoryName(categoryId: string, subcategoryId: string, name: string): void {
	howtoData.update((categories) =>
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

// Add topic to a subcategory
export function addHowToTopic(categoryId: string, subcategoryId: string): string {
	const id = makeId();
	howtoData.update((categories) =>
		categories.map((c) =>
			c.id === categoryId
				? {
					...c,
					subcategories: c.subcategories.map((sub) =>
						sub.id === subcategoryId
							? { ...sub, topics: [...sub.topics, { id, name: '', tasks: [] }] }
							: sub
					)
				}
				: c
		)
	);
	return id;
}

// Update topic name
export function updateHowToTopicName(
	categoryId: string,
	subcategoryId: string,
	topicId: string,
	name: string
): void {
	howtoData.update((categories) =>
		categories.map((c) =>
			c.id === categoryId
				? {
					...c,
					subcategories: c.subcategories.map((sub) =>
						sub.id === subcategoryId
							? {
								...sub,
								topics: sub.topics.map((topic) =>
									topic.id === topicId ? { ...topic, name } : topic
								)
							}
							: sub
					)
				}
				: c
		)
	);
}

// Add task to a topic
export function addHowToTask(categoryId: string, subcategoryId: string, topicId: string): string {
	const id = makeId();
	howtoData.update((categories) =>
		categories.map((c) =>
			c.id === categoryId
				? {
					...c,
					subcategories: c.subcategories.map((sub) =>
						sub.id === subcategoryId
							? {
								...sub,
								topics: sub.topics.map((topic) =>
									topic.id === topicId
										? { ...topic, tasks: [...topic.tasks, { id, text: '' }] }
										: topic
								)
							}
							: sub
					)
				}
				: c
		)
	);
	return id;
}

// Update task text
export function updateHowToTaskText(
	categoryId: string,
	subcategoryId: string,
	topicId: string,
	taskId: string,
	text: string
): void {
	howtoData.update((categories) =>
		categories.map((c) =>
			c.id === categoryId
				? {
					...c,
					subcategories: c.subcategories.map((sub) =>
						sub.id === subcategoryId
							? {
								...sub,
								topics: sub.topics.map((topic) =>
									topic.id === topicId
										? {
											...topic,
											tasks: topic.tasks.map((task) =>
												task.id === taskId ? { ...task, text } : task
											)
										}
										: topic
								)
							}
							: sub
					)
				}
				: c
		)
	);
}

// Delete task
export function deleteHowToTask(
	categoryId: string,
	subcategoryId: string,
	topicId: string,
	taskId: string
): void {
	howtoData.update((categories) =>
		categories.map((c) =>
			c.id === categoryId
				? {
					...c,
					subcategories: c.subcategories.map((sub) =>
						sub.id === subcategoryId
							? {
								...sub,
								topics: sub.topics.map((topic) =>
									topic.id === topicId
										? { ...topic, tasks: topic.tasks.filter((task) => task.id !== taskId) }
										: topic
								)
							}
							: sub
					)
				}
				: c
		)
	);
}

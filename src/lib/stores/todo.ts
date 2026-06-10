import { writable } from 'svelte/store';
import { makeId, todayKey } from './general';

// ToDo header fields
export const todoField1 = writable<string>('');
export const todoField2 = writable<string>('');

export const todoExpandedState = writable<Record<string, boolean>>({});

export interface TodoRow {
	id: string;
	text: string;
	completed: boolean;
	startTime?: string; // ISO 8601 timestamp
	finishTime?: string; // ISO 8601 timestamp
	activeToDo?: boolean;
}

export interface TodoItem {
	id: string;
	date: string; // YYYY-MM-DD
	title: string;
	rows: TodoRow[];
}

export const todosByDate = writable<Record<string, TodoItem[]>>({});

export function addTodoItem(date: string = todayKey()): { id: string; date: string } {
	const id = makeId();
	todosByDate.update((map) => {
		const list = map[date] ? [...map[date]] : [];
		list.push({ id, date, title: '', rows: [] });
		return { ...map, [date]: list };
	});
	return { id, date };
}

// Remove a TodoItem container
// removeTodoItem(date: string, itemId: string): void
export function removeTodoItem(date: string, itemId: string): void {
	todosByDate.update((map) => {
		const nextList = (map[date] ?? []).filter((it) => it.id !== itemId);
		const next = { ...map } as Record<string, TodoItem[]>;
		if (nextList.length === 0) delete next[date];
		else next[date] = nextList;
		return next;
	});
}

// Update TodoItem title
// updateTodoTitle(date: string, itemId: string, title: string): void
export function updateTodoTitle(date: string, itemId: string, title: string): void {
	todosByDate.update((map) => {
		const nextList = (map[date] ?? []).map((it) => (it.id === itemId ? { ...it, title } : it));
		return { ...map, [date]: nextList };
	});
}

export function updateActiveTodo(
    date: string,
    itemId: string,
    rowId: string,
    activeTodo: boolean
): void {
    todosByDate.update((map) => {
        const nextList = (map[date] ?? []).map((item) =>
            item.id === itemId
                ? {
                      ...item,
                      rows: item.rows.map((row) =>
                          row.id === rowId
                              ? { ...row, activeToDo: activeTodo }
                              : row
                      )
                  }
                : item
        );

        return {
            ...map,
            [date]: nextList
        };
    });
}


// Add a new TodoRow under a TodoItem
// addTodoRow(date: string, itemId: string): string
export function addTodoRow(date: string, itemId: string): string {
	const rowId = makeId();
	const startTime = new Date().toISOString();
	todosByDate.update((map) => {
		const nextList = (map[date] ?? []).map((it) =>
			it.id === itemId ? { ...it, rows: [...it.rows, { id: rowId, text: '', completed: false, startTime }] } : it
		);
		return { ...map, [date]: nextList };
	});
	return rowId;
}

// Update a TodoRow's text
// updateTodoRowText(date: string, itemId: string, rowId: string, text: string): void
export function updateTodoRowText(date: string, itemId: string, rowId: string, text: string): void {
	todosByDate.update((map) => {
		const nextList = (map[date] ?? []).map((it) =>
			it.id === itemId ? { ...it, rows: it.rows.map((r) => (r.id === rowId ? { ...r, text } : r)) } : it
		);
		return { ...map, [date]: nextList };
	});
}

// Toggle TodoRow completed state
// toggleTodoRow(date: string, itemId: string, rowId: string): void
export function toggleTodoRow(date: string, itemId: string, rowId: string): void {
	todosByDate.update((map) => {
		const nextList = (map[date] ?? []).map((it) =>
			it.id === itemId
				? { ...it, rows: it.rows.map((r) => {
						if (r.id === rowId) {
							const newCompleted = !r.completed;
							// If toggling to completed, set finishTime
							const finishTime = newCompleted ? new Date().toISOString() : r.finishTime;
							return { ...r, completed: newCompleted, finishTime };
						}
						return r;
					}) }
				: it
		);
		return { ...map, [date]: nextList };
	});
}

// Delete a TodoRow
// deleteTodoRow(date: string, itemId: string, rowId: string): void
export function deleteTodoRow(date: string, itemId: string, rowId: string): void {
	todosByDate.update((map) => {
		const nextList = (map[date] ?? []).map((it) =>
			it.id === itemId ? { ...it, rows: it.rows.filter((r) => r.id !== rowId) } : it
		);
		return { ...map, [date]: nextList };
	});
}


// src/lib/utils/textareaResize.ts
  import { tick } from "svelte";
/**
 * resizeTextarea(textarea: HTMLTextAreaElement): void
 * Auto-resize a single textarea to fit its content
 */
export function resizeTextarea(textarea: HTMLTextAreaElement): void {
    // 1. Record current scroll position to "lock" the camera
    const scrollPos = window.scrollY;

    // 2. Perform the resize
    textarea.style.height = 'auto'; // This is necessary to shrink if text is deleted
    textarea.style.height = `${textarea.scrollHeight}px`;

    // 3. Immediately restore scroll position to prevent the "jump"
    // This happens before the next paint, making it invisible to the user
    window.scrollTo(window.scrollX, scrollPos);
}

/**
 * autoResize(textarea: HTMLTextAreaElement): { update: () => void; destroy: () => void }
 * Svelte action that auto-resizes textarea on mount and input
 */
export function autoResizeText(textarea: HTMLTextAreaElement) {
	const resize = () => {
		(async () => {
			const scrollPos = window.scrollY;

			await tick();

			textarea.style.height = 'auto';
			textarea.style.height = `${textarea.scrollHeight}px`;

			window.scrollTo(window.scrollX, scrollPos);
		})();
	};

	requestAnimationFrame(resize);

	return {
		update() {
			resize();
		}
	};
}

export function autoResize(
	textarea: HTMLTextAreaElement,
	[text, isExpanded]: [string | undefined, boolean]
) {
	const resize = () => {
		(async () => {
			if (isExpanded) {
				const scrollPos = window.scrollY;

				await tick();

				textarea.style.height = 'auto';
				textarea.style.height = `${textarea.scrollHeight}px`;

				window.scrollTo(window.scrollX, scrollPos);
			} else {
				textarea.style.height = '';
			}
		})();
	};

	requestAnimationFrame(resize);

	return {
		update([newText, newIsExpanded]: [
			string | undefined,
			boolean
		]) {
			isExpanded = newIsExpanded;
			resize();
		}
	};
}
// Define the array shape: [string, boolean]
// export async function autoResize(textarea: HTMLTextAreaElement, [text, isExpanded]: [string | undefined, boolean]) {
//     const resize = async () => {
//         if (isExpanded) {
//             const scrollPos = window.scrollY;
//             await tick();
//             textarea.style.height = 'auto';
//             textarea.style.height = `${textarea.scrollHeight}px`;
//             window.scrollTo(window.scrollX, scrollPos);
//         } else {
//             // Clear the manual height so Tailwind CSS can take over
//             textarea.style.height = ''; 
//         }
//     };

//     // Initial run
//     requestAnimationFrame(resize);

//     return {
//         // The update method MUST also match this array structure
//         update([newText, newIsExpanded]: [string | undefined, boolean]) {
//             isExpanded = newIsExpanded;
//             // Note: 'newText' is passed here so Svelte knows to trigger 
//             // the update when the text changes, even if we don't use it directly.
//             resize();
//         }
//     };
// }
/**
 * Auto-resize all textareas in the document
 */
export function resizeAllTextareas(): void {
	const textareas = document.querySelectorAll('textarea');
	textareas.forEach((textarea) => {
		if (textarea instanceof HTMLTextAreaElement) {
			resizeTextarea(textarea);
		}
	});
}

/**
 * Setup window resize listener to recalculate textarea heights
 * Returns cleanup function
 */
export function setupTextareaResizeListener(): () => void {
	const handleResize = () => {
		resizeAllTextareas();
	};

	window.addEventListener('resize', handleResize);

	return () => {
		window.removeEventListener('resize', handleResize);
	};
}

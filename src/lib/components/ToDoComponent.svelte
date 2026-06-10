<script lang="ts">
  import { onMount } from "svelte";
  import { todayKey } from "$lib/stores/general";
  import {
    todosByDate,
    addTodoItem,
    addTodoRow,
    updateTodoTitle,
    updateTodoRowText,
    toggleTodoRow,
    deleteTodoRow,
    removeTodoItem,
    todoField1,
    todoField2,
    todoExpandedState,
    updateActiveTodo,
  } from "$lib/stores/todo";
  import { sendTodoToProjects } from "$lib/stores/projects";
  import {
    resizeTextarea,
    resizeAllTextareas,
    setupTextareaResizeListener,
  } from "$lib/utils/textareaResize";
    import { borderNTextNBg, buttonStyles } from "$lib/styles";

  // --- Reactive State ---
  let draggingId = $state<string | null>(null);
  let activeTodo = $state(false);

  // --- Drag and Drop Handlers ---
  function onDragStart(e: DragEvent, id: string) {
    console.log("onDrag");
    draggingId = id;
    if (e.dataTransfer) {
      // The "Unlock" for Tauri/Brave
      e.dataTransfer.setData("text/plain", id);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.dropEffect = "move";
    }
    console.log(`Drag started: ${id}`);
  }

  function onDrop(date: string, targetId: string) {
    const currentDraggingId = draggingId;
    if (!currentDraggingId) return;

    todosByDate.update((currentMap) => {
      const newMap = { ...currentMap };
      let movedItem: any = null;

      // 1. FIND AND REMOVE from wherever it currently lives
      for (const d in newMap) {
        const index = newMap[d].findIndex((i) => i.id === currentDraggingId);
        if (index !== -1) {
          [movedItem] = newMap[d].splice(index, 1);
          // Force a fresh array reference for the source date
          newMap[d] = [...newMap[d]];
          break;
        }
      }

      if (!movedItem) {
        console.error(
          "Could not find the item being dragged in any date group!",
        );
        return currentMap;
      }

      // 2. INSERT into the target date at the target position
      const targetItems = [...(newMap[date] || [])];
      const toIndex = targetItems.findIndex((i) => i.id === targetId);

      if (toIndex !== -1) {
        targetItems.splice(toIndex, 0, movedItem);
      } else {
        targetItems.push(movedItem);
      }

      newMap[date] = targetItems;
      console.log(`Successfully moved "${movedItem.title}" to ${date}`);
      return newMap;
    });

    draggingId = null;
  }
  // --- UI Handlers ---
  function toggleExpanded(itemId: string) {
    todoExpandedState.update((state) => ({
      ...state,
      [itemId]: !state[itemId],
    }));

    // Allow DOM to update before resizing
    setTimeout(() => resizeAllTextareas(), 0);
  }

  function handleAddTopLevel() {
    addTodoItem(todayKey());
  }

  function handleAddRow(date: string, itemId: string) {
    addTodoRow(date, itemId);
    todoExpandedState.update((state) => ({ ...state, [itemId]: true }));
    setTimeout(() => resizeAllTextareas(), 0);
  }

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.error("Failed to copy", e);
    }
  }

  function handleSend(date: string, itemId: string, item: any) {
    if (!allRowsCompleted(item)) return;
    const success = sendTodoToProjects(date, itemId);
    if (!success) console.error("Failed to send todo");
  }

  function allRowsCompleted(item: any): boolean {
    return item.rows.length > 0 && item.rows.every((row: any) => row.completed);
  }

  function activeTodoFunction(date:string, item:string, row:string){
    activeTodo = !activeTodo;
    updateActiveTodo(date,item,row,activeTodo);
  }

  // --- Lifecycles & Effects ---
  onMount(() => {
    resizeAllTextareas();
    return setupTextareaResizeListener();
  });

  $effect(() => {
    // This tracks store changes to trigger re-renders if necessary
    const _trigger = [$todoField1, $todoField2, $todosByDate];
    resizeAllTextareas();
  });
</script>

<div class="flex items-start gap-2 mb-0 p-4 w-full">
  <textarea
    bind:value={$todoField1}
    class="bg-white/5 border border-white/40 w-[35%] rounded px-3 py-2 text-white text-xl resize-none"
    placeholder="Field 1"
  ></textarea>
  <textarea
    bind:value={$todoField2}
    class="bg-white/5 border border-white/40 w-[62%] rounded px-3 py-2 text-white text-xl resize-none"
    placeholder="Field 2"
    rows="2"
  ></textarea>
</div>
<button
  onclick={handleAddTopLevel}
  class="{buttonStyles.largeGreenButton}"
>
  +
</button>

{#if Object.keys($todosByDate).length === 0}
  <div class="text-white/70 italic p-10">No todos yet. Click + to start.</div>
{/if}
<!--items is TodoItem[]-->
{#each Object.entries($todosByDate) as [date, items] (date)}
  {#if items.length > 0}
    <div class="w-full flex flex-col gap-2 py-2 px-6 border-b border-white/10">
    <!--item is rows:TodoRow[]-->
      {#each items as item (item.id)}
        <div
          role="listitem"
          ondragover={(e) => {
            e.preventDefault();
            if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
          }}
          ondrop={(e) => {
            e.preventDefault();
            onDrop(date, item.id);
          }}
          ondragend={() => (draggingId = null)}
          class="group relative flex flex-col bg-white/7.5 rounded-xl border-2 transition-all duration-200
           {draggingId === item.id
            ? 'opacity-20 border-blue-500'
            : 'border-transparent hover:border-white/20'} 
           mb-0"
        >
          <div class="ml-10 mr-10 flex items-center gap-4 p-4">
            <div
              draggable="true"
              ondragstart={(e) => {
                e.stopPropagation();
                onDragStart(e, item.id);
              }}
              class="cursor-grab active:cursor-grabbing text-white/20 hover:text-white text-2xl"
            >
              ⠿
            </div>

            <button
              class="text-white text-2xl w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded"
              onclick={(e) => {
                e.stopPropagation();
                toggleExpanded(item.id);
              }}
            >
              {$todoExpandedState[item.id] ? "▼" : "▶"}
            </button>

            <span class="text-white/50 text-xl whitespace-nowrap"
              >{item.date}</span
            >

            <input
              class="todoTitle flex-1 font-mono bg-transparent border-b border-transparent focus:border-blue-500 px-2 py-1 text-white text-3xl outline-none"
              value={item.title}
              onclick={(e) => e.stopPropagation()}
              oninput={(e) => {
                e.stopPropagation();
                updateTodoTitle(
                  date,
                  item.id,
                  (e.target as HTMLInputElement).value,
                );
              }}
            />

            <div class="flex gap-2" onclick={(e) => e.stopPropagation()}>
            <!--item.id is the TodoItem.id and item is the rows:TodoRow[] for that item.id-->
              <button
                class="px-4 py-1 rounded-lg text-white font-medium transition-colors {allRowsCompleted(
                  item,
                )
                  ? 'bg-blue-600 hover:bg-blue-500'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'}"
                onclick={() => handleSend(date, item.id, item)}>Send</button
              >
              <button
                class="bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white px-3 py-1 rounded-lg transition-colors"
                onclick={() => removeTodoItem(date, item.id)}>Del</button
              >
              <button
                class="{buttonStyles.greenButton}"
                onclick={() => handleAddRow(date, item.id)}>+</button
              >
            </div>
          </div>

          {#if $todoExpandedState[item.id]}

            <div
              class="ml-10 mr-10 p-2 pt- space-y-3 ml-12"
              onclick={(e) => e.stopPropagation()}
            >
              {#each item.rows as row (row.id)}
                <div
                  class="flex items-center gap-1 p-0 bg-black/20 rounded-lg border {row.completed
                    ? 'border-green-500/50'
                    : 'border-white/10'}"
                >
                  <button
                    class="ml-4 w-6 h-6 rounded-full justify-center border-2 flex transition-colors {row.completed
                      ? 'bg-green-500 border-green-500'
                      : 'border-white/30'}"
                    onclick={() => toggleTodoRow(date, item.id, row.id)}
                  >
                    {#if row.completed}
                      <span class="text-xs">✔</span>
                    {/if}
                  </button>

                  <textarea
                    class="pl-4 flex-1 font-mono bg-transparent text-white ml-6 text-xl outline-none resize-none 
                    overflow-hidden py-1 leading-tight {row.activeToDo ? borderNTextNBg.whiteBorderShadow : ""}"
                    value={row.text}
                    oninput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      updateTodoRowText(date, item.id, row.id, target.value);
                      resizeTextarea(target);
                    }}
                    ondblclick={() => activeTodoFunction(date,item.id, row.id)}
                  ></textarea>

                  <div class="flex gap-2">
                    <button
                      class="text-white/40 hover:text-white text-sm"
                      onclick={() => handleCopy(row.text)}>Copy</button
                    >
                    <button
                      class="text-red-400 hover:text-red-300 text-sm"
                      onclick={() => deleteTodoRow(date, item.id, row.id)}
                      >Del</button
                    >
                  </div>
                </div>

              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
{/each}

<script lang="ts">
  import { autoResize } from "$lib/utils/textareaResize";
  import { appPersState } from "$lib/stores/state.svelte";
  import { onMount } from "svelte";
  import { persOrder } from "$lib/stores/projects";
  import {
    persGoalHighlights,
    addHighlightItem,
    updateTopHighlight,
    addSubHighlight,
    addDetailHighlight,
    removeHighlight,
    removeSubHighlight,
    removeDetailHighlight,
    updateSubHighlight,
    updateDetailHighlight,
    updateDetailHighlightPattern,
    updateDialogM,
    updateDialogO,
    persGoalExpandedYears, //name makes no sense presently TODO but is functional
    updateDetailHighlightImagePattern,
    updatePatternSteps,
    initStep,
    removeStep,
    initPersOrder,
    type HighlightLevel2,
  } from "$lib/stores/persgoal";
  import PatternComponent from "./PatternComponent.svelte";
  import ImagePattern from "./ImagePattern.svelte";

  let editingDay = $state<{
    eid: string;
    echildid: string;
    edetailid: string;
    etext: string;
  } | null>(null);

  onMount(() => {
    initPersOrder($persGoalHighlights);
  });

  function toggleExpand(dayId: string) {
    const currentState = appPersState.expandedRowsTexArea[dayId] ?? false;

    appPersState.expandedRowsTexArea = {
      ...appPersState.expandedRowsTexArea,
      [dayId]: !currentState,
    };

    console.log(
      `ID: ${dayId} is now:`,
      appPersState.expandedRowsTexArea[dayId],
    );
  }

  function togglesublevel(id: string) {
    $persGoalExpandedYears[id] = !$persGoalExpandedYears[id];
  }

  function togglethirdlevel(childid: string) {
    $persGoalExpandedYears[childid] = !$persGoalExpandedYears[childid];
  }

  function openAllPersRows() {
    for (const key in $persGoalExpandedYears) {
      console.log(`In openAllPersRows ${key}`);
      $persGoalExpandedYears[key] = true;
    }
  }

  // Drag and Drop functionality for HighlightLevel2 rows
  let draggingParentId = $state<string | null>(null);
  let draggingChildId = $state<string | null>(null);

  type LevelTwoChildren = Record<string, HighlightLevel2>;

  function getOrderedLevelTwoEntries(
    parentId: string,
    children: LevelTwoChildren,
  ): [string, HighlightLevel2][] {
    const childIds = Object.keys(children);
    const orderedIds = $persOrder[parentId] ?? [];

    // Keep ids that still exist.
    // Then append any new ids that are not yet in persOrder.
    const normalizedOrder = [
      ...orderedIds.filter((childid) => childid in children),
      ...childIds.filter((childid) => !orderedIds.includes(childid)),
    ];

    return normalizedOrder.map((childid) => [childid, children[childid]]);
  }

  function onDragStart(e: DragEvent, parentId: string, childid: string) {
    draggingParentId = parentId;
    draggingChildId = childid;

    if (!e.dataTransfer) return;

    e.dataTransfer.effectAllowed = "move";

    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        parentId,
        childid,
      }),
    );

    e.dataTransfer.setData("text/plain", childid);
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();

    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "move";
    }
  }

  function onDrop(
    e: DragEvent,
    targetParentId: string,
    targetChildId: string,
    children: LevelTwoChildren,
  ) {
    e.preventDefault();
    e.stopPropagation();

    let sourceParentId = draggingParentId;
    let sourceChildId = draggingChildId;

    if ((!sourceParentId || !sourceChildId) && e.dataTransfer) {
      try {
        const payload = JSON.parse(
          e.dataTransfer.getData("application/json"),
        ) as {
          parentId?: string;
          childid?: string;
        };

        sourceParentId = payload.parentId ?? null;
        sourceChildId = payload.childid ?? null;
      } catch {
        sourceChildId = e.dataTransfer.getData("text/plain") || null;
      }
    }

    if (!sourceParentId || !sourceChildId) return;

    // This keeps dragging limited to children inside the same parent.
    // If later you want cross-parent drag/drop, this condition changes.
    if (sourceParentId !== targetParentId) {
      draggingParentId = null;
      draggingChildId = null;
      return;
    }

    if (sourceChildId === targetChildId) {
      draggingParentId = null;
      draggingChildId = null;
      return;
    }

    persOrder.update((order) => {
      const existingOrder = order[targetParentId] ?? [];
      const childIds = Object.keys(children);

      const normalizedOrder = [
        ...existingOrder.filter((childid) => childid in children),
        ...childIds.filter((childid) => !existingOrder.includes(childid)),
      ];

      const updatedOrder = [...normalizedOrder];

      const fromIndex = updatedOrder.indexOf(sourceChildId);
      const toIndex = updatedOrder.indexOf(targetChildId);

      if (fromIndex === -1 || toIndex === -1) return order;

      const [movedId] = updatedOrder.splice(fromIndex, 1);
      updatedOrder.splice(toIndex, 0, movedId);

      return {
        ...order,
        [targetParentId]: updatedOrder,
      };
    });

    draggingParentId = null;
    draggingChildId = null;
  }

  function onDragEnd() {
    draggingParentId = null;
    draggingChildId = null;
  }
</script>

<div class="m-0 p-0">
  <button
    class="domainsAddButton bg-white/20 hover:bg-white/40 text-white/50
    hover:text-white px-3 py-1 rounded-lg transition-colors float-left"
    onclick={() => addHighlightItem()}
  >
    +
  </button>
</div>
<button
  class="ml-10 rounded text-sm bg-white/10 text-white/30
  hover:bg-black/70 hover:text-white/80 border border-white/30 ml-2"
  onclick={openAllPersRows}
>
  Open All
</button>
<!-- Top level -->
{#each Object.entries($persGoalHighlights) as [id, levelOne] (id)}
  <div class="w-full flex flex-col gap-0 mb-5 pb-5 font-mono">
    <div class="flex">
      <button
        class="bg-white/5 text-white/10
      hover:bg-black/70 hover:text-white/80 float-left rounded text-4xl w-6"
        onclick={() => {
          addSubHighlight(id);
          $persGoalExpandedYears[id] = true;
        }}
      >
        +
      </button>

      <button
        class="text-white/20 text-3xl w-6"
        onclick={() => togglesublevel(id)}
      >
        {$persGoalExpandedYears[id] ? "▼" : "▷"}
      </button>

      <textarea
        class="w-full flex-1 rounded-2xl px-8 pb-5 pt-6 ml-3 mr-3 bg-indigo-400/20 text-indigo-200/50 text-4xl resize-none overflow-hidden
focus:outline-none focus:ring-1 focus:ring-indigo-300 focus:shadow-[0_0_20px_rgba(165,180,252,0.35)]"
        placeholder="Domains ? => Principles ... Questions ... Dialog ... Vocabulary ..."
        rows="1"
        value={levelOne.text || ""}
        oninput={(e) => {
          updateTopHighlight(id, (e.target as HTMLTextAreaElement).value);
        }}
      />

      <button
        class="bg-white/5 text-white/10
  hover:bg-black/70 hover:text-white/80 float-left rounded text-4xl w-6"
        onclick={() => removeHighlight(id)}
      >
        -
      </button>
    </div>

    <!-- Middle level: only render when this top row is expanded -->
    <!--Drag and Drop add here-->
    {#if $persGoalExpandedYears[id] && levelOne.children && Object.keys(levelOne.children).length > 0}
      {#each getOrderedLevelTwoEntries(id, levelOne.children ?? {}) as [childid, levelTwo] (childid)}
        <div
          class="px-6 flex flex-col w-full gap-3 mt-4
  {draggingChildId === childid ? 'opacity-40' : ''}"
          ondragover={onDragOver}
          ondrop={(e) => onDrop(e, id, childid, levelOne.children ?? {})}
        >
          <div class="flex flex-row gap-2 items-start">
            <button
              class="bg-white/5 text-white/10 hover:bg-black/70 hover:text-white/80 float-left rounded text-4xl w-6"
              onclick={() => {
                addDetailHighlight(id, childid);
                $persGoalExpandedYears[childid] = true;
              }}
            >
              +
            </button>

            <button
              onclick={() => toggleExpand(childid)}
              class="mt-1 w-6 h-6 mt-5 rounded-lg border border-white/20 bg-white/5
               hover:bg-white/20 hover:text-white/70 text-white/20 font-mono text-xs transition-colors"
              title="Toggle Expand"
            >
              {appPersState.expandedRowsTexArea[childid] ? "S" : "E"}
            </button>

            <button
              class="text-white/20 text-3xl w-6"
              onclick={() => togglethirdlevel(childid)}
            >
              {$persGoalExpandedYears[childid] ? "▼" : "▷"}
            </button>

            <textarea
              class="flex-1 min-w-0 pb-3 pt-3 mb-2 bg-sky-400/20 rounded-2xl px-3 py-1 text-sky-200/70 text-3xl resize-none overflow-hidden
focus:outline-none focus:ring-1 focus:ring-sky-300/80"
              use:autoResize={[
                levelTwo.text,
                appPersState.expandedRowsTexArea[childid],
              ]}
              rows="1"
              value={levelTwo.text}
              oninput={async (e) => {
                updateSubHighlight(
                  id,
                  childid,
                  (e.target as HTMLTextAreaElement).value,
                );
              }}
            />

            <button
              class="bg-white/5 text-white/10 hover:bg-black/70 hover:text-white/80 float-left rounded text-4xl w-6"
              onclick={() => removeSubHighlight(id, childid)}
            >
              -
            </button>
            <div class="flex flex-col">
            <button
              class="bg-white/10 text-white/40 hover:bg-black/70 hover:text-white/80 rounded text-xl px-2 h-5 mt-1"
              onclick={() => updateDetailHighlightPattern(id, childid)}
            >
              P
            </button>

            <button
              class="bg-white/10 text-white/40 hover:bg-black/70 hover:text-white/80 rounded text-xl px-2 h-5 mt-3"
              onclick={() => updateDetailHighlightImagePattern(id, childid)}
            >
              IP
            </button>
            </div>
            <div class="flex gap-10 ml-auto mt-3">
              <div
                draggable="true"
                ondragstart={(e) => onDragStart(e, id, childid)}
                ondragend={onDragEnd}
                class="cursor-grab active:cursor-grabbing text-white/20 hover:text-white text-2xl select-none"
                title="Drag to reorder"
              >
                ⠿
              </div>
            </div>
          </div>

          <!-- Lower level: only render when this middle row is expanded -->
          {#if $persGoalExpandedYears[childid] && levelTwo.children && Object.keys(levelTwo.children).length > 0}
            {#each Object.entries(levelTwo.children ?? {}) as [detailid, levelThree] (detailid)}
              <div class="ml-15 flex items-center px-16 w-[95%] mt-0">
                <button
                  onclick={() => toggleExpand(detailid)}
                  class="mt-0 mr-2 w-6 h-6 flex-none rounded-lg border border-white/20 bg-white/5 hover:bg-white/20 text-white font-mono text-xs transition-colors"
                  title="Toggle Expand"
                >
                  {appPersState.expandedRowsTexArea[detailid] ? "S" : "E"}
                </button>

                <textarea
                  class="flex-1 pb-2 pt-2 mb-4 rounded-2xl px-3 py-1 text-2xl resize-none overflow-hidden
                  focus:outline-none focus:ring-1 {levelThree.one
                    ? 'bg-white/70 text-black border border-white/30 focus:ring-white/80'
                    : levelThree.me
                      ? 'bg-black/20 text-white/70 border border-white/20 focus:ring-white/60'
                      : 'bg-amber-400/10 text-amber-100/60 focus:ring-amber-300/80'}"
                  use:autoResize={[
                    levelThree.text,
                    appPersState.expandedRowsTexArea[detailid],
                  ]}
                  ondblclick={() => {
                    editingDay = {
                      eid: id,
                      echildid: childid,
                      edetailid: detailid,
                      etext: levelThree.text || "",
                    };
                  }}
                  value={levelThree.text}
                  rows="1"
                  oninput={(e) => {
                    updateDetailHighlight(
                      id,
                      childid,
                      detailid,
                      (e.target as HTMLTextAreaElement).value,
                    );
                  }}
                />

                <button
                  class="bg-white/10 text-white/30
  hover:bg-black/70 hover:text-white/80 float-left rounded text-4xl w-6 ml-2 mr-25"
                  onclick={() => removeDetailHighlight(id, childid, detailid)}
                >
                  -
                </button>
                <div class="flex flex-col float-end">
                  <label class="flex gap-1 cursor-pointer">
                    <span class="text-teal-100/50 text-sm leading-tight">
                      M
                    </span>

                    <input
                      type="checkbox"
                      bind:checked={levelThree.me}
                      onchange={(e) =>
                        updateDialogM(
                          id,
                          childid,
                          detailid,
                          (e.target as HTMLInputElement).checked,
                        )}
                      class="w-4 h-4 accent-teal-500 opacity-20"
                    />
                  </label>

                  <label class="flex gap-1 cursor-pointer">
                    <span class="text-cyan-100/50 text-sm leading-tight">
                      O
                    </span>

                    <input
                      type="checkbox"
                      bind:checked={levelThree.one}
                      onchange={(e) =>
                        updateDialogO(
                          id,
                          childid,
                          detailid,
                          (e.target as HTMLInputElement).checked,
                        )}
                      class="w-4 h-4 accent-cyan-500 opacity-20"
                    />
                  </label>
                </div>
              </div>
            {/each}
            {#if $persGoalExpandedYears[childid] && Object.keys(levelTwo.patterns ?? {}).length !== 0}
              <PatternComponent
                {id}
                {childid}
                {levelTwo}
                {updatePatternSteps}
                {initStep}
                {removeStep}
              />
            {/if}

            {#if $persGoalExpandedYears[childid] && Object.keys(levelTwo.imagePatterns ?? {}).length !== 0}
              <ImagePattern {id} {childid} {levelTwo} />
            {/if}
          {/if}
        </div>
      {/each}
    {/if}
  </div>
{/each}

{#if editingDay}
  <div class="fixed inset-0 z-[100] flex items-center justify-center">
    <div
      class="absolute inset-0 bg-black/80 backdrop-blur-md"
      onclick={() => (editingDay = null)}
    ></div>

    <div
      class="relative w-[95vw] md:w-[90vw] lg:w-[85vw] h-[80vh] bg-[#1a1a1a] border border-white/20 rounded-3xl flex flex-col shadow-2xl"
    >
      <div
        class="p-4 border-b border-white/10 flex justify-between items-center text-white/50 font-mono"
      >
        <span>EDITOR</span>
        <span class="text-xs">Through Perseverance We Conquer</span>
      </div>

      <textarea
        class="flex-1 bg-transparent p-4 text-white text-2xl font-mono outline-none resize-none overflow-y-auto"
        style="padding-top: 5vh; padding-bottom: 5vh;"
        bind:value={editingDay.etext}
        autofocus
      ></textarea>

      <div class="p-6 border-t border-white/10 flex">
        <div class="flex mr-4">
          <button
            onclick={() => {
              const current = editingDay;
              if (!current) return;
              updateDetailHighlight(
                current.eid,
                current.echildid,
                current.edetailid,
                current.etext,
              );

              // saveUserEncryptionData();
              editingDay = null;
            }}
            class="border hover:border-white bg-black/50 text-white/30 hover:text-white px-3 py-1 rounded-lg transition-colors"
          >
            Save
          </button>

          <button
            onclick={() => {
              editingDay = null;
            }}
            class="border hover:border-white bg-black/50 text-white/30 hover:text-white px-3 py-1 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

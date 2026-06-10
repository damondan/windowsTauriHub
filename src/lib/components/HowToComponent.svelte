<!-- src/lib/components/HowToComponent.svelte -->
<script lang="ts">
  import { onMount, tick } from "svelte";
  import { autoResize } from "$lib/utils/textareaResize";
  import { buttonStyles } from "$lib/styles";
  import {
    howtoData,
    addHowToCategory,
    deleteHowToCategory,
    updateHowToCategoryName,
    addHowToSubcategory,
    updateHowToSubcategoryName,
    addHowToTopic,
    updateHowToTopicName,
    addHowToTask,
    updateHowToTaskText,
    deleteHowToTask,
    howtoExpandedCategories,
    howtoExpandedSubcategories,
    howtoExpandedTopics,
    deleteHowToSubCategory,
    deleteHowToTopic,
  } from "$lib/stores/howto";

  import {
    resizeTextarea,
    resizeAllTextareas,
    setupTextareaResizeListener,
  } from "$lib/utils/textareaResize";

  function toggleCategory(categoryId: string) {
    howtoExpandedCategories.update((state) => ({
      ...state,
      [categoryId]: !state[categoryId],
    }));
  }

  function toggleSubcategory(key: string) {
    howtoExpandedSubcategories.update((state) => ({
      ...state,
      [key]: !state[key],
    }));
  }

  async function toggleTopic(key: string) {
    howtoExpandedTopics.update((state) => ({ ...state, [key]: !state[key] }));
    await tick();
    resizeAllTextareas();
  }

  // Setup window resize listener for textareas
  onMount(() => {
    return setupTextareaResizeListener();
  });

  function openAllRows() {
    howtoExpandedCategories.update((howto) => {
      const updated: Record<string, boolean> = {};

      for (const key in howto) {
        updated[key] = true;
      }

      return updated;
    });
    howtoExpandedSubcategories.update((howtosubs) => {
      const updated: Record<string, boolean> = {};

      for (const key in howtosubs) {
        updated[key] = true;
      }

      return updated;
    });
    howtoExpandedTopics.update((tasks) => {
      const updated: Record<string, boolean> = {};

      for (const key in tasks) {
        updated[key] = true;
      }

      return updated;
    });
  }
</script>

<button
  class="float-left ml-10 rounded text-sm bg-white/10 text-white/30
  hover:bg-black/70 hover:text-white/80 border border-white/30 ml-2"
  onclick={openAllRows}
>
  Open All
</button>
<!-- Header with Add button -->
<div class="flex items-center justify-end mb-6">
  <button
    onclick={() => addHowToCategory()}
    class="bg-green-500/30 hover:bg-green-600/50 text-white w-10 h-10 rounded-lg font-bold text-2xl transition-colors flex items-center justify-center"
  >
    +
  </button>
</div>

<!-- Empty state -->
{#if $howtoData.length === 0}
  <div class="text-white/70 italic">
    No HowTos yet. Click + to add your first category.
  </div>
{/if}

<!-- Categories list -->
{#each $howtoData as category (category.id)}
  <div class="mb-3">
    <!-- Level 1: Category -->
    <div class="bg-white/10 rounded-xl p-3">
      <div class="flex items-center gap-3">
        <button
          class="text-white text-3xl w-6"
          onclick={() => toggleCategory(category.id)}
        >
          {$howtoExpandedCategories[category.id] ? "▼" : "▷"}
        </button>

        <input
          type="text"
          class="flex-1 bg-white/5 border border-white/20 rounded px-3 py-2 text-white text-3xl placeholder-white/40"
          placeholder="Category name..."
          value={category.name}
          oninput={(e) =>
            updateHowToCategoryName(
              category.id,
              (e.target as HTMLInputElement).value,
            )}
        />

        <button
          class={buttonStyles.greenButton}
          onclick={() => addHowToSubcategory(category.id)}
        >
          +
        </button>

        <button
          class="bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white px-3 py-1 rounded-lg transition-colors"
          onclick={() => deleteHowToCategory(category.id)}
        >
          Del
        </button>
      </div>
    </div>

    <!-- Level 2: Subcategories (only show when category expanded) -->
    {#if $howtoExpandedCategories[category.id]}
      <div class="ml-10 mr-10 mt-2 space-y-2">
        {#each category.subcategories as subcategory (subcategory.id)}
          {@const subKey = `${category.id}-${subcategory.id}`}
          <div class="bg-white/10 rounded-xl p-3">
            <div class="flex items-center gap-3">
              <button
                class="text-white text-3xl w-6"
                onclick={() => toggleSubcategory(subKey)}
              >
                {$howtoExpandedSubcategories[subKey] ? "▼" : "▷"}
              </button>

              <input
                type="text"
                class="flex-1 bg-white/5 border border-white/20 rounded px-3 py-2 text-white text-3xl placeholder-white/40"
                placeholder="Subcategory name..."
                value={subcategory.name}
                oninput={(e) =>
                  updateHowToSubcategoryName(
                    category.id,
                    subcategory.id,
                    (e.target as HTMLInputElement).value,
                  )}
              />

              <button
                class={buttonStyles.greenButton}
                onclick={() => addHowToTopic(category.id, subcategory.id)}
              >
                +
              </button>
              <button
                class="bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white px-3 py-1 rounded-lg transition-colors"
                onclick={() =>
                  deleteHowToSubCategory(category.id, subcategory.id)}
              >
                Del
              </button>
            </div>
          </div>

          <!-- Level 3: Topics (only show when subcategory expanded) -->
          {#if $howtoExpandedSubcategories[subKey]}
            <div class="ml-10 mr-10 mt-2 space-y-2">
              {#each subcategory.topics as topic (topic.id)}
                {@const topicKey = `${category.id}-${subcategory.id}-${topic.id}`}
                <div class="bg-white/10 rounded-xl p-3">
                  <div class="flex items-center gap-3">
                    <button
                      class="text-white text-3xl w-6"
                      onclick={() => toggleTopic(topicKey)}
                    >
                      {$howtoExpandedTopics[topicKey] ? "▼" : "▷"}
                    </button>

                    <textarea
                      rows="1"
                      class="flex-1 bg-transparent border border-white/20 rounded px-2 py-1
                          text-white text-3xl resize-none overflow-hidden leading-tight break-words whitespace-normal"
                      placeholder="How To Descriptor..."
                      value={topic.name}
                      oninput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        updateHowToTopicName(
                          category.id,
                          subcategory.id,
                          topic.id,
                          target.value,
                        );
                        // Auto-resize
                        resizeTextarea(target);
                      }}
                    ></textarea>
                    <button
                      class={buttonStyles.greenButton}
                      onclick={() =>
                        addHowToTask(category.id, subcategory.id, topic.id)}
                    >
                      +
                    </button>
                    <button
                      class="bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white px-3 py-1 rounded-lg transition-colors"
                      onclick={() =>
                        deleteHowToTopic(category.id, subcategory.id, topic.id)}
                    >
                      Del
                    </button>
                  </div>

                  <!-- HowTo Tasks (only show when topic expanded) -->
                  {#if $howtoExpandedTopics[topicKey]}
                    <div class="mt-2 space-y-2">
                      {#each topic.tasks as task (task.id)}
                        <div
                          class="flex items-center gap-3 bg-white/5 rounded-lg p-2"
                        >
                          <textarea
                            rows="1"
                            class="flex-1 bg-transparent border border-white/20 rounded px-2 py-1
                          text-white text-3xl resize-none overflow-hidden leading-tight break-words whitespace-normal"
                            placeholder="How To Descriptor..."
                            value={task.text}
                            use:autoResize={[
                              task.text,
                              $howtoExpandedTopics[topicKey],
                            ]}
                            oninput={(el) => {
                              const targetTask =
                                el.target as HTMLTextAreaElement;
                              targetTask.style.height = "auto";
                              targetTask.style.height =
                                targetTask.scrollHeight + "px";
                              updateHowToTaskText(
                                category.id,
                                subcategory.id,
                                topic.id,
                                task.id,
                                targetTask.value,
                              );
                            }}
                          ></textarea>
                          <button
                            class="bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white px-3 py-1 rounded-lg transition-colors"
                            onclick={() =>
                              deleteHowToTask(
                                category.id,
                                subcategory.id,
                                topic.id,
                                task.id,
                              )}
                          >
                            Del
                          </button>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        {/each}
      </div>
    {/if}
  </div>
{/each}

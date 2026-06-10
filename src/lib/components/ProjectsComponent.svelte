<!-- src/lib/components/ProjectsComponent.svelte -->
<script lang="ts">
  import {
    projectsData,
    deleteProject,
    deleteSubProject,
    deleteTask,
    projectExpandedProjects,
    projectExpandedSubprojects,
    projectExpandedTasks,
    projectOrder,
  } from "$lib/stores/projects";

  //Dragging functionality
  let draggingId = $state<string | null>(null);
  function onDragStart(e: DragEvent, projectId: string) {
    draggingId = projectId;

    if (!e.dataTransfer) return;

    // fallback (browser compatibility / debugging)
    e.dataTransfer.setData("text/plain", projectId);

    e.dataTransfer.effectAllowed = "move";
  }

  function onDrop(targetProjectId: string) {
    const draggedId = draggingId;

    if (!draggedId) return;
    if (draggedId === targetProjectId) return;

    projectOrder.update((order) => {
      const updated = [...order];

      // 1. Find dragged item index
      const fromIndex = updated.indexOf(draggedId);

      if (fromIndex === -1) return order;

      // 2. Remove dragged item
      updated.splice(fromIndex, 1);

      // 3. Find target index (after removal!)
      const toIndex = updated.indexOf(targetProjectId);

      if (toIndex === -1) {
        // fallback: put at end
        updated.push(draggedId);
      } else {
        // insert at target position
        updated.splice(toIndex, 0, draggedId);
      }

      return updated;
    });

    draggingId = null;
  }

  function toggleProject(projectName: string) {
    projectExpandedProjects.update((state) => ({
      ...state,
      [projectName]: !state[projectName],
    }));
  }

  function toggleSubproject(key: string) {
    projectExpandedSubprojects.update((state) => ({
      ...state,
      [key]: !state[key],
    }));
  }

  function toggleTask(key: string) {
    projectExpandedTasks.update((state) => ({ ...state, [key]: !state[key] }));
  }

  function formatDate(isoString: string): string {
    return isoString.split("T")[0];
  }

  function formatDateTime(isoString: string | undefined): string {
    if (!isoString) return "N/A";
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  }

  function openAll() {
    projectExpandedProjects.update((projects) => {
      const updated: Record<string, boolean> = {};

      for (const key in projects) {
        updated[key] = true;
      }

      return updated;
    });
    projectExpandedSubprojects.update((subs) => {
      const updated: Record<string, boolean> = {};

      for (const key in subs) {
        updated[key] = true;
      }

      return updated;
    });
    projectExpandedTasks.update((tasks) => {
      const updated: Record<string, boolean> = {};

      for (const key in tasks) {
        updated[key] = true;
      }

      return updated;
    });
  }
</script>

<!-- Header -->
<!-- <div class="mb-10"></div> -->
<button
  class="rounded text-sm bg-white/10 text-white/30
  hover:bg-black/70 hover:text-white/80 border border-white/30 ml-2"
  onclick={openAll}
>
  Open All
</button>

<!-- Empty state -->
{#if Object.keys($projectsData).length === 0}
  <div class="text-white/70 italic">
    No projects yet. Send a Todo from the To Do tab to create your first
    project.
  </div>
{/if}

<!-- Projects list -->
<!-- {#each Object.values($projectsData) as project (project.name)} -->
{#each $projectOrder as projectName}
  {@const project = $projectsData[projectName]}
  <div class="mb-3">
    <!-- Level 1: Project -->

    <div
      class="bg-white/10 rounded-xl p-3 cursor-pointer hover:bg-white/15"
      onclick={() => toggleProject(project.name)}
      ondragover={(e) => e.preventDefault()}
      ondrop={() => onDrop(project.name)}
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="text-white text-3xl w-6"
            >{$projectExpandedProjects[project.name] ? "▼" : "▷"}</span
          >
          <span class="text-gray-500 text-3xl font-semibold tracking-wide"
            >{project.name}</span
          >
        </div>
        <div class="flex gap-10">
          <div
            draggable="true"
            ondragstart={(e) => onDragStart(e, projectName)}
            class="cursor-grab active:cursor-grabbing text-white/20 hover:text-white text-2xl"
          >
            ⠿
          </div>
          <button
            class="bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white px-3 py-1 rounded-lg transition-colors"
            onclick={(e) => {
              e.stopPropagation();
              deleteProject(project.name);
            }}
          >
            Del
          </button>
        </div>
      </div>
    </div>

    <!-- Level 2: Subprojects (only show when project expanded) -->
    {#if $projectExpandedProjects[project.name]}
      <div class="ml-10 mr-10 mt-2 space-y-2">
        {#each Object.values(project.subprojects) as subproject (subproject.name)}
          {@const subKey = `${project.name}-${subproject.name}`}
          <div class="bg-white/10 rounded-xl p-3 cursor-pointer hover:bg-white/15"
          onclick={() => toggleSubproject(subKey)}
        >
          <div class="flex items-center">
            <span class="text-white text-3xl w-6">
              {$projectExpandedSubprojects[subKey] ? "▼" : "▷"}
            </span>

            <span class="text-white text-3xl ml-3">
              {subproject.name}
            </span>

            <button
              class="ml-auto bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white px-3 py-1 rounded-lg transition-colors"
              onclick={(e) => {
                e.stopPropagation();
                deleteSubProject(project.name,subproject.name);
              }}
            >
              Del
            </button>
          </div>
        </div>

          <!-- Level 3: Tasks (only show when subproject expanded) -->
          {#if $projectExpandedSubprojects[subKey]}
            <div class="ml-10 mr-10 mt-2 space-y-2">
              {#each subproject.tasks as task (task.id)}
                {@const taskKey = `${project.name}-${subproject.name}-${task.id}`}
                <div class="bg-white/10 rounded-xl p-3">
                  <div
                    class="flex w-full items-center gap-3 cursor-pointer hover:bg-white/5 rounded p-2 -m-2"
                    onclick={() => toggleTask(taskKey)}
                  >
                    <span class="text-white text-3xl w-6"
                      >{$projectExpandedTasks[taskKey] ? "▼" : "▷"}</span
                    >
                    <span class="text-white text-3xl"
                      >{task.description}
                      <span class="text-white/30 text-3xl"
                        >{formatDate(task.startDate)} - {formatDate(
                          task.endDate,
                        )}</span
                      ></span
                    >
                    <button
                      class="ml-auto bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white px-3 py-1 rounded-lg transition-colors"
                      onclick={(e) => {
                        e.stopPropagation();
                        deleteTask(project.name, subproject.name, task.id);
                      }}
                    >
                      Del
                    </button>
                  </div>

                  <!-- Todo Rows (only show when task expanded) -->
                  {#if $projectExpandedTasks[taskKey]}
                    <div class="mt-3 space-y-2">
                      {#each task.rows as row (row.id)}
                        <div
                          class="border rounded-lg p-2 flex items-start gap-3 {row.completed
                            ? 'border-green-500'
                            : 'border-red-500'}"
                        >
                          <!-- Completion indicator -->

                          <!-- Row text -->
                          <div
                            class="flex-1 text-white text-3xl leading-tight break-words whitespace-normal"
                          >
                            {row.text}
                          </div>

                          <!-- Timestamps -->
                          <div class="text-white/70 text-2xl whitespace-nowrap">
                            Start: {formatDateTime(row.startTime)} | Finish: {formatDateTime(
                              row.finishTime,
                            )}
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
      </div>
    {/if}
  </div>
{/each}

<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { saveUserEncryptionData } from "$lib/persistence";
  import { autoResize } from "$lib/utils/textareaResize";
  import { getMonthName, fileToDataUrl } from "$lib/stores/general";
  import { borderNTextNBg, buttonStyles } from "$lib/styles";
  import { appPersState } from "$lib/stores/state.svelte";
  import PersHighlights from "$lib/components/PersHighlights.svelte";
  import { tick } from "svelte";
  import { fade } from "svelte/transition";
  import {
    persGoalData,
    generatePersGoalStructureToDate,
    updateYearPrivateGoal,
    updateMonthPrivateGoals,
    updateWeekPrivateGoals,
    updateDayPrivateGoals,
    persGoalExpandedYears,
    persGoalExpandedMonths,
    persGoalExpandedWeeks,
    updateDayImage,
    updateWeekImage,
    updateMonthImage,
    updateYearImage,
    removeDayImage,
    removeWeekImage,
    removeMonthImage,
    removeYearImage,
    updateDayIsDream,
    updateHighlight,
    persLockState,
  } from "$lib/stores/persgoal";
  import { app } from "@tauri-apps/api";

  let now = new Date();
  //let currentDay = now.getDate();
  let currentDay = $state(getCurrentDay());
  let currentWeekOfMonth = Math.ceil(new Date().getDate() / 7);
  let currentMonth = new Date().getMonth() + 1;
  let currentYear = new Date().getFullYear();

  // Dialog state
  let showPrivateGoalDialog = $state(false);
  let pendingPrivateGoalChange = $state<{
    yearId: string;
    value: string;
    changeCount: number;
  } | null>(null);

  //Hide initial months
  let lastRow = $derived(
    ($persGoalData.find((y) => y.year === currentYear)?.months?.length ?? 0) -
      1,
  );

  let activeTarget = $state<{
    yearId: string;
    monthId?: string;
    weekId?: string;
    dayId?: string;
  } | null>(null);

  let imageInput: HTMLInputElement | null = null;

  function openImagePicker(
    yearId: string,
    monthId?: string,
    weekId?: string,
    dayId?: string,
  ): void {
    activeTarget = { yearId, monthId, weekId, dayId }; // ✅ assign object
    imageInput?.click();
  }

  let editingDay = $state<{
    yearId: string;
    monthId: string;
    weekId: string;
    dayId: string;
    text: string;
    title: string;
    tags: string[];
  } | null>(null);

  let showSaved = $state(false);

  function getCurrentDay() {
    return new Date().getDate();
  }
  function refreshCurrentDay() {
    currentDay = getCurrentDay();
  }

  function toggleExpand(dayId: string) {
    const currentState = appPersState.expandedRows[dayId] ?? false;

    appPersState.expandedRows = {
      ...appPersState.expandedRows,
      [dayId]: !currentState,
    };

    console.log(`ID: ${dayId} is now:`, appPersState.expandedRows[dayId]);
  }

  async function handleImageChange(e: Event): Promise<void> {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file || !activeTarget) return;

    const target = activeTarget; // snapshot
    activeTarget = null;

    const dataUrl = await fileToDataUrl(file);

    if (target.dayId) {
      updateDayImage(
        dataUrl,
        target.yearId,
        target.monthId!,
        target.weekId!,
        target.dayId,
      );
    } else if (target.weekId) {
      updateWeekImage(dataUrl, target.yearId, target.monthId!, target.weekId);
    } else if (target.monthId) {
      updateMonthImage(dataUrl, target.yearId, target.monthId);
    } else {
      updateYearImage(dataUrl, target.yearId);
    }

    input.value = ""; // allow reselecting same file
  }

  // onMount(): void
  onMount(() => {
    console.log(`In PersonalComponent onMount`);
    const today = new Date();
    // Always generate structure to ensure current date data exists
    generatePersGoalStructureToDate(today);
  });

  // isCurrentDay(year: number, month: number, day: number): boolean
  function isCurrentDay(
    yearNum: number,
    monthNum: number,
    dayNum: number,
  ): boolean {
    return (
      yearNum === currentYear &&
      monthNum === currentMonth &&
      dayNum === currentDay
    );
  }

  onDestroy(() => {
    console.log(`PersonalComponent onDestroy`);
  });

  // toggleYear(yearId: string): void
  function toggleYear(yearId: string) {
    console.log(`in toggleYear should execute scheduleSaveEncrypt`);
    persGoalExpandedYears.update((state) => ({
      ...state,
      [yearId]: !state[yearId],
    }));
    saveUserEncryptionData();
  }

  // toggleMonth(key: string): void
  function toggleMonth(key: string) {
    console.log(`toggleMonth and key is ${key}`);
    persGoalExpandedMonths.update((state) => ({
      ...state,
      [key]: !state[key],
    }));
    saveUserEncryptionData();
  }

  // toggleWeek(key: string): void
  function toggleWeek(key: string) {
    persGoalExpandedWeeks.update((state) => ({ ...state, [key]: !state[key] }));
    saveUserEncryptionData();
  }

  function handlePrivateGoalClick(
    yearId: string,
    currentValue: string,
    changeCount: number,
  ) {
    pendingPrivateGoalChange = { yearId, value: currentValue, changeCount };
    showPrivateGoalDialog = true;
  }

  function showTopToggle() {
    appPersState.showTopPers = !appPersState.showTopPers;
  }

  function savePers() {
    saveUserEncryptionData();
  }

  function showSavedFunc() {
    showSaved = true;

    setTimeout(() => {
      showSaved = false;
    }, 1000);
  }

  function addTagInput() {
    editingDay?.tags.push("");
  }
</script>

<!-- Empty state -->
{#if $persGoalData.length === 0}
  <div class="text-white/70 italic">Locked or Loading...</div>
{/if}

<div>
  <button
    class="float-right rounded text-sm bg-white/10 text-white/30
  hover:bg-black/70 hover:text-white/80 border border-white/30 ml-2"
    onclick={() => showTopToggle()}
  >
    Top
  </button>
</div>
<div
  class="{appPersState.showTopPers
    ? 'bg-white/10 rounded-xl mb-2 ml-2'
    : borderNTextNBg.collapseRows} "
>
  <PersHighlights />
</div>

<!-- Years list -->
{#each $persGoalData as year (year.id)}
  <div class="mb-3">
    <!-- Level 1: Year -->
    <div class="bg-white/10 rounded-xl p-3">
      <div class="flex items-center gap-3">
        <button
          class="text-white text-3xl w-6"
          onclick={() => toggleYear(year.id)}
        >
          {$persGoalExpandedYears[year.id] ? "▼" : "▷"}
        </button>

        <div class="text-white/80 text-3xl font-semibold">
          {year.year}
        </div>

        <!-- Yrly Priv. Goal -->
        <button
          onclick={() => toggleExpand(year.id)}
          class="mt-1 w-6 h-6 flex-none rounded-lg border border-white/20 bg-white/5 hover:bg-white/20 text-white font-mono text-xs transition-colors"
          title="Toggle Expand"
        >
          {appPersState.expandedRows[year.id] ? "S" : "E"}
        </button>
        <textarea
          class="flex-1 bg-transparent border-0 px-5 py-1 text-white text-2xl font-bold tracking-widest resize-none focus:outline-none"
          placeholder="Personal ... "
          rows="1"
          readonly
          value={year.yearPrivateGoal || ""}
          onclick={() => {
            handlePrivateGoalClick(
              year.id,
              year.yearPrivateGoal || "",
              year.yearPrivateGoalChangeCount,
            );
            saveUserEncryptionData();
          }}
        ></textarea>
        <input
          bind:this={imageInput}
          type="file"
          accept="image/*"
          class="hidden"
          onchange={handleImageChange}
        />
        <button
          class="w-6 h-6 text-white/80 text-xs rounded-full border-red-700 border-2 flex items-center
          justify-center border hover:border-white"
          onclick={() => {
            savePers();
            showSavedFunc();
          }}
          >S
        </button>
        {#if showSaved}
          <div
            transition:fade={{ duration: 800 }}
            class="mt-2 text-green-400 font-mono"
          >
            Saved
          </div>
        {/if}
        <button
          class="w-6 h-6 text-white/80 text-xs rounded-full border-green-700 border-2 flex items-center justify-center border hover:border-white"
          onclick={() => openImagePicker(year.id, "", "")}
          >I
        </button>
        {#if year.yearImage?.dataUrl}
          <img
            src={year.yearImage?.dataUrl}
            class={appPersState.expandedRows[year.id]
              ? "mt-2 max-w-full h-auto rounded-lg"
              : "mt-2 max-w-full rounded-lg h-10"}
            ondblclick={() => removeYearImage(year.id)}
          />
        {/if}
      </div>
    </div>

    <!-- Level 2: Months (only show when year expanded) -->
    {#if $persGoalExpandedYears[year.id]}
      <div class="ml-10 mr-10 mt-2 space-y-2">
        {#each year.months as month, i (month.id)}
          {@const monthKey = `${year.id}-${month.id}`}
          {@const hasMonthGoals = !!month.monthPrivateGoals?.trim()}
          {@const isThisMonth = currentMonth === month.monthNumber}
          {@const hasDayGoals = month.weeks.some((week) =>
            week.days.some((day) => day.dayPrivateGoals?.trim()),
          )}
          {@const hasWeekGoals = month.weeks.some((week) =>
            week.weekPrivateGoals?.trim(),
          )}
          {@const result =
            hasMonthGoals || isThisMonth || hasDayGoals || hasWeekGoals}

          <div
            class={result
              ? "bg-white/10 rounded-xl p-3 text-white"
              : borderNTextNBg.collapseRows}
          >
            <div class="flex items-center gap-3 leading-none">
              <button
                class="text-3xl w-6 shrink-0 leading-none"
                onclick={() => toggleMonth(monthKey)}
              >
                {$persGoalExpandedMonths[monthKey] ? "▼" : "▷"}
              </button>

              <div class="text-3xl font-semibold w-38 shrink-0 leading-none">
                {getMonthName(month.monthNumber)}
              </div>
              <!--Monthly Private Goals -->
              <button
                onclick={() => toggleExpand(month.id)}
                class="mt-1 w-6 h-6 flex-none rounded-lg border border-white/20 bg-white/5 hover:bg-white/20 text-white font-mono text-xs transition-colors"
                title="Toggle Expand"
              >
                {appPersState.expandedRows[month.id] ? "S" : "E"}
              </button>
              <textarea
                class="flex-1 bg-white/10 rounded-2xl px-3 py-1 text-white text-xl resize-none overflow-hidden
                focus:outline-none focus:ring-1 focus:ring-white focus:shadow-[0_0_20px_rgba(255,255,255,0.3)]
                    {borderNTextNBg.lightBorder}"
                placeholder=""
                rows="1"
                use:autoResize={[
                  month.monthPrivateGoals,
                  appPersState.expandedRows[month.id],
                ]}
                value={month.monthPrivateGoals || ""}
                oninput={(e) => {
                  const textarea = e.target as HTMLTextAreaElement;
                  textarea.style.height = "auto";
                  textarea.style.height = textarea.scrollHeight + "px";
                  updateMonthPrivateGoals(
                    year.id,
                    month.id,
                    (e.target as HTMLTextAreaElement).value,
                  );
                }}
              ></textarea>
              <input
                bind:this={imageInput}
                type="file"
                accept="image/*"
                class="hidden"
                onchange={handleImageChange}
              />
              <button
                class="w-6 h-6 text-white/80 text-xs rounded-full border-green-700 border-2 flex items-center justify-center border hover:border-white"
                onclick={() => openImagePicker(year.id, month.id, "")}
                >I
              </button>
              {#if month.monthImage?.dataUrl}
                <img
                  src={month.monthImage?.dataUrl}
                  class={appPersState.expandedRows[month.id]
                    ? "mt-2 max-w-full h-auto rounded-lg"
                    : "mt-2 max-w-full h-10 rounded-lg"}
                  ondblclick={() => removeMonthImage(year.id, month.id)}
                />
              {/if}
            </div>
          </div>

          <!-- Level 3: Weeks (only show when month expanded) -->
          {#if $persGoalExpandedMonths[monthKey]}
            <div class="ml-10 mr-10 mt-2 space-y-2 bg-white/10">
              {#each month.weeks as week (week.id)}
                {@const weekKey = `${year.id}-${month.id}-${week.id}`}
                {@const hasWeekGoals = !!week.weekPrivateGoals?.trim()}
                {@const isThisWeek =
                  currentWeekOfMonth === week.weekNumber &&
                  currentMonth == month.monthNumber}
                {@const hasDayGoals = week.days.some((day) =>
                  day.dayPrivateGoals?.trim(),
                )}
                {@const result = hasWeekGoals || isThisWeek || hasDayGoals}
                <div
                  class={result
                    ? "rounded-xl p-3"
                    : borderNTextNBg.collapseRows}
                >
                  <div class="flex items-center gap-3">
                    <button
                      class="text-white text-3xl w-6"
                      onclick={() => toggleWeek(weekKey)}
                    >
                      {$persGoalExpandedWeeks[weekKey] ? "▼" : "▷"}
                    </button>

                    <div class="text-white text-3xl font-semibold w-30">
                      {week.startDay}-{week.endDay}
                    </div>

                    <!-- Private Wkly -->
                    <button
                      onclick={() => toggleExpand(week.id)}
                      class="mt-1 w-6 h-6 flex-none rounded-lg border border-white/20 bg-white/5 hover:bg-white/20 text-white font-mono text-xs transition-colors"
                      title="Toggle Expand"
                    >
                      {appPersState.expandedRows[week.id] ? "S" : "E"}
                    </button>
                    <textarea
                      class="flex-1 bg-white/10 rounded-2xl px-3 py-1 text-white text-xl resize-none overflow-hidden
                      focus:outline-none focus:ring-1 focus:ring-white focus:shadow-[0_0_30px_rgba(255,255,255,0.3)] {borderNTextNBg.lightBorder}"
                      placeholder=""
                      rows="1"
                      use:autoResize={[
                        week.weekPrivateGoals,
                        appPersState.expandedRows[week.id],
                      ]}
                      value={week.weekPrivateGoals || ""}
                      oninput={(e) => {
                        const textarea = e.target as HTMLTextAreaElement;
                        textarea.style.height = "auto";
                        textarea.style.height = textarea.scrollHeight + "px";
                        updateWeekPrivateGoals(
                          year.id,
                          month.id,
                          week.id,
                          (e.target as HTMLTextAreaElement).value,
                        );
                      }}
                    ></textarea>
                    <input
                      bind:this={imageInput}
                      type="file"
                      accept="image/*"
                      class="hidden"
                      onchange={handleImageChange}
                    />
                    <button
                      class="w-6 h-6 text-white/80 text-xs rounded-full border-green-700 border-2 flex items-center justify-center border hover:border-white"
                      onclick={() =>
                        openImagePicker(year.id, month.id, week.id)}
                      >I
                    </button>
                    {#if week.weekImage?.dataUrl}
                      <img
                        src={week.weekImage?.dataUrl}
                        class={appPersState.expandedRows[week.id]
                          ? "mt-2 max-w-full h-auto rounded-lg"
                          : "mt-2 max-w-full h-10 rounded-lg"}
                        ondblclick={() =>
                          removeWeekImage(year.id, month.id, week.id)}
                      />
                    {/if}
                  </div>

                  <!-- Days (only show when week expanded) -->
                  {#if $persGoalExpandedWeeks[weekKey] && week.days}
                    <div class="ml-10 mr-10 mt-3 space-y-3">
                      {#each week.days as day (day.id)}
                        {@const hasDayGoals = day.dayPrivateGoals?.trim()}
                        {@const isCurrDay = day.dayNumber == currentDay}
                        {@const result = hasDayGoals || isCurrDay}
                        <div
                          class={result
                            ? "rounded-lg p-3 bg-white/5"
                            : borderNTextNBg.collapseRows}
                        >
                          <!-- Day entry -->
                          <div class="flex items-center gap-3">
                            <!-- Day label -->
                            <div
                              class="text-white text-2xl font-semibold whitespace-nowrap w-38"
                            >
                              {day.dayNumber}
                              {day.dayOfWeek}
                            </div>

                            <!-- Private Daily -->
                            <button
                              onclick={() => toggleExpand(day.id)}
                              class="mt-1 w-6 h-6 flex-none rounded-lg border border-white/20 bg-white/5 hover:bg-white/20 text-white font-mono text-xs transition-colors"
                              title="Toggle Expand"
                            >
                              {appPersState.expandedRows[day.id] ? "S" : "E"}
                            </button>

                            <textarea
                              class="flex-1 bg-white/10 rounded-2xl ml-4 px-3 py-1 text-white text-xl resize-none overflow-hidden
                              focus:outline-none focus:ring-1 focus:ring-white focus:shadow-[0_0_30px_rgba(255,255,255,0.3)]
                                 {isCurrDay
                                ? 'border-3 border-green-500/70'
                                : day.isDream
                                  ? 'border-3 border-blue-700'
                                  : day.highlight
                                    ? 'border-3 border-yellow-400'
                                    : 'border border-white/30'}"
                              placeholder=""
                              rows="1"
                              value={day.dayPrivateGoals || ""}
                              use:autoResize={[
                                day.dayPrivateGoals,
                                appPersState.expandedRows[day.id],
                              ]}
                              ondblclick={() => {
                                editingDay = {
                                  yearId: year.id,
                                  monthId: month.id,
                                  weekId: week.id,
                                  dayId: day.id,
                                  text: day.dayPrivateGoals || "",
                                  title: day.title || "",
                                  tags: day.dayTags || [],
                                };
                              }}
                              oninput={(e) => {
                                // Keep your existing persistence logic
                                updateDayPrivateGoals(
                                  year.id,
                                  month.id,
                                  week.id,
                                  day.id,
                                  (e.target as HTMLTextAreaElement).value,
                                );
                              }}
                            ></textarea>
                            <input
                              bind:this={imageInput}
                              type="file"
                              accept="image/*"
                              class="hidden"
                              onchange={handleImageChange}
                            />
                            <button
                              class="w-6 h-6 text-white/80 text-xs rounded-full border-green-700 border-2 flex
                              items-center justify-center border hover:border-white"
                              onclick={() =>
                                openImagePicker(
                                  year.id,
                                  month.id,
                                  week.id,
                                  day.id,
                                )}
                              >I
                            </button>
                            {#if day.dayImage?.dataUrl}
                              <img
                                src={day.dayImage?.dataUrl}
                                class={appPersState.expandedRows[day.id]
                                  ? "mt-2 max-w-full h-auto rounded-lg"
                                  : "mt-2 max-w-full h-10 rounded-lg"}
                                ondblclick={() =>
                                  removeDayImage(
                                    year.id,
                                    month.id,
                                    week.id,
                                    day.id,
                                  )}
                              />
                            {/if}
                            <label class="flex gap-1 cursor-pointer">
                              <span class="text-white text-sm leading-tight"
                                >D</span
                              >
                              <input
                                type="checkbox"
                                bind:checked={day.isDream}
                                onchange={(e) =>
                                  updateDayIsDream(
                                    year.id,
                                    month.id,
                                    week.id,
                                    day.id,
                                    (e.target as HTMLInputElement).checked,
                                  )}
                                class="w-4 h-4 accent-blue-600 opacity-50"
                              />
                            </label>
                            <!--day.-->
                            <label class="flex gap-1 cursor-pointer">
                              <span class="text-white text-sm leading-tight"
                                >H</span
                              >
                              <input
                                type="checkbox"
                                bind:checked={day.highlight}
                                onchange={(e) =>
                                  updateHighlight(
                                    year.id,
                                    month.id,
                                    week.id,
                                    day.id,
                                    (e.target as HTMLInputElement).checked,
                                  )}
                                class="w-4 h-4 accent-yellow-600 opacity-50"
                              />
                            </label>
                          </div>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
              {/each}
              <!--week -->
            </div>
          {/if}
        {/each}
      </div>
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
        <input
          type="text"
          placeholder="..."
          bind:value={editingDay.title}
          class="bg-transparent border border-white/10 rounded px-2 py-1 text-center
           text-white outline-none focus:border-white/30 w-94"
        />
        <span class="text-xs">Through Perseverance We Conquer</span>
      </div>

      <textarea
        class="flex-1 bg-transparent p-4 text-white text-2xl font-mono outline-none resize-none overflow-y-auto"
        style="padding-top: 5vh; padding-bottom: 5vh;"
        bind:value={editingDay.text}
        autofocus
      ></textarea>

      <div class="p-6 border-t border-white/10 flex">
        <div class="flex mr-4">
          {#each editingDay.tags as tag, index}
            <input
              type="text"
              placeholder="#"
              bind:value={editingDay.tags[index]}
              class="bg-transparent border border-white/10 rounded px-2 py-1 text-center
           text-white outline-none focus:border-white/30 w-74 mr-10"
            />
          {/each}
          <button
            class="bg-black/50 hover:bg-white/50 text-white/30 hover:text-white px-3 py-1 rounded-lg transition-colors"
            onclick={addTagInput}>+</button
          >
        </div>
        <button
          onclick={() => {
            const current = editingDay;
            if (!current) return;
            updateDayPrivateGoals(
              current.yearId,
              current.monthId,
              current.weekId,
              current.dayId,
              current.text,
              current.title,
              current.tags,
            );

            //saveUserEncryptionData();
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
{/if}
{#if showPrivateGoalDialog}
  <div
    class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
    onclick={() => (showPrivateGoalDialog = false)}
  >
    <div
      class="bg-gradient-to-br from-purple-900/90 to-blue-900/90 border border-white/30 rounded-xl p-6 max-w-2xl"
      onclick={(e) => e.stopPropagation()}
    >
      <h3 class="text-white text-2xl font-semibold mb-4">
        Change Professional Goal
      </h3>
      <p class="text-white/90 text-xl mb-4">
        Are you sure you want to change your professional goal?
      </p>
      {#if pendingPrivateGoalChange && pendingPrivateGoalChange.changeCount > 0}
        <p class="text-yellow-400 text-lg mb-6">
          This is the {pendingPrivateGoalChange.changeCount}{pendingPrivateGoalChange.changeCount ===
          1
            ? "st"
            : pendingPrivateGoalChange.changeCount === 2
              ? "nd"
              : pendingPrivateGoalChange.changeCount === 3
                ? "rd"
                : "th"} time you have changed it.
        </p>
      {/if}
      <textarea
        class="w-full bg-white/10 border border-yellow-500 rounded px-4 py-3 text-white text-xl resize-none mb-6"
        placeholder="Enter your professional goal..."
        rows="3"
        bind:value={pendingPrivateGoalChange!.value}
      ></textarea>
      <div class="flex gap-3 justify-end">
        <button
          class="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xl font-semibold transition-colors"
          onclick={() => (showPrivateGoalDialog = false)}
        >
          Cancel
        </button>
        <button
          class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xl font-semibold transition-colors"
          onclick={() => {
            if (pendingPrivateGoalChange) {
              updateYearPrivateGoal(
                pendingPrivateGoalChange.yearId,
                pendingPrivateGoalChange.value,
              );
              pendingPrivateGoalChange = null;
            }
            showPrivateGoalDialog = false;
          }}
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- src/lib/components/GoalComponent.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import { autoResize } from "$lib/utils/textareaResize";
  import { getMonthName } from "$lib/stores/general";
  import { borderNTextNBg, buttonStyles } from "$lib/styles";
  import { appProfState } from "$lib/stores/state.svelte";
  import {
    profGoalData,
    generateProfGoalStructureToDate,
    updateYearProfessionalGoal,
    updateMonthProfessionalGoals,
    updateWeekProfessionalGoals,
    updateDayProfessionalGoals,
    toggleDayProfessionalCompleted,
    toggleWeekProfessionalCompleted,
    toggleMonthProfessionalCompleted,
    profGoalExpandedYears,
    profGoalExpandedMonths,
    profGoalExpandedWeeks,
    removeHighlight,
    addHighlightItem
  } from "$lib/stores/profgoal";
    // import ProfHighlights from "$lib/components/ProfHighlights.svelte";

  let currentDay = new Date().getDate();
  let currentWeekOfMonth = Math.ceil(new Date().getDate() / 7);
  let currentMonth = new Date().getMonth() + 1;
  let currentYear = new Date().getFullYear();

  let lastRow = $derived(
    ($profGoalData.find((y) => y.year === currentYear)?.months?.length ?? 0) -
      1,
  );

  let showProfessionalDayDialog = $state(false);
  let pendingProfessionalDayAction = $state<{
    yearId: string;
    monthId: string;
    weekId: string;
    dayId: string;
  } | null>(null);

  let showProfessionalWeekDialog = $state(false);
  let pendingProfessionalWeekAction = $state<{
    yearId: string;
    monthId: string;
    weekId: string;
  } | null>(null);
  let showProfessionalMonthDialog = $state(false);
  let pendingProfessionalMonthAction = $state<{
    yearId: string;
    monthId: string;
  } | null>(null);
  let showProfessionalGoalDialog = $state(false);

  let pendingProfessionalGoalChange = $state<{
    yearId: string;
    value: string;
    changeCount: number;
  } | null>(null);

  // onMount(): void
  onMount(() => {
    const today = new Date();
    // Always generate structure to ensure current date data exists
    generateProfGoalStructureToDate(today);
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

  let editingDay = $state<{
    yearId: string;
    monthId: string;
    weekId: string;
    dayId: string;
    text: string;
  } | null>(null);

  // toggleYear(yearId: string): void
  function toggleYear(yearId: string) {
    profGoalExpandedYears.update((state) => ({
      ...state,
      [yearId]: !state[yearId],
    }));
  }

  // toggleMonth(key: string): void
  function toggleMonth(key: string) {
    profGoalExpandedMonths.update((state) => ({
      ...state,
      [key]: !state[key],
    }));
  }

  // toggleWeek(key: string): void
  function toggleWeek(key: string) {
    profGoalExpandedWeeks.update((state) => ({ ...state, [key]: !state[key] }));
  }

  function toggleExpand(dayId: string) {
    const currentState = appProfState.expandedRowsProf[dayId] ?? false;

    appProfState.expandedRowsProf = {
      ...appProfState.expandedRowsProf,
      [dayId]: !currentState,
    };

    console.log(`ID: ${dayId} is now:`, appProfState.expandedRowsProf[dayId]);
  }

  // handleProfessionalGoalClick(yearId: string, currentValue: string, changeCount: number): void
  function handleProfessionalGoalClick(
    yearId: string,
    currentValue: string,
    changeCount: number,
  ) {
    pendingProfessionalGoalChange = {
      yearId,
      value: currentValue,
      changeCount,
    };
    showProfessionalGoalDialog = true;
  }

  function showTopToggle() {
    appProfState.showTopProf = !appProfState.showTopProf
  }


</script>

<!-- <div>
  <button
    class="float-right rounded text-sm bg-white/10 text-white/30
  hover:bg-black/70 hover:text-white/80 border border-white/30"
    onclick={() => showTopToggle()}
  >
    Top
  </button>
</div> -->
<!-- <div
  class="{appProfState.showTopProf
    ? 'bg-white/10 rounded-xl mb-2 ml-2'
    : borderNTextNBg.collapseRows} "
>
  <ProfHighlights />
</div> -->

<!-- Empty state -->
{#if $profGoalData.length === 0}
  <div class="text-white/70 italic">Loading...</div>
{/if}

<!-- Years list -->
{#each $profGoalData as year (year.id)}
  <div class="mb-3">
    <!-- Level 1: Year -->
    <div class="bg-white/10 rounded-xl p-3">
      <div class="flex items-center gap-3">
        <button
          class="text-white text-3xl w-6"
          onclick={() => toggleYear(year.id)}
        >
          {$profGoalExpandedYears[year.id] ? "▼" : "▷"}
        </button>

        <div class="text-white/80 text-3xl font-semibold">
          {year.year}
        </div>

        <!-- Yrly Prof. Goal -->

        <textarea
          class="flex-1 bg-transparent border-0 px-5 py-1 text-white text-2xl font-bold tracking-widest resize-none focus:outline-none"
          placeholder="Professional "
          rows="1"
          readonly
          value={year.yearProfessionalGoal || ""}
          onclick={() =>
            handleProfessionalGoalClick(
              year.id,
              year.yearProfessionalGoal || "",
              year.yearProfessionalGoalChangeCount,
            )}
        ></textarea>
      </div>
    </div>

    <!-- Level 2: Months (only show when year expanded) -->
    {#if $profGoalExpandedYears[year.id]}
      <div class="ml-10 mr-10 mt-2 space-y-2">
        {#each year.months as month, i (month.id)}
          {@const monthKey = `${year.id}-${month.id}`}
          {@const hasMonthGoals = !!month.monthProfessionalGoals?.trim()}
          {@const isThisMonth = currentMonth === month.monthNumber}
          {@const hasDayGoals = month.weeks.some((week) =>
            week.days.some((day) => day.dayProfessionalGoals?.trim()),
          )}
          {@const hasWeekGoals = month.weeks.some((week) =>
            week.weekProfessionalGoals?.trim(),
          )}

          {@const result =
            hasMonthGoals || isThisMonth || hasDayGoals || hasWeekGoals}
          <div
            class={result
              ? "bg-white/10 rounded-xl p-3"
              : borderNTextNBg.collapseRows}
          >
            <div class="flex items-center gap-3">
              <button
                class="text-white text-3xl w-6 shrink-0"
                onclick={() => toggleMonth(monthKey)}
              >
                {$profGoalExpandedMonths[monthKey] ? "▼" : "▷"}
              </button>

              <div class="text-white text-3xl font-semibold w-38 shrink-0">
                {getMonthName(month.monthNumber)}
              </div>
              <!--Monthly Professional Goals -->
              <button
                onclick={() => toggleExpand(month.id)}
                class="mt-1 w-6 h-6 flex-none rounded-lg border border-white/20 bg-white/5 hover:bg-white/20 text-white font-mono text-xs transition-colors"
                title="Toggle Expand"
              >
                {appProfState.expandedRowsProf[month.id] ? "S" : "E"}
              </button>
              <textarea
                class="flex-1 bg-white/10 rounded-2xl px-3 py-1 text-white text-xl resize-none overflow-hidden
                focus:outline-none focus:ring-1 focus:ring-white focus:shadow-[0_0_20px_rgba(255,255,255,0.3)] {month.proGoalCompleted
                  ? 'border-2 border-white shadow-[0_0_15px_rgba(255,255,255,0.8)]'
                  : month.proGoalRejected
                    ? 'border-2 border-black shadow-[0_0_15px_rgba(0,0,0,0.8)]'
                    : borderNTextNBg.lightBorder}"
                placeholder=""
                rows="1"
                use:autoResize={[
                  month.monthProfessionalGoals,
                  appProfState.expandedRowsProf[month.id],
                ]}
                value={month.monthProfessionalGoals || ""}
                oninput={(e) => {
                  const textarea = e.target as HTMLTextAreaElement;
                  textarea.style.height = "auto";
                  textarea.style.height = textarea.scrollHeight + "px";
                  updateMonthProfessionalGoals(
                    year.id,
                    month.id,
                    (e.target as HTMLTextAreaElement).value,
                  );
                }}
              ></textarea>
              <button
                class="w-10 h-10 rounded-full border-2 flex items-center justify-center {month.proGoalCompleted
                  ? 'border-white shadow-[0_0_15px_rgba(255,255,255,0.8)]'
                  : month.proGoalRejected
                    ? 'border-black shadow-[0_0_15px_rgba(0,0,0,0.8)]'
                    : buttonStyles.circleLightHover}"
                onclick={() => {
                  if (!month.proGoalCompleted && !month.proGoalRejected) {
                    pendingProfessionalMonthAction = {
                      yearId: year.id,
                      monthId: month.id,
                    };
                    showProfessionalMonthDialog = true;
                  } else {
                    toggleMonthProfessionalCompleted(year.id, month.id);
                  }
                }}
              >
                {#if month.proGoalCompleted}
                  <span class="text-white text-sm font-bold">⭐</span>
                {:else if month.proGoalRejected}
                  <span class="text-white text-2xl font-bold"></span>
                {:else}
                  <span class="text-white">?</span>
                {/if}
              </button>
            </div>
          </div>

          <!-- Level 3: Weeks (only show when month expanded) -->
          {#if $profGoalExpandedMonths[monthKey]}
            <div class="ml-10 mr-10 mt-2 space-y-2 bg-white/10">
              {#each month.weeks as week (week.id)}
                {@const weekKey = `${year.id}-${month.id}-${week.id}`}
                {@const hasWeekGoals = !!week.weekProfessionalGoals?.trim()}
                {@const isThisWeek =
                  currentWeekOfMonth === week.weekNumber &&
                  currentMonth == month.monthNumber}
                {@const hasDayGoals = week.days.some((day) =>
                  day.dayProfessionalGoals?.trim(),
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
                      {$profGoalExpandedWeeks[weekKey] ? "▼" : "▷"}
                    </button>

                    <div class="text-white text-3xl font-semibold w-25">
                      {week.startDay}-{week.endDay}
                    </div>

                    <!-- Professional -->
                    <button
                      onclick={() => toggleExpand(month.id)}
                      class="mt-1 w-6 h-6 flex-none rounded-lg border border-white/20 bg-white/5 hover:bg-white/20 text-white font-mono text-xs transition-colors"
                      title="Toggle Expand"
                    >
                      {appProfState.expandedRowsProf[week.id] ? "S" : "E"}
                    </button>
                    <textarea
                      class="flex-1 ml-15 mr-15 bg-white/10 rounded-2xl px-3 py-1 text-white text-xl resize-none overflow-hidden
                      focus:outline-none focus:ring-1 focus:ring-white focus:shadow-[0_0_30px_rgba(255,255,255,0.3)] {week.proGoalCompleted
                        ? 'border-2 border-white shadow-[0_0_15px_rgba(255,255,255,0.8)]'
                        : week.proGoalRejected
                          ? 'border-2 border-black shadow-[0_0_15px_rgba(0,0,0,0.8)]'
                          : 'border border-white/30'}"
                      placeholder=""
                      rows="1"
                      value={week.weekProfessionalGoals || ""}
                      use:autoResize={[
                        week.weekProfessionalGoals,
                        appProfState.expandedRowsProf[month.id],
                      ]}
                      oninput={(e) => {
                        const textarea = e.target as HTMLTextAreaElement;
                        textarea.style.height = "auto";
                        textarea.style.height = textarea.scrollHeight + "px";
                        updateWeekProfessionalGoals(
                          year.id,
                          month.id,
                          week.id,
                          (e.target as HTMLTextAreaElement).value,
                        );
                      }}
                    ></textarea>
                    <button
                      class="w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 {week.proGoalCompleted
                        ? 'border-white shadow-[0_0_15px_rgba(255,255,255,0.8)]'
                        : week.proGoalRejected
                          ? ''
                          : 'border-gray-500 hover:border-white'}"
                      onclick={() => {
                        if (!week.proGoalCompleted && !week.proGoalRejected) {
                          pendingProfessionalWeekAction = {
                            yearId: year.id,
                            monthId: month.id,
                            weekId: week.id,
                          };
                          showProfessionalWeekDialog = true;
                        } else {
                          toggleWeekProfessionalCompleted(
                            year.id,
                            month.id,
                            week.id,
                          );
                        }
                      }}
                    >
                      {#if week.proGoalCompleted}
                        <span class="text-white text-sm font-bold">⭐</span>
                      {:else if week.proGoalRejected}
                        <span class="text-black text-2xl font-bold"></span>
                      {:else}
                        <span class="text-white">?</span>
                      {/if}
                    </button>
                  </div>

                  <!-- Days (only show when week expanded) -->
                  {#if $profGoalExpandedWeeks[weekKey] && week.days}
                    <div class="ml-10 mr-10 mt-3 space-y-3">
                      {#each week.days as day (day.id)}
                        {@const hasDayGoals = day.dayProfessionalGoals?.trim()}
                        {@const isCurrDay =
                          currentDay == day.dayNumber &&
                          currentMonth == month.monthNumber}
                        {@const result = hasDayGoals || isCurrDay}
                        <div
                          class={result
                            ? "rounded-lg p-3"
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

                            <!-- Professional -->
                            <button
                              onclick={() => toggleExpand(day.id)}
                              class="mt-1 w-6 h-6 flex-none rounded-lg border border-white/20 bg-white/5 hover:bg-white/20 text-white font-mono text-xs transition-colors"
                              title="Toggle Expand"
                            >
                              {appProfState.expandedRowsProf[day.id]
                                ? "S"
                                : "E"}
                            </button>
                            <textarea
                              class="flex-1 ml-20 mr-20 bg-white/10 rounded-2xl px-3 py-1 text-white text-xl resize-none overflow-hidden
                              focus:outline-none focus:ring-1 focus:ring-white focus:shadow-[0_0_30px_rgba(255,255,255,0.3)] {day.proGoalCompleted
                                ? 'border-2 border-white shadow-[0_0_15px_rgba(255,255,255,0.8)]'
                                : day.proGoalRejected
                                  ? 'border-2 border-black shadow-[0_0_15px_rgba(0,0,0,0.8)]'
                                  : 'border border-white/30'}"
                              placeholder=""
                              rows="1"
                              value={day.dayProfessionalGoals || ""}
                              use:autoResize={[
                                day.dayProfessionalGoals,
                                appProfState.expandedRowsProf[day.id],
                              ]}
                              ondblclick={() => {
                                editingDay = {
                                  yearId: year.id,
                                  monthId: month.id,
                                  weekId: week.id,
                                  dayId: day.id,
                                  text: day.dayProfessionalGoals || "",
                                };
                              }}
                              oninput={(e) => {
                                updateDayProfessionalGoals(
                                  year.id,
                                  month.id,
                                  week.id,
                                  day.id,
                                  (e.target as HTMLTextAreaElement).value,
                                );
                              }}
                            ></textarea>
                            <button
                              class="w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 {day.proGoalCompleted
                                ? 'border-white shadow-[0_0_15px_rgba(255,255,255,0.8)]'
                                : day.proGoalRejected
                                  ? 'border-black shadow-[0_0_15px_rgba(0,0,0,0.8)]'
                                  : 'border border-white/30 hover:border-white'}"
                              onclick={() => {
                                if (
                                  !day.proGoalCompleted &&
                                  !day.proGoalRejected
                                ) {
                                  pendingProfessionalDayAction = {
                                    yearId: year.id,
                                    monthId: month.id,
                                    weekId: week.id,
                                    dayId: day.id,
                                  };
                                  showProfessionalDayDialog = true;
                                } else {
                                  toggleDayProfessionalCompleted(
                                    year.id,
                                    month.id,
                                    week.id,
                                    day.id,
                                  );
                                }
                              }}
                            >
                              {#if day.proGoalCompleted}
                                <span class="text-white text-sm font-bold"
                                  >⭐</span
                                >
                              {:else if day.proGoalRejected}
                                <span class="text-black text-2xl font-bold"
                                ></span>
                              {:else}
                                <span class="text-white">?</span>
                              {/if}
                            </button>
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
        bind:value={editingDay.text}
        autofocus
      ></textarea>

      <div class="p-6 border-t border-white/10 flex justify-end">
        <button
          onclick={() => {
            const current = editingDay;
            if (!current) return;
            updateDayProfessionalGoals(
              current.yearId,
              current.monthId,
              current.weekId,
              current.dayId,
              current.text,
            );

            // 2. Close modal
            editingDay = null;
          }}
          class="bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
        >
          Save
        </button>
        <button
          onclick={() => {
            editingDay = null;
          }}
          class="bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Custom Professional Day Dialog -->
{#if showProfessionalDayDialog}
  <div
    class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
    onclick={() => (showProfessionalDayDialog = false)}
  >
    <div
      class="flex flex-wrap w-80 bg-gradient-to-t from-black to-white border border-white/30 rounded-xl p-6 max-w-md"
      onclick={(e) => e.stopPropagation()}
    >
      <div class="flex flex-wrap gap-3 justify-center">
        <button
          class="px-6 py-2 {buttonStyles.circleLightHover} text-white rounded-lg text-xl font-semibold transition-colors"
          onclick={() => {
            if (pendingProfessionalDayAction) {
              toggleDayProfessionalCompleted(
                pendingProfessionalDayAction.yearId,
                pendingProfessionalDayAction.monthId,
                pendingProfessionalDayAction.weekId,
                pendingProfessionalDayAction.dayId,
                false,
              );
              pendingProfessionalDayAction = null;
            }
            showProfessionalDayDialog = false;
          }}
        >
          Despair
        </button>
        <button
          class="px-6 py-2 {buttonStyles.circleLightHover} text-white rounded-lg text-xl font-semibold transition-colors"
          onclick={() => {
            if (pendingProfessionalDayAction) {
              toggleDayProfessionalCompleted(
                pendingProfessionalDayAction.yearId,
                pendingProfessionalDayAction.monthId,
                pendingProfessionalDayAction.weekId,
                pendingProfessionalDayAction.dayId,
                true,
              );
              pendingProfessionalDayAction = null;
            }
            showProfessionalDayDialog = false;
          }}
        >
          Faith
        </button>
        <button
          class="px-6 py-2 {buttonStyles.circleLightHover} text-white rounded-lg text-xl font-semibold transition-colors"
          onclick={() => (showProfessionalDayDialog = false)}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Custom Professional Week Dialog -->
{#if showProfessionalWeekDialog}
  <div
    class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
    onclick={() => (showProfessionalWeekDialog = false)}
  >
    <div
      class="flex flex-wrap w-80 bg-gradient-to-t from-black to-white border border-white/30 rounded-xl p-6 max-w-md"
      onclick={(e) => e.stopPropagation()}
    >
      <div class="flex flex-wrap gap-3 justify-center">
        <button
          class="px-6 py-2 {buttonStyles.circleLightHover} text-white rounded-lg text-xl font-semibold transition-colors"
          onclick={() => {
            if (pendingProfessionalWeekAction) {
              toggleWeekProfessionalCompleted(
                pendingProfessionalWeekAction.yearId,
                pendingProfessionalWeekAction.monthId,
                pendingProfessionalWeekAction.weekId,
                false,
              );
              pendingProfessionalWeekAction = null;
            }
            showProfessionalWeekDialog = false;
          }}
        >
          Convert
        </button>
        <button
          class="px-6 py-2 {buttonStyles.circleLightHover} text-white rounded-lg text-xl font-semibold transition-colors"
          onclick={() => {
            if (pendingProfessionalWeekAction) {
              toggleWeekProfessionalCompleted(
                pendingProfessionalWeekAction.yearId,
                pendingProfessionalWeekAction.monthId,
                pendingProfessionalWeekAction.weekId,
                true,
              );
              pendingProfessionalWeekAction = null;
            }
            showProfessionalWeekDialog = false;
          }}
        >
          Fight
        </button>
        <button
          class="px-6 py-2 {buttonStyles.circleLightHover} text-white rounded-lg text-xl font-semibold transition-colors"
          onclick={() => (showProfessionalWeekDialog = false)}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Custom Professional Month Dialog -->
{#if showProfessionalMonthDialog}
  <div
    class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
    onclick={() => (showProfessionalMonthDialog = false)}
  >
    <div
      class="flex flex-wrap w-80 bg-gradient-to-t from-black to-white border border-white/30 rounded-xl p-6 max-w-md"
      onclick={(e) => e.stopPropagation()}
    >
      <div class="flex flex-wrap gap-3 justify-center">
        <button
          class="px-6 py-2 {buttonStyles.circleLightHover} text-white rounded-lg text-xl font-semibold transition-colors"
          onclick={() => {
            if (pendingProfessionalMonthAction) {
              toggleMonthProfessionalCompleted(
                pendingProfessionalMonthAction.yearId,
                pendingProfessionalMonthAction.monthId,
                false,
              );
              pendingProfessionalMonthAction = null;
            }
            showProfessionalMonthDialog = false;
          }}
        >
          Convert
        </button>
        <button
          class="px-6 py-2 {buttonStyles.circleLightHover} text-white rounded-lg text-xl font-semibold transition-colors"
          onclick={() => {
            if (pendingProfessionalMonthAction) {
              toggleMonthProfessionalCompleted(
                pendingProfessionalMonthAction.yearId,
                pendingProfessionalMonthAction.monthId,
                true,
              );
              pendingProfessionalMonthAction = null;
            }
            showProfessionalMonthDialog = false;
          }}
        >
          Fight
        </button>
        <button
          class="px-6 py-2 {buttonStyles.circleLightHover} text-white rounded-lg text-xl font-semibold transition-colors"
          onclick={() => (showProfessionalMonthDialog = false)}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Professional Goal Dialog -->
{#if showProfessionalGoalDialog}
  <div
    class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
    onclick={() => (showProfessionalGoalDialog = false)}
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
      {#if pendingProfessionalGoalChange && pendingProfessionalGoalChange.changeCount > 0}
        <p class="text-yellow-400 text-lg mb-6">
          This is the {pendingProfessionalGoalChange.changeCount}{pendingProfessionalGoalChange.changeCount ===
          1
            ? "st"
            : pendingProfessionalGoalChange.changeCount === 2
              ? "nd"
              : pendingProfessionalGoalChange.changeCount === 3
                ? "rd"
                : "th"} time you have changed it.
        </p>
      {/if}
      <textarea
        class="w-full bg-white/10 border border-yellow-500 rounded px-4 py-3 text-white text-xl resize-none mb-6"
        placeholder="Enter your professional goal..."
        rows="3"
        bind:value={pendingProfessionalGoalChange!.value}
      ></textarea>
      <div class="flex gap-3 justify-end">
        <button
          class="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xl font-semibold transition-colors"
          onclick={() => (showProfessionalGoalDialog = false)}
        >
          Cancel
        </button>
        <button
          class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xl font-semibold transition-colors"
          onclick={() => {
            if (pendingProfessionalGoalChange) {
              updateYearProfessionalGoal(
                pendingProfessionalGoalChange.yearId,
                pendingProfessionalGoalChange.value,
              );
              pendingProfessionalGoalChange = null;
            }
            showProfessionalGoalDialog = false;
          }}
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
{/if}

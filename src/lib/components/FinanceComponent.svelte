<!-- src/lib/components/FinanceComponent.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import { getMonthName } from "$lib/stores/general";
  import FinanceCalendar from "$lib/components/FinanceCalendar.svelte";
  import { borderNTextNBg, buttonStyles } from "$lib/styles";
  import {
    financeData,
    financeNames,
    generateFinanceStructureToDate,
    addFinanceEntry,
    deleteFinanceEntry,
    updateFinanceEntry,
    updateFinanceEntryCheckbox,
    updateFinanceMonthAmount,
    calculateYearTotal,
    calculateMonthTotal,
    calculateMonthHBBalance,
    calculateWeekTotal,
    formatCurrency,
    financeExpandedYears,
    financeExpandedMonths,
    financeExpandedWeeks,
    calculateMonthFoodTotal,
    calculateMonthGasTotal,
    type FinanceYear,
    type FinanceMonth,
  } from "$lib/stores/finance";

  let currentDay = new Date().getDate();
  let currentMonth = new Date().getMonth() + 1;
  let currentYear = new Date().getFullYear();

  let showNameEditor = $state(false);

  let draftFinanceNames = $state($financeNames);

  function toggleNameEditor() {
    showNameEditor = !showNameEditor;

    // Copy current store value into draft
    draftFinanceNames = { ...$financeNames };
  }

  function changeFinanceNames() {
    // Update store value
    financeNames.set({ ...draftFinanceNames });

    showNameEditor = false;
  }

  function cancelFinanceNames() {
    draftFinanceNames = { ...$financeNames };
    showNameEditor = false;
  }

  // onMount(): void
  onMount(() => {
    // Only regenerate if data is empty or has old structure
    const today = new Date();
    const currentData = $financeData;

    // Check if we need to regenerate (empty or old structure without days array)
    const needsRegeneration =
      currentData.length === 0 ||
      (currentData[0]?.months?.[0]?.weeks?.[0] &&
        !currentData[0].months[0].weeks[0].days);

    if (needsRegeneration) {
      financeData.set([]);
    }

    generateFinanceStructureToDate(today);
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

  // toggleYear(yearId: string): void
  function toggleYear(yearId: string) {
    financeExpandedYears.update((state) => ({
      ...state,
      [yearId]: !state[yearId],
    }));
  }

  // toggleMonth(key: string): void
  function toggleMonth(key: string) {
    financeExpandedMonths.update((state) => ({ ...state, [key]: !state[key] }));
  }

  // toggleWeek(key: string): void
  function toggleWeek(key: string) {
    financeExpandedWeeks.update((state) => ({ ...state, [key]: !state[key] }));
  }

  // handleRadioChange
  function handleRadioChange(
    yearId: string,
    monthId: string,
    weekId: string,
    dayId: string,
    entryId: string,
    field: "isHB" | "isDisc" | "isAmerX" | "isGas" | "isFood" | "isOther",
  ) {
    // Radio buttons are always "checked" when clicked, so pass true
    updateFinanceEntryCheckbox(
      yearId,
      monthId,
      weekId,
      dayId,
      entryId,
      field,
      true,
    );
  }
</script>

<!-- Empty state -->
{#if $financeData.length === 0}
  <div class="text-white/70 italic">Loading...</div>
{/if}

<!--Show Name Editor to change checking,primary,secondary-->
{#if showNameEditor}
  <div
    class="w-full mt-3 mb-4 rounded-lg border border-white/20
        bg-white/5 p-3 flex items-center gap-3"
  >
    <input
      bind:value={draftFinanceNames.checking}
      placeholder="Checking Account"
      class="bg-black/30 text-white/70 border border-white/20
            rounded px-2 py-1 outline-none"
    />

    <input
      bind:value={draftFinanceNames.primaryCard}
      placeholder="Primary Credit Card"
      class="bg-black/30 text-white/70 border border-white/20
            rounded px-2 py-1 outline-none"
    />

    <input
      bind:value={draftFinanceNames.secondaryCard}
      placeholder="Secondary Credit Card"
      class="bg-black/30 text-white/70 border border-white/20
            rounded px-2 py-1 outline-none"
    />

    <div class="flex gap-2">
      <button
        type="button"
        onclick={cancelFinanceNames}
        class="rounded text-sm bg-white/10 text-white/30
		hover:bg-black/70 hover:text-white/80
		border border-white/30 px-3 py-1"
      >
        Cancel
      </button>

      <button
        type="button"
        onclick={changeFinanceNames}
        class="rounded text-sm bg-white/10 text-white/30
		hover:bg-black/70 hover:text-white/80
		border border-white/30 px-3 py-1"
      >
        Change
      </button>
    </div>
  </div>
{/if}

<button
  class="float-right rounded text-sm bg-white/10 text-white/30
  hover:bg-black/70 hover:text-white/80 border border-white/30 ml-2"
  onclick={toggleNameEditor}
>
  Names
</button>

<!-- Years list -->
{#each $financeData as year (year.id)}
  <div class="mb-3">
    <!-- Level 1: Year -->
    <div class="bg-white/10 rounded-xl p-1">
      <div class="flex items-center gap-3">
        <button
          class="text-white text-3xl w-6"
          onclick={() => toggleYear(year.id)}
        >
          {$financeExpandedYears[year.id] ? "▼" : "▷"}
        </button>

        <div class="flex-1 text-white text-3xl font-semibold">
          {year.year}
        </div>

        <div class="text-white text-2xl font-semibold">
          {formatCurrency(calculateYearTotal(year))}
        </div>
      </div>
    </div>

    <!-- Level 2: Months (only show when year expanded) -->
    {#if $financeExpandedYears[year.id]}
      <div class="ml-10 mr-10 mt-2 space-y-2">
        {#each year.months as month (month.id)}
          {@const isThisMonth = currentMonth === month.monthNumber}
          {@const monthHasFood = !!calculateMonthFoodTotal(month)}
          {@const collapseRowBool = !isThisMonth && !monthHasFood}
          {@const monthKey = `${year.id}-${month.id}`}
          <div
            class={collapseRowBool
              ? borderNTextNBg.collapseRows
              : "bg-white/10 rounded-xl p-1"}
          >
            <!-- <div class="bg-white/10 rounded-xl p-1"> -->
            <div class="relative flex items-center justify-center gap-4">
              <!-- Arrow + Month name pinned to the left -->
              <div class="absolute left-0 flex items-center gap-3">
                <button
                  class="text-white text-3xl w-6"
                  onclick={() => toggleMonth(monthKey)}
                >
                  {$financeExpandedMonths[monthKey] ? "▼" : "▷"}
                </button>
                <div class="text-white text-3xl">
                  {getMonthName(month.monthNumber)}
                </div>
              </div>

              <!-- Centered fields group -->
              <div class="flex items-center gap-4">
                <!-- Disc Amount -->
                <div class="flex items-center gap-1">
                  <label for="Primary Credit Card" class="text-white text-xl"
                    >{$financeNames.primaryCard} $</label
                  >
                  <input
                    type="text"
                    class="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xl w-32"
                    maxlength="14"
                    value={month.discAmount || ""}
                    oninput={(e) =>
                      updateFinanceMonthAmount(
                        year.id,
                        month.id,
                        "discAmount",
                        (e.target as HTMLInputElement).value,
                      )}
                  />
                </div>

                <!-- Disc Interest Amount -->
                <div class="flex items-center gap-1">
                  <label
                    for="Primary Credit Card Interest"
                    class="text-white text-xl">Int $</label
                  >
                  <input
                    type="text"
                    class="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xl w-20"
                    maxlength="6"
                    value={month.discIntAmount || ""}
                    oninput={(e) =>
                      updateFinanceMonthAmount(
                        year.id,
                        month.id,
                        "discIntAmount",
                        (e.target as HTMLInputElement).value,
                      )}
                  />
                </div>

                <!-- AmerX Amount -->
                <div class="flex items-center gap-1">
                  <label for="Secondary Credit Card" class="text-white text-xl"
                    >{$financeNames.secondaryCard} $</label
                  >
                  <input
                    type="text"
                    class="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xl w-32"
                    maxlength="14"
                    value={month.amerXAmount || ""}
                    oninput={(e) =>
                      updateFinanceMonthAmount(
                        year.id,
                        month.id,
                        "amerXAmount",
                        (e.target as HTMLInputElement).value,
                      )}
                  />
                </div>

                <!-- AmerX Interest Amount -->
                <div class="flex items-center gap-1">
                  <label
                    for="Secondary Credit Card Interest"
                    class="text-white text-xl">Int $</label
                  >
                  <input
                    type="text"
                    class="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xl w-20"
                    maxlength="6"
                    value={month.amerXIntAmount || ""}
                    oninput={(e) =>
                      updateFinanceMonthAmount(
                        year.id,
                        month.id,
                        "amerXIntAmount",
                        (e.target as HTMLInputElement).value,
                      )}
                  />
                </div>

                <!-- Food Total (calculated, read-only) -->
                <div class="flex items-center gap-1 ml-8">
                  <label class="text-red-500 text-xl font-semibold"
                    >Food $</label
                  >
                  <div
                    class="bg-white/5 border border-white/20 rounded px-2 py-1 text-white text-xl w-20"
                  >
                    {calculateMonthFoodTotal(month).toFixed(2)}
                  </div>
                </div>

                <!-- Gas Total (calculated, read-only) -->
                <div class="flex items-center gap-1">
                  <label class="text-red-500 text-xl font-semibold">Gas $</label
                  >
                  <div
                    class="bg-white/5 border border-white/20 rounded px-2 py-1 text-white text-xl w-20"
                  >
                    {calculateMonthGasTotal(month).toFixed(2)}
                  </div>
                </div>
              </div>

              <!-- HB Balance pinned to far right -->
              {#if currentMonth == month.monthNumber}
                <div
                  class="absolute right-0 text-green-600 text-3xl font-semibold pr-2"
                >
                  {formatCurrency(calculateMonthHBBalance(year, month))}
                </div>
              {:else}
                <div
                  class="absolute right-0 text-white text-2xl font-semibold pr-2"
                >
                  {formatCurrency(calculateMonthHBBalance(year, month))}
                </div>
              {/if}
            </div>
          </div>

          <!-- Level 3: Weeks (only show when month expanded) -->
          {#if $financeExpandedMonths[monthKey]}
            <div class="ml-10 mr-10 mt-2 space-y-2">
              {#each month.weeks as week (week.id)}
                <!--Going through weeks of month-->
                {@const isCurrentWeek =
                  week.weekNumber == Math.ceil(new Date().getDate() / 7)}
                {@const hasWeekTotal = !!calculateWeekTotal(week)}
                {@const collapseRowBool = !isCurrentWeek && !hasWeekTotal}
                {@const weekKey = `${year.id}-${month.id}-${week.id}`}
                <div
                  class={collapseRowBool
                    ? borderNTextNBg.collapseRows
                    : "bg-white/10 rounded-xl p-3"}
                >
                  <div class="flex items-center gap-3">
                    <button
                      class="text-white text-3xl w-6"
                      onclick={() => toggleWeek(weekKey)}
                    >
                      {$financeExpandedWeeks[weekKey] ? "▼" : "▷"}
                    </button>

                    <div class="text-white text-3xl font-semibold">
                      {week.weekNumber} Wk {week.startDay}-{week.endDay}
                    </div>

                    <div class="ml-auto text-white text-2xl font-semibold">
                      {formatCurrency(calculateWeekTotal(week))}
                    </div>
                  </div>

                  <!-- Days (only show when week expanded) -->
                  {#if $financeExpandedWeeks[weekKey] && week.days}
                    <div class="mt-3 space-y-3">
                      {#each week.days as day, i (day.id)}
                        {@const isCurrDay = isCurrentDay(
                          year.year,
                          month.monthNumber,
                          day.dayNumber,
                        )}
                        {@const hasEntries =
                          !!day.entries[0]?.description.trim()}
                        {@const collapseRowBool = !isCurrDay && !hasEntries}
                        <div
                          class={isCurrentDay(
                            year.year,
                            month.monthNumber,
                            day.dayNumber,
                          )
                            ? "border-2 border-green-500 bg-white/5 rounded-lg p-3"
                            : collapseRowBool
                              ? borderNTextNBg.collapseRows
                              : "bg-white/5 rounded-lg p-3"}
                        >
                          <!-- Day entries -->
                          {#each day.entries as entry, entryIndex (entry.id)}
                            <div class="flex items-center gap-2 mb-2">
                              <!-- Entry fields -->
                              <!-- Day label (only show on first entry) -->
                              {#if entryIndex === 0}
                                <div
                                  class="text-white text-2xl font-semibold w-40 shrink-0 whitespace-nowrap"
                                >
                                  {day.dayNumber}
                                  {day.dayOfWeek}
                                </div>
                              {:else}
                                <div class="w-40 shrink-0"></div>
                              {/if}

                              <!-- + amount -->
                              <label class="text-white text-xl w-4">+</label>
                              <input
                                type="text"
                                class="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xl w-34"
                                placeholder="0"
                                value={entry.addAmount}
                                oninput={(e) =>
                                  updateFinanceEntry(
                                    year.id,
                                    month.id,
                                    week.id,
                                    day.id,
                                    entry.id,
                                    "addAmount",
                                    (e.target as HTMLInputElement).value,
                                  )}
                              />

                              <!-- - amount -->
                              <label class="text-white text-xl w-4 ml-2"
                                >-</label
                              >
                              <input
                                type="text"
                                class="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xl w-34"
                                placeholder="0"
                                value={entry.subAmount}
                                oninput={(e) =>
                                  updateFinanceEntry(
                                    year.id,
                                    month.id,
                                    week.id,
                                    day.id,
                                    entry.id,
                                    "subAmount",
                                    (e.target as HTMLInputElement).value,
                                  )}
                              />

                              <!-- Radio buttons (stacked vertically) -->
                              <div class="flex flex-col gap-1 ml-2">
                                <!-- Payment method group -->
                                <div class="flex items-center gap-2">
                                  <label
                                    class="text-white text-sm flex items-center gap-1"
                                  >
                                    {$financeNames.checking}
                                    <input
                                      type="radio"
                                      name="card-{entry.id}"
                                      class="w-3 h-3"
                                      checked={entry.isHB || false}
                                      onchange={() =>
                                        handleRadioChange(
                                          year.id,
                                          month.id,
                                          week.id,
                                          day.id,
                                          entry.id,
                                          "isHB",
                                        )}
                                    />
                                  </label>
                                  <label
                                    for="Primary Credit Card Radio"
                                    class="text-white text-sm flex items-center gap-1"
                                  >
                                    {$financeNames.primaryCard}
                                    <input
                                      type="radio"
                                      name="card-{entry.id}"
                                      class="w-3 h-3"
                                      checked={entry.isDisc || false}
                                      onchange={() =>
                                        handleRadioChange(
                                          year.id,
                                          month.id,
                                          week.id,
                                          day.id,
                                          entry.id,
                                          "isDisc",
                                        )}
                                    />
                                  </label>
                                  <label
                                    for="Secondary Credit Card Radio"
                                    class="text-white text-sm flex items-center gap-1"
                                  >
                                    {$financeNames.secondaryCard}
                                    <input
                                      type="radio"
                                      name="card-{entry.id}"
                                      class="w-3 h-3"
                                      checked={entry.isAmerX || false}
                                      onchange={() =>
                                        handleRadioChange(
                                          year.id,
                                          month.id,
                                          week.id,
                                          day.id,
                                          entry.id,
                                          "isAmerX",
                                        )}
                                    />
                                  </label>
                                </div>

                                <!-- Category group -->
                                <div class="flex items-center gap-2">
                                  <label
                                    class="text-white text-sm flex items-center gap-1"
                                  >
                                    Gas
                                    <input
                                      type="radio"
                                      name="category-{entry.id}"
                                      class="w-3 h-3"
                                      checked={entry.isGas || false}
                                      onchange={() =>
                                        handleRadioChange(
                                          year.id,
                                          month.id,
                                          week.id,
                                          day.id,
                                          entry.id,
                                          "isGas",
                                        )}
                                    />
                                  </label>
                                  <label
                                    class="text-white text-sm flex items-center gap-1"
                                  >
                                    Food
                                    <input
                                      type="radio"
                                      name="category-{entry.id}"
                                      class="w-3 h-3"
                                      checked={entry.isFood || false}
                                      onchange={() =>
                                        handleRadioChange(
                                          year.id,
                                          month.id,
                                          week.id,
                                          day.id,
                                          entry.id,
                                          "isFood",
                                        )}
                                    />
                                  </label>
                                  <label
                                    class="text-white text-sm flex items-center gap-1"
                                  >
                                    Other
                                    <input
                                      type="radio"
                                      name="category-{entry.id}"
                                      class="w-3 h-3"
                                      checked={entry.isOther || false}
                                      onchange={() =>
                                        handleRadioChange(
                                          year.id,
                                          month.id,
                                          week.id,
                                          day.id,
                                          entry.id,
                                          "isOther",
                                        )}
                                    />
                                  </label>
                                </div>
                              </div>

                              <!-- Description -->
                              <input
                                type="text"
                                class="flex-1 bg-white/10 border border-white/20 rounded px-3 py-1 text-white text-xl"
                                placeholder="Description..."
                                value={entry.description}
                                oninput={(e) =>
                                  updateFinanceEntry(
                                    year.id,
                                    month.id,
                                    week.id,
                                    day.id,
                                    entry.id,
                                    "description",
                                    (e.target as HTMLInputElement).value,
                                  )}
                              />

                              <!-- + button (first entry) or Delete button (additional entries) -->
                              {#if entryIndex === 0}
                                <button
                                  class={buttonStyles.greenButton}
                                  onclick={() =>
                                    addFinanceEntry(
                                      year.id,
                                      month.id,
                                      week.id,
                                      day.id,
                                    )}
                                >
                                  +
                                </button>
                              {:else}
                                <button
                                  class={buttonStyles.deleteButton}
                                  onclick={() =>
                                    deleteFinanceEntry(
                                      year.id,
                                      month.id,
                                      week.id,
                                      day.id,
                                      entry.id,
                                    )}
                                >
                                  Del
                                </button>
                              {/if}
                            </div>
                          {/each}
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

<!-- Calendar -->
<div class="mt-6">
  <FinanceCalendar />
</div>

<!-- // let selectedPresentYear: FinanceYear = $state({
     id: "",
     year: new Date().getFullYear(),
     months: [],
   });
   let selectedPresentMonth: FinanceMonth = $state({
     id: "",
     monthNumber: 0,
     discAmount: "",
     discIntAmount: "",
     amerXAmount: "",
     amerXIntAmount: "",
     foodAmount: "",
     gasAmount: "",
     balanceMonth: "",
     weeks: [],
   }); -->

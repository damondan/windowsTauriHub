<!-- src/lib/components/FinanceCalendar.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import { fly } from "svelte/transition";
  import { getMonthName } from "$lib/stores/general";
  import MonthSliderStatus from "$lib/components/MonthSliderStatus.svelte";

  import {
    calendarData,
    addOrUpdateFinancial,
    removeFinancialEntry,
    generateCalendarStructureToDate,
    getDaysInMonthCal,
    type CalendarMonth,
    type CalendarDay,
    type CalendarFinanceDayEntry,
  } from "$lib/stores/calendar";

  let displayYear: number = $state(0);
  let displayMonth: number = $state(0);
  let displayDay: number = $state(0);
  let todayDate: Date = $state(new Date());

  let showDayCalendarDialog = $state(false);
  let showStatusDialog = $state(false);

  let payType: string = $state("expense");
  let payName: string = $state("");
  let payAmount: string = $state("");
  let note: string = $state("");
  let firstEntry: boolean = $state(false);

  //This is data saved for showDayCalendarDialog
  let selectedDayMonthYear = $state<{
    dayNum: number;
    month: number;
    year: number;
    day: CalendarDay;
    calEntries: CalendarFinanceDayEntry[];
  } | null>(null);

  function isSelectedDay(dayNumber: number) {
    return (
      showDayCalendarDialog &&
      selectedDayMonthYear?.dayNum === dayNumber &&
      selectedDayMonthYear?.month === displayMonth &&
      selectedDayMonthYear?.year === displayYear
    );
  }

  let selectedEntry = $state<CalendarFinanceDayEntry>({
    id: "",
    name: "",
    amount: "",
    datePaid: "",
    dateDue: "",
    isPaycheck: false,
    note: "",
  });

  const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // onMount(): void - Fix this - it is regenerating some crazy shit.
  onMount(() => {
    displayDay = todayDate.getDate();
    displayYear = todayDate.getFullYear();
    displayMonth = todayDate.getMonth() + 1;

    const currentData = $calendarData;

    const needsRegeneration = currentData.length === 0;

    if (needsRegeneration) {
      console.log("IN regeneration");
    }

    // Always safe to call
    generateCalendarStructureToDate(todayDate);
  });

  // getFirstDayOfMonth(year: number, month: number): number
  function getFirstDayOfMonth(year: number, month: number): number {
    return new Date(year, month - 1, 1).getDay();
  }

  // prevMonth(): void
  function prevMonth() {
    if (displayMonth === 1) {
      displayMonth = 12;
      displayYear--;
    } else {
      displayMonth--;
    }
  }

  // nextMonth(): void
  function nextMonth() {
    if (displayMonth === 12) {
      displayMonth = 1;
      displayYear++;
    } else {
      displayMonth++;
    }
  }

  let calendarDays = $derived.by(() => {
    const month = calendarMonth;

    if (!month) return [];

    const firstDay = getFirstDayOfMonth(displayYear, displayMonth);

    const days: (CalendarDay | null)[] = [];

    // Empty slots before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Actual CalendarDay objects
    for (const day of month.days) {
      days.push(day);
    }

    return days;
  });

  let calendarMonth = $derived.by((): CalendarMonth | undefined => {
    return getDaysInMonthCal($calendarData, displayMonth, displayYear);
  });

  function isToday(day: number): boolean {
    return (
      displayYear === todayDate.getFullYear() &&
      displayMonth === todayDate.getMonth() + 1 &&
      day === displayDay
    );
  }

  function showStatusDialogFunction() {
    showStatusDialog = !showStatusDialog;
  }
</script>

<button
  class="text-white/50 rounded-2xl bg-black text-lg border p-1 bg-black/30 hover:border-white"
  onclick={showStatusDialogFunction}>Status</button
>
<div class="flex justify-center">
  {#if showStatusDialog == true}
    <div
      in:fly={{ x: -50, duration: 800 }}
      out:fly={{ x: -50, duration: 800 }}
      class=""
    >
      <MonthSliderStatus {displayMonth} {displayYear} />
    </div>
  {/if}
  <div class="bg-white/10 rounded-xl p-3 w-7xl">
    <!-- Header with nav -->
    <div class="flex items-center justify-between mb-2">
      <button
        class="text-white text-xl px-2 hover:text-white/70"
        onclick={prevMonth}
      >
        ◀
      </button>

      <div class="text-white text-4xl font-semibold">
        {getMonthName(displayMonth)}
        {displayYear}
      </div>
      <button
        class="text-white text-xl px-2 hover:text-white/70"
        onclick={nextMonth}
      >
        ▶
      </button>
    </div>

    <!-- Day headers -->
    <div class="grid grid-cols-7 gap-1 mb-1">
      {#each dayHeaders as header}
        <div class="text-white/50 text-2xl text-center font-semibold">
          {header}
        </div>
      {/each}
    </div>

    <!-- Day grid -->
    <div class="grid grid-cols-7 gap-1">
      {#each calendarDays as day}
        {#if day === null}
          <div></div>
        {:else}
          <div
            class="flex flex-col border-2 border-gray-300/20 text-center text-xl py-1 {isToday(
              day.dayNumber,
            )
              ? 'h-40 cursor-pointer bg-white text-black font-bold shadow-[0_0_12px_rgba(34,197,94,0.7)]'
              : isSelectedDay(day.dayNumber)
                ? 'h-40 cursor-pointer text-white/80 bg-white/10'
                : 'h-40 cursor-pointer text-white/80 hover:bg-white/10'}"
            onclick={() => {
              selectedDayMonthYear = {
                dayNum: day.dayNumber,
                day: day,
                month: displayMonth,
                year: displayYear,
                calEntries: day?.calEntries,
              };

              payType = "expense";
              payName = "";
              payAmount = "";
              note = "";
              showDayCalendarDialog = true;
            }}
          >
            {day.dayNumber}
            {#if day.calEntries.length > 0}
              {#each day.calEntries as cal (cal.id)}
                {#if cal.isPaycheck}
                  <!-- Other paycheck -->
                  <button
                    class="w-auto h-auto mb-1 ml-1.5 mr-1.5 text-black font-bold bg-orange-400 hover:bg-orange-500 cursor-crosshair"
                    onclick={(e) => {
                      e.stopPropagation();
                      selectedDayMonthYear = {
                        dayNum: day.dayNumber,
                        month: displayMonth,
                        year: displayYear,
                        day: day,
                        calEntries: day?.calEntries,
                      };
                      selectedEntry = cal;
                      payType = cal.isPaycheck ? "paycheck" : "expense";
                      payName = cal.name;
                      payAmount = cal.amount;
                      note = cal.note;
                      showDayCalendarDialog = true;
                    }}
                  >
                    {cal.name}
                    {cal.amount}
                  </button>
                {:else if !cal.isPaycheck && ["Gas", "Food"].includes(cal.name)}
                  <!-- Gas / Food -->
                  <button
                    class="w-auto h-auto mb-1 ml-1.5 mr-1.5 text-black font-bold bg-red-500 hover:bg-red-600 cursor-crosshair"
                    onclick={(e) => {
                      e.stopPropagation();
                      selectedDayMonthYear = {
                        dayNum: day.dayNumber,
                        month: displayMonth,
                        year: displayYear,
                        day: day,
                        calEntries: day?.calEntries,
                      };
                      selectedEntry = cal;
                      payType = cal.isPaycheck ? "paycheck" : "expense";
                      payName = cal.name;
                      payAmount = cal.amount;
                      note = cal.note;
                      showDayCalendarDialog = true;
                    }}
                  >
                    {cal.name}
                    {cal.amount}
                  </button>
                {:else if !cal.isPaycheck && !["Gas", "Food"].includes(cal.name)}
                  {@const isExpPaid = cal.datePaid != ""}
                  <!-- Other expense -->
                  <button
                    class={`w-auto h-auto mb-1 ml-1.5 mr-1.5 text-black font-bold bg-blue-400 
                    hover:bg-blue-500 cursor-crosshair
                    ${isExpPaid ? "bg-green-400 hover:bg-green-500" : "bg-blue-400 hover:bg-blue-500"}`}
                    onclick={(e) => {
                      e.stopPropagation();
                      selectedDayMonthYear = {
                        dayNum: day.dayNumber,
                        month: displayMonth,
                        year: displayYear,
                        day: day,
                        calEntries: day?.calEntries,
                      };
                      selectedEntry = cal;
                      payType = cal.isPaycheck ? "paycheck" : "expense";
                      payName = cal.name;
                      payAmount = cal.amount;
                      note = cal.note;
                      showDayCalendarDialog = true;
                    }}
                  >
                    {cal.name}
                    {cal.amount}

                    <!-- {isExpPaid ? "Paid" : "Mark Paid"} -->
                  </button>
                {/if}
              {/each}
            {/if}
          </div>
        {/if}
      {/each}
    </div>
  </div>
  <!-- // in:fade={{ duration: 500 }}
    // out:fade={{ duration: 500 }} -->
  {#if showDayCalendarDialog == true}
    <div
      in:fly={{ x: 50, duration: 800 }}
      out:fly={{ x: 50, duration: 800 }}
      class="flex flex-col w-80 h-auto border-2 border-red-600"
    >
      <div class="flex flex-row justify-center">
        <label class="text-2xl text-white mr-3">Paycheck</label>
        <input
          type="radio"
          name="payment"
          value="paycheck"
          class="w-5 h-5 mt-1.5"
          bind:group={payType}
        />
      </div>
      <div class="flex flex-row justify-center">
        <label class="text-2xl text-white mr-3">Expense</label>
        <input
          type="radio"
          name="payment"
          value="expense"
          class="w-5 h-5 mt-1.5"
          bind:group={payType}
        />
      </div>
      <div class="flex flex-row justify-center">
        <label class="text-2xl text-white mr-3">Is Paid</label>
        <input
          class="w-5 h-5 mt-1.5"
          type="checkbox"
          checked={selectedEntry.datePaid != ""}
          onchange={(e) => {
            const checked = e.currentTarget.checked;
            selectedEntry.datePaid = checked ? new Date().toISOString() : "";
          }}
        />
      </div>
      <div class="flex flex-col mt-3 items-center">
        <label class="text-2xl text-white mr-3">Name</label>
        <textarea
          class="text-white pl-2 text-2xl w-50 h-auto border-2 border-amber-100"
          rows="1"
          bind:value={payName}
        ></textarea>
      </div>
      <div class="flex flex-col items-center">
        <label class="text-2xl text-white mr-3">Amount</label>
        <textarea
          class="text-white pl-2 text-2xl w-50 h-auto border-2 border-amber-100"
          rows="1"
          bind:value={payAmount}
        ></textarea>
      </div>
      <div class="mt-8 flex flex-col items-center">
        <label class="text-2xl text-white mr-3">Notes</label>
        <textarea
          class="text-white pl-2 text-2xl w-50 h-100 border-2 border-amber-100"
          rows="1"
          bind:value={note}
        ></textarea>
      </div>
      <div class="flex flex-wrap gap-3 m-3 justify-center">
        <button
          class="w-20 h-10 rounded-2xl text-white bg-green-400 hover:bg-green-900"
          onclick={() => {
            console.log("onclick selectedEntry:", selectedEntry);
            addOrUpdateFinancial(
              payType,
              payName,
              payAmount,
              selectedEntry.datePaid,
              selectedDayMonthYear!.dayNum,
              selectedDayMonthYear!.month,
              selectedDayMonthYear!.year,
              note,
              selectedEntry,
            );

            payType = "expense";
            payName = "";
            payAmount = "";
            note = "";
            selectedEntry.id = "";
            selectedEntry.name = "";
            selectedEntry.amount = "";
            selectedEntry.datePaid = "";
            selectedEntry.dateDue = "";
            selectedEntry.isPaycheck = false;
            selectedEntry.note = "";
            showDayCalendarDialog = false;
            
          }}>Add</button
        >
        <button
          class="w-20 h-10 rounded-2xl bg-blue-400 text-white hover:bg-blue-700"
          onclick={() => {
            if (!selectedDayMonthYear) return;
            const entry = selectedDayMonthYear.calEntries[0];
            if (!entry) return;
            if (!selectedEntry) return;
            console.log(`In Delete onclick and entry is ${entry}`);
            console.log(
              `In Delete onclick and selectedEntry is ${selectedDayMonthYear.calEntries}`,
            );
            console.log(`In Delete onclick and entry is ${entry}`);
            removeFinancialEntry(
              selectedEntry,
              selectedDayMonthYear.dayNum,
              selectedDayMonthYear.month,
              selectedDayMonthYear.year,
            );
            payType = "expense";
            payName = "";
            payAmount = "";
            note = "";
            selectedEntry.id = "";
            selectedEntry.name = "";
            selectedEntry.amount = "";
            selectedEntry.datePaid = "";
            selectedEntry.dateDue = "";
            selectedEntry.isPaycheck = false;
            selectedEntry.note = "";
            showDayCalendarDialog = false;
          }}>Del</button
        >
        {#if selectedEntry != null}
          <button
            class="w-20 h-10 rounded-2xl text-white bg-purple-500 hover:bg-purple-700"
            onclick={() => {
              addOrUpdateFinancial(
                payType,
                payName,
                payAmount,
                selectedEntry.datePaid,
                selectedDayMonthYear!.dayNum,
                selectedDayMonthYear!.month,
                selectedDayMonthYear!.year,
                note,
                selectedEntry,
              );
              payType = "expense";
              payName = "";
              payAmount = "";
              note = "";
              selectedEntry.id = "";
              selectedEntry.name = "";
              selectedEntry.amount = "";
              selectedEntry.datePaid = "";
              selectedEntry.dateDue = "";
              selectedEntry.isPaycheck = false;
              selectedEntry.note = "";
              showDayCalendarDialog = false;
            }}>Update</button>
        {/if}

        <button
          class="w-20 h-10 rounded-2xl text-white bg-yellow-400 hover:bg-yellow-900"
          onclick={() => {
             let fwdEntry = $state<CalendarFinanceDayEntry>({
                  id: "",
                  name: "",
                  amount: "",
                  datePaid: "",
                  dateDue: "",
                  isPaycheck: false,
                  note: "",
                });
            console.log("onclick selectedEntry:", selectedEntry);
            addOrUpdateFinancial(
              payType,
              payName,
              payAmount,
              "",
              selectedDayMonthYear!.dayNum,
              selectedDayMonthYear!.month+1,
              selectedDayMonthYear!.year,
              "",
              fwdEntry,
            );

            payType = "expense";
            payName = "";
            payAmount = "";
            note = "";
            selectedEntry.id = "";
            selectedEntry.name = "";
            selectedEntry.amount = "";
            selectedEntry.datePaid = "";
            selectedEntry.dateDue = "";
            selectedEntry.isPaycheck = false;
            selectedEntry.note = "";
            showDayCalendarDialog = false;
            
          }}>Fwd</button>

        <button
          class="w-20 h-10 rounded-2xl text-white bg-red-600 hover:bg-red-700"
          onclick={() => {
            payType = "expense";
            payName = "";
            payAmount = "";
            selectedEntry.id = "";
            selectedEntry.name = "";
            selectedEntry.amount = "";
            selectedEntry.datePaid = "";
            selectedEntry.dateDue = "";
            selectedEntry.isPaycheck = false;
            selectedEntry.note = "";
            showDayCalendarDialog = false;
          }}>Cancel</button
        >
      </div>
    </div>
  {/if}
</div>

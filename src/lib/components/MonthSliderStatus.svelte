<script lang="ts">
    import { show } from "@tauri-apps/api/app";
    import { onMount } from "svelte";
    import {
        formatCurrency,
        calculateMonthHBBalance,
        financeData,
        type FinanceYear,
        getFinanceMonthFin,
        getFinanceYearFin,
        calculateFoodGasOtherTotal,
        calculateFoodTotal,
        calculateGasTotal,
        calculateOtherTotal,
    } from "$lib/stores/finance";

    import {
        calendarData,
        setCalMonthLimits,
        getFinanceMonthCal,
        getFinanceYearCal,
        type CalendarMonth,
        getMonthExpensesSpent,
    } from "$lib/stores/calendar";
    import { get } from "svelte/store";

    let { displayMonth, displayYear } = $props();

    let monthIncomeLimit = $state("");
    let projectedEarnings = $state("");
    let projectedExpenses = $state("");
    let foodSpendLimit: string = $state("");
    let gasSpendLimit: string = $state("");
    let persSpendLimit: string = $state("");
    let showMonthStatus: boolean = $state(false);
    let updateWithPayBool: boolean = $state(false);
    let monthIncomeSpent: string = $state("");
    let expensesTotal: string = $state("");
    let expensesPaid: string = $state("");

    let lastLoadedMonthKey: string = $state("");

    //Getting data from financeData
    const currentYearFromFin = $derived(
        getFinanceYearFin($financeData, displayYear),
    );
    const currentMonthFromFin = $derived(
        getFinanceMonthFin($financeData, displayYear, displayMonth),
    );

    const balanceFromFin = $derived(
        currentYearFromFin && currentMonthFromFin
            ? calculateMonthHBBalance(currentYearFromFin, currentMonthFromFin)
            : 0,
    );

    let expensesLeft = $derived(
        Math.round(Number(projectedExpenses) - Number(monthIncomeSpent)),
    );

    let foodLimitSpent = $derived(
        calculateFoodTotal($financeData, displayYear, displayMonth),
    );

    let gasLimitSpent = $derived(
        calculateGasTotal($financeData, displayYear, displayMonth),
    );

    let persLimitSpent = $derived(
        calculateOtherTotal($financeData, displayYear, displayMonth),
    );

    let foodLeft = $derived(Number(foodSpendLimit) - Number(foodLimitSpent));
    let gasLeft = $derived(Number(gasSpendLimit) - Number(gasLimitSpent));
    let persLeft = $derived(Number(persSpendLimit) - Number(persLimitSpent));

    function getMonthStatus() {
        showMonthStatus = !showMonthStatus;
        setCalMonthLimits(
            displayYear,
            displayMonth,
            projectedEarnings,
            projectedExpenses,
            monthIncomeLimit,
            foodSpendLimit,
            gasSpendLimit,
            persSpendLimit,
        );
        monthIncomeSpent = calculateFoodGasOtherTotal(
            $financeData,
            displayYear,
            displayMonth,
        );
    }

    function updateWithPayFunc() {
        updateWithPayBool = !updateWithPayBool;
    }

    $effect(() => {
        console.log("effect reran");
        const monthKey = `${displayYear}-${displayMonth}`;

        if (monthKey === lastLoadedMonthKey) return;

        lastLoadedMonthKey = monthKey;

        const presentMonth = getFinanceMonthCal(
            $calendarData,
            displayYear,
            displayMonth,
        );

        if (!presentMonth) return;

        projectedEarnings = presentMonth.projectedEarnings ?? "";
        projectedExpenses = presentMonth.projectedExpenses ?? "";
        monthIncomeLimit = presentMonth.monthBalLimit ?? "";
        gasSpendLimit = presentMonth.gasLimit ?? "";
        foodSpendLimit = presentMonth.foodLimit ?? "";
        persSpendLimit = presentMonth.otherLimit ?? "";
    });
</script>

<div class="w-[320px] mr-2">
    <div class="grid grid-cols-[70%_30%] gap-x-0 gap-y-2 items-center mt-4">
        <!-- Row 1 bind value-->
        <div class="text-white text-2xl">~ Earnings</div>
        <input
            type="text"
            class="w-full w-bg-white/5 border border-white/20 rounded px-2 py-1 text-white"
            bind:value={projectedEarnings}
        />
        <div class="text-white text-2xl">~ Expenses</div>
        <input
            type="text"
            class="w-full w-bg-white/5 border border-white/20 rounded px-2 py-1 text-white"
            bind:value={projectedExpenses}
        />

        <!-- Row 2 bind value-->
        <div class="text-white text-2xl">Food Spend Limit</div>
        <input
            type="text"
            class="w-full w-bg-white/5 border border-white/20 rounded px-2 py-1 text-white"
            bind:value={foodSpendLimit}
        />

        <!--bind value-->
        <div class="text-white text-2xl">Gas Spend Limit</div>
        <input
            type="text"
            class="w-full w-bg-white/5 border border-white/20 rounded px-2 py-1 text-white"
            bind:value={gasSpendLimit}
        />

        <div class="text-white text-2xl">Pers Spend Limit</div>
        <input
            type="text"
            class="w-full w-bg-white/5 border border-white/20 rounded px-2 py-1 text-white"
            bind:value={persSpendLimit}
        />

        <div class="text-white text-2xl">Get Status</div>
        <button
            class="text-2xl bg-blue-400/30 hover:bg-blue-500 rounded px-2 py-1 h-9"
            onclick={getMonthStatus}>Update</button
        >

        {#if showMonthStatus == true}
            <!-- Good -->
            <div class="text-green-500 text-2xl">Balance</div>
            <h2 class="text-white text-2xl">
                {formatCurrency(balanceFromFin)}
            </h2>

            <div class="text-green-500 text-2xl">Spent F/G/O</div>
            <h2 class="text-white text-2xl">{monthIncomeSpent}</h2>

            <div class="text-green-500 text-2xl">Expenses Left</div>
            <h2 class="text-white text-2xl">{expensesLeft}</h2>

            <div>----------------</div>
            <h2></h2>

            <div class="text-red-600 text-2xl">Food Limit</div>
            <h2 class="text-white text-2xl">{foodSpendLimit}</h2>

            <div class="text-red-600 text-2xl">Food Spent</div>
            <h2 class="text-white text-2xl">{foodLimitSpent}</h2>

            <div class="text-red-600 text-2xl">Food Left</div>
            <h2 class="text-white text-2xl">{foodLeft}</h2>

            <div>----------------</div>
            <h2></h2>

            <div class="text-red-700 text-2xl">Gas Limit</div>
            <h2 class="text-white text-2xl">{gasSpendLimit}</h2>

            <div class="text-red-700 text-2xl">Gas Spent</div>
            <h2 class="text-white text-2xl">{gasLimitSpent}</h2>

            <div class="text-red-700 text-2xl">Gas Left</div>
            <h2 class="text-white text-2xl">{gasLeft}</h2>
        {/if}
    </div>
</div>

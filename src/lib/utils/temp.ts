// export function addHealthEntry(
//     yearId: string,
//     monthId: string,
//     weekId: string,
//     dayId: string
// ): string {
//     const entryId = makeId();
//     persGoalData.update((years) =>
//         years.map((y) => {
//             if (y.id === yearId) {
//                 return {
//                     ...y,
//                     months: y.months.map((m) => {
//                         if (m.id === monthId) {
//                             return {
//                                 ...m,
//                                 weeks: m.weeks.map((w) => {
//                                     if (w.id === weekId) {
//                                         return {
//                                             ...w,
//                                             days: w.days.map((d) => {
//                                                 if (d.id === dayId) {
//                                 return {
//                                     ...d,
//                                     entries: [...d.entries, { id: entryId, description: '' }]
//                                 };
//                                                 }
//                                                 return d;
//                                             })
//                                         };
//                                     }
//                                     return w;
//                                 })
//                             };
//                         }
//                         return m;
//                     })
//                 };
//             }
//             return y;
//         })
//     );
//     return entryId;
// }

// // Delete entry from a day
// // deleteHealthEntry(yearId: string, monthId: string, weekId: string, dayId: string, entryId: string): void
// export function deleteHealthEntry(
//     yearId: string,
//     monthId: string,
//     weekId: string,
//     dayId: string,
//     entryId: string
// ): void {
//     persGoalData.update((years) =>
//         years.map((y) => {
//             if (y.id === yearId) {
//                 return {
//                     ...y,
//                     months: y.months.map((m) => {
//                         if (m.id === monthId) {
//                             return {
//                                 ...m,
//                                 weeks: m.weeks.map((w) => {
//                                     if (w.id === weekId) {
//                                         return {
//                                             ...w,
//                                             days: w.days.map((d) => {
//                                                 if (d.id === dayId) {
//                                                     return {
//                                                         ...d,
//                                                         entries: d.entries.filter(e => e.id !== entryId)
//                                                     };
//                                                 }
//                                                 return d;
//                                             })
//                                         };
//                                     }
//                                     return w;
//                                 })
//                             };
//                         }
//                         return m;
//                     })
//                 };
//             }
//             return y;
//         })
//     );
// }

// // Update year goal
// // updateHealthYearGoal(yearId: string, value: string): void
// export function updateHealthYearGoal(
//     yearId: string,
//     value: string
// ): void {
//     persGoalData.update((years) =>
//         years.map((y) => {
//             if (y.id === yearId) {
//                 return { ...y, yearHealthGoal: value };
//             }
//             return y;
//         })
//     );
// }

// Update month goal
// updateHealthMonthGoal(yearId: string, monthId: string, value: string): void
// export function updateHealthMonthGoal(
//     yearId: string,
//     monthId: string,
//     value: string
// ): void {
//     persGoalData.update((years) =>
//         years.map((y) => {
//             if (y.id === yearId) {
//                 return {
//                     ...y,
//                     months: y.months.map((m) => {
//                         if (m.id === monthId) {
//                             return { ...m, monthGoals: value };
//                         }
//                         return m;
//                     })
//                 };
//             }
//             return y;
//         })
//     );
// }

// <!-- Private Goal Dialog -->
// {#if showPrivateGoalDialog}
//   <div
//     class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
//     onclick={() => (showPrivateGoalDialog = false)}
//   >
//     <div
//       class="bg-gradient-to-t from-black to-white border border-white/30 rounded-xl p-6 max-w-md"
//       onclick={(e) => e.stopPropagation()}
//     >
//       <h3 class="text-white text-2xl font-semibold mb-4">
//         Change Private Goal
//       </h3>
//       <p class="text-white/90 text-xl mb-4">
//         Are you sure you want to change your private goal?
//       </p>
//       {#if pendingPrivateGoalChange && pendingPrivateGoalChange.changeCount > 0}
//         <p class="text-yellow-400 text-lg mb-6">
//           This is the {pendingPrivateGoalChange.changeCount}{pendingPrivateGoalChange.changeCount ===
//           1
//             ? "st"
//             : pendingPrivateGoalChange.changeCount === 2
//               ? "nd"
//               : pendingPrivateGoalChange.changeCount === 3
//                 ? "rd"
//                 : "th"} time you have changed it.
//         </p>
//       {/if}
//       <textarea
//         class="w-full bg-white/10 border border-white rounded px-4 py-3 text-white text-xl resize-none mb-6"
//         placeholder="Enter your private goal..."
//         rows="3"
//         bind:value={pendingPrivateGoalChange!.value}
//       ></textarea>
//       <div class="flex gap-3 justify-end">
//         <button
//           class="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xl font-semibold transition-colors"
//           onclick={() => (showPrivateGoalDialog = false)}
//         >
//           Cancel
//         </button>
//         <button
//           class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xl font-semibold transition-colors"
//           onclick={() => {
//             if (pendingPrivateGoalChange) {
//               updateYearPrivateGoal(
//                 pendingPrivateGoalChange.yearId,
//                 pendingPrivateGoalChange.value,
//               );
//               pendingPrivateGoalChange = null;
//             }
//             saveUserEncryptionData();
//             showPrivateGoalDialog = false;
//           }}
//         >
//           Confirm
//         </button>
//       </div>
//     </div>
//   </div>
// {/if}

// <!-- let showPrivateDayDialog = $state(false);
//   let pendingPrivateDayAction = $state<{
//     yearId: string;
//     monthId: string;
//     weekId: string;
//     dayId: string;
//   } | null>(null);

//   let showPrivateWeekDialog = $state(false);
//   let pendingPrivateWeekAction = $state<{
//     yearId: string;
//     monthId: string;
//     weekId: string;
//   } | null>(null);

//   let showPrivateMonthDialog = $state(false);
//   let pendingPrivateMonthAction = $state<{
//     yearId: string;
//     monthId: string;
//   } | null>(null);

//   // let showScreenGoalDialog = $state(false);
//   // let pendingScreenGoalAction = $state<{
//   //   yearId: string;
//   //   monthId: string;
//   //   weekId: string;
//   //   dayId: string;
//   // } | null>(null);

//   let showPrivateGoalDialog = $state(false);
//   let pendingPrivateGoalChange = $state<{
//     yearId: string;
//     value: string;
//     changeCount: number;
//   } | null>(null); -->
// <!-- Custom Private Day Dialog -->
// <!-- {#if showPrivateDayDialog}
//   <div
//     class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
//     onclick={() => (showPrivateDayDialog = false)}
//   >
//     <div
//       class="flex flex-wrap w-80 bg-gradient-to-t from-black to-white border border-white/30 rounded-xl p-6 max-w-md"
//       onclick={(e) => e.stopPropagation()}
//     >
//       <div class="flex flex-wrap gap-3 justify-center">
//         <button
//           class="px-6 py-2 {buttonStyles.circleLightHover} text-white rounded-lg text-xl font-semibold transition-colors"
//           onclick={() => {
//             if (pendingPrivateDayAction) {
//               toggleDayPrivateCompleted(
//                 pendingPrivateDayAction.yearId,
//                 pendingPrivateDayAction.monthId,
//                 pendingPrivateDayAction.weekId,
//                 pendingPrivateDayAction.dayId,
//                 false,
//               );
//               pendingPrivateDayAction = null;
//             }
//             showPrivateDayDialog = false;
//           }}
//         >
//           Convert
//         </button>
//         <button
//           class="px-6 py-2 {buttonStyles.circleLightHover} text-white rounded-lg text-xl font-semibold transition-colors"
//           onclick={() => {
//             if (pendingPrivateDayAction) {
//               toggleDayPrivateCompleted(
//                 pendingPrivateDayAction.yearId,
//                 pendingPrivateDayAction.monthId,
//                 pendingPrivateDayAction.weekId,
//                 pendingPrivateDayAction.dayId,
//                 true,
//               );
//               pendingPrivateDayAction = null;
//             }
//             showPrivateDayDialog = false;
//           }}
//         >
//           Fight
//         </button>
//         <button
//           class="px-6 py-2 {buttonStyles.circleLightHover} text-white rounded-lg text-xl font-semibold transition-colors"
//           onclick={() => (showPrivateDayDialog = false)}
//         >
//           Cancel
//         </button>
//       </div>
//     </div>
//   </div>
// {/if} -->

// <!-- Custom Private Week Dialog -->
// <!-- {#if showPrivateWeekDialog}
//   <div
//     class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
//     onclick={() => (showPrivateWeekDialog = false)}
//   >
//     <div
//       class="flex flex-wrap w-80 bg-gradient-to-t from-black to-white border border-white/30 rounded-xl p-6 max-w-md"
//       onclick={(e) => e.stopPropagation()}
//     >
//       <div class="flex flex-wrap gap-3 justify-center">
//         <button
//           class="px-6 py-2 {buttonStyles.circleLightHover} text-white rounded-lg text-xl font-semibold transition-colors"
//           onclick={() => {
//             if (pendingPrivateWeekAction) {
//               toggleWeekPrivateCompleted(
//                 pendingPrivateWeekAction.yearId,
//                 pendingPrivateWeekAction.monthId,
//                 pendingPrivateWeekAction.weekId,
//                 false,
//               );
//               pendingPrivateWeekAction = null;
//             }
//             showPrivateWeekDialog = false;
//           }}
//         >
//           Convert
//         </button>
//         <button
//           class="px-6 py-2 {buttonStyles.circleLightHover} text-white rounded-lg text-xl font-semibold transition-colors"
//           onclick={() => {
//             if (pendingPrivateWeekAction) {
//               toggleWeekPrivateCompleted(
//                 pendingPrivateWeekAction.yearId,
//                 pendingPrivateWeekAction.monthId,
//                 pendingPrivateWeekAction.weekId,
//                 true,
//               );
//               pendingPrivateWeekAction = null;
//             }
//             showPrivateWeekDialog = false;
//           }}
//         >
//           Fight
//         </button>
//         <button
//           class="px-6 py-2 {buttonStyles.circleLightHover} text-white rounded-lg text-xl font-semibold transition-colors"
//           onclick={() => (showPrivateWeekDialog = false)}
//         >
//           Cancel
//         </button>
//       </div>
//     </div>
//   </div>
// {/if} -->

// <!-- Custom Private Month Dialog -->
// <!-- {#if showPrivateMonthDialog}
//   <div
//     class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
//     onclick={() => (showPrivateMonthDialog = false)}
//   >
//     <div
//       class="flex flex-wrap w-80 bg-gradient-to-t from-black to-white border border-white/30 rounded-xl p-6 max-w-md"
//       onclick={(e) => e.stopPropagation()}
//     >
//       <div class="flex flex-wrap gap-3 justify-center">
//         <button
//           class="px-6 py-2 text-white {buttonStyles.circleLightHover} rounded-lg text-xl font-semibold transition-colors border"
//           onclick={() => {
//             if (pendingPrivateMonthAction) {
//               toggleMonthPrivateCompleted(
//                 pendingPrivateMonthAction.yearId,
//                 pendingPrivateMonthAction.monthId,
//                 false,
//               );
//               pendingPrivateMonthAction = null;
//             }
//             showPrivateMonthDialog = false;
//           }}
//         >
//           Convert
//         </button>
//         <button
//           class="px-6 py-2 {buttonStyles.circleLightHover} text-white rounded-lg text-xl font-semibold transition-colors"
//           onclick={() => {
//             if (pendingPrivateMonthAction) {
//               toggleMonthPrivateCompleted(
//                 pendingPrivateMonthAction.yearId,
//                 pendingPrivateMonthAction.monthId,
//                 true,
//               );
//               pendingPrivateMonthAction = null;
//             }
//             showPrivateMonthDialog = false;
//           }}
//         >
//           Fight
//         </button>
//         <button
//           class="px-6 py-2 {buttonStyles.circleLightHover} text-white rounded-lg text-xl font-semibold transition-colors"
//           onclick={() => (showPrivateMonthDialog = false)}
//         >
//           Cancel
//         </button>
//       </div>
//     </div>
//   </div>
// {/if} -->

// <!-- Screen Goal Dialog -->
// <!-- {#if showScreenGoalDialog}
//   <div
//     class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
//     onclick={() => (showScreenGoalDialog = false)}
//   >
//     <div
//       class="flex flex-wrap w-80 bg-gradient-to-t from-black to-white border border-white/30 rounded-xl p-6 max-w-md"
//       onclick={(e) => e.stopPropagation()}
//     >
//       <div class="flex flex-wrap gap-3 justify-center">
       
//         <button
//           class="px-6 py-2 {buttonStyles.circleLightHover} text-white rounded-lg text-xl font-semibold transition-colors"
//           onclick={() => {
//             if (pendingScreenGoalAction) {
//               toggleDayScreenFollowed(
//                 pendingScreenGoalAction.yearId,
//                 pendingScreenGoalAction.monthId,
//                 pendingScreenGoalAction.weekId,
//                 pendingScreenGoalAction.dayId,
//                 false,
//               );
//               pendingScreenGoalAction = null;
//             }
//             showScreenGoalDialog = false;
//           }}
//         >
//           Fail
//         </button>
//         <button
//           class="px-6 py-2 {buttonStyles.circleLightHover} text-white rounded-lg text-xl font-semibold transition-colors"
//           onclick={() => {
//             if (pendingScreenGoalAction) {
//               toggleDayScreenFollowed(
//                 pendingScreenGoalAction.yearId,
//                 pendingScreenGoalAction.monthId,
//                 pendingScreenGoalAction.weekId,
//                 pendingScreenGoalAction.dayId,
//                 true,
//               );
//               pendingScreenGoalAction = null;
//             }
//             showScreenGoalDialog = false;
//           }}
//         >
//           Succeed
//         </button>
//          <button
//           class="px-6 py-2 {buttonStyles.circleLightHover} text-white rounded-lg text-xl font-semibold transition-colors"
//           onclick={() => (showScreenGoalDialog = false)}
//         >
//           Cancel
//         </button>
//       </div>
//     </div>
//   </div>
// {/if} -->

// <!-- Sleep & Screen row -->
// <!-- <div class="flex items-center gap-3 mt-2">
//                             <div class="w-58 shrink-0"></div>

//                             <label
//                               class="{borderNTextNBg.lightText} text-sm font-semibold whitespace-nowrap"
//                               >Sleep</label
//                             >
//                             <input
//                               type="text"
//                               class="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm w-20"
//                               placeholder=""
//                               value={day.sleepTime || ""}
//                               oninput={(e) =>
//                                 updateDaySleepScreen(
//                                   year.id,
//                                   month.id,
//                                   week.id,
//                                   day.id,
//                                   "sleepTime",
//                                   (e.target as HTMLInputElement).value,
//                                 )}
//                             />

//                             <label
//                               class="{borderNTextNBg.lightText} text-sm font-semibold whitespace-nowrap"
//                               >Wake</label
//                             >
//                             <input
//                               type="text"
//                               class="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm w-20"
//                               placeholder=""
//                               value={day.sleepWake || ""}
//                               oninput={(e) =>
//                                 updateDaySleepScreen(
//                                   year.id,
//                                   month.id,
//                                   week.id,
//                                   day.id,
//                                   "sleepWake",
//                                   (e.target as HTMLInputElement).value,
//                                 )}
//                             />

//                             <label
//                               class="{borderNTextNBg.lightText} text-sm font-semibold whitespace-nowrap"
//                               >Sleep</label
//                             >
//                             <input
//                               type="text"
//                               class="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm w-20"
//                               placeholder=""
//                               value={day.sleepTimeBack || ""}
//                               oninput={(e) =>
//                                 updateDaySleepScreen(
//                                   year.id,
//                                   month.id,
//                                   week.id,
//                                   day.id,
//                                   "sleepTimeBack",
//                                   (e.target as HTMLInputElement).value,
//                                 )}
//                             />

//                             <label
//                               class="{borderNTextNBg.lightText} text-sm font-semibold whitespace-nowrap"
//                               >Wake</label
//                             >
//                             <input
//                               type="text"
//                               class="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm w-20"
//                               placeholder=""
//                               value={day.sleepWakeAgain || ""}
//                               oninput={(e) =>
//                                 updateDaySleepScreen(
//                                   year.id,
//                                   month.id,
//                                   week.id,
//                                   day.id,
//                                   "sleepWakeAgain",
//                                   (e.target as HTMLInputElement).value,
//                                 )}
//                             />

//                             <label
//                               class="{borderNTextNBg.lightText} text-sm font-semibold whitespace-nowrap"
//                               >Sleep Total</label
//                             >
//                             <input
//                               type="text"
//                               class="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm w-20"
//                               placeholder=""
//                               value={day.sleepTotal || ""}
//                               oninput={(e) =>
//                                 updateDaySleepScreen(
//                                   year.id,
//                                   month.id,
//                                   week.id,
//                                   day.id,
//                                   "sleepTotal",
//                                   (e.target as HTMLInputElement).value,
//                                 )}
//                             />

//                             <label
//                               class="{borderNTextNBg.lightText} text-sm font-semibold whitespace-nowrap"
//                               >Screen Bounds</label
//                             >
//                             <input
//                               type="text"
//                               class="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm w-20"
//                               placeholder=""
//                               value={day.screenGoal || ""}
//                               oninput={(e) =>
//                                 updateDaySleepScreen(
//                                   year.id,
//                                   month.id,
//                                   week.id,
//                                   day.id,
//                                   "screenGoal",
//                                   (e.target as HTMLInputElement).value,
//                                 )}
//                             />

//                             <label
//                               class="{borderNTextNBg.lightText} text-sm font-semibold whitespace-nowrap"
//                               >Screen Goal</label
//                             >
//                             <button
//                               class="w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 {day.screenFollowed
//                                 ? 'border-white shadow-[0_0_15px_rgba(255,255,255,0.8)]'
//                                 : 'border-2 border-gray-500 hover:border-white'}"
//                               onclick={() => {
//                                 if (!day.screenFollowed) {
//                                   pendingScreenGoalAction = {
//                                     yearId: year.id,
//                                     monthId: month.id,
//                                     weekId: week.id,
//                                     dayId: day.id,
//                                   };
//                                   showScreenGoalDialog = true;
//                                 } else {
//                                   toggleDayScreenFollowed(
//                                     year.id,
//                                     month.id,
//                                     week.id,
//                                     day.id,
//                                   );
//                                 }
//                               }}
//                             >
//                               {#if day.screenFollowed}
//                                 <span class="text-white text-sm font-bold">⭐</span>
//                               {:else}
//                                 <span
//                                   class="text-white"
//                                 >x</span>
//                               {/if}
//                             </button>
//                           </div>

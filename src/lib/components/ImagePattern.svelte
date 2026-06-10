<script lang="ts">
  import type { HighlightLevel2 } from "$lib/stores/profgoal";
  import {
    addImagePatternStep,
    removeImagePatternStep,
  } from "$lib/stores/persgoal";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  let {
    id,
    childid,
    levelTwo,
  }: {
    id: string;
    childid: string;
    levelTwo: HighlightLevel2;
  } = $props();

  let imageInput: HTMLInputElement;

  let activeTarget: {
    id: string;
    childid: string;
    imagePatternId: string;
  } | null = null;

  function openImagePicker(
    id: string,
    childid: string,
    imagePatternId: string,
  ): void {
    activeTarget = { id, childid, imagePatternId };
    imageInput?.click();
  }

  function handleImageChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file || !activeTarget) return;

    const reader = new FileReader();

    reader.onload = () => {
      addImagePatternStep(
        activeTarget!.id,
        activeTarget!.childid,
        activeTarget!.imagePatternId,
        {
          id: crypto.randomUUID(),
          dataUrl: reader.result as string,
        },
      );

      input.value = "";
      activeTarget = null;
    };

    reader.readAsDataURL(file);
  }
</script>

<input
  bind:this={imageInput}
  type="file"
  accept="image/*"
  class="hidden"
  onchange={handleImageChange}
/>

<div class="ml-15 flex items-center px-16 w-[90%] mt-0">
  <div class="w-6 mr-2 flex-none"></div>

  <div class="flex-1 flex flex-col">
    {#each Object.entries(levelTwo.imagePatterns ?? {}) as [imagePatternId, images]}
      <div
        class="flex flex-row flex-wrap gap-2 items-center py-3 my-2"
      >
        {#if imagePatternId != ""}
          <div class="flex flex-col mr-6">
            <button
              class="bg-white/15 hover:bg-emerald-400/25
            text-emerald-200 hover:text-emerald-50
            px-3 py-1 rounded-lg transition-colors"
              onclick={() => openImagePicker(id, childid, imagePatternId)}
            >
              +
            </button>

            <button
              class="bg-white/15 hover:bg-rose-400/25
            text-rose-200 hover:text-rose-50
            px-3 py-1 rounded-lg transition-colors"
              onclick={() =>
                removeImagePatternStep(id, childid, imagePatternId)}
            >
              -
            </button>
          </div>
        {/if}

        {#each images as image, imageIndex}
          {#if imageIndex > 0}
            <ChevronRight
              class="mt-5 mr-2 w-10 h-10 
            text-gray-400
            hover:text-green-500
            hover:translate-x-4
            transition-all
            duration-200"
            />
          {/if}

          <img
            src={image.dataUrl}
            alt="image pattern step"
            class={`patternstep relative mt-4 object-cover rounded w-64 h-40 mr-5
            transition-all duration-200 ease-out delay-500
            hover:scale-[2] hover:z-50 hover:shadow-2xl
            ${
              imageIndex === images.length - 1
                ? "border-4 border-green-400/30"
                : "border border-white/10"
            }`}
          />
        {/each}
      </div>
    {/each}
  </div>
</div>

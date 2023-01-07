<script setup lang="ts">
const { title, to } = defineProps<{ title: string, to: string }>()
</script>

<template>
    <router-link 
        class="text-xl p-2 rounded-md transition border border-transparent hover:bg-zinc-800 hover:border-zinc-700 active:bg-zinc-700" :to="to" :title="title"
        active-class="text-red-400"
    >
        <slot name="icon">
            <span>{{ title }}</span>
        </slot>
    </router-link>
</template>

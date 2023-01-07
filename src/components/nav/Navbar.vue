<script setup lang="ts">
import { IconCog6Tooth20Solid, IconComputerDesktop20Solid } from "@iconify-prerendered/vue-heroicons";
import NavLink from "./NavLink.vue";
</script>

<template>
    <nav class="bg-zinc-900 flex justify-between px-6 py-4 items-center">
        <span class="flex items-center space-x-4 select-none">
            <img src="assets/ico.png" class="h-12 rounded-lg" />
            <h1 class="text-xl font-black">iTunes Companion</h1>
        </span>
        <div class="flex text-lg">
            <NavLink title="Dashboard" to="/">
                <template #icon>
                    <IconComputerDesktop20Solid />
                </template>
            </NavLink>
            <NavLink title="Settings" to="/settings">
                <template #icon>
                    <IconCog6Tooth20Solid />
                </template>
            </NavLink>
        </div>
    </nav>
</template>

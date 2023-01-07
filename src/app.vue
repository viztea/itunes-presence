<script setup lang="ts">
import Navbar from "./components/nav/Navbar.vue";
</script>


<template>
    <div class="bg-zinc-800 text-white h-screen">
        <Navbar />
        <main>
            <router-view />
        </main>
    </div>
</template>

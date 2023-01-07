import { createApp } from "vue";
import "./styles/global.css";
import App from "./app.vue";

import { RouteRecordRaw, createRouter, createWebHashHistory } from "vue-router";

import Dashboard from "./pages/Dashboard.vue";
import Settings from "./pages/Settings.vue";

/* create router */
const routes: RouteRecordRaw[] = [
    { path: "/", component: Dashboard },
    { path: "/settings", component: Settings }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

/* create Vue app */
const app = createApp(App)

app.use(router)
app.mount("#app");

import {
  createRouter,
  createWebHistory,
  type RouteLocationNormalized,
} from "vue-router";

const trim = (v: unknown) => {
  if (v == null) return null;
  if (typeof v != "string") return null;
  const s = v.trim();
  if (s.length == 0) return null;
  return s;
};

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      component: (route: RouteLocationNormalized) => {
        const query = route.query.view;
        const hash = route.hash;
        if (hash != null) return;

        if (query === "filtered") {
          return FilteredPage;
        } else if (hash === "#section2") {
          return SectionedPage;
        } else {
          return HomePage; // Componente por defecto
        }
      },
    },
  ],
});

export default router;

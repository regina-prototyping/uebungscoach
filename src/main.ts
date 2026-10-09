import "./stil/theme.css";
import "./stil/app.css";

const app = document.getElementById("app")!;
app.innerHTML = `
  <section class="screen">
    <div class="topbar"><span class="app-name">Übungscoach</span></div>
    <h1 class="display">Was trainierst du heute?</h1>
    <p style="color: var(--muted)">Hier entsteht gerade die App. Bald gibt es hier das Rückenprogramm.</p>
  </section>
`;

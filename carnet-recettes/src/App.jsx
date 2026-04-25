import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "carnet-recettes-v1";

export const CATEGORIES = [
  { id: "all",         label: "Tout",         emoji: "✨", color: "#2C2416", light: "#FAF7F2" },
  { id: "entree",      label: "Entrées",      emoji: "🥗", color: "#4A7C59", light: "#EAF4ED" },
  { id: "plat",        label: "Plats",        emoji: "🍲", color: "#8B4513", light: "#F5EBE0" },
  { id: "dessert",     label: "Desserts",     emoji: "🍰", color: "#C8916E", light: "#FDF0E8" },
  { id: "gourmandise", label: "Gourmandises", emoji: "🍫", color: "#6B3A5E", light: "#F5EAF3" },
  { id: "boisson",     label: "Boissons",     emoji: "🥤", color: "#2471A3", light: "#E8F4FD" },
  { id: "petit-dej",   label: "Petit-déj",    emoji: "🥐", color: "#C49A00", light: "#FDF6E3" },
  { id: "snack",       label: "Snacks",       emoji: "🥪", color: "#B7410E", light: "#FDEEE8" },
];

const defaultRecipes = [
  {
    id: "demo-1",
    name: "Tarte aux pommes",
    description: "Une tarte dorée aux pommes caramélisées, croustillante et fondante à la fois.",
    image: null,
    category: "dessert",
    baseServings: 6,
    ingredients: [
      { name: "Pâte brisée", amount: 1, unit: "rouleau" },
      { name: "Pommes", amount: 4, unit: "pièces" },
      { name: "Sucre", amount: 80, unit: "g" },
      { name: "Beurre", amount: 40, unit: "g" },
      { name: "Cannelle", amount: 1, unit: "c.à.c" },
    ],
    steps: "Préchauffer le four à 180°C.\nÉtaler la pâte dans un moule beurré.\nÉplucher et couper les pommes en fines lamelles.\nDisposer les pommes sur la pâte en rosace, saupoudrer de sucre et de cannelle, puis ajouter le beurre en petits morceaux.\nEnfourner 35 minutes jusqu'à ce que la tarte soit bien dorée.",
    createdAt: Date.now(),
  },
  {
    id: "demo-2",
    name: "Salade César",
    description: "La classique salade César avec sa sauce crémeuse et ses croûtons dorés.",
    image: null,
    category: "entree",
    baseServings: 2,
    ingredients: [
      { name: "Laitue romaine", amount: 1, unit: "pièce" },
      { name: "Parmesan râpé", amount: 50, unit: "g" },
      { name: "Croûtons", amount: 80, unit: "g" },
      { name: "Sauce César", amount: 4, unit: "c.à.s" },
    ],
    steps: "Laver et essorer la laitue, couper en morceaux.\nPréparer les croûtons dorés à la poêle.\nMélanger la laitue avec la sauce César.\nAjouter les croûtons et le parmesan.\nServir immédiatement.",
    createdAt: Date.now() - 1000,
  },
];

function scaleAmount(amount, base, target) {
  const scaled = (amount * target) / base;
  return scaled % 1 === 0 ? scaled.toString() : scaled.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
}

function getCat(id) {
  return CATEGORIES.find(c => c.id === id) || CATEGORIES[1];
}

function ImagePlaceholder({ category }) {
  const cat = getCat(category);
  return (
    <div style={{ background: cat.color, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem" }}>
      {cat.emoji}
    </div>
  );
}

export default function App() {
  const [recipes, setRecipes] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : defaultRecipes;
    } catch { return defaultRecipes; }
  });
  const [view, setView] = useState("list");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selected, setSelected] = useState(null);
  const [servings, setServings] = useState(null);
  const [form, setForm] = useState(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes)); } catch {}
  }, [recipes]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function openDetail(recipe) {
    setSelected(recipe);
    setServings(recipe.baseServings);
    setView("detail");
  }

  function openAdd() {
    setForm({
      id: null, name: "", description: "", image: null,
      category: activeCategory === "all" ? "plat" : activeCategory,
      baseServings: 4, ingredients: [{ name: "", amount: "", unit: "" }], steps: "",
    });
    setView("form");
  }

  function openEdit(recipe) {
    setForm({ ...recipe, ingredients: recipe.ingredients.map(i => ({ ...i })) });
    setView("form");
  }

  function deleteRecipe(id) {
    if (!window.confirm("Supprimer cette recette ?")) return;
    setRecipes(r => r.filter(x => x.id !== id));
    setView("list");
    showToast("Recette supprimée");
  }

  function saveRecipe() {
    if (!form.name.trim()) { showToast("⚠️ Le nom est obligatoire"); return; }
    const ingredients = form.ingredients.filter(i => i.name.trim());
    if (form.id) {
      const updated = { ...form, ingredients };
      setRecipes(r => r.map(x => x.id === form.id ? updated : x));
      setSelected(updated);
      setServings(updated.baseServings);
      showToast("✅ Recette modifiée !");
      setView("detail");
    } else {
      const newR = { ...form, ingredients, id: Date.now().toString(), createdAt: Date.now() };
      setRecipes(r => [newR, ...r]);
      showToast("✅ Recette ajoutée !");
      setView("list");
    }
  }

  function handleImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const max = 800;
      let w = img.width, h = img.height;
      if (w > max) { h = Math.round(h * max / w); w = max; }
      if (h > max) { w = Math.round(w * max / h); h = max; }
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      setForm(f => ({ ...f, image: canvas.toDataURL("image/jpeg", 0.75) }));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  function addIngredient() {
    setForm(f => ({ ...f, ingredients: [...f.ingredients, { name: "", amount: "", unit: "" }] }));
  }
  function removeIngredient(i) {
    setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, idx) => idx !== i) }));
  }
  function updateIngredient(i, field, val) {
    setForm(f => {
      const ings = [...f.ingredients];
      ings[i] = { ...ings[i], [field]: val };
      return { ...f, ingredients: ings };
    });
  }

  const filtered = recipes.filter(r => {
    const matchCat = activeCategory === "all" || r.category === activeCategory;
    const q = search.toLowerCase();
    const matchSearch = r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const S = {
    app: { fontFamily: "'Playfair Display', serif", minHeight: "100dvh", background: "#FAF7F2", color: "#2C2416" },
    header: {
      background: "#2C2416", color: "#FAF7F2",
      padding: "1rem 1.2rem",
      paddingTop: "calc(1rem + env(safe-area-inset-top))",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      position: "sticky", top: 0, zIndex: 100,
      boxShadow: "0 2px 12px rgba(44,36,22,0.25)",
    },
    btn: (v = "primary", color) => ({
      padding: "0.5rem 1.1rem", borderRadius: "2rem", border: "none", cursor: "pointer",
      fontFamily: "'Playfair Display', serif", fontWeight: 600, fontSize: "0.88rem",
      background: v === "primary" ? (color || "#C8916E") : v === "danger" ? "#C0392B" : "#EDE8E0",
      color: v === "light" ? "#2C2416" : "#FAF7F2",
    }),
    input: {
      width: "100%", padding: "0.75rem 1rem", borderRadius: "0.6rem",
      border: "1.5px solid #E2D9CC", fontFamily: "'Playfair Display', serif",
      fontSize: "1rem", background: "#FDFAF7", color: "#2C2416", outline: "none",
    },
    label: { display: "block", fontWeight: 700, marginBottom: "0.35rem", fontSize: "0.88rem", color: "#6B5744" },
  };

  // ── LIST ──
  if (view === "list") return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet" />
      <div style={S.header}>
        <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>📖 Mes Recettes</div>
        <button style={S.btn("primary")} onClick={openAdd}>+ Ajouter</button>
      </div>

      {/* Search */}
      <div style={{ padding: "1rem 1.2rem 0", maxWidth: 700, margin: "0 auto" }}>
        <input style={{ ...S.input, fontSize: "0.95rem" }} placeholder="🔍 Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Category tabs */}
      <div style={{ overflowX: "auto", padding: "0.9rem 1rem 0", display: "flex", gap: "0.5rem", scrollbarWidth: "none" }}>
        {CATEGORIES.map(cat => {
          const count = cat.id === "all" ? recipes.length : recipes.filter(r => r.category === cat.id).length;
          const isActive = activeCategory === cat.id;
          return (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)} style={{
              flexShrink: 0, border: "none", cursor: "pointer", borderRadius: "2rem",
              padding: "0.45rem 0.85rem", fontFamily: "'Playfair Display', serif",
              fontWeight: isActive ? 700 : 500, fontSize: "0.82rem",
              background: isActive ? cat.color : "#FFFFFF",
              color: isActive ? "#FFFFFF" : "#6B5744",
              boxShadow: isActive ? `0 3px 10px ${cat.color}55` : "0 1px 4px rgba(44,36,22,0.10)",
              transition: "all 0.18s",
              display: "flex", alignItems: "center", gap: "0.3rem",
            }}>
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
              {count > 0 && (
                <span style={{
                  background: isActive ? "rgba(255,255,255,0.25)" : "#EDE8E0",
                  color: isActive ? "#FFF" : "#9B8676",
                  borderRadius: "1rem", padding: "0 0.4rem", fontSize: "0.7rem", fontWeight: 700,
                }}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Recipe list */}
      <div style={{ padding: "1rem 1.2rem", paddingBottom: "calc(1.2rem + env(safe-area-inset-bottom))", maxWidth: 700, margin: "0 auto" }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#9B8676" }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.8rem" }}>{activeCategory !== "all" ? getCat(activeCategory).emoji : "🍽️"}</div>
            <div style={{ fontSize: "1rem", fontWeight: 600 }}>{search ? "Aucune recette trouvée" : "Aucune recette ici"}</div>
            <div style={{ fontSize: "0.85rem", marginTop: "0.3rem" }}>Appuie sur + pour en ajouter une !</div>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
          {filtered.map(r => {
            const cat = getCat(r.category);
            return (
              <div key={r.id} onClick={() => openDetail(r)}
                style={{ background: "#FFF", borderRadius: "1.1rem", overflow: "hidden", boxShadow: "0 2px 14px rgba(44,36,22,0.09)", cursor: "pointer", display: "flex" }}>
                <div style={{ width: 110, minWidth: 110, height: 110, overflow: "hidden", background: cat.light }}>
                  {r.image
                    ? <img src={r.image} alt={r.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <ImagePlaceholder category={r.category} />}
                </div>
                <div style={{ padding: "0.85rem", flex: 1, minWidth: 0 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", background: cat.light, color: cat.color, borderRadius: "1rem", padding: "0.1rem 0.55rem", fontSize: "0.72rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                    {cat.emoji} {cat.label}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.2rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</div>
                  <div style={{ color: "#6B5744", fontSize: "0.82rem", lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{r.description}</div>
                  <div style={{ marginTop: "0.4rem", fontSize: "0.75rem", color: "#9B8676", fontWeight: 600 }}>👥 {r.baseServings} pers. · 🥕 {r.ingredients.length} ingréd.</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {toast && <Toast msg={toast} />}
    </div>
  );

  // ── DETAIL ──
  if (view === "detail" && selected) {
    const cur = servings || selected.baseServings;
    const cat = getCat(selected.category);
    return (
      <div style={S.app}>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet" />
        <div style={S.header}>
          <button style={S.btn("light")} onClick={() => setView("list")}>← Retour</button>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button style={S.btn("light")} onClick={() => openEdit(selected)}>✏️</button>
            <button style={S.btn("danger")} onClick={() => deleteRecipe(selected.id)}>🗑️</button>
          </div>
        </div>
        <div style={{ maxWidth: 700, margin: "0 auto", paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}>
          <div style={{ height: 240, background: cat.light, overflow: "hidden", position: "relative" }}>
            {selected.image
              ? <img src={selected.image} alt={selected.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <ImagePlaceholder category={selected.category} />}
            <div style={{ position: "absolute", top: "1rem", left: "1rem", background: cat.color, color: "#FFF", borderRadius: "2rem", padding: "0.35rem 0.9rem", fontSize: "0.85rem", fontWeight: 700, boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
              {cat.emoji} {cat.label}
            </div>
          </div>
          <div style={{ padding: "1.5rem 1.2rem" }}>
            <h1 style={{ margin: "0 0 0.4rem", fontSize: "1.8rem", fontWeight: 700, lineHeight: 1.2 }}>{selected.name}</h1>
            {selected.description && <p style={{ color: "#6B5744", margin: "0 0 1.5rem", lineHeight: 1.6, fontSize: "0.95rem" }}>{selected.description}</p>}

            {/* Servings */}
            <div style={{ background: "#FFF", borderRadius: "1rem", padding: "1rem 1.2rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", boxShadow: "0 2px 10px rgba(44,36,22,0.07)" }}>
              <span style={{ fontWeight: 700, color: "#6B5744", fontSize: "0.9rem" }}>👥 Adapter pour</span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                <button onClick={() => setServings(s => Math.max(1, s - 1))}
                  style={{ width: 38, height: 38, borderRadius: "50%", border: `2px solid ${cat.color}`, background: "#FFF", color: cat.color, fontWeight: 700, fontSize: "1.3rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                <span style={{ fontSize: "1.5rem", fontWeight: 700, minWidth: 36, textAlign: "center" }}>{cur}</span>
                <button onClick={() => setServings(s => s + 1)}
                  style={{ width: 38, height: 38, borderRadius: "50%", border: `2px solid ${cat.color}`, background: cat.color, color: "#FFF", fontWeight: 700, fontSize: "1.3rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                <span style={{ color: "#6B5744", fontSize: "0.9rem" }}>pers.</span>
              </div>
              {cur !== selected.baseServings && <span style={{ fontSize: "0.78rem", color: cat.color, fontWeight: 600 }}>base : {selected.baseServings}</span>}
            </div>

            {/* Ingredients */}
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 0.7rem" }}>🥕 Ingrédients</h2>
            <div style={{ background: "#FFF", borderRadius: "0.8rem", padding: "0.5rem 1rem", marginBottom: "1.5rem", boxShadow: "0 2px 10px rgba(44,36,22,0.07)" }}>
              {selected.ingredients.map((ing, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.55rem 0", borderBottom: i < selected.ingredients.length - 1 ? "1px solid #F0EBE3" : "none" }}>
                  <span style={{ fontSize: "0.95rem" }}>{ing.name}</span>
                  <span style={{ fontWeight: 700, color: cat.color, fontSize: "0.95rem" }}>{scaleAmount(ing.amount, selected.baseServings, cur)} {ing.unit}</span>
                </div>
              ))}
            </div>

            {/* Steps */}
            {selected.steps && <>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 0.7rem" }}>👨‍🍳 Préparation</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                {selected.steps.split("\n").filter(Boolean).map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: "0.8rem", alignItems: "flex-start", background: "#FFF", borderRadius: "0.8rem", padding: "0.8rem 1rem", boxShadow: "0 1px 6px rgba(44,36,22,0.06)" }}>
                    <span style={{ background: cat.color, color: "#FFF", borderRadius: "50%", minWidth: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.82rem", flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                    <span style={{ lineHeight: 1.6, fontSize: "0.93rem" }}>{step}</span>
                  </div>
                ))}
              </div>
            </>}
          </div>
        </div>
        {toast && <Toast msg={toast} />}
      </div>
    );
  }

  // ── FORM ──
  if (view === "form" && form) {
    const isEdit = !!form.id;
    const cat = getCat(form.category);
    return (
      <div style={S.app}>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet" />
        <div style={S.header}>
          <button style={S.btn("light")} onClick={() => setView(isEdit ? "detail" : "list")}>← Annuler</button>
          <div style={{ fontWeight: 700, fontSize: "1rem" }}>{isEdit ? "Modifier" : "Nouvelle recette"}</div>
          <button style={{ ...S.btn("primary"), background: cat.color }} onClick={saveRecipe}>Enregistrer</button>
        </div>
        <div style={{ padding: "1.2rem", paddingBottom: "calc(2rem + env(safe-area-inset-bottom))", maxWidth: 700, margin: "0 auto" }}>

          {/* Photo */}
          <div style={{ marginBottom: "1.2rem" }}>
            <label style={S.label}>📷 Photo</label>
            <div style={{ height: 160, borderRadius: "0.8rem", overflow: "hidden", background: cat.light, cursor: "pointer", border: `2px dashed ${cat.color}`, display: "flex", alignItems: "center", justifyContent: "center" }}
              onClick={() => fileRef.current.click()}>
              {form.image
                ? <img src={form.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ textAlign: "center", color: cat.color }}>
                    <div style={{ fontSize: "2rem" }}>📷</div>
                    <div style={{ fontSize: "0.85rem", marginTop: "0.3rem" }}>Appuyer pour ajouter</div>
                  </div>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImage} />
            {form.image && <button style={{ ...S.btn("light"), marginTop: "0.5rem", fontSize: "0.8rem", padding: "0.3rem 0.8rem" }} onClick={() => setForm(f => ({ ...f, image: null }))}>Supprimer</button>}
          </div>

          {/* Catégorie */}
          <div style={{ marginBottom: "1.2rem" }}>
            <label style={S.label}>🏷️ Catégorie</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {CATEGORIES.filter(c => c.id !== "all").map(c => (
                <button key={c.id} onClick={() => setForm(f => ({ ...f, category: c.id }))}
                  style={{
                    border: "none", cursor: "pointer", borderRadius: "2rem",
                    padding: "0.45rem 0.9rem", fontFamily: "'Playfair Display', serif",
                    fontWeight: form.category === c.id ? 700 : 500, fontSize: "0.85rem",
                    background: form.category === c.id ? c.color : "#EDE8E0",
                    color: form.category === c.id ? "#FFF" : "#6B5744",
                    boxShadow: form.category === c.id ? `0 2px 8px ${c.color}55` : "none",
                    transition: "all 0.15s",
                  }}>
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Nom */}
          <div style={{ marginBottom: "1.2rem" }}>
            <label style={S.label}>🍽️ Nom *</label>
            <input style={{ ...S.input, borderColor: cat.color + "66" }} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="ex: Ratatouille" />
          </div>

          {/* Description */}
          <div style={{ marginBottom: "1.2rem" }}>
            <label style={S.label}>📝 Description</label>
            <textarea style={{ ...S.input, minHeight: 72, resize: "vertical", borderColor: cat.color + "66" }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Décrivez votre recette..." />
          </div>

          {/* Personnes */}
          <div style={{ marginBottom: "1.2rem" }}>
            <label style={S.label}>👥 Nombre de personnes (base)</label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
              <button onClick={() => setForm(f => ({ ...f, baseServings: Math.max(1, f.baseServings - 1) }))}
                style={{ width: 38, height: 38, borderRadius: "50%", border: `2px solid ${cat.color}`, background: "#FFF", color: cat.color, fontWeight: 700, fontSize: "1.2rem", cursor: "pointer" }}>−</button>
              <span style={{ fontSize: "1.4rem", fontWeight: 700, minWidth: 32, textAlign: "center" }}>{form.baseServings}</span>
              <button onClick={() => setForm(f => ({ ...f, baseServings: f.baseServings + 1 }))}
                style={{ width: 38, height: 38, borderRadius: "50%", border: `2px solid ${cat.color}`, background: cat.color, color: "#FFF", fontWeight: 700, fontSize: "1.2rem", cursor: "pointer" }}>+</button>
              <span style={{ color: "#6B5744", fontSize: "0.9rem" }}>personne{form.baseServings > 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Ingrédients */}
          <div style={{ marginBottom: "1.2rem" }}>
            <label style={S.label}>🥕 Ingrédients</label>
            {form.ingredients.map((ing, i) => (
              <div key={i} style={{ display: "flex", gap: "0.4rem", marginBottom: "0.45rem", alignItems: "center" }}>
                <input style={{ ...S.input, flex: 3 }} placeholder="Ingrédient" value={ing.name} onChange={e => updateIngredient(i, "name", e.target.value)} />
                <input style={{ ...S.input, flex: 1.2, minWidth: 0 }} placeholder="Qté" type="number" min="0" step="any" value={ing.amount} onChange={e => updateIngredient(i, "amount", e.target.value)} />
                <input style={{ ...S.input, flex: 1.5, minWidth: 0 }} placeholder="Unité" value={ing.unit} onChange={e => updateIngredient(i, "unit", e.target.value)} />
                {form.ingredients.length > 1 && (
                  <button onClick={() => removeIngredient(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#C0392B", fontSize: "1.3rem", padding: "0 0.2rem", flexShrink: 0 }}>✕</button>
                )}
              </div>
            ))}
            <button style={{ ...S.btn("light"), fontSize: "0.85rem" }} onClick={addIngredient}>+ Ajouter un ingrédient</button>
          </div>

          {/* Étapes */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={S.label}>👨‍🍳 Étapes (une par ligne)</label>
            <textarea style={{ ...S.input, minHeight: 150, resize: "vertical", lineHeight: 1.7, borderColor: cat.color + "66" }}
              value={form.steps} onChange={e => setForm(f => ({ ...f, steps: e.target.value }))}
              placeholder={"Préchauffer le four à 180°C.\nPréparer les légumes.\nCuire 30 minutes."} />
          </div>
        </div>
        {toast && <Toast msg={toast} />}
      </div>
    );
  }

  return null;
}

function Toast({ msg }) {
  return (
    <div style={{
      position: "fixed", bottom: "calc(1.5rem + env(safe-area-inset-bottom))", left: "50%", transform: "translateX(-50%)",
      background: "#2C2416", color: "#FAF7F2", padding: "0.75rem 1.5rem", borderRadius: "2rem",
      fontWeight: 600, fontSize: "0.9rem", boxShadow: "0 4px 20px rgba(0,0,0,0.25)", zIndex: 999, whiteSpace: "nowrap",
    }}>{msg}</div>
  );
}

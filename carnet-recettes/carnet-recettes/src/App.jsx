import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "carnet-recettes-v1";

const defaultRecipes = [
  {
    id: "demo-1",
    name: "Tarte aux pommes",
    description: "Une tarte dorée aux pommes caramélisées, croustillante et fondante à la fois.",
    image: null,
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
];

function scaleAmount(amount, base, target) {
  const scaled = (amount * target) / base;
  return scaled % 1 === 0 ? scaled.toString() : scaled.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
}

function ImagePlaceholder({ name }) {
  const colors = ["#C8916E", "#7BA99A", "#D4A5A5", "#9B8EC4", "#B5C4A4", "#E8C07D", "#A8C4D4", "#D4B896"];
  const emojis = ["🍰","🥗","🍲","🥧","🍜","🫕","🥘","🫔","🍱","🥙","🍛","🫙"];
  const idx = name.charCodeAt(0) % colors.length;
  return (
    <div style={{ background: colors[idx], width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3.5rem" }}>
      {emojis[name.charCodeAt(0) % emojis.length]}
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
    setForm({ id: null, name: "", description: "", image: null, baseServings: 4, ingredients: [{ name: "", amount: "", unit: "" }], steps: "" });
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
    // Resize image to keep storage small
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
      const data = canvas.toDataURL("image/jpeg", 0.75);
      setForm(f => ({ ...f, image: data }));
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

  const filtered = recipes.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.description.toLowerCase().includes(search.toLowerCase())
  );

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
    btn: (v = "primary") => ({
      padding: "0.5rem 1.1rem", borderRadius: "2rem", border: "none", cursor: "pointer",
      fontFamily: "'Playfair Display', serif", fontWeight: 600, fontSize: "0.88rem", transition: "opacity 0.15s",
      background: v === "primary" ? "#C8916E" : v === "dark" ? "#2C2416" : v === "danger" ? "#C0392B" : "#EDE8E0",
      color: v === "light" ? "#2C2416" : "#FAF7F2",
    }),
    input: {
      width: "100%", padding: "0.75rem 1rem", borderRadius: "0.6rem",
      border: "1.5px solid #E2D9CC", fontFamily: "'Playfair Display', serif",
      fontSize: "1rem", background: "#FDFAF7", color: "#2C2416", outline: "none",
    },
    label: { display: "block", fontWeight: 700, marginBottom: "0.35rem", fontSize: "0.88rem", color: "#6B5744" },
    tag: { background: "#EDE8E0", borderRadius: "1rem", padding: "0.2rem 0.7rem", fontSize: "0.8rem", color: "#6B5744", fontWeight: 600 },
    card: {
      background: "#FFF", borderRadius: "1.1rem", overflow: "hidden",
      boxShadow: "0 2px 14px rgba(44,36,22,0.09)", cursor: "pointer",
    },
  };

  // ── LIST ──
  if (view === "list") return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet" />
      <div style={S.header}>
        <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>📖 Mes Recettes</div>
        <button style={S.btn("primary")} onClick={openAdd}>+ Ajouter</button>
      </div>
      <div style={{ padding: "1.2rem", paddingBottom: "calc(1.2rem + env(safe-area-inset-bottom))", maxWidth: 700, margin: "0 auto" }}>
        <input style={{ ...S.input, marginBottom: "1.2rem" }} placeholder="🔍 Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "4rem 1rem", color: "#9B8676" }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.8rem" }}>🍽️</div>
            <div style={{ fontSize: "1rem" }}>{search ? "Aucune recette trouvée" : "Ajoutez votre première recette !"}</div>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {filtered.map(r => (
            <div key={r.id} style={S.card} onClick={() => openDetail(r)}>
              <div style={{ display: "flex", gap: 0 }}>
                <div style={{ width: 110, minWidth: 110, height: 110, flexShrink: 0, overflow: "hidden", background: "#EDE8E0" }}>
                  {r.image ? <img src={r.image} alt={r.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <ImagePlaceholder name={r.name} />}
                </div>
                <div style={{ padding: "0.9rem", flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: "0.25rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</div>
                  <div style={{ color: "#6B5744", fontSize: "0.83rem", lineHeight: 1.4, marginBottom: "0.6rem",
                    overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{r.description}</div>
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    <span style={S.tag}>👥 {r.baseServings} pers.</span>
                    <span style={S.tag}>🥕 {r.ingredients.length}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {toast && <Toast msg={toast} />}
    </div>
  );

  // ── DETAIL ──
  if (view === "detail" && selected) {
    const cur = servings || selected.baseServings;
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
          <div style={{ height: 240, background: "#EDE8E0", overflow: "hidden" }}>
            {selected.image ? <img src={selected.image} alt={selected.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <ImagePlaceholder name={selected.name} />}
          </div>
          <div style={{ padding: "1.5rem 1.2rem" }}>
            <h1 style={{ margin: "0 0 0.4rem", fontSize: "1.8rem", fontWeight: 700, lineHeight: 1.2 }}>{selected.name}</h1>
            {selected.description && <p style={{ color: "#6B5744", margin: "0 0 1.5rem", lineHeight: 1.6, fontSize: "0.95rem" }}>{selected.description}</p>}

            {/* Servings adjuster */}
            <div style={{ background: "#FFF", borderRadius: "1rem", padding: "1rem 1.2rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 10px rgba(44,36,22,0.07)" }}>
              <div style={{ fontWeight: 700, color: "#6B5744", fontSize: "0.9rem" }}>👥 Adapter pour</div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                <button onClick={() => setServings(s => Math.max(1, s - 1))}
                  style={{ width: 38, height: 38, borderRadius: "50%", border: "2px solid #C8916E", background: "#FFF", color: "#C8916E", fontWeight: 700, fontSize: "1.3rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                <span style={{ fontSize: "1.5rem", fontWeight: 700, minWidth: 36, textAlign: "center" }}>{cur}</span>
                <button onClick={() => setServings(s => s + 1)}
                  style={{ width: 38, height: 38, borderRadius: "50%", border: "2px solid #C8916E", background: "#C8916E", color: "#FFF", fontWeight: 700, fontSize: "1.3rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                <span style={{ color: "#6B5744", fontSize: "0.9rem" }}>pers.</span>
              </div>
              {cur !== selected.baseServings && <span style={{ fontSize: "0.78rem", color: "#C8916E", fontWeight: 600 }}>base: {selected.baseServings}</span>}
            </div>

            {/* Ingredients */}
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 0.7rem" }}>🥕 Ingrédients</h2>
            <div style={{ background: "#FFF", borderRadius: "0.8rem", padding: "0.5rem 1rem", marginBottom: "1.5rem", boxShadow: "0 2px 10px rgba(44,36,22,0.07)" }}>
              {selected.ingredients.map((ing, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.55rem 0", borderBottom: i < selected.ingredients.length - 1 ? "1px solid #F0EBE3" : "none" }}>
                  <span style={{ fontSize: "0.95rem" }}>{ing.name}</span>
                  <span style={{ fontWeight: 700, color: "#C8916E", fontSize: "0.95rem" }}>{scaleAmount(ing.amount, selected.baseServings, cur)} {ing.unit}</span>
                </div>
              ))}
            </div>

            {/* Steps */}
            {selected.steps && <>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 0.7rem" }}>👨‍🍳 Préparation</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                {selected.steps.split("\n").filter(Boolean).map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: "0.8rem", alignItems: "flex-start", background: "#FFF", borderRadius: "0.8rem", padding: "0.8rem 1rem", boxShadow: "0 1px 6px rgba(44,36,22,0.06)" }}>
                    <span style={{ background: "#C8916E", color: "#FFF", borderRadius: "50%", minWidth: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.82rem", flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
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

  // ── FORM (add/edit) ──
  if (view === "form" && form) {
    const isEdit = !!form.id;
    return (
      <div style={S.app}>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet" />
        <div style={S.header}>
          <button style={S.btn("light")} onClick={() => setView(isEdit ? "detail" : "list")}>← Annuler</button>
          <div style={{ fontWeight: 700, fontSize: "1rem" }}>{isEdit ? "Modifier" : "Nouvelle recette"}</div>
          <button style={S.btn("primary")} onClick={saveRecipe}>Enregistrer</button>
        </div>
        <div style={{ padding: "1.2rem", paddingBottom: "calc(2rem + env(safe-area-inset-bottom))", maxWidth: 700, margin: "0 auto" }}>

          {/* Photo */}
          <div style={{ marginBottom: "1.2rem" }}>
            <label style={S.label}>📷 Photo</label>
            <div style={{ height: 160, borderRadius: "0.8rem", overflow: "hidden", background: "#EDE8E0", cursor: "pointer", border: "2px dashed #C8916E", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => fileRef.current.click()}>
              {form.image ? <img src={form.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> :
                <div style={{ textAlign: "center", color: "#9B8676" }}>
                  <div style={{ fontSize: "2rem" }}>📷</div>
                  <div style={{ fontSize: "0.85rem", marginTop: "0.3rem" }}>Appuyer pour ajouter</div>
                </div>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImage} />
            {form.image && <button style={{ ...S.btn("light"), marginTop: "0.5rem", fontSize: "0.8rem", padding: "0.3rem 0.8rem" }} onClick={() => setForm(f => ({ ...f, image: null }))}>Supprimer</button>}
          </div>

          <Field label="🍽️ Nom *" style={S}>
            <input style={S.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="ex: Ratatouille" />
          </Field>

          <Field label="📝 Description" style={S}>
            <textarea style={{ ...S.input, minHeight: 72, resize: "vertical" }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Décrivez votre recette..." />
          </Field>

          <Field label="👥 Nombre de personnes (base)" style={S}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
              <button onClick={() => setForm(f => ({ ...f, baseServings: Math.max(1, f.baseServings - 1) }))}
                style={{ width: 38, height: 38, borderRadius: "50%", border: "2px solid #C8916E", background: "#FFF", color: "#C8916E", fontWeight: 700, fontSize: "1.2rem", cursor: "pointer" }}>−</button>
              <span style={{ fontSize: "1.4rem", fontWeight: 700, minWidth: 32, textAlign: "center" }}>{form.baseServings}</span>
              <button onClick={() => setForm(f => ({ ...f, baseServings: f.baseServings + 1 }))}
                style={{ width: 38, height: 38, borderRadius: "50%", border: "2px solid #C8916E", background: "#C8916E", color: "#FFF", fontWeight: 700, fontSize: "1.2rem", cursor: "pointer" }}>+</button>
              <span style={{ color: "#6B5744", fontSize: "0.9rem" }}>personne{form.baseServings > 1 ? "s" : ""}</span>
            </div>
          </Field>

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

          <Field label="👨‍🍳 Étapes de préparation (une étape par ligne)" style={S}>
            <textarea style={{ ...S.input, minHeight: 150, resize: "vertical", lineHeight: 1.7 }}
              value={form.steps} onChange={e => setForm(f => ({ ...f, steps: e.target.value }))}
              placeholder={"Préchauffer le four à 180°C.\nPréparer les légumes.\nCuire 30 minutes."} />
          </Field>
        </div>
        {toast && <Toast msg={toast} />}
      </div>
    );
  }

  return null;
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: "1.2rem" }}>
      <label style={{ display: "block", fontWeight: 700, marginBottom: "0.35rem", fontSize: "0.88rem", color: "#6B5744" }}>{label}</label>
      {children}
    </div>
  );
}

function Toast({ msg }) {
  return (
    <div style={{ position: "fixed", bottom: "calc(1.5rem + env(safe-area-inset-bottom))", left: "50%", transform: "translateX(-50%)",
      background: "#2C2416", color: "#FAF7F2", padding: "0.75rem 1.5rem", borderRadius: "2rem",
      fontWeight: 600, fontSize: "0.9rem", boxShadow: "0 4px 20px rgba(0,0,0,0.25)", zIndex: 999, whiteSpace: "nowrap" }}>{msg}</div>
  );
}

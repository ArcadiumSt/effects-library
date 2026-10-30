// shortcut: fetches effects.json on each load and filters in memory, fine for dozens of entries
const $ = (sel) => document.querySelector(sel);

let effects = [];
let category = "全部";

// Pure filter so it can be tested without a DOM.
function matches(effect, query, cat) {
  if (cat !== "全部" && effect.分類 !== cat) return false;
  const haystack = [effect.編號, effect.名稱, effect.分類, effect.適用情境, effect.實作方式, ...effect.特徵]
    .join(" ")
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  children.forEach((c) => node.append(c));
  return node;
}

function renderGrid() {
  const query = $("#search").value.trim();
  const list = effects.filter((e) => matches(e, query, category));
  $("#count").textContent = `${list.length} 個點子`;

  const grid = $("#grid");
  grid.replaceChildren();
  if (list.length === 0) {
    grid.append(el("p", { className: "empty", textContent: "找不到符合的特效" }));
    return;
  }
  list.forEach((e) => {
    const card = el("button", { className: "card" }, [
      thumb(e, true),
      el("div", { className: "meta" }, [
        el("div", { className: "num", textContent: e.編號 }),
        el("div", { className: "name", textContent: e.名稱 }),
        el("span", { className: "cat", textContent: e.分類 }),
      ]),
    ]);
    card.addEventListener("click", () => openDetail(e));
    grid.append(card);
  });
}

// Reference image, swapped for a numbered tile if the file is missing.
function thumb(e, lazy) {
  const img = el("img", { className: "thumb", src: e.參考圖路徑, alt: e.名稱 });
  if (lazy) img.loading = "lazy";
  img.addEventListener("error", () => {
    img.replaceWith(el("div", { className: "thumb missing", textContent: e.編號, role: "img", ariaLabel: `${e.名稱}（尚無參考圖）` }));
  });
  return img;
}

function openDetail(e) {
  $("#detail-body").replaceChildren(
    thumb(e, false),
    el("div", { className: "detail-text" }, [
      el("div", { className: "num", textContent: `${e.編號} · ${e.分類}` }),
      el("h2", { textContent: e.名稱 }),
      el("h3", { textContent: "特徵" }),
      el("ul", { className: "tags" }, e.特徵.map((f) => el("li", { textContent: f }))),
      el("h3", { textContent: "下指令範例" }),
      el("div", { className: "cmd-box" }, [el("p", { className: "cmd", textContent: e.下指令範例 }), copyButton(e.下指令範例)]),
      el("h3", { textContent: "實作方式" }),
      el("p", { textContent: e.實作方式 }),
      el("h3", { textContent: "適用情境" }),
      el("p", { textContent: e.適用情境 }),
      el("p", { className: "date", textContent: `新增於 ${e.日期}` }),
    ]),
  );
  $("#detail").showModal();
}

function copyButton(text) {
  const btn = el("button", { className: "copy", textContent: "複製指令" });
  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for browsers or contexts where the Clipboard API is blocked.
      const ta = el("textarea", { value: text });
      document.body.append(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    btn.textContent = "✓ 已複製";
    btn.classList.add("done");
    setTimeout(() => {
      btn.textContent = "複製指令";
      btn.classList.remove("done");
    }, 1500);
  });
  return btn;
}

$("#search").addEventListener("input", renderGrid);

$("#chips").addEventListener("click", (ev) => {
  const chip = ev.target.closest(".chip");
  if (!chip) return;
  category = chip.dataset.cat;
  document.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c === chip));
  renderGrid();
});

$("#close").addEventListener("click", () => $("#detail").close());
$("#detail").addEventListener("click", (ev) => {
  // Clicking the backdrop (the dialog itself, not its content) closes it.
  if (ev.target === ev.currentTarget) ev.currentTarget.close();
});

fetch("effects.json")
  .then((r) => r.json())
  .then((data) => {
    effects = data;
    renderGrid();
  })
  .catch(() => {
    $("#count").textContent = "讀取 effects.json 失敗";
  });

// Exposed for the test script only.
if (typeof module !== "undefined") module.exports = { matches };

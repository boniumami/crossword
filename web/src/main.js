import { isComplete, isCorrect, placeNext, removeSlot, replaceSlot } from "./grade.js";
import { createBoard, tokenizePoem } from "./tokenizer.js";

const app = document.getElementById("app");
const audio = new Audio();
audio.loop = true;
audio.volume = 0.35;

const state = {
  view: "home",
  poemCount: 0,
  imageCount: 0,
  musicCount: 0,
  homeError: "",
  round: [],
  index: 0,
  rows: [],
  answer: [],
  slots: [],
  bank: [],
  selectedIndex: null,
  muted: false,
  modal: null,
  tab: "poems",
  poems: [],
  images: [],
  music: [],
  editing: null,
  libMessage: "",
};

async function api(path, options) {
  const res = await fetch(path, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "请求失败");
  }
  return data;
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === "html") node.innerHTML = v;
    else if (v === false || v === null || v === undefined) continue;
    else node.setAttribute(k, v);
  }
  for (const child of children) {
    if (child) node.append(child);
  }
  return node;
}

function currentPoem() {
  return state.round[state.index];
}

function applyMedia(poem) {
  const layer = document.querySelector(".bg-layer");
  const url = poem?.image?.url || "/api/files/images/default.gif";
  if (layer) layer.style.backgroundImage = `url("${url}")`;
  const musicUrl = poem?.music?.url || "/api/files/music/default.wav";
  if (audio.src !== new URL(musicUrl, window.location.href).href) {
    audio.src = musicUrl;
  }
  if (state.muted) audio.pause();
  else audio.play().catch(() => {});
}

function loadPoem(poem) {
  const { rows, answer } = tokenizePoem(poem.body);
  const board = createBoard(answer);
  state.rows = rows;
  state.answer = answer;
  state.slots = board.slots;
  state.bank = board.bank;
  state.selectedIndex = null;
  state.modal = null;
}

async function startRound() {
  try {
    state.homeError = "";
    const round = await api("/api/round");
    state.round = round;
    state.index = 0;
    state.view = "play";
    loadPoem(round[0]);
    render();
    applyMedia(round[0]);
  } catch (err) {
    state.homeError = err.message;
    render();
  }
}

function submitAnswer() {
  if (!isComplete(state.slots)) return;
  if (isCorrect(state.slots, state.answer)) {
    state.modal = { kind: "ok", text: "小朋友，你真棒！" };
  } else {
    state.modal = { kind: "ng", text: "继续加油哦！" };
  }
  render();
}

function dismissModal() {
  const kind = state.modal?.kind;
  state.modal = null;
  if (kind === "ok") {
    if (state.index < state.round.length - 1) {
      state.index += 1;
      loadPoem(state.round[state.index]);
      render();
      applyMedia(currentPoem());
      return;
    }
    state.modal = { kind: "done", text: "本轮 5 首全部完成！" };
  }
  render();
}

function resetCurrent() {
  const board = createBoard(state.answer);
  state.slots = board.slots;
  state.bank = board.bank;
  state.selectedIndex = null;
  state.modal = null;
  render();
}

function slotIndexOf(row, col) {
  let n = 0;
  for (let i = 0; i < row; i += 1) n += state.rows[i].length;
  return n + col;
}

function renderHome() {
  return el("div", { class: "screen home" }, [
    el("div", { class: "brand" }, [
      el("h1", { text: "古诗词填写" }),
      el("p", { text: "把打乱的字按顺序填回去吧" }),
    ]),
    el("div", { class: "panel" }, [
      el("p", { class: "hint", text: `题库 ${state.poemCount} 首 · 图片 ${state.imageCount} 张 · 音乐 ${state.musicCount} 首` }),
      el("div", { class: "actions" }, [
        el("button", { class: "btn", text: "开始一轮", onClick: startRound }),
        el("button", { class: "btn secondary", text: "题库管理", onClick: () => openLibrary() }),
      ]),
      state.homeError ? el("p", { class: "hint error", text: state.homeError }) : null,
    ]),
  ]);
}

function renderPlay() {
  const poem = currentPoem();
  const boardLines = [];
  state.rows.forEach((row, ri) => {
    const line = el("div", { class: "line" });
    row.forEach((_tok, ci) => {
      const si = slotIndexOf(ri, ci);
      const filled = state.slots[si];
      const locked = Boolean(filled && filled.punct);
      const selected = state.selectedIndex === si;
      const slotClass = locked
        ? "slot punct-lock"
        : filled
          ? selected
            ? "slot filled selected"
            : "slot filled"
          : "slot";
      const slot = el("button", {
        class: slotClass,
        text: filled ? filled.char : "",
        onClick: () => {
          if (!filled || filled.punct) return;
          if (state.selectedIndex === si) {
            const next = removeSlot(state.slots, state.bank, si);
            state.slots = next.slots;
            state.bank = next.bank;
            state.selectedIndex = null;
          } else {
            state.selectedIndex = si;
          }
          render();
          applyMedia(currentPoem());
        },
      });
      line.append(slot);
    });
    boardLines.push(line);
  });

  const bank = el("div", { class: "bank" });
  for (const token of state.bank) {
    bank.append(
      el("button", {
        class: "tile",
        text: token.char,
        onClick: () => {
          const next =
            state.selectedIndex === null
              ? placeNext(state.slots, state.bank, token.id)
              : replaceSlot(state.slots, state.bank, state.selectedIndex, token.id);
          state.slots = next.slots;
          state.bank = next.bank;
          state.selectedIndex = null;
          render();
          applyMedia(currentPoem());
        },
      })
    );
  }

  const modal = state.modal
    ? el("div", { class: "modal-mask" }, [
        el("div", { class: `modal ${state.modal.kind}` }, [
          el("h3", { text: state.modal.text }),
          el(
            "button",
            {
              class: "btn",
              text: state.modal.kind === "done" ? "再来一轮" : "好的",
              onClick: () => {
                if (state.modal.kind === "done") {
                  audio.pause();
                  state.view = "home";
                  state.modal = null;
                  loadCounts().then(render);
                  return;
                }
                dismissModal();
              },
            }
          ),
        ]),
      ])
    : null;

  return el("div", { class: "screen play" }, [
    el("div", { class: "bg-layer" }),
    el("div", { class: "play-top" }, [
      el("div", {}, [
        el("h2", { text: poem.title }),
        el("div", { class: "meta", text: `${poem.author} · 第 ${state.index + 1} / 5 题` }),
      ]),
      el("button", {
        class: "btn ghost",
        text: state.muted ? "打开声音" : "静音",
        onClick: () => {
          state.muted = !state.muted;
          if (state.muted) audio.pause();
          else audio.play().catch(() => {});
          render();
          applyMedia(currentPoem());
        },
      }),
    ]),
    el("div", { class: "board" }, boardLines),
    bank,
    el("div", { class: "play-actions" }, [
      el("button", { class: "btn secondary", text: "重置本题", onClick: resetCurrent }),
      el("button", {
        class: "btn",
        text: "提交",
        disabled: !isComplete(state.slots),
        onClick: submitAnswer,
      }),
      el("button", {
        class: "btn ghost",
        text: "返回首页",
        onClick: () => {
          audio.pause();
          state.view = "home";
          render();
        },
      }),
    ]),
    modal,
  ]);
}

async function openLibrary() {
  state.view = "library";
  state.libMessage = "";
  await refreshLibrary();
  render();
}

async function refreshLibrary() {
  const [poems, images, music] = await Promise.all([api("/api/poems"), api("/api/images"), api("/api/music")]);
  state.poems = poems;
  state.images = images;
  state.music = music;
}

async function loadCounts() {
  try {
    const [poems, images, music] = await Promise.all([api("/api/poems"), api("/api/images"), api("/api/music")]);
    state.poemCount = poems.length;
    state.imageCount = images.length;
    state.musicCount = music.length;
  } catch {
    state.homeError = "题库暂时打不开，请稍后再试";
  }
}

function poemForm() {
  const poem = state.editing || { title: "", author: "", body: "", imageId: "", musicId: "" };
  const wrap = el("form", { class: "form-grid" });
  const title = el("input", { placeholder: "标题", value: poem.title || "" });
  const author = el("input", { placeholder: "作者", value: poem.author || "" });
  const body = el("textarea", { placeholder: "正文，一行一句" });
  body.value = poem.body || "";
  const image = el("select");
  image.append(el("option", { value: "", text: "不绑定图片" }));
  for (const img of state.images) {
    const opt = el("option", { value: String(img.id), text: img.name });
    if (Number(poem.imageId) === img.id) opt.selected = true;
    image.append(opt);
  }
  const music = el("select");
  music.append(el("option", { value: "", text: "不绑定音乐" }));
  for (const m of state.music) {
    const opt = el("option", { value: String(m.id), text: m.name });
    if (Number(poem.musicId) === m.id) opt.selected = true;
    music.append(opt);
  }
  wrap.append(title, author, body, image, music);
  wrap.append(
    el("button", {
      class: "btn",
      text: poem.id ? "保存修改" : "新增诗词",
      type: "submit",
    })
  );
  wrap.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const payload = {
      title: title.value,
      author: author.value,
      body: body.value,
      imageId: image.value ? Number(image.value) : null,
      musicId: music.value ? Number(music.value) : null,
    };
    try {
      if (poem.id) await api(`/api/poems/${poem.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      else await api("/api/poems", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      state.editing = null;
      state.libMessage = "诗词已保存";
      await refreshLibrary();
      render();
    } catch (err) {
      state.libMessage = err.message;
      render();
    }
  });
  return wrap;
}

function mediaForm(kind) {
  const wrap = el("form", { class: "form-grid" });
  const name = el("input", { placeholder: kind === "images" ? "图片名称" : "音乐名称" });
  const file = el("input", { type: "file", accept: kind === "images" ? "image/png,image/jpeg,image/gif,image/webp,.apng" : "audio/mpeg,audio/wav,audio/ogg" });
  wrap.append(name, file, el("button", { class: "btn", text: kind === "images" ? "上传图片" : "上传音乐", type: "submit" }));
  wrap.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    if (!file.files[0]) {
      state.libMessage = "请选择文件";
      render();
      return;
    }
    const fd = new FormData();
    fd.append("name", name.value);
    fd.append("file", file.files[0]);
    try {
      await api(`/api/${kind}`, { method: "POST", body: fd });
      state.libMessage = "上传成功";
      await refreshLibrary();
      render();
    } catch (err) {
      state.libMessage = err.message;
      render();
    }
  });
  return wrap;
}

function renderLibrary() {
  const tabs = el("div", { class: "tabs" }, [
    el("button", { class: state.tab === "poems" ? "active" : "", text: "诗词", onClick: () => { state.tab = "poems"; render(); } }),
    el("button", { class: state.tab === "images" ? "active" : "", text: "图片", onClick: () => { state.tab = "images"; render(); } }),
    el("button", { class: state.tab === "music" ? "active" : "", text: "音乐", onClick: () => { state.tab = "music"; render(); } }),
  ]);

  let body;
  if (state.tab === "poems") {
    const list = el("div", { class: "list" });
    for (const p of state.poems) {
      list.append(
        el("div", { class: "card" }, [
          el("div", {}, [
            el("div", { class: "title", text: `${p.title} · ${p.author}` }),
            el("div", { class: "muted", text: `图：${p.image?.name || "无"}  乐：${p.music?.name || "无"}` }),
          ]),
          el("div", { class: "actions" }, [
            el("button", {
              class: "btn secondary",
              text: "编辑",
              onClick: () => {
                state.editing = { ...p, imageId: p.imageId, musicId: p.musicId };
                render();
              },
            }),
            el("button", {
              class: "btn ghost",
              text: "删除",
              onClick: async () => {
                try {
                  await api(`/api/poems/${p.id}`, { method: "DELETE" });
                  state.libMessage = "诗词已删除";
                  await refreshLibrary();
                  render();
                } catch (err) {
                  state.libMessage = err.message;
                  render();
                }
              },
            }),
          ]),
        ])
      );
    }
    body = el("div", {}, [poemForm(), list]);
  } else if (state.tab === "images") {
    const list = el("div", { class: "list" });
    for (const img of state.images) {
      list.append(
        el("div", { class: "card" }, [
          el("div", {}, [
            el("div", { class: "title", text: img.name }),
            el("img", { src: img.url, alt: img.name }),
          ]),
          el("button", {
            class: "btn ghost",
            text: "删除",
            onClick: async () => {
              try {
                await api(`/api/images/${img.id}`, { method: "DELETE" });
                state.libMessage = "图片已删除";
                await refreshLibrary();
                render();
              } catch (err) {
                state.libMessage = err.message;
                render();
              }
            },
          }),
        ])
      );
    }
    body = el("div", {}, [mediaForm("images"), list]);
  } else {
    const list = el("div", { class: "list" });
    for (const m of state.music) {
      const player = el("audio", { controls: true, src: m.url });
      list.append(
        el("div", { class: "card" }, [
          el("div", {}, [el("div", { class: "title", text: m.name }), player]),
          el("button", {
            class: "btn ghost",
            text: "删除",
            onClick: async () => {
              try {
                await api(`/api/music/${m.id}`, { method: "DELETE" });
                state.libMessage = "音乐已删除";
                await refreshLibrary();
                render();
              } catch (err) {
                state.libMessage = err.message;
                render();
              }
            },
          }),
        ])
      );
    }
    body = el("div", {}, [mediaForm("music"), list]);
  }

  return el("div", { class: "screen library" }, [
    el("div", { class: "panel" }, [
      el("div", { class: "play-top" }, [
        el("h2", { text: "题库管理" }),
        el("button", {
          class: "btn ghost",
          text: "返回首页",
          onClick: () => {
            state.view = "home";
            loadCounts().then(render);
          },
        }),
      ]),
      tabs,
      state.libMessage ? el("p", { class: state.libMessage.includes("失败") || state.libMessage.includes("仍被") ? "error" : "hint", text: state.libMessage }) : null,
      body,
    ]),
  ]);
}

function render() {
  app.replaceChildren();
  if (state.view === "home") app.append(renderHome());
  else if (state.view === "play") {
    app.append(renderPlay());
    applyMedia(currentPoem());
  } else app.append(renderLibrary());
}

loadCounts().then(render);

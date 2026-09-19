'use strict';

const API_BASE = (window.SPICY_API_BASE || 'https://spicy-monopoly.lol').replace(/\/$/, '');

const REDLINES = [
  ['anal','后庭'], ['pain','打'], ['bondage','绑'], ['toys','玩具'], ['public','暴露'],
  ['degrade','羞辱'], ['wet','失禁'], ['foot','足'], ['spit','口水'], ['milk','产乳'],
  ['estim','电'], ['dp','双龙'], ['hypno','催眠'], ['wax','蜡']
];
const NORMAL_TILES = ['start','task','task','task','truth','chance','task','task','mystery','task','jail','task','shop','task','truth','chance','task','mystery','task','shop'];
const DENSE_TILES = ['start','task','task','task','task','chance','task','task','mystery','task','task','jail','task','task','truth','task','task','shop','task','task'];
const TILE_EMOJI = {start:'🏁',task:'🎯',truth:'💬',shop:'🛒',jail:'🔒',chance:'🎴',mystery:'❓'};
const TILE_LABEL = {start:'起点',task:'任务',truth:'真心话',shop:'商店',jail:'监狱',chance:'机会',mystery:'未知'};

const appState = {
  screen: 'setup',
  help: null,
  setup: {
    p1_name:'雁行', p1_sex:'女', p1_role:'受',
    p2_name:'Cove', p2_sex:'男', p2_role:'攻',
    flavor:'medium', game_length:18, identity_mode:'mixed', reverse_chance:0.3,
    redline:[], open_anal:[], no_penetration:[], first_player:'雁行', pair_code:''
  },
  game: null,
  state: null,
  shop: null,
  roll: null,
  notice: '',
  error: '',
  busy: false,
  final: '',
  stopped: false
};

async function request(path, options={}) {
  const res = await fetch(API_BASE + path, {
    ...options,
    headers: {'Content-Type':'application/json', ...(options.headers || {})}
  });
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) {
    const detail = body && typeof body === 'object' && 'detail' in body ? body.detail : (body || `${res.status} ${res.statusText}`);
    throw new Error(String(detail));
  }
  return body;
}

const api = {
  help: () => request('/help'),
  newGame: (setup, rulesAck) => request('/new_game', {method:'POST', body:JSON.stringify({
    lineup: setup.p1_sex === setup.p2_sex ? `${setup.p1_sex}${setup.p2_sex}` : '男女',
    ...setup, setup_confirmed:true, rules_ack:rulesAck, p1_color:'🔵', p2_color:'🔴'
  })}),
  state: id => request(`/state/${encodeURIComponent(id)}`),
  shop: id => request(`/shop/${encodeURIComponent(id)}`),
  roll: (id, body={}) => request(`/roll/${encodeURIComponent(id)}`, {method:'POST', body:JSON.stringify(body)}),
  skip: (id,who) => request(`/skip/${encodeURIComponent(id)}/${encodeURIComponent(who)}`, {method:'POST'}),
  swap: (id,who) => request(`/swap/${encodeURIComponent(id)}/${encodeURIComponent(who)}`, {method:'POST'}),
  rerollIdentity: (id,who) => request(`/reroll_identity/${encodeURIComponent(id)}/${encodeURIComponent(who)}`, {method:'POST'}),
  buyCard: (id,who) => request(`/buy_card/${encodeURIComponent(id)}/${encodeURIComponent(who)}`, {method:'POST'}),
  payToll: (id,who) => request(`/pay_toll/${encodeURIComponent(id)}/${encodeURIComponent(who)}`, {method:'POST'}),
  serveToll: (id,who) => request(`/serve_toll/${encodeURIComponent(id)}/${encodeURIComponent(who)}`, {method:'POST'}),
  buyout: (id,who) => request(`/buyout/${encodeURIComponent(id)}/${encodeURIComponent(who)}`, {method:'POST'}),
  duel: (id,winner) => request(`/duel_result/${encodeURIComponent(id)}/${encodeURIComponent(winner)}`, {method:'POST'}),
  final: id => request(`/final_result/${encodeURIComponent(id)}`)
};

const esc = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
const json = value => esc(JSON.stringify(value ?? {}, null, 2));

function taskText(task) {
  if (!task) return '';
  for (const key of ['内容','content','text','任务']) if (typeof task[key] === 'string') return task[key];
  return Object.entries(task).filter(([,v]) => ['string','number'].includes(typeof v)).map(([k,v]) => `${k}：${v}`).join('\n');
}
function objectText(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return Object.entries(value).map(([k,v]) => `${k}：${typeof v === 'object' ? JSON.stringify(v) : v}`).join('\n');
  return String(value);
}

function setupHTML() {
  const s = appState.setup;
  const redlineHTML = REDLINES.map(([key,label]) => `<button class="chip ${s.redline.includes(key)?'selected':''}" data-action="toggle-redline" data-key="${key}" type="button">${label}</button>`).join('');
  const analHTML = [s.p1_name,s.p2_name].map(name => `<button class="chip ${s.open_anal.includes(name)?'selected':''}" data-action="toggle-list" data-list="open_anal" data-name="${esc(name)}" type="button">${esc(name)}</button>`).join('');
  const topHTML = [s.p1_name,s.p2_name].map(name => `<button class="chip ${s.no_penetration.includes(name)?'selected':''}" data-action="toggle-list" data-list="no_penetration" data-name="${esc(name)}" type="button">${esc(name)}</button>`).join('');
  return `
  <main class="setup-shell">
    <section class="hero glass">
      <div class="eyebrow">SPICY MONOPOLY · WEB V0</div>
      <h1>今晚，开一张真正的棋盘。</h1>
      <p>规则、骰子、任务、金币全部认原项目 API 的真值。这个页面只负责把那套规则变成一张能点、能掷、能玩的桌。</p>
      <div class="server-pill"><span class="dot ${appState.help?'ok':''}"></span>${appState.help ? `规则已同步 · ${esc(appState.help.rules_ack)}` : '正在读取服务器规则…'}</div>
    </section>
    <form id="setupForm" class="setup-grid">
      <section class="glass panel">
        <h2>两位玩家</h2>
        <div class="players-edit">
          ${playerEditor('p1',1)}${playerEditor('p2',2)}
        </div>
      </section>
      <section class="glass panel">
        <h2>这一局怎么玩</h2>
        <label>强度</label>
        <div class="choice-row">${['light','medium','heavy'].map(v=>`<button class="choice ${s.flavor===v?'active':''}" data-set="flavor" data-value="${v}" type="button"><b>${v}</b><small>${v==='light'?'1–3':v==='medium'?'2–5':'3–6'}</small></button>`).join('')}</div>
        <label>局长</label>
        <div class="choice-row three">${[12,18,24].map(v=>`<button class="choice ${s.game_length===v?'active':''}" data-set="game_length" data-value="${v}" type="button">${v} 回合</button>`).join('')}</div>
        <label>身份卡</label>
        <select data-input="identity_mode"><option value="mixed" ${s.identity_mode==='mixed'?'selected':''}>mixed · 全池</option><option value="nsfw_only" ${s.identity_mode==='nsfw_only'?'selected':''}>nsfw_only · NSFW 池</option><option value="off" ${s.identity_mode==='off'?'selected':''}>off · 关闭</option></select>
        <label>反转概率 <span>${Number(s.reverse_chance).toFixed(1)}</span></label>
        <input data-input="reverse_chance" type="range" min="0" max="1" step="0.1" value="${s.reverse_chance}" />
      </section>
      <section class="glass panel wide">
        <h2>边界与开关</h2>
        <p class="muted">后庭默认关闭。只有你主动打开的人，才会写进 open_anal。</p>
        <div class="boundary-grid"><div><h3>红线过滤</h3><div class="chips">${redlineHTML}</div></div><div><h3>后庭开放</h3><div class="chips">${analHTML}</div><h3>纯 top · 不被插入</h3><div class="chips">${topHTML}</div></div></div>
      </section>
      <section class="glass panel wide compact-row">
        <label class="grow">先手<select data-input="first_player"><option value="${esc(s.p1_name)}" ${s.first_player===s.p1_name?'selected':''}>${esc(s.p1_name)}</option><option value="${esc(s.p2_name)}" ${s.first_player===s.p2_name?'selected':''}>${esc(s.p2_name)}</option></select></label>
        <label class="grow">两人暗号 <span class="muted">可选</span><input data-input="pair_code" value="${esc(s.pair_code)}" placeholder="撞名时再填" /></label>
      </section>
      ${appState.error ? `<div class="error-box">${esc(appState.error)}</div>` : ''}
      <button class="start-button" ${appState.busy || !appState.help ? 'disabled':''}>${appState.busy?'正在开桌…':'开局'}</button>
      <p class="safety-note">404 / 停 / 不要：随时停止。任务可免费跳过，也可换题。</p>
    </form>
  </main>`;
}

function playerEditor(prefix, number) {
  const s = appState.setup;
  return `<div class="player-edit"><div class="player-kicker">PLAYER ${number}</div>
    <input data-input="${prefix}_name" value="${esc(s[`${prefix}_name`])}" />
    <div class="segmented">${['男','女'].map(v=>`<button type="button" class="${s[`${prefix}_sex`]===v?'active':''}" data-set="${prefix}_sex" data-value="${v}">${v}</button>`).join('')}</div>
    <div class="segmented">${['攻','受'].map(v=>`<button type="button" class="${s[`${prefix}_role`]===v?'active':''}" data-set="${prefix}_role" data-value="${v}">${v}</button>`).join('')}</div>
  </div>`;
}

function boardHTML() {
  const state = appState.state, s = appState.setup;
  const tiles = s.game_length <= 12 ? DENSE_TILES : NORMAL_TILES;
  const cells = tiles.map((tile,i)=>{
    const angle = (i/20)*360 - 90, radius = 42;
    const x = 50 + radius * Math.cos(angle*Math.PI/180), y = 50 + radius * Math.sin(angle*Math.PI/180);
    const people = Object.entries(state.positions || {}).filter(([,pos])=>pos===i).map(([name])=>name);
    const tokens = people.map((name,idx)=>`<span class="token p${idx+1}" title="${esc(name)}">${esc(name.slice(0,1))}</span>`).join('');
    return `<div class="tile tile-${tile}" style="left:${x}%;top:${y}%" title="${i} · ${TILE_LABEL[tile]}"><span class="tile-index">${i}</span><span>${TILE_EMOJI[tile]}</span>${tokens?`<div class="tokens">${tokens}</div>`:''}</div>`;
  }).join('');
  return `<section class="board-wrap glass"><div class="board">${cells}<div class="board-center"><div class="center-label">CURRENT TURN</div><strong>${esc(state.turn)}</strong><div class="center-stats">回合进行中 · API 真值</div></div></div></section>`;
}

function playerCardHTML(name) {
  const state = appState.state, shop = appState.shop;
  const hand = shop?.hands?.[name] || [];
  const active = state.turn === name;
  return `<article class="player-card glass ${active?'active-player':''}"><div class="player-head"><div><span class="player-dot"></span><strong>${esc(name)}</strong></div><span class="coins">💰 ${state.coins?.[name] ?? 0}</span></div><div class="player-sub">第 ${(state.laps?.[name] ?? 0)+1} 圈 · @ ${state.positions?.[name] ?? 0}</div><div class="hand">${hand.length?hand.map(card=>`<span class="hand-card">${esc(card)}</span>`).join(''):'<span class="muted">手牌为空</span>'}</div></article>`;
}

function eventHTML() {
  const r = appState.roll;
  if (!r) return `<section class="event-card glass idle"><span>骰子还安静地躺在桌上。</span><strong>轮到谁，就由谁掷。</strong></section>`;
  const main = taskText(r.task) || objectText(r.truth) || objectText(r.mystery) || objectText(r.card) || r.say || '';
  return `<section class="event-card glass"><div class="event-top"><span>${esc(r.who)}</span><span class="dice-face">⚄ ${esc(r.dice ?? '—')}</span><span>${esc(r.tile ? (TILE_LABEL[r.tile] || r.tile) : '')}</span></div>${r.settled?`<div class="settled">${esc(r.settled)}</div>`:''}<div class="event-copy">${esc(main)}</div>${r.identity_reminder?`<div class="identity-reminder">${esc(r.identity_reminder)}</div>`:''}${r.hint?`<div class="hint">${esc(r.hint)}</div>`:''}</section>`;
}

function controlsHTML() {
  const r = appState.roll, game = appState.game, s = appState.setup, state = appState.state;
  const active = state.turn || r?.next_turn || s.first_player || s.p1_name;
  const pending = r?.who || active;
  const disabled = appState.busy ? 'disabled' : '';
  if (appState.stopped) return `<section class="controls glass"><div class="stopped-card"><div class="eyebrow">STOPPED</div><h3>本局已停止</h3><p>404 已锁住前端，本页不会再向游戏 API 发送动作请求。</p></div></section>`;
  if (appState.final) return `<section class="controls glass"><div class="final-card"><div class="eyebrow">FINAL</div><strong>${esc(appState.final)}</strong></div></section>`;
  let extras = '';
  if (r?.task) extras += `<div class="action-row"><button ${disabled} data-game-action="skip" data-who="${esc(pending)}">跳过</button><button ${disabled} data-game-action="swap" data-who="${esc(pending)}">换一道 · -1</button></div>`;
  if (r?.action_needed === 'toll') extras += `<div class="action-row"><button ${disabled} data-game-action="pay-toll" data-who="${esc(pending)}">交过路费</button><button ${disabled} data-game-action="serve-toll" data-who="${esc(pending)}">完成差遣抵扣</button></div>`;
  if (r?.action_needed === 'super') extras += `<div class="action-row"><button ${disabled} data-game-action="buyout" data-who="${esc(pending)}">买断超级任务</button></div>`;
  if (r?.action_needed === 'duel') extras += `<div class="duel-box"><span>报告对决赢家</span><div class="action-row"><button ${disabled} data-game-action="duel" data-winner="${esc(s.p1_name)}">${esc(s.p1_name)}</button><button ${disabled} data-game-action="duel" data-winner="${esc(s.p2_name)}">${esc(s.p2_name)}</button></div></div>`;
  if (r?.tile === 'shop') extras += `<button class="secondary-wide" ${disabled} data-game-action="buy-card" data-who="${esc(r.who)}">🛒 随机摸一张功能卡</button>`;
  const rollDisabled = appState.busy || r?.action_needed === 'duel';
  return `<section class="controls glass"><button class="roll-button" ${rollDisabled?'disabled':''} data-game-action="roll">${appState.busy?'处理中…':`🎲 ${esc(active)} 掷骰`}</button>${extras}</section>`;
}

function gameHTML() {
  const g = appState.game, s = appState.setup, state = appState.state;
  if (!state) return `<main class="loading-screen"><div class="glass loading-card">正在铺桌…${appState.error?`<div class="error-box">${esc(appState.error)}</div>`:''}</div></main>`;
  return `<main class="game-shell">
    <header class="game-header"><div><div class="eyebrow">GAME ${esc(g.game_id.slice(0,8))}</div><h1>Spicy Monopoly</h1></div><div class="header-actions"><span class="api-pill">● LIVE</span><button class="ghost stop" data-game-action="stop">404 停止</button><button class="ghost danger" data-game-action="leave">离桌</button></div></header>
    ${(g.intensity_note || g.active_limits)?`<details class="limits glass"><summary>本局生效设置</summary><pre>${esc(g.intensity_note || '')}\n${json(g.active_limits || {})}</pre></details>`:''}
    ${appState.notice?`<div class="notice">${esc(appState.notice)}</div>`:''}${appState.error?`<div class="error-box">${esc(appState.error)}</div>`:''}
    <section class="players-row">${playerCardHTML(s.p1_name)}${playerCardHTML(s.p2_name)}</section>
    <section class="table-layout">${boardHTML()}<div class="right-stack">${eventHTML()}${controlsHTML()}</div></section>
    <details class="raw-board glass"><summary>原始棋盘 · 服务器真值</summary><pre>${esc(state.board)}</pre></details>
    <footer>API: ${esc(API_BASE)} · 原项目 CC BY-NC 4.0 · Web UI V0</footer>
  </main>`;
}

function render() {
  document.getElementById('app').innerHTML = appState.screen === 'setup' ? setupHTML() : gameHTML();
  bindEvents();
}

function normalizeNameLists(oldName, newName) {
  ['open_anal','no_penetration'].forEach(key => {
    appState.setup[key] = appState.setup[key].map(n => n === oldName ? newName : n);
  });
  if (appState.setup.first_player === oldName) appState.setup.first_player = newName;
}

function bindEvents() {
  document.querySelectorAll('[data-input]').forEach(el => {
    const evt = el.type === 'range' ? 'input' : 'change';
    el.addEventListener(evt, e => {
      const key = e.target.dataset.input;
      let value = e.target.value;
      if (key === 'reverse_chance') value = Number(value);
      const old = appState.setup[key];
      appState.setup[key] = value;
      if (key === 'p1_name' || key === 'p2_name') normalizeNameLists(old, value);
      render();
    });
  });
  document.querySelectorAll('[data-set]').forEach(btn => btn.addEventListener('click', () => {
    const key = btn.dataset.set;
    let value = btn.dataset.value;
    if (key === 'game_length') value = Number(value);
    appState.setup[key] = value;
    render();
  }));
  document.querySelectorAll('[data-action="toggle-redline"]').forEach(btn => btn.addEventListener('click', () => {
    const key = btn.dataset.key, arr = appState.setup.redline;
    appState.setup.redline = arr.includes(key) ? arr.filter(x=>x!==key) : [...arr,key];
    render();
  }));
  document.querySelectorAll('[data-action="toggle-list"]').forEach(btn => btn.addEventListener('click', () => {
    const list = btn.dataset.list, name = btn.dataset.name, arr = appState.setup[list];
    appState.setup[list] = arr.includes(name) ? arr.filter(x=>x!==name) : [...arr,name];
    render();
  }));
  const form = document.getElementById('setupForm');
  if (form) form.addEventListener('submit', startGame);
  document.querySelectorAll('[data-game-action]').forEach(btn => btn.addEventListener('click', () => doGameAction(btn.dataset.gameAction, btn.dataset)));
}

async function startGame(e) {
  e.preventDefault();
  if (!appState.help?.rules_ack) return;
  appState.busy = true; appState.error = ''; render();
  try {
    appState.game = await api.newGame(appState.setup, appState.help.rules_ack);
    appState.notice = appState.game.history_note || '';
    appState.screen = 'game';
    await refreshGame();
  } catch (err) {
    appState.error = err.message || String(err);
    try { appState.help = await api.help(); } catch {}
  } finally { appState.busy = false; render(); }
}

async function refreshGame() {
  const id = appState.game.game_id;
  const [state, shop] = await Promise.all([api.state(id), api.shop(id)]);
  appState.state = state; appState.shop = shop;
}

async function doAction(fn, fallback='已处理') {
  appState.busy = true; appState.error = ''; render();
  try {
    const result = await fn();
    appState.notice = result.result || fallback;
    if (result.task && appState.roll) appState.roll.task = result.task;
    await refreshGame();
  } catch(err) { appState.error = err.message || String(err); }
  finally { appState.busy = false; render(); }
}

async function doRoll() {
  appState.busy = true; appState.error = ''; appState.notice = ''; render();
  try {
    appState.roll = await api.roll(appState.game.game_id);
    await refreshGame();
    if (appState.roll.game_over) {
      const result = await api.final(appState.game.game_id);
      appState.final = result.result || '游戏结束';
    }
  } catch(err) { appState.error = err.message || String(err); }
  finally { appState.busy = false; render(); }
}

function doGameAction(action, data) {
  const id = appState.game?.game_id;
  if (action === 'stop') { appState.stopped = true; appState.busy = false; appState.notice = '404 · 已停止'; render(); return; }
  if (appState.stopped) return;
  if (action === 'leave') {
    if (confirm('回到开局页？服务器上的本局不会被删除。')) { appState.screen='setup'; appState.game=null; appState.state=null; appState.shop=null; appState.roll=null; appState.final=''; appState.stopped=false; appState.notice=''; appState.error=''; render(); }
    return;
  }
  if (action === 'roll') return doRoll();
  if (action === 'skip') return doAction(()=>api.skip(id,data.who));
  if (action === 'swap') return doAction(()=>api.swap(id,data.who));
  if (action === 'pay-toll') return doAction(()=>api.payToll(id,data.who));
  if (action === 'serve-toll') return doAction(()=>api.serveToll(id,data.who));
  if (action === 'buyout') return doAction(()=>api.buyout(id,data.who));
  if (action === 'buy-card') return doAction(()=>api.buyCard(id,data.who));
  if (action === 'duel') return doAction(()=>api.duel(id,data.winner), `${data.winner} 赢下对决`);
}

async function boot() {
  render();
  try { appState.help = await api.help(); appState.error=''; }
  catch(err) { appState.error = `连不上游戏服务器：${err.message || err}`; }
  render();
}

boot();
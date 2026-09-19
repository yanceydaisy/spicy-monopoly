# Spicy Monopoly Web V0

给 `RennAkira/spicy-monopoly` 写的零依赖、移动端优先 Web 前端。

## V0 已完成

- 自动从 `GET /help` 获取最新 `rules_ack`，不把规则版本写死。
- 开局页覆盖名字 / 性别 / 攻受 / 强度 / 局长 / 身份池 / 反转概率 / 红线 / 后庭开放 / 纯 top / 先手 / pair_code。
- 真实 20 格棋盘；12 回合使用上游 `SPECIAL_DENSE` 对应的密任务盘。
- 双方棋子位置、金币、圈数、手牌可视化。
- 每次掷骰只调用官方 `/roll/{game_id}`，前端不生成随机数、不自己记账。
- 显示任务、真心话、未知格、功能卡、过路费、对决、身份提醒、lazy settle。
- 支持 `skip`、`swap`、过路费支付/差遣抵扣、超级任务买断、对决赢家、商店摸卡。
- 游戏结束自动读取 `/final_result/{game_id}`。
- 保留“原始棋盘”折叠区，随时核对服务器真值。
- 404 / 离桌只退出前端会话，不会偷偷删除服务器存档。

## 运行

完全零依赖，不需要 npm：

```bash
cd web
python -m http.server 5173
```

然后打开：

```text
http://localhost:5173
```

也可以直接部署到 GitHub Pages / Cloudflare Pages / Render Static Site。

默认 API：`https://spicy-monopoly.lol`

如果要切自建 API，在 `app.js` 加载前设置：

```html
<script>window.SPICY_API_BASE = 'http://127.0.0.1:8069'</script>
```

## 为什么 V0 没有“地盘染色”

上游 `/state/{game_id}` 当前结构化返回只有：`turn / positions / coins / laps`，没有 `owner` 地盘映射；`board_art()` 也只显示格子类型、棋子、金币、手牌和身份，不显示 owner。

所以 V0 不猜地盘归属。要做 V1 地盘染色，最干净的做法是给上游 API 的 `/state` 新增只读字段：

```json
{"owners":{"3":"雁行","7":"Cove"}}
```

这不会改规则，只是把已有引擎状态暴露给前端。

## Attribution

Upstream: `RennAkira/spicy-monopoly`

Upstream license: CC BY-NC 4.0 — 保留署名、非商业使用。
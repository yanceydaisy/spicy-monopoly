# Spicy Monopoly Web V1

给 `RennAkira/spicy-monopoly` 写的零依赖、移动端优先 Web 前端。

## V1 新增

- 骰子滚动、真实骰面、棋子沿实际点数逐格移动。
- 当前行动玩家呼吸高亮、事件卡翻面进入。
- 地盘染色：自建 fork API 直接读取 `owners` 真值；官方实例暂未暴露该字段时，本次会话按真实 lazy-settle 结算记录地盘，不自行猜测。
- fork 的 `GET /state/{game_id}` 新增只读 `owners / turn_count / total_rounds / identities`，不改变游戏规则。
- 可选 Cove Bridge 接入：投递开局、掷骰结果、结算与操作事件。
- Bridge URL / Bearer Token 只保存在浏览器 localStorage，不写入仓库。
- 404 仍然立即锁住前端，之后不再向游戏 API 或 Bridge 发动作。

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

## Cove Bridge

开局页里有独立的 Cove Bridge 配置区。默认 URL：

```text
https://bridge.47.86.44.170.sslip.io
```

如果 Render 上设置了 `BRIDGE_INGEST_TOKEN`，把对应值填进 Bearer Token。它只保存在当前浏览器的 localStorage，不会提交到 GitHub。

点“测试 Bridge”会发送一条测试事件；启用后，开局、掷骰、任务/结算和常用操作会投递到 `/events`。Bridge 只传递发生了什么，游戏真值仍由 Spicy Monopoly API 决定。

## Attribution

Upstream: `RennAkira/spicy-monopoly`

Upstream license: CC BY-NC 4.0 — 保留署名、非商业使用。
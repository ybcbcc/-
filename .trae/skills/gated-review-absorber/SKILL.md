---
name: "gated-review-absorber"
description: "Reads review documents and applies review-driven fixes in gated delivery. Invoke when implementation feedback arrives and accepted findings must update docs and code before the next approval."
---

# Gated Review Absorber

用于闸口式交付流程中的评审吸收与修正阶段。

## 何时使用

在以下情况下使用本 Skill：

- 用户提供了评审文档或复审文档
- 需要判断评审意见是否合理
- 需要根据合理意见更新文档并修改代码
- 每轮修正后仍需停下等待下一次确认

## 目标

读取评审文档，吸收合理意见，完成文档回写和代码修正，并在每轮结束后停下等待用户确认。

## 执行规则

- 评审文档只读，不生成评审文档
- 先判断评审意见是否合理，再决定是否修改
- 合理意见需要同步更新需求文档、技术文档和代码
- 不合理意见需要给出明确理由，不能笼统否定
- 如果评审意见改变了需求口径，先更新需求文档，再更新技术文档，再改代码

## 最低输出要求

每轮至少说明：

- 采纳了哪些评审意见
- 哪些意见未采纳及原因
- 修改了哪些文档
- 修改了哪些代码
- 当前剩余风险或待验证项

## 阶段结束要求

完成后必须：

- 给出本轮相关文档和代码路径
- 说明需求文档和技术文档已如何回写
- 明确声明“本轮评审吸收已完成，等待审核确认”

未获批准前，不得自动进入下一轮修复。

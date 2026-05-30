---
name: "gated-tech-designer"
description: "Writes or updates technical design documents for gated delivery. Invoke when requirements are approved and technical design must be reviewed before implementation."
---

# Gated Tech Designer

用于闸口式交付流程中的技术阶段。

## 何时使用

在以下情况下使用本 Skill：

- 当前阶段是技术阶段
- 需求文档已经确认
- 需要先产出或更新技术文档，再进入代码实现

## 目标

输出一份可审核的技术文档，并在完成后停下等待用户确认。

## 最低要求

技术文档至少应包含：

- 前后端改造点
- 数据模型
- 接口设计
- 关键时序
- 幂等、事务、风控与兼容性方案
- 联调与测试重点

## 执行规则

- 技术文档必须基于已确认的需求文档
- 若技术方案影响需求边界，先回写需求文档，再更新技术文档
- 技术阶段只做方案设计和文档沉淀，不提前进入实现
- 实现后若发现方案与落地不一致，必须回写技术文档

## 阶段结束要求

完成后必须：

- 给出技术文档路径
- 说明本轮新增或修改了什么
- 明确声明“技术阶段已完成，等待审核确认”

未获批准前，不得进入实现阶段。

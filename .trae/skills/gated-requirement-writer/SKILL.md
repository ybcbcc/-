---
name: "gated-requirement-writer"
description: "Writes or updates requirement documents for gated delivery. Invoke when the current approved phase is requirements and work must stop for review before technical design."
---

# Gated Requirement Writer

用于闸口式交付流程中的需求阶段。

## 何时使用

在以下情况下使用本 Skill：

- 当前阶段是需求阶段
- 需要先产出或更新需求文档
- 用户要求需求文档确认后才能进入技术阶段

## 目标

输出一份可审核的需求文档，并在完成后停下等待用户确认。

## 最低要求

需求文档至少应包含：

- 业务背景
- 功能目标
- 页面与交互需求
- 业务规则与边界
- 验收标准
- 风险与待确认项

## 执行规则

- 先理解项目现状和已有实现，再写需求文档
- 若仓库中已有同主题需求文档，优先增量更新，不重复造文档
- 需求阶段只做需求澄清和文档沉淀，不提前进入技术设计或代码实现
- 若后续阶段改变了需求理解，必须回写需求文档

## 阶段结束要求

完成后必须：

- 给出需求文档路径
- 说明本轮新增或修改了什么
- 明确声明“需求阶段已完成，等待审核确认”

未获批准前，不得进入技术阶段。

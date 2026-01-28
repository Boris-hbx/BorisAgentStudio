# /cardtransfer - UI 卡片格式转换

将 UI 卡片设计图转换为 Vue HTML 模板和结构化数据。

## 语法

```
/cardtransfer <图片路径>
```

## 执行步骤

1. **读取图片**：使用 Read 工具读取用户提供的图片文件

2. **分析图片**：基于 SKILL-010-card-transfer.json 中的规范，分析图片中的 UI 元素：
   - 识别布局结构（flex/grid）
   - 识别所有可见元素（文本、图片、按钮、图标等）
   - 识别元素层级和嵌套关系
   - 识别颜色、字体大小、间距等样式

3. **提取数据**：将动态内容提取为结构化 JSON 数据
   - 只提取可能变化的动态数据
   - 静态文本直接硬编码在 HTML 中
   - 数组元素必须封装为对象

4. **生成 HTML**：生成符合规范的 Vue HTML 模板
   - 所有样式内联
   - 遵循标签约束
   - 正确的数据绑定路径

5. **保存结果**：将结果保存到 `data/harmony-outputs/` 目录
   - `{filename}.json` - 完整结果（data + html）
   - `{filename}.html` - 格式化的 HTML 模板

6. **输出结果**：在对话中展示 JSON 格式 `{data, html}`

## 核心约束（必须遵守）

### 标签约束
- 只允许：`div, span, button, img, input, textarea, select`
- 自定义组件：`toggle-custom, symbolGlyph-custom, divider-custom, progress-custom, stack-custom`
- 文本必须用 `<span>` 包裹
- `div` 内禁止直接文本
- 仅 `div` 可嵌套子元素

### 样式约束
- 所有 CSS 必须内联在 `style` 属性中
- 颜色必须用 16 进制（如 `#FFFFFF`），禁止颜色名称
- 禁止：`z-index`, `position: absolute`, `flex-grow`, `flex-basis`, `-webkit-` 前缀

### 布局约束
- 所有 `div` 必须显式设置 `display: flex` 或 `display: grid`
- 必须同时设置 `flex-direction`, `justify-content`, `align-items`
- 宫格布局必须用 `grid`
- 撑满整行设置 `width: 100%`

### 数据约束
- 数据路径以 `data.` 开头
- 数组元素必须是对象，如 `[{name: "a"}, {name: "b"}]`
- 禁止扁平数组如 `["a", "b"]`

### 卡片约束
- 最外层 `div` 设置 `border-radius: 20px; overflow: hidden;`
- 宽度用百分比或 px
- 高度用 px 或 auto

## 输出格式

```json
{
  "data": {
    "title": "示例标题",
    "items": [
      { "name": "项目1", "value": 100 },
      { "name": "项目2", "value": 200 }
    ]
  },
  "html": "<div style=\"display:flex;flex-direction:column;width:100%;border-radius:20px;overflow:hidden;\">...</div>"
}
```

## 自定义组件用法

### 图标
```html
<symbolGlyph-custom value="播放" style="width:25px;height:25px;color:#999999"></symbolGlyph-custom>
```

### 分割线
```html
<divider-custom type="horizontal" strokeWidth=2 style="color:#EEEEEE;width:100%;"></divider-custom>
```

### 进度条
```html
<progress-custom value=20 total=100 type="line" strokeWidth=2 style="width:100%;"></progress-custom>
```

### 堆叠容器（图片上叠加文字）
```html
<stack-custom style="stack-alignment:center;width:200px;height:200px;">
  <img src="mock_image.jpg" style="width:100%;height:100%;">
  <span style="color:#FFFFFF;">叠加文字</span>
</stack-custom>
```

## 示例

```
/cardtransfer C:\Project\boris-workspace\BorisAgentStudio\data\harmonydata\card data\inputdata\华为音乐.png
```

## 参考

- 技能规范：`skills/harmony/SKILL-010-card-transfer.json`
- 完整 Prompt：`data/harmonydata/提示词/prompt.txt`
- 样例数据：`data/harmonydata/card data/output/`

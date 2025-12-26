# 控制台一键测试 - 场景应用提示词

## 🚀 最简单的方法（推荐）

### 方法1：直接复制提示词

打开控制台，直接复制粘贴这个提示词：

```javascript
"A cybersecurity firm needs to explain a complex threat scenario, create a professional video with high-quality visuals and smooth transitions"
```

### 方法2：测试编码（一行代码）

```javascript
(function(){const p="A cybersecurity firm needs to explain a complex threat scenario, create a professional video with high-quality visuals and smooth transitions";console.log('提示词:',p);console.log('URL编码:',encodeURIComponent(p));console.log('JSON编码:',JSON.stringify(p));})();
```

### 方法3：完整测试（复制整个代码块）

```javascript
// 场景应用提示词
const prompt = "A cybersecurity firm needs to explain a complex threat scenario, create a professional video with high-quality visuals and smooth transitions";

// 测试编码
console.log('原始:', prompt);
console.log('URL编码:', encodeURIComponent(prompt));
console.log('JSON编码:', JSON.stringify(prompt));
console.log('长度:', prompt.length);

// 检查特殊字符
const hasSpecial = prompt.match(/[^\x00-\x7F]/g);
console.log('特殊字符:', hasSpecial ? hasSpecial : '无');

// 返回提示词
prompt;
```

## 📋 其他场景提示词

### 教育场景
```javascript
"An educational video explaining the solar system with animated planets orbiting the sun, clear labels, and smooth transitions"
```

### 营销场景
```javascript
"A promotional video for a fitness app showing people exercising in various locations, energetic music, dynamic editing"
```

### 社交媒体场景
```javascript
"A short-form vertical video perfect for TikTok showing a quick recipe tutorial with fast-paced editing"
```

### 技术场景
```javascript
"A tech product demo video showcasing features with clean UI animations, modern design, and professional presentation"
```

## 🔍 检查当前页面的提示词

```javascript
const p = new URLSearchParams(window.location.search).get('prompt'); if(p){console.log('原始:',p);console.log('URL编码:',encodeURIComponent(p));console.log('特殊字符:',p.match(/[^\x00-\x7F]/g)?'是':'否');}else{console.log('URL中没有prompt参数');}
```

## 💡 使用建议

1. **最简单**：直接复制场景提示词到视频生成页面的输入框
2. **测试编码**：使用方法2或方法3的代码检查编码是否正确
3. **检查乱码**：使用方法3检查是否有特殊字符导致问题


# 本地开发和测试指南

本文档介绍如何在不发布到 npm 的情况下，在其他项目中引用和测试 `maim-message-ts` 库。

## 方法一：npm link（推荐）

`npm link` 允许你创建一个全局符号链接，其他项目可以链接到这个包。

### 步骤

#### 1. 在 maim-message-ts 项目中创建链接

```bash
cd /path/to/maim-message-ts

# 编译项目
pnpm build

# 创建全局链接
npm link
# 或者使用 pnpm
pnpm link --global
```

#### 2. 在你的测试项目中使用链接

```bash
cd /path/to/your-test-project

# 链接到 maim-message-ts
npm link @changingself/maim-message-ts
# 或者使用 pnpm
pnpm link --global @changingself/maim-message-ts
```

#### 3. 在测试项目中使用

```typescript
import { MessageServer, MessageClient, Router } from '@changingself/maim-message-ts';

// 使用库...
```

#### 4. 开发时自动重新编译

如果修改了 maim-message-ts 的代码，需要重新编译：

```bash
cd /path/to/maim-message-ts
pnpm build
```

建议使用 watch 模式自动编译：

```bash
cd /path/to/maim-message-ts
pnpm build -- --watch
```

#### 5. 取消链接

测试完成后，可以取消链接：

```bash
# 在测试项目中
cd /path/to/your-test-project
npm unlink @changingself/maim-message-ts

# 在 maim-message-ts 项目中
cd /path/to/maim-message-ts
npm unlink
```

## 方法二：本地路径引用

直接在 `package.json` 中使用本地路径。

### 步骤

#### 1. 编译 maim-message-ts

```bash
cd /path/to/maim-message-ts
pnpm build
```

#### 2. 在测试项目的 package.json 中添加依赖

```json
{
  "dependencies": {
    "@changingself/maim-message-ts": "file:../maim-message-ts"
  }
}
```

路径可以是相对路径或绝对路径：

- 相对路径：`file:../maim-message-ts`
- 绝对路径：`file:/absolute/path/to/maim-message-ts`

#### 3. 安装依赖

```bash
cd /path/to/your-test-project
npm install
# 或者
pnpm install
```

#### 4. 更新代码后

每次修改 maim-message-ts 代码后：

```bash
# 重新编译
cd /path/to/maim-message-ts
pnpm build

# 重新安装（如果需要）
cd /path/to/your-test-project
npm install
```

## 方法三：使用 pnpm workspace（多包项目）

如果你有多个相关包，推荐使用 pnpm workspace。

### 步骤

#### 1. 创建 workspace 结构

```
my-workspace/
├── pnpm-workspace.yaml
├── maim-message-ts/
│   ├── package.json
│   └── src/
└── my-test-project/
    ├── package.json
    └── src/
```

#### 2. 创建 pnpm-workspace.yaml

```yaml
packages:
  - 'maim-message-ts'
  - 'my-test-project'
```

#### 3. 在测试项目的 package.json 中引用

```json
{
  "dependencies": {
    "@changingself/maim-message-ts": "workspace:*"
  }
}
```

#### 4. 安装依赖

```bash
cd my-workspace
pnpm install
```

## 方法四：打包并本地安装

创建 tarball 并在本地安装。

### 步骤

#### 1. 打包 maim-message-ts

```bash
cd /path/to/maim-message-ts
pnpm build
pnpm pack
```

这会生成一个 `.tgz` 文件，例如 `changingself-maim-message-ts-0.1.0.tgz`

#### 2. 在测试项目中安装

```bash
cd /path/to/your-test-project
npm install /path/to/maim-message-ts/changingself-maim-message-ts-0.1.0.tgz
```

## 开发建议

### 推荐工作流

1. **初次设置**：使用 `npm link` 建立链接
2. **开发期间**：
   - 在 maim-message-ts 中运行 `pnpm build --watch`
   - 修改代码后自动编译
   - 测试项目自动使用最新版本
3. **测试**：在测试项目中正常运行和测试
4. **发布前**：取消链接，使用 `pnpm pack` 创建 tarball 进行最终测试

### 常见问题

#### Q: 修改代码后测试项目没有更新？

A:

- 确保运行了 `pnpm build`
- 如果使用 npm link，检查链接是否正确：`npm ls -g --link`
- 尝试重启 TypeScript 服务器（VS Code 中按 Ctrl+Shift+P，选择 "TypeScript: Restart TS Server"）

#### Q: TypeScript 类型提示不工作？

A:

- 确保编译后生成了 `.d.ts` 文件
- 检查 `tsconfig.json` 中的 `declaration: true`
- 重启 IDE 或 TypeScript 服务器

#### Q: npm link 后找不到模块？

A:

- 检查 `package.json` 中的 `name` 字段
- 使用正确的包名：`@changingself/maim-message-ts`
- 确保在两个项目中都执行了正确的命令

## 测试项目示例

创建一个简单的测试项目：

```bash
mkdir test-maim-message
cd test-maim-message
npm init -y
npm install typescript ts-node @types/node --save-dev
```

创建 `test.ts`：

```typescript
import { MessageServer, MessageClient } from '@changingself/maim-message-ts';

async function test() {
  console.log('测试 maim-message-ts');

  const server = new MessageServer('localhost', 18000);
  server.registerMessageHandler(async data => {
    console.log('收到消息:', data);
  });

  await server.run();
}

test();
```

运行测试：

```bash
npx ts-node test.ts
```

## 持续集成注意事项

如果在 CI 环境中使用本地引用：

1. 使用 `pnpm pack` 生成 tarball
2. 将 tarball 作为构建产物
3. 在其他项目中通过 HTTP URL 或文件路径安装

## 总结

| 方法      | 优点           | 缺点         | 适用场景   |
| --------- | -------------- | ------------ | ---------- |
| npm link  | 方便，实时更新 | 需要全局链接 | 日常开发   |
| 本地路径  | 简单直接       | 需要手动更新 | 简单测试   |
| workspace | 统一管理       | 需要特定结构 | 多包项目   |
| tarball   | 接近真实发布   | 每次更新繁琐 | 发布前测试 |

**推荐使用 npm link 进行日常开发和测试。**

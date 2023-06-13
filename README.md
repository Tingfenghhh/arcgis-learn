# Vue 3 + TypeScript + Vite

1. `vue3+pinia+ts+vite+vue-router+arco+vue-tsx`基础项目

# git具有提交规范

1. `feat`：提交新功能
2. `fix`：修复了bug
3. `docs`：只修改了文档
4. `style`：调整代码格式，未修改代码逻辑（比如修改空格、格式化、缺少分号等）
5. `refactor`：代码重构，既没修复bug也没有添加新功能
6. `perf`：性能优化，提高性能的代码更改
7. `test`：添加或修改代码测试
8. `chore`：对构建流程或辅助工具和依赖库（如文档生成等）的更改

## Recommended IDE Setup  安装插件

- [VS Code](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## 在TS中键入对.vue导入的支持

TypeScript默认情况下无法处理“.vue”导入的类型信息，因此我们将“tsc”CLI替换为“vue-tsc”进行类型检查。在编辑器中，我们需要[TypeScript Vue插件(Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript)vue插件，以使typescript语言服务知道`.vue`类型。


如果你觉得独立的TypeScript插件不够快，Volar还实现了[接管模式](https://github.com/johnsoncodehk/volar/discussions/471#discussioncomment-1361669)更具性能。您可以通过以下步骤启用它：


1.禁用内置的TypeScript扩展

1.从VSCode的命令调色板运行“扩展：显示内置扩展”

2.找到“TypeScript和JavaScript语言功能”，右键单击并选择“禁用（工作区）”`

2.通过从命令调色板运行“Developer:重新加载窗口”来重新加载VSCode窗口。
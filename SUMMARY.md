# Action

Action 是把数据（有可能是服务器响应，用户输入或其它非 view 的数据 ）从应用传到 store 的有效载荷。
它是 store 数据的唯一来源。一般来说你会通过 `store.dispatch()` 将 action 传到 store。

Action 本质上是 JavaScript 普通对象。
我们约定，action 内使用一个字符串类型的 type 字段来表示将要执行的动作。
多数情况下，type 会被定义成字符串常量。
当应用规模越来越大时，建议使用单独的模块或文件来存放 action。

除了 type 字段外，action 对象的结构完全由你自己决定。

我们应该尽量减少在 action 中传递的数据。

# Action 创建函数

Action 创建函数 就是生成 action 的方法。

Redux 中的 action 创建函数仅仅返回一个 action 对象。

    function addTodo(text) {
        return {
            type: ADD_TODO,
            text
        };
    }
    
只需把 action 创建函数 的结果传给 `dispatch()` 方法即可实例化 dispatch。

    dispatch(addTodo(text));
    dispatch(completeTodo(index));
    
或者创建一个 被绑定的 action 创建函数 来自动 dispatch：

    const boundAddTodo = (text) => dispatch(addTodo(text));
    const boundCompleteTodo = (index) => dispatch(CompleteTodo(index));
    
然后直接调用它们：

    boundAddTodo(text);
    boundCompleteTodo(index);
    
store 里能直接通过 `store.dispatch()` 调用 `dispatch()` 方法，
但是多数情况下你会使用 react-redux 提供的 `connect()` 帮助器来调用。
`bindActionCreators()` 可以自动把多个 action 创建函数 绑定到 `dispatch()` 方法上。

# Reducer

Action 只是描述了有事情发生了这一事实，并没有指明应用如何更新 state。而这正是 reducer 要做的事情。

## 设计 State 结构

> 在 Redux 应用中，所有的 state 都被保存在一个单一对象中。
> 建议在写代码前先想一下这个对象的结构。如何才能以最简的形式把应用的 state 用对象描述出来？
> 处理 Reducer 关系时的注意事项
> 开发复杂的应用时，不可避免会有一些数据相互引用。建议你尽可能地把 state 范式化，不存在嵌套。
> 把所有数据放到一个对象里，每个数据以 ID 为主键，不同数据相互引用时通过 ID 来查找。
> 把应用的 state 想像成数据库。这种方法在 normalizr 文档里有详细阐述。
> 例如，实际开发中，在 state 里同时存放 todosById: { id -> todo } 和 todos: array<id> >是比较好的方式。

## Action 处理

现在我们已经确定了 state 对象的结构，就可以开始开发 reducer。
reducer 就是一个函数，接收旧的 state 和 action，返回新的 state。

    (previousState, action) => newState

之所以称作 reducer 是因为它将被传递给 Array.prototype.reduce(reducer, ?initialValue) 方法。
保持 reducer 纯净非常重要。

永远不要在 reducer 里做这些操作：

1. 修改传入参数；
2. 执行有副作用的操作，如 API 请求和路由跳转；
3. 调用非纯函数，如 Date.now() 或 Math.random()。

要谨记 reducer 一定要保持纯净。
只要传入参数一样，返回必须一样。
没有特殊情况、没有副作用，没有 API 请求、没有修改参数，单纯执行计算。

Redux 首次执行时，state 为 undefined，这时候会返回默认 state。

    import { VisibilityFilters } from './actions';

    const initialState = {
        visibilityFilter: VisibilityFilters.SHOW_ALL,
        todos: []
    };

    function todoApp(state, action) {
        if (typeof state === 'undefined') {
            return initialState;
        }

        // 这里暂不处理任何 action，
        // 仅返回传入的 state。
        return state;
    }

这里一个技巧是使用 ES6 参数默认值语法 来精简代码。

    function todoApp(state = initialState, action) {
        // 这里暂不处理任何 action，
        // 仅返回传入的 state。
        return state;
    }
    
现在可以处理 SET_VISIBILITY_FILTER。需要做的只是改变 state 中的 visibilityFilter。

    function todoApp(state = initialState, action) {
        switch (action.type) {
            case SET_VISIBILITY_FILTER:
                return Object.assign({}, state, {
                    visibilityFilter: action.filter
                });
            default:
                return state;
        }
    }

注意:

1. 不要修改 state。 使用 Object.assign() 新建了一个副本。
   不能这样使用 Object.assign(state, { visibilityFilter: action.filter })，
   因为它会改变第一个参数的值。
   你必须把第一个参数设置为空对象。也可以使用 ES7 中还在试验阶段的特性 { ...state, ...newState }

2. 在 default 情况下返回旧的 state。遇到未知的 action 时，一定要返回旧的 state。

## 处理多个 action

    function todoApp(state = initialState, action) {
        switch (action.type) {
            case SET_VISIBILITY_FILTER:
                return Object.assign({}, state, {
                    visibilityFilter: action.filter
                });
            case ADD_TODO:
                return Object.assign({}, state, {
                    todos: [...state.todos, {
                            text: action.text,
                            completed: false
                        }
                    ]
                });
            default:
                return state;
        }
    }

如上，不直接修改 state 中的字段，而是返回新对象。
新的 todos 对象就相当于旧的 todos 在末尾加上新建的 todo。
而这个新的 todo 又是基于 action 中的数据创建的。

最后，COMPLETE_TODO 的实现也很好理解：

    case COMPLETE_TODO:
        return Object.assign({}, state, {
            todos: [
                ...state.todos.slice(0, action.index),
                Object.assign({}, state.todos[action.index], {
                    completed: true
                }),
                ...state.todos.slice(action.index + 1)
            ]
        }
    );
因为我们不能直接修改却要更新数组中指定的一项数据，这里需要先把前面和后面都切开。
如果经常需要这类的操作，可以选择使用帮助类 React.addons.update，updeep，
或者使用原生支持深度更新的库 Immutable。

最后，时刻谨记永远不要在克隆 state 前修改它。

# 拆分 Reducer

    function todoApp(state = initialState, action) {
        switch (action.type) {
            case SET_VISIBILITY_FILTER:
            return Object.assign({}, state, {
                visibilityFilter: action.filter
            });
            
            case ADD_TODO:
            return Object.assign({}, state, {
                todos: [...state.todos, {
                text: action.text,
                completed: false
                }]
            });
            
            case COMPLETE_TODO:
            return Object.assign({}, state, {
                todos: [
                ...state.todos.slice(0, action.index),
                Object.assign({}, state.todos[action.index], {
                    completed: true
                }),
                ...state.todos.slice(action.index + 1)
                ]
            });
            
            default:
            return state;
        }
    }
    
上面代码能否变得更通俗易懂？
这里的 todos 和 visibilityFilter 的更新看起来是相互独立的。
有时 state 中的字段是相互依赖的，需要认真考虑，
但在这个案例中我们可以把 todos 更新的业务逻辑拆分到一个单独的函数里：

    function todos(state = [], action) {
        switch (action.type) {
            case ADD_TODO:
                return [...state, {
                    text: action.text,
                    completed: false
                }];
            case COMPLETE_TODO:
                return [
                    ...state.slice(0, action.index),
                    Object.assign({}, state[action.index], {
                    completed: true
                    }),
                    ...state.slice(action.index + 1)
                ];
            default:
                return state;
        }
    }

    function todoApp(state = initialState, action) {
        switch (action.type) {
            case SET_VISIBILITY_FILTER:
                return Object.assign({}, state, {
                    visibilityFilter: action.filter
                });
                
            case ADD_TODO:
            case COMPLETE_TODO:
                return Object.assign({}, state, {
                    todos: todos(state.todos, action)
                });
                
            default:
                return state;
        }
    }
    
注意 todos 依旧接收 state，但它变成了一个数组！
现在 todoApp 只把需要更新的一部分 state 传给 todos 函数，todos 函数自己确定如何更新这部分数据。
这就是所谓的 reducer 合成，它是开发 Redux 应用最基础的模式。

下面深入探讨一下如何做 reducer 合成。能否抽出一个 reducer 来专门管理 visibilityFilter？当然可以：

    function visibilityFilter(state = SHOW_ALL, action) {
        switch (action.type) {
            case SET_VISIBILITY_FILTER:
                return action.filter;
            
            default:
                return state;
        }
    }
    
现在我们可以开发一个函数来做为主 reducer，它调用多个子 reducer 分别处理 state 中的一部分数据，
然后再把这些数据合成一个大的单一对象。
主 reducer 并不需要设置初始化时完整的 state。
初始时，如果给子 reducer 传入 undefined 只要返回它们的默认值即可。

    function todos(state = [], action) {
        switch (action.type) {
            case ADD_TODO:
                return [...state, {
                    text: action.text,
                    completed: false
                }];
            case COMPLETE_TODO:
                return [
                    ...state.slice(0, action.index),
                    Object.assign({}, state[action.index], {
                    completed: true
                    }),
                    ...state.slice(action.index + 1)
            ];
            default:
                return state;
        }
    }

    function visibilityFilter(state = SHOW_ALL, action) {
        switch (action.type) {
            case SET_VISIBILITY_FILTER:
                return action.filter;
            default:
                return state;
        }
    }

    function todoApp(state = {}, action) {
        return {
            visibilityFilter: visibilityFilter(state.visibilityFilter, action),
            todos: todos(state.todos, action)
        };
    }
    
注意每个 reducer 只负责管理全局 state 中它负责的一部分。
每个 reducer 的 state 参数都不同，分别对应它管理的那部分 state 数据。

Redux 提供了 combineReducers() 工具类来做上面 todoApp 做的事情，这样就能消灭一些样板代码了。有了它，可以这样重构 todoApp：

    import { combineReducers } from 'redux';

    const todoApp = combineReducers({
        visibilityFilter,
        todos
    });

    export default todoApp;
    
注意上面的写法和下面完全等价：

    export default function todoApp(state = {}, action) {
        return {
            visibilityFilter: visibilityFilter(state.visibilityFilter, action),
            todos: todos(state.todos, action)
        };
    }
    
你也可以给它们设置不同的 key，或者调用不同的函数。下面两种合成 reducer 方法完全等价：

    const reducer = combineReducers({
        a: doSomethingWithA,
        b: processB,
        c: c
    });
    
    function reducer(state = {}, action) {
        return {
            a: doSomethingWithA(state.a, action),
            b: processB(state.b, action),
            c: c(state.c, action)
        };
    }
    
combineReducers() 所做的只是生成一个函数，这个函数来调用你的一系列 reducer，
每个 reducer 根据它们的 key 来筛选出 state 中的一部分数据并处理，
然后这个生成的函数所所有 reducer 的结果合并成一个大的对象。没有任何魔法。

# Store

Store 就是把它们联系到一起的对象。Store 有以下职责：

1. 维持应用的 state；
2. 提供 getState() 方法获取 state；
3. 提供 dispatch(action) 方法更新 state；
4. 通过 subscribe(listener) 注册监听器。
5. 再次强调一下 Redux 应用只有一个单一的 store。当需要拆分处理数据的逻辑时，使用 reducer 组合 而不是创建多个 store。

根据已有的 reducer 来创建 store 是非常容易的。
在前一个章节中，我们使用 combineReducers() 将多个 reducer 合并成为一个。
现在我们将其导入，并传递 createStore()。

    import { createStore } from 'redux'
    import todoApp from './reducers'
    let store = createStore(todoApp)
    
createStore() 的第二个参数可以设置初始状态。 
这对开发同构应用时非常有用，可以用于把服务器端生成的 state 转变后在浏览器端传给应用。

    let store = createStore(todoApp, window.STATE_FROM_SERVER);
    

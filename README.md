[原文地址](https://github.com/happypoulp/redux-tutorial)

转载请注明出处

# 00 简介

为什么写这个教程？

在我学习Redux时，发现自己通过阅读flux思想的文章和个人经验，积累了不正确的知识。
这不是说那些文章写得不好，但是我确实没有正确的领会。最后我只能翻阅不同的flux框架
（Reflux, Flummox, FB Flux）的官方文档，尝试使文档中actions / actions creators, 
store, dispatcher等等这些概念和思想与我阅读过的那些文章中提及到的相“匹配”。

当我开始使用Redux时，我才意识到flux比我想象中的简单许多。这得益于Redux良好的设计和
它移除了大量其他flux框架中anti-boilerplate（反样板？）的特性。现在我认为相比于其他
框架，学习Redux是一个更好地学习flux思想的方式。

你可能看过这张广为人知的代表着flux应用中单向数据流的图：

                 _________               ____________               ___________
                |         |             |            |             |           |
                | Action  |------------▶| Dispatcher |------------▶| callbacks |
                |_________|             |____________|             |___________|
                     ▲                                                   |
                     |                                                   |
                     |                                                   |
 _________       ____|_____                                          ____▼____
|         |◀----|  Action  |                                        |         |
| Web API |     | Creators |                                        |  Store  |
|_________|----▶|__________|                                        |_________|
                     ▲                                                   |
                     |                                                   |
                 ____|________           ____________                ____▼____
                |   User       |         |   React   |              | Change  |
                | interactions |◀--------|   Views   |◀-------------| events  |
                |______________|         |___________|              |_________|
                

在这份教程中，会逐步介绍上面这份图表的每一个概念。我会把每一个部分单独拿出来，去分析为什么
这部分会存在以及它在整个流程中扮演者什么角色。当我们理解了其中的每一部分后，会赶脚这张表
“说的很有道理的样子”。

在开始之前，我们来讨论一下为什么flux会存在，为什么我们需要flux...

我们假设自己正在构建一个Web应用。这个应用由哪些部分组成呢？

1. 模板/html  --->  View
2. 填充视图的数据  --->  Models
3. 检索数据的逻辑，把所有视图联系在一起，响应用户操作（事件处理），数据修改等  --->  Controller

这是非常经典的MVC思想。但是实际上看起来和flux的概念也很相似。
只是表达方式略有不同：

1. Views像React views（或者Vue等）
2. Models看上去像stores
3. 事件处理，数据修改等像"action creators" -> action -> dispatcher -> callback

所以flux仅仅是一些新的词汇？这么说也不准确。但是这些新的词汇确实是重要的，因为我们可以通过
把这些词汇聚到一起，可以表达的更准确。例如：（从远程）获取一次数据是一个action，一次点击
事件是一个action，一个输入框的改变也是一个action。我们在之前开发的web应用中已经使用action了，
只是叫法不同。与之前的直接处理Models或者Views不同的是，flux确保所有action先通过一个叫做
dispatcher（调度员）处理，然后流经我们的stores，最终通知stores所有的watchers进行处理。

我们通过一个MVC应用中的用户示例来更清晰的说明MVC和flux的不同：
在一个MVC框架中我们可以轻松实现：

1. 用户点击按钮A
2. 按钮A上的一个点击事件hander 触发 Model A 的改变
3. Model A 的改变 触发 Model B 的改变
4. Model B 的改变 触发 View B 重新渲染

在实现上述功能的代码中去debug会是一件有挑战的事情，因为View可以watch每一个Model，每一个Model
可以watch其他Model，这样一来，最原始的数据可以“到达”很多地方，在源码中也有很多处可能被修改的地方。

上面的例子如果使用flux和单项数据流：

1. 用户点击按钮A
2. 按钮A上的一个handler 触发 一个dispatched action，并在Store A 上做一个改变
3. 因为2中的action会被通知到所有的store，Store B也会得到这个action并作出相应的回应
4. 通过改变了Store A 和 Store B，View B 被通知需要变化并且重新渲染

看明白我们如何避免Store A 和 Store B直接产生联系了吗？每一个store仅可以被一个action修改。
一旦所有的store的改变都依赖于一个action，最终视图再被修改，那么数据就会以相同的方式流动：
action -> store -> view -> action -> store -> view -> action -> ...

# 01 action creators

在简介中我们提到了actions，那么action creators又是什么？action creators和actions有什么联系？

实际上仅需要几行代码就可以阐述这一切！

action creators 其实就是一个函数而已。

    var actionCreator = function() {
        // 创建一个action并返回action
        return {
            type: 'AN_ACTION'
        }
    }
    
就这么简单吗？当然！

有一点需要注意的是action的格式。在flux中，action是一个js对象并包含 `type` 属性是一个惯例。
这个 `type` 允许action的进一步处理。此外，action中我们可以包含任意属性来传递我们想传递的数据。

稍后我们会看到，action creater可以返回一些除了action之外的其他东西，比如函数。这对于异步action
处理来说将会非常有用。

我们可以调用action creator 并得到我们期望得到的action：

    console.log(actionCreator())
    // Output: { type: 'AN_ACTION' }
    
ok，这样action creator就可以工作了。但是仅在控制台log出action似乎也没什么用。。。

我们需要让创建好的action被发送到某个地方，这样对这个action感兴趣的“人”就可以知道发生了什么
并根据action做出相应回应。我们称这个过程为“Dispatching an action（派遣一个动作）”。

> To dispatch an action we need... a dispatch function ("Captain obvious").
> And to let anyone interested know that an action happened, we need a mechanism to register
> "handlers". Such "handlers" to actions in traditional flux application are called stores 

为了dispatch（派遣），我们需要一个dispatch函数。并且为了让那些对action感兴趣的人知道发生了
什么，我们需要一个机制来注册handlers。在传统的flux应用中，这种actions的handlers("handlers" to actions)
被叫做stores。下一章节我们会看到这些stores是如何被调用的。

到目前为止，我们的应用的数据流是这样的：
ActionCreator -> Action

# 02 about-state-and-meet-redux 关于state 初识redux

在我们的应用中，有时候我们将要处理的action不仅仅用来通知发生了什么事情，还会告诉我们哪些数据需要被更新。

这实际上在任何的app中都是一个很大的挑战。

- 在应用的生命周期内，在什么地方保持所有的应用数据？
- 该如何去处理这些数据的修改？
- 如何将这些修改通知到应用的每一个部分？

哦吼，这个时候Redux就该出场了！

[Redux](https://github.com/rackt/redux) is a "predictable state container for JavaScript apps".

让我们回顾上面的问题并用Redux的词汇一一解答。

## 在应用的生命周期内，在什么地方保持所有的应用数据？

我们可以把数据放在任意自己想放置的地方（JS对象，数组，Immutable结构等）。
这些应用的数据叫做state。这是有道理的，因为我们讨论的是所有应用程序的数据会随时间而变化。
这是真正的应用的state。但是你把它移交给Redux(Redux是一个“容器”，还记得吗？)。

## 该如何去处理这些数据的修改？

使用reducers（在传统的flux中被称作stores）。
一个reducer是针对于某个action的subscriber。
一个reducer就是一个函数，它可以接收当前应用的状态和action，返回一个新的修改过的state。（称作reduced）

## 如何将这些修改通知到应用的每一个部分？

Using subscribers to state's modifications.

Redux帮你将这一切联系在一起。
概括地说，Redux给我们提供了：
1. 一个放置应用state的地方
2. 一个派发用来改变应用state的actions的机制，又名reducers
3. 一个描述state更新的机制

Redux的实例叫做store，通过如下方式可以被创建：

    import { createStore } from 'redux'
    var store = createStore()
    
但是运行上述代码会报错：

    Error: Invariant Violation: Expected the reducer to be a function.
    
这是因为createStore需要一个可以reduce应用state的函数作为参数。
让我们再试一次：

    import { createStore } from 'redux'

    var store = createStore(() => {})
    
这样看上去似乎没什么问题了。。。

# 03 reducer

现在我们知道了如何创建一个Redux实例来保存应用所有的state。
接下来我们将关注这些可以让我们改变应用state的reducer函数。

你可能已经注意到了，在简介中的图表中，我们有“Store”的概念，但是并没有Redux期望的“Reducer”。
那么Store和Reducer的区别在哪里呢？

实际上，差别比我们想象的更简单：一个Store会保存数据，而Reducer不会。

也就是说，在传统的flux应用中，stores保存了应用的状态，而在Redux中，每当reducer被调用，
它传递了需要被更新的state。这样的话，Redux中的stores成为了“无状态的stores”，并且被重命名为reducers。

正如之前提到的，想创建一个Redux实例，必须传递一个reducer函数：

    import { createStore } from 'redux'

    var store_0 = createStore(() => {})、
    
以便于当每次action发生时，Redux可以调用这个函数来处理应用的state。

给createStore传递reducer(s) 实际上是 Redux注册01章节提到的action “handlers”(reducers)。

让我们给reducer添加一些log

    var reducer = function (...args) {
        console.log('Reducer was called with args', args)
    }

    var store_1 = createStore(reducer)
    
    // Output: Reducer was called with args [ undefined, { type: '@@redux/INIT' } ]
    
你看到了吗？即使我们没有dispatch任何action，我们的reducer也被调用了。
这是因为在初始化应用的state时，Redux实际上dispatch了一个init action ({ type: '@@redux/INIT' })

当一个reducer被调用时，会被传递两个参数：(state, action)。当应用初始化时，state还没被初始化，
此时值为undefined 是很有逻辑的。

那在我们的应用中，当Redux发送过init action之后，接下来会做什么呢？

请听下回分解~

# 04 get state

我们该如何从Redux实例中检索state呢？

    import { createStore } from 'redux'

    var reducer_0 = function (state, action) {
        console.log('reducer_0 was called with state', state, 'and action', action)
    }

    var store_0 = createStore(reducer_0)
    // Output: reducer_0 was called with state undefined and action { type: '@@redux/INIT' }
    
我们可以通过调用 getState() 获取Redux为我们保存的state，

    console.log('store_0 state after initialization:', store_0.getState())
    // Output: store_0 state after initialization: undefined
    
我们的应用程序的状态初始化后仍未定义吗?当然，因为我们的reducer没有做任何事情。
还记得在“about-state-and-meet-redux”这一章节中，我们是怎样描述reducer的预期行为的吗？

 > "A reducer is just a function that receives the current state of your application, the action,
 >  and returns a new state modified (or reduced as they call it)"
 
我们的reducer目前还没有返回什么东西，所以应用的state依旧是undefined。

如果当传入reducer的state是undefined时，让我们尝试发送一个我们应用的初始状态：

    var reducer_1 = function (state, action) {
        console.log('reducer_1 was called with state', state, 'and action', action)
        if (typeof state === 'undefined') {
            return {}
        }

        return state;
    }

    var store_1 = createStore(reducer_1)
    // Output: reducer_1 was called with state undefined and action { type: '@@redux/INIT' }

    console.log('store_1 state after initialization:', store_1.getState())
    // Output: store_1 state after initialization: {}
    
使用ES6更为干净的写法：

    var reducer_2 = function (state = {}, action) {
        console.log('reducer_2 was called with state', state, 'and action', action)

        return state;
    }

    var store_2 = createStore(reducer_2)
    // Output: reducer_2 was called with state {} and action { type: '@@redux/INIT' }

    console.log('store_2 state after initialization:', store_2.getState())
    // Output: store_2 state after initialization: {}

一旦我们使用了默认参数，在reducer体内我们不会再得到undefined的state。

回想一下：一个reducer仅当响应一个action dispatched时才会被调用。
接下来，让我们伪造一个状态修改来响应type为'SAY_SOMETHING'的action。

    var reducer_3 = function (state = {}, action) {
        console.log('reducer_3 was called with state', state, 'and action', action)

        switch (action.type) {
            case 'SAY_SOMETHING':
                return {
                    ...state,
                    message: action.value
                }
            default:
                return state;
        }
    }

    var store_3 = createStore(reducer_3)
    // Output: reducer_3 was called with state {} and action { type: '@@redux/INIT' }

    console.log('store_3 state after initialization:', store_3.getState())
    // Output: redux state after initialization: {}
    
我们的state并没有变化，因为我们还没有dispatch任何action。
但是最后一个例子中，需要注意以下几点：

1. 我家乡我们的action包含了一个type属性和一个value属性。type属性是flux actions的一个惯例，
   value属性可以是任意值。
   
2. 在reducers中，你会经常看到的模式：使用switch来适当地响应一个接收到的action参数

3. 当使用switch时，千万不要忘记"default: return state"。因为如果你不这么做，
   最终将会得到undefined的state甚至丢失state。
   
4. Note also that this ES7 Object Spread notation suits our example because it's doing a shallow
   copy of { message: action.value } over our state (meaning that first level properties of state
   are completely overwritten - as opposed to gracefully merged - by first level property of
   { message: action.value }). But if we had a more complex / nested data structure, you might choose
   to handle your state's updates very differently:
   - using Immutable.js (https://facebook.github.io/immutable-js/)
   - using Object.assign (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
   - using manual merge
   - or whatever other strategy that suits your needs and the structure of your state since
     Redux is absolutely NOT opinionated on this (remember, Redux is a state container).
     
现在我们即将开始在我们的reducer中处理action。让我们先来聊一聊多样的的reducers并把他们合并在一起。

# 05 combine-reducers

# 06 dispatch-action

# 07 dispatch-async-action-1

# 08 dispatch-async-action-2

# 09 middleware

# 10 state-subscriber

# 11 Provider-and-connect

# 12 final-words

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

接下来我们来领会reducer到底是什么。

    var reducer_0 = function (state = {}, action) {
        console.log('reducer_0 was called with state', state, 'and action', action)

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
    
在我们更进一步之前，让我们看一下当有很多action时，reducer会是什么样子。

    var reducer_1 = function (state = {}, action) {
        console.log('reducer_1 was called with state', state, 'and action', action)

        switch (action.type) {
            case 'SAY_SOMETHING':
                return {
                    ...state,
                    message: action.value
                }
            case 'DO_SOMETHING':
                // ...
            case 'LEARN_SOMETHING':
                // ...
            case 'HEAR_SOMETHING':
                // ...
            case 'GO_SOMEWHERE':
                // ...
            // etc.
            default:
                return state;
        }
    }

很显然一个简单的reducer函数不能“承载”应用的全部的action处理（这么说有点极端，
其实是可以承载的，但是如果这么做了，reducer会变得非常臃肿。）

幸运的是，Redux不在意我们声明了多少个reducer，如果我们有多个reducer时，它还会
帮助我们将这些reducer组合在一起。

让我们来声明2个reducer：

    var userReducer = function (state = {}, action) {
        console.log('userReducer was called with state', state, 'and action', action)

        switch (action.type) {
            // etc.
            default:
                return state;
        }
    }
    var itemsReducer = function (state = [], action) {
        console.log('itemsReducer was called with state', state, 'and action', action)

        switch (action.type) {
            // etc.
            default:
                return state;
        }
    }

要注意一下每个reducer传递的初始state：userReducer传进来的是{}，itemsReducer传进来的是[]。
这仅仅是说明实际上reducer可以处理任意类型的数据结构。具体给reducer传哪种数据结构的数据完全取决于
我们的实际需要。

有了各种各样的reducer后，最终的效果就是一个reducer只处理应用某个部分的state。

但是createStore只接收一个reducer函数。

那我们该怎样将reducer组合在一起？如何告诉React组合后的每一个reducer只负责处理一部分的state？

方法很简单！只需要使用combineReducers函数。
combineReducers takes a hash and
returns a function that, when invoked, will call all our reducers, retrieve the new slice of state and
reunite them in a state object (a simple hash {}) that Redux is holding.

少废话，上代码：


    import { createStore, combineReducers } from 'redux'

    var reducer = combineReducers({
        user: userReducer,
        items: itemsReducer
    })
    
    // Output:
    // userReducer was called with state {} and action { type: '@@redux/INIT' }
    // userReducer was called with state {} and action { type: '@@redux/PROBE_UNKNOWN_ACTION_9.r.k.r.i.c.n.m.i' }
    // itemsReducer was called with state [] and action { type: '@@redux/INIT' }
    // itemsReducer was called with state [] and action { type: '@@redux/PROBE_UNKNOWN_ACTION_4.f.i.z.l.3.7.s.y.v.i' }
    
    var store_0 = createStore(reducer)
    // Output:
    // userReducer was called with state {} and action { type: '@@redux/INIT' }
    // itemsReducer was called with state [] and action { type: '@@redux/INIT' }

// As you can see in the output, each reducer is correctly called with the init action @@redux/INIT.
// But what is this other action? This is a sanity check implemented in combineReducers
// to assure that a reducer will always return a state != 'undefined'.
// Please note also that the first invocation of init actions in combineReducers share the same purpose
// as random actions (to do a sanity check).

console.log('store_0 state after initialization:', store_0.getState())
// Output:
// store_0 state after initialization: { user: {}, items: [] }

// It's interesting to note that Redux handles our slices of state correctly,
// the final state is indeed a simple hash made of the userReducer's slice and the itemsReducer's slice:
// {
//     user: {}, // {} is the slice returned by our userReducer
//     items: [] // [] is the slice returned by our itemsReducer
// }

// Since we initialized the state of each of our reducers with a specific value ({} for userReducer and
// [] for itemsReducer) it's no coincidence that those values are found in the final Redux state.

// By now we have a good idea of how reducers will work. It would be nice to have some
// actions being dispatched and see the impact on our Redux state.

# 06 dispatch-action

目前为止，我们专注于创建reducer(s)，并没有dispatch任何action。
接下来我们在原有例子基础上来增加一点处理action的代码：


    var userReducer = function (state = {}, action) {
        console.log('userReducer was called with state', state, 'and action', action)

        switch (action.type) {
            case 'SET_NAME':
                return {
                    ...state,
                    name: action.name
                }
            default:
                return state;
        }
    }
    var itemsReducer = function (state = [], action) {
        console.log('itemsReducer was called with state', state, 'and action', action)

        switch (action.type) {
            case 'ADD_ITEM':
                return [
                    ...state,
                    action.item
                ]
            default:
                return state;
        }
    }

    import { createStore, combineReducers } from 'redux'

    var reducer = combineReducers({
        user: userReducer,
        items: itemsReducer
    })
    var store_0 = createStore(reducer)


    console.log("\n", '### It starts here')
    console.log('store_0 state after initialization:', store_0.getState())
    // Output:
    // store_0 state after initialization: { user: {}, items: [] }

接下来来dispatch我们的第一个action。回想之前说的：为了dispatch一个action，我们
需要一个dispatch函数。

Redux给我们提供了所需的dispatch函数，并且会把action通知给所有reducers。
我们可以通过React的实例的dispatch属性得到这个dispatch函数。

    store_0.dispatch({
        type: 'AN_ACTION'
    })
    // Output:
    // userReducer was called with state {} and action { type: 'AN_ACTION' }
    // itemsReducer was called with state [] and action { type: 'AN_ACTION' }
    
通过以上代码可以看出，每一个reducer都被调用了，但是没有reducer在意这个action的type。

    console.log('store_0 state after action AN_ACTION:', store_0.getState())
    // Output: store_0 state after action AN_ACTION: { user: {}, items: [] }
    
稍等，难道我们不应该使用一个action creator来发送一个action吗？
我们确实可以使用actionCreator，不过目前在我们的例子中仅仅是返回一个action，
使用actionCreator没不能带来什么更多的好处。
考虑到实际项目的复杂困难程度，我们还是按照flux思想来实践比较好。
让我们使用action creator来发送我们的例子中reducer关心的action。

    var setNameActionCreator = function (name) {
        return {
            type: 'SET_NAME',
            name: name
        }
    }

    store_0.dispatch(setNameActionCreator('bob'))
    
    // Output:
    // userReducer was called with state {} and action { type: 'SET_NAME', name: 'bob' }
    // itemsReducer was called with state [] and action { type: 'SET_NAME', name: 'bob' }

    console.log('store_0 state after action SET_NAME:', store_0.getState())
    // Output:
    // store_0 state after action SET_NAME: { user: { name: 'bob' }, items: [] }
    
    
到此，我们处理了应用的第一个action，并改变了应用的state.

但是，这个例子相对于实际项目来说太简单了。例如，如果在dispatch一个action前想
异步请求数据该怎么办？这就是接下来我们要讨论的问题了。

目前为止的数据流动情况：
ActionCreator -> Action -> dispatcher -> reducer


# 07 dispatch-async-action-1

 我们之前知道了如何dispatch actions以及actions如何通过reducers改变应用的state。
 
 但是我们我们考虑的都是同步的actions，更确切的说，是action creators创建了一个同步的action，
 即每当调用action creator时，会立即返回一个action。
 
 让我们来想象一个简单的异步的情况：
 
 用户点击了一个上面写着“Say hi in 2s”的按钮。当他点击了按钮2s后，我们的视图才会更新。
 
 显然，在React的store中，hi的这条消息是我们应用需要保存的state的一部分。
 但是我们想要的效果是 当action creator被调用2s后再保存这条消息。
 
 按照我们之前的写法会这样去写：
 
    import { createStore, combineReducers } from 'redux'

    var reducer = combineReducers({
        speaker: function (state = {}, action) {
            console.log('speaker was called with state', state, 'and action', action)

            switch (action.type) {
                case 'SAY':
                    return {
                        ...state,
                        message: action.message
                    }
                default:
                    return state;
            }
        }
    })
    var store_0 = createStore(reducer)

    var sayActionCreator = function (message) {
        return {
            type: 'SAY',
            message
        }
    }

    console.log("\n", 'Running our normal action creator:', "\n")

    console.log(new Date());
    store_0.dispatch(sayActionCreator('Hi'))

    console.log(new Date());
    console.log('store_0 state after action SAY:', store_0.getState())
    // Output (skipping initialization output):
    //     Sun Aug 02 2015 01:03:05 GMT+0200 (CEST)
    //     speaker was called with state {} and action { type: 'SAY', message: 'Hi' }
    //     Sun Aug 02 2015 01:03:05 GMT+0200 (CEST)
    //     store_0 state after action SAY: { speaker: { message: 'Hi' } }

我们会看到按照同步的方式去写，store会立即更新。

或许我们会这么写：

    var asyncSayActionCreator_0 = function (message) {
        setTimeout(function () {
            return {
                type: 'SAY',
                message
            }
        }, 2000)
    }

这样的话，action creator返回的会是undefined而不是action。

有这样的一个技巧来解决问题：我们不返回action，而是返回一个函数。

    var asyncSayActionCreator_1 = function (message) {
        return function (dispatch) {
            setTimeout(function () {
                dispatch({
                    type: 'SAY',
                    message
                })
            }, 2000)
        }
    }
    
这样的问题是，返回的依旧不是action。有很大的可能，我们的reducers并不知道要做什么。

让我们来想一个更好地办法来解决这个问题！

# 08 dispatch-async-action-2

如果运行07最后的代码，会得到如下错误：

    // Output:
    //     ...
    //     /Users/classtar/Codes/redux-tutorial/node_modules/redux/node_modules/invariant/invariant.js:51
    //         throw error;
    //               ^
    //     Error: Invariant Violation: Actions must be plain objects. Use custom middleware for async actions.
    //     ...

action creator返回的函数并没有成功的被传给reducer，React很友好的给了我们一个提示：
"Use custom middleware for async actions." 看上去我们已经在通往成功解决问题的
道路上了，但是提示中提及到的middleware是什么鬼呢？

# 09 middleware

通常意义上，在一个应用中，A模块想给B模块传递一些C，在A发送C之后B接收到C之前，
C可能经过D、E、F等的一些处理。这些类似于D、E、F的东西被称为middleware（中间件）。

> A -----> B
> 
> A ---> D(middleware 1) ---> E(middleware 2) ---> (F)middleware 3 --> ... ---> B

那么在Redux的上下文中，middleware是如何帮助我们的呢？像08中提到的，我们异步的action reducer
直接返回一个函数，Redux是不认可的。那如果有一个中间件可以帮我们把返回的函数转化成Redux可以接受的函数，
问题是不是就解决了呢？

> action ---> dispatcher ---> middleware 1 ---> middleware 2 ---> reducers

每当一个action（或者其他什么，比如我们异步的action reducer返回的函数）被dispatch时，
middleware帮助我们的action reducer dispatch 一个“合格的”action（或者middleware什么都不做）。

在Redux中，middleware是这样的一些函数：必须有明确的签名以及遵守一个严格的结构：

    var anyMiddleware = function ({ dispatch, getState }) {
        return function(next) {
            return function (action) {
                // your middleware-specific code goes here
            }
        }
    }
    
正如你看到的，middleware由三个按顺序执行的函数组合而成。

1. 第一层提供了dispatch函数和getState函数

// As you can see above, a middleware is made of 3 nested functions (that will get called sequentially):
// 1) The first level provide the dispatch function and a getState function (if your
//     middleware or your action creator needs to read data from state) to the 2 other levels
// 2) The second level provide the next function that will allow you to explicitly hand over
//     your transformed input to the next middleware or to Redux (so that Redux can finally call all reducers).
// 3) the third level provides the action received from the previous middleware or from your dispatch
//     and can either trigger the next middleware (to let the action continue to flow) or process
//     the action in any appropriate way.

如果熟悉函数式编程的人对以上模式不会陌生。如果不熟悉也没关系，这不会影响我们队react的理解，
我们可以使用curry简化上面的代码：

    // "curry" may come any functional programming library (lodash, ramda, etc.)
    var thunkMiddleware = curry(
        ({dispatch, getState}, next, action) => (
            // your middleware-specific code goes here
        )
    );

我们上面写的这个middleware叫做thunk middleware。其源码在Github可以找到：
[https://github.com/gaearon/redux-thunk](https://github.com/gaearon/redux-thunk)

摘抄过来的一段关于redux-thunk 动机的话：

> Redux Thunk middleware allows you to write action creators that return a function instead of an action. 
> The thunk can be used to delay the dispatch of an action, or to dispatch only if a certain condition is met.
> The inner function receives the store methods dispatch and getState as parameters.

为了告诉Redux我们使用了middleware，我们必须使用Redux为我们提供的applyMiddleware方法。
该方法把所有的middleware作为参数，返回一个以createStore作为参数被调用的函数。
当这个返回的函数被调用后，它会返回一个middleware已经被应用到dispatch方法的高阶store。

下面是一个实例：

    import { createStore, combineReducers, applyMiddleware } from 'redux'

    const finalCreateStore = applyMiddleware(thunkMiddleware)(createStore)
    // 如果使用了很多中间件，要这样写: applyMiddleware(middleware1, middleware2, ...)(createStore)

    var reducer = combineReducers({
        speaker: function (state = {}, action) {
            console.log('speaker was called with state', state, 'and action', action)

            switch (action.type) {
                case 'SAY':
                    return {
                        ...state,
                        message: action.message
                    }
                default:
                    return state
            }
        }
    })

    const store_0 = finalCreateStore(reducer)
    // Output:
    //     speaker was called with state {} and action { type: '@@redux/INIT' }
    //     speaker was called with state {} and action { type: '@@redux/PROBE_UNKNOWN_ACTION_s.b.4.z.a.x.a.j.o.r' }
    //     speaker was called with state {} and action { type: '@@redux/INIT' }

现在我们有了一个中间件已经准备好的store了。让我们再次尝试一下之前的异步的action：

    var asyncSayActionCreator_1 = function (message) {
        return function (dispatch) {
            setTimeout(function () {
                console.log(new Date(), 'Dispatch action now:')
                dispatch({
                    type: 'SAY',
                    message
                })
            }, 2000)
        }
    }

    console.log("\n", new Date(), 'Running our async action creator:', "\n")

    store_0.dispatch(asyncSayActionCreator_1('Hi'))

    // Output:
    //     Mon Aug 03 2015 00:01:20 GMT+0200 (CEST) Running our async action creator:
    //     Mon Aug 03 2015 00:01:22 GMT+0200 (CEST) 'Dispatch action now:'
    //     speaker was called with state {} and action { type: 'SAY', message: 'Hi' }

我们的action在2s后被正确的执行了。

    // Just for your curiosity, here is how a middleware to log all actions that are dispatched, would
    // look like:

    function logMiddleware ({ dispatch, getState }) {
        return function(next) {
            return function (action) {
                console.log('logMiddleware action received:', action)
                return next(action)
            }
        }
    }

    // Same below for a middleware to discard all actions that goes through (not very useful as is
    // but with a bit of more logic it could selectively discard a few actions while passing others
    // to next middleware or Redux):
    
    function discardMiddleware ({ dispatch, getState }) {
        return function(next) {
            return function (action) {
                console.log('discardMiddleware action received:', action)
            }
        }
    }
    
让我们来总结一下：

1. 我们知道了如何写actions和action creators
2. 我们知道了如何dispatch actions
3. 我们知道了如何使用中间件处理一些普通的actions

使用flux思想构建的应用的单向数据流动，还差被通知到state更新后如何响应这一环节了。

那么我们是如何订阅Redux中store更新的呢？

# 10 state-subscriber

我们还缺少至关重要的一环就可以完成Flux的这个“圈”了。

    _________      _________       ___________
    |         |    | Change  |     |   React   |
    |  Store  |----▶ events  |-----▶   Views   |
    |_________|    |_________|     |___________|
    

没有这一环，当store更新时，我们没办法更新views。

幸运的是，我们可以很轻松的watch到Redux的store的变化。

    store.subscribe(function() {
        // retrieve latest store state here
        // Ex:
        console.log(store.getState());
    })
    

我们可以来验证一下：

    import { createStore, combineReducers } from 'redux'

    var itemsReducer = function (state = [], action) {
        console.log('itemsReducer was called with state', state, 'and action', action)

        switch (action.type) {
            case 'ADD_ITEM':
                return [
                    ...state,
                    action.item
                ]
            default:
                return state;
        }
    }

    var reducer = combineReducers({ items: itemsReducer })
    var store_0 = createStore(reducer)

    store_0.subscribe(function() {
        console.log('store_0 has been updated. Latest store state:', store_0.getState());
        // Update your views here
    })

    var addItemActionCreator = function (item) {
        return {
            type: 'ADD_ITEM',
            item: item
        }
    }

    store_0.dispatch(addItemActionCreator({ id: 1234, description: 'anything' }))

    // Output:
    //     ...
    //     store_0 has been updated. Latest store state: { items: [ { id: 1234, description: 'anything' } ] }
    
subscribe回调被正确的调用了，我们的store也包含了新的item。

理论上说，我们到此就可以结束了。我们Flux的“环”已经可以合上了。我们理解了组成
Flux的每一层，并且知道了它并没有那么神秘。

坦白的说，其实关于Flux我们还有很多可以说的，并且还有一些东西有意的放在最后的实例中，以此来保证之前讲解
的Flux的每一层是最简单的：

1. 为什么我们的subscriber不接收state作为参数？
2. 我们没有接收新的state，我们利用了store_0，这种解决方案在实际项目中是不可接受的。
3. 实际上我们该如何更新views呢？
4. 该如何取消state更新的订阅？
5. 更通俗一点说，我们在React这种如何继承Redux？

我们进入了深一层次的话题：在React中如何使用Redux？

明白了最后这个问题对于理解Redux和React没有必然的联系是很有帮助的。
Redux仅仅是一个js的状态容器。

// In that perspective we would be a bit lost if it wasn't for react-redux (https://github.com/rackt/react-redux).
// Previously integrated inside Redux (before 1.0.0), this repository holds all the bindings we need to simplify
// our life when using Redux inside React.

// Back to our "subscribe" case... Why exactly do we have this subscribe function that seems so simple but at
// the same time also seems to not provide enough features?

// Its simplicity is actually its power! Redux, with its current minimalist API (including "subscribe") is
//  highly extensible and this allows developers to build some crazy products like the Redux DevTools
// (https://github.com/gaearon/redux-devtools).

// But in the end we still need a "better" API to subscribe to our store changes. That's exactly what react-redux
// brings us: an API that will allow us to seamlessly fill the gap between the raw Redux subscribing mechanism
// and our developer expectations. In the end, you won't need to use "subscribe" directly. Instead you will
// use bindings such as "provide" or "connect" and those will hide from you the "subscribe" method.

// So yeah, the "subscribe" method will still be used but it will be done through a higher order API that
// handles access to redux state for you.

// We'll now cover those bindings and show how simple it is to wire your components to Redux's state.

# 11 Provider-and-connect

# 12 final-words


# 其他学习资源

[http://redux.js.org/](http://redux.js.org/)

[Redux 中文文档](http://cn.redux.js.org/)

[Redux教程1：环境搭建，初写Redux](https://yq.aliyun.com/articles/2628)



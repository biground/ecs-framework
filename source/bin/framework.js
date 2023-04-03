var es;
(function (es) {
    /**
     *  全局核心类
     */
    class Core {
        constructor(debug = true, enableEntitySystems = true) {
            /**
             * 全局访问系统
             */
            this._globalManagers = [];
            this._coroutineManager = new es.CoroutineManager();
            this._timerManager = new es.TimerManager();
            this._frameCounterElapsedTime = 0;
            this._frameCounter = 0;
            this._totalMemory = 0;
            Core._instance = this;
            Core.emitter = new es.Emitter();
            Core.emitter.addObserver(es.CoreEvents.frameUpdated, this.update, this);
            Core.registerGlobalManager(this._coroutineManager);
            Core.registerGlobalManager(new es.TweenManager());
            Core.registerGlobalManager(this._timerManager);
            Core.entitySystemsEnabled = enableEntitySystems;
            this.debug = debug;
            this.initialize();
        }
        /**
         * 提供对单例/游戏实例的访问
         * @constructor
         */
        static get Instance() {
            return this._instance;
        }
        /**
         * 当前活动的场景。注意，如果设置了该设置，在更新结束之前场景实际上不会改变
         */
        static get scene() {
            if (!this._instance)
                return null;
            return this._instance._scene;
        }
        /**
         * 当前活动的场景。注意，如果设置了该设置，在更新结束之前场景实际上不会改变
         * @param value
         */
        static set scene(value) {
            es.Insist.isNotNull(value, "场景不能为空");
            if (this._instance._scene == null) {
                this._instance._scene = value;
                this._instance.onSceneChanged();
                this._instance._scene.begin();
            }
            else {
                this._instance._nextScene = value;
            }
        }
        /**
         * `Core`类的静态方法，用于创建`Core`的实例。
         * @param debug {boolean} 是否为调试模式，默认为`true`
         * @returns {Core} `Core`的实例
         */
        static create(debug = true) {
            // 如果实例还未被创建，则创建一个新的实例并保存在`_instance`静态属性中
            if (this._instance == null) {
                this._instance = new es.Core(debug);
            }
            // 返回`_instance`静态属性中保存的实例
            return this._instance;
        }
        /**
         * 添加一个全局管理器对象，它的更新方法将调用场景前的每一帧。
         * @param manager
         */
        static registerGlobalManager(manager) {
            this._instance._globalManagers.push(manager);
            manager.enabled = true;
        }
        /**
         * 删除全局管理器对象
         * @param manager
         */
        static unregisterGlobalManager(manager) {
            new es.List(this._instance._globalManagers).remove(manager);
            manager.enabled = false;
        }
        /**
         * 获取指定类型的全局管理器实例
         * @param type 管理器类型的构造函数
         * @returns 指定类型的全局管理器实例，如果找不到则返回 null
         */
        static getGlobalManager(type) {
            for (let i = 0, s = Core._instance._globalManagers.length; i < s; ++i) {
                let manager = Core._instance._globalManagers[i];
                if (manager instanceof type)
                    return manager;
            }
            return null;
        }
        /**
         * 临时运行SceneTransition，允许一个场景平滑过渡到另一个场景，并具有自定义效果
         * @param sceneTransition
         */
        static startSceneTransition(sceneTransition) {
            es.Insist.isNull(this._instance._sceneTransition, "在前一个场景转换完成之前，无法启动新的场景转换");
            this._instance._sceneTransition = sceneTransition;
            return sceneTransition;
        }
        /**
         * 启动一个coroutine。Coroutine可以将number延时几秒或延时到其他startCoroutine.Yielding
         * null将使coroutine在下一帧被执行。
         * @param enumerator
         */
        static startCoroutine(enumerator) {
            return this._instance._coroutineManager.startCoroutine(enumerator);
        }
        /**
         * 调度一个一次性或重复的计时器，该计时器将调用已传递的动作
         * @param timeInSeconds
         * @param repeats
         * @param context
         * @param onTime
         */
        static schedule(timeInSeconds, repeats = false, context = null, onTime) {
            return this._instance._timerManager.schedule(timeInSeconds, repeats, context, onTime);
        }
        startDebugDraw() {
            // 如果debug标志未开启，则直接返回
            if (!this.debug)
                return;
            // 计算帧率和内存使用情况
            this._frameCounter++; // 帧计数器递增
            this._frameCounterElapsedTime += es.Time.deltaTime; // 帧计数器累加时间
            if (this._frameCounterElapsedTime >= 1) { // 如果时间已经超过1秒，则计算帧率和内存使用情况
                let memoryInfo = window.performance["memory"]; // 获取内存使用情况
                if (memoryInfo != null) { // 如果内存使用情况存在
                    // 计算内存使用情况并保留2位小数
                    this._totalMemory = Number((memoryInfo.totalJSHeapSize / 1048576).toFixed(2));
                }
                if (this._titleMemory) { // 如果回调函数存在，则执行回调函数，更新标题栏显示
                    this._titleMemory(this._totalMemory, this._frameCounter);
                }
                this._frameCounter = 0; // 重置帧计数器
                this._frameCounterElapsedTime -= 1; // 减去1秒时间
            }
        }
        /**
         * 在一个场景结束后，下一个场景开始之前调用
         */
        onSceneChanged() {
            Core.emitter.emit(es.CoreEvents.sceneChanged);
            es.Time.sceneChanged();
        }
        initialize() {
        }
        /**
         * `Core` 类的受保护的 `update` 方法，用于更新游戏状态。
         * @param currentTime 当前时间戳，单位为毫秒，默认值为-1。
         */
        update(currentTime = -1) {
            // 如果引擎处于暂停状态，则直接返回，不做任何操作
            if (Core.paused) {
                return;
            }
            // 更新时间戳信息
            es.Time.update(currentTime, currentTime !== -1);
            // 更新全局管理器和当前场景
            if (this._scene != null) {
                // 依次更新所有启用的全局管理器
                for (const globalManager of this._globalManagers) {
                    if (globalManager.enabled) {
                        globalManager.update();
                    }
                }
                // 如果当前没有场景切换正在进行，或者正在进行的场景切换不需要加载新场景
                if (this._sceneTransition == null || !this._sceneTransition._loadsNewScene) {
                    this._scene.update();
                }
            }
            // 处理场景切换
            if (this._nextScene != null) {
                // 结束当前场景
                this._scene.end();
                // 加载并初始化新场景
                this._scene = this._nextScene;
                this._nextScene = null;
                this.onSceneChanged();
                this._scene.begin();
            }
            // 绘制调试信息
            this.startDebugDraw();
            this.draw();
        }
        draw() {
            if (this._sceneTransition != null)
                this._sceneTransition.preRender();
            if (this._sceneTransition != null && !this._sceneTransition.hasPreviousSceneRender) {
                if (this._scene != null) {
                    Core.startCoroutine(this._sceneTransition.onBeginTransition());
                }
                this._sceneTransition.render();
            }
        }
    }
    Core.paused = false;
    /**
     * 是否启用调试渲染
     */
    Core.debugRenderEndabled = false;
    es.Core = Core;
})(es || (es = {}));
var es;
(function (es) {
    let LogType;
    (function (LogType) {
        LogType[LogType["error"] = 0] = "error";
        LogType[LogType["warn"] = 1] = "warn";
        LogType[LogType["log"] = 2] = "log";
        LogType[LogType["info"] = 3] = "info";
        LogType[LogType["trace"] = 4] = "trace";
    })(LogType = es.LogType || (es.LogType = {}));
    class Debug {
        /**
         * 如果条件为true，则在控制台中以警告方式打印消息。
         * @param condition 是否应该打印消息的条件
         * @param format 要打印的消息格式
         * @param args 与消息格式相对应的参数列表
         */
        static warnIf(condition, format, ...args) {
            if (condition)
                this.log(LogType.warn, format, args);
        }
        /**
         * 在控制台中以警告方式打印消息。
         * @param format 要打印的消息格式
         * @param args 与消息格式相对应的参数列表
         */
        static warn(format, ...args) {
            this.log(LogType.warn, format, args);
        }
        /**
         * 在控制台中以错误方式打印消息。
         * @param format 要打印的消息格式
         * @param args 与消息格式相对应的参数列表
         */
        static error(format, ...args) {
            this.log(LogType.error, format, args);
        }
        /**
         * 在控制台中以标准日志方式打印消息。
         * @param type 要打印的日志类型
         * @param format 要打印的消息格式
         * @param args 与消息格式相对应的参数列表
         */
        static log(type, format, ...args) {
            switch (type) {
                case LogType.error:
                    console.error(`${type}: ${es.StringUtils.format(format, args)}`);
                    break;
                case LogType.warn:
                    console.warn(`${type}: ${es.StringUtils.format(format, args)}`);
                    break;
                case LogType.log:
                    console.log(`${type}: ${es.StringUtils.format(format, args)}`);
                    break;
                case LogType.info:
                    console.info(`${type}: ${es.StringUtils.format(format, args)}`);
                    break;
                case LogType.trace:
                    console.trace(`${type}: ${es.StringUtils.format(format, args)}`);
                    break;
                default:
                    throw new Error('argument out of range');
            }
        }
    }
    es.Debug = Debug;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 我们在这里存储了各种系统的默认颜色，如对撞机调试渲染、Debug.drawText等。
     * 命名方式尽可能采用CLASS-THING，以明确它的使用位置
     */
    class DebugDefault {
    }
    DebugDefault.debugText = 0xffffff;
    DebugDefault.colliderBounds = 0xffffff * 0.3;
    DebugDefault.colliderEdge = 0x8B0000;
    DebugDefault.colliderPosition = 0xFFFF00;
    DebugDefault.colliderCenter = 0xFF0000;
    DebugDefault.renderableBounds = 0xFFFF00;
    DebugDefault.renderableCenter = 0x9932CC;
    DebugDefault.verletParticle = 0xDC345E;
    DebugDefault.verletConstraintEdge = 0x433E36;
    es.DebugDefault = DebugDefault;
})(es || (es = {}));
var es;
(function (es) {
    class Insist {
        static fail(message = null, ...args) {
            if (!console.assert)
                return;
            if (message == null) {
                console.assert(false);
            }
            else {
                console.assert(false, es.StringUtils.format(message, args));
            }
        }
        static isTrue(condition, message = null, ...args) {
            if (!condition) {
                if (message == null) {
                    this.fail();
                }
                else {
                    this.fail(message, args);
                }
            }
        }
        static isFalse(condition, message = null, ...args) {
            if (message == null) {
                this.isTrue(!condition);
            }
            else {
                this.isTrue(!condition, message, args);
            }
        }
        static isNull(obj, message = null, ...args) {
            if (message == null) {
                this.isTrue(obj == null);
            }
            else {
                this.isTrue(obj == null, message, args);
            }
        }
        static isNotNull(obj, message = null, ...args) {
            if (message == null) {
                this.isTrue(obj != null);
            }
            else {
                this.isTrue(obj != null, message, args);
            }
        }
        static areEqual(first, second, message, ...args) {
            if (first != second)
                this.fail(message, args);
        }
        static areNotEqual(first, second, message, ...args) {
            if (first == second)
                this.fail(message, args);
        }
    }
    es.Insist = Insist;
})(es || (es = {}));
var es;
(function (es) {
    class DebugConsole {
    }
    es.DebugConsole = DebugConsole;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 执行顺序
     *  - onAddedToEntity
     *  - OnEnabled
     *
     *  删除执行顺序
     *      - onRemovedFromEntity
     */
    class Component {
        constructor() {
            this._enabled = true;
            this._updateOrder = 0;
            this.id = Component._idGenerator++;
        }
        /**
         * 快速访问 this.entity.transform
         */
        get transform() {
            return this.entity.transform;
        }
        /**
         * 如果组件和实体都已启用，则为。当启用该组件时，将调用该组件的生命周期方法。状态的改变会导致调用onEnabled/onDisable。
         */
        get enabled() {
            return this.entity ? this.entity.enabled && this._enabled : this._enabled;
        }
        /**
         * 如果组件和实体都已启用，则为。当启用该组件时，将调用该组件的生命周期方法。状态的改变会导致调用onEnabled/onDisable。
         * @param value
         */
        set enabled(value) {
            this.setEnabled(value);
        }
        /** 更新此实体上组件的顺序 */
        get updateOrder() {
            return this._updateOrder;
        }
        /** 更新此实体上组件的顺序 */
        set updateOrder(value) {
            this.setUpdateOrder(value);
        }
        /**
         * 当此组件已分配其实体，但尚未添加到实体的活动组件列表时调用。有用的东西，如物理组件，需要访问转换来修改碰撞体的属性。
         */
        initialize() {
        }
        /**
         * 在提交所有挂起的组件更改后，将该组件添加到场景时调用。此时，设置了实体字段和实体。场景也设定好了。
         */
        onAddedToEntity() {
        }
        /**
         * 当此组件从其实体中移除时调用。在这里做所有的清理工作。
         */
        onRemovedFromEntity() {
        }
        /**
         * 当实体的位置改变时调用。这允许组件知道它们由于父实体的移动而移动了。
         * @param comp
         */
        onEntityTransformChanged(comp) {
        }
        /**
         *当父实体或此组件启用时调用
         */
        onEnabled() {
        }
        /**
         * 禁用父实体或此组件时调用
         */
        onDisabled() {
        }
        setEnabled(isEnabled) {
            if (this._enabled != isEnabled) {
                this._enabled = isEnabled;
                if (this._enabled) {
                    this.onEnabled();
                }
                else {
                    this.onDisabled();
                }
            }
            return this;
        }
        setUpdateOrder(updateOrder) {
            if (this._updateOrder != updateOrder) {
                this._updateOrder = updateOrder;
            }
            return this;
        }
        /**
         * 添加组件
         * @param component 要添加的组件实例
         * @returns 返回添加的组件实例
         */
        addComponent(component) {
            return this.entity.addComponent(component);
        }
        /**
         * 获取组件
         * @param type 组件类型
         * @returns 返回获取到的组件实例
         */
        getComponent(type) {
            return this.entity.getComponent(type);
        }
        /**
         * 获取一组指定类型的组件
         * @param typeName 组件类型名
         * @param componentList 可选参数，存储组件实例的数组
         * @returns 返回指定类型的组件实例数组
         */
        getComponents(typeName, componentList) {
            return this.entity.getComponents(typeName, componentList);
        }
        /**
         * 判断实体是否包含指定类型的组件
         * @param type 组件类型
         * @returns 如果实体包含指定类型的组件，返回 true，否则返回 false。
         */
        hasComponent(type) {
            return this.entity.hasComponent(type);
        }
        /**
         * 删除组件
         * @param component 可选参数，要删除的组件实例。如果未指定该参数，则删除当前实例上的组件。
         */
        removeComponent(component) {
            if (component) {
                this.entity.removeComponent(component);
            }
            else {
                this.entity.removeComponent(this);
            }
        }
    }
    Component._idGenerator = 0;
    es.Component = Component;
})(es || (es = {}));
var es;
(function (es) {
    class ComponentType {
        constructor(type, index) {
            this.index_ = 0;
            if (index !== undefined) {
                this.index_ = ComponentType.INDEX++;
            }
            else {
                this.index_ = index;
            }
            this.type_ = type;
        }
        getName() {
            return es.getClassName(this.type_);
        }
        getIndex() {
            return this.index_;
        }
        toString() {
            return "ComponentType[" + es.getClassName(ComponentType) + "] (" + this.index_ + ")";
        }
    }
    ComponentType.INDEX = 0;
    es.ComponentType = ComponentType;
})(es || (es = {}));
var es;
(function (es) {
    let CoreEvents;
    (function (CoreEvents) {
        /**
         * 当场景发生变化时触发
         */
        CoreEvents[CoreEvents["sceneChanged"] = 0] = "sceneChanged";
        /**
         * 每帧更新事件
         */
        CoreEvents[CoreEvents["frameUpdated"] = 1] = "frameUpdated";
        /**
         * 当渲染发生时触发
         */
        CoreEvents[CoreEvents["renderChanged"] = 2] = "renderChanged";
    })(CoreEvents = es.CoreEvents || (es.CoreEvents = {}));
})(es || (es = {}));
var es;
(function (es) {
    class EntityComparer {
        compare(self, other) {
            let compare = self.updateOrder - other.updateOrder;
            if (compare == 0)
                compare = self.id - other.id;
            return compare;
        }
    }
    es.EntityComparer = EntityComparer;
    class Entity {
        constructor(name, id) {
            /**
             * 指定应该调用这个entity update方法的频率。1表示每一帧，2表示每一帧，以此类推
             */
            this.updateInterval = 1;
            this._tag = 0;
            this._enabled = true;
            this._updateOrder = 0;
            this.components = new es.ComponentList(this);
            this.transform = new es.Transform(this);
            this.componentBits = new es.Bits();
            this.name = name;
            this.id = id;
        }
        /**
         * 如果调用了destroy，那么在下一次处理实体之前这将一直为true
         */
        get isDestroyed() {
            return this._isDestroyed;
        }
        /**
         * 你可以随意使用。稍后可以使用它来查询场景中具有特定标记的所有实体
         */
        get tag() {
            return this._tag;
        }
        /**
         * 你可以随意使用。稍后可以使用它来查询场景中具有特定标记的所有实体
         * @param value
         */
        set tag(value) {
            this.setTag(value);
        }
        /**
         * 启用/禁用实体。当禁用碰撞器从物理系统和组件中移除时，方法将不会被调用
         */
        get enabled() {
            return this._enabled;
        }
        /**
         * 启用/禁用实体。当禁用碰撞器从物理系统和组件中移除时，方法将不会被调用
         * @param value
         */
        set enabled(value) {
            this.setEnabled(value);
        }
        /**
         * 更新此实体的顺序。updateOrder还用于对scene.entities上的标签列表进行排序
         */
        get updateOrder() {
            return this._updateOrder;
        }
        /**
         * 更新此实体的顺序。updateOrder还用于对scene.entities上的标签列表进行排序
         * @param value
         */
        set updateOrder(value) {
            this.setUpdateOrder(value);
        }
        get parent() {
            return this.transform.parent;
        }
        set parent(value) {
            this.transform.setParent(value);
        }
        get childCount() {
            return this.transform.childCount;
        }
        get position() {
            return this.transform.position;
        }
        set position(value) {
            this.transform.setPosition(value.x, value.y);
        }
        get localPosition() {
            return this.transform.localPosition;
        }
        set localPosition(value) {
            this.transform.setLocalPosition(value);
        }
        get rotation() {
            return this.transform.rotation;
        }
        set rotation(value) {
            this.transform.setRotation(value);
        }
        get rotationDegrees() {
            return this.transform.rotationDegrees;
        }
        set rotationDegrees(value) {
            this.transform.setRotationDegrees(value);
        }
        get localRotation() {
            return this.transform.localRotation;
        }
        set localRotation(value) {
            this.transform.setLocalRotation(value);
        }
        get localRotationDegrees() {
            return this.transform.localRotationDegrees;
        }
        set localRotationDegrees(value) {
            this.transform.setLocalRotationDegrees(value);
        }
        get scale() {
            return this.transform.scale;
        }
        set scale(value) {
            this.transform.setScale(value);
        }
        get localScale() {
            return this.transform.localScale;
        }
        set localScale(value) {
            this.transform.setLocalScale(value);
        }
        get worldInverseTransform() {
            return this.transform.worldInverseTransform;
        }
        get localToWorldTransform() {
            return this.transform.localToWorldTransform;
        }
        get worldToLocalTransform() {
            return this.transform.worldToLocalTransform;
        }
        onTransformChanged(comp) {
            // 通知我们的子项改变了位置
            this.components.onEntityTransformChanged(comp);
        }
        setParent(parent) {
            if (parent instanceof es.Transform) {
                this.transform.setParent(parent);
            }
            else if (parent instanceof Entity) {
                this.transform.setParent(parent.transform);
            }
            return this;
        }
        setPosition(x, y) {
            this.transform.setPosition(x, y);
            return this;
        }
        setLocalPosition(localPosition) {
            this.transform.setLocalPosition(localPosition);
            return this;
        }
        setRotation(radians) {
            this.transform.setRotation(radians);
            return this;
        }
        setRotationDegrees(degrees) {
            this.transform.setRotationDegrees(degrees);
            return this;
        }
        setLocalRotation(radians) {
            this.transform.setLocalRotation(radians);
            return this;
        }
        setLocalRotationDegrees(degrees) {
            this.transform.setLocalRotationDegrees(degrees);
            return this;
        }
        setScale(scale) {
            if (scale instanceof es.Vector2) {
                this.transform.setScale(scale);
            }
            else {
                this.transform.setScale(new es.Vector2(scale, scale));
            }
            return this;
        }
        setLocalScale(scale) {
            if (scale instanceof es.Vector2) {
                this.transform.setLocalScale(scale);
            }
            else {
                this.transform.setLocalScale(new es.Vector2(scale, scale));
            }
            return this;
        }
        /**
         * 设置实体的标记
         * @param tag
         */
        setTag(tag) {
            if (this._tag != tag) {
                // 我们只有在已经有场景的情况下才会调用entityTagList。如果我们还没有场景，我们会被添加到entityTagList
                if (this.scene)
                    this.scene.entities.removeFromTagList(this);
                this._tag = tag;
                if (this.scene)
                    this.scene.entities.addToTagList(this);
            }
            return this;
        }
        /**
         * 设置实体的启用状态。当禁用碰撞器从物理系统和组件中移除时，方法将不会被调用
         * @param isEnabled
         */
        setEnabled(isEnabled) {
            if (this._enabled != isEnabled) {
                this._enabled = isEnabled;
                if (this._enabled)
                    this.components.onEntityEnabled();
                else
                    this.components.onEntityDisabled();
            }
            return this;
        }
        /**
         * 设置此实体的更新顺序。updateOrder还用于对scene.entities上的标签列表进行排序
         * @param updateOrder
         */
        setUpdateOrder(updateOrder) {
            if (this._updateOrder != updateOrder) {
                this._updateOrder = updateOrder;
                if (this.scene) {
                    this.scene.entities.markEntityListUnsorted();
                    this.scene.entities.markTagUnsorted(this.tag);
                }
                return this;
            }
        }
        /**
         * 从场景中删除实体并销毁所有子元素
         */
        destroy() {
            this._isDestroyed = true;
            this.scene.identifierPool.checkIn(this.id);
            this.scene.entities.remove(this);
            this.transform.parent = null;
            // 销毁所有子项
            for (let i = this.transform.childCount - 1; i >= 0; i--) {
                let child = this.transform.getChild(i);
                child.entity.destroy();
            }
        }
        /**
         * 将实体从场景中分离。下面的生命周期方法将被调用在组件上:OnRemovedFromEntity
         */
        detachFromScene() {
            this.scene.entities.remove(this);
            this.components.deregisterAllComponents();
            for (let i = 0; i < this.transform.childCount; i++)
                this.transform.getChild(i).entity.detachFromScene();
        }
        /**
         * 将一个先前分离的实体附加到一个新的场景
         * @param newScene
         */
        attachToScene(newScene) {
            this.scene = newScene;
            newScene.entities.add(this);
            this.components.registerAllComponents();
            for (let i = 0; i < this.transform.childCount; i++) {
                this.transform.getChild(i).entity.attachToScene(newScene);
            }
        }
        /**
         * 在提交了所有挂起的实体更改后，将此实体添加到场景时调用
         */
        onAddedToScene() {
        }
        /**
         * 当此实体从场景中删除时调用
         */
        onRemovedFromScene() {
            // 如果已经被销毁了，移走我们的组件。如果我们只是分离，我们需要保持我们的组件在实体上。
            if (this._isDestroyed)
                this.components.removeAllComponents();
        }
        /**
         * 每帧进行调用进行更新组件
         */
        update() {
            this.components.update();
        }
        /**
         * 创建组件的新实例。返回实例组件
         * @param componentType
         */
        createComponent(componentType) {
            let component = new componentType();
            this.addComponent(component);
            return component;
        }
        /**
         * 将组件添加到组件列表中。返回组件。
         * @param component
         */
        addComponent(component) {
            component.entity = this;
            this.components.add(component);
            component.initialize();
            return component;
        }
        /**
         * 获取类型T的第一个组件并返回它。如果没有找到组件，则返回null。
         * @param type
         */
        getComponent(type) {
            return this.components.getComponent(type, false);
        }
        /**
         *  获取类型T的第一个并已加入场景的组件并返回它。如果没有找到组件，则返回null。
         * @param type
         * @returns
         */
        getComponentInScene(type) {
            return this.components.getComponent(type, true);
        }
        /**
         * 尝试获取T类型的组件。如果未找到任何组件，则返回false
         * @param type
         * @param outComponent
         * @returns
         */
        tryGetComponent(type, outComponent) {
            outComponent.value = this.components.getComponent(type, false);
            return outComponent.value != null;
        }
        /**
         * 检查实体是否具有该组件
         * @param type
         */
        hasComponent(type) {
            return this.components.getComponent(type, false) != null;
        }
        /**
         * 获取类型T的第一个组件并返回它。如果没有找到组件，将创建组件。
         * @param type
         */
        getOrCreateComponent(type) {
            let comp = this.components.getComponent(type, true);
            if (!comp) {
                comp = this.addComponent(new type());
            }
            return comp;
        }
        /**
         * 获取typeName类型的所有组件，但不使用列表分配
         * @param typeName
         * @param componentList
         */
        getComponents(typeName, componentList) {
            return this.components.getComponents(typeName, componentList);
        }
        /**
         * 从组件列表中删除组件
         * @param component
         */
        removeComponent(component) {
            this.components.remove(component);
        }
        /**
         * 从组件列表中删除类型为T的第一个组件
         * @param type
         */
        removeComponentForType(type) {
            let comp = this.getComponent(type);
            if (comp) {
                this.removeComponent(comp);
                return true;
            }
            return false;
        }
        /**
         * 从实体中删除所有组件
         */
        removeAllComponents() {
            for (let i = 0; i < this.components.count; i++) {
                this.removeComponent(this.components.buffer[i]);
            }
        }
        tweenPositionTo(to, duration = 0.3) {
            const tween = es.Pool.obtain(es.TransformVector2Tween);
            tween.setTargetAndType(this.transform, es.TransformTargetType.position);
            tween.initialize(tween, to, duration);
            return tween;
        }
        tweenLocalPositionTo(to, duration = 0.3) {
            const tween = es.Pool.obtain(es.TransformVector2Tween);
            tween.setTargetAndType(this.transform, es.TransformTargetType.localPosition);
            tween.initialize(tween, to, duration);
            return tween;
        }
        tweenScaleTo(to, duration = 0.3) {
            if (typeof (to) == 'number') {
                return this.tweenScaleTo(new es.Vector2(to, to), duration);
            }
            const tween = es.Pool.obtain(es.TransformVector2Tween);
            tween.setTargetAndType(this.transform, es.TransformTargetType.scale);
            tween.initialize(tween, to, duration);
            return tween;
        }
        tweenLocalScaleTo(to, duration = 0.3) {
            if (typeof (to) == 'number') {
                return this.tweenLocalScaleTo(new es.Vector2(to, to), duration);
            }
            const tween = es.Pool.obtain(es.TransformVector2Tween);
            tween.setTargetAndType(this.transform, es.TransformTargetType.localScale);
            tween.initialize(tween, to, duration);
            return tween;
        }
        tweenRotationDegreesTo(to, duration = 0.3) {
            const tween = es.Pool.obtain(es.TransformVector2Tween);
            tween.setTargetAndType(this.transform, es.TransformTargetType.rotationDegrees);
            tween.initialize(tween, new es.Vector2(to, to), duration);
            return tween;
        }
        tweenLocalRotationDegreesTo(to, duration = 0.3) {
            const tween = es.Pool.obtain(es.TransformVector2Tween);
            tween.setTargetAndType(this.transform, es.TransformTargetType.localRotationDegrees);
            tween.initialize(tween, new es.Vector2(to, to), duration);
            return tween;
        }
        compareTo(other) {
            let compare = this._updateOrder - other._updateOrder;
            if (compare == 0)
                compare = this.id - other.id;
            return compare;
        }
        equals(other) {
            return this.compareTo(other) == 0;
        }
        toString() {
            return `[Entity: name: ${this.name}, tag: ${this.tag}, enabled: ${this.enabled}, depth: ${this.updateOrder}]`;
        }
    }
    Entity.entityComparer = new EntityComparer();
    es.Entity = Entity;
})(es || (es = {}));
var es;
(function (es) {
    /** 2d 向量 */
    class Vector2 {
        /**
         * 从两个值构造一个带有X和Y的二维向量。
         * @param x 二维空间中的x坐标
         * @param y 二维空间的y坐标
         */
        constructor(x = 0, y = 0) {
            this.x = 0;
            this.y = 0;
            this.x = x;
            this.y = y;
        }
        static get zero() {
            return new Vector2(0, 0);
        }
        static get one() {
            return new Vector2(1, 1);
        }
        static get unitX() {
            return new Vector2(1, 0);
        }
        static get unitY() {
            return new Vector2(0, 1);
        }
        static get up() {
            return new Vector2(0, -1);
        }
        static get down() {
            return new Vector2(0, 1);
        }
        static get left() {
            return new Vector2(-1, 0);
        }
        static get right() {
            return new Vector2(1, 0);
        }
        /**
         *
         * @param value1
         * @param value2
         */
        static add(value1, value2) {
            let result = Vector2.zero;
            result.x = value1.x + value2.x;
            result.y = value1.y + value2.y;
            return result;
        }
        /**
         *
         * @param value1
         * @param value2
         */
        static divide(value1, value2) {
            let result = Vector2.zero;
            result.x = value1.x / value2.x;
            result.y = value1.y / value2.y;
            return result;
        }
        static divideScaler(value1, value2) {
            let result = Vector2.zero;
            result.x = value1.x / value2;
            result.y = value1.y / value2;
            return result;
        }
        /**
         * 返回两个向量之间距离的平方
         * @param value1
         * @param value2
         */
        static sqrDistance(value1, value2) {
            return Math.pow(value1.x - value2.x, 2) + Math.pow(value1.y - value2.y, 2);
        }
        /**
         * 将指定的值限制在一个范围内
         * @param value1
         * @param min
         * @param max
         */
        static clamp(value1, min, max) {
            return new Vector2(es.MathHelper.clamp(value1.x, min.x, max.x), es.MathHelper.clamp(value1.y, min.y, max.y));
        }
        /**
         * 创建一个新的Vector2，其中包含指定向量的线性插值
         * @param value1 第一个向量
         * @param value2 第二个向量
         * @param amount 加权值(0.0-1.0之间)
         * @returns 指定向量的线性插值结果
         */
        static lerp(value1, value2, amount) {
            return new Vector2(es.MathHelper.lerp(value1.x, value2.x, amount), es.MathHelper.lerp(value1.y, value2.y, amount));
        }
        /**
         * 创建一个新的Vector2，其中包含指定矢量的线性插值
         * @param value1
         * @param value2
         * @param amount
         * @returns
         */
        static lerpPrecise(value1, value2, amount) {
            return new Vector2(es.MathHelper.lerpPrecise(value1.x, value2.x, amount), es.MathHelper.lerpPrecise(value1.y, value2.y, amount));
        }
        /**
         * 创建一个新的Vector2，该Vector2包含了通过指定的Matrix进行的二维向量变换。
         * @param position
         * @param matrix
         */
        static transform(position, matrix) {
            return new Vector2((position.x * matrix.m11) + (position.y * matrix.m21) + matrix.m31, (position.x * matrix.m12) + (position.y * matrix.m22) + matrix.m32);
        }
        /**
         * 创建一个新的Vector2，其中包含由指定的Matrix转换的指定法线
         * @param normal
         * @param matrix
         */
        static transformNormal(normal, matrix) {
            return new Vector2((normal.x * matrix.m11) + (normal.y * matrix.m21), (normal.x * matrix.m12) + (normal.y * matrix.m22));
        }
        /**
         * 返回两个向量之间的距离
         * @param value1
         * @param value2
         * @returns 两个向量之间的距离
         */
        static distance(vec1, vec2) {
            return Math.sqrt(Math.pow(vec1.x - vec2.x, 2) + Math.pow(vec1.y - vec2.y, 2));
        }
        /**
         * 返回两个向量之间的角度，单位是度数
         * @param from
         * @param to
         */
        static angle(from, to) {
            from = from.normalize();
            to = to.normalize();
            return Math.acos(es.MathHelper.clamp(from.dot(to), -1, 1)) * es.MathHelper.Rad2Deg;
        }
        /**
         * 创建一个包含指定向量反转的新Vector2
         * @param value
         * @returns 矢量反演的结果
         */
        static negate(value) {
            value.x = -value.x;
            value.y = -value.y;
            return value;
        }
        /**
         * 向量的反射，输入为两个二维向量vector和normal。函数返回一个新的向量，即vector相对于normal的反射
         * @param vector
         * @param normal
         * @returns
         */
        static reflect(vector, normal) {
            let result = es.Vector2.zero;
            // 计算向量与法线的点积，并将结果乘2
            let val = 2 * ((vector.x * normal.x) + (vector.y * normal.y));
            // 计算反射向量
            result.x = vector.x - (normal.x * val);
            result.y = vector.y - (normal.y * val);
            return result;
        }
        /**
         * 创建一个新的Vector2，其中包含指定矢量的三次插值
         * @param value1
         * @param value2
         * @param amount
         * @returns
         */
        static smoothStep(value1, value2, amount) {
            return new Vector2(es.MathHelper.smoothStep(value1.x, value2.x, amount), es.MathHelper.smoothStep(value1.y, value2.y, amount));
        }
        setTo(x, y) {
            this.x = x;
            this.y = y;
        }
        negate() {
            return this.scale(-1);
        }
        /**
         *
         * @param value
         */
        add(v) {
            return new Vector2(this.x + v.x, this.y + v.y);
        }
        addEqual(v) {
            this.x += v.x;
            this.y += v.y;
            return this;
        }
        /**
         *
         * @param value
         */
        divide(value) {
            return new Vector2(this.x / value.x, this.y / value.y);
        }
        divideScaler(value) {
            return new Vector2(this.x / value, this.y / value);
        }
        /**
         *
         * @param value
         */
        multiply(value) {
            return new Vector2(value.x * this.x, value.y * this.y);
        }
        /**
         *
         * @param value
         * @returns
         */
        multiplyScaler(value) {
            this.x *= value;
            this.y *= value;
            return this;
        }
        /**
         * 从当前Vector2减去一个Vector2
         * @param value 要减去的Vector2
         * @returns 当前Vector2
         */
        sub(value) {
            return new Vector2(this.x - value.x, this.y - value.y);
        }
        subEqual(v) {
            this.x -= v.x;
            this.y -= v.y;
            return this;
        }
        dot(v) {
            return this.x * v.x + this.y * v.y;
        }
        /**
         *
         * @param size
         * @returns
         */
        scale(size) {
            return new Vector2(this.x * size, this.y * size);
        }
        scaleEqual(size) {
            this.x *= size;
            this.y *= size;
            return this;
        }
        transform(matrix) {
            return new Vector2(this.x * matrix.m11 + this.y * matrix.m21 + matrix.m31, this.x * matrix.m12 + this.y * matrix.m22 + matrix.m32);
        }
        normalize() {
            const d = this.distance();
            if (d > 0) {
                return new Vector2(this.x / d, this.y / d);
            }
            else {
                return new Vector2(0, 1);
            }
        }
        /**
         * 将这个Vector2变成一个方向相同的单位向量
         */
        normalizeEqual() {
            const d = this.distance();
            if (d > 0) {
                this.setTo(this.x / d, this.y / d);
                return this;
            }
            else {
                this.setTo(0, 1);
                return this;
            }
        }
        magnitude() {
            return this.distance();
        }
        distance(v) {
            if (!v) {
                v = Vector2.zero;
            }
            return Math.sqrt(Math.pow(this.x - v.x, 2) + Math.pow(this.y - v.y, 2));
        }
        /**
         * 返回该Vector2的平方长度
         * @returns 这个Vector2的平方长度
         */
        lengthSquared() {
            return (this.x * this.x) + (this.y * this.y);
        }
        /**
         * 从原点到向量末端的距离
         * @returns
         */
        getLength() {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        }
        /**
         * 四舍五入X和Y值
         */
        round() {
            return new Vector2(Math.round(this.x), Math.round(this.y));
        }
        /**
         * 返回以自己为中心点的左右角，单位为度
         * @param left
         * @param right
         */
        angleBetween(left, right) {
            let one = left.sub(this);
            let two = right.sub(this);
            return es.Vector2Ext.angle(one, two);
        }
        getDistance(other) {
            return Math.sqrt(this.getDistanceSquared(other));
        }
        getDistanceSquared(other) {
            const dx = other.x - this.x;
            const dy = other.y - this.y;
            return dx * dx + dy * dy;
        }
        isBetween(v1, v2) {
            const cross = v2.sub(v1).cross(this.sub(v1));
            return Math.abs(cross) < Number.EPSILON && this.dot(v2.sub(v1)) >= 0 && this.dot(v1.sub(v2)) >= 0;
        }
        /**
         * 两个向量的叉积
         * @param other
         * @returns
         */
        cross(other) {
            return this.x * other.y - this.y * other.x;
        }
        /**
         * 计算向量与x轴之间的夹角
         */
        getAngle() {
            return Math.atan2(this.y, this.x);
        }
        /**
         * 比较当前实例是否等于指定的对象
         * @param other 要比较的对象
         * @returns 如果实例相同true 否则false
         */
        equals(other, tolerance = 0.001) {
            return Math.abs(this.x - other.x) <= tolerance && Math.abs(this.y - other.y) <= tolerance;
        }
        isValid() {
            return es.MathHelper.isValid(this.x) && es.MathHelper.isValid(this.y);
        }
        /**
         * 创建一个新的Vector2，其中包含来自两个向量的最小值
         * @param value1
         * @param value2
         * @returns
         */
        static min(value1, value2) {
            return new Vector2(value1.x < value2.x ? value1.x : value2.x, value1.y < value2.y ? value1.y : value2.y);
        }
        /**
         * 创建一个新的Vector2，其中包含两个向量的最大值
         * @param value1
         * @param value2
         * @returns
         */
        static max(value1, value2) {
            return new Vector2(value1.x > value2.x ? value1.x : value2.x, value1.y > value2.y ? value1.y : value2.y);
        }
        /**
         * 创建一个新的Vector2，其中包含Hermite样条插值
         * @param value1
         * @param tangent1
         * @param value2
         * @param tangent2
         * @param amount
         * @returns
         */
        static hermite(value1, tangent1, value2, tangent2, amount) {
            return new Vector2(es.MathHelper.hermite(value1.x, tangent1.x, value2.x, tangent2.x, amount), es.MathHelper.hermite(value1.y, tangent1.y, value2.y, tangent2.y, amount));
        }
        static unsignedAngle(from, to, round = true) {
            from.normalizeEqual();
            to.normalizeEqual();
            const angle = Math.acos(es.MathHelper.clamp(from.dot(to), -1, 1)) * es.MathHelper.Rad2Deg;
            return round ? Math.round(angle) : angle;
        }
        static fromAngle(angle, magnitude = 1) {
            return new Vector2(magnitude * Math.cos(angle), magnitude * Math.sin(angle));
        }
        clone() {
            return new Vector2(this.x, this.y);
        }
        copyFrom(source) {
            this.x = source.x;
            this.y = source.y;
            return this;
        }
    }
    es.Vector2 = Vector2;
})(es || (es = {}));
///<reference path="../Math/Vector2.ts" />
var es;
///<reference path="../Math/Vector2.ts" />
(function (es) {
    /** 场景 */
    class Scene extends fairygui.GComponent {
        constructor() {
            super();
            this._sceneComponents = [];
            this.entities = new es.EntityList(this);
            this.entityProcessors = new es.EntityProcessorList();
            this.identifierPool = new es.IdentifierPool();
        }
        onConstruct() {
            var _a;
            (_a = this.initialize) === null || _a === void 0 ? void 0 : _a.call(this);
        }
        /**
         * 初始化场景，可以在派生类中覆盖
         *
         * 这个方法会在场景创建时被调用。您可以在这个方法中添加实体和组件，
         * 或者执行一些必要的准备工作，以便场景能够开始运行。
         */
        initialize() { }
        /**
         * 开始运行场景时调用此方法，可以在派生类中覆盖
         *
         * 这个方法会在场景开始运行时被调用。您可以在这个方法中执行场景开始时需要进行的操作。
         * 比如，您可以开始播放一段背景音乐、启动UI等等。
         */
        onStart() { }
        /**
         * 卸载场景时调用此方法，可以在派生类中覆盖
         *
         * 这个方法会在场景被销毁时被调用。您可以在这个方法中销毁实体和组件、释放资源等等。
         * 您也可以在这个方法中执行一些必要的清理工作，以确保场景被完全卸载。
         */
        onUnload() { }
        /**
         * 开始场景，初始化物理系统、启动实体处理器等
         *
         * 这个方法会启动场景。它将重置物理系统、启动实体处理器等，并调用onStart方法。
         */
        begin() {
            // 重置物理系统
            es.Physics.reset();
            // 启动实体处理器
            if (this.entityProcessors != null)
                this.entityProcessors.begin();
            // 标记场景已开始运行并调用onStart方法
            this._didSceneBegin = true;
            this.onStart();
        }
        /**
         * 结束场景，清除实体、场景组件、物理系统等
         *
         * 这个方法会结束场景。它将移除所有实体并调用它们的onRemovedFromScene方法，清除物理系统，结束实体处理器等，并调用unload方法。
         */
        end() {
            // 标记场景已结束运行
            this._didSceneBegin = false;
            // 移除所有实体并调用它们的onRemovedFromScene方法
            this.entities.removeAllEntities();
            for (let i = 0; i < this._sceneComponents.length; i++) {
                this._sceneComponents[i].onRemovedFromScene();
            }
            this._sceneComponents.length = 0;
            // 清除物理系统
            es.Physics.clear();
            // 结束实体处理器
            if (this.entityProcessors)
                this.entityProcessors.end();
            // 调用卸载方法
            this.onUnload();
        }
        /**
         * 更新场景，更新实体组件、实体处理器等
         */
        update() {
            // 更新实体列表
            this.entities.updateLists();
            // 更新场景组件
            for (let i = this._sceneComponents.length - 1; i >= 0; i--) {
                if (this._sceneComponents[i].enabled)
                    this._sceneComponents[i].update();
            }
            // 更新实体处理器
            if (this.entityProcessors != null)
                this.entityProcessors.update();
            // 更新实体组
            this.entities.update();
            // 更新实体处理器的后处理方法
            if (this.entityProcessors != null)
                this.entityProcessors.lateUpdate();
        }
        /**
         * 向组件列表添加并返回SceneComponent
         * @param component
         */
        addSceneComponent(component) {
            component.scene = this;
            component.onEnabled();
            this._sceneComponents.push(component);
            this._sceneComponents.sort(component.compare);
            return component;
        }
        /**
         * 获取类型为T的第一个SceneComponent并返回它。如果没有找到组件，则返回null。
         * @param type
         */
        getSceneComponent(type) {
            for (let i = 0; i < this._sceneComponents.length; i++) {
                let component = this._sceneComponents[i];
                if (component instanceof type)
                    return component;
            }
            return null;
        }
        /**
         * 获取类型为T的第一个SceneComponent并返回它。如果没有找到SceneComponent，则将创建SceneComponent。
         * @param type
         */
        getOrCreateSceneComponent(type) {
            let comp = this.getSceneComponent(type);
            if (comp == null)
                comp = this.addSceneComponent(new type());
            return comp;
        }
        /**
         * 从SceneComponents列表中删除一个SceneComponent
         * @param component
         */
        removeSceneComponent(component) {
            const sceneComponentList = new es.List(this._sceneComponents);
            es.Insist.isTrue(sceneComponentList.contains(component), `SceneComponent${component}不在SceneComponents列表中!`);
            sceneComponentList.remove(component);
            component.onRemovedFromScene();
        }
        /**
         * 将实体添加到此场景，并返回它
         * @param name
         */
        createEntity(name) {
            let entity = new es.Entity(name, this.identifierPool.checkOut());
            return this.addEntity(entity);
        }
        /**
         * 在场景的实体列表中添加一个实体
         * @param entity
         */
        addEntity(entity) {
            es.Insist.isFalse(new es.List(this.entities.buffer).contains(entity), `您试图将同一实体添加到场景两次: ${entity}`);
            this.entities.add(entity);
            entity.scene = this;
            for (let i = 0; i < entity.transform.childCount; i++)
                this.addEntity(entity.transform.getChild(i).entity);
            return entity;
        }
        /**
         * 从场景中删除所有实体
         */
        destroyAllEntities() {
            for (let i = 0; i < this.entities.count; i++) {
                this.entities.buffer[i].destroy();
            }
        }
        /**
         * 搜索并返回第一个具有名称的实体
         * @param name
         */
        findEntity(name) {
            return this.entities.findEntity(name);
        }
        /**
         * 返回最后一个找到的名字为name的实体。如果没有找到则返回null
         * @param name
         */
        findEntityRight(name) {
            return this.entities.findEntityRight(name);
        }
        findEntityById(id) {
            return this.entities.findEntityById(id);
        }
        /**
         * 返回具有给定标记的所有实体
         * @param tag
         */
        findEntitiesWithTag(tag) {
            return this.entities.entitiesWithTag(tag);
        }
        /**
         * 返回提一个具有该标记的实体
         * @param tag
         * @returns
         */
        findEntityWithTag(tag) {
            return this.entities.entityWithTag(tag);
        }
        /**
         * 返回第一个启用加载的类型为T的组件
         * @param type
         */
        findComponentOfType(type) {
            return this.entities.findComponentOfType(type);
        }
        /**
         * 返回类型为T的所有已启用已加载组件的列表
         * @param type
         */
        findComponentsOfType(type) {
            return this.entities.findComponentsOfType(type);
        }
        /**
         * 返回场景中包含特定组件的实体列表
         * @param type
         * @returns
         */
        findEntitiesOfComponent(...types) {
            return this.entities.findEntitiesOfComponent(...types);
        }
        /**
         * 在场景中添加一个EntitySystem处理器
         * @param processor 处理器
         */
        addEntityProcessor(processor) {
            processor.scene = this;
            this.entityProcessors.add(processor);
            processor.setUpdateOrder(this.entityProcessors.count - 1);
            this.entityProcessors.clearDirty();
            return processor;
        }
        /**
         * 从场景中删除EntitySystem处理器
         * @param processor
         */
        removeEntityProcessor(processor) {
            this.entityProcessors.remove(processor);
        }
        /**
         * 获取EntitySystem处理器
         */
        getEntityProcessor(type) {
            return this.entityProcessors.getProcessor(type);
        }
    }
    es.Scene = Scene;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * SceneTransition用于从一个场景过渡到另一个场景，或在一个场景内进行效果转换。
     * 如果sceneLoadAction为null，框架将执行场景内过渡，而不是加载新的场景中间过渡。
     */
    class SceneTransition {
        get hasPreviousSceneRender() {
            if (!this._hasPreviousSceneRender) {
                this._hasPreviousSceneRender = true;
                return false;
            }
            return true;
        }
        constructor(sceneLoadAction) {
            /**
             * 指示此转换是否将加载新场景的标志
             */
            this._loadsNewScene = false;
            this._hasPreviousSceneRender = false;
            /**
             * 将此用于两部分过渡。例如，褪色会先褪色为黑色，然后当_isNewSceneLoaded变为true时会褪色。
             * 对于场景内转换，应在中点将isNewSceneLoaded设置为true，就像加载了新场景一样
             */
            this._isNewSceneLoaded = false;
            this.sceneLoadAction = sceneLoadAction;
            this._loadsNewScene = sceneLoadAction != null;
        }
        *LoadNextScene() {
            // 如果我们有渲染界面，可以在这让玩家知道屏幕是模糊的（正在加载）
            if (this.onScreenObscured != null)
                this.onScreenObscured();
            // 如果我们不加载一个新场景，我们只需设置标志
            if (!this._loadsNewScene) {
                this._isNewSceneLoaded = true;
                yield "break";
            }
            es.Core.scene = this.sceneLoadAction();
            this._isNewSceneLoaded = true;
            while (!this._isNewSceneLoaded)
                yield null;
        }
        /**
         * 在前一个场景出现第一次（也是唯一一次）后调用。
         * 此时，可以在生成一帧后加载新场景（因此第一次渲染调用发生在场景加载之前）
         */
        *onBeginTransition() {
            yield null;
            yield es.Core.startCoroutine(this.LoadNextScene());
            this.transitionComplete();
        }
        /**
         * 在渲染场景之前调用
         */
        preRender() { }
        /**
         * 在这里进行所有渲染
         */
        render() { }
        /**
         * 当过渡完成且新场景已设置时，将调用此函数
         */
        transitionComplete() {
            es.Core.Instance._sceneTransition = null;
            if (this.onTransitionCompleted != null)
                this.onTransitionCompleted();
        }
    }
    es.SceneTransition = SceneTransition;
})(es || (es = {}));
var es;
(function (es) {
    let ComponentTransform;
    (function (ComponentTransform) {
        ComponentTransform[ComponentTransform["position"] = 0] = "position";
        ComponentTransform[ComponentTransform["scale"] = 1] = "scale";
        ComponentTransform[ComponentTransform["rotation"] = 2] = "rotation";
    })(ComponentTransform = es.ComponentTransform || (es.ComponentTransform = {}));
    let DirtyType;
    (function (DirtyType) {
        DirtyType[DirtyType["clean"] = 0] = "clean";
        DirtyType[DirtyType["positionDirty"] = 1] = "positionDirty";
        DirtyType[DirtyType["scaleDirty"] = 2] = "scaleDirty";
        DirtyType[DirtyType["rotationDirty"] = 4] = "rotationDirty";
    })(DirtyType = es.DirtyType || (es.DirtyType = {}));
    class Transform {
        constructor(entity) {
            /**
             * 值会根据位置、旋转和比例自动重新计算
             */
            this._localTransform = es.Matrix2D.identity;
            /**
             * 值将自动从本地和父矩阵重新计算。
             */
            this._worldTransform = es.Matrix2D.identity;
            this._rotationMatrix = es.Matrix2D.identity;
            this._translationMatrix = es.Matrix2D.identity;
            this._scaleMatrix = es.Matrix2D.identity;
            this._children = [];
            this._worldToLocalTransform = es.Matrix2D.identity;
            this._worldInverseTransform = es.Matrix2D.identity;
            this._position = es.Vector2.zero;
            this._scale = es.Vector2.one;
            this._rotation = 0;
            this._localPosition = es.Vector2.zero;
            this._localScale = es.Vector2.one;
            this._localRotation = 0;
            this.entity = entity;
            this.scale = this._localScale = es.Vector2.one;
        }
        /**
         * 这个转换的所有子元素
         */
        get childCount() {
            return this._children.length;
        }
        /**
         * 变换在世界空间的旋转度
         */
        get rotationDegrees() {
            return es.MathHelper.toDegrees(this._rotation);
        }
        /**
         * 变换在世界空间的旋转度
         * @param value
         */
        set rotationDegrees(value) {
            this.setRotation(es.MathHelper.toRadians(value));
        }
        /**
         * 旋转相对于父变换旋转的角度
         */
        get localRotationDegrees() {
            return es.MathHelper.toDegrees(this._localRotation);
        }
        /**
         * 旋转相对于父变换旋转的角度
         * @param value
         */
        set localRotationDegrees(value) {
            this.localRotation = es.MathHelper.toRadians(value);
        }
        get localToWorldTransform() {
            this.updateTransform();
            return this._worldTransform;
        }
        /**
         * 获取此转换的父转换
         */
        get parent() {
            return this._parent;
        }
        /**
         * 设置此转换的父转换
         * @param value
         */
        set parent(value) {
            this.setParent(value);
        }
        get worldToLocalTransform() {
            if (this._worldToLocalDirty) {
                if (this.parent == null) {
                    this._worldToLocalTransform = es.Matrix2D.identity;
                }
                else {
                    this.parent.updateTransform();
                    this._worldToLocalTransform = es.Matrix2D.invert(this.parent._worldTransform);
                }
                this._worldToLocalDirty = false;
            }
            return this._worldToLocalTransform;
        }
        get worldInverseTransform() {
            this.updateTransform();
            if (this._worldInverseDirty) {
                this._worldInverseTransform = es.Matrix2D.invert(this._worldTransform);
                this._worldInverseDirty = false;
            }
            return this._worldInverseTransform;
        }
        /**
         * 变换在世界空间中的位置
         */
        get position() {
            this.updateTransform();
            if (this._positionDirty) {
                if (this.parent == null) {
                    this._position = this._localPosition;
                }
                else {
                    this.parent.updateTransform();
                    es.Vector2Ext.transformR(this._localPosition, this.parent._worldTransform, this._position);
                }
                this._positionDirty = false;
            }
            return this._position;
        }
        /**
         * 变换在世界空间中的位置
         * @param value
         */
        set position(value) {
            this.setPosition(value.x, value.y);
        }
        /**
         * 变换在世界空间的缩放
         */
        get scale() {
            this.updateTransform();
            return this._scale;
        }
        /**
         * 变换在世界空间的缩放
         * @param value
         */
        set scale(value) {
            this.setScale(value);
        }
        /**
         * 在世界空间中以弧度旋转的变换
         */
        get rotation() {
            this.updateTransform();
            return this._rotation;
        }
        /**
         * 变换在世界空间的旋转度
         * @param value
         */
        set rotation(value) {
            this.setRotation(value);
        }
        /**
         * 转换相对于父转换的位置。如果转换没有父元素，则与transform.position相同
         */
        get localPosition() {
            this.updateTransform();
            return this._localPosition;
        }
        /**
         * 转换相对于父转换的位置。如果转换没有父元素，则与transform.position相同
         * @param value
         */
        set localPosition(value) {
            this.setLocalPosition(value);
        }
        /**
         * 转换相对于父元素的比例。如果转换没有父元素，则与transform.scale相同
         */
        get localScale() {
            this.updateTransform();
            return this._localScale;
        }
        /**
         * 转换相对于父元素的比例。如果转换没有父元素，则与transform.scale相同
         * @param value
         */
        set localScale(value) {
            this.setLocalScale(value);
        }
        /**
         * 相对于父变换的旋转，变换的旋转。如果转换没有父元素，则与transform.rotation相同
         */
        get localRotation() {
            this.updateTransform();
            return this._localRotation;
        }
        /**
         * 相对于父变换的旋转，变换的旋转。如果转换没有父元素，则与transform.rotation相同
         * @param value
         */
        set localRotation(value) {
            this.setLocalRotation(value);
        }
        /**
         * 返回在索引处的转换子元素
         * @param index
         */
        getChild(index) {
            return this._children[index];
        }
        /**
         * 设置此转换的父转换
         * @param parent
         */
        setParent(parent) {
            if (this._parent == parent)
                return this;
            if (this._parent != null) {
                const index = this._parent._children.findIndex(t => t == this);
                if (index != -1)
                    this._parent._children.splice(index, 1);
            }
            if (parent != null) {
                parent._children.push(this);
            }
            this._parent = parent;
            this.setDirty(DirtyType.positionDirty);
            return this;
        }
        /**
         * 设置转换在世界空间中的位置
         * @param x
         * @param y
         */
        setPosition(x, y) {
            let position = new es.Vector2(x, y);
            if (position.equals(this._position))
                return this;
            this._position = position;
            if (this.parent != null) {
                this.localPosition = es.Vector2.transform(this._position, this.worldToLocalTransform);
            }
            else {
                this.localPosition = position;
            }
            this._positionDirty = false;
            return this;
        }
        /**
         * 设置转换相对于父转换的位置。如果转换没有父元素，则与transform.position相同
         * @param localPosition
         */
        setLocalPosition(localPosition) {
            if (localPosition.equals(this._localPosition))
                return this;
            this._localPosition = localPosition;
            this._localDirty = this._positionDirty = this._localPositionDirty = this._localRotationDirty = this._localScaleDirty = true;
            this.setDirty(DirtyType.positionDirty);
            return this;
        }
        /**
         * 设置变换在世界空间的旋转度
         * @param radians
         */
        setRotation(radians) {
            this._rotation = radians;
            if (this.parent != null) {
                this.localRotation = this.parent.rotation + radians;
            }
            else {
                this.localRotation = radians;
            }
            this.setDirty(DirtyType.rotationDirty);
            return this;
        }
        /**
         * 设置变换在世界空间的旋转度
         * @param degrees
         */
        setRotationDegrees(degrees) {
            return this.setRotation(es.MathHelper.toRadians(degrees));
        }
        /**
         * 旋转精灵的顶部，使其朝向位置
         * @param pos
         */
        lookAt(pos) {
            const sign = this.position.x > pos.x ? -1 : 1;
            const vectorToAlignTo = this.position.sub(pos).normalize();
            this.rotation = sign * Math.acos(vectorToAlignTo.dot(es.Vector2.unitY));
        }
        /**
         * 相对于父变换的旋转设置变换的旋转。如果转换没有父元素，则与transform.rotation相同
         * @param radians
         */
        setLocalRotation(radians) {
            this._localRotation = radians;
            this._localDirty = this._positionDirty = this._localPositionDirty = this._localRotationDirty = this._localScaleDirty = true;
            this.setDirty(DirtyType.rotationDirty);
            return this;
        }
        /**
         * 相对于父变换的旋转设置变换的旋转。如果转换没有父元素，则与transform.rotation相同
         * @param degrees
         */
        setLocalRotationDegrees(degrees) {
            return this.setLocalRotation(es.MathHelper.toRadians(degrees));
        }
        /**
         * 设置变换在世界空间中的缩放
         * @param scale
         */
        setScale(scale) {
            this._scale = scale;
            if (this.parent != null) {
                this.localScale = es.Vector2.divide(scale, this.parent._scale);
            }
            else {
                this.localScale = scale;
            }
            this.setDirty(DirtyType.scaleDirty);
            return this;
        }
        /**
         * 设置转换相对于父对象的比例。如果转换没有父元素，则与transform.scale相同
         * @param scale
         */
        setLocalScale(scale) {
            this._localScale = scale;
            this._localDirty = this._positionDirty = this._localScaleDirty = true;
            this.setDirty(DirtyType.scaleDirty);
            return this;
        }
        /**
         * 对精灵坐标进行四舍五入
         */
        roundPosition() {
            this.position = es.Vector2Ext.round(this._position);
        }
        updateTransform() {
            if (this.hierarchyDirty != DirtyType.clean) {
                if (this.parent != null)
                    this.parent.updateTransform();
                if (this._localDirty) {
                    if (this._localPositionDirty) {
                        es.Matrix2D.createTranslation(this._localPosition.x, this._localPosition.y, this._translationMatrix);
                        this._localPositionDirty = false;
                    }
                    if (this._localRotationDirty) {
                        es.Matrix2D.createRotation(this._localRotation, this._rotationMatrix);
                        this._localRotationDirty = false;
                    }
                    if (this._localScaleDirty) {
                        es.Matrix2D.createScale(this._localScale.x, this._localScale.y, this._scaleMatrix);
                        this._localScaleDirty = false;
                    }
                    es.Matrix2D.multiply(this._scaleMatrix, this._rotationMatrix, this._localTransform);
                    es.Matrix2D.multiply(this._localTransform, this._translationMatrix, this._localTransform);
                    if (this.parent == null) {
                        this._worldTransform = this._localTransform;
                        this._rotation = this._localRotation;
                        this._scale = this._localScale;
                        this._worldInverseDirty = true;
                    }
                    this._localDirty = false;
                }
                if (this.parent != null) {
                    es.Matrix2D.multiply(this._localTransform, this.parent._worldTransform, this._worldTransform);
                    this._rotation = this._localRotation + this.parent._rotation;
                    this._scale = this.parent._scale.multiply(this._localScale);
                    ;
                    this._worldInverseDirty = true;
                }
                this._worldToLocalDirty = true;
                this._positionDirty = true;
                this.hierarchyDirty = DirtyType.clean;
            }
        }
        setDirty(dirtyFlagType) {
            if ((this.hierarchyDirty & dirtyFlagType) == 0) {
                this.hierarchyDirty |= dirtyFlagType;
                switch (dirtyFlagType) {
                    case DirtyType.positionDirty:
                        this.entity.onTransformChanged(ComponentTransform.position);
                        break;
                    case DirtyType.rotationDirty:
                        this.entity.onTransformChanged(ComponentTransform.rotation);
                        break;
                    case DirtyType.scaleDirty:
                        this.entity.onTransformChanged(ComponentTransform.scale);
                        break;
                }
                // 告诉子项发生了变换
                for (let i = 0; i < this._children.length; i++)
                    this._children[i].setDirty(dirtyFlagType);
            }
        }
        /**
         * 从另一个transform属性进行拷贝
         * @param transform
         */
        copyFrom(transform) {
            this._position = transform.position.clone();
            this._localPosition = transform._localPosition.clone();
            this._rotation = transform._rotation;
            this._localRotation = transform._localRotation;
            this._scale = transform._scale;
            this._localScale = transform._localScale;
            this.setDirty(DirtyType.positionDirty);
            this.setDirty(DirtyType.rotationDirty);
            this.setDirty(DirtyType.scaleDirty);
        }
        toString() {
            return `[Transform: parent: ${this.parent}, position: ${this.position}, rotation: ${this.rotation},
                scale: ${this.scale}, localPosition: ${this._localPosition}, localRotation: ${this._localRotation},
                localScale: ${this._localScale}]`;
        }
    }
    es.Transform = Transform;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 用于比较组件更新排序
     */
    class IUpdatableComparer {
        compare(a, b) {
            return a.updateOrder - b.updateOrder;
        }
    }
    es.IUpdatableComparer = IUpdatableComparer;
    es.isIUpdatable = (props) => typeof props['update'] !== 'undefined';
})(es || (es = {}));
var es;
(function (es) {
    class SceneComponent {
        constructor() {
            /**
             * 更新此场景中SceneComponents的顺序
             */
            this.updateOrder = 0;
            this._enabled = true;
        }
        /**
         * 如果启用了SceneComponent，则为true。状态的改变会导致调用onEnabled/onDisable。
         */
        get enabled() {
            return this._enabled;
        }
        /**
         * 如果启用了SceneComponent，则为true。状态的改变会导致调用onEnabled/onDisable。
         * @param value
         */
        set enabled(value) {
            this.setEnabled(value);
        }
        /**
         * 在启用此SceneComponent时调用
         */
        onEnabled() {
        }
        /**
         * 当禁用此SceneComponent时调用
         */
        onDisabled() {
        }
        /**
         * 当该SceneComponent从场景中移除时调用
         */
        onRemovedFromScene() {
        }
        /**
         * 在实体更新之前每一帧调用
         */
        update() {
        }
        /**
         * 启用/禁用这个SceneComponent
         * @param isEnabled
         */
        setEnabled(isEnabled) {
            if (this._enabled != isEnabled) {
                this._enabled = isEnabled;
                if (this._enabled) {
                    this.onEnabled();
                }
                else {
                    this.onDisabled();
                }
            }
            return this;
        }
        /**
         * 设置SceneComponent的updateOrder并触发某种SceneComponent
         * @param updateOrder
         */
        setUpdateOrder(updateOrder) {
            if (this.updateOrder != updateOrder) {
                this.updateOrder = updateOrder;
            }
            return this;
        }
        compare(other) {
            return this.updateOrder - other.updateOrder;
        }
    }
    es.SceneComponent = SceneComponent;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 请注意，这不是一个完整的、多迭代的物理系统！它可以用于简单的、街机风格的物理。
     * 这可以用于简单的，街机风格的物理学
     */
    class ArcadeRigidbody extends es.Component {
        /** 这个刚体的质量。质量为0，则是一个不可移动的物体 */
        get mass() {
            return this._mass;
        }
        set mass(value) {
            this.setMass(value);
        }
        /**
         * 0-1范围，其中0为无反弹，1为完全反射。
         */
        get elasticity() {
            return this._elasticity;
        }
        set elasticiy(value) {
            this.setElasticity(value);
        }
        /**
         * 0 - 1范围。0表示没有摩擦力，1表示物体会停止在原地
         */
        get friction() {
            return this._friction;
        }
        set friction(value) {
            this.setFriction(value);
        }
        /**
         * 0-9的范围。当发生碰撞时，沿碰撞面做直线运动时，如果其平方幅度小于glue摩擦力，则将碰撞设置为上限
         */
        get glue() {
            return this._glue;
        }
        set glue(value) {
            this.setGlue(value);
        }
        /**
         * 质量为0的刚体被认为是不可移动的。改变速度和碰撞对它们没有影响
         */
        get isImmovable() {
            return this._mass < 0.0001;
        }
        constructor() {
            super();
            /**
             *  如果为真，则每一帧都会考虑到Physics.gravity
             */
            this.shouldUseGravity = true;
            /**
             * 该刚体的速度
             */
            this.velocity = es.Vector2.zero;
            this._mass = 10;
            this._elasticity = 0.5;
            this._friction = 0.5;
            this._glue = 0.01;
            this._inverseMass = 0;
            this._inverseMass = 1 / this._mass;
        }
        /**
         * 这个刚体的质量。质量为0，则是一个不可移动的物体
         * @param mass
         */
        setMass(mass) {
            this._mass = es.MathHelper.clamp(mass, 0, Number.MAX_VALUE);
            if (this._mass > 0.0001)
                this._inverseMass = 1 / this._mass;
            else
                this._inverseMass = 0;
            return this;
        }
        /**
         * 0-1范围，其中0为无反弹，1为完全反射。
         * @param value
         */
        setElasticity(value) {
            this._elasticity = es.MathHelper.clamp01(value);
            return this;
        }
        /**
         * 0 - 1范围。0表示没有摩擦力，1表示物体会停止在原地
         * @param value
         */
        setFriction(value) {
            this._friction = es.MathHelper.clamp01(value);
            return this;
        }
        /**
         * 0-9的范围。当发生碰撞时，沿碰撞面做直线运动时，如果其平方幅度小于glue摩擦力，则将碰撞设置为上限
         * @param value
         */
        setGlue(value) {
            this._glue = es.MathHelper.clamp(value, 0, 10);
            return this;
        }
        setVelocity(velocity) {
            this.velocity = velocity;
            return this;
        }
        /**
         * 用刚体的质量给刚体加上一个瞬间的力脉冲。力是一个加速度，单位是每秒像素每秒。将力乘以100000，使数值使用更合理
         * @param force
         */
        addImpulse(force) {
            if (!this.isImmovable) {
                this.velocity.addEqual(force.scale(100000 * (this._inverseMass * (es.Time.deltaTime * es.Time.deltaTime))));
            }
        }
        onAddedToEntity() {
            this._collider = null;
            for (let i = 0; i < this.entity.components.buffer.length; i++) {
                let component = this.entity.components.buffer[i];
                if (component instanceof es.Collider) {
                    this._collider = component;
                    break;
                }
            }
            es.Debug.warnIf(this._collider == null, "ArcadeRigidbody 没有 Collider。ArcadeRigidbody需要一个Collider!");
        }
        update() {
            if (this.isImmovable || this._collider == null) {
                this.velocity = es.Vector2.zero;
                return;
            }
            if (this.shouldUseGravity)
                this.velocity.addEqual(es.Physics.gravity.scale(es.Time.deltaTime));
            this.entity.position = this.entity.position.add(this.velocity.scale(es.Time.deltaTime));
            // 捞取我们在新的位置上可能会碰撞到的任何东西
            let neighbors = es.Physics.boxcastBroadphaseExcludingSelf(this._collider, this._collider.bounds, this._collider.collidesWithLayers.value);
            if (neighbors.length > 0) {
                for (let i = 0; i < neighbors.length; i++) {
                    const neighbor = neighbors[i];
                    if (!neighbor)
                        continue;
                    // 如果邻近的对撞机是同一个实体，则忽略它
                    if (neighbor.entity.equals(this.entity)) {
                        continue;
                    }
                    const collisionResult = new es.Out();
                    if (this._collider.collidesWithNonMotion(neighbor, collisionResult)) {
                        // 如果附近有一个ArcadeRigidbody，我们就会处理完整的碰撞响应。如果没有，我们会根据附近是不可移动的来计算事情
                        let neighborRigidbody = neighbor.entity.getComponent(ArcadeRigidbody);
                        if (neighborRigidbody != null) {
                            this.processOverlap(neighborRigidbody, collisionResult.value.minimumTranslationVector);
                            this.processCollision(neighborRigidbody, collisionResult.value.minimumTranslationVector);
                        }
                        else {
                            // 没有ArcadeRigidbody，所以我们假设它是不动的，只移动我们自己的
                            this.entity.position = this.entity.position.sub(collisionResult.value.minimumTranslationVector);
                            const relativeVelocity = this.calculateResponseVelocity(this.velocity, collisionResult.value.minimumTranslationVector);
                            this.velocity.addEqual(relativeVelocity);
                        }
                    }
                }
            }
        }
        /**
         * 将两个重叠的刚体分开。也处理其中一个不可移动的情况
         * @param other
         * @param minimumTranslationVector
         */
        processOverlap(other, minimumTranslationVector) {
            if (this.isImmovable) {
                other.entity.position = other.entity.position.add(minimumTranslationVector);
            }
            else if (other.isImmovable) {
                this.entity.position = this.entity.position.sub(minimumTranslationVector);
            }
            else {
                this.entity.position = this.entity.position.sub(minimumTranslationVector.scale(0.5));
                other.entity.position = other.entity.position.add(minimumTranslationVector.scale(0.5));
            }
        }
        /**
         * 处理两个非重叠的刚体的碰撞。新的速度将根据情况分配给每个刚体
         * @param other
         * @param minimumTranslationVector
         */
        processCollision(other, minimumTranslationVector) {
            // 我们计算两个相撞物体的响应。
            // 计算的基础是沿碰撞表面法线反射的物体的相对速度。
            // 然后，响应的一部分会根据质量加到每个物体上
            let relativeVelocity = this.velocity.sub(other.velocity);
            relativeVelocity = this.calculateResponseVelocity(relativeVelocity, minimumTranslationVector);
            // 现在，我们使用质量来线性缩放两个刚体上的响应
            const totalinverseMass = this._inverseMass + other._inverseMass;
            const ourResponseFraction = this._inverseMass / totalinverseMass;
            const otherResponseFraction = other._inverseMass / totalinverseMass;
            this.velocity = this.velocity.add(relativeVelocity.scale(ourResponseFraction));
            other.velocity = other.velocity.sub(relativeVelocity.scale(otherResponseFraction));
        }
        /**
         *  给定两个物体和MTV之间的相对速度，本方法修改相对速度，使其成为碰撞响应
         * @param relativeVelocity
         * @param minimumTranslationVector
         * @param responseVelocity
         */
        calculateResponseVelocity(relativeVelocity, minimumTranslationVector) {
            // 首先，我们得到反方向的归一化MTV：表面法线
            let inverseMTV = minimumTranslationVector.scale(-1);
            let normal = inverseMTV.normalize();
            // 速度是沿碰撞法线和碰撞平面分解的。
            // 弹性将影响沿法线的响应（法线速度分量），摩擦力将影响速度的切向分量（切向速度分量）
            let n = relativeVelocity.dot(normal);
            let normalVelocityComponent = normal.scale(n);
            let tangentialVelocityComponent = relativeVelocity.sub(normalVelocityComponent);
            if (n > 0)
                normalVelocityComponent = es.Vector2.zero;
            // 如果切向分量的平方幅度小于glue，那么我们就把摩擦力提升到最大
            let coefficientOfFriction = this._friction;
            if (tangentialVelocityComponent.lengthSquared() < this._glue)
                coefficientOfFriction = 1.01;
            // 弹性影响速度的法向分量，摩擦力影响速度的切向分量
            return normalVelocityComponent
                .scale(1 + this._elasticity)
                .sub(tangentialVelocityComponent.scale(coefficientOfFriction))
                .scale(-1);
        }
    }
    es.ArcadeRigidbody = ArcadeRigidbody;
})(es || (es = {}));
var es;
(function (es) {
    class CharacterRaycastOrigins {
        constructor() {
            this.topLeft = es.Vector2.zero;
            this.bottomRight = es.Vector2.zero;
            this.bottomLeft = es.Vector2.zero;
        }
    }
    class CharacterCollisionState2D {
        constructor() {
            this.right = false;
            this.left = false;
            this.above = false;
            this.below = false;
            this.becameGroundedThisFrame = false;
            this.wasGroundedLastFrame = false;
            this.movingDownSlope = false;
            this.slopeAngle = 0;
        }
        hasCollision() {
            return this.below || this.right || this.left || this.above;
        }
        reset() {
            this.right = this.left = false;
            this.above = this.below = false;
            this.becameGroundedThisFrame = this.movingDownSlope = false;
            this.slopeAngle = 0;
        }
        toString() {
            return `[CharacterCollisionState2D] r: ${this.right}, l: ${this.left}, a: ${this.above}, b: ${this.below}, movingDownSlope: ${this.movingDownSlope}, angle: ${this.slopeAngle}, wasGroundedLastFrame: ${this.wasGroundedLastFrame}, becameGroundedThisFrame: ${this.becameGroundedThisFrame}`;
        }
    }
    class CharacterController {
        /**
         * 定义距离碰撞射线的边缘有多远。
         * 如果使用 0 范围进行投射，则通常会导致不需要的光线击中（例如，直接从表面水平投射的足部碰撞器可能会导致击中）
         */
        get skinWidth() {
            return this._skinWidth;
        }
        set skinWidth(value) {
            this._skinWidth = value;
            this.recalculateDistanceBetweenRays();
        }
        get isGrounded() {
            return this.collisionState.below;
        }
        get raycastHitsThisFrame() {
            return this._raycastHitsThisFrame;
        }
        constructor(player, skinWidth, platformMask = -1, onewayPlatformMask = -1, triggerMask = -1) {
            this.ignoredColliders = new Set();
            /**
             * CC2D 可以爬升的最大坡度角
             */
            this.slopeLimit = 30;
            /**
             * 构成跳跃的帧之间垂直运动变化的阈值
             */
            this.jumpingThreshold = -7;
            this.totalHorizontalRays = 5;
            this.totalVerticalRays = 3;
            this.collisionState = new CharacterCollisionState2D();
            this.velocity = new es.Vector2(0, 0);
            this._skinWidth = 0.02;
            this.kSkinWidthFloatFudgeFactor = 0.001;
            /**
             * 我们的光线投射原点角的支架（TR、TL、BR、BL）
             */
            this._raycastOrigins = new CharacterRaycastOrigins();
            /**
             * 存储我们在移动过程中命中的光线投射
             */
            this._raycastHit = new es.RaycastHit();
            /**
             * 我们使用这个标志来标记我们正在爬坡的情况，我们修改了 delta.y 以允许爬升。
             * 原因是，如果我们到达斜坡的尽头，我们可以进行调整以保持接地
             */
            this._isGoingUpSlope = false;
            this._isWarpingToGround = true;
            this.platformMask = -1;
            this.triggerMask = -1;
            this.oneWayPlatformMask = -1;
            this.rayOriginSkinMutiplier = 4;
            this.onTriggerEnterEvent = new es.ObservableT();
            this.onTriggerExitEvent = new es.ObservableT();
            this.onControllerCollidedEvent = new es.ObservableT();
            this.platformMask = platformMask;
            this.oneWayPlatformMask = onewayPlatformMask;
            this.triggerMask = triggerMask;
            // 将我们的单向平台添加到我们的普通平台掩码中，以便我们可以从上方降落 
            this.platformMask |= this.oneWayPlatformMask;
            this._player = player;
            let collider = null;
            for (let i = 0; i < this._player.components.buffer.length; i++) {
                let component = this._player.components.buffer[i];
                if (component instanceof es.Collider) {
                    collider = component;
                    break;
                }
            }
            collider.isTrigger = false;
            if (collider instanceof es.BoxCollider) {
                this._collider = collider;
            }
            else {
                throw new Error('player collider must be box');
            }
            // 在这里，我们触发了具有主体的 setter 的属性 
            this.skinWidth = skinWidth || collider.width * 0.05;
            this._slopeLimitTangent = Math.tan(75 * es.MathHelper.Deg2Rad);
            this._triggerHelper = new es.ColliderTriggerHelper(this._player);
            // 我们想设置我们的 CC2D 忽略所有碰撞层，除了我们的 triggerMask 
            for (let i = 0; i < 32; i++) {
                // 查看我们的 triggerMask 是否包含此层，如果不包含则忽略它 
                if ((this.triggerMask & (1 << i)) === 0) {
                    es.Flags.unsetFlag(this._collider.collidesWithLayers, i);
                }
            }
        }
        onTriggerEnter(other, local) {
            this.onTriggerEnterEvent.notify(other);
        }
        onTriggerExit(other, local) {
            this.onTriggerExitEvent.notify(other);
        }
        /**
         * 尝试将角色移动到位置 + deltaMovement。 任何挡路的碰撞器都会在遇到时导致运动停止
         * @param deltaMovement
         * @param deltaTime
         */
        move(deltaMovement, deltaTime) {
            this.collisionState.wasGroundedLastFrame = this.collisionState.below;
            this.collisionState.reset();
            this._raycastHitsThisFrame = [];
            this._isGoingUpSlope = false;
            this.primeRaycastOrigins();
            if (deltaMovement.y > 0 && this.collisionState.wasGroundedLastFrame) {
                deltaMovement = this.handleVerticalSlope(deltaMovement);
            }
            if (deltaMovement.x !== 0) {
                deltaMovement = this.moveHorizontally(deltaMovement);
            }
            if (deltaMovement.y !== 0) {
                deltaMovement = this.moveVertically(deltaMovement);
            }
            this._player.setPosition(this._player.position.x + deltaMovement.x, this._player.position.y + deltaMovement.y);
            if (deltaTime > 0) {
                this.velocity.x = deltaMovement.x / deltaTime;
                this.velocity.y = deltaMovement.y / deltaTime;
            }
            if (!this.collisionState.wasGroundedLastFrame &&
                this.collisionState.below) {
                this.collisionState.becameGroundedThisFrame = true;
            }
            if (this._isGoingUpSlope) {
                this.velocity.y = 0;
            }
            if (!this._isWarpingToGround) {
                this._triggerHelper.update();
            }
            for (let i = 0; i < this._raycastHitsThisFrame.length; i++) {
                this.onControllerCollidedEvent.notify(this._raycastHitsThisFrame[i]);
            }
            if (this.ignoreOneWayPlatformsTime > 0) {
                this.ignoreOneWayPlatformsTime -= deltaTime;
            }
        }
        /**
         * 直接向下移动直到接地
         * @param maxDistance
         */
        warpToGrounded(maxDistance = 1000) {
            this.ignoreOneWayPlatformsTime = 0;
            this._isWarpingToGround = true;
            let delta = 0;
            do {
                delta += 1;
                this.move(new es.Vector2(0, 1), 0.02);
                if (delta > maxDistance) {
                    break;
                }
            } while (!this.isGrounded);
            this._isWarpingToGround = false;
        }
        /**
         * 这应该在您必须在运行时修改 BoxCollider2D 的任何时候调用。
         * 它将重新计算用于碰撞检测的光线之间的距离。
         * 它也用于 skinWidth setter，以防在运行时更改。
         */
        recalculateDistanceBetweenRays() {
            const colliderUsableHeight = this._collider.height * Math.abs(this._player.scale.y) -
                2 * this._skinWidth;
            this._verticalDistanceBetweenRays =
                colliderUsableHeight / (this.totalHorizontalRays - 1);
            const colliderUsableWidth = this._collider.width * Math.abs(this._player.scale.x) -
                2 * this._skinWidth;
            this._horizontalDistanceBetweenRays =
                colliderUsableWidth / (this.totalVerticalRays - 1);
        }
        /**
         * 将 raycastOrigins 重置为由 skinWidth 插入的框碰撞器的当前范围。
         * 插入它是为了避免从直接接触另一个碰撞器的位置投射光线，从而导致不稳定的法线数据。
         */
        primeRaycastOrigins() {
            const rect = this._collider.bounds;
            this._raycastOrigins.topLeft = new es.Vector2(rect.x + this._skinWidth, rect.y + this._skinWidth);
            this._raycastOrigins.bottomRight = new es.Vector2(rect.right - this._skinWidth, rect.bottom - this._skinWidth);
            this._raycastOrigins.bottomLeft = new es.Vector2(rect.x + this._skinWidth, rect.bottom - this._skinWidth);
        }
        /**
         * 我们必须在这方面使用一些技巧。
         * 光线必须从我们的碰撞器（skinWidth）内部的一小段距离投射，以避免零距离光线会得到错误的法线。
         * 由于这个小偏移，我们必须增加光线距离 skinWidth 然后记住在实际移动玩家之前从 deltaMovement 中删除 skinWidth
         * @param deltaMovement
         * @returns
         */
        moveHorizontally(deltaMovement) {
            const isGoingRight = deltaMovement.x > 0;
            let rayDistance = Math.abs(deltaMovement.x) +
                this._skinWidth * this.rayOriginSkinMutiplier;
            const rayDirection = isGoingRight ? es.Vector2.right : es.Vector2.left;
            const initialRayOriginY = this._raycastOrigins.bottomLeft.y;
            const initialRayOriginX = isGoingRight
                ? this._raycastOrigins.bottomRight.x -
                    this._skinWidth * (this.rayOriginSkinMutiplier - 1)
                : this._raycastOrigins.bottomLeft.x +
                    this._skinWidth * (this.rayOriginSkinMutiplier - 1);
            for (let i = 0; i < this.totalHorizontalRays; i++) {
                const ray = new es.Vector2(initialRayOriginX, initialRayOriginY - i * this._verticalDistanceBetweenRays);
                // 如果我们接地，我们将只在第一条射线（底部）上包含 oneWayPlatforms。 
                // 允许我们走上倾斜的 oneWayPlatforms 
                if (i === 0 &&
                    this.supportSlopedOneWayPlatforms &&
                    this.collisionState.wasGroundedLastFrame) {
                    this._raycastHit = es.Physics.linecast(ray, ray.add(rayDirection.scaleEqual(rayDistance)), this.platformMask, this.ignoredColliders);
                }
                else {
                    this._raycastHit = es.Physics.linecast(ray, ray.add(rayDirection.scaleEqual(rayDistance)), this.platformMask & ~this.oneWayPlatformMask, this.ignoredColliders);
                }
                if (this._raycastHit.collider) {
                    if (i === 0 &&
                        this.handleHorizontalSlope(deltaMovement, es.Vector2.unsignedAngle(this._raycastHit.normal, es.Vector2.up))) {
                        this._raycastHitsThisFrame.push(this._raycastHit);
                        break;
                    }
                    deltaMovement.x = this._raycastHit.point.x - ray.x;
                    rayDistance = Math.abs(deltaMovement.x);
                    if (isGoingRight) {
                        deltaMovement.x -= this._skinWidth * this.rayOriginSkinMutiplier;
                        this.collisionState.right = true;
                    }
                    else {
                        deltaMovement.x += this._skinWidth * this.rayOriginSkinMutiplier;
                        this.collisionState.left = true;
                    }
                    this._raycastHitsThisFrame.push(this._raycastHit);
                    if (rayDistance <
                        this._skinWidth * this.rayOriginSkinMutiplier +
                            this.kSkinWidthFloatFudgeFactor) {
                        break;
                    }
                }
            }
            return deltaMovement;
        }
        moveVertically(deltaMovement) {
            const isGoingUp = deltaMovement.y < 0;
            let rayDistance = Math.abs(deltaMovement.y) +
                this._skinWidth * this.rayOriginSkinMutiplier;
            const rayDirection = isGoingUp ? es.Vector2.up : es.Vector2.down;
            let initialRayOriginX = this._raycastOrigins.topLeft.x;
            const initialRayOriginY = isGoingUp
                ? this._raycastOrigins.topLeft.y +
                    this._skinWidth * (this.rayOriginSkinMutiplier - 1)
                : this._raycastOrigins.bottomLeft.y -
                    this._skinWidth * (this.rayOriginSkinMutiplier - 1);
            initialRayOriginX += deltaMovement.x;
            let mask = this.platformMask;
            if (isGoingUp || this.ignoreOneWayPlatformsTime > 0) {
                mask &= ~this.oneWayPlatformMask;
            }
            for (let i = 0; i < this.totalVerticalRays; i++) {
                const rayStart = new es.Vector2(initialRayOriginX + i * this._horizontalDistanceBetweenRays, initialRayOriginY);
                this._raycastHit = es.Physics.linecast(rayStart, rayStart.add(rayDirection.scaleEqual(rayDistance)), mask, this.ignoredColliders);
                if (this._raycastHit.collider) {
                    deltaMovement.y = this._raycastHit.point.y - rayStart.y;
                    rayDistance = Math.abs(deltaMovement.y);
                    if (isGoingUp) {
                        deltaMovement.y += this._skinWidth * this.rayOriginSkinMutiplier;
                        this.collisionState.above = true;
                    }
                    else {
                        deltaMovement.y -= this._skinWidth * this.rayOriginSkinMutiplier;
                        this.collisionState.below = true;
                    }
                    this._raycastHitsThisFrame.push(this._raycastHit);
                    if (!isGoingUp && deltaMovement.y < -0.00001) {
                        this._isGoingUpSlope = true;
                    }
                    if (rayDistance <
                        this._skinWidth * this.rayOriginSkinMutiplier +
                            this.kSkinWidthFloatFudgeFactor) {
                        break;
                    }
                }
            }
            return deltaMovement;
        }
        /**
         * 检查 BoxCollider2D 下的中心点是否存在坡度。
         * 如果找到一个，则调整 deltaMovement 以便玩家保持接地，并考虑slopeSpeedModifier 以加快移动速度。
         * @param deltaMovement
         * @returns
         */
        handleVerticalSlope(deltaMovement) {
            const centerOfCollider = (this._raycastOrigins.bottomLeft.x +
                this._raycastOrigins.bottomRight.x) *
                0.5;
            const rayDirection = es.Vector2.down;
            const slopeCheckRayDistance = this._slopeLimitTangent *
                (this._raycastOrigins.bottomRight.x - centerOfCollider);
            const slopeRay = new es.Vector2(centerOfCollider, this._raycastOrigins.bottomLeft.y);
            this._raycastHit = es.Physics.linecast(slopeRay, slopeRay.add(rayDirection.scaleEqual(slopeCheckRayDistance)), this.platformMask, this.ignoredColliders);
            if (this._raycastHit.collider) {
                const angle = es.Vector2.unsignedAngle(this._raycastHit.normal, es.Vector2.up);
                if (angle === 0) {
                    return deltaMovement;
                }
                const isMovingDownSlope = Math.sign(this._raycastHit.normal.x) === Math.sign(deltaMovement.x);
                if (isMovingDownSlope) {
                    const slopeModifier = this.slopeSpeedMultiplier
                        ? this.slopeSpeedMultiplier.lerp(-angle)
                        : 1;
                    deltaMovement.y +=
                        this._raycastHit.point.y - slopeRay.y - this.skinWidth;
                    deltaMovement.x *= slopeModifier;
                    this.collisionState.movingDownSlope = true;
                    this.collisionState.slopeAngle = angle;
                }
            }
            return deltaMovement;
        }
        /**
         * 如果我们要上坡，则处理调整 deltaMovement
         * @param deltaMovement
         * @param angle
         * @returns
         */
        handleHorizontalSlope(deltaMovement, angle) {
            if (Math.round(angle) === 90) {
                return false;
            }
            if (angle < this.slopeLimit) {
                if (deltaMovement.y > this.jumpingThreshold) {
                    const slopeModifier = this.slopeSpeedMultiplier
                        ? this.slopeSpeedMultiplier.lerp(angle)
                        : 1;
                    deltaMovement.x *= slopeModifier;
                    deltaMovement.y = Math.abs(Math.tan(angle * es.MathHelper.Deg2Rad) * deltaMovement.x);
                    const isGoingRight = deltaMovement.x > 0;
                    const ray = isGoingRight
                        ? this._raycastOrigins.bottomRight
                        : this._raycastOrigins.bottomLeft;
                    let raycastHit = null;
                    if (this.supportSlopedOneWayPlatforms &&
                        this.collisionState.wasGroundedLastFrame) {
                        raycastHit = es.Physics.linecast(ray, ray.add(deltaMovement), this.platformMask, this.ignoredColliders);
                    }
                    else {
                        raycastHit = es.Physics.linecast(ray, ray.add(deltaMovement), this.platformMask & ~this.oneWayPlatformMask, this.ignoredColliders);
                    }
                    if (raycastHit.collider) {
                        deltaMovement.x = raycastHit.point.x - ray.x;
                        deltaMovement.y = raycastHit.point.y - ray.y;
                        if (isGoingRight) {
                            deltaMovement.x -= this._skinWidth;
                        }
                        else {
                            deltaMovement.x += this._skinWidth;
                        }
                    }
                    this._isGoingUpSlope = true;
                    this.collisionState.below = true;
                }
            }
            else {
                deltaMovement.x = 0;
            }
            return true;
        }
    }
    es.CharacterController = CharacterController;
})(es || (es = {}));
var es;
(function (es) {
    class TriggerListenerHelper {
        static getITriggerListener(entity, components) {
            if (entity.components._components.length > 0) {
                for (let i = 0; i < entity.components._components.length; i++) {
                    const component = entity.components._components[i];
                    if (es.isITriggerListener(component)) {
                        components.push(component);
                    }
                }
            }
            for (let i in entity.components._componentsToAdd) {
                let component = entity.components._componentsToAdd[i];
                if (es.isITriggerListener(component)) {
                    components.push(component);
                }
            }
            return components;
        }
    }
    es.TriggerListenerHelper = TriggerListenerHelper;
    es.isITriggerListener = (props) => typeof props['onTriggerEnter'] !== 'undefined';
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 辅助类说明了一种处理移动的方法，它考虑了包括触发器在内的所有冲突。
     * ITriggerListener接口用于管理对移动过程中违反的任何触发器的回调。
     * 一个物体只能通过移动器移动。要正确报告触发器的move方法。
     *
     * 请注意，多个移动者相互交互将多次调用ITriggerListener。
     */
    class Mover extends es.Component {
        onAddedToEntity() {
            this._triggerHelper = new es.ColliderTriggerHelper(this.entity);
        }
        /**
         * 计算修改运动矢量的运动，以考虑移动时可能发生的碰撞
         * @param motion
         * @param collisionResult
         */
        calculateMovement(motion, collisionResult) {
            collisionResult.value = new es.CollisionResult();
            let collider = null;
            if (this.entity.components.buffer.length > 0)
                for (let i = 0; i < this.entity.components.buffer.length; i++) {
                    let component = this.entity.components.buffer[i];
                    if (component instanceof es.Collider) {
                        collider = component;
                        break;
                    }
                }
            if (collider == null || this._triggerHelper == null) {
                return false;
            }
            // 移动所有的非触发碰撞器并获得最近的碰撞
            let colliders = [];
            if (this.entity.components.buffer.length > 0)
                for (let i = 0; i < this.entity.components.buffer.length; i++) {
                    let component = this.entity.components.buffer[i];
                    if (component instanceof es.Collider) {
                        colliders.push(component);
                    }
                }
            if (colliders.length > 0) {
                for (let i = 0; i < colliders.length; i++) {
                    let collider = colliders[i];
                    // 不检测触发器 在我们移动后会重新访问它
                    if (collider.isTrigger)
                        continue;
                    // 获取我们在新位置可能发生碰撞的任何东西
                    let bounds = collider.bounds;
                    bounds.x += motion.x;
                    bounds.y += motion.y;
                    let neighbors = es.Physics.boxcastBroadphaseExcludingSelf(collider, bounds, collider.collidesWithLayers.value);
                    if (neighbors.length > 0) {
                        for (let i = 0; i < neighbors.length; i++) {
                            const neighbor = neighbors[i];
                            // 不检测触发器
                            if (neighbor.isTrigger)
                                return;
                            let _internalcollisionResult = new es.Out();
                            if (collider.collidesWith(neighbor, motion, _internalcollisionResult)) {
                                // 如果碰撞 则退回之前的移动量
                                motion.subEqual(_internalcollisionResult.value.minimumTranslationVector);
                                // 如果我们碰到多个对象，为了简单起见，只取第一个。
                                if (_internalcollisionResult.value.collider != null) {
                                    collisionResult.value.collider = _internalcollisionResult.value.collider;
                                    collisionResult.value.minimumTranslationVector = _internalcollisionResult.value.minimumTranslationVector;
                                    collisionResult.value.normal = _internalcollisionResult.value.normal;
                                    collisionResult.value.point = _internalcollisionResult.value.point;
                                }
                            }
                        }
                    }
                }
            }
            es.ListPool.free(es.Collider, colliders);
            return collisionResult.value.collider != null;
        }
        /**
         *  将calculatemomovement应用到实体并更新triggerHelper
         * @param motion
         */
        applyMovement(motion) {
            // 移动实体到它的新位置，如果我们有一个碰撞，否则移动全部数量。当碰撞发生时，运动被更新
            this.entity.position = es.Vector2.add(this.entity.position, motion);
            // 对所有是触发器的碰撞器与所有宽相位碰撞器进行重叠检查。任何重叠都会导致触发事件。
            if (this._triggerHelper)
                this._triggerHelper.update();
        }
        /**
         * 通过调用calculateMovement和applyMovement来移动考虑碰撞的实体;
         * @param motion
         * @param collisionResult
         */
        move(motion, collisionResult) {
            this.calculateMovement(motion, collisionResult);
            this.applyMovement(motion);
            return collisionResult.value.collider != null;
        }
    }
    es.Mover = Mover;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 移动时考虑到碰撞，只用于向任何ITriggerListeners报告。
     * 物体总是会全量移动，所以如果需要的话，由调用者在撞击时销毁它。
     */
    class ProjectileMover extends es.Component {
        constructor() {
            super(...arguments);
            this._tempTriggerList = [];
        }
        onAddedToEntity() {
            let collider = null;
            for (let i = 0; i < this.entity.components.buffer.length; i++) {
                let component = this.entity.components.buffer[i];
                if (component instanceof es.Collider) {
                    collider = component;
                    break;
                }
            }
            this._collider = collider;
            es.Debug.warnIf(this._collider == null, "ProjectileMover没有Collider。ProjectilMover需要一个Collider!");
        }
        /**
         * 在考虑到碰撞的情况下移动实体
         * @param motion
         */
        move(motion) {
            if (this._collider == null)
                return false;
            let didCollide = false;
            // 获取我们在新的位置上可能会碰撞到的任何东西
            this.entity.position = es.Vector2.add(this.entity.position, motion);
            // 获取任何可能在新位置发生碰撞的东西
            let neighbors = es.Physics.boxcastBroadphase(this._collider.bounds, this._collider.collidesWithLayers.value);
            if (neighbors.length > 0)
                for (let i = 0; i < neighbors.length; i++) {
                    const neighbor = neighbors[i];
                    if (this._collider.overlaps(neighbor) && neighbor.enabled) {
                        didCollide = true;
                        this.notifyTriggerListeners(this._collider, neighbor);
                    }
                }
            return didCollide;
        }
        notifyTriggerListeners(self, other) {
            // 通知我们重叠的碰撞器实体上的任何侦听器
            es.TriggerListenerHelper.getITriggerListener(other.entity, this._tempTriggerList);
            for (let i = 0; i < this._tempTriggerList.length; i++) {
                this._tempTriggerList[i].onTriggerEnter(self, other);
            }
            this._tempTriggerList.length = 0;
            // 通知此实体上的任何侦听器
            es.TriggerListenerHelper.getITriggerListener(this.entity, this._tempTriggerList);
            for (let i = 0; i < this._tempTriggerList.length; i++) {
                this._tempTriggerList[i].onTriggerEnter(other, self);
            }
            this._tempTriggerList.length = 0;
        }
    }
    es.ProjectileMover = ProjectileMover;
})(es || (es = {}));
var es;
(function (es) {
    class Collider extends es.Component {
        constructor() {
            super(...arguments);
            this.castSortOrder = 0;
            /**
             * 如果这个碰撞器是一个触发器，它将不会引起碰撞，但它仍然会触发事件
             */
            this.isTrigger = false;
            /**
             * 在处理冲突时，physicsLayer可以用作过滤器。Flags类有帮助位掩码的方法
             */
            this.physicsLayer = new es.Ref(1 << 0);
            /**
             * 碰撞器在使用移动器移动时应该碰撞的层
             * 默认为所有层
             */
            this.collidesWithLayers = new es.Ref(es.Physics.allLayers);
            /**
             * 如果为true，碰撞器将根据附加的变换缩放和旋转
             */
            this.shouldColliderScaleAndRotateWithTransform = true;
            /**
             * 这个对撞机在物理系统注册时的边界。
             * 存储这个允许我们始终能够安全地从物理系统中移除对撞机，即使它在试图移除它之前已经被移动了。
             */
            this.registeredPhysicsBounds = new es.Rectangle();
            this._isPositionDirty = true;
            this._isRotationDirty = true;
            this._localOffset = es.Vector2.zero;
        }
        /**
         * 表示碰撞器的绝对位置
         */
        get absolutePosition() {
            return es.Vector2.add(this.entity.transform.position, this._localOffset);
        }
        /**
         * 封装变换。如果碰撞器没和实体一起旋转 则返回transform.rotation
         */
        get rotation() {
            if (this.shouldColliderScaleAndRotateWithTransform && this.entity != null)
                return this.entity.transform.rotation;
            return 0;
        }
        get bounds() {
            if (this._isPositionDirty || this._isRotationDirty) {
                this.shape.recalculateBounds(this);
                this._isPositionDirty = this._isRotationDirty = false;
            }
            return this.shape.bounds;
        }
        /**
         * 将localOffset添加到实体。获取碰撞器几何图形的最终位置。
         * 允许向一个实体添加多个碰撞器并分别定位，还允许你设置缩放/旋转
         */
        get localOffset() {
            return this._localOffset;
        }
        /**
         * 将localOffset添加到实体。获取碰撞器几何图形的最终位置。
         * 允许向一个实体添加多个碰撞器并分别定位，还允许你设置缩放/旋转
         * @param value
         */
        set localOffset(value) {
            this.setLocalOffset(value);
        }
        /**
         * 将localOffset添加到实体。获取碰撞器的最终位置。
         * 这允许您向一个实体添加多个碰撞器并分别定位它们。
         * @param offset
         */
        setLocalOffset(offset) {
            if (!this._localOffset.equals(offset)) {
                this.unregisterColliderWithPhysicsSystem();
                this._localOffset.setTo(offset.x, offset.y);
                this._localOffsetLength = this._localOffset.magnitude();
                this._isPositionDirty = true;
                this.registerColliderWithPhysicsSystem();
            }
            return this;
        }
        /**
         * 如果为true，碰撞器将根据附加的变换缩放和旋转
         * @param shouldColliderScaleAndRotationWithTransform
         */
        setShouldColliderScaleAndRotateWithTransform(shouldColliderScaleAndRotationWithTransform) {
            this.shouldColliderScaleAndRotateWithTransform = shouldColliderScaleAndRotationWithTransform;
            this._isPositionDirty = this._isRotationDirty = true;
            return this;
        }
        onAddedToEntity() {
            this._isParentEntityAddedToScene = true;
            this.registerColliderWithPhysicsSystem();
        }
        onRemovedFromEntity() {
            this.unregisterColliderWithPhysicsSystem();
            this._isParentEntityAddedToScene = false;
        }
        onEntityTransformChanged(comp) {
            switch (comp) {
                case es.ComponentTransform.position:
                    this._isPositionDirty = true;
                    break;
                case es.ComponentTransform.scale:
                    this._isPositionDirty = true;
                    break;
                case es.ComponentTransform.rotation:
                    this._isRotationDirty = true;
                    break;
            }
            if (this._isColliderRegistered)
                es.Physics.updateCollider(this);
        }
        onEnabled() {
            this.registerColliderWithPhysicsSystem();
            this._isPositionDirty = this._isRotationDirty = true;
        }
        onDisabled() {
            this.unregisterColliderWithPhysicsSystem();
        }
        /**
         * 父实体会在不同的时间调用它(当添加到场景，启用，等等)
         */
        registerColliderWithPhysicsSystem() {
            // 如果在将我们添加到实体之前更改了origin等属性，则实体可以为null
            if (this._isParentEntityAddedToScene && !this._isColliderRegistered) {
                es.Physics.addCollider(this);
                this._isColliderRegistered = true;
            }
        }
        /**
         * 父实体会在不同的时候调用它(从场景中移除，禁用，等等)
         */
        unregisterColliderWithPhysicsSystem() {
            if (this._isParentEntityAddedToScene && this._isColliderRegistered) {
                es.Physics.removeCollider(this);
            }
            this._isColliderRegistered = false;
        }
        /**
         * 检查这个形状是否与物理系统中的其他对撞机重叠
         * @param other
         */
        overlaps(other) {
            return this.shape.overlaps(other.shape);
        }
        /**
         * 检查这个与运动应用的碰撞器(移动向量)是否与碰撞器碰撞。如果是这样，将返回true，并且结果将填充碰撞数据。
         * @param collider
         * @param motion
         * @param result
         */
        collidesWith(collider, motion, result) {
            // 改变形状的位置，使它在移动后的位置，这样我们可以检查重叠
            const oldPosition = this.entity.position;
            this.entity.position = this.entity.position.add(motion);
            const didCollide = this.shape.collidesWithShape(collider.shape, result);
            if (didCollide)
                result.value.collider = collider;
            // 将图形位置返回到检查前的位置
            this.entity.position = oldPosition;
            return didCollide;
        }
        /**
         * 检查这个对撞机是否与对撞机发生碰撞。如果碰撞，则返回true，结果将被填充
         * @param collider
         * @param result
         */
        collidesWithNonMotion(collider, result) {
            if (this.shape.collidesWithShape(collider.shape, result)) {
                result.value.collider = collider;
                return true;
            }
            result.value.collider = null;
            return false;
        }
        /**
         * 检查此碰撞器是否已应用运动（增量运动矢量）与任何碰撞器发生碰撞。
         * 如果是这样，则将返回true，并且将使用碰撞数据填充结果。 运动将设置为碰撞器在碰撞之前可以行进的最大距离。
         * @param motion
         * @param result
         */
        collidesWithAny(motion, result) {
            result.value = new es.CollisionResult();
            // 在我们的新位置上获取我们可能会碰到的任何东西 
            let colliderBounds = this.bounds.clone();
            colliderBounds.x += motion.x;
            colliderBounds.y += motion.y;
            let neighbors = es.Physics.boxcastBroadphaseExcludingSelf(this, colliderBounds, this.collidesWithLayers.value);
            // 更改形状位置，使其处于移动后的位置，以便我们检查是否有重叠 
            let oldPosition = this.shape.position;
            this.shape.position = es.Vector2.add(this.shape.position, motion);
            let didCollide = false;
            for (let i = 0; i < neighbors.length; i++) {
                const neighbor = neighbors[i];
                if (neighbor.isTrigger)
                    continue;
                if (this.collidesWithNonMotion(neighbor, result)) {
                    motion = motion.sub(result.value.minimumTranslationVector);
                    this.shape.position = this.shape.position.sub(result.value.minimumTranslationVector);
                    didCollide = true;
                }
            }
            // 将形状位置返回到检查之前的位置 
            this.shape.position = oldPosition;
            return didCollide;
        }
        /**
         * 检查此碰撞器是否与场景中的其他碰撞器碰撞。它相交的第一个碰撞器将在碰撞结果中返回碰撞数据。
         * @param result
         */
        collidesWithAnyNonMotion(result) {
            result.value = new es.CollisionResult();
            // 在我们的新位置上获取我们可能会碰到的任何东西 
            let neighbors = es.Physics.boxcastBroadphaseExcludingSelfNonRect(this, this.collidesWithLayers.value);
            for (let neighbor of neighbors) {
                if (neighbor.isTrigger)
                    continue;
                if (this.collidesWithNonMotion(neighbor, result))
                    return true;
            }
            return false;
        }
    }
    Collider.lateSortOrder = 999;
    es.Collider = Collider;
})(es || (es = {}));
///<reference path="./Collider.ts" />
var es;
///<reference path="./Collider.ts" />
(function (es) {
    class BoxCollider extends es.Collider {
        /**
         * 创建一个BoxCollider，并使用x/y组件作为局部Offset
         * @param x
         * @param y
         * @param width
         * @param height
         */
        constructor(x = 0, y = 0, width = 1, height = 1) {
            super();
            this._localOffset = new es.Vector2(x + width / 2, y + height / 2);
            this.shape = new es.Box(width, height);
        }
        get width() {
            return this.shape.width;
        }
        set width(value) {
            this.setWidth(value);
        }
        get height() {
            return this.shape.height;
        }
        set height(value) {
            this.setHeight(value);
        }
        /**
         * 设置BoxCollider的大小
         * @param width
         * @param height
         */
        setSize(width, height) {
            let box = this.shape;
            if (width != box.width || height != box.height) {
                // 更新框，改变边界，如果我们需要更新物理系统中的边界
                box.updateBox(width, height);
                this._isPositionDirty = true;
                if (this.entity && this._isParentEntityAddedToScene)
                    es.Physics.updateCollider(this);
            }
            return this;
        }
        /**
         * 设置BoxCollider的宽度
         * @param width
         */
        setWidth(width) {
            let box = this.shape;
            if (width != box.width) {
                // 更新框，改变边界，如果我们需要更新物理系统中的边界
                box.updateBox(width, box.height);
                this._isPositionDirty = true;
                if (this.entity != null && this._isParentEntityAddedToScene)
                    es.Physics.updateCollider(this);
            }
            return this;
        }
        /**
         * 设置BoxCollider的高度
         * @param height
         */
        setHeight(height) {
            let box = this.shape;
            if (height != box.height) {
                // 更新框，改变边界，如果我们需要更新物理系统中的边界
                box.updateBox(box.width, height);
                this._isPositionDirty = true;
                if (this.entity && this._isParentEntityAddedToScene)
                    es.Physics.updateCollider(this);
            }
        }
        toString() {
            return `[BoxCollider: bounds: ${this.bounds}]`;
        }
    }
    es.BoxCollider = BoxCollider;
})(es || (es = {}));
var es;
(function (es) {
    class CircleCollider extends es.Collider {
        /**
         * 创建一个具有半径的CircleCollider。
         * 请注意，当指定半径时，如果在实体上使用RenderableComponent，您将需要设置原点来对齐CircleCollider。
         * 例如，如果RenderableComponent有一个0,0的原点，并且创建了一个半径为1.5f * renderable.width的CircleCollider，你可以通过设置originNormalied为中心除以缩放尺寸来偏移原点
         *
         * @param radius
         */
        constructor(radius = 1) {
            super();
            this.shape = new es.Circle(radius);
        }
        get radius() {
            return this.shape.radius;
        }
        set radius(value) {
            this.setRadius(value);
        }
        /**
         * 设置圆的半径
         * @param radius
         */
        setRadius(radius) {
            let circle = this.shape;
            if (radius != circle.radius) {
                circle.radius = radius;
                circle._originalRadius = radius;
                this._isPositionDirty = true;
                if (this.entity != null && this._isParentEntityAddedToScene)
                    es.Physics.updateCollider(this);
            }
            return this;
        }
        toString() {
            return `[CircleCollider: bounds: ${this.bounds}, radius: ${this.shape.radius}]`;
        }
    }
    es.CircleCollider = CircleCollider;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 多边形应该以顺时针方式定义
     */
    class PolygonCollider extends es.Collider {
        /**
         * 如果这些点没有居中，它们将以localOffset的差异为居中。
         * @param points
         */
        constructor(points) {
            super();
            // 第一点和最后一点决不能相同。我们想要一个开放的多边形
            let isPolygonClosed = points[0] == points[points.length - 1];
            // 最后一个移除
            if (isPolygonClosed)
                points = points.slice(0, points.length - 1);
            let center = es.Polygon.findPolygonCenter(points);
            this.setLocalOffset(center);
            es.Polygon.recenterPolygonVerts(points);
            this.shape = new es.Polygon(points);
        }
    }
    es.PolygonCollider = PolygonCollider;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 扇形碰撞器
     */
    class SectorCollider extends es.Collider {
        constructor(center, radius, startAngle, endAngle) {
            super();
            this.shape = new es.Sector(center, radius, startAngle, endAngle);
        }
    }
    es.SectorCollider = SectorCollider;
})(es || (es = {}));
var es;
(function (es) {
    function decode(key) {
        switch (typeof key) {
            case "boolean":
                return "" + key;
            case "number":
                return "" + key;
            case "string":
                return "" + key;
            case "function":
                return es.getClassName(key);
            default:
                key.uuid = key.uuid ? key.uuid : es.UUID.randomUUID();
                return key.uuid;
        }
    }
    class HashMap {
        constructor() {
            this.clear();
        }
        clear() {
            this.map_ = {};
            this.keys_ = {};
        }
        values() {
            const result = [];
            const map = this.map_;
            for (const key in map) {
                result.push(map[key]);
            }
            return result;
        }
        contains(value) {
            const map = this.map_;
            for (const key in map) {
                if (value === map[key]) {
                    return true;
                }
            }
            return false;
        }
        containsKey(key) {
            return decode(key) in this.map_;
        }
        containsValue(value) {
            const map = this.map_;
            for (const key in map) {
                if (value === map[key]) {
                    return true;
                }
            }
            return false;
        }
        get(key) {
            return this.map_[decode(key)];
        }
        isEmpty() {
            return Object.keys(this.map_).length === 0;
        }
        keys() {
            const keys = this.map_;
            const result = [];
            for (const key in keys) {
                result.push(keys[key]);
            }
            return result;
        }
        /**
         * if key is a string, use as is, else use key.id_ or key.name
         */
        put(key, value) {
            const k = decode(key);
            this.map_[k] = value;
            this.keys_[k] = key;
        }
        remove(key) {
            const map = this.map_;
            const k = decode(key);
            const value = map[k];
            delete map[k];
            delete this.keys_[k];
            return value;
        }
        size() {
            return Object.keys(this.map_).length;
        }
    }
    es.HashMap = HashMap;
})(es || (es = {}));
///<reference path="../../Utils/Collections/HashMap.ts"/>
var es;
///<reference path="../../Utils/Collections/HashMap.ts"/>
(function (es) {
    /**
     * 实体系统的基类，用于处理一组实体。
     */
    class EntitySystem {
        /** 获取系统在当前帧所消耗的时间 仅在debug模式下生效 */
        get useTime() {
            return this._useTime;
        }
        /**
         * 获取系统的更新时序
         */
        get updateOrder() {
            return this._updateOrder;
        }
        set updateOrder(value) {
            this.setUpdateOrder(value);
        }
        constructor(matcher) {
            this._entities = [];
            this._updateOrder = 0;
            this._startTime = 0;
            this._endTime = 0;
            this._useTime = 0;
            this._matcher = matcher ? matcher : es.Matcher.empty();
            this.initialize();
        }
        /**
         * 这个系统所属的场景
         */
        get scene() {
            return this._scene;
        }
        set scene(value) {
            this._scene = value;
            this._entities = [];
        }
        get matcher() {
            return this._matcher;
        }
        /**
         * 设置更新时序
         * @param order 更新时序
         */
        setUpdateOrder(order) {
            this._updateOrder = order;
            this.scene.entityProcessors.setDirty();
        }
        initialize() {
        }
        onChanged(entity) {
            let contains = !!this._entities.find(e => e.id == entity.id);
            let interest = this._matcher.isInterestedEntity(entity);
            if (interest && !contains)
                this.add(entity);
            else if (!interest && contains)
                this.remove(entity);
        }
        add(entity) {
            if (!this._entities.find(e => e.id == entity.id))
                this._entities.push(entity);
            this.onAdded(entity);
        }
        onAdded(entity) {
        }
        remove(entity) {
            new es.List(this._entities).remove(entity);
            this.onRemoved(entity);
        }
        onRemoved(entity) {
        }
        update() {
            if (this.checkProcessing()) {
                this.begin();
                this.process(this._entities);
            }
        }
        lateUpdate() {
            if (this.checkProcessing()) {
                this.lateProcess(this._entities);
                this.end();
            }
        }
        /**
         * 在系统处理开始前调用
         * 在下一个系统开始处理或新的处理回合开始之前（以先到者为准），使用此方法创建的任何实体都不会激活
         */
        begin() {
            if (!es.Core.Instance.debug)
                return;
            this._startTime = Date.now();
        }
        process(entities) {
        }
        lateProcess(entities) {
        }
        /**
         * 系统处理完毕后调用
         */
        end() {
            if (!es.Core.Instance.debug)
                return;
            this._endTime = Date.now();
            this._useTime = this._endTime - this._startTime;
        }
        /**
         * 系统是否需要处理
         *
         * 在启用系统时有用，但仅偶尔需要处理
         * 这只影响处理，不影响事件或订阅列表
         * @returns 如果系统应该处理，则为true，如果不处理则为false。
         */
        checkProcessing() {
            return true;
        }
    }
    es.EntitySystem = EntitySystem;
})(es || (es = {}));
///<reference path="./EntitySystem.ts"/>
var es;
///<reference path="./EntitySystem.ts"/>
(function (es) {
    /**
     * 这个类是一个实体系统的基类，其可以被子类继承并在子类中实现具体的实体处理逻辑。
     * 该类提供了实体的添加、删除、更新等基本操作，并支持设置系统的更新时序、检查系统是否需要处理实体、获取系统的场景等方法
     */
    class DelayedIteratingSystem extends es.EntitySystem {
        constructor(matcher) {
            super(matcher);
            this.delay = 0;
            this.running = false;
            this.acc = 0;
        }
        process(entities) {
            const processed = entities.length;
            if (processed === 0) {
                this.stop();
                return;
            }
            this.delay = Number.MAX_VALUE;
            for (let i = 0; i < processed; i++) {
                const entity = entities[i];
                this.processDelta(entity, this.acc);
                const remaining = this.getRemainingDelay(entity);
                if (remaining <= 0) {
                    this.processExpired(entity);
                }
                else {
                    this.offerDelay(remaining);
                }
            }
            this.acc = 0;
        }
        checkProcessing() {
            if (this.running) {
                this.acc += es.Time.deltaTime;
                return this.acc >= this.delay;
            }
            return false;
        }
        /**
         * 只有当提供的延迟比系统当前计划执行的时间短时，才会重新启动系统。
         * 如果系统已经停止（不运行），那么提供的延迟将被用来重新启动系统，无论其值如何
         * 如果系统已经在倒计时，并且提供的延迟大于剩余时间，系统将忽略它。
         * 如果提供的延迟时间短于剩余时间，系统将重新启动，以提供的延迟时间运行。
         * @param offeredDelay 提供的延迟时间，单位为秒
         */
        offerDelay(offeredDelay) {
            if (!this.running) {
                this.running = true;
                this.delay = offeredDelay;
            }
            else {
                this.delay = Math.min(this.delay, offeredDelay);
            }
        }
        /**
         * 获取系统被命令处理实体后的初始延迟
         */
        getInitialTimeDelay() {
            return this.delay;
        }
        /**
        * 获取系统计划运行前的时间
        * 如果系统没有运行，则返回零
        */
        getRemainingTimeUntilProcessing() {
            if (this.running) {
                return this.delay - this.acc;
            }
            return 0;
        }
        /**
         * 检查系统是否正在倒计时处理
         */
        isRunning() {
            return this.running;
        }
        /**
         * 停止系统运行，中止当前倒计时
         */
        stop() {
            this.running = false;
            this.acc = 0;
        }
    }
    es.DelayedIteratingSystem = DelayedIteratingSystem;
})(es || (es = {}));
///<reference path="./EntitySystem.ts" />
var es;
///<reference path="./EntitySystem.ts" />
(function (es) {
    /**
     * 定义一个处理实体的抽象类，继承自 EntitySystem 类。
     * 子类需要实现 processEntity 方法，用于实现具体的实体处理逻辑。
     */
    class EntityProcessingSystem extends es.EntitySystem {
        /**
         * 构造函数，初始化实体匹配器。
         * @param matcher 实体匹配器
         */
        constructor(matcher) {
            super(matcher);
            /**
             * 是否启用系统，默认为启用。
             */
            this.enabled = true;
        }
        /**
         * 在晚于 update 的时间更新实体，由子类实现。
         * @param entity 待处理的实体
         */
        lateProcessEntity(entity) {
            // do nothing
        }
        /**
         * 遍历系统的所有实体，逐个进行实体处理。
         * @param entities 实体数组
         */
        process(entities) {
            // 如果实体数组为空，则直接返回
            if (entities.length === 0) {
                return;
            }
            // 遍历实体数组，逐个进行实体处理
            for (let i = 0, len = entities.length; i < len; i++) {
                const entity = entities[i];
                this.processEntity(entity);
            }
        }
        /**
         * 在晚于 update 的时间更新实体。
         * @param entities 实体数组
         */
        lateProcess(entities) {
            // 如果实体数组为空，则直接返回
            if (entities.length === 0) {
                return;
            }
            // 遍历实体数组，逐个进行实体处理
            for (let i = 0, len = entities.length; i < len; i++) {
                const entity = entities[i];
                this.lateProcessEntity(entity);
            }
        }
        /**
         * 判断系统是否需要进行实体处理。
         * 如果启用了系统，则需要进行实体处理，返回 true；
         * 否则不需要进行实体处理，返回 false。
         */
        checkProcessing() {
            return this.enabled;
        }
    }
    es.EntityProcessingSystem = EntityProcessingSystem;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 定义一个按时间间隔处理的抽象类，继承自 EntitySystem 类。
     * 子类需要实现 process 方法，用于实现具体的处理逻辑。
     */
    class IntervalSystem extends es.EntitySystem {
        /**
         * 构造函数，初始化时间间隔。
         * @param matcher 实体匹配器
         * @param interval 时间间隔
         */
        constructor(matcher, interval) {
            super(matcher);
            /**
             * 累积增量以跟踪间隔
             */
            this.acc = 0;
            /**
             * 时间间隔的余数，用于计算下一次需要等待的时间
             */
            this.intervalRemainder = 0;
            this.interval = interval;
        }
        /**
         * 判断是否需要进行处理。
         * 如果需要进行处理，则更新累积增量和时间间隔余数，返回 true；
         * 否则返回 false。
         */
        checkProcessing() {
            // 更新累积增量
            this.acc += es.Time.deltaTime;
            // 如果累积增量超过时间间隔，则进行处理
            if (this.acc >= this.interval) {
                // 更新时间间隔余数
                this.intervalRemainder = this.acc - this.interval;
                // 重置累积增量
                this.acc = 0;
                // 返回 true，表示需要进行处理
                return true;
            }
            // 返回 false，表示不需要进行处理
            return false;
        }
        /**
         * 获取本系统上次处理后的实际 delta 值。
         * 实际 delta 值等于时间间隔加上时间间隔余数。
         */
        getIntervalDelta() {
            return this.interval + this.intervalRemainder;
        }
    }
    es.IntervalSystem = IntervalSystem;
})(es || (es = {}));
///<reference path="./IntervalSystem.ts"/>
var es;
///<reference path="./IntervalSystem.ts"/>
(function (es) {
    /**
     * 定时遍历处理实体的系统，用于按指定的时间间隔遍历并处理感兴趣的实体。
     */
    class IntervalIteratingSystem extends es.IntervalSystem {
        constructor(matcher, interval) {
            super(matcher, interval);
        }
        /**
         * 遍历处理实体。
         * @param entities 本系统感兴趣的实体列表
         */
        process(entities) {
            entities.forEach(entity => this.processEntity(entity));
        }
    }
    es.IntervalIteratingSystem = IntervalIteratingSystem;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 定义一个被动的实体系统，继承自 EntitySystem 类。
     * 被动的实体系统不会对实体进行任何修改，只会被动地接收实体的变化事件。
     */
    class PassiveSystem extends es.EntitySystem {
        /**
         * 当实体发生变化时，不进行任何操作。
         * @param entity 发生变化的实体
         */
        onChanged(entity) { }
        /**
         * 不进行任何处理，只进行开始和结束计时。
         * @param entities 实体数组，未被使用
         */
        process(entities) {
            // 调用 begin 和 end 方法，开始和结束计时
            this.begin();
            this.end();
        }
    }
    es.PassiveSystem = PassiveSystem;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 定义一个处理实体的抽象类，继承自 EntitySystem 类。
     * 子类需要实现 processSystem 方法，用于实现具体的处理逻辑。
     */
    class ProcessingSystem extends es.EntitySystem {
        /**
         * 当实体发生变化时，不进行任何操作。
         * @param entity 发生变化的实体
         */
        onChanged(entity) { }
        /**
         * 处理实体，每帧调用 processSystem 方法进行处理。
         * @param entities 实体数组，未被使用
         */
        process(entities) {
            // 调用 begin 和 end 方法，开始和结束计时
            this.begin();
            // 调用子类实现的 processSystem 方法进行实体处理
            this.processSystem();
            this.end();
        }
    }
    es.ProcessingSystem = ProcessingSystem;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 位操作类，用于操作一个位数组。
     */
    class Bits {
        constructor() {
            this._bit = {};
        }
        /**
         * 设置指定位置的位值。
         * @param index 位置索引
         * @param value 位值（0 或 1）
         */
        set(index, value) {
            this._bit[index] = value;
        }
        /**
         * 获取指定位置的位值。
         * @param index 位置索引
         * @returns 位值（0 或 1）
         */
        get(index) {
            let v = this._bit[index];
            return v == null ? 0 : v;
        }
    }
    es.Bits = Bits;
})(es || (es = {}));
///<reference path="../Components/IUpdatable.ts" />
var es;
///<reference path="../Components/IUpdatable.ts" />
(function (es) {
    class ComponentList {
        constructor(entity) {
            /**
             * 实体的组件列表。
             */
            this._components = [];
            /**
             * 可更新的组件列表。
             */
            this._updatableComponents = [];
            /**
             * 等待添加到实体的组件列表。
             */
            this._componentsToAdd = {};
            /**
             * 等待从实体中移除的组件列表。
             */
            this._componentsToRemove = {};
            /**
             * 等待添加到实体的组件列表（作为数组）。
             */
            this._componentsToAddList = [];
            /**
             * 等待从实体中移除的组件列表（作为数组）。
             */
            this._componentsToRemoveList = [];
            /**
             * 临时的组件缓冲列表。
             */
            this._tempBufferList = [];
            /**
             * 按组件类型组织的组件列表字典。
             */
            this.componentsByType = new Map();
            /**
             * 按组件类型组织的等待添加到实体的组件列表字典。
             */
            this.componentsToAddByType = new Map();
            this._entity = entity;
        }
        get count() {
            return this._components.length;
        }
        get buffer() {
            return this._components;
        }
        markEntityListUnsorted() {
            this._isComponentListUnsorted = true;
        }
        /**
         * 将组件添加到实体的组件列表中，并添加到组件类型字典中。
         * @param component 要添加的组件。
         */
        add(component) {
            // 将组件添加到_componentsToAdd和_componentsToAddList中，并添加到相应的组件类型字典中
            this._componentsToAdd[component.id] = component;
            this._componentsToAddList.push(component);
            this.addComponentsToAddByType(component);
        }
        /**
         * 从实体的组件列表中移除组件，并从相应的组件类型字典中移除组件。
         * @param component 要从实体中移除的组件。
         */
        remove(component) {
            // 如果组件在_componentsToAdd中，则将其从_componentsToAddList中移除，并从相应的组件类型字典中移除组件
            if (this._componentsToAdd[component.id]) {
                const index = this._componentsToAddList.findIndex((c) => c.id === component.id);
                if (index !== -1) {
                    this._componentsToAddList.splice(index, 1);
                }
                delete this._componentsToAdd[component.id];
                this.removeComponentsToAddByType(component);
                return;
            }
            // 如果组件不在_componentsToAdd中，则将其添加到_componentsToRemove和_componentsToRemoveList中
            this._componentsToRemove[component.id] = component;
            this._componentsToRemoveList.push(component);
        }
        /**
         * 立即从组件列表中删除所有组件
         */
        removeAllComponents() {
            if (this._components.length > 0) {
                for (let i = 0, s = this._components.length; i < s; ++i) {
                    this.handleRemove(this._components[i]);
                }
            }
            this.componentsByType.clear();
            this.componentsToAddByType.clear();
            this._components.length = 0;
            this._updatableComponents.length = 0;
            this._componentsToAdd = {};
            this._componentsToRemove = {};
            this._componentsToAddList.length = 0;
            this._componentsToRemoveList.length = 0;
        }
        /**
         * 从实体的所有组件上注销并从相关数据结构中删除它们。
         */
        deregisterAllComponents() {
            if (this._components.length > 0) {
                for (const component of this._components) {
                    // 处理IUpdatable
                    if (es.isIUpdatable(component)) {
                        // 创建一个新的List实例，从_updatableComponents中移除组件，以避免并发修改异常
                        new es.List(this._updatableComponents).remove(component);
                    }
                    // 从位掩码中减去组件类型的索引，通知实体处理器一个组件已被移除
                    this.decreaseBits(component);
                    this._entity.scene.entityProcessors.onComponentRemoved(this._entity);
                }
            }
        }
        /**
         * 注册实体的所有组件，并将它们添加到相应的数据结构中。
         */
        registerAllComponents() {
            if (this._components.length > 0) {
                for (const component of this._components) {
                    if (es.isIUpdatable(component)) {
                        // 如果组件是可更新的，则将其添加到_updatableComponents中
                        this._updatableComponents.push(component);
                    }
                    // 将组件类型的索引添加到实体的位掩码中，通知实体处理器一个组件已被添加
                    this.addBits(component);
                    this._entity.scene.entityProcessors.onComponentAdded(this._entity);
                }
            }
        }
        /**
         * 从实体的位掩码中减去组件类型的索引。
         * @param component 要从实体中删除的组件。
         */
        decreaseBits(component) {
            const bits = this._entity.componentBits;
            // 获取组件类型的索引，将其对应位掩码减1
            const typeIndex = es.ComponentTypeManager.getIndexFor(es.TypeUtils.getType(component));
            bits.set(typeIndex, bits.get(typeIndex) - 1);
        }
        /**
         * 在实体的位掩码中添加组件类型的索引。
         * @param component 要添加到实体的组件。
         */
        addBits(component) {
            const bits = this._entity.componentBits;
            // 获取组件类型的索引，将其对应位掩码加1
            const typeIndex = es.ComponentTypeManager.getIndexFor(es.TypeUtils.getType(component));
            bits.set(typeIndex, bits.get(typeIndex) + 1);
        }
        /**
         * 更新实体的组件列表和相关数据结构。
         * 如果有组件要添加或删除，它将相应地更新组件列表和其他数据结构。
         */
        updateLists() {
            // 处理要删除的组件
            if (this._componentsToRemoveList.length > 0) {
                for (const component of this._componentsToRemoveList) {
                    // 从实体中删除组件，从组件列表和相关数据结构中删除组件
                    this.handleRemove(component);
                    // 从_components数组中删除组件
                    const index = this._components.findIndex((c) => c.id === component.id);
                    if (index !== -1) {
                        this._components.splice(index, 1);
                    }
                    // 从组件类型字典中删除组件
                    this.removeComponentsByType(component);
                }
                // 清空_componentsToRemove和_componentsToRemoveList
                this._componentsToRemove = {};
                this._componentsToRemoveList.length = 0;
            }
            // 处理要添加的组件
            if (this._componentsToAddList.length > 0) {
                for (const component of this._componentsToAddList) {
                    // 如果组件可以更新，则添加到可更新组件列表中
                    if (es.isIUpdatable(component)) {
                        this._updatableComponents.push(component);
                    }
                    // 更新实体的组件位掩码，通知实体处理器一个组件已经添加
                    this.addBits(component);
                    this._entity.scene.entityProcessors.onComponentAdded(this._entity);
                    // 将组件添加到相应类型的fastList中，将组件添加到_components数组中
                    this.addComponentsByType(component);
                    this._components.push(component);
                    // 将组件添加到_tempBufferList中，稍后调用onAddedToEntity和onEnabled
                    this._tempBufferList.push(component);
                }
                // 清空_componentsToAdd、_componentsToAddList和componentsToAddByType，设置_isComponentListUnsorted标志
                this._componentsToAdd = {};
                this._componentsToAddList.length = 0;
                this.componentsToAddByType.clear();
                this._isComponentListUnsorted = true;
            }
            // 调用新添加组件的onAddedToEntity和onEnabled方法
            if (this._tempBufferList.length > 0) {
                for (const component of this._tempBufferList) {
                    component.onAddedToEntity();
                    // 如果组件已启用，则调用onEnabled方法
                    if (component.enabled) {
                        component.onEnabled();
                    }
                }
                // 清空_tempBufferList
                this._tempBufferList.length = 0;
            }
        }
        handleRemove(component) {
            // 如果组件可以更新，从可更新组件列表中删除该组件
            if (es.isIUpdatable(component) && this._updatableComponents.length > 0) {
                const index = this._updatableComponents.findIndex((c) => c.id === component.id);
                if (index !== -1) {
                    this._updatableComponents.splice(index, 1);
                }
            }
            // 更新实体的组件位掩码
            this.decreaseBits(component);
            // 通知实体处理器一个组件已被删除
            this._entity.scene.entityProcessors.onComponentRemoved(this._entity);
            // 调用组件的onRemovedFromEntity方法，将其entity属性设置为null
            component.onRemovedFromEntity();
            component.entity = null;
        }
        removeComponentsByType(component) {
            // 获取存储指定类型组件的fastList数组
            const fastList = this.componentsByType.get(es.TypeUtils.getType(component));
            // 在fastList中查找要删除的组件
            const index = fastList.findIndex((c) => c.id === component.id);
            if (index !== -1) {
                // 找到组件后，使用splice方法将其从fastList中删除
                fastList.splice(index, 1);
            }
        }
        addComponentsByType(component) {
            // 获取存储指定类型组件的fastList数组
            let fastList = this.componentsByType.get(es.TypeUtils.getType(component));
            // 如果fastList不存在，则创建一个空数组
            if (!fastList) {
                fastList = [];
            }
            // 在fastList中添加组件
            fastList.push(component);
            // 更新componentsByType字典，以便它包含fastList数组
            this.componentsByType.set(es.TypeUtils.getType(component), fastList);
        }
        /**
         * 从待添加组件列表中移除指定类型的组件。
         * @param component 要移除的组件
         */
        removeComponentsToAddByType(component) {
            // 获取待添加组件列表中指定类型的组件列表
            let fastList = this.componentsToAddByType.get(es.TypeUtils.getType(component));
            // 在该列表中查找指定组件
            let fastIndex = fastList.findIndex(c => c.id == component.id);
            // 如果找到了指定组件，则从列表中移除它
            if (fastIndex != -1) {
                fastList.splice(fastIndex, 1);
            }
        }
        /**
         * 向待添加组件列表中添加指定类型的组件。
         * @param component 要添加的组件
         */
        addComponentsToAddByType(component) {
            // 获取待添加组件列表中指定类型的组件列表
            let fastList = this.componentsToAddByType.get(es.TypeUtils.getType(component));
            // 如果指定类型的组件列表不存在，则创建一个新的列表
            if (!fastList)
                fastList = [];
            // 向指定类型的组件列表中添加组件
            fastList.push(component);
            // 更新待添加组件列表中指定类型的组件列表
            this.componentsToAddByType.set(es.TypeUtils.getType(component), fastList);
        }
        /**
         * 获取指定类型的第一个组件实例。
         * @param type 组件类型
         * @param onlyReturnInitializedComponents 是否仅返回已初始化的组件
         * @returns 指定类型的第一个组件实例，如果不存在则返回 null
         */
        getComponent(type, onlyReturnInitializedComponents) {
            // 获取指定类型的组件列表
            let fastList = this.componentsByType.get(type);
            // 如果指定类型的组件列表存在并且不为空，则返回第一个组件实例
            if (fastList && fastList.length > 0)
                return fastList[0];
            // 如果不仅返回已初始化的组件，则检查待添加组件列表中是否存在指定类型的组件
            if (!onlyReturnInitializedComponents) {
                let fastToAddList = this.componentsToAddByType.get(type);
                if (fastToAddList && fastToAddList.length > 0)
                    return fastToAddList[0];
            }
            // 如果指定类型的组件列表为空且待添加组件列表中也不存在该类型的组件，则返回 null
            return null;
        }
        /**
         * 获取指定类型的所有组件实例。
         * @param typeName 组件类型名称
         * @param components 存储组件实例的数组
         * @returns 存储了指定类型的所有组件实例的数组
         */
        getComponents(typeName, components) {
            // 如果没有传入组件实例数组，则创建一个新数组
            if (!components)
                components = [];
            // 获取指定类型的组件列表，并将其添加到组件实例数组中
            let fastList = this.componentsByType.get(typeName);
            if (fastList)
                components = components.concat(fastList);
            // 获取待添加组件列表中的指定类型的组件列表，并将其添加到组件实例数组中
            let fastToAddList = this.componentsToAddByType.get(typeName);
            if (fastToAddList)
                components = components.concat(fastToAddList);
            // 返回存储了指定类型的所有组件实例的数组
            return components;
        }
        update() {
            this.updateLists();
            if (this._updatableComponents.length > 0) {
                for (let i = 0, s = this._updatableComponents.length; i < s; ++i) {
                    let updateComponent = this._updatableComponents[i];
                    if (updateComponent.enabled)
                        updateComponent.update();
                }
            }
        }
        onEntityTransformChanged(comp) {
            if (this._components.length > 0) {
                for (let i = 0, s = this._components.length; i < s; ++i) {
                    let component = this._components[i];
                    if (component.enabled)
                        component.onEntityTransformChanged(comp);
                }
            }
            if (this._componentsToAddList.length > 0) {
                for (let i = 0, s = this._componentsToAddList.length; i < s; ++i) {
                    let component = this._componentsToAddList[i];
                    if (component.enabled)
                        component.onEntityTransformChanged(comp);
                }
            }
        }
        onEntityEnabled() {
            if (this._components.length > 0) {
                for (let i = 0, s = this._components.length; i < s; i++)
                    this._components[i].onEnabled();
            }
        }
        onEntityDisabled() {
            if (this._components.length > 0) {
                for (let i = 0, s = this._components.length; i < s; i++)
                    this._components[i].onDisabled();
            }
        }
    }
    /**
     * 比较IUpdatable对象的更新顺序。
     */
    ComponentList.compareUpdatableOrder = new es.IUpdatableComparer();
    es.ComponentList = ComponentList;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 组件类型工厂，用于生成和管理组件类型。
     * 维护了一个类型映射表，将组件类型与其唯一索引相对应，以便在运行时高效地检查实体是否包含特定的组件类型。
     */
    class ComponentTypeFactory {
        constructor() {
            /** 组件类型与其唯一索引的映射表 */
            this.componentTypes = {};
            /** 组件类型列表，按索引访问组件类型 */
            this.types = new es.Bag();
            /** 当前组件类型的计数器 */
            this.componentTypeCount = 0;
        }
        /**
         * 获取给定组件类型的唯一索引。
         * 如果该组件类型尚未存在于类型映射表中，则创建一个新的组件类型，并将其添加到映射表和类型列表中。
         * @param c 要查找或创建的组件类型
         * @returns 组件类型的唯一索引
         */
        getIndexFor(c) {
            return this.getTypeFor(c).getIndex();
        }
        /**
         * 获取给定组件类型的ComponentType对象。
         * 如果该组件类型尚未存在于类型映射表中，则创建一个新的ComponentType对象，并将其添加到映射表和类型列表中。
         * @param c 要查找或创建的组件类型
         * @returns 组件类型的ComponentType对象
         */
        getTypeFor(c) {
            // 如果给定的组件类型是一个已有的索引，则直接返回对应的ComponentType对象
            if (typeof c === "number") {
                return this.types.get(c);
            }
            // 获取给定组件类型对应的类名
            const className = es.getClassName(c);
            // 如果类型映射表中不存在该组件类型，则创建一个新的ComponentType对象
            if (!this.componentTypes[className]) {
                const index = this.componentTypeCount++;
                const type = new es.ComponentType(c, index);
                this.componentTypes[className] = type;
                this.types.set(index, type);
            }
            // 返回对应的ComponentType对象
            return this.componentTypes[className];
        }
    }
    es.ComponentTypeFactory = ComponentTypeFactory;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 组件类型管理器，维护了一个组件类型和它们对应的位掩码之间的映射关系。
     * 用于实现实体匹配器中组件类型的比较操作，以确定实体是否符合给定的匹配器条件。
     */
    class ComponentTypeManager {
        /**
         * 将给定的组件类型添加到组件类型列表中，并分配一个唯一的位掩码。
         * @param type 要添加的组件类型
         */
        static add(type) {
            if (!this._componentTypesMask.has(type)) {
                this._componentTypesMask.set(type, this._componentTypesMask.size);
            }
        }
        /**
         * 获取给定组件类型的位掩码。
         * 如果该组件类型还没有分配位掩码，则将其添加到列表中，并分配一个唯一的位掩码。
         * @param type 要获取位掩码的组件类型
         * @returns 组件类型的位掩码
         */
        static getIndexFor(type) {
            let v = -1;
            if (!this._componentTypesMask.has(type)) {
                this.add(type);
                v = this._componentTypesMask.get(type);
            }
            else {
                v = this._componentTypesMask.get(type);
            }
            return v;
        }
    }
    /** 存储组件类型和它们对应的位掩码的Map */
    ComponentTypeManager._componentTypesMask = new Map();
    es.ComponentTypeManager = ComponentTypeManager;
})(es || (es = {}));
var es;
(function (es) {
    class EntityList {
        constructor(scene) {
            /**
             * 实体列表
             */
            this._entities = [];
            /**
             * 待添加的实体字典
             */
            this._entitiesToAdded = {};
            /**
             * 待移除的实体字典
             */
            this._entitiesToRemove = {};
            /**
             * 待添加的实体列表
             */
            this._entitiesToAddedList = [];
            /**
             * 待移除的实体列表
             */
            this._entitiesToRemoveList = [];
            /**
             * 实体字典，以实体标签为键
             */
            this._entityDict = new Map();
            /**
             * 未排序的标签集合
             */
            this._unsortedTags = new Set();
            this.scene = scene;
        }
        get count() {
            return this._entities.length;
        }
        get buffer() {
            return this._entities;
        }
        markEntityListUnsorted() {
            this._isEntityListUnsorted = true;
        }
        markTagUnsorted(tag) {
            this._unsortedTags.add(tag);
        }
        /**
         * 将一个实体添加到列表中。所有的生命周期方法将在下一帧中被调用
         * @param entity
         */
        add(entity) {
            this._entitiesToAdded[entity.id] = entity;
            this._entitiesToAddedList.push(entity);
        }
        /**
         * 从场景中移除实体。
         * @param entity 要从场景中移除的实体。
         */
        remove(entity) {
            // 如果实体在添加列表中，则将其从添加列表中移除
            if (this._entitiesToAdded[entity.id]) {
                const index = this._entitiesToAddedList.findIndex((e) => e.id === entity.id);
                if (index !== -1) {
                    this._entitiesToAddedList.splice(index, 1);
                }
                delete this._entitiesToAdded[entity.id];
                return;
            }
            // 如果实体不在添加列表中，则将其添加到移除列表中并将其添加到移除字典中
            this._entitiesToRemoveList.push(entity);
            if (!this._entitiesToRemove[entity.id]) {
                this._entitiesToRemove[entity.id] = entity;
            }
        }
        /**
         * 从场景中移除所有实体。
         */
        removeAllEntities() {
            // 清除字典和列表，以及是否已排序的标志
            this._unsortedTags.clear();
            this._entitiesToAdded = {};
            this._entitiesToAddedList.length = 0;
            this._isEntityListUnsorted = false;
            // 调用updateLists方法，以处理要移除的实体
            this.updateLists();
            // 标记并移除所有实体
            for (const entity of this._entities) {
                entity._isDestroyed = true;
                entity.onRemovedFromScene();
                entity.scene = null;
            }
            // 清空实体列表和实体字典
            this._entities.length = 0;
            this._entityDict.clear();
        }
        /**
         * 检查实体是否已经被添加到场景中。
         * @param entity 要检查的实体
         * @returns 如果实体已经被添加到场景中，则返回true；否则返回false
         */
        contains(entity) {
            // 检查实体是否存在于_entitiesToAdded字典中
            return !!this._entitiesToAdded[entity.id];
        }
        /**
         * 获取具有指定标签的实体列表。
         * 如果列表不存在，则创建一个新列表并返回。
         * @param tag 实体标签
         * @returns 具有指定标签的实体列表
         */
        getTagList(tag) {
            // 尝试从_entityDict中获取具有指定标签的实体列表
            let list = this._entityDict.get(tag);
            // 如果列表不存在，则创建一个新的Set实例，并添加到_entityDict中
            if (!list) {
                list = new Set();
                this._entityDict.set(tag, list);
            }
            return list;
        }
        /**
         * 添加实体到标签列表中。
         * @param entity 实体
         */
        addToTagList(entity) {
            // 获取标签列表
            const list = this.getTagList(entity.tag);
            // 将实体添加到标签列表中
            list.add(entity);
            // 添加未排序标志
            this._unsortedTags.add(entity.tag);
        }
        /**
         * 从标签列表中移除实体。
         * @param entity 实体
         */
        removeFromTagList(entity) {
            // 获取实体的标签列表
            const list = this._entityDict.get(entity.tag);
            // 如果标签列表存在，则从中移除实体
            if (list) {
                list.delete(entity);
            }
        }
        /**
         * 更新场景中所有启用的实体的Update方法
         * 如果实体的UpdateInterval为1或Time.frameCount模除UpdateInterval为0，则每帧调用Update
         */
        update() {
            for (let i = 0; i < this._entities.length; i++) {
                const entity = this._entities[i];
                if (entity.enabled && (entity.updateInterval === 1 || es.Time.frameCount % entity.updateInterval === 0)) {
                    entity.update();
                }
            }
        }
        /**
         * 更新场景中实体的列表。
         */
        updateLists() {
            // 处理要移除的实体
            if (this._entitiesToRemoveList.length > 0) {
                for (const entity of this._entitiesToRemoveList) {
                    // 从标签列表中删除实体
                    this.removeFromTagList(entity);
                    // 从场景实体列表中删除实体
                    const index = this._entities.findIndex((e) => e.id === entity.id);
                    if (index !== -1) {
                        this._entities.splice(index, 1);
                    }
                    // 调用实体的onRemovedFromScene方法，并将其scene属性设置为null
                    entity.onRemovedFromScene();
                    entity.scene = null;
                    // 通知场景实体处理器，一个实体已被移除
                    this.scene.entityProcessors.onEntityRemoved(entity);
                }
                // 清空要移除的实体列表和字典
                this._entitiesToRemove = {};
                this._entitiesToRemoveList.length = 0;
            }
            // 处理要添加的实体
            if (this._entitiesToAddedList.length > 0) {
                // 添加实体到场景实体列表和标签列表中
                for (const entity of this._entitiesToAddedList) {
                    this._entities.push(entity);
                    entity.scene = this.scene;
                    this.addToTagList(entity);
                }
                // 通知场景实体处理器，有新的实体已添加
                for (const entity of this._entitiesToAddedList) {
                    this.scene.entityProcessors.onEntityAdded(entity);
                }
                // 调用实体的onAddedToScene方法，以允许它们执行任何场景相关的操作
                for (const entity of this._entitiesToAddedList) {
                    entity.onAddedToScene();
                }
                // 清空要添加的实体列表和字典
                this._entitiesToAdded = {};
                this._entitiesToAddedList.length = 0;
            }
        }
        /**
         * 返回第一个找到的名字为name的实体。如果没有找到则返回null
         * @param name
         */
        findEntity(name) {
            if (this._entities.length > 0) {
                for (let i = 0, s = this._entities.length; i < s; ++i) {
                    let entity = this._entities[i];
                    if (entity.name == name)
                        return entity;
                }
            }
            if (this._entitiesToAddedList.length > 0) {
                for (let i = 0, s = this._entitiesToAddedList.length; i < s; ++i) {
                    let entity = this._entitiesToAddedList[i];
                    if (entity.name == name)
                        return entity;
                }
            }
            return null;
        }
        /**
         * 返回最后一个找到的名字为name的实体。如果没有找到则返回null
         * @param name
         */
        findEntityRight(name) {
            if (this._entities.length > 0) {
                for (let i = this._entities.length - 1, s = 0; i >= s; --i) {
                    let entity = this._entities[i];
                    if (entity.name == name)
                        return entity;
                }
            }
            if (this._entitiesToAddedList.length > 0) {
                for (let i = this._entitiesToAddedList.length - 1, s = 0; i >= s; --i) {
                    let entity = this._entitiesToAddedList[i];
                    if (entity.name == name)
                        return entity;
                }
            }
            return null;
        }
        /**
         * 通过实体ID在场景中查找对应实体
         * @param id 实体ID
         * @returns 返回找到的实体，如果没有找到则返回 null
         */
        findEntityById(id) {
            // 遍历场景中所有实体
            if (this._entities.length > 0) {
                for (let i = 0, s = this._entities.length; i < s; ++i) {
                    let entity = this._entities[i];
                    // 如果实体的ID匹配，返回该实体
                    if (entity.id == id)
                        return entity;
                }
            }
            // 在未添加的实体列表中查找
            return this._entitiesToAdded[id];
        }
        /**
         * 获取标签对应的实体列表
         * @param tag 实体的标签
         * @returns 返回所有拥有该标签的实体列表
         */
        entitiesWithTag(tag) {
            // 从字典中获取对应标签的实体列表
            const list = this.getTagList(tag);
            // 从对象池中获取 Entity 类型的数组
            const returnList = es.ListPool.obtain(es.Entity);
            if (list.size > 0) {
                // 将实体列表中的实体添加到返回列表中
                for (const entity of list) {
                    returnList.push(entity);
                }
            }
            // 返回已填充好实体的返回列表
            return returnList;
        }
        /**
         * 返回第一个找到该tag的实体
         * @param tag
         * @returns
         */
        entityWithTag(tag) {
            let list = this.getTagList(tag);
            if (list.size > 0) {
                for (let entity of list) {
                    return entity;
                }
            }
            return null;
        }
        /**
         * 在场景中查找具有给定类型的组件。
         * @param type 要查找的组件类型。
         * @returns 如果找到，则返回该组件；否则返回null。
         */
        findComponentOfType(type) {
            // 遍历场景中的所有实体，查找具有给定类型的组件
            for (const entity of this._entities) {
                if (entity.enabled) {
                    const comp = entity.getComponent(type);
                    if (comp) {
                        return comp;
                    }
                }
            }
            // 遍历待添加的实体列表中的所有实体，查找具有给定类型的组件
            for (const entity of this._entitiesToAddedList) {
                if (entity.enabled) {
                    const comp = entity.getComponent(type);
                    if (comp) {
                        return comp;
                    }
                }
            }
            // 如果找不到具有给定类型的组件，则返回null
            return null;
        }
        /**
         * 在场景中查找具有给定类型的所有组件。
         * @param type 要查找的组件类型。
         * @returns 具有给定类型的所有组件的列表。
         */
        findComponentsOfType(type) {
            // 从池中获取一个可重用的组件列表
            const comps = es.ListPool.obtain(type);
            // 遍历场景中的所有实体，查找具有给定类型的组件并添加到组件列表中
            for (const entity of this._entities) {
                if (entity.enabled) {
                    entity.getComponents(type, comps);
                }
            }
            // 遍历待添加的实体列表中的所有实体，查找具有给定类型的组件并添加到组件列表中
            for (const entity of this._entitiesToAddedList) {
                if (entity.enabled) {
                    entity.getComponents(type, comps);
                }
            }
            // 返回具有给定类型的所有组件的列表
            return comps;
        }
        /**
         * 返回拥有指定类型组件的所有实体
         * @param types 要查询的组件类型列表
         * @returns 返回拥有指定类型组件的所有实体
         */
        findEntitiesOfComponent(...types) {
            const entities = [];
            // 遍历所有已存在的实体
            for (const entity of this._entities) {
                // 只有启用的实体才会被考虑
                if (entity.enabled) {
                    // 如果types数组为空，直接将实体添加到结果数组中
                    if (types.length === 0) {
                        entities.push(entity);
                        continue;
                    }
                    // 对于每个指定的组件类型，检查实体是否具有该组件
                    let meet = true;
                    for (const type of types) {
                        const hasComp = entity.hasComponent(type);
                        if (!hasComp) {
                            meet = false;
                            break;
                        }
                    }
                    // 如果实体满足要求，将其添加到结果数组中
                    if (meet) {
                        entities.push(entity);
                    }
                }
            }
            // 遍历所有等待添加的实体，和上面的操作类似
            for (const entity of this._entitiesToAddedList) {
                if (entity.enabled) {
                    if (types.length === 0) {
                        entities.push(entity);
                        continue;
                    }
                    let meet = true;
                    for (const type of types) {
                        const hasComp = entity.hasComponent(type);
                        if (!hasComp) {
                            meet = false;
                            break;
                        }
                    }
                    if (meet) {
                        entities.push(entity);
                    }
                }
            }
            return entities;
        }
    }
    es.EntityList = EntityList;
})(es || (es = {}));
var es;
(function (es) {
    class EntityProcessorList {
        constructor() {
            this._processors = []; // 处理器列表
            this._orderDirty = false; // 处理器排序标志
        }
        /** 获取处理器列表 */
        get processors() {
            return this._processors;
        }
        /** 获取处理器数量 */
        get count() {
            return this._processors.length;
        }
        /**
         * 添加处理器
         * @param processor 要添加的处理器
         */
        add(processor) {
            this._processors.push(processor);
        }
        /**
         * 移除处理器
         * @param processor 要移除的处理器
         */
        remove(processor) {
            // 使用 es.List 类的 remove() 方法从处理器列表中移除指定处理器
            new es.List(this._processors).remove(processor);
        }
        /**
         * 在实体上添加组件时被调用
         * @param entity 添加组件的实体
         */
        onComponentAdded(entity) {
            this.notifyEntityChanged(entity);
        }
        /**
         * 在实体上移除组件时被调用
         * @param entity 移除组件的实体
         */
        onComponentRemoved(entity) {
            this.notifyEntityChanged(entity);
        }
        /**
         * 在场景中添加实体时被调用
         * @param entity 添加的实体
         */
        onEntityAdded(entity) {
            this.notifyEntityChanged(entity);
        }
        /**
         * 在场景中移除实体时被调用
         * @param entity 移除的实体
         */
        onEntityRemoved(entity) {
            this.removeFromProcessors(entity);
        }
        /** 在处理器列表上开始循环 */
        begin() {
        }
        /** 更新处理器列表 */
        update() {
            // 如果处理器列表为空，则直接返回
            if (this._processors.length === 0) {
                return;
            }
            // 如果需要重新排序处理器列表
            if (this._orderDirty) {
                // 对处理器列表进行排序
                this._processors.sort((a, b) => a.updateOrder - b.updateOrder);
                // 重新设置处理器的更新顺序
                for (let i = 0, s = this._processors.length; i < s; ++i) {
                    const processor = this._processors[i];
                    processor.setUpdateOrder(i);
                }
                // 将标志设置为“未脏”
                this.clearDirty();
            }
            // 调用每个处理器的 update() 方法
            for (let i = 0, s = this._processors.length; i < s; ++i) {
                const processor = this._processors[i];
                processor.update();
            }
        }
        /** 在处理器列表上完成循环 */
        end() {
        }
        /** 设置处理器排序标志 */
        setDirty() {
            this._orderDirty = true;
        }
        /** 清除处理器排序标志 */
        clearDirty() {
            this._orderDirty = false;
        }
        /**
         * 获取指定类型的处理器
         * @param type 指定类型的构造函数
         * @returns 指定类型的处理器
         */
        getProcessor(type) {
            // 如果处理器列表为空，则返回null
            if (this._processors.length === 0) {
                return null;
            }
            // 遍历处理器列表，查找指定类型的处理器
            for (let i = 0, s = this._processors.length; i < s; ++i) {
                const processor = this._processors[i];
                // 如果当前处理器是指定类型的实例，则返回当前处理器
                if (processor instanceof type) {
                    return processor;
                }
            }
            // 如果没有找到指定类型的处理器，则返回null
            return null;
        }
        /**
         * 通知处理器实体已更改
         * @param entity 发生更改的实体
         */
        notifyEntityChanged(entity) {
            if (this._processors.length === 0) {
                return;
            }
            // 遍历处理器列表，调用每个处理器的 onChanged() 方法
            for (let i = 0, s = this._processors.length; i < s; ++i) {
                const processor = this._processors[i];
                processor.onChanged(entity);
            }
        }
        /**
         * 从处理器列表中移除实体
         * @param entity 要移除的实体
         */
        removeFromProcessors(entity) {
            if (this._processors.length === 0) {
                return;
            }
            // 遍历处理器列表，调用每个处理器的 remove() 方法
            for (let i = 0, s = this._processors.length; i < s; ++i) {
                const processor = this._processors[i];
                processor.remove(entity);
            }
        }
        /** 在处理器列表上进行后期更新 */
        lateUpdate() {
            if (this._processors.length === 0) {
                return;
            }
            // 调用每个处理器的 lateUpdate() 方法
            for (let i = 0, s = this._processors.length; i < s; ++i) {
                const processor = this._processors[i];
                processor.lateUpdate();
            }
        }
    }
    es.EntityProcessorList = EntityProcessorList;
})(es || (es = {}));
var es;
(function (es) {
    class HashHelpers {
        /**
         * 判断一个数是否为质数
         * @param candidate 要判断的数
         * @returns 是否为质数
         */
        static isPrime(candidate) {
            if ((candidate & 1) !== 0) { // 位运算判断奇偶性
                let limit = Math.sqrt(candidate);
                for (let divisor = 3; divisor <= limit; divisor += 2) { // 奇数因子判断
                    if ((candidate % divisor) === 0) {
                        return false;
                    }
                }
                return true;
            }
            return (candidate === 2); // 2是质数
        }
        /**
         * 获取大于等于指定值的最小质数
         * @param min 指定值
         * @returns 大于等于指定值的最小质数
         */
        static getPrime(min) {
            if (min < 0) {
                throw new Error("参数错误 min 不能小于0");
            }
            for (let i = 0; i < this.primes.length; i++) {
                let prime = this.primes[i];
                if (prime >= min) {
                    return prime;
                }
            }
            // 在预定义的质数列表之外，需要计算最小的质数
            for (let i = (min | 1); i < Number.MAX_VALUE; i += 2) { // 从 min 向上计算奇数
                if (this.isPrime(i) && ((i - 1) % this.hashPrime !== 0)) { // i是质数且不是hashPrime的倍数
                    return i;
                }
            }
            return min;
        }
        /**
         * 扩展哈希表容量
         * @param oldSize 原哈希表容量
         * @returns 扩展后的哈希表容量
         */
        static expandPrime(oldSize) {
            let newSize = 2 * oldSize;
            // 在遇到容量溢出之前，允许哈希特表增长到最大可能的大小
            // 请注意，即使当_items.Length溢出时，这项检查也会起作用
            if (newSize > this.maxPrimeArrayLength && this.maxPrimeArrayLength > oldSize) {
                return this.maxPrimeArrayLength;
            }
            return this.getPrime(newSize);
        }
        /**
         * 计算字符串的哈希值
         * @param str 要计算哈希值的字符串
         * @returns 哈希值
         */
        static getHashCode(str) {
            let hash = 0;
            if (str.length === 0) {
                return hash;
            }
            for (let i = 0; i < str.length; i++) {
                let char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char; // 采用 FNV-1a 哈希算法
                hash = hash & hash; // 将hash值转换为32位整数
            }
            return hash;
        }
    }
    // 哈希冲突阈值，超过此值将使用另一种哈希算法
    HashHelpers.hashCollisionThreshold = 100;
    // 哈希值用于计算哈希表索引的质数
    HashHelpers.hashPrime = 101;
    // 一组预定义的质数，用于计算哈希表容量
    HashHelpers.primes = [
        3, 7, 11, 17, 23, 29, 37, 47, 59, 71, 89, 107, 131, 163, 197, 239, 293, 353, 431, 521, 631, 761, 919,
        1103, 1327, 1597, 1931, 2333, 2801, 3371, 4049, 4861, 5839, 7013, 8419, 10103, 12143, 14591,
        17519, 21023, 25229, 30293, 36353, 43627, 52361, 62851, 75431, 90523, 108631, 130363, 156437,
        187751, 225307, 270371, 324449, 389357, 467237, 560689, 672827, 807403, 968897, 1162687, 1395263,
        1674319, 2009191, 2411033, 2893249, 3471899, 4166287, 4999559, 5999471, 7199369
    ];
    // 可分配的最大数组长度，用于避免 OutOfMemoryException
    HashHelpers.maxPrimeArrayLength = 0x7FEFFFFD;
    es.HashHelpers = HashHelpers;
})(es || (es = {}));
var es;
(function (es) {
    class IdentifierPool {
        constructor() {
            this.nextAvailableId_ = 0;
            this.ids = new es.Bag();
        }
        checkOut() {
            if (this.ids.size() > 0) {
                return this.ids.removeLast();
            }
            return this.nextAvailableId_++;
        }
        checkIn(id) {
            this.ids.add(id);
        }
    }
    es.IdentifierPool = IdentifierPool;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 定义一个实体匹配器类。
     */
    class Matcher {
        constructor() {
            this.allSet = [];
            this.exclusionSet = [];
            this.oneSet = [];
        }
        static empty() {
            return new Matcher();
        }
        getAllSet() {
            return this.allSet;
        }
        getExclusionSet() {
            return this.exclusionSet;
        }
        getOneSet() {
            return this.oneSet;
        }
        isInterestedEntity(e) {
            return this.isInterested(e.componentBits);
        }
        isInterested(components) {
            if (this.allSet.length !== 0) {
                for (let i = 0; i < this.allSet.length; i++) {
                    const type = this.allSet[i];
                    if (!components.get(es.ComponentTypeManager.getIndexFor(type))) {
                        return false;
                    }
                }
            }
            if (this.exclusionSet.length !== 0) {
                for (let i = 0; i < this.exclusionSet.length; i++) {
                    const type = this.exclusionSet[i];
                    if (components.get(es.ComponentTypeManager.getIndexFor(type))) {
                        return false;
                    }
                }
            }
            if (this.oneSet.length !== 0) {
                for (let i = 0; i < this.oneSet.length; i++) {
                    const type = this.oneSet[i];
                    if (components.get(es.ComponentTypeManager.getIndexFor(type))) {
                        return true;
                    }
                }
                return false;
            }
            return true;
        }
        /**
        * 添加所有包含的组件类型。
        * @param types 所有包含的组件类型列表
        */
        all(...types) {
            this.allSet.push(...types);
            return this;
        }
        /**
         * 添加排除包含的组件类型。
         * @param types 排除包含的组件类型列表
         */
        exclude(...types) {
            this.exclusionSet.push(...types);
            return this;
        }
        /**
         * 添加至少包含其中之一的组件类型。
         * @param types 至少包含其中之一的组件类型列表
         */
        one(...types) {
            this.oneSet.push(...types);
            return this;
        }
    }
    es.Matcher = Matcher;
})(es || (es = {}));
var es;
(function (es) {
    class StringUtils {
        /**
         * 匹配中文字符
         * @param str 需要匹配的字符串
         * @return
         */
        static matchChineseWord(str) {
            //中文字符的unicode值[\u4E00-\u9FA5]
            let patternA = /[\u4E00-\u9FA5]+/gim;
            return str.match(patternA);
        }
        /**
         * 去除字符串左端的空白字符
         * @param target 目标字符串
         * @return
         */
        static lTrim(target) {
            let startIndex = 0;
            while (this.isWhiteSpace(target.charAt(startIndex))) {
                startIndex++;
            }
            return target.slice(startIndex, target.length);
        }
        /**
         * 去除字符串右端的空白字符
         * @param target 目标字符串
         * @return
         */
        static rTrim(target) {
            let endIndex = target.length - 1;
            while (this.isWhiteSpace(target.charAt(endIndex))) {
                endIndex--;
            }
            return target.slice(0, endIndex + 1);
        }
        /**
         * 返回一个去除2段空白字符的字符串
         * @param target
         * @return 返回一个去除2段空白字符的字符串
         */
        static trim(target) {
            if (target == null) {
                return null;
            }
            return this.rTrim(this.lTrim(target));
        }
        /**
         * 返回该字符是否为空白字符
         * @param    str
         * @return  返回该字符是否为空白字符
         */
        static isWhiteSpace(str) {
            if (str == " " || str == "\t" || str == "\r" || str == "\n")
                return true;
            return false;
        }
        /**
         * 返回该字符是否为空字符或者为null
         * @param str
         * @returns
         */
        static isNullOrEmpty(str) {
            if (str == "" || str == null || str == undefined)
                return true;
            return false;
        }
        /**
         * 返回执行替换后的字符串
         * @param mainStr 待查找字符串
         * @param targetStr 目标字符串
         * @param replaceStr 替换字符串
         * @param caseMark 是否忽略大小写
         * @return 返回执行替换后的字符串
         */
        static replaceMatch(mainStr, targetStr, replaceStr, caseMark = false) {
            let len = mainStr.length;
            let tempStr = "";
            let isMatch = false;
            let tempTarget = caseMark == true ? targetStr.toLowerCase() : targetStr;
            for (let i = 0; i < len; i++) {
                isMatch = false;
                if (mainStr.charAt(i) == tempTarget.charAt(0)) {
                    if (mainStr.substr(i, tempTarget.length) == tempTarget) {
                        isMatch = true;
                    }
                }
                if (isMatch) {
                    tempStr += replaceStr;
                    i = i + tempTarget.length - 1;
                }
                else {
                    tempStr += mainStr.charAt(i);
                }
            }
            return tempStr;
        }
        /**
         * 用html实体换掉字符窜中的特殊字符
         * @param str 需要替换的字符串
         * @param reversion 是否翻转替换：将转义符号替换为正常的符号
         * @return 换掉特殊字符后的字符串
         */
        static htmlSpecialChars(str, reversion = false) {
            let len = this.specialSigns.length;
            for (let i = 0; i < len; i += 2) {
                let from;
                let to;
                from = this.specialSigns[i];
                to = this.specialSigns[i + 1];
                if (reversion) {
                    let temp = from;
                    from = to;
                    to = temp;
                }
                str = this.replaceMatch(str, from, to);
            }
            return str;
        }
        /**
         * 给数字字符前面添 "0"
         *
         * @param str 要进行处理的字符串
         * @param width 处理后字符串的长度，
         *              如果str.length >= width，将不做任何处理直接返回原始的str。
         * @return
         *
         */
        static zfill(str, width = 2) {
            if (!str) {
                return str;
            }
            width = Math.floor(width);
            let slen = str.length;
            if (slen >= width) {
                return str;
            }
            let negative = false;
            if (str.substr(0, 1) == '-') {
                negative = true;
                str = str.substr(1);
            }
            let len = width - slen;
            for (let i = 0; i < len; i++) {
                str = '0' + str;
            }
            if (negative) {
                str = '-' + str;
            }
            return str;
        }
        /**
         * 翻转字符串
         * @param str 字符串
         * @return 翻转后的字符串
         */
        static reverse(str) {
            if (str.length > 1)
                return this.reverse(str.substring(1)) + str.substring(0, 1);
            else
                return str;
        }
        /**
         * 截断某段字符串
         * @param str 目标字符串
         * @param start 需要截断的起始索引
         * @param en 截断长度
         * @param order 顺序，true从字符串头部开始计算，false从字符串尾巴开始结算。
         * @return 截断后的字符串
         */
        static cutOff(str, start, len, order = true) {
            start = Math.floor(start);
            len = Math.floor(len);
            let length = str.length;
            if (start > length)
                start = length;
            let s = start;
            let e = start + len;
            let newStr;
            if (order) {
                newStr = str.substring(0, s) + str.substr(e, length);
            }
            else {
                s = length - 1 - start - len;
                e = s + len;
                newStr = str.substring(0, s + 1) + str.substr(e + 1, length);
            }
            return newStr;
        }
        /**
         * {0} 字符替换
         */
        static strReplace(str, rStr) {
            let i = 0, len = rStr.length;
            for (; i < len; i++) {
                if (rStr[i] == null || rStr[i] == "") {
                    rStr[i] = "无";
                }
                str = str.replace("{" + i + "}", rStr[i]);
            }
            return str;
        }
        static format(str, ...args) {
            for (let i = 0; i < args.length - 1; i++) {
                let reg = new RegExp("\\{" + i + "\\}", "gm");
                str = str.replace(reg, args[i + 1]);
            }
            return str;
        }
    }
    /**
     * 特殊符号字符串
     */
    StringUtils.specialSigns = [
        '&', '&amp;',
        '<', '&lt;',
        '>', '&gt;',
        '"', '&quot;',
        "'", '&apos;',
        '®', '&reg;',
        '©', '&copy;',
        '™', '&trade;',
    ];
    es.StringUtils = StringUtils;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 时间管理器，用于管理游戏中的时间相关属性
     */
    class Time {
        /**
         * 更新时间管理器
         * @param currentTime 当前时间
         * @param useEngineTime 是否使用引擎时间
         */
        static update(currentTime, useEngineTime) {
            let dt = 0;
            if (useEngineTime) {
                dt = currentTime;
            }
            else {
                // 如果当前时间为 -1，则表示使用系统时间
                if (currentTime === -1) {
                    currentTime = Date.now();
                }
                // 如果上一次记录的时间为 -1，则表示当前为第一次调用 update
                if (this._lastTime === -1) {
                    this._lastTime = currentTime;
                }
                // 计算两次调用 update 之间的时间差，并将其转换为秒
                dt = (currentTime - this._lastTime) / 1000;
            }
            // 如果计算得到的时间差超过了最大时间步长，则将其限制为最大时间步长
            if (dt > this.maxDeltaTime) {
                dt = this.maxDeltaTime;
            }
            // 更新时间管理器的各个属性
            this.totalTime += dt;
            this.deltaTime = dt * this.timeScale;
            this.unscaledDeltaTime = dt;
            this.timeSinceSceneLoad += dt;
            this.frameCount++;
            // 记录当前时间，以备下一次调用 update 使用
            this._lastTime = currentTime;
        }
        static sceneChanged() {
            this.timeSinceSceneLoad = 0;
        }
        /**
         * 检查指定时间间隔是否已过去
         * @param interval 指定时间间隔
         * @returns 是否已过去指定时间间隔
         */
        static checkEvery(interval) {
            // 计算当前时刻所经过的完整时间间隔个数（向下取整）
            const passedIntervals = Math.floor(this.timeSinceSceneLoad / interval);
            // 计算上一帧到当前帧经过的时间所包含的时间间隔个数（向下取整）
            const deltaIntervals = Math.floor(this.deltaTime / interval);
            // 如果当前时刻所经过的时间间隔数比上一帧所经过的时间间隔数多，则说明时间间隔已过去
            return passedIntervals > deltaIntervals;
        }
    }
    /** 游戏运行的总时间，单位为秒 */
    Time.totalTime = 0;
    /** deltaTime 的未缩放版本，不受时间尺度的影响 */
    Time.unscaledDeltaTime = 0;
    /** 前一帧到当前帧的时间增量，按时间刻度进行缩放 */
    Time.deltaTime = 0;
    /** 时间刻度缩放，可以加快或减慢游戏时间 */
    Time.timeScale = 1;
    /** DeltaTime 可以为的最大值，避免游戏出现卡顿情况 */
    Time.maxDeltaTime = Number.MAX_VALUE;
    /** 已传递的帧总数 */
    Time.frameCount = 0;
    /** 自场景加载以来的总时间，单位为秒 */
    Time.timeSinceSceneLoad = 0;
    /** 上一次记录的时间，用于计算两次调用 update 之间的时间差 */
    Time._lastTime = -1;
    es.Time = Time;
})(es || (es = {}));
var es;
(function (es) {
    class TimeUtils {
        /**
         * 获取日期对应的年份和月份的数字组合
         * @param d 要获取月份的日期对象，不传则默认为当前时间
         * @returns 返回数字组合的年份和月份
         */
        static monthId(d = null) {
            // 如果传入了时间，则使用传入的时间，否则使用当前时间
            d = d ? d : new Date();
            // 获取当前年份
            let y = d.getFullYear();
            // 获取当前月份，并将月份转化为两位数的字符串格式
            let m = d.getMonth() + 1;
            let g = m < 10 ? "0" : "";
            // 返回年份和月份的数字组合
            return parseInt(y + g + m);
        }
        /**
         * 获取日期的数字组合
         * @param t - 可选参数，传入时间，若不传入则使用当前时间
         * @returns 数字组合
         */
        static dateId(t = null) {
            // 如果传入了时间，则使用传入的时间，否则使用当前时间
            t = t ? t : new Date();
            // 获取当前月份，并将月份转化为两位数的字符串格式
            let m = t.getMonth() + 1;
            let a = m < 10 ? "0" : "";
            // 获取当前日期，并将日期转化为两位数的字符串格式
            let d = t.getDate();
            let b = d < 10 ? "0" : "";
            // 返回年份、月份和日期的数字组合
            return parseInt(t.getFullYear() + a + m + b + d);
        }
        /**
         * 获取当前日期所在周的数字组合
         * @param d - 可选参数，传入日期，若不传入则使用当前日期
         * @param first - 是否将当前周视为本年度的第1周，默认为true
         * @returns 数字组合
         */
        static weekId(d = null, first = true) {
            d = d ? d : new Date();
            const c = new Date(d.getTime()); // 复制一个新的日期对象，以免改变原始日期对象
            c.setDate(1);
            c.setMonth(0); // 将日期设置为当年的第一天
            const year = c.getFullYear();
            let firstDay = c.getDay();
            if (firstDay == 0) {
                firstDay = 7;
            }
            let max = false;
            if (firstDay <= 4) {
                max = firstDay > 1;
                c.setDate(c.getDate() - (firstDay - 1));
            }
            else {
                c.setDate(c.getDate() + 7 - firstDay + 1);
            }
            let num = this.diffDay(d, c, false); // 计算当前日期与本年度的第一个星期一之间的天数
            if (num < 0) {
                // 当前日期在本年度第一个星期一之前，则返回上一年度的最后一个星期
                c.setDate(1);
                c.setMonth(0);
                c.setDate(c.getDate() - 1);
                return this.weekId(c, false);
            }
            // 计算当前日期在本年度中是第几个星期
            const week = Math.floor(num / 7);
            const weekIdx = Math.floor(week) + 1;
            if (weekIdx == 53) {
                c.setTime(d.getTime());
                c.setDate(c.getDate() - 1);
                let endDay = c.getDay();
                if (endDay == 0) {
                    endDay = 7;
                }
                if (first && (!max || endDay < 4)) {
                    // 如果当前日期在本年度的最后一个星期并且当前年度的星期数不足53或当前日期在本年度第53周的星期4或更早，则返回下一年度的第1周
                    c.setFullYear(c.getFullYear() + 1);
                    c.setDate(1);
                    c.setMonth(0);
                    return this.weekId(c, false);
                }
            }
            const g = weekIdx > 9 ? "" : "0";
            const s = year + "00" + g + weekIdx; // 加上00防止和月份ID冲突
            return parseInt(s);
        }
        /**
         * 计算两个日期之间相差的天数
         * @param a 第一个日期
         * @param b 第二个日期
         * @param fixOne 是否将相差天数四舍五入到整数
         * @returns 两个日期之间相差的天数
         */
        static diffDay(a, b, fixOne = false) {
            let x = (a.getTime() - b.getTime()) / 86400000; // 计算两个日期相差的毫秒数，然后除以一天的毫秒数，得到相差的天数
            return fixOne ? Math.ceil(x) : Math.floor(x); // 如果 fixOne 参数为 true，则将相差天数四舍五入到整数，否则向下取整
        }
        /**
         * 获取指定日期所在周的第一天
         * @param d 指定日期，默认值为今天
         * @returns 指定日期所在周的第一天
         */
        static getFirstDayOfWeek(d = new Date()) {
            // 获取当前日期是星期几，如果是0，则设置为7
            let dayOfWeek = d.getDay() || 7;
            // 计算出指定日期所在周的第一天，即将指定日期减去星期几再加1
            // 这里用1减去dayOfWeek是为了保证星期一为一周的第一天
            return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1 - dayOfWeek, 0, 0, 0, 0);
        }
        /**
         * 获取当日凌晨时间
         */
        static getFirstOfDay(d) {
            d = d ? d : new Date();
            d.setHours(0, 0, 0, 0);
            return d;
        }
        /**
         * 获取次日凌晨时间
         */
        static getNextFirstOfDay(d) {
            return new Date(this.getFirstOfDay(d).getTime() + 86400000);
        }
        /**
         * 格式化日期为 "YYYY-MM-DD" 的字符串形式
         * @param date 要格式化的日期
         * @returns 格式化后的日期字符串
         */
        static formatDate(date) {
            let y = date.getFullYear();
            let m = date.getMonth() + 1;
            m = m < 10 ? '0' + m : m;
            let d = date.getDate();
            d = d < 10 ? ('0' + d) : d;
            return y + '-' + m + '-' + d;
        }
        /**
         * 将日期对象格式化为 "YYYY-MM-DD HH:mm:ss" 的字符串
         * @param date 日期对象
         * @returns 格式化后的字符串
         */
        static formatDateTime(date) {
            let y = date.getFullYear();
            let m = date.getMonth() + 1;
            m = m < 10 ? ('0' + m) : m;
            let d = date.getDate();
            d = d < 10 ? ('0' + d) : d;
            let h = date.getHours();
            let i = date.getMinutes();
            i = i < 10 ? ('0' + i) : i;
            let s = date.getSeconds();
            s = s < 10 ? ('0' + s) : s;
            return y + '-' + m + '-' + d + ' ' + h + ':' + i + ":" + s;
        }
        /**
         * 将字符串解析为Date对象
         * @param s 要解析的日期字符串，例如：2022-01-01
         * @returns 返回解析后的Date对象，如果解析失败，则返回当前时间的Date对象
         */
        static parseDate(s) {
            let t = Date.parse(s);
            if (!isNaN(t)) {
                // 如果日期字符串中的分隔符为“-”，则需要先将其转换为“/”，否则解析会失败
                return new Date(Date.parse(s.replace(/-/g, "/")));
            }
            else {
                return new Date();
            }
        }
        /**
         * 将秒数转换为时分秒的格式
         * @param time 秒数
         * @param partition 分隔符
         * @param showHour 是否显示小时位
         * @returns 转换后的时间字符串
         */
        static secondToTime(time = 0, partition = ":", showHour = true) {
            let hours = Math.floor(time / 3600);
            let minutes = Math.floor(time % 3600 / 60);
            let seconds = Math.floor(time % 3600 % 60);
            let h = hours.toString();
            let m = minutes.toString();
            let s = seconds.toString();
            if (hours < 10)
                h = "0" + h;
            if (minutes < 10)
                m = "0" + m;
            if (seconds < 10)
                s = "0" + s;
            let timeStr;
            if (showHour)
                timeStr = h + partition + m + partition + s;
            else
                timeStr = m + partition + s;
            return timeStr;
        }
        /**
         * 将时间字符串转换为毫秒数
         * @param time 时间字符串，如 "01:30:15" 表示 1小时30分钟15秒
         * @param partition 分隔符，默认为 ":"
         * @returns 转换后的毫秒数字符串
         */
        static timeToMillisecond(time, partition = ":") {
            let _ary = time.split(partition);
            let timeNum = 0;
            let len = _ary.length;
            // 将时间转换成毫秒数
            for (let i = 0; i < len; i++) {
                let n = _ary[i];
                timeNum += n * Math.pow(60, (len - 1 - i));
            }
            timeNum *= 1000;
            return timeNum.toString();
        }
    }
    es.TimeUtils = TimeUtils;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 三次方和二次方贝塞尔帮助器(cubic and quadratic bezier helper)
     */
    class Bezier {
        /**
         * 求解二次曲折线
         * @param p0
         * @param p1
         * @param p2
         * @param t
         */
        static getPoint(p0, p1, p2, t) {
            t = es.MathHelper.clamp01(t);
            let oneMinusT = 1 - t;
            return p0.scale(oneMinusT * oneMinusT)
                .addEqual(p1.scale(2 * oneMinusT * t))
                .addEqual(p2.scale(t * t));
        }
        /**
         * 求解一个立方体曲率
         * @param start
         * @param firstControlPoint
         * @param secondControlPoint
         * @param end
         * @param t
         */
        static getPointThree(start, firstControlPoint, secondControlPoint, end, t) {
            t = es.MathHelper.clamp01(t);
            const oneMinusT = 1 - t;
            return start.scale(oneMinusT * oneMinusT * oneMinusT)
                .addEqual(firstControlPoint.scale(3 * oneMinusT * oneMinusT * t))
                .addEqual(secondControlPoint.scale(3 * oneMinusT * t * t))
                .addEqual(end.scale(t * t * t));
        }
        /**
         * 得到二次贝塞尔函数的一阶导数
         * @param p0
         * @param p1
         * @param p2
         * @param t
         */
        static getFirstDerivative(p0, p1, p2, t) {
            return p1.sub(p0).scale(2 * (1 - t))
                .addEqual(p2.sub(p1).scale(2 * t));
        }
        /**
         * 得到一个三次贝塞尔函数的一阶导数
         * @param start
         * @param firstControlPoint
         * @param secondControlPoint
         * @param end
         * @param t
         */
        static getFirstDerivativeThree(start, firstControlPoint, secondControlPoint, end, t) {
            t = es.MathHelper.clamp01(t);
            let oneMunusT = 1 - t;
            return firstControlPoint.sub(start).scale(3 * oneMunusT * oneMunusT)
                .addEqual(secondControlPoint.sub(firstControlPoint).scale(6 * oneMunusT * t))
                .addEqual(end.sub(secondControlPoint).scale(3 * t * t));
        }
        /**
         * 递归地细分bezier曲线，直到满足距离校正
         * 在这种算法中，平面切片的点要比曲面切片少。返回完成后应返回到ListPool的合并列表。
         * @param start
         * @param firstCtrlPoint
         * @param secondCtrlPoint
         * @param end
         * @param distanceTolerance
         */
        static getOptimizedDrawingPoints(start, firstCtrlPoint, secondCtrlPoint, end, distanceTolerance = 1) {
            let points = es.ListPool.obtain(es.Vector2);
            points.push(start);
            this.recursiveGetOptimizedDrawingPoints(start, firstCtrlPoint, secondCtrlPoint, end, points, distanceTolerance);
            points.push(end);
            return points;
        }
        /**
         * 递归地细分bezier曲线，直到满足距离校正。在这种算法中，平面切片的点要比曲面切片少。
         * @param start
         * @param firstCtrlPoint
         * @param secondCtrlPoint
         * @param end
         * @param points
         * @param distanceTolerance
         */
        static recursiveGetOptimizedDrawingPoints(start, firstCtrlPoint, secondCtrlPoint, end, points, distanceTolerance) {
            // 计算线段的所有中点
            let pt12 = es.Vector2.divideScaler(start.add(firstCtrlPoint), 2);
            let pt23 = es.Vector2.divideScaler(firstCtrlPoint.add(secondCtrlPoint), 2);
            let pt34 = es.Vector2.divideScaler(secondCtrlPoint.add(end), 2);
            // 计算新半直线的中点
            let pt123 = es.Vector2.divideScaler(pt12.add(pt23), 2);
            let pt234 = es.Vector2.divideScaler(pt23.add(pt34), 2);
            // 最后再细分最后两个中点。如果我们满足我们的距离公差，这将是我们使用的最后一点。
            let pt1234 = es.Vector2.divideScaler(pt123.add(pt234), 2);
            // 试着用一条直线来近似整个三次曲线
            let deltaLine = end.sub(start);
            let d2 = Math.abs(((firstCtrlPoint.x, end.x) * deltaLine.y - (firstCtrlPoint.y - end.y) * deltaLine.x));
            let d3 = Math.abs(((secondCtrlPoint.x - end.x) * deltaLine.y - (secondCtrlPoint.y - end.y) * deltaLine.x));
            if ((d2 + d3) * (d2 + d3) < distanceTolerance * (deltaLine.x * deltaLine.x + deltaLine.y * deltaLine.y)) {
                points.push(pt1234);
                return;
            }
            // 继续细分
            this.recursiveGetOptimizedDrawingPoints(start, pt12, pt123, pt1234, points, distanceTolerance);
            this.recursiveGetOptimizedDrawingPoints(pt1234, pt234, pt34, end, points, distanceTolerance);
        }
    }
    es.Bezier = Bezier;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 提供了一系列立方贝塞尔点，并提供了帮助方法来访问贝塞尔
     */
    class BezierSpline {
        constructor() {
            this._points = [];
            this._curveCount = 0;
        }
        /**
         * 在这个过程中，t被修改为在曲线段的范围内。
         * @param t
         */
        pointIndexAtTime(t) {
            const res = { time: 0, range: 0 };
            if (t >= 1) {
                t = 1;
                res.range = this._points.length - 4;
            }
            else {
                t = es.MathHelper.clamp01(t) * this._curveCount;
                res.range = es.MathHelper.toInt(t);
                t -= res.range;
                res.range *= 3;
            }
            res.time = t;
            return res;
        }
        /**
         * 设置一个控制点，考虑到这是否是一个共享点，如果是，则适当调整
         * @param index
         * @param point
         */
        setControlPoint(index, point) {
            if (index % 3 == 0) {
                const delta = point.sub(this._points[index]);
                if (index > 0)
                    this._points[index - 1].addEqual(delta);
                if (index + 1 < this._points.length)
                    this._points[index + 1].addEqual(delta);
            }
            this._points[index] = point;
        }
        /**
         * 得到时间t的贝塞尔曲线上的点
         * @param t
         */
        getPointAtTime(t) {
            const res = this.pointIndexAtTime(t);
            const i = res.range;
            return es.Bezier.getPointThree(this._points[i], this._points[i + 1], this._points[i + 2], this._points[i + 3], t);
        }
        /**
         * 得到贝塞尔在时间t的速度（第一导数）
         * @param t
         */
        getVelocityAtTime(t) {
            const res = this.pointIndexAtTime(t);
            const i = res.range;
            return es.Bezier.getFirstDerivativeThree(this._points[i], this._points[i + 1], this._points[i + 2], this._points[i + 3], t);
        }
        /**
         * 得到时间t时贝塞尔的方向（归一化第一导数）
         * @param t
         */
        getDirectionAtTime(t) {
            return this.getVelocityAtTime(t).normalize();
        }
        /**
         * 在贝塞尔曲线上添加一条曲线
         * @param start
         * @param firstControlPoint
         * @param secondControlPoint
         * @param end
         */
        addCurve(start, firstControlPoint, secondControlPoint, end) {
            // 只有当这是第一条曲线时，我们才会添加起始点。对于其他所有的曲线，前一个曲线的终点应该等于新曲线的起点。
            if (this._points.length == 0)
                this._points.push(start);
            this._points.push(firstControlPoint);
            this._points.push(secondControlPoint);
            this._points.push(end);
            this._curveCount = (this._points.length - 1) / 3;
        }
        /**
         * 重置bezier，移除所有点
         */
        reset() {
            this._points.length = 0;
        }
        /**
         * 将splitine分解成totalSegments部分，并返回使用线条绘制所需的所有点
         * @param totalSegments
         */
        getDrawingPoints(totalSegments) {
            let points = [];
            for (let i = 0; i < totalSegments; i++) {
                let t = i / totalSegments;
                points[i] = this.getPointAtTime(t);
            }
            return points;
        }
    }
    es.BezierSpline = BezierSpline;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 一个用于操作二进制标志（也称为位字段）
     */
    class Flags {
        /**
         * 检查指定二进制数字中是否已设置了指定标志位
         * @param self 二进制数字
         * @param flag 标志位，应该为2的幂
         * @returns 如果设置了指定的标志位，则返回true，否则返回false
         */
        static isFlagSet(self, flag) {
            return (self & flag) !== 0;
        }
        /**
         * 检查指定二进制数字中是否已设置未移位的指定标志位
         * @param self 二进制数字
         * @param flag 标志位，不应移位（应为2的幂）
         * @returns 如果设置了指定的标志位，则返回true，否则返回false
         */
        static isUnshiftedFlagSet(self, flag) {
            flag = 1 << flag;
            return (self & flag) !== 0;
        }
        /**
         * 将指定的标志位设置为二进制数字的唯一标志
         * @param self 二进制数字
         * @param flag 标志位，应该为2的幂
         */
        static setFlagExclusive(self, flag) {
            self.value = 1 << flag;
        }
        /**
         * 将指定的标志位设置为二进制数字
         * @param self 二进制数字的引用
         * @param flag 标志位，应该为2的幂
         */
        static setFlag(self, flag) {
            self.value |= 1 << flag;
        }
        /**
         * 将指定的标志位从二进制数字中取消设置
         * @param self 二进制数字的引用
         * @param flag 标志位，应该为2的幂
         */
        static unsetFlag(self, flag) {
            flag = 1 << flag;
            self.value &= ~flag;
        }
        /**
         * 反转二进制数字中的所有位（将1变为0，将0变为1）
         * @param self 二进制数字的引用
         */
        static invertFlags(self) {
            self.value = ~self.value;
        }
        /**
         * 返回二进制数字的字符串表示形式（以二进制形式）
         * @param self 二进制数字
         * @param leftPadWidth 返回的字符串的最小宽度（在左侧填充0）
         * @returns 二进制数字的字符串表示形式
         */
        static binaryStringRepresentation(self, leftPadWidth = 10) {
            let str = self.toString(2);
            while (str.length < (leftPadWidth || 2)) {
                str = "0" + str;
            }
            return str;
        }
    }
    es.Flags = Flags;
})(es || (es = {}));
var es;
(function (es) {
    class MathHelper {
        /**
         * 将弧度转换成角度。
         * @param radians 用弧度表示的角
         */
        static toDegrees(radians) {
            return radians * 57.295779513082320876798154814105;
        }
        /**
         * 将角度转换为弧度
         * @param degrees
         */
        static toRadians(degrees) {
            return degrees * 0.017453292519943295769236907684886;
        }
        /**
         * 计算三角形上给定两个归一化重心坐标所确定点在某个轴上的笛卡尔坐标
         * @param value1 三角形上某个顶点在该轴上的笛卡尔坐标
         * @param value2 三角形上另一个顶点在该轴上的笛卡尔坐标
         * @param value3 三角形上第三个顶点在该轴上的笛卡尔坐标
         * @param amount1 第一个重心坐标，即点相对于三角形边2的面积比例
         * @param amount2 第二个重心坐标，即点相对于三角形边1的面积比例
         * @returns 计算出的点在该轴上的笛卡尔坐标
         */
        static barycentric(value1, value2, value3, amount1, amount2) {
            // 计算边2上的点的笛卡尔坐标
            const point2 = value2 + (value3 - value2) * amount2;
            // 计算从边1起点到点的向量
            const vector = (point2 - value1) * (amount1 / (1 - amount1));
            // 返回点在该轴上的笛卡尔坐标
            return value1 + vector;
        }
        /**
         * 使用Catmull-Rom插值算法在指定的四个数值之间进行插值，返回给定位置的插值结果
         * @param value1 插值范围中的第一个数据点
         * @param value2 插值范围中的第二个数据点
         * @param value3 插值范围中的第三个数据点
         * @param value4 插值范围中的第四个数据点
         * @param amount 插值位置的值，取值范围为[0, 1]，表示该位置在value2和value3之间的相对位置
         * @returns 经过Catmull-Rom插值计算后在给定位置的插值结果
         */
        static catmullRom(value1, value2, value3, value4, amount) {
            // 计算输入参数amount的平方和立方值
            const amountSquared = amount * amount;
            const amountCubed = amountSquared * amount;
            // 使用Catmull-Rom插值算法计算插值结果
            const p0 = (-value1 + 3 * value2 - 3 * value3 + value4) / 2;
            const p1 = 2 * value1 - 5 * value2 + 4 * value3 - value4 / 2;
            const p2 = (-value1 + value3) / 2;
            const p3 = (value2 - value1 + value3 - value4) / 2;
            return p0 * amountCubed + p1 * amountSquared + p2 * amount + p3;
        }
        /**
         * 对给定值进行范围映射。
         * @param value 要映射的值。
         * @param leftMin 输入范围的最小值。
         * @param leftMax 输入范围的最大值。
         * @param rightMin 输出范围的最小值。
         * @param rightMax 输出范围的最大值。
         * @returns 映射后的值。
         */
        static map(value, leftMin, leftMax, rightMin, rightMax) {
            // 使用线性插值公式进行映射
            return rightMin + (value - leftMin) * (rightMax - rightMin) / (leftMax - leftMin);
        }
        /**
         * 将值从任意范围映射到0到1范围
         * @param value
         * @param min
         * @param max
         * @returns
         */
        static map01(value, min, max) {
            return (value - min) * 1 / (max - min);
        }
        /**
         * 接收一个值value和两个边界min和max作为参数。它将value映射到0到1的范围内，然后返回1减去该结果的值，因此该函数的结果将在1到0之间
         * @param value
         * @param min
         * @param max
         * @returns
         */
        static map10(value, min, max) {
            // 将 value 映射到 0 到 1 的范围内
            const mappedValue = this.map01(value, min, max);
            // 返回 1 减去 mappedValue 的值，结果将在 1 到 0 之间
            return 1 - mappedValue;
        }
        /**
         * 在两个值之间进行平滑的线性插值。与 lerp 相似，但具有平滑过渡的特点，当 t 在 0 和 1 之间时，返回 [value1, value2] 之间平滑插值后的结果。
         * @param value1 起始值
         * @param value2 结束值
         * @param amount 插值的程度，范围在 0 到 1 之间。
         * @returns 两个值之间进行平滑的线性插值后的结果。
         */
        static smoothStep(value1, value2, amount) {
            amount = this.clamp01(amount); // 将 amount 的值限制在 0 到 1 之间
            amount = this.hermite(value1, 0, value2, 0, amount); // 使用 hermite 函数进行平滑插值
            return amount; // 返回插值后的结果
        }
        /**
         * 将给定角度减小到π到-π之间的值
         * @param angle 给定角度值
         * @returns 减小后的角度值，保证在[-π, π]的范围内
         */
        static wrapAngle(angle) {
            // 将角度值限制在[-2π, 2π]的范围内，这样可以保证取余运算得到的结果始终为正数
            const angleMod = (angle + 2 * Math.PI) % (2 * Math.PI);
            // 如果计算出的余数大于π，则将其减去2π，使得结果在[-π, π]的范围内
            if (angleMod > Math.PI) {
                return angleMod - 2 * Math.PI;
            }
            else {
                return angleMod;
            }
        }
        /**
         * 判断给定的数值是否是2的幂
         * @param value
         * @returns
         */
        static isPowerOfTwo(value) {
            // 确保值大于0
            if (value <= 0) {
                return false;
            }
            // 检查是否为2的幂
            return (value & (value - 1)) == 0;
        }
        /**
         * 线性插值
         * @param from
         * @param to
         * @param t
         * @returns
         */
        static lerp(from, to, t) {
            // 计算在 from 和 to 之间 t 所占的比例
            const clampedT = MathHelper.clamp01(t);
            // 计算 from 到 to 的差值，再乘以比例，得到从 from 到 to 之间 t 所在的位置
            return from + (to - from) * clampedT;
        }
        /**
         * 线性插值前检查两个数的差是否小于一个给定的epsilon值，如果小于，则直接返回结束值b，否则执行线性插值并返回插值结果。
         * @param a 起始值
         * @param b 结束值
         * @param t 插值因子
         * @param epsilon 差值阈值，当两个数的差小于epsilon时直接返回结束值b。
         * @returns 如果a和b的差小于给定的epsilon值，则返回b，否则返回a到b的插值结果。
         */
        static betterLerp(a, b, t, epsilon) {
            return Math.abs(a - b) < epsilon ? b : MathHelper.lerp(a, b, t);
        }
        /**
         * 在两个角度之间进行插值，使用角度值表示角度
         * @param a 起始角度
         * @param b 结束角度
         * @param t 插值比例，范围[0, 1]
         * @returns 两个角度之间插值后的角度，使用角度值表示
         */
        static lerpAngle(a, b, t) {
            // 计算从a到b的差值，对于超过360的值，需要进行修正
            let deltaAngle = this.repeat(b - a, 360);
            if (deltaAngle > 180) {
                deltaAngle -= 360;
            }
            // 返回经过插值后的角度
            return a + deltaAngle * this.clamp01(t);
        }
        /**
         * 在两个角度之间进行插值，使用弧度值表示角度
         * @param a 起始角度
         * @param b 结束角度
         * @param t 插值比例，范围[0, 1]
         * @returns 两个角度之间插值后的角度，使用弧度值表示
         */
        static lerpAngleRadians(a, b, t) {
            // 计算从a到b的差值，对于超过2π的值，需要进行修正
            let deltaAngle = this.repeat(b - a, Math.PI * 2);
            if (deltaAngle > Math.PI) {
                deltaAngle -= Math.PI * 2;
            }
            // 返回经过插值后的角度
            return a + deltaAngle * this.clamp01(t);
        }
        /**
         * 指定长度上来回“弹跳”（ping-pong）一个变量
         * 因为弹跳的过程是来回循环的。最后，根据t在弹跳过程中相对于length的位置
         * @param t 变量的当前值
         * @param length 指定的长度
         * @returns 0到length之间变化的值
         */
        static pingPong(t, length) {
            // 将t的值限制在0到length*2的范围内
            t = this.repeat(t, length * 2);
            // 返回length和t-length的差的绝对值
            return length - Math.abs(t - length);
        }
        /**
         * 当value的绝对值大于等于threshold时返回value的符号，否则返回0
         * @param value - 输入的值
         * @param threshold - 阈值
         * @returns value的符号或0
         */
        static signThreshold(value, threshold) {
            if (Math.abs(value) >= threshold) // 如果绝对值大于等于阈值
                return Math.sign(value); // 返回value的符号
            else
                return 0; // 否则返回0
        }
        /**
         * 计算t值在[from, to]区间内的插值比例
         * @param from 插值区间的起点
         * @param to 插值区间的终点
         * @param t 需要计算插值比例的数值
         * @returns t值在[from, to]区间内的插值比例，取值范围在[0, 1]之间
         */
        static inverseLerp(from, to, t) {
            // 计算插值区间的长度
            const length = to - from;
            // 如果插值区间的长度为0，则返回0
            if (length === 0) {
                return 0;
            }
            // 计算t在插值区间中的相对位置，并返回插值比例
            return (t - from) / length;
        }
        /**
         * 精确的线性插值，避免出现累积误差
         * @param value1 起始值
         * @param value2 结束值
         * @param amount 插值比例
         * @returns 两个值的线性插值结果
         */
        static lerpPrecise(value1, value2, amount) {
            return ((1 - amount) * value1) + (value2 * amount);
        }
        /**
         * 将给定值限制在指定范围内
         * @param value 需要被限制的值
         * @param min 最小值
         * @param max 最大值
         * @returns 限制后的值
         */
        static clamp(value, min, max) {
            if (value < min) { // 如果值小于最小值，则返回最小值
                return min;
            }
            else if (value > max) { // 如果值大于最大值，则返回最大值
                return max;
            }
            else { // 否则返回原始值
                return value;
            }
        }
        /**
         * 按照指定增量取整到最接近的整数倍数
         * @param value
         * @param increment
         * @returns
         */
        static snap(value, increment) {
            // 将给定值除以增量取整后再乘以增量，得到最接近给定值的整数倍
            return Math.round(value / increment) * increment;
        }
        /**
         * 如果值为偶数，返回true
         * @param value
         */
        static isEven(value) {
            return value % 2 == 0;
        }
        /**
         * 如果值是奇数，则返回true
         * @param value
         * @returns
         */
        static isOdd(value) {
            return value % 2 != 0;
        }
        /**
         * 将数值四舍五入到最接近的整数，并计算四舍五入的数量
         * @param value 要四舍五入的数值
         * @param roundedAmount 用于存储四舍五入的数量的参数
         * @returns 四舍五入后的整数
         */
        static roundWithRoundedAmount(value, roundedAmount) {
            let rounded = Math.round(value);
            roundedAmount.value = value - (rounded * Math.round(value / rounded));
            return rounded;
        }
        /**
         * 将一个数值限制在 [0,1] 范围内
         * @param value 要限制的数值
         * @returns 限制后的数值
         */
        static clamp01(value) {
            if (value < 0)
                return 0;
            if (value > 1)
                return 1;
            return value;
        }
        /**
         * 计算从一个向量到另一个向量之间的角度
         * @param from 起始向量
         * @param to 目标向量
         * @returns 两个向量之间的角度（弧度制）
         */
        static angleBetweenVectors(from, to) {
            // 使用 Math.atan2() 方法计算出两个向量之间的夹角，返回的是弧度制角度
            return Math.atan2(to.y - from.y, to.x - from.x);
        }
        /**
         * 将极角和极径转换为向量坐标
         * @param angleRadians 极角弧度值
         * @param length 极径长度
         * @returns 对应向量坐标
         */
        static angleToVector(angleRadians, length) {
            // 根据给定的极角弧度值，使用三角函数计算出向量的x坐标和y坐标
            const x = Math.cos(angleRadians) * length;
            const y = Math.sin(angleRadians) * length;
            // 使用上一步得到的坐标值创建一个新的Vector2对象并返回
            return new es.Vector2(x, y);
        }
        /**
         * 将一个数加上1，并在结果等于指定长度时将其设置为0
         * @param t 要加上1的数
         * @param length 指定长度
         * @returns 加上1后的结果，如果等于指定长度，则为0
         */
        static incrementWithWrap(t, length) {
            // 将给定数t加上1。
            t++;
            // 如果结果等于指定长度，则返回0。
            if (t == length) {
                return 0;
            }
            // 否则，返回结果。
            return t;
        }
        /**
         * 将一个数减去1，并在结果小于0时将其设置为指定长度减去1
         * @param t 要减去1的数
         * @param length 指定长度
         * @returns 减去1后的结果，如果小于0，则为指定长度减去1
         */
        static decrementWithWrap(t, length) {
            // 将给定数t减去1。
            t--;
            // 如果结果小于0，则返回指定长度减去1。
            if (t < 0) {
                return length - 1;
            }
            // 否则，返回结果。
            return t;
        }
        /**
         * 计算直角三角形斜边长度，即求两个数的欧几里得距离
         * @param x 直角三角形的一条直角边
         * @param y 直角三角形的另一条直角边
         * @returns 三角形斜边长度
         */
        static hypotenuse(x, y) {
            // 将x的平方与y的平方相加。
            let sumOfSquares = x * x + y * y;
            // 对和进行平方根运算。
            let result = Math.sqrt(sumOfSquares);
            // 返回结果。
            return result;
        }
        /**
         * 计算大于给定数字的最小二次幂
         * @param x 给定数字
         * @returns 大于给定数字的最小二次幂
         */
        static closestPowerOfTwoGreaterThan(x) {
            x--; // 将给定数字减1，得到一个二进制数的掩码。
            x |= (x >> 1); // 将掩码的右侧一半全部设置为1。
            x |= (x >> 2);
            x |= (x >> 4);
            x |= (x >> 8);
            x |= (x >> 16); // 连续将掩码右移，并将右侧一半全部设置为1，直到得到一个全为1的掩码。
            return (x + 1); // 将全为1的掩码加1，得到的结果就是大于给定数字的最小二次幂。
        }
        /**
         * 将数字舍入到最接近的指定值
         * @param value 需要被舍入的数字
         * @param roundToNearest 指定的舍入值
         * @returns 舍入后的结果
         */
        static roundToNearest(value, roundToNearest) {
            const quotient = value / roundToNearest; // 将数字除以指定值，得到商。
            const roundedQuotient = Math.round(quotient); // 将商四舍五入到最接近的整数。
            const result = roundedQuotient * roundToNearest; // 将舍入后的整数乘以指定值，得到最终结果。
            return result;
        }
        /**
         * 判断给定值是否接近于零
         * @param value 给定值
         * @param ep 阈值（可选，默认为Epsilon）
         * @returns 如果接近于零，返回true，否则返回false
         */
        static withinEpsilon(value, ep = this.Epsilon) {
            // 判断给定值的绝对值是否小于给定的阈值ep。
            return Math.abs(value) < ep;
        }
        /**
         * 逐渐逼近目标值
         * @param start 起始值
         * @param end 目标值
         * @param shift 逼近步长
         * @returns 逼近后的值
         */
        static approach(start, end, shift) {
            // 判断起始值是否小于目标值。
            if (start < end) {
                // 如果是，返回起始值加上shift和目标值中的较小值。
                return Math.min(start + shift, end);
            }
            // 如果不是，返回起始值减去shift和目标值中的较大值。
            return Math.max(start - shift, end);
        }
        /**
         * 逐渐逼近目标角度
         * @param start 起始角度
         * @param end 目标角度
         * @param shift 逼近步长
         * @returns 最终角度
         */
        static approachAngle(start, end, shift) {
            // 调用this.deltaAngle()方法，获取起始角度和目标角度之间的夹角。
            let deltaAngle = this.deltaAngle(start, end);
            // 判断夹角是否小于等于shift，如果是，直接返回目标角度。
            if (-shift < deltaAngle && deltaAngle < shift) {
                return end;
            }
            // 如果夹角大于shift，则调用this.approach()方法，逐渐逼近目标角度。
            let newAngle = this.approach(start, start + deltaAngle, shift);
            // 通过调用this.repeat()方法，将最终的角度限制在0到360度之间。
            newAngle = this.repeat(newAngle, 360);
            // 返回最终的角度。
            return newAngle;
        }
        /**
         * 计算向量在另一个向量上的投影向量
         * @param self 要投影的向量
         * @param other 目标向量
         * @returns 投影向量
         */
        static project(self, other) {
            // 通过调用Vector2.dot()方法，计算出self向量和other向量的点积。
            let amt = self.dot(other) / other.lengthSquared();
            // 通过调用Vector2.lengthSquared()方法，计算出other向量的长度的平方。
            // 将点积除以长度的平方，得到self向量在other向量上的投影长度。
            // 通过调用Vector2.scale()方法，将投影长度与other向量的方向向量相乘，得到投影向量。
            let vec = other.scale(amt);
            // 返回投影向量。
            return vec;
        }
        /**
         * 逐渐接近目标角度
         * @param start 当前角度值（弧度制）
         * @param end 目标角度值（弧度制）
         * @param shift 每次逐渐接近目标角度的增量（弧度制）
         * @returns 逐渐接近目标角度后的角度值（弧度制）
         */
        static approachAngleRadians(start, end, shift) {
            // 通过调用deltaAngleRadians()方法，计算出当前角度值和目标角度值之间的弧度差值。
            let deltaAngleRadians = this.deltaAngleRadians(start, end);
            // 如果弧度差值的绝对值小于shift，则返回目标角度值。
            if (-shift < deltaAngleRadians && deltaAngleRadians < shift) {
                return end;
            }
            // 否则，通过调用approach()方法，逐渐将当前角度值接近目标角度值。
            let result = this.approach(start, start + deltaAngleRadians, shift);
            // 将计算结果使用repeat()方法转换成[0, 2π)之间的角度值，并返回。
            return this.repeat(result, Math.PI * 2);
        }
        /**
         * 判断两个数值是否在指定公差内近似相等
         * @param value1 第一个数值
         * @param value2 第二个数值
         * @param tolerance 指定公差，默认为 Epsilon 常量
         * @returns 是否在指定公差内近似相等
         */
        static approximately(value1, value2, tolerance = this.Epsilon) {
            // 计算两个数值之差的绝对值是否小于等于指定公差。
            return Math.abs(value1 - value2) <= tolerance;
        }
        /**
         * 计算两个角度值之间的角度差值
         * @param current 当前角度值
         * @param target 目标角度值
         * @returns 角度差值
         */
        static deltaAngle(current, target) {
            // 通过调用repeat()方法，计算出当前角度值和目标角度值之间的差值。
            let num = this.repeat(target - current, 360);
            // 如果差值大于180度，则将差值减去360度，得到[-180度, 180度]之间的差值。
            if (num > 180) {
                num -= 360;
            }
            // 返回差值。
            return num;
        }
        /**
         * 判断给定数值是否在指定区间内
         * @param value 给定数值
         * @param min 区间最小值
         * @param max 区间最大值
         * @returns 是否在指定区间内
         */
        static between(value, min, max) {
            // 比较给定数值是否大于等于最小值并且小于等于最大值。
            return value >= min && value <= max;
        }
        /**
         * 计算两个弧度值之间的角度差值
         * @param current 当前弧度值
         * @param target 目标弧度值
         * @returns 角度差值
         */
        static deltaAngleRadians(current, target) {
            // 通过调用repeat()方法，计算出当前弧度值和目标弧度值之间的差值。
            let num = this.repeat(target - current, 2 * Math.PI);
            // 如果差值大于π，则将差值减去2π，得到[-π, π]之间的差值。
            if (num > Math.PI) {
                num -= 2 * Math.PI;
            }
            // 返回差值。
            return num;
        }
        /**
         * 将给定的数值限定在一个循环范围内
         * @param t 给定的数值
         * @param length 循环范围长度
         * @returns 限定在循环范围内的数值
         */
        static repeat(t, length) {
            // 计算给定数值除以循环范围长度的整数部分，即循环次数。
            const num = Math.floor(t / length);
            // 用给定数值减去循环次数乘以循环范围长度，得到限定在循环范围内的数值。
            const result = t - num * length;
            // 返回限定后的数值。
            return result;
        }
        /**
         * 将给定的浮点数向下取整为整数
         * @param f 给定的浮点数
         * @returns 向下取整后的整数
         */
        static floorToInt(f) {
            // 使用Math.floor()方法，将给定的浮点数向下取整为最接近它的小于等于它的整数。
            const flooredValue = Math.floor(f);
            // 调用toInt()方法，将结果转换为整数类型。
            return this.toInt(flooredValue);
        }
        /**
         * 绕着一个点旋转
         * @param position 原点坐标
         * @param speed 旋转速度
         * @returns 经过旋转后的点坐标
         */
        static rotateAround(position, speed) {
            // 计算旋转角度，使用当前时间与旋转速度的乘积作为参数进行计算。
            const angleInRadians = es.Time.totalTime * speed;
            // 通过三角函数，计算出在当前时间下，距离原点为1的点在x轴和y轴上的坐标值。
            const cosValue = Math.cos(angleInRadians);
            const sinValue = Math.sin(angleInRadians);
            // 将计算出的x轴和y轴的坐标值加上原点的坐标值，得到旋转后的点的坐标值。
            const rotatedX = position.x + cosValue;
            const rotatedY = position.y + sinValue;
            // 创建一个新的Vector2对象，将上面得到的旋转后的点的坐标值作为参数，返回该对象。
            return new es.Vector2(rotatedX, rotatedY);
        }
        /**
         * 绕给定中心点旋转指定角度后得到的新点坐标
         * @param point 要旋转的点的坐标
         * @param center 旋转中心点的坐标
         * @param angleIndegrees 旋转的角度，单位为度
         * @returns 旋转后的新点的坐标，返回值类型为Vector2
         */
        static rotateAround2(point, center, angleIndegrees) {
            const { x: cx, y: cy } = center;
            const { x: px, y: py } = point;
            const angleInRadians = this.toRadians(angleIndegrees); // 将角度值转换为弧度值
            const cos = Math.cos(angleInRadians); // 计算cos值
            const sin = Math.sin(angleInRadians); // 计算sin值
            const rotatedX = cos * (px - cx) - sin * (py - cy) + cx; // 计算旋转后的新点的x坐标
            const rotatedY = sin * (px - cx) + cos * (py - cy) + cy; // 计算旋转后的新点的y坐标
            return new es.Vector2(rotatedX, rotatedY); // 返回旋转后的新点的坐标
        }
        /**
         * 计算以给定点为圆心、给定半径的圆上某一点的坐标
         * @param circleCenter 圆心坐标
         * @param radius 圆半径
         * @param angleInDegrees 角度值（度数制）
         * @returns 计算出的圆上某一点的坐标
         */
        static pointOnCircle(circleCenter, radius, angleInDegrees) {
            // 将给定角度值转换为弧度值，以便使用三角函数计算坐标值。
            const radians = this.toRadians(angleInDegrees);
            // 根据弧度值，通过三角函数（cos和sin）计算出该角度对应的x和y坐标的值（其中x坐标对应cos值，y坐标对应sin值）。
            const x = Math.cos(radians) * radius;
            const y = Math.sin(radians) * radius;
            // 将x坐标值乘以半径，再加上圆心的x坐标，得到该点在x轴上的绝对坐标。
            const absoluteX = x + circleCenter.x;
            // 将y坐标值乘以半径，再加上圆心的y坐标，得到该点在y轴上的绝对坐标。
            const absoluteY = y + circleCenter.y;
            // 创建一个新的Vector2对象，将上面得到的x和y坐标作为参数，返回该对象。
            return new es.Vector2(absoluteX, absoluteY);
        }
        /**
         * 计算以给定点为圆心、给定半径的圆上某一点的坐标
         * @param circleCenter 圆心坐标
         * @param radius 圆半径
         * @param angleInRadians 角度值（弧度制）
         * @returns 计算出的圆上某一点的坐标
         */
        static pointOnCircleRadians(circleCenter, radius, angleInRadians) {
            // 根据给定角度值，通过三角函数（cos和sin）计算出该角度对应的x和y坐标的值（其中x坐标对应cos值，y坐标对应sin值）。
            const x = Math.cos(angleInRadians) * radius;
            const y = Math.sin(angleInRadians) * radius;
            // 将x坐标值乘以半径，再加上圆心的x坐标，得到该点在x轴上的绝对坐标。
            const absoluteX = x + circleCenter.x;
            // 将y坐标值乘以半径，再加上圆心的y坐标，得到该点在y轴上的绝对坐标。
            const absoluteY = y + circleCenter.y;
            // 创建一个新的Vector2对象，将上面得到的x和y坐标作为参数，返回该对象。
            return new es.Vector2(absoluteX, absoluteY);
        }
        /**
         * 生成一个Lissajous曲线上的点的坐标
         * @param xFrequency x方向上的频率，默认值为2
         * @param yFrequency y方向上的频率，默认值为3
         * @param xMagnitude x方向上的振幅，默认值为1
         * @param yMagnitude y方向上的振幅，默认值为1
         * @param phase 相位，默认值为0
         * @returns 在Lissajous曲线上的点的坐标，返回值类型为Vector2
         */
        static lissajou(xFrequency = 2, yFrequency = 3, xMagnitude = 1, yMagnitude = 1, phase = 0) {
            const x = Math.sin(es.Time.totalTime * xFrequency + phase) * xMagnitude; // 计算x方向上的坐标
            const y = Math.cos(es.Time.totalTime * yFrequency) * yMagnitude; // 计算y方向上的坐标
            return new es.Vector2(x, y); // 返回在Lissajous曲线上的点的坐标
        }
        /**
         * 生成阻尼的 Lissajous 曲线
         * @param xFrequency x 轴上的频率
         * @param yFrequency y 轴上的频率
         * @param xMagnitude x 轴上的振幅
         * @param yMagnitude y 轴上的振幅
         * @param phase x 轴相位差
         * @param damping 阻尼值
         * @param oscillationInterval 振荡间隔
         */
        static lissajouDamped(xFrequency = 2, yFrequency = 3, xMagnitude = 1, yMagnitude = 1, phase = 0.5, damping = 0, oscillationInterval = 5) {
            // 将时间戳限制在振荡间隔内
            const wrappedTime = this.pingPong(es.Time.totalTime, oscillationInterval);
            // 计算阻尼值
            const damped = Math.pow(Math.E, -damping * wrappedTime);
            // 计算 x 和 y 方向上的振荡值
            const x = damped * Math.sin(es.Time.totalTime * xFrequency + phase) * xMagnitude;
            const y = damped * Math.cos(es.Time.totalTime * yFrequency) * yMagnitude;
            // 返回二维向量
            return new es.Vector2(x, y);
        }
        /**
         * 计算在曲线上特定位置的值。
         * @param value1 第一个插值点的值
         * @param tangent1 第一个插值点的切线或方向向量
         * @param value2 第二个插值点的值
         * @param tangent2 第二个插值点的切线或方向向量
         * @param amount 在这两个点之间进行插值的位置
         * @returns 在曲线上特定位置的值
         */
        static hermite(value1, tangent1, value2, tangent2, amount) {
            let s = amount;
            let sCubed = s * s * s;
            let sSquared = s * s;
            // 如果在第一个插值点，直接返回第一个插值点的值
            if (amount === 0) {
                return value1;
            }
            // 如果在第二个插值点，直接返回第二个插值点的值
            else if (amount === 1) {
                return value2;
            }
            // 否则，根据Hermite插值公式计算特定位置的值
            let v1 = value1, v2 = value2, t1 = tangent1, t2 = tangent2;
            let result = (2 * v1 - 2 * v2 + t2 + t1) * sCubed +
                (3 * v2 - 3 * v1 - 2 * t1 - t2) * sSquared +
                t1 * s +
                v1;
            return result;
        }
        /**
         * 判断给定的数字是否有效
         * 如果输入的数字是 NaN 或正无穷大，该函数将返回 false；否则返回 true
         * @param x
         * @returns
         */
        static isValid(x) {
            // 如果输入的数字是 NaN，返回 false
            if (Number.isNaN(x)) {
                return false;
            }
            // 如果输入的数字是正无穷大，返回 false
            // 注意，负无穷大在这里被认为是有效的数字
            if (x === Infinity) {
                return false;
            }
            // 如果输入的数字既不是 NaN，也不是正无穷大，返回 true
            return true;
        }
        /**
         * 平滑阻尼运动，将当前位置平滑过渡到目标位置，返回一个包含当前位置和当前速度的对象
         * @param current 当前位置
         * @param target 目标位置
         * @param currentVelocity 当前速度
         * @param smoothTime 平滑时间
         * @param maxSpeed 最大速度
         * @param deltaTime 时间增量
         * @returns 一个包含当前位置和当前速度的对象，类型为{ value: number; currentVelocity: number }
         */
        static smoothDamp(current, target, currentVelocity, smoothTime, maxSpeed, deltaTime) {
            smoothTime = Math.max(0.0001, smoothTime); // 平滑时间至少为0.0001，避免出现除以0的情况
            const omega = 2 / smoothTime; // 根据平滑时间计算阻尼系数
            const x = omega * deltaTime; // 计算阻尼系数与时间增量的乘积
            const exp = 1 / (1 + 0.48 * x + 0.235 * x * x); // 计算阻尼比
            const maxDelta = maxSpeed * smoothTime; // 计算最大速度与平滑时间的乘积
            let delta = current - target; // 计算当前位置与目标位置之间的距离
            delta = MathHelper.clamp(delta, -maxDelta, maxDelta); // 将距离限制在最大速度和最大速度的相反数之间
            target = current - delta; // 计算新的目标位置
            const temp = (currentVelocity + omega * delta) * deltaTime; // 计算当前速度和阻尼力的和乘以时间增量
            currentVelocity = (currentVelocity - omega * temp) * exp; // 计算新的当前速度
            let newValue = target + (delta + temp) * exp; // 计算新的当前位置
            if (current > target === newValue > target) { // 如果新的当前位置超过了目标位置，则将当前位置设置为目标位置，并计算新的当前速度
                newValue = target;
                currentVelocity = (newValue - target) / deltaTime;
            }
            return { value: newValue, currentVelocity }; // 返回包含当前位置和当前速度的对象
        }
        /**
         * 平滑插值两个二维向量
         * @param current 当前向量
         * @param target 目标向量
         * @param currentVelocity 当前速度向量
         * @param smoothTime 平滑插值时间
         * @param maxSpeed 最大速度
         * @param deltaTime 帧间隔时间
         * @returns 插值后的结果向量
         */
        static smoothDampVector(current, target, currentVelocity, smoothTime, maxSpeed, deltaTime) {
            const v = es.Vector2.zero; // 创建一个初始向量v，其x和y坐标都为0。
            // 对当前向量的x和y坐标进行平滑插值，得到插值结果和当前速度。
            const resX = this.smoothDamp(current.x, target.x, currentVelocity.x, smoothTime, maxSpeed, deltaTime);
            v.x = resX.value; // 将插值结果赋值给向量v的x坐标。
            currentVelocity.x = resX.currentVelocity; // 将当前速度赋值给向量currentVelocity的x坐标。
            const resY = this.smoothDamp(current.y, target.y, currentVelocity.y, smoothTime, maxSpeed, deltaTime);
            v.y = resY.value; // 将插值结果赋值给向量v的y坐标。
            currentVelocity.y = resY.currentVelocity; // 将当前速度赋值给向量currentVelocity的y坐标。
            return v; // 返回向量v。
        }
        /**
         * 将一个值从一个区间映射到另一个区间
         * @param value 需要映射的值
         * @param leftMin 所在区间的最小值
         * @param leftMax 所在区间的最大值
         * @param rightMin 需要映射到的目标区间的最小值
         * @param rightMax 需要映射到的目标区间的最大值
         * @returns
         */
        static mapMinMax(value, leftMin, leftMax, rightMin, rightMax) {
            // 先将 value 限制在 [leftMin, leftMax] 区间内
            let clampedValue = MathHelper.clamp(value, leftMin, leftMax);
            // 计算映射到 [rightMin, rightMax] 区间内的值
            return rightMin + (clampedValue - leftMin) * (rightMax - rightMin) / (leftMax - leftMin);
        }
        /**
         * 返回一个给定角度的单位向量。角度被解释为弧度制。
         * @param angle - 给定角度，以弧度制表示。
         * @returns 一个新的已归一化的二维向量。
         */
        static fromAngle(angle) {
            // 返回一个新的二维向量，其中x和y分别设置为给定角度的余弦和正弦值，然后进行归一化以产生单位向量。
            return new es.Vector2(Math.cos(angle), Math.sin(angle)).normalizeEqual();
        }
        /**
         * 将一个数字转换为最接近的整数
         * @param val 需要被转换的数字
         * @returns 最接近的整数
         */
        static toInt(val) {
            if (val > 0) { // 如果数字大于0，则向下舍入为最接近的整数。
                return Math.floor(val);
            }
            else { // 如果数字小于等于0，则向上舍入为最接近的整数。
                return Math.ceil(val);
            }
        }
    }
    MathHelper.Epsilon = 0.00001;
    MathHelper.Rad2Deg = 57.29578;
    MathHelper.Deg2Rad = 0.0174532924;
    /**
     * 表示pi除以2的值(1.57079637)
     */
    MathHelper.PiOver2 = Math.PI / 2;
    es.MathHelper = MathHelper;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 代表右手4x4浮点矩阵，可以存储平移、比例和旋转信息
     */
    class Matrix {
        static get Identity() {
            return this.identity;
        }
        constructor(m11, m12, m13, m14, m21, m22, m23, m24, m31, m32, m33, m34, m41, m42, m43, m44) {
            this.m11 = m11;
            this.m12 = m12;
            this.m13 = m13;
            this.m14 = m14;
            this.m21 = m21;
            this.m22 = m22;
            this.m23 = m23;
            this.m24 = m24;
            this.m31 = m31;
            this.m32 = m32;
            this.m33 = m33;
            this.m34 = m34;
            this.m41 = m41;
            this.m42 = m42;
            this.m43 = m43;
            this.m44 = m44;
        }
        /**
         * 为自定义的正交视图创建一个新的投影矩阵
         * @param left
         * @param right
         * @param top
         * @param zFarPlane
         * @param result
         */
        static createOrthographicOffCenter(left, right, bottom, top, zNearPlane, zFarPlane, result = new Matrix()) {
            result.m11 = 2 / (right - left);
            result.m12 = 0;
            result.m13 = 0;
            result.m14 = 0;
            result.m21 = 0;
            result.m22 = 2 / (top - bottom);
            result.m23 = 0;
            result.m24 = 0;
            result.m31 = 0;
            result.m32 = 0;
            result.m33 = 1 / (zNearPlane - zFarPlane);
            result.m34 = 0;
            result.m41 = (left + right) / (left - right);
            result.m42 = (top + bottom) / (bottom - top);
            result.m43 = zNearPlane / (zNearPlane - zFarPlane);
            result.m44 = 1;
        }
        static createTranslation(position, result) {
            result.m11 = 1;
            result.m12 = 0;
            result.m13 = 0;
            result.m14 = 0;
            result.m21 = 0;
            result.m22 = 1;
            result.m23 = 0;
            result.m24 = 0;
            result.m31 = 0;
            result.m32 = 0;
            result.m33 = 1;
            result.m34 = 0;
            result.m41 = position.x;
            result.m42 = position.y;
            result.m43 = 0;
            result.m44 = 1;
        }
        static createRotationZ(radians, result) {
            result = Matrix.Identity;
            var val1 = Math.cos(radians);
            var val2 = Math.sin(radians);
            result.m11 = val1;
            result.m12 = val2;
            result.m21 = -val2;
            result.m22 = val1;
        }
        /**
         * 创建一个新的矩阵，其中包含两个矩阵的乘法。
         * @param matrix1
         * @param matrix2
         * @param result
         */
        static multiply(matrix1, matrix2, result = new Matrix()) {
            let m11 = (((matrix1.m11 * matrix2.m11) + (matrix1.m12 * matrix2.m21)) + (matrix1.m13 * matrix2.m31)) + (matrix1.m14 * matrix2.m41);
            let m12 = (((matrix1.m11 * matrix2.m12) + (matrix1.m12 * matrix2.m22)) + (matrix1.m13 * matrix2.m32)) + (matrix1.m14 * matrix2.m42);
            let m13 = (((matrix1.m11 * matrix2.m13) + (matrix1.m12 * matrix2.m23)) + (matrix1.m13 * matrix2.m33)) + (matrix1.m14 * matrix2.m43);
            let m14 = (((matrix1.m11 * matrix2.m14) + (matrix1.m12 * matrix2.m24)) + (matrix1.m13 * matrix2.m34)) + (matrix1.m14 * matrix2.m44);
            let m21 = (((matrix1.m21 * matrix2.m11) + (matrix1.m22 * matrix2.m21)) + (matrix1.m23 * matrix2.m31)) + (matrix1.m24 * matrix2.m41);
            let m22 = (((matrix1.m21 * matrix2.m12) + (matrix1.m22 * matrix2.m22)) + (matrix1.m23 * matrix2.m32)) + (matrix1.m24 * matrix2.m42);
            let m23 = (((matrix1.m21 * matrix2.m13) + (matrix1.m22 * matrix2.m23)) + (matrix1.m23 * matrix2.m33)) + (matrix1.m24 * matrix2.m43);
            let m24 = (((matrix1.m21 * matrix2.m14) + (matrix1.m22 * matrix2.m24)) + (matrix1.m23 * matrix2.m34)) + (matrix1.m24 * matrix2.m44);
            let m31 = (((matrix1.m31 * matrix2.m11) + (matrix1.m32 * matrix2.m21)) + (matrix1.m33 * matrix2.m31)) + (matrix1.m34 * matrix2.m41);
            let m32 = (((matrix1.m31 * matrix2.m12) + (matrix1.m32 * matrix2.m22)) + (matrix1.m33 * matrix2.m32)) + (matrix1.m34 * matrix2.m42);
            let m33 = (((matrix1.m31 * matrix2.m13) + (matrix1.m32 * matrix2.m23)) + (matrix1.m33 * matrix2.m33)) + (matrix1.m34 * matrix2.m43);
            let m34 = (((matrix1.m31 * matrix2.m14) + (matrix1.m32 * matrix2.m24)) + (matrix1.m33 * matrix2.m34)) + (matrix1.m34 * matrix2.m44);
            let m41 = (((matrix1.m41 * matrix2.m11) + (matrix1.m42 * matrix2.m21)) + (matrix1.m43 * matrix2.m31)) + (matrix1.m44 * matrix2.m41);
            let m42 = (((matrix1.m41 * matrix2.m12) + (matrix1.m42 * matrix2.m22)) + (matrix1.m43 * matrix2.m32)) + (matrix1.m44 * matrix2.m42);
            let m43 = (((matrix1.m41 * matrix2.m13) + (matrix1.m42 * matrix2.m23)) + (matrix1.m43 * matrix2.m33)) + (matrix1.m44 * matrix2.m43);
            let m44 = (((matrix1.m41 * matrix2.m14) + (matrix1.m42 * matrix2.m24)) + (matrix1.m43 * matrix2.m34)) + (matrix1.m44 * matrix2.m44);
            result.m11 = m11;
            result.m12 = m12;
            result.m13 = m13;
            result.m14 = m14;
            result.m21 = m21;
            result.m22 = m22;
            result.m23 = m23;
            result.m24 = m24;
            result.m31 = m31;
            result.m32 = m32;
            result.m33 = m33;
            result.m34 = m34;
            result.m41 = m41;
            result.m42 = m42;
            result.m43 = m43;
            result.m44 = m44;
        }
    }
    Matrix.identity = new Matrix(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    es.Matrix = Matrix;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 表示右手3 * 3的浮点矩阵，可以存储平移、缩放和旋转信息。
     */
    class Matrix2D {
        constructor() {
            this.m11 = 0; // x 缩放
            this.m12 = 0;
            this.m21 = 0;
            this.m22 = 0;
            this.m31 = 0;
            this.m32 = 0;
        }
        /**
         * 返回标识矩阵
         */
        static get identity() {
            return new Matrix2D().setIdentity();
        }
        setIdentity() {
            return this.setValues(1, 0, 0, 1, 0, 0);
        }
        setValues(m11, m12, m21, m22, m31, m32) {
            this.m11 = m11;
            this.m12 = m12;
            this.m21 = m21;
            this.m22 = m22;
            this.m31 = m31;
            this.m32 = m32;
            return this;
        }
        /**
         * 储存在该矩阵中的位置
         */
        get translation() {
            return new es.Vector2(this.m31, this.m32);
        }
        set translation(value) {
            this.m31 = value.x;
            this.m32 = value.y;
        }
        /**
         * 以弧度为单位的旋转，存储在这个矩阵中
         */
        get rotation() {
            return Math.atan2(this.m21, this.m11);
        }
        set rotation(value) {
            let val1 = Math.cos(value);
            let val2 = Math.sin(value);
            this.m11 = val1;
            this.m12 = val2;
            this.m21 = -val2;
            this.m22 = val1;
        }
        /**
         * 矩阵中存储的旋转度数
         */
        get rotationDegrees() {
            return es.MathHelper.toDegrees(this.rotation);
        }
        set rotationDegrees(value) {
            this.rotation = es.MathHelper.toRadians(value);
        }
        /**
         * 储存在这个矩阵中的缩放
         */
        get scale() {
            return new es.Vector2(this.m11, this.m22);
        }
        set scale(value) {
            this.m11 = value.x;
            this.m22 = value.y;
        }
        /**
         * 创建一个新的围绕Z轴的旋转矩阵2D
         * @param radians
         */
        static createRotation(radians, result) {
            result.setIdentity();
            const val1 = Math.cos(radians);
            const val2 = Math.sin(radians);
            result.m11 = val1;
            result.m12 = val2;
            result.m21 = val2 * -1;
            result.m22 = val1;
        }
        static createRotationOut(radians, result) {
            let val1 = Math.cos(radians);
            let val2 = Math.sin(radians);
            result.m11 = val1;
            result.m12 = val2;
            result.m21 = -val2;
            result.m22 = val1;
        }
        /**
         * 创建一个新的缩放矩阵2D
         * @param xScale
         * @param yScale
         */
        static createScale(xScale, yScale, result) {
            result.m11 = xScale;
            result.m12 = 0;
            result.m21 = 0;
            result.m22 = yScale;
            result.m31 = 0;
            result.m32 = 0;
        }
        static createScaleOut(xScale, yScale, result) {
            result.m11 = xScale;
            result.m12 = 0;
            result.m21 = 0;
            result.m22 = yScale;
            result.m31 = 0;
            result.m32 = 0;
        }
        /**
         * 创建一个新的平移矩阵2D
         * @param xPosition
         * @param yPosition
         */
        static createTranslation(xPosition, yPosition, result) {
            result.m11 = 1;
            result.m12 = 0;
            result.m21 = 0;
            result.m22 = 1;
            result.m31 = xPosition;
            result.m32 = yPosition;
            return result;
        }
        static createTranslationOut(position, result) {
            result.m11 = 1;
            result.m12 = 0;
            result.m21 = 0;
            result.m22 = 1;
            result.m31 = position.x;
            result.m32 = position.y;
        }
        static invert(matrix) {
            let det = 1 / matrix.determinant();
            let result = this.identity;
            result.m11 = matrix.m22 * det;
            result.m12 = -matrix.m12 * det;
            result.m21 = -matrix.m21 * det;
            result.m22 = matrix.m11 * det;
            result.m31 = (matrix.m32 * matrix.m21 - matrix.m31 * matrix.m22) * det;
            result.m32 = -(matrix.m32 * matrix.m11 - matrix.m31 * matrix.m12) * det;
            return result;
        }
        /**
         * 创建一个新的matrix, 它包含两个矩阵的和。
         * @param matrix
         */
        add(matrix) {
            this.m11 += matrix.m11;
            this.m12 += matrix.m12;
            this.m21 += matrix.m21;
            this.m22 += matrix.m22;
            this.m31 += matrix.m31;
            this.m32 += matrix.m32;
            return this;
        }
        substract(matrix) {
            this.m11 -= matrix.m11;
            this.m12 -= matrix.m12;
            this.m21 -= matrix.m21;
            this.m22 -= matrix.m22;
            this.m31 -= matrix.m31;
            this.m32 -= matrix.m32;
            return this;
        }
        divide(matrix) {
            this.m11 /= matrix.m11;
            this.m12 /= matrix.m12;
            this.m21 /= matrix.m21;
            this.m22 /= matrix.m22;
            this.m31 /= matrix.m31;
            this.m32 /= matrix.m32;
            return this;
        }
        multiply(matrix) {
            let m11 = (this.m11 * matrix.m11) + (this.m12 * matrix.m21);
            let m12 = (this.m11 * matrix.m12) + (this.m12 * matrix.m22);
            let m21 = (this.m21 * matrix.m11) + (this.m22 * matrix.m21);
            let m22 = (this.m21 * matrix.m12) + (this.m22 * matrix.m22);
            let m31 = (this.m31 * matrix.m11) + (this.m32 * matrix.m21) + matrix.m31;
            let m32 = (this.m31 * matrix.m12) + (this.m32 * matrix.m22) + matrix.m32;
            this.m11 = m11;
            this.m12 = m12;
            this.m21 = m21;
            this.m22 = m22;
            this.m31 = m31;
            this.m32 = m32;
            return this;
        }
        static multiply(matrix1, matrix2, result) {
            const m11 = (matrix1.m11 * matrix2.m11) + (matrix1.m12 * matrix2.m21);
            const m12 = (matrix1.m11 * matrix2.m12) + (matrix1.m12 * matrix2.m22);
            const m21 = (matrix1.m21 * matrix2.m11) + (matrix1.m22 * matrix2.m21);
            const m22 = (matrix1.m21 * matrix2.m12) + (matrix1.m22 * matrix2.m22);
            const m31 = (matrix1.m31 * matrix2.m11) + (matrix1.m32 * matrix2.m21) + matrix2.m31;
            const m32 = (matrix1.m31 * matrix2.m12) + (matrix1.m32 * matrix2.m22) + matrix2.m32;
            result.m11 = m11;
            result.m12 = m12;
            result.m21 = m21;
            result.m22 = m22;
            result.m31 = m31;
            result.m32 = m32;
        }
        determinant() {
            return this.m11 * this.m22 - this.m12 * this.m21;
        }
        /**
         * 创建一个新的Matrix2D，包含指定矩阵中的线性插值。
         * @param matrix1
         * @param matrix2
         * @param amount
         */
        static lerp(matrix1, matrix2, amount) {
            matrix1.m11 = matrix1.m11 + ((matrix2.m11 - matrix1.m11) * amount);
            matrix1.m12 = matrix1.m12 + ((matrix2.m12 - matrix1.m12) * amount);
            matrix1.m21 = matrix1.m21 + ((matrix2.m21 - matrix1.m21) * amount);
            matrix1.m22 = matrix1.m22 + ((matrix2.m22 - matrix1.m22) * amount);
            matrix1.m31 = matrix1.m31 + ((matrix2.m31 - matrix1.m31) * amount);
            matrix1.m32 = matrix1.m32 + ((matrix2.m32 - matrix1.m32) * amount);
            return matrix1;
        }
        /**
         * 交换矩阵的行和列
         * @param matrix
         */
        static transpose(matrix) {
            let ret = this.identity;
            ret.m11 = matrix.m11;
            ret.m12 = matrix.m21;
            ret.m21 = matrix.m12;
            ret.m22 = matrix.m22;
            ret.m31 = 0;
            ret.m32 = 0;
            return ret;
        }
        mutiplyTranslation(x, y) {
            let trans = new Matrix2D();
            Matrix2D.createTranslation(x, y, trans);
            return es.MatrixHelper.multiply(this, trans);
        }
        /**
         * 比较当前实例是否等于指定的Matrix2D
         * @param other
         */
        equals(other) {
            return this == other;
        }
        static toMatrix(mat) {
            let matrix = new es.Matrix();
            matrix.m11 = mat.m11;
            matrix.m12 = mat.m12;
            matrix.m13 = 0;
            matrix.m14 = 0;
            matrix.m21 = mat.m21;
            matrix.m22 = mat.m22;
            matrix.m23 = 0;
            matrix.m24 = 0;
            matrix.m31 = 0;
            matrix.m32 = 0;
            matrix.m33 = 1;
            matrix.m34 = 0;
            matrix.m41 = mat.m31;
            matrix.m42 = mat.m32;
            matrix.m43 = 0;
            matrix.m44 = 1;
            return matrix;
        }
        toString() {
            return `{m11:${this.m11} m12:${this.m12} m21:${this.m21} m22:${this.m22} m31:${this.m31} m32:${this.m32}}`;
        }
    }
    es.Matrix2D = Matrix2D;
})(es || (es = {}));
var es;
(function (es) {
    class MatrixHelper {
        /**
         * 该静态方法用于计算两个 Matrix2D 对象的和。
         * @param {Matrix2D} matrix1 - 加数矩阵。
         * @param {Matrix2D} matrix2 - 加数矩阵。
         * @returns {Matrix2D} - 计算结果的 Matrix2D 对象。
         */
        static add(matrix1, matrix2) {
            // 创建一个新的 Matrix2D 对象以存储计算结果。
            const result = new es.Matrix2D();
            // 计算两个矩阵的和。
            result.m11 = matrix1.m11 + matrix2.m11;
            result.m12 = matrix1.m12 + matrix2.m12;
            result.m21 = matrix1.m21 + matrix2.m21;
            result.m22 = matrix1.m22 + matrix2.m22;
            result.m31 = matrix1.m31 + matrix2.m31;
            result.m32 = matrix1.m32 + matrix2.m32;
            // 返回计算结果的 Matrix2D 对象。
            return result;
        }
        /**
         * 该静态方法用于计算两个 Matrix2D 对象的商。
         * @param {Matrix2D} matrix1 - 被除数矩阵。
         * @param {Matrix2D} matrix2 - 除数矩阵。
         * @returns {Matrix2D} - 计算结果的 Matrix2D 对象。
         */
        static divide(matrix1, matrix2) {
            // 创建一个新的 Matrix2D 对象以存储计算结果。
            const result = new es.Matrix2D();
            // 计算两个矩阵的商。
            result.m11 = matrix1.m11 / matrix2.m11;
            result.m12 = matrix1.m12 / matrix2.m12;
            result.m21 = matrix1.m21 / matrix2.m21;
            result.m22 = matrix1.m22 / matrix2.m22;
            result.m31 = matrix1.m31 / matrix2.m31;
            result.m32 = matrix1.m32 / matrix2.m32;
            // 返回计算结果的 Matrix2D 对象。
            return result;
        }
        /**
         * 该静态方法用于计算两个 Matrix2D 对象或一个 Matrix2D 对象和一个数字的乘积。
         * @param {Matrix2D} matrix1 - 第一个矩阵。
         * @param {Matrix2D | number} matrix2 - 第二个矩阵或一个数字。
         * @returns {Matrix2D} - 计算结果的 Matrix2D 对象。
         */
        static multiply(matrix1, matrix2) {
            // 创建一个新的 Matrix2D 对象以存储计算结果。
            const result = new es.Matrix2D();
            // 根据第二个参数的类型执行不同的计算。
            if (matrix2 instanceof es.Matrix2D) {
                // 执行矩阵乘法。
                result.m11 = matrix1.m11 * matrix2.m11 + matrix1.m12 * matrix2.m21;
                result.m12 = matrix1.m11 * matrix2.m12 + matrix1.m12 * matrix2.m22;
                result.m21 = matrix1.m21 * matrix2.m11 + matrix1.m22 * matrix2.m21;
                result.m22 = matrix1.m21 * matrix2.m12 + matrix1.m22 * matrix2.m22;
                result.m31 = matrix1.m31 * matrix2.m11 + matrix1.m32 * matrix2.m21 + matrix2.m31;
                result.m32 = matrix1.m31 * matrix2.m12 + matrix1.m32 * matrix2.m22 + matrix2.m32;
            }
            else {
                // 执行矩阵和标量的乘法。
                result.m11 = matrix1.m11 * matrix2;
                result.m12 = matrix1.m12 * matrix2;
                result.m21 = matrix1.m21 * matrix2;
                result.m22 = matrix1.m22 * matrix2;
                result.m31 = matrix1.m31 * matrix2;
                result.m32 = matrix1.m32 * matrix2;
            }
            // 返回计算结果的 Matrix2D 对象。
            return result;
        }
        /**
         * 该静态方法用于计算两个 Matrix2D 对象的差。
         * @param {Matrix2D} matrix1 - 第一个矩阵。
         * @param {Matrix2D} matrix2 - 第二个矩阵。
         * @returns {Matrix2D} - 计算结果的 Matrix2D 对象。
         */
        static subtract(matrix1, matrix2) {
            // 创建一个新的 Matrix2D 对象以存储计算结果。
            const result = new es.Matrix2D();
            // 计算两个矩阵的差。
            result.m11 = matrix1.m11 - matrix2.m11;
            result.m12 = matrix1.m12 - matrix2.m12;
            result.m21 = matrix1.m21 - matrix2.m21;
            result.m22 = matrix1.m22 - matrix2.m22;
            result.m31 = matrix1.m31 - matrix2.m31;
            result.m32 = matrix1.m32 - matrix2.m32;
            // 返回计算结果的 Matrix2D 对象。
            return result;
        }
    }
    es.MatrixHelper = MatrixHelper;
})(es || (es = {}));
var es;
(function (es) {
    class Rectangle {
        /**
         * 返回X=0, Y=0, Width=0, Height=0的矩形
         */
        static get empty() {
            return new Rectangle();
        }
        /**
         * 返回一个Number.Min/Max值的矩形
         */
        static get maxRect() {
            return new Rectangle(Number.MIN_VALUE / 2, Number.MIN_VALUE / 2, Number.MAX_VALUE, Number.MAX_VALUE);
        }
        /**
         * 返回此矩形左边缘的X坐标
         */
        get left() {
            return this.x;
        }
        /**
         * 返回此矩形右边缘的X坐标
         */
        get right() {
            return this.x + this.width;
        }
        /**
         * 返回此矩形顶边的y坐标
         */
        get top() {
            return this.y;
        }
        /**
         * 返回此矩形底边的y坐标
         */
        get bottom() {
            return this.y + this.height;
        }
        /**
         * 获取矩形的最大点，即右下角
         */
        get max() {
            return new es.Vector2(this.right, this.bottom);
        }
        /**
         * 这个矩形的宽和高是否为0，位置是否为（0，0）
         */
        isEmpty() {
            return ((((this.width == 0) && (this.height == 0)) && (this.x == 0)) && (this.y == 0));
        }
        /** 这个矩形的左上角坐标 */
        get location() {
            return new es.Vector2(this.x, this.y);
        }
        set location(value) {
            this.x = value.x;
            this.y = value.y;
        }
        /**
         * 这个矩形的宽-高坐标
         */
        get size() {
            return new es.Vector2(this.width, this.height);
        }
        set size(value) {
            this.width = value.x;
            this.height = value.y;
        }
        /**
         * 位于这个矩形中心的一个点
         * 如果 "宽度 "或 "高度 "是奇数，则中心点将向下舍入
         */
        get center() {
            return new es.Vector2(this.x + (this.width / 2), this.y + (this.height / 2));
        }
        /**
         * 创建一个新的Rectanglestruct实例，指定位置、宽度和高度。
         * @param x 创建的矩形的左上角的X坐标
         * @param y 创建的矩形的左上角的y坐标
         * @param width 创建的矩形的宽度
         * @param height 创建的矩形的高度
         */
        constructor(x = 0, y = 0, width = 0, height = 0) {
            /**
             * 该矩形的左上角的x坐标
             */
            this.x = 0;
            /**
             * 该矩形的左上角的y坐标
             */
            this.y = 0;
            /**
             * 该矩形的宽度
             */
            this.width = 0;
            /**
             * 该矩形的高度
             */
            this.height = 0;
            // temp 用于计算边界的矩阵
            this._tempMat = new es.Matrix2D();
            this._transformMat = new es.Matrix2D();
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        }
        /**
         * 创建一个给定最小/最大点（左上角，右下角）的矩形
         * @param minX
         * @param minY
         * @param maxX
         * @param maxY
         */
        static fromMinMax(minX, minY, maxX, maxY) {
            return new Rectangle(minX, minY, maxX - minX, maxY - minY);
        }
        /**
         * 给定多边形的点，计算边界
         * @param points
         * @returns 来自多边形的点
         */
        static rectEncompassingPoints(points) {
            // 我们需要求出x/y的最小值/最大值
            let minX = Number.POSITIVE_INFINITY;
            let minY = Number.POSITIVE_INFINITY;
            let maxX = Number.NEGATIVE_INFINITY;
            let maxY = Number.NEGATIVE_INFINITY;
            for (let i = 0; i < points.length; i++) {
                let pt = points[i];
                if (pt.x < minX)
                    minX = pt.x;
                if (pt.x > maxX)
                    maxX = pt.x;
                if (pt.y < minY)
                    minY = pt.y;
                if (pt.y > maxY)
                    maxY = pt.y;
            }
            return this.fromMinMax(minX, minY, maxX, maxY);
        }
        /**
         * 获取指定边缘的位置
         * @param edge
         */
        getSide(edge) {
            switch (edge) {
                case es.Edge.top:
                    return this.top;
                case es.Edge.bottom:
                    return this.bottom;
                case es.Edge.left:
                    return this.left;
                case es.Edge.right:
                    return this.right;
                default:
                    throw new Error("Argument Out Of Range");
            }
        }
        /**
         * 获取所提供的坐标是否在这个矩形的范围内
         * @param x 检查封堵点的X坐标
         * @param y 检查封堵点的Y坐标
         */
        contains(x, y) {
            return ((((this.x <= x) && (x < (this.x + this.width))) &&
                (this.y <= y)) && (y < (this.y + this.height)));
        }
        /**
         * 按指定的水平和垂直方向调整此矩形的边缘
         * @param horizontalAmount 调整左、右边缘的值
         * @param verticalAmount 调整上、下边缘的值
         */
        inflate(horizontalAmount, verticalAmount) {
            this.x -= horizontalAmount;
            this.y -= verticalAmount;
            this.width += horizontalAmount * 2;
            this.height += verticalAmount * 2;
        }
        /**
         * 获取其他矩形是否与这个矩形相交
         * @param value 另一个用于测试的矩形
         */
        intersects(value) {
            return value.left < this.right &&
                this.left < value.right &&
                value.top < this.bottom &&
                this.top < value.bottom;
        }
        rayIntersects(ray) {
            // 存储相交点和相交距离
            const res = { intersected: false, distance: 0 };
            let maxValue = Infinity;
            // 计算射线与矩形的相交距离
            if (Math.abs(ray.direction.x) < 1E-06) {
                // 如果射线方向的x分量很小，说明它是垂直的，那么它就不会相交
                if (ray.start.x < this.x || ray.start.x > this.x + this.width) {
                    return res;
                }
            }
            else {
                // 计算射线与x边界的交点，以及在矩形上面和下面的交点
                const num11 = 1 / ray.direction.x;
                let num8 = (this.x - ray.start.x) * num11;
                let num7 = (this.x + this.width - ray.start.x) * num11;
                if (num8 > num7) {
                    [num7, num8] = [num8, num7];
                }
                // 将最远的相交距离更新为上下两个交点中更远的那个
                res.distance = Math.max(num8, res.distance);
                maxValue = Math.min(num7, maxValue);
                if (res.distance > maxValue) {
                    return res;
                }
            }
            // 计算射线与y边界的交点，以及在矩形左边和右边的交点
            if (Math.abs(ray.direction.y) < 1e-06) {
                if (ray.start.y < this.y || ray.start.y > this.y + this.height) {
                    return res;
                }
            }
            else {
                const num10 = 1 / ray.direction.y;
                let num6 = (this.y - ray.start.y) * num10;
                let num5 = (this.y + this.height - ray.start.y) * num10;
                if (num6 > num5) {
                    [num5, num6] = [num6, num5];
                }
                // 将最远的相交距离更新为左右两个交点中更远的那个
                res.distance = Math.max(num6, res.distance);
                maxValue = Math.min(num5, maxValue);
                if (res.distance > maxValue) {
                    return res;
                }
            }
            // 如果相交了，将标志设为真，并返回相交点
            res.intersected = true;
            return res;
        }
        /**
         * 获取所提供的矩形是否在此矩形的边界内
         * @param value
         */
        containsRect(value) {
            return ((((this.x <= value.x) && (value.x < (this.x + this.width))) &&
                (this.y <= value.y)) &&
                (value.y < (this.y + this.height)));
        }
        getHalfSize() {
            return new es.Vector2(this.width * 0.5, this.height * 0.5);
        }
        getClosestPointOnBoundsToOrigin() {
            let max = this.max;
            let minDist = Math.abs(this.location.x);
            let boundsPoint = new es.Vector2(this.location.x, 0);
            if (Math.abs(max.x) < minDist) {
                minDist = Math.abs(max.x);
                boundsPoint.x = max.x;
                boundsPoint.y = 0;
            }
            if (Math.abs(max.y) < minDist) {
                minDist = Math.abs(max.y);
                boundsPoint.x = 0;
                boundsPoint.y = max.y;
            }
            if (Math.abs(this.location.y) < minDist) {
                minDist = Math.abs(this.location.y);
                boundsPoint.x = 0;
                boundsPoint.y = this.location.y;
            }
            return boundsPoint;
        }
        /**
         * 返回离给定点最近的点
         * @param point 矩形上离点最近的点
         */
        getClosestPointOnRectangleToPoint(point) {
            // 对于每条轴，如果点在框外，就把它限制在框内，否则就不要管它
            let res = es.Vector2.zero;
            res.x = es.MathHelper.clamp(point.x, this.left, this.right);
            res.y = es.MathHelper.clamp(point.y, this.top, this.bottom);
            return res;
        }
        /**
         * 获取矩形边界上与给定点最近的点
         * @param point
         * @param edgeNormal
         * @returns 矩形边框上离点最近的点
         */
        getClosestPointOnRectangleBorderToPoint(point, edgeNormal) {
            edgeNormal.value = es.Vector2.zero;
            // 对于每条轴，如果点在框外，就把它限制在框内，否则就不要管它
            const res = es.Vector2.zero;
            res.x = es.MathHelper.clamp(point.x, this.left, this.right);
            res.y = es.MathHelper.clamp(point.y, this.top, this.bottom);
            // 如果点在矩形内，我们需要将res推到边界上，因为它将在矩形内
            if (this.contains(res.x, res.y)) {
                let dl = res.x - this.left;
                let dr = this.right - res.x;
                let dt = res.y - this.top;
                let db = this.bottom - res.y;
                let min = Math.min(dl, dr, dt, db);
                if (min == dt) {
                    res.y = this.top;
                    edgeNormal.value.y = -1;
                }
                else if (min == db) {
                    res.y = this.bottom;
                    edgeNormal.value.y = 1;
                }
                else if (min == dl) {
                    res.x = this.left;
                    edgeNormal.value.x = -1;
                }
                else {
                    res.x = this.right;
                    edgeNormal.value.x = 1;
                }
            }
            else {
                if (res.x == this.left)
                    edgeNormal.value.x = -1;
                if (res.x == this.right)
                    edgeNormal.value.x = 1;
                if (res.y == this.top)
                    edgeNormal.value.y = -1;
                if (res.y == this.bottom)
                    edgeNormal.value.y = 1;
            }
            return res;
        }
        /**
         * 创建一个新的RectangleF，该RectangleF包含两个其他矩形的重叠区域
         * @param value1
         * @param value2
         * @returns 将两个矩形的重叠区域作为输出参数
         */
        static intersect(value1, value2) {
            if (value1.intersects(value2)) {
                let right_side = Math.min(value1.x + value1.width, value2.x + value2.width);
                let left_side = Math.max(value1.x, value2.x);
                let top_side = Math.max(value1.y, value2.y);
                let bottom_side = Math.min(value1.y + value1.height, value2.y + value2.height);
                return new Rectangle(left_side, top_side, right_side - left_side, bottom_side - top_side);
            }
            else {
                return new Rectangle(0, 0, 0, 0);
            }
        }
        /**
         * 改变这个矩形的位置
         * @param offsetX 要添加到这个矩形的X坐标
         * @param offsetY 要添加到这个矩形的y坐标
         */
        offset(offsetX, offsetY) {
            this.x += offsetX;
            this.y += offsetY;
            return this;
        }
        /**
         * 创建一个完全包含两个其他矩形的新矩形
         * @param value1
         * @param value2
         */
        static union(value1, value2) {
            let x = Math.min(value1.x, value2.x);
            let y = Math.min(value1.y, value2.y);
            return new Rectangle(x, y, Math.max(value1.right, value2.right) - x, Math.max(value1.bottom, value2.bottom) - y);
        }
        /**
         * 在矩形重叠的地方创建一个新的矩形
         * @param value1
         * @param value2
         */
        static overlap(value1, value2) {
            let x = Math.max(value1.x, value2.x, 0);
            let y = Math.max(value1.y, value2.y, 0);
            return new Rectangle(x, y, Math.max(Math.min(value1.right, value2.right) - x, 0), Math.max(Math.min(value1.bottom, value2.bottom) - y, 0));
        }
        calculateBounds(parentPosition, position, origin, scale, rotation, width, height) {
            if (rotation == 0) {
                this.x = Math.trunc(parentPosition.x + position.x - origin.x * scale.x);
                this.y = Math.trunc(parentPosition.y + position.y - origin.y * scale.y);
                this.width = Math.trunc(width * scale.x);
                this.height = Math.trunc(height * scale.y);
            }
            else {
                // 我们需要找到我们的绝对最小/最大值，并据此创建边界
                let worldPosX = parentPosition.x + position.x;
                let worldPosY = parentPosition.y + position.y;
                // 考虑到原点，将参考点设置为世界参考
                es.Matrix2D.createTranslation(-worldPosX - origin.x, -worldPosY - origin.y, this._transformMat);
                es.Matrix2D.createScale(scale.x, scale.y, this._tempMat);
                this._transformMat = this._transformMat.multiply(this._tempMat);
                es.Matrix2D.createRotation(rotation, this._tempMat);
                this._transformMat = this._transformMat.multiply(this._tempMat);
                es.Matrix2D.createTranslation(worldPosX, worldPosY, this._tempMat);
                this._transformMat = this._transformMat.multiply(this._tempMat);
                // TODO: 我们可以把世界变换留在矩阵中，避免在世界空间中得到所有的四个角
                let topLeft = new es.Vector2(worldPosX, worldPosY);
                let topRight = new es.Vector2(worldPosX + width, worldPosY);
                let bottomLeft = new es.Vector2(worldPosX, worldPosY + height);
                let bottomRight = new es.Vector2(worldPosX + width, worldPosY + height);
                es.Vector2Ext.transformR(topLeft, this._transformMat, topLeft);
                es.Vector2Ext.transformR(topRight, this._transformMat, topRight);
                es.Vector2Ext.transformR(bottomLeft, this._transformMat, bottomLeft);
                es.Vector2Ext.transformR(bottomRight, this._transformMat, bottomRight);
                // 找出最小值和最大值，这样我们就可以计算出我们的边界框。
                let minX = Math.trunc(Math.min(topLeft.x, bottomRight.x, topRight.x, bottomLeft.x));
                let maxX = Math.trunc(Math.max(topLeft.x, bottomRight.x, topRight.x, bottomLeft.x));
                let minY = Math.trunc(Math.min(topLeft.y, bottomRight.y, topRight.y, bottomLeft.y));
                let maxY = Math.trunc(Math.max(topLeft.y, bottomRight.y, topRight.y, bottomLeft.y));
                this.location = new es.Vector2(minX, minY);
                this.width = Math.trunc(maxX - minX);
                this.height = Math.trunc(maxY - minY);
            }
        }
        /**
         * 返回一个横跨当前矩形和提供的三角形位置的矩形
         * @param deltaX
         * @param deltaY
         */
        getSweptBroadphaseBounds(deltaX, deltaY) {
            let broadphasebox = Rectangle.empty;
            broadphasebox.x = deltaX > 0 ? this.x : this.x + deltaX;
            broadphasebox.y = deltaY > 0 ? this.y : this.y + deltaY;
            broadphasebox.width = deltaX > 0 ? deltaX + this.width : this.width - deltaX;
            broadphasebox.height = deltaY > 0 ? deltaY + this.height : this.height - deltaY;
            return broadphasebox;
        }
        /**
         * 如果发生碰撞，返回true
         * moveX和moveY将返回b1为避免碰撞而必须移动的移动量
         * @param other
         * @param moveX
         * @param moveY
         */
        collisionCheck(other, moveX, moveY) {
            moveX.value = moveY.value = 0;
            let l = other.x - (this.x + this.width);
            let r = (other.x + other.width) - this.x;
            let t = (other.y - (this.y + this.height));
            let b = (other.y + other.height) - this.y;
            // 检验是否有碰撞
            if (l > 0 || r < 0 || t > 0 || b < 0)
                return false;
            // 求两边的偏移量
            moveX.value = Math.abs(l) < r ? l : r;
            moveY.value = Math.abs(t) < b ? t : b;
            // 只使用最小的偏移量
            if (Math.abs(moveX.value) < Math.abs(moveY.value))
                moveY.value = 0;
            else
                moveX.value = 0;
            return true;
        }
        /**
         * 计算两个矩形之间有符号的交点深度
         * @param rectA
         * @param rectB
         * @returns 两个相交的矩形之间的重叠量。
         * 这些深度值可以是负值，取决于矩形/相交的哪些边。
         * 这允许调用者确定正确的推送对象的方向，以解决碰撞问题。
         * 如果矩形不相交，则返回Vector2.Zero
         */
        static getIntersectionDepth(rectA, rectB) {
            // 计算半尺寸
            let halfWidthA = rectA.width / 2;
            let halfHeightA = rectA.height / 2;
            let halfWidthB = rectB.width / 2;
            let halfHeightB = rectB.height / 2;
            // 计算中心
            let centerA = new es.Vector2(rectA.left + halfWidthA, rectA.top + halfHeightA);
            let centerB = new es.Vector2(rectB.left + halfWidthB, rectB.top + halfHeightB);
            // 计算当前中心间的距离和最小非相交距离
            let distanceX = centerA.x - centerB.x;
            let distanceY = centerA.y - centerB.y;
            let minDistanceX = halfWidthA + halfWidthB;
            let minDistanceY = halfHeightA + halfHeightB;
            // 如果我们根本不相交，则返回(0，0)
            if (Math.abs(distanceX) >= minDistanceX || Math.abs(distanceY) >= minDistanceY)
                return es.Vector2.zero;
            // 计算并返回交叉点深度
            let depthX = distanceX > 0 ? minDistanceX - distanceX : -minDistanceX - distanceX;
            let depthY = distanceY > 0 ? minDistanceY - distanceY : -minDistanceY - distanceY;
            return new es.Vector2(depthX, depthY);
        }
        /**
         * 比较当前实例是否等于指定的矩形
         * @param other
         */
        equals(other) {
            return this === other;
        }
        /**
         * 获取这个矩形的哈希码
         */
        getHashCode() {
            return (Math.trunc(this.x) ^ Math.trunc(this.y) ^ Math.trunc(this.width) ^ Math.trunc(this.height));
        }
        clone() {
            return new Rectangle(this.x, this.y, this.width, this.height);
        }
    }
    es.Rectangle = Rectangle;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 该类用于存储具有亚像素分辨率的浮点数。
     */
    class SubpixelFloat {
        constructor() {
            /**
             * 存储 SubpixelFloat 值的浮点余数。
             */
            this.remainder = 0;
        }
        /**
         * 通过将给定数量的像素添加到余数中来更新 SubpixelFloat 值。
         * 返回更新后的整数部分，余数表示当前值中包含的亚像素部分。
         * @param {number} amount - 要添加到余数中的像素数。
         * @returns {number} 更新后的整数部分。
         */
        update(amount) {
            // 将给定的像素数量添加到余数中
            this.remainder += amount;
            // 检查余数是否超过一个像素的大小
            let motion = Math.trunc(this.remainder);
            this.remainder -= motion;
            // 返回整数部分作为更新后的值
            return motion;
        }
        /**
         * 将 SubpixelFloat 值重置为零。
         */
        reset() {
            this.remainder = 0;
        }
    }
    es.SubpixelFloat = SubpixelFloat;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 该类用于存储具有亚像素分辨率的二维向量。
     */
    class SubpixelVector2 {
        constructor() {
            /**
             * 用于存储 x 坐标的 SubpixelFloat 对象。
             */
            this._x = new es.SubpixelFloat();
            /**
             * 用于存储 y 坐标的 SubpixelFloat 对象。
             */
            this._y = new es.SubpixelFloat();
        }
        /**
         * 通过将给定数量的像素添加到余数中来更新 SubpixelVector2 值。
         * @param {Vector2} amount - 要添加到余数中的像素向量。
         */
        update(amount) {
            // 更新 x 和 y 坐标
            amount.x = this._x.update(amount.x);
            amount.y = this._y.update(amount.y);
        }
        /**
         * 将 SubpixelVector2 值的余数重置为零。
         */
        reset() {
            this._x.reset();
            this._y.reset();
        }
    }
    es.SubpixelVector2 = SubpixelVector2;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 移动器使用的帮助器类，用于管理触发器碰撞器交互并调用itriggerlistener
     */
    class ColliderTriggerHelper {
        constructor(entity) {
            /** 存储当前帧中发生的所有活动交点对 */
            this._activeTriggerIntersections = new es.PairSet();
            /** 存储前一帧的交点对，这样我们就可以在移动这一帧后检测到退出 */
            this._previousTriggerIntersections = new es.PairSet();
            this._tempTriggerList = [];
            this._entity = entity;
        }
        /**
         * update应该在实体被移动后被调用，它将处理任何与Colllider重叠的ITriggerListeners。
         * 它将处理任何与Collider重叠的ITriggerListeners。
         */
        update() {
            const lateColliders = [];
            // 对所有实体.colliders进行重叠检查，这些实体.colliders是触发器，与所有宽相碰撞器，无论是否触发器。   
            // 任何重叠都会导致触发事件
            let colliders = this.getColliders();
            if (colliders.length > 0) {
                for (let i = 0; i < colliders.length; i++) {
                    let collider = colliders[i];
                    let neighbors = es.Physics.boxcastBroadphaseExcludingSelf(collider, collider.bounds, collider.collidesWithLayers.value);
                    for (let j = 0; j < neighbors.length; j++) {
                        let neighbor = neighbors[j];
                        // 我们至少需要一个碰撞器作为触发器
                        if (!collider.isTrigger && !neighbor.isTrigger)
                            continue;
                        if (collider.overlaps(neighbor)) {
                            const pair = new es.Pair(collider, neighbor);
                            // 如果我们的某一个集合中已经有了这个对子（前一个或当前的触发交叉点），就不要调用输入事件了
                            const shouldReportTriggerEvent = !this._activeTriggerIntersections.has(pair) &&
                                !this._previousTriggerIntersections.has(pair);
                            if (shouldReportTriggerEvent) {
                                if (neighbor.castSortOrder >= es.Collider.lateSortOrder) {
                                    lateColliders.push(pair);
                                }
                                else {
                                    this.notifyTriggerListeners(pair, true);
                                }
                            }
                            this._activeTriggerIntersections.add(pair);
                        }
                    }
                }
            }
            if (lateColliders.length > 0) {
                for (let i = 0; i < lateColliders.length; i++) {
                    const pair = lateColliders[i];
                    this.notifyTriggerListeners(pair, true);
                }
            }
            this.checkForExitedColliders();
        }
        getColliders() {
            const colliders = [];
            if (this._entity.components.buffer.length > 0)
                for (let i = 0; i < this._entity.components.buffer.length; i++) {
                    const component = this._entity.components.buffer[i];
                    if (component instanceof es.Collider) {
                        colliders.push(component);
                    }
                }
            return colliders;
        }
        checkForExitedColliders() {
            // 删除所有与此帧交互的触发器，留下我们退出的触发器
            this._previousTriggerIntersections.except(this._activeTriggerIntersections);
            const all = this._previousTriggerIntersections.all;
            all.forEach(pair => {
                this.notifyTriggerListeners(pair, false);
            });
            this._previousTriggerIntersections.clear();
            // 添加所有当前激活的触发器
            this._previousTriggerIntersections.union(this._activeTriggerIntersections);
            // 清空活动集，为下一帧做准备
            this._activeTriggerIntersections.clear();
        }
        notifyTriggerListeners(collisionPair, isEntering) {
            es.TriggerListenerHelper.getITriggerListener(collisionPair.first.entity, this._tempTriggerList);
            if (this._tempTriggerList.length > 0)
                for (let i = 0; i < this._tempTriggerList.length; i++) {
                    const trigger = this._tempTriggerList[i];
                    if (isEntering) {
                        trigger.onTriggerEnter(collisionPair.second, collisionPair.first);
                    }
                    else {
                        trigger.onTriggerExit(collisionPair.second, collisionPair.first);
                    }
                    this._tempTriggerList.length = 0;
                    if (collisionPair.second.entity) {
                        es.TriggerListenerHelper.getITriggerListener(collisionPair.second.entity, this._tempTriggerList);
                        if (this._tempTriggerList.length > 0)
                            for (let i = 0; i < this._tempTriggerList.length; i++) {
                                const trigger = this._tempTriggerList[i];
                                if (isEntering) {
                                    trigger.onTriggerEnter(collisionPair.first, collisionPair.second);
                                }
                                else {
                                    trigger.onTriggerExit(collisionPair.first, collisionPair.second);
                                }
                            }
                        this._tempTriggerList.length = 0;
                    }
                }
        }
    }
    es.ColliderTriggerHelper = ColliderTriggerHelper;
})(es || (es = {}));
var es;
(function (es) {
    let PointSectors;
    (function (PointSectors) {
        PointSectors[PointSectors["center"] = 0] = "center";
        PointSectors[PointSectors["top"] = 1] = "top";
        PointSectors[PointSectors["bottom"] = 2] = "bottom";
        PointSectors[PointSectors["topLeft"] = 9] = "topLeft";
        PointSectors[PointSectors["topRight"] = 5] = "topRight";
        PointSectors[PointSectors["left"] = 8] = "left";
        PointSectors[PointSectors["right"] = 4] = "right";
        PointSectors[PointSectors["bottomLeft"] = 10] = "bottomLeft";
        PointSectors[PointSectors["bottomRight"] = 6] = "bottomRight";
    })(PointSectors = es.PointSectors || (es.PointSectors = {}));
    class Collisions {
        static lineToLine(a1, a2, b1, b2) {
            const b = a2.sub(a1);
            const d = b2.sub(b1);
            const bDotDPerp = b.x * d.y - b.y * d.x;
            // 如果b*d = 0，表示这两条直线平行，因此有无穷个交点
            if (bDotDPerp == 0)
                return false;
            const c = b1.sub(a1);
            const t = (c.x * d.y - c.y * d.x) / bDotDPerp;
            if (t < 0 || t > 1) {
                return false;
            }
            const u = (c.x * b.y - c.y * b.x) / bDotDPerp;
            if (u < 0 || u > 1) {
                return false;
            }
            return true;
        }
        static lineToLineIntersection(a1, a2, b1, b2, intersection = es.Vector2.zero) {
            intersection.x = 0;
            intersection.y = 0;
            const b = a2.sub(a1);
            const d = b2.sub(b1);
            const bDotDPerp = b.x * d.y - b.y * d.x;
            // 如果b*d = 0，表示这两条直线平行，因此有无穷个交点
            if (bDotDPerp == 0)
                return false;
            const c = b1.sub(a1);
            const t = (c.x * d.y - c.y * d.x) / bDotDPerp;
            if (t < 0 || t > 1)
                return false;
            const u = (c.x * b.y - c.y * b.x) / bDotDPerp;
            if (u < 0 || u > 1)
                return false;
            const temp = a1.add(b.scale(t));
            intersection.x = temp.x;
            intersection.y = temp.y;
            return true;
        }
        static closestPointOnLine(lineA, lineB, closestTo) {
            const v = lineB.sub(lineA);
            const w = closestTo.sub(lineA);
            let t = w.dot(v) / v.dot(v);
            t = es.MathHelper.clamp(t, 0, 1);
            return lineA.add(v.scale(t));
        }
        static circleToCircle(circleCenter1, circleRadius1, circleCenter2, circleRadius2) {
            return es.Vector2.sqrDistance(circleCenter1, circleCenter2) < (circleRadius1 + circleRadius2) * (circleRadius1 + circleRadius2);
        }
        static circleToLine(circleCenter, radius, lineFrom, lineTo) {
            return es.Vector2.sqrDistance(circleCenter, this.closestPointOnLine(lineFrom, lineTo, circleCenter)) < radius * radius;
        }
        static circleToPoint(circleCenter, radius, point) {
            return es.Vector2.sqrDistance(circleCenter, point) < radius * radius;
        }
        static rectToCircle(rect, cPosition, cRadius) {
            // 检查矩形是否包含圆的中心点
            if (this.rectToPoint(rect.x, rect.y, rect.width, rect.height, cPosition))
                return true;
            // 对照相关边缘检查圆圈
            let edgeFrom;
            let edgeTo;
            const sector = this.getSector(rect.x, rect.y, rect.width, rect.height, cPosition);
            if ((sector & PointSectors.top) !== 0) {
                edgeFrom = new es.Vector2(rect.x, rect.y);
                edgeTo = new es.Vector2(rect.x + rect.width, rect.y);
                if (this.circleToLine(cPosition, cRadius, edgeFrom, edgeTo))
                    return true;
            }
            if ((sector & PointSectors.bottom) !== 0) {
                edgeFrom = new es.Vector2(rect.x, rect.y + rect.width);
                edgeTo = new es.Vector2(rect.x + rect.width, rect.y + rect.height);
                if (this.circleToLine(cPosition, cRadius, edgeFrom, edgeTo))
                    return true;
            }
            if ((sector & PointSectors.left) !== 0) {
                edgeFrom = new es.Vector2(rect.x, rect.y);
                edgeTo = new es.Vector2(rect.x, rect.y + rect.height);
                if (this.circleToLine(cPosition, cRadius, edgeFrom, edgeTo))
                    return true;
            }
            if ((sector & PointSectors.right) !== 0) {
                edgeFrom = new es.Vector2(rect.x + rect.width, rect.y);
                edgeTo = new es.Vector2(rect.x + rect.width, rect.y + rect.height);
                if (this.circleToLine(cPosition, cRadius, edgeFrom, edgeTo))
                    return true;
            }
            return false;
        }
        /**
         * 检查矩形和线段之间是否相交
         * @param rect - 要检查的矩形
         * @param lineFrom - 线段起点
         * @param lineTo - 线段终点
         * @returns 如果相交返回 true，否则返回 false
         */
        static rectToLine(rect, lineFrom, lineTo) {
            // 获取起点和终点所在矩形的位置
            const fromSector = this.getSector(rect.x, rect.y, rect.width, rect.height, lineFrom);
            const toSector = this.getSector(rect.x, rect.y, rect.width, rect.height, lineTo);
            // 起点或终点位于矩形内部
            if (fromSector == PointSectors.center || toSector == PointSectors.center) {
                return true;
            }
            // 起点和终点都在矩形外部的同一区域
            if ((fromSector & toSector) != 0) {
                return false;
            }
            // 到这里说明起点和终点分别在矩形的两个不同区域，需要检查线段是否与矩形的边相交
            // 枚举起点和终点所在区域
            const both = fromSector | toSector;
            // 逐条检查矩形的四条边是否与线段相交
            if ((both & PointSectors.top) != 0) {
                if (this.lineToLine(new es.Vector2(rect.x, rect.y), new es.Vector2(rect.x + rect.width, rect.y), lineFrom, lineTo)) {
                    return true;
                }
            }
            if ((both & PointSectors.bottom) != 0) {
                if (this.lineToLine(new es.Vector2(rect.x, rect.y + rect.height), new es.Vector2(rect.x + rect.width, rect.y + rect.height), lineFrom, lineTo)) {
                    return true;
                }
            }
            if ((both & PointSectors.left) != 0) {
                if (this.lineToLine(new es.Vector2(rect.x, rect.y), new es.Vector2(rect.x, rect.y + rect.height), lineFrom, lineTo)) {
                    return true;
                }
            }
            if ((both & PointSectors.right) != 0) {
                if (this.lineToLine(new es.Vector2(rect.x + rect.width, rect.y), new es.Vector2(rect.x + rect.width, rect.y + rect.height), lineFrom, lineTo)) {
                    return true;
                }
            }
            return false;
        }
        static rectToPoint(rX, rY, rW, rH, point) {
            return point.x >= rX && point.y >= rY && point.x < rX + rW && point.y < rY + rH;
        }
        /**
         * 位标志和帮助使用Cohen–Sutherland算法
         *
         * 位标志:
         * 1001 1000 1010
         * 0001 0000 0010
         * 0101 0100 0110
         * @param rX
         * @param rY
         * @param rW
         * @param rH
         * @param point
         */
        static getSector(rX, rY, rW, rH, point) {
            let sector = PointSectors.center;
            if (point.x < rX)
                sector |= PointSectors.left;
            else if (point.x >= rX + rW)
                sector |= PointSectors.right;
            if (point.y < rY)
                sector |= PointSectors.top;
            else if (point.y >= rY + rH)
                sector |= PointSectors.bottom;
            return sector;
        }
    }
    es.Collisions = Collisions;
})(es || (es = {}));
var es;
(function (es) {
    class RaycastHit {
        constructor(collider, fraction, distance, point, normal) {
            /**
             * 撞击发生时沿射线的距离。
             */
            this.fraction = 0;
            /**
             * 从射线原点到碰撞点的距离
             */
            this.distance = 0;
            /**
             * 世界空间中光线击中对撞机表面的点
             */
            this.point = es.Vector2.zero;
            /**
             * 被射线击中的表面的法向量
             */
            this.normal = es.Vector2.zero;
            this.collider = collider;
            this.fraction = fraction;
            this.distance = distance;
            this.point = point;
            this.centroid = es.Vector2.zero;
        }
        setAllValues(collider, fraction, distance, point, normal) {
            this.collider = collider;
            this.fraction = fraction;
            this.distance = distance;
            this.point = point;
            this.normal = normal;
        }
        setValues(fraction, distance, point, normal) {
            this.fraction = fraction;
            this.distance = distance;
            this.point = point;
            this.normal = normal;
        }
        reset() {
            this.collider = null;
            this.fraction = this.distance = 0;
        }
        clone() {
            const hit = new RaycastHit();
            hit.setAllValues(this.collider, this.fraction, this.distance, this.point, this.normal);
            return hit;
        }
        toString() {
            return `[RaycastHit] fraction: ${this.fraction}, distance: ${this.distance}, normal: ${this.normal}, centroid: ${this.centroid}, point: ${this.point}`;
        }
    }
    es.RaycastHit = RaycastHit;
})(es || (es = {}));
///<reference path="./RaycastHit.ts" />
var es;
///<reference path="./RaycastHit.ts" />
(function (es) {
    class Physics {
        static reset() {
            this._spatialHash = new es.SpatialHash(this.spatialHashCellSize);
            this._hitArray[0].reset();
            this._colliderArray[0] = null;
        }
        /**
         * 从SpatialHash中移除所有碰撞器
         */
        static clear() {
            this._spatialHash.clear();
        }
        /**
         * 检查是否有对撞机落在一个圆形区域内。返回遇到的第一个对撞机
         * @param center
         * @param radius
         * @param layerMask
         */
        static overlapCircle(center, radius, layerMask = Physics.allLayers) {
            this._colliderArray[0] = null;
            this._spatialHash.overlapCircle(center, radius, this._colliderArray, layerMask);
            return this._colliderArray[0];
        }
        /**
         * 获取所有落在指定圆圈内的碰撞器
         * @param center
         * @param randius
         * @param results
         * @param layerMask
         */
        static overlapCircleAll(center, radius, results, layerMask = this.allLayers) {
            return this._spatialHash.overlapCircle(center, radius, results, layerMask);
        }
        /**
         * 返回所有碰撞器与边界相交的碰撞器。bounds。请注意，这是一个broadphase检查，所以它只检查边界，不做单个碰撞到碰撞器的检查!
         * @param rect
         * @param layerMask
         */
        static boxcastBroadphase(rect, layerMask = this.allLayers) {
            return this._spatialHash.aabbBroadphase(rect, null, layerMask);
        }
        /**
         * 返回所有被边界交错的碰撞器，但不包括传入的碰撞器（self）。
         * 如果你想为其他查询自己创建扫描边界，这个方法很有用
         * @param collider
         * @param rect
         * @param layerMask
         */
        static boxcastBroadphaseExcludingSelf(collider, rect, layerMask = this.allLayers) {
            return this._spatialHash.aabbBroadphase(rect, collider, layerMask);
        }
        /**
         * 返回所有边界与 collider.bounds 相交的碰撞器，但不包括传入的碰撞器(self)
         * @param collider
         * @param layerMask
         */
        static boxcastBroadphaseExcludingSelfNonRect(collider, layerMask = this.allLayers) {
            let bounds = collider.bounds;
            return this._spatialHash.aabbBroadphase(bounds, collider, layerMask);
        }
        /**
         * 返回所有被 collider.bounds 扩展为包含 deltaX/deltaY 的碰撞器，但不包括传入的碰撞器（self）
         * @param collider
         * @param deltaX
         * @param deltaY
         * @param layerMask
         */
        static boxcastBroadphaseExcludingSelfDelta(collider, deltaX, deltaY, layerMask = Physics.allLayers) {
            let colliderBounds = collider.bounds;
            let sweptBounds = colliderBounds.getSweptBroadphaseBounds(deltaX, deltaY);
            return this._spatialHash.aabbBroadphase(sweptBounds, collider, layerMask);
        }
        /**
         * 将对撞机添加到物理系统中
         * @param collider
         */
        static addCollider(collider) {
            Physics._spatialHash.register(collider);
        }
        /**
         * 从物理系统中移除对撞机
         * @param collider
         */
        static removeCollider(collider) {
            Physics._spatialHash.remove(collider);
        }
        /**
         * 更新物理系统中对撞机的位置。这实际上只是移除然后重新添加带有新边界的碰撞器
         * @param collider
         */
        static updateCollider(collider) {
            this._spatialHash.remove(collider);
            this._spatialHash.register(collider);
        }
        /**
         * 返回与layerMask匹配的碰撞器的第一次命中
         * @param start
         * @param end
         * @param layerMask
         */
        static linecast(start, end, layerMask = this.allLayers, ignoredColliders = null) {
            this._hitArray[0].reset();
            Physics.linecastAll(start, end, this._hitArray, layerMask, ignoredColliders);
            return this._hitArray[0];
        }
        /**
         * 通过空间散列强制执行一行，并用该行命中的任何碰撞器填充hits数组
         * @param start
         * @param end
         * @param hits
         * @param layerMask
         */
        static linecastAll(start, end, hits, layerMask = this.allLayers, ignoredColliders = null) {
            return this._spatialHash.linecast(start, end, hits, layerMask, ignoredColliders);
        }
        /**
         * 检查是否有对撞机落在一个矩形区域中
         * @param rect
         * @param layerMask
         */
        static overlapRectangle(rect, layerMask = Physics.allLayers) {
            this._colliderArray[0] = null;
            this._spatialHash.overlapRectangle(rect, this._colliderArray, layerMask);
            return this._colliderArray[0];
        }
        /**
         * 获取所有在指定矩形范围内的碰撞器
         * @param rect
         * @param results
         * @param layerMask
         */
        static overlapRectangleAll(rect, results, layerMask = Physics.allLayers) {
            if (results.length == 0) {
                console.warn("传入了一个空的结果数组。不会返回任何结果");
                return 0;
            }
            return this._spatialHash.overlapRectangle(rect, results, layerMask);
        }
    }
    /** 用于在全局范围内存储重力值的方便字段 */
    Physics.gravity = new es.Vector2(0, -300);
    /** 调用reset并创建一个新的SpatialHash时使用的单元格大小 */
    Physics.spatialHashCellSize = 100;
    /** 接受layerMask的所有方法的默认值 */
    Physics.allLayers = -1;
    /**
     * raycast是否检测配置为触发器的碰撞器
     */
    Physics.raycastsHitTriggers = false;
    /**
     * 在碰撞器中开始的射线/直线是否强制转换检测到那些碰撞器
     */
    Physics.raycastsStartInColliders = false;
    Physics.debugRender = false;
    /**
     * 我们保留它以避免在每次raycast发生时分配它
     */
    Physics._hitArray = [
        new es.RaycastHit()
    ];
    /**
     * 避免重叠检查和形状投射的分配
     */
    Physics._colliderArray = [
        null
    ];
    es.Physics = Physics;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 不是真正的射线(射线只有开始和方向)，作为一条线和射线。
     */
    class Ray2D {
        get start() {
            return this._start;
        }
        get direction() {
            return this._direction;
        }
        get end() {
            return this._end;
        }
        constructor(pos, end) {
            this._start = pos.clone();
            this._end = end.clone();
            this._direction = this._end.sub(this._start);
        }
    }
    es.Ray2D = Ray2D;
})(es || (es = {}));
var es;
(function (es) {
    class SpatialHash {
        constructor(cellSize = 100) {
            this.gridBounds = new es.Rectangle();
            /**
             * 重叠检查缓存框
             */
            this._overlapTestBox = new es.Box(0, 0);
            /**
             * 重叠检查缓存圈
             */
            this._overlapTestCircle = new es.Circle(0);
            /**
             * 保存所有数据的字典
             */
            this._cellDict = new NumberDictionary();
            /**
             * 用于返回冲突信息的共享HashSet
             */
            this._tempHashSet = new Set();
            this._cellSize = cellSize;
            this._inverseCellSize = 1 / this._cellSize;
            this._raycastParser = new RaycastResultParser();
        }
        /**
         * 注册一个碰撞器
         * @param collider 碰撞器
         */
        register(collider) {
            // 克隆碰撞器的 bounds 属性
            const bounds = collider.bounds.clone();
            // 存储克隆后的 bounds 属性到 registeredPhysicsBounds 属性中
            collider.registeredPhysicsBounds = bounds;
            // 获取碰撞器所在的网格坐标
            const p1 = this.cellCoords(bounds.x, bounds.y);
            const p2 = this.cellCoords(bounds.right, bounds.bottom);
            // 更新网格边界，以确保其覆盖所有碰撞器
            if (!this.gridBounds.contains(p1.x, p1.y)) {
                this.gridBounds = es.RectangleExt.union(this.gridBounds, p1);
            }
            if (!this.gridBounds.contains(p2.x, p2.y)) {
                this.gridBounds = es.RectangleExt.union(this.gridBounds, p2);
            }
            // 将碰撞器添加到所在的所有单元格中
            for (let x = p1.x; x <= p2.x; x++) {
                for (let y = p1.y; y <= p2.y; y++) {
                    // 如果该单元格不存在，创建一个新的单元格
                    const cell = this.cellAtPosition(x, y, /* createIfNotExists = */ true);
                    cell.push(collider);
                }
            }
        }
        /**
         * 从空间哈希中移除一个碰撞器
         * @param collider 碰撞器
         */
        remove(collider) {
            // 克隆碰撞器的 registeredPhysicsBounds 属性
            const bounds = collider.registeredPhysicsBounds.clone();
            // 获取碰撞器所在的网格坐标
            const p1 = this.cellCoords(bounds.x, bounds.y);
            const p2 = this.cellCoords(bounds.right, bounds.bottom);
            // 从所有单元格中移除该碰撞器
            for (let x = p1.x; x <= p2.x; x++) {
                for (let y = p1.y; y <= p2.y; y++) {
                    // 单元格应该始终存在，因为该碰撞器应该在所有查询的单元格中
                    const cell = this.cellAtPosition(x, y);
                    es.Insist.isNotNull(cell, `从不存在碰撞器的单元格中移除碰撞器: [${collider}]`);
                    if (cell != null) {
                        new es.List(cell).remove(collider);
                    }
                }
            }
        }
        /**
         * 使用蛮力方法从SpatialHash中删除对象
         * @param obj
         */
        removeWithBruteForce(obj) {
            this._cellDict.remove(obj);
        }
        clear() {
            this._cellDict.clear();
        }
        /**
         * 执行基于 AABB 的广域相交检测并返回碰撞器列表
         * @param bounds 边界矩形
         * @param excludeCollider 排除的碰撞器
         * @param layerMask 碰撞层掩码
         * @returns 碰撞器列表
         */
        aabbBroadphase(bounds, excludeCollider, layerMask) {
            this._tempHashSet.clear();
            // 获取边界矩形所在的网格单元格
            const p1 = this.cellCoords(bounds.x, bounds.y);
            const p2 = this.cellCoords(bounds.right, bounds.bottom);
            // 对所有相交的单元格中的碰撞器执行检测
            for (let x = p1.x; x <= p2.x; x++) {
                for (let y = p1.y; y <= p2.y; y++) {
                    const cell = this.cellAtPosition(x, y);
                    if (!cell) {
                        continue;
                    }
                    // 如果单元格不为空，循环并取回所有碰撞器
                    if (cell.length > 0) {
                        for (let i = 0; i < cell.length; i++) {
                            const collider = cell[i];
                            // 如果它是自身或者如果它不匹配我们的层掩码跳过这个碰撞器
                            if (collider === excludeCollider || !es.Flags.isFlagSet(layerMask, collider.physicsLayer.value)) {
                                continue;
                            }
                            // 检查碰撞器的 bounds 是否与边界矩形相交
                            if (bounds.intersects(collider.bounds)) {
                                this._tempHashSet.add(collider);
                            }
                        }
                    }
                }
            }
            // 返回所有相交的碰撞器列表
            return Array.from(this._tempHashSet);
        }
        /**
         * 执行基于线段的射线检测并返回所有命中的碰撞器
         * @param start 射线起点
         * @param end 射线终点
         * @param hits 射线命中结果
         * @param layerMask 碰撞层掩码
         * @param ignoredColliders 忽略的碰撞器
         * @returns 命中的碰撞器数量
         */
        linecast(start, end, hits, layerMask, ignoredColliders) {
            // 创建一个射线
            const ray = new es.Ray2D(start, end);
            // 使用射线解析器初始化线段命中结果
            this._raycastParser.start(ray, hits, layerMask, ignoredColliders);
            // 获取起点和终点所在的网格单元格
            let currentCell = this.cellCoords(start.x, start.y);
            const lastCell = this.cellCoords(end.x, end.y);
            // 计算射线在 x 和 y 方向上的步长
            let stepX = Math.sign(ray.direction.x);
            let stepY = Math.sign(ray.direction.y);
            if (currentCell.x === lastCell.x) {
                stepX = 0;
            }
            if (currentCell.y === lastCell.y) {
                stepY = 0;
            }
            // 计算 x 和 y 方向上的网格单元格步长
            const xStep = stepX < 0 ? 0 : stepX;
            const yStep = stepY < 0 ? 0 : stepY;
            let nextBoundaryX = (currentCell.x + xStep) * this._cellSize;
            let nextBoundaryY = (currentCell.y + yStep) * this._cellSize;
            // 计算 t 值的最大值和步长
            let tMaxX = ray.direction.x !== 0 ? (nextBoundaryX - ray.start.x) / ray.direction.x : Number.MAX_VALUE;
            let tMaxY = ray.direction.y !== 0 ? (nextBoundaryY - ray.start.y) / ray.direction.y : Number.MAX_VALUE;
            const tDeltaX = ray.direction.x !== 0 ? this._cellSize / (ray.direction.x * stepX) : Number.MAX_VALUE;
            const tDeltaY = ray.direction.y !== 0 ? this._cellSize / (ray.direction.y * stepY) : Number.MAX_VALUE;
            // 检查射线起点所在的单元格是否与射线相交
            let cell = this.cellAtPosition(currentCell.x, currentCell.y);
            if (cell !== null && this._raycastParser.checkRayIntersection(currentCell.x, currentCell.y, cell)) {
                this._raycastParser.reset();
                return this._raycastParser.hitCounter;
            }
            // 在所有相交的单元格中沿着射线前进并检查碰撞器
            while (currentCell.x !== lastCell.x || currentCell.y !== lastCell.y) {
                if (tMaxX < tMaxY) {
                    currentCell.x = es.MathHelper.toInt(es.MathHelper.approach(currentCell.x, lastCell.x, Math.abs(stepX)));
                    tMaxX += tDeltaX;
                }
                else {
                    currentCell.y = es.MathHelper.toInt(es.MathHelper.approach(currentCell.y, lastCell.y, Math.abs(stepY)));
                    tMaxY += tDeltaY;
                }
                cell = this.cellAtPosition(currentCell.x, currentCell.y);
                if (cell && this._raycastParser.checkRayIntersection(currentCell.x, currentCell.y, cell)) {
                    this._raycastParser.reset();
                    return this._raycastParser.hitCounter;
                }
            }
            // 重置射线解析器并返回命中的碰撞器数量
            this._raycastParser.reset();
            return this._raycastParser.hitCounter;
        }
        /**
         * 执行矩形重叠检测并返回所有命中的碰撞器
         * @param rect 矩形
         * @param results 碰撞器命中结果
         * @param layerMask 碰撞层掩码
         * @returns 命中的碰撞器数量
         */
        overlapRectangle(rect, results, layerMask) {
            // 更新重叠检测框的位置和大小
            this._overlapTestBox.updateBox(rect.width, rect.height);
            this._overlapTestBox.position = rect.location;
            let resultCounter = 0;
            // 获取潜在的相交碰撞器
            const potentials = this.aabbBroadphase(rect, null, layerMask);
            // 遍历所有潜在的碰撞器并检查它们是否与矩形相交
            for (let i = 0; i < potentials.length; i++) {
                const collider = potentials[i];
                if (collider instanceof es.BoxCollider) {
                    // 如果是 BoxCollider，直接将其添加到命中结果中
                    results[resultCounter] = collider;
                    resultCounter++;
                }
                else if (collider instanceof es.CircleCollider) {
                    // 如果是 CircleCollider，使用 rectToCircle 函数检查矩形与圆是否相交
                    if (es.Collisions.rectToCircle(rect, collider.bounds.center, collider.bounds.width * 0.5)) {
                        results[resultCounter] = collider;
                        resultCounter++;
                    }
                }
                else if (collider instanceof es.PolygonCollider) {
                    // 如果是 PolygonCollider，使用 Polygon.shape.overlaps 函数检查矩形与多边形是否相交
                    if (collider.shape.overlaps(this._overlapTestBox)) {
                        results[resultCounter] = collider;
                        resultCounter++;
                    }
                }
                else {
                    throw new Error("overlapRectangle对这个类型没有实现!");
                }
                if (resultCounter === results.length) {
                    return resultCounter;
                }
            }
            return resultCounter;
        }
        /**
         * 执行圆形重叠检测并返回所有命中的碰撞器
         * @param circleCenter 圆心坐标
         * @param radius 圆形半径
         * @param results 碰撞器命中结果
         * @param layerMask 碰撞层掩码
         * @returns 命中的碰撞器数量
         */
        overlapCircle(circleCenter, radius, results, layerMask) {
            // 计算包含圆形的最小矩形框
            const bounds = new es.Rectangle(circleCenter.x - radius, circleCenter.y - radius, radius * 2, radius * 2);
            // 更新重叠检测圆的位置和半径
            this._overlapTestCircle.radius = radius;
            this._overlapTestCircle.position = circleCenter;
            let resultCounter = 0;
            // 获取潜在的相交碰撞器
            const potentials = this.aabbBroadphase(bounds, null, layerMask);
            // 遍历所有潜在的碰撞器并检查它们是否与圆相交
            if (potentials.length > 0) {
                for (let i = 0; i < potentials.length; i++) {
                    const collider = potentials[i];
                    if (collider instanceof es.BoxCollider) {
                        // 如果是 BoxCollider，使用 BoxCollider.shape.overlaps 函数检查矩形与圆是否相交
                        if (collider.shape.overlaps(this._overlapTestCircle)) {
                            results[resultCounter] = collider;
                            resultCounter++;
                        }
                    }
                    else if (collider instanceof es.CircleCollider) {
                        // 如果是 CircleCollider，使用 CircleCollider.shape.overlaps 函数检查圆与圆是否相交
                        if (collider.shape.overlaps(this._overlapTestCircle)) {
                            results[resultCounter] = collider;
                            resultCounter++;
                        }
                    }
                    else if (collider instanceof es.PolygonCollider) {
                        // 如果是 PolygonCollider，使用 PolygonCollider.shape.overlaps 函数检查多边形与圆是否相交
                        if (collider.shape.overlaps(this._overlapTestCircle)) {
                            results[resultCounter] = collider;
                            resultCounter++;
                        }
                    }
                    else {
                        throw new Error("对这个对撞机类型的overlapCircle没有实现!");
                    }
                    if (resultCounter === results.length) {
                        return resultCounter;
                    }
                }
            }
            return resultCounter;
        }
        /**
         * 将给定的 x 和 y 坐标转换为单元格坐标
         * @param x X 坐标
         * @param y Y 坐标
         * @returns 转换后的单元格坐标
         */
        cellCoords(x, y) {
            // 使用 inverseCellSize 计算出单元格的 x 和 y 坐标
            return new es.Vector2(Math.floor(x * this._inverseCellSize), Math.floor(y * this._inverseCellSize));
        }
        /**
         * 返回一个包含特定位置处的所有碰撞器的数组
         * 如果此位置上没有单元格并且createCellIfEmpty参数为true，则会创建一个新的单元格
         * @param x 单元格 x 坐标
         * @param y 单元格 y 坐标
         * @param createCellIfEmpty 如果该位置上没有单元格是否创建一个新单元格，默认为false
         * @returns 该位置上的所有碰撞器
         */
        cellAtPosition(x, y, createCellIfEmpty = false) {
            // 获取指定位置的单元格
            let cell = this._cellDict.tryGetValue(x, y);
            // 如果不存在此位置的单元格，并且需要创建，则创建并返回空单元格
            if (!cell) {
                if (createCellIfEmpty) {
                    cell = [];
                    this._cellDict.add(x, y, cell);
                }
            }
            return cell;
        }
    }
    es.SpatialHash = SpatialHash;
    /**
     * 数字字典
     */
    class NumberDictionary {
        constructor() {
            // 存储数据的 Map 对象
            this._store = new Map();
        }
        /**
         * 将指定的列表添加到以给定 x 和 y 为键的字典条目中
         * @param x 字典的 x 坐标
         * @param y 字典的 y 坐标
         * @param list 要添加到字典的列表
         */
        add(x, y, list) {
            this._store.set(this.getKey(x, y), list);
        }
        /**
         * 从字典中删除给定的对象
         * @param obj 要删除的对象
         */
        remove(obj) {
            // 遍历 Map 中的所有值，从值中查找并删除给定的对象
            this._store.forEach(list => {
                let index = list.indexOf(obj);
                list.splice(index, 1);
            });
        }
        /**
         * 尝试从字典中检索指定键的值
         * @param x 字典的 x 坐标
         * @param y 字典的 y 坐标
         * @returns 指定键的值，如果不存在则返回 null
         */
        tryGetValue(x, y) {
            return this._store.get(this.getKey(x, y));
        }
        /**
         * 根据给定的 x 和 y 坐标返回一个唯一的字符串键
         * @param x 字典的 x 坐标
         * @param y 字典的 y 坐标
         * @returns 唯一的字符串键
         */
        getKey(x, y) {
            return `${x}_${y}`;
        }
        /**
         * 清空字典
         */
        clear() {
            this._store.clear();
        }
    }
    es.NumberDictionary = NumberDictionary;
    class RaycastResultParser {
        constructor() {
            this._tempHit = new es.RaycastHit();
            this._checkedColliders = [];
            this._cellHits = [];
        }
        start(ray, hits, layerMask, ignoredColliders) {
            this._ray = ray;
            this._hits = hits;
            this._layerMask = layerMask;
            this._ignoredColliders = ignoredColliders;
            this.hitCounter = 0;
        }
        /**
         * 对射线检测到的碰撞器进行进一步的处理，将结果存储在传递的碰撞数组中。
         * @param cellX 当前单元格的x坐标
         * @param cellY 当前单元格的y坐标
         * @param cell 该单元格中的碰撞器列表
         * @returns 如果当前单元格有任何碰撞器与射线相交，则返回true
         */
        checkRayIntersection(cellX, cellY, cell) {
            for (let i = 0; i < cell.length; i++) {
                const potential = cell[i];
                // 如果该碰撞器已经处理过，则跳过它
                if (this._checkedColliders.indexOf(potential) != -1)
                    continue;
                // 将该碰撞器标记为已处理
                this._checkedColliders.push(potential);
                // 如果该碰撞器是触发器且当前不允许触发器响应射线检测，则跳过它
                if (potential.isTrigger && !es.Physics.raycastsHitTriggers)
                    continue;
                // 确保碰撞器的图层与所提供的图层掩码相匹配
                if (!es.Flags.isFlagSet(this._layerMask, potential.physicsLayer.value))
                    continue;
                // 如果设置了要忽略的碰撞器并且该碰撞器是被忽略的，则跳过它
                if (this._ignoredColliders && this._ignoredColliders.has(potential)) {
                    continue;
                }
                // TODO: Collisions.rectToLine方法可能会更快一些，因为它没有涉及到浮点数除法和平方根计算，而且更简单
                // 但是，rayIntersects方法也很快，并且在实际情况下可能更适合用于特定的应用程序
                // 先进行一个边界检查
                const colliderBounds = potential.bounds;
                const res = colliderBounds.rayIntersects(this._ray);
                if (res.intersected && res.distance <= 1) { // 只有当该碰撞器与射线相交且交点在射线长度范围内才进一步进行形状检测
                    let tempHit = new es.Out(this._tempHit);
                    // 调用形状的方法，检查该碰撞器是否与射线相交，并将结果保存在tempHit中
                    if (potential.shape.collidesWithLine(this._ray.start, this._ray.end, tempHit)) {
                        // 如果碰撞器包含射线起点，而且不允许射线起点在碰撞器中启动检测，那么跳过该碰撞器
                        if (!es.Physics.raycastsStartInColliders && potential.shape.containsPoint(this._ray.start))
                            continue;
                        // 将碰撞信息添加到列表中
                        tempHit.value.collider = potential;
                        this._cellHits.push(tempHit.value);
                    }
                }
            }
            if (this._cellHits.length === 0)
                return false;
            // 所有处理单元完成。对结果进行排序并将命中结果打包到结果数组中
            this._cellHits = this._cellHits.sort(RaycastResultParser.compareRaycastHits);
            for (let i = 0; i < this._cellHits.length; i++) {
                this._hits[this.hitCounter] = this._cellHits[i];
                // 增加命中计数器，如果它已经达到数组大小的限制，我们就完成了
                this.hitCounter++;
                if (this.hitCounter === this._hits.length)
                    return true;
            }
            return false;
        }
        reset() {
            this._hits = null;
            this._checkedColliders.length = 0;
            this._cellHits.length = 0;
            this._ignoredColliders = null;
        }
    }
    RaycastResultParser.compareRaycastHits = (a, b) => {
        if (a.distance !== b.distance) {
            return a.distance - b.distance;
        }
        else {
            return a.collider.castSortOrder - b.collider.castSortOrder;
        }
    };
    es.RaycastResultParser = RaycastResultParser;
})(es || (es = {}));
var es;
(function (es) {
    class Shape {
    }
    es.Shape = Shape;
})(es || (es = {}));
///<reference path="./Shape.ts" />
var es;
///<reference path="./Shape.ts" />
(function (es) {
    /**
     * 多边形
     */
    class Polygon extends es.Shape {
        /**
         * 从点构造一个多边形
         * 多边形应该以顺时针方式指定 不能重复第一个/最后一个点，它们以0 0为中心
         * @param points
         * @param isBox
         */
        constructor(points, isBox) {
            super();
            this._areEdgeNormalsDirty = true;
            this.isUnrotated = true;
            this.setPoints(points);
            this.isBox = isBox;
        }
        create(vertCount, radius) {
            Polygon.buildSymmetricalPolygon(vertCount, radius);
        }
        /**
         * 边缘法线用于SAT碰撞检测。缓存它们用于避免squareRoots
         * box只有两个边缘 因为其他两边是平行的
         */
        get edgeNormals() {
            if (this._areEdgeNormalsDirty)
                this.buildEdgeNormals();
            return this._edgeNormals;
        }
        /**
         * 重置点并重新计算中心和边缘法线
         * @param points
         */
        setPoints(points) {
            this.points = points;
            this.recalculateCenterAndEdgeNormals();
            this._originalPoints = [];
            this.points.forEach(p => {
                this._originalPoints.push(p.clone());
            });
        }
        /**
         * 重新计算多边形中心
         * 如果点数改变必须调用该方法
         */
        recalculateCenterAndEdgeNormals() {
            this._polygonCenter = Polygon.findPolygonCenter(this.points);
            this._areEdgeNormalsDirty = true;
        }
        /**
         * 建立多边形边缘法线
         * 它们仅由edgeNormals getter惰性创建和更新
         */
        buildEdgeNormals() {
            // 对于box 我们只需要两条边，因为另外两条边是平行的
            let totalEdges = this.isBox ? 2 : this.points.length;
            if (this._edgeNormals == undefined || this._edgeNormals.length != totalEdges)
                this._edgeNormals = new Array(totalEdges);
            let p2;
            for (let i = 0; i < totalEdges; i++) {
                let p1 = this.points[i];
                if (i + 1 >= this.points.length)
                    p2 = this.points[0];
                else
                    p2 = this.points[i + 1];
                let perp = es.Vector2Ext.perpendicular(p1, p2);
                es.Vector2Ext.normalize(perp);
                this._edgeNormals[i] = perp;
            }
        }
        /**
         * 建立一个对称的多边形(六边形，八角形，n角形)并返回点
         * @param vertCount
         * @param radius
         */
        static buildSymmetricalPolygon(vertCount, radius) {
            const verts = new Array(vertCount);
            for (let i = 0; i < vertCount; i++) {
                const a = 2 * Math.PI * (i / vertCount);
                verts[i] = new es.Vector2(Math.cos(a) * radius, Math.sin(a) * radius);
            }
            return verts;
        }
        /**
         * 重定位多边形的点
         * @param points
         */
        static recenterPolygonVerts(points) {
            const center = this.findPolygonCenter(points);
            for (let i = 0; i < points.length; i++)
                points[i] = points[i].sub(center);
        }
        /**
         * 找到多边形的中心。注意，这对于正则多边形是准确的。不规则多边形没有中心。
         * @param points
         */
        static findPolygonCenter(points) {
            let x = 0, y = 0;
            for (let i = 0; i < points.length; i++) {
                x += points[i].x;
                y += points[i].y;
            }
            return new es.Vector2(x / points.length, y / points.length);
        }
        /**
         * 不知道辅助顶点，所以取每个顶点，如果你知道辅助顶点，执行climbing算法
         * @param points
         * @param direction
         */
        static getFarthestPointInDirection(points, direction) {
            let index = 0;
            let maxDot = points[index].dot(direction);
            for (let i = 1; i < points.length; i++) {
                let dot = points[i].dot(direction);
                if (dot > maxDot) {
                    maxDot = dot;
                    index = i;
                }
            }
            return points[index];
        }
        /**
         * 迭代多边形的所有边，并得到任意边上离点最近的点。
         * 通过最近点的平方距离和它所在的边的法线返回。
         * 点应该在多边形的空间中(点-多边形.位置)
         * @param points
         * @param point
         * @param distanceSquared
         * @param edgeNormal
         */
        static getClosestPointOnPolygonToPoint(points, point) {
            const res = {
                distanceSquared: Number.MAX_VALUE,
                edgeNormal: es.Vector2.zero,
                closestPoint: es.Vector2.zero,
            };
            let tempDistanceSquared = 0;
            for (let i = 0; i < points.length; i++) {
                let j = i + 1;
                if (j === points.length)
                    j = 0;
                const closest = es.ShapeCollisionsCircle.closestPointOnLine(points[i], points[j], point);
                tempDistanceSquared = es.Vector2.sqrDistance(point, closest);
                if (tempDistanceSquared < res.distanceSquared) {
                    res.distanceSquared = tempDistanceSquared;
                    res.closestPoint = closest;
                    // 求直线的法线
                    const line = points[j].sub(points[i]);
                    res.edgeNormal.x = line.y;
                    res.edgeNormal.y = -line.x;
                }
            }
            res.edgeNormal = res.edgeNormal.normalize();
            return res;
        }
        /**
         * 旋转原始点并复制旋转的值到旋转的点
         * @param radians
         * @param originalPoints
         * @param rotatedPoints
         */
        static rotatePolygonVerts(radians, originalPoints, rotatedPoints) {
            let cos = Math.cos(radians);
            let sin = Math.sin(radians);
            for (let i = 0; i < originalPoints.length; i++) {
                let position = originalPoints[i];
                rotatedPoints[i] = new es.Vector2(position.x * cos + position.y * -sin, position.x * sin + position.y * cos);
            }
        }
        recalculateBounds(collider) {
            this.center = collider.localOffset;
            if (collider.shouldColliderScaleAndRotateWithTransform) {
                let hasUnitScale = true;
                const tempMat = new es.Matrix2D();
                const combinedMatrix = new es.Matrix2D();
                es.Matrix2D.createTranslation(-this._polygonCenter.x, -this._polygonCenter.y, combinedMatrix);
                const scale = collider.entity.transform.scale;
                if (!scale.equals(es.Vector2.one)) {
                    es.Matrix2D.createScale(scale.x, scale.y, tempMat);
                    es.Matrix2D.multiply(combinedMatrix, tempMat, combinedMatrix);
                    hasUnitScale = false;
                    const scaledOffset = collider.localOffset.multiply(scale);
                    this.center = scaledOffset;
                }
                const rotation = collider.entity.transform.rotationDegrees;
                if (rotation !== 0) {
                    const offsetLength = hasUnitScale ? collider._localOffsetLength : collider.localOffset.multiply(scale).magnitude();
                    const offsetAngle = Math.atan2(collider.localOffset.y * scale.y, collider.localOffset.x * scale.x) * es.MathHelper.Rad2Deg;
                    this.center = es.MathHelper.pointOnCircle(es.Vector2.zero, offsetLength, rotation + offsetAngle);
                    es.Matrix2D.createRotation(es.MathHelper.Deg2Rad * rotation, tempMat);
                    es.Matrix2D.multiply(combinedMatrix, tempMat, combinedMatrix);
                }
                es.Matrix2D.createTranslation(this._polygonCenter.x + collider.transform.position.x + this.center.x, this._polygonCenter.y + collider.transform.position.y + this.center.y, tempMat);
                es.Matrix2D.multiply(combinedMatrix, tempMat, combinedMatrix);
                this.points = this._originalPoints.map(p => p.transform(combinedMatrix));
                this.isUnrotated = rotation === 0;
                if (collider._isRotationDirty)
                    this._areEdgeNormalsDirty = true;
            }
            this.position = collider.transform.position.add(this.center);
            this.bounds = es.Rectangle.rectEncompassingPoints(this.points).offset(this.position.x, this.position.y);
        }
        overlaps(other) {
            let result = new es.Out();
            if (other instanceof Polygon)
                return es.ShapeCollisionsPolygon.polygonToPolygon(this, other, result);
            if (other instanceof es.Circle) {
                if (es.ShapeCollisionsCircle.circleToPolygon(other, this, result)) {
                    result.value.invertResult();
                    return true;
                }
                return false;
            }
            throw new Error(`overlaps of Pologon to ${other} are not supported`);
        }
        collidesWithShape(other, result) {
            if (other instanceof Polygon) {
                return es.ShapeCollisionsPolygon.polygonToPolygon(this, other, result);
            }
            if (other instanceof es.Circle) {
                if (es.ShapeCollisionsCircle.circleToPolygon(other, this, result)) {
                    result.value.invertResult();
                    return true;
                }
                return false;
            }
            throw new Error(`overlaps of Polygon to ${other} are not supported`);
        }
        collidesWithLine(start, end, hit) {
            return es.ShapeCollisionsLine.lineToPoly(start, end, this, hit);
        }
        /**
         * 本质上，这个算法所做的就是从一个点发射一条射线。
         * 如果它与奇数条多边形边相交，我们就知道它在多边形内部。
         * @param point
         */
        containsPoint(point) {
            // 将点归一化到多边形坐标空间中
            point = point.sub(this.position);
            let isInside = false;
            for (let i = 0, j = this.points.length - 1; i < this.points.length; j = i++) {
                if (((this.points[i].y > point.y) !== (this.points[j].y > point.y)) &&
                    (point.x < (this.points[j].x - this.points[i].x) * (point.y - this.points[i].y) / (this.points[j].y - this.points[i].y) +
                        this.points[i].x)) {
                    isInside = !isInside;
                }
            }
            return isInside;
        }
        pointCollidesWithShape(point, result) {
            return es.ShapeCollisionsPoint.pointToPoly(point, this, result);
        }
    }
    es.Polygon = Polygon;
})(es || (es = {}));
///<reference path="./Polygon.ts" />
var es;
///<reference path="./Polygon.ts" />
(function (es) {
    /**
     * 多边形的特殊情况。在进行SAT碰撞检查时，我们只需要检查2个轴而不是8个轴
     */
    class Box extends es.Polygon {
        constructor(width, height) {
            super(Box.buildBox(width, height), true);
            this.width = width;
            this.height = height;
        }
        /**
         * 在一个盒子的形状中建立多边形需要的点的帮助方法
         * @param width
         * @param height
         */
        static buildBox(width, height) {
            // 我们在(0,0)的中心周围创建点
            let halfWidth = width / 2;
            let halfHeight = height / 2;
            let verts = new Array(4);
            verts[0] = new es.Vector2(-halfWidth, -halfHeight);
            verts[1] = new es.Vector2(halfWidth, -halfHeight);
            verts[2] = new es.Vector2(halfWidth, halfHeight);
            verts[3] = new es.Vector2(-halfWidth, halfHeight);
            return verts;
        }
        /**
         * 更新框点，重新计算中心，设置宽度/高度
         * @param width
         * @param height
         */
        updateBox(width, height) {
            this.width = width;
            this.height = height;
            // 我们在(0,0)的中心周围创建点
            let halfWidth = width / 2;
            let halfHeight = height / 2;
            this.points[0] = new es.Vector2(-halfWidth, -halfHeight);
            this.points[1] = new es.Vector2(halfWidth, -halfHeight);
            this.points[2] = new es.Vector2(halfWidth, halfHeight);
            this.points[3] = new es.Vector2(-halfWidth, halfHeight);
            for (let i = 0; i < this.points.length; i++)
                this._originalPoints[i] = this.points[i];
        }
        getEdges() {
            const edges = [];
            for (let i = 0; i < this.points.length; i++) {
                const j = (i + 1) % this.points.length;
                edges.push(new es.Line(this.points[i], this.points[j]));
            }
            return edges;
        }
        overlaps(other) {
            // 特殊情况，这一个高性能方式实现，其他情况则使用polygon方法检测
            if (this.isUnrotated) {
                if (other instanceof Box && other.isUnrotated)
                    return this.bounds.intersects(other.bounds);
                if (other instanceof es.Circle)
                    return es.Collisions.rectToCircle(this.bounds, other.position, other.radius);
            }
            return super.overlaps(other);
        }
        collidesWithShape(other, result) {
            // 特殊情况，这一个高性能方式实现，其他情况则使用polygon方法检测
            if (other instanceof Box && other.isUnrotated) {
                return es.ShapeCollisionsBox.boxToBox(this, other, result);
            }
            // TODO: 让 minkowski 运行于 cricleToBox
            return super.collidesWithShape(other, result);
        }
        containsPoint(point) {
            if (this.isUnrotated)
                return this.bounds.contains(point.x, point.y);
            return super.containsPoint(point);
        }
        pointCollidesWithShape(point, result) {
            if (this.isUnrotated)
                return es.ShapeCollisionsPoint.pointToBox(point, this, result);
            return super.pointCollidesWithShape(point, result);
        }
        getFurthestPoint(normal) {
            const halfWidth = this.width / 2;
            const halfHeight = this.height / 2;
            let furthestPoint = new es.Vector2(halfWidth, halfHeight);
            let dotProduct = furthestPoint.dot(normal);
            let tempPoint = new es.Vector2(-halfWidth, halfHeight);
            let tempDotProduct = tempPoint.dot(normal);
            if (tempDotProduct > dotProduct) {
                furthestPoint.copyFrom(tempPoint);
                dotProduct = tempDotProduct;
            }
            tempPoint.setTo(-halfWidth, -halfHeight);
            tempDotProduct = tempPoint.dot(normal);
            if (tempDotProduct > dotProduct) {
                furthestPoint.copyFrom(tempPoint);
                dotProduct = tempDotProduct;
            }
            tempPoint.setTo(halfWidth, -halfHeight);
            tempDotProduct = tempPoint.dot(normal);
            if (tempDotProduct > dotProduct) {
                furthestPoint.copyFrom(tempPoint);
            }
            return furthestPoint;
        }
    }
    es.Box = Box;
})(es || (es = {}));
///<reference path="./Shape.ts" />
var es;
///<reference path="./Shape.ts" />
(function (es) {
    class Circle extends es.Shape {
        constructor(radius) {
            super();
            this.radius = radius;
            this._originalRadius = radius;
        }
        recalculateBounds(collider) {
            // 如果我们没有旋转或不关心TRS我们使用localOffset作为中心
            this.center = collider.localOffset;
            if (collider.shouldColliderScaleAndRotateWithTransform) {
                // 我们只将直线缩放为一个圆，所以我们将使用最大值
                const scale = collider.entity.transform.scale;
                const hasUnitScale = scale.x === 1 && scale.y === 1;
                const maxScale = Math.max(scale.x, scale.y);
                this.radius = this._originalRadius * maxScale;
                if (collider.entity.transform.rotation !== 0) {
                    // 为了处理偏移原点的旋转，我们只需要将圆心围绕(0,0)在一个圆上移动，我们的偏移量就是0角
                    const offsetAngle = Math.atan2(collider.localOffset.y, collider.localOffset.x) * es.MathHelper.Rad2Deg;
                    const offsetLength = hasUnitScale ? collider._localOffsetLength : collider.localOffset.multiply(collider.entity.transform.scale).magnitude();
                    this.center = es.MathHelper.pointOnCircle(es.Vector2.zero, offsetLength, collider.entity.transform.rotation + offsetAngle);
                }
            }
            this.position = collider.transform.position.add(this.center);
            this.bounds = new es.Rectangle(this.position.x - this.radius, this.position.y - this.radius, this.radius * 2, this.radius * 2);
        }
        overlaps(other) {
            const result = new es.Out();
            if (other instanceof es.Box && other.isUnrotated)
                return es.Collisions.rectToCircle(other.bounds, this.position, this.radius);
            if (other instanceof Circle)
                return es.Collisions.circleToCircle(this.position, this.radius, other.position, other.radius);
            if (other instanceof es.Polygon)
                return es.ShapeCollisionsCircle.circleToPolygon(this, other, result);
            throw new Error(`overlaps of circle to ${other} are not supported`);
        }
        collidesWithShape(other, result) {
            if (other instanceof es.Box && other.isUnrotated) {
                return es.ShapeCollisionsCircle.circleToBox(this, other, result);
            }
            if (other instanceof Circle) {
                return es.ShapeCollisionsCircle.circleToCircle(this, other, result);
            }
            if (other instanceof es.Polygon) {
                return es.ShapeCollisionsCircle.circleToPolygon(this, other, result);
            }
            throw new Error(`Collisions of Circle to ${other} are not supported`);
        }
        collidesWithLine(start, end, hit) {
            return es.ShapeCollisionsLine.lineToCircle(start, end, this, hit);
        }
        getPointAlongEdge(angle) {
            return new es.Vector2(this.position.x + this.radius * Math.cos(angle), this.position.y + this.radius * Math.sin(angle));
        }
        /**
         * 获取所提供的点是否在此范围内
         * @param point
         */
        containsPoint(point) {
            return (point.sub(this.position)).lengthSquared() <= this.radius * this.radius;
        }
        pointCollidesWithShape(point, result) {
            return es.ShapeCollisionsPoint.pointToCircle(point, this, result);
        }
    }
    es.Circle = Circle;
})(es || (es = {}));
var es;
(function (es) {
    class CollisionResult {
        constructor() {
            /**
             * 被形状击中的表面的法向量
             */
            this.normal = es.Vector2.zero;
            /**
             * 应用于第一个形状以推入形状的转换
             */
            this.minimumTranslationVector = es.Vector2.zero;
            /**
             * 不是所有冲突类型都使用!在依赖这个字段之前，请检查ShapeCollisions切割类!
             */
            this.point = es.Vector2.zero;
        }
        reset() {
            this.collider = null;
            this.normal.setTo(0, 0);
            this.minimumTranslationVector.setTo(0, 0);
            if (this.point) {
                this.point.setTo(0, 0);
            }
        }
        cloneTo(cr) {
            cr.collider = this.collider;
            cr.normal.setTo(this.normal.x, this.normal.y);
            cr.minimumTranslationVector.setTo(this.minimumTranslationVector.x, this.minimumTranslationVector.y);
            if (this.point) {
                if (!cr.point) {
                    cr.point = new es.Vector2(0, 0);
                }
                cr.point.setTo(this.point.x, this.point.y);
            }
        }
        /**
         * 从移动向量中移除水平方向的位移，以确保形状只沿垂直方向运动。如果移动向量包含水平移动，则通过计算垂直位移来修复响应距离。
         * @param deltaMovement - 移动向量
         */
        removeHorizontalTranslation(deltaMovement) {
            // 如果运动方向和法线方向不在同一方向或者移动量为0且法线方向不为0，则需要修复
            if (Math.sign(this.normal.x) !== Math.sign(deltaMovement.x) || (deltaMovement.x === 0 && this.normal.x !== 0)) {
                // 获取响应距离
                const responseDistance = this.minimumTranslationVector.magnitude();
                // 计算需要修复的位移
                const fix = responseDistance / this.normal.y;
                // 如果法线方向不是完全水平或垂直，并且修复距离小于移动向量的3倍，则修复距离
                if (Math.abs(this.normal.x) != 1 && Math.abs(fix) < Math.abs(deltaMovement.y * 3)) {
                    this.minimumTranslationVector = new es.Vector2(0, -fix);
                }
            }
        }
        invertResult() {
            this.minimumTranslationVector = this.minimumTranslationVector.negate();
            this.normal = this.normal.negate();
        }
        toString() {
            return `[CollisionResult] normal: ${this.normal}, minimumTranslationVector: ${this.minimumTranslationVector}`;
        }
    }
    es.CollisionResult = CollisionResult;
})(es || (es = {}));
var es;
(function (es) {
    class Line {
        constructor(start, end) {
            this.start = start.clone();
            this.end = end.clone();
        }
        get direction() {
            return this.end.sub(this.start).normalize();
        }
        getNormal() {
            const angle = this.direction.getAngle() - Math.PI / 2;
            return new es.Vector2(Math.cos(angle), Math.sin(angle));
        }
        getDirection(out) {
            return out.copyFrom(this.end).sub(this.start).normalize();
        }
        getLength() {
            return this.start.getDistance(this.end);
        }
        getLengthSquared() {
            return this.start.getDistanceSquared(this.end);
        }
        distanceToPoint(normal, center) {
            return Math.abs((this.end.y - this.start.y) * normal.x - (this.end.x - this.start.x) * normal.y + this.end.x * this.start.y - this.end.y * this.start.x) / (2 * normal.magnitude());
        }
        getFurthestPoint(direction) {
            const d1 = this.start.dot(direction);
            const d2 = this.end.dot(direction);
            return d1 > d2 ? this.start : this.end;
        }
        getClosestPoint(point, out) {
            const delta = out.copyFrom(this.end).sub(this.start);
            const t = (point.sub(this.start)).dot(delta) / delta.lengthSquared();
            if (t < 0) {
                return out.copyFrom(this.start);
            }
            else if (t > 1) {
                return out.copyFrom(this.end);
            }
            return out.copyFrom(delta).multiplyScaler(t).add(this.start);
        }
    }
    es.Line = Line;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 计算投影和重叠区域
     */
    class Projection {
        constructor() {
            this.min = Number.MAX_VALUE;
            this.max = -Number.MAX_VALUE;
        }
        project(axis, polygon) {
            const points = polygon.points;
            let min = axis.dot(points[0]);
            let max = min;
            for (let i = 1; i < points.length; i++) {
                const p = points[i];
                const dot = axis.dot(p);
                if (dot < min) {
                    min = dot;
                }
                else if (dot > max) {
                    max = dot;
                }
            }
            this.min = min;
            this.max = max;
        }
        overlap(other) {
            return this.max >= other.min && other.max >= this.min;
        }
        getOverlap(other) {
            return Math.min(this.max, other.max) - Math.max(this.min, other.min);
        }
    }
    es.Projection = Projection;
})(es || (es = {}));
var es;
(function (es) {
    class RealtimeCollisions {
        /**
         * 判断移动的圆是否与矩形相交，并返回相撞的时间。
         * @param s 移动的圆
         * @param b 矩形
         * @param movement 移动的向量
         * @param time 时间
         * @returns 是否相撞
         */
        static intersectMovingCircleBox(s, b, movement, time) {
            // 计算将b按球面半径r扩大后的AABB
            const e = b.bounds;
            e.inflate(s.radius, s.radius);
            // 将射线与展开的矩形e相交，如果射线错过了e，则以无交点退出，否则得到交点p和时间t作为结果。
            const ray = new es.Ray2D(s.position.sub(movement), s.position); // 创建射线，将移动后的圆心作为起点
            const res = e.rayIntersects(ray); // 判断射线与展开的矩形是否相交
            if (!res.intersected && res.distance > 1)
                return false; // 如果没有相交且距离大于1，则无法相撞
            // 求交点
            const point = ray.start.add(ray.direction.scale(time));
            // 计算交点p位于b的哪个最小面和最大面之外。注意，u和v不能有相同的位集，它们之间必须至少有一个位集。
            let u, v = 0;
            if (point.x < b.bounds.left)
                u |= 1; // 如果交点在最小的x面的左边，将第一位设为1
            if (point.x > b.bounds.right)
                v |= 1; // 如果交点在最大的x面的右边，将第一位设为1
            if (point.y < b.bounds.top)
                u |= 2; // 如果交点在最小的y面的上面，将第二位设为1
            if (point.y > b.bounds.bottom)
                v |= 2; // 如果交点在最大的y面的下面，将第二位设为1
            // 'or'将所有的比特集合在一起，形成一个比特掩码(注意u + v == u | v)
            const m = u + v;
            // 如果这3个比特都被设置，那么该点就在顶点区域内。
            if (m == 3) {
                // 如果有一条或多条命中,则必须在两条边的顶点相交,并返回最佳时间。
                console.log(`m == 3. corner ${es.Time.frameCount}`);
            }
            // 如果在m中只设置了一个位，那么该点就在一个面的区域。
            if ((m & (m - 1)) == 0) {
                // 从扩大的矩形交点开始的时间就是正确的时间
                return true;
            }
            // 点在边缘区域，与边缘相交。
            return true;
        }
        /**
         * 返回矩形的第n个角的坐标。
         * @param b 矩形
         * @param n 第n个角的编号
         * @returns 第n个角的坐标
         */
        static corner(b, n) {
            let p = es.Vector2.zero;
            p.x = (n & 1) === 0 ? b.right : b.left;
            p.y = (n & 1) === 0 ? b.bottom : b.top;
            return p;
        }
        /**
         * 测试一个圆和一个矩形是否相交，并返回是否相交。
         * @param circle 圆
         * @param box 矩形
         * @param point 离圆心最近的点
         * @returns 是否相交
         */
        static testCircleBox(circle, box, point) {
            // 找出离圆心最近的点
            point = box.bounds.getClosestPointOnRectangleToPoint(circle.position);
            // 如果圆心到点的距离小于等于圆的半径，则圆和方块相交
            const v = point.sub(circle.position);
            const dist = v.dot(v);
            return dist <= circle.radius * circle.radius;
        }
    }
    es.RealtimeCollisions = RealtimeCollisions;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 扇形形状
     */
    class Sector extends es.Shape {
        get sectorAngle() {
            let angle = this.endAngle - this.startAngle;
            if (angle < 0)
                angle += 360;
            return angle;
        }
        constructor(center, radius, startAngle, endAngle) {
            super();
            this.center = center;
            this.radius = radius;
            this.startAngle = startAngle;
            this.endAngle = endAngle;
            this.angle = endAngle - startAngle;
            this.radiusSquared = radius * radius;
            this.points = this.getPoints();
            this.calculateProperties();
        }
        /**
         * 获取圆弧的质心。
         * @returns 圆弧的质心
         */
        getCentroid() {
            // 计算圆弧的质心坐标
            const x = (Math.cos(this.startAngle) + Math.cos(this.endAngle)) * this.radius / 3;
            const y = (Math.sin(this.startAngle) + Math.sin(this.endAngle)) * this.radius / 3;
            // 返回质心坐标
            return new es.Vector2(x + this.center.x, y + this.center.y);
        }
        /**
         * 计算向量角度
         * @returns
         */
        getAngle() {
            return this.startAngle;
        }
        recalculateBounds(collider) {
            const localCenter = this.center.add(collider.localOffset);
            const x = localCenter.x - this.radius;
            const y = localCenter.y - this.radius;
            const width = this.radius * 2;
            const height = this.radius * 2;
            const bounds = new es.Rectangle(x, y, width, height);
            this.bounds = bounds;
            this.center = localCenter;
        }
        overlaps(other) {
            let result = new es.Out();
            if (other instanceof es.Polygon)
                return es.ShapeCollisionSector.sectorToPolygon(this, other, result);
            if (other instanceof es.Circle) {
                if (es.ShapeCollisionSector.sectorToCircle(this, other, result)) {
                    result.value.invertResult();
                    return true;
                }
                return false;
            }
            throw new Error(`overlaps of Sector to ${other} are not supported`);
        }
        collidesWithShape(other, collisionResult) {
            if (other instanceof es.Box) {
                return es.ShapeCollisionSector.sectorToBox(this, other, collisionResult);
            }
            if (other instanceof es.Polygon) {
                return es.ShapeCollisionSector.sectorToPolygon(this, other, collisionResult);
            }
            if (other instanceof es.Circle) {
                return es.ShapeCollisionSector.sectorToCircle(this, other, collisionResult);
            }
            throw new Error(`overlaps of Polygon to ${other} are not supported`);
        }
        collidesWithLine(start, end, hit) {
            const toStart = start.sub(this.center); // 线段起点到圆心的向量
            const toEnd = end.sub(this.center); // 线段终点到圆心的向量
            const angleStart = toStart.getAngle(); // 起点向量与 x 轴正方向的夹角
            const angleEnd = toEnd.getAngle(); // 终点向量与 x 轴正方向的夹角
            let angleDiff = angleEnd - angleStart; // 终点角度减去起点角度得到角度差
            // 将角度差限制在 -PI 到 PI 之间，方便判断是否跨越了 0 度
            if (angleDiff > Math.PI) {
                angleDiff -= 2 * Math.PI;
            }
            else if (angleDiff < -Math.PI) {
                angleDiff += 2 * Math.PI;
            }
            // 如果角度差在圆弧的起始角度和结束角度之间，则有可能发生相交
            if (angleDiff >= this.startAngle && angleDiff <= this.endAngle) {
                const r = toStart.getLength(); // 圆心到线段起点的距离
                const t = this.startAngle - angleStart; // 起点角度到圆弧起始角度的角度差
                const x = r * Math.cos(t); // 圆弧上与线段相交的点的 x 坐标
                const y = r * Math.sin(t); // 圆弧上与线段相交的点的 y 坐标
                const intersection = new es.Vector2(x, y); // 相交点的二维坐标
                // 判断相交点是否在线段上
                if (intersection.isBetween(start, end)) {
                    const distance = intersection.sub(start).getLength(); // 相交点到线段起点的距离
                    const fraction = distance / start.getDistance(end); // 相交点处于线段的分数
                    const normal = intersection.sub(this.center).normalize(); // 相交点处圆弧的法向量
                    const point = intersection.add(this.center); // 相交点的全局坐标
                    // 将相交信息存储到 hit 参数中
                    const raycastHit = new es.RaycastHit();
                    raycastHit.setValues(fraction, distance, point, normal);
                    hit.value = raycastHit;
                    return true; // 返回 true 表示相交
                }
            }
            return false; // 返回 false 表示不相交
        }
        containsPoint(point) {
            const toPoint = point.sub(this.center); // 点到圆心的向量
            const distanceSquared = toPoint.lengthSquared(); // 点到圆心距离的平方
            if (distanceSquared > this.radiusSquared) { // 如果点到圆心的距离平方大于圆形区域半径平方，则该点不在圆形区域内
                return false;
            }
            const angle = toPoint.getAngle(); // 点到圆心的向量与 x 轴正方向的夹角
            const startAngle = this.startAngle; // 圆弧起始角度
            const endAngle = startAngle + this.angle; // 圆弧终止角度
            let angleDiff = angle - startAngle; // 计算点到圆弧起始角度的角度差
            if (angleDiff < 0) { // 如果角度差小于 0，则说明点在圆弧角度的另一侧，需要加上 2 * PI
                angleDiff += Math.PI * 2;
            }
            if (angleDiff > this.angle) { // 如果角度差大于圆弧角度，则该点不在圆弧范围内
                return false;
            }
            return true; // 点在圆形区域内
        }
        pointCollidesWithShape(point, result) {
            if (!this.containsPoint(point)) {
                if (result) {
                    result.value = null;
                }
                return false;
            }
            if (result) {
                result.value = new es.CollisionResult();
                result.value.normal = point.sub(this.center).normalize();
                result.value.minimumTranslationVector = result.value.normal.scale(this.radius - point.sub(this.center).getLength());
                result.value.point = point;
            }
            return true;
        }
        getPoints() {
            let points = new Array(this.numberOfPoints);
            for (let i = 0; i < this.numberOfPoints; i++) {
                let angle = this.startAngle + i * this.angleStep;
                points[i] = es.Vector2.fromAngle(angle, this.radius).add(this.center);
            }
            return points;
        }
        calculateProperties() {
            this.numberOfPoints = Math.max(10, Math.floor(this.radius * 0.1));
            this.angleStep = (this.endAngle - this.startAngle) / (this.numberOfPoints - 1);
        }
        getFurthestPoint(normal) {
            let maxProjection = -Number.MAX_VALUE; // 最大投影值
            let furthestPoint = new es.Vector2(); // 最远点
            for (let i = 0; i < this.numberOfPoints; i++) { // 遍历多边形的所有顶点
                let projection = this.points[i].dot(normal); // 计算当前顶点到法线的投影
                if (projection > maxProjection) { // 如果当前投影值大于最大投影值，则更新最大投影值和最远点
                    maxProjection = projection;
                    furthestPoint.copyFrom(this.points[i]);
                }
            }
            return furthestPoint; // 返回最远点
        }
    }
    es.Sector = Sector;
})(es || (es = {}));
var es;
(function (es) {
    class ShapeCollisionSector {
        static sectorToPolygon(first, second, result) {
            const numPoints = second.points.length;
            let collision = false;
            const edgeStart = new es.Vector2();
            const edgeEnd = new es.Vector2();
            const hit = new es.Out();
            for (let i = 0; i < numPoints; i++) {
                const point = second.points[i];
                if (first.containsPoint(point)) {
                    if (result) {
                        result.value = new es.CollisionResult();
                        result.value.point = point.clone();
                        result.value.normal = point.sub(first.center).normalize();
                    }
                    collision = true;
                    break;
                }
            }
            if (!collision && second.containsPoint(first.center)) {
                if (result) {
                    result.value = new es.CollisionResult();
                    result.value.point = first.center.clone();
                    result.value.normal = new es.Vector2(0, 0);
                }
                collision = true;
            }
            if (!collision) {
                for (let i = 0; i < numPoints; i++) {
                    const p1 = second.points[i];
                    const p2 = second.points[(i + 1) % numPoints];
                    edgeStart.copyFrom(p1);
                    edgeEnd.copyFrom(p2);
                    if (first.collidesWithLine(edgeStart, edgeEnd, hit)) {
                        if (result) {
                            result.value = new es.CollisionResult();
                            result.value.point.copyFrom(hit.value.point);
                            result.value.normal.copyFrom(hit.value.normal);
                        }
                        collision = true;
                        break;
                    }
                }
            }
            return collision;
        }
        static sectorToCircle(first, second, result) {
            const radiusSquared = second.radius * second.radius;
            const distanceSquared = first.center.getDistanceSquared(second.center);
            const angleDiff = Math.abs(second.center.sub(first.center).getAngle() - first.getAngle());
            const sectorAngle = first.endAngle - first.startAngle;
            if (distanceSquared <= radiusSquared && angleDiff <= sectorAngle / 2) {
                if (result) {
                    result.value = new es.CollisionResult();
                    result.value.normal = second.center.sub(first.center).normalize();
                    result.value.point = second.center.clone().add(result.value.normal.clone().multiplyScaler(second.radius));
                }
                return true;
            }
            if (result) {
                result.value = null;
            }
            return false;
        }
        static sectorToBox(first, second, result) {
            result.value = new es.CollisionResult();
            // 获取box的四条边
            let boxEdges = second.getEdges();
            // 遍历box的每一条边
            for (let i = 0; i < boxEdges.length; i++) {
                let normal = boxEdges[i].getNormal();
                let furthestPointBox = second.getFurthestPoint(normal);
                let furthestPointSector = first.getFurthestPoint(normal.negate());
                let distance = normal.dot(furthestPointSector.sub(furthestPointBox));
                // 没有相交
                if (distance > 0)
                    return false;
                if (result.value && Math.abs(distance) < result.value.minimumTranslationVector.getLength()) {
                    result.value.minimumTranslationVector = normal.clone().multiplyScaler(distance);
                    result.value.normal = normal;
                }
            }
            return true;
        }
    }
    es.ShapeCollisionSector = ShapeCollisionSector;
})(es || (es = {}));
var es;
(function (es) {
    class ShapeCollisionsBox {
        static boxToBox(first, second, result) {
            result.value = new es.CollisionResult();
            const minkowskiDiff = this.minkowskiDifference(first, second);
            if (minkowskiDiff.contains(0, 0)) {
                // 计算MTV。如果它是零，我们就可以称它为非碰撞
                result.value.minimumTranslationVector = minkowskiDiff.getClosestPointOnBoundsToOrigin();
                if (result.value.minimumTranslationVector.equals(es.Vector2.zero))
                    return false;
                result.value.normal = result.value.minimumTranslationVector.scale(-1);
                result.value.normal = result.value.normal.normalize();
                return true;
            }
            return false;
        }
        /**
         * 用second检查被deltaMovement移动的框的结果
         * @param first
         * @param second
         * @param movement
         * @param hit
         */
        static boxToBoxCast(first, second, movement, hit) {
            // 首先，我们检查是否有重叠。如果有重叠，我们就不做扫描测试
            const minkowskiDiff = this.minkowskiDifference(first, second);
            if (minkowskiDiff.contains(0, 0)) {
                // 计算MTV。如果它是零，我们就可以称它为非碰撞
                const mtv = minkowskiDiff.getClosestPointOnBoundsToOrigin();
                if (mtv.equals(es.Vector2.zero))
                    return false;
                hit.normal = new es.Vector2(-mtv.x, -mtv.y);
                hit.normal = hit.normal.normalize();
                hit.distance = 0;
                hit.fraction = 0;
                return true;
            }
            else {
                // 射线投射移动矢量
                const ray = new es.Ray2D(es.Vector2.zero, movement.scale(-1));
                const res = minkowskiDiff.rayIntersects(ray);
                if (res.intersected && res.distance <= 1) {
                    hit.fraction = res.distance;
                    hit.distance = movement.magnitude() * res.distance;
                    hit.normal = movement.scale(-1);
                    hit.normal = hit.normal.normalize();
                    hit.centroid = first.bounds.center.add(movement.scale(res.distance));
                    return true;
                }
            }
            return false;
        }
        static minkowskiDifference(first, second) {
            // 我们需要第一个框的左上角
            // 碰撞器只会修改运动的位置所以我们需要用位置来计算出运动是什么。
            const positionOffset = first.position.sub(first.bounds.center);
            const topLeft = first.bounds.location.add(positionOffset.sub(second.bounds.max));
            const fullSize = first.bounds.size.add(second.bounds.size);
            return new es.Rectangle(topLeft.x, topLeft.y, fullSize.x, fullSize.y);
        }
    }
    es.ShapeCollisionsBox = ShapeCollisionsBox;
})(es || (es = {}));
var es;
(function (es) {
    class ShapeCollisionsCircle {
        static circleToCircleCast(first, second, deltaMovement, hit) {
            hit.value = new es.RaycastHit();
            // 在动圆的运动矢量上找到离圆中心最近的点（第一个）
            let endPointOfCast = first.position.add(deltaMovement);
            let d = this.closestPointOnLine(first.position, endPointOfCast, second.position);
            // 然后求最近点到圆心的距离 
            let closestDistanceSquared = es.Vector2.sqrDistance(second.position, d);
            const sumOfRadiiSquared = (first.radius + second.radius) * (first.radius + second.radius);
            // 如果它小于半径之和，则发生碰撞
            if (closestDistanceSquared <= sumOfRadiiSquared) {
                const normalizedDeltaMovement = deltaMovement.normalize();
                // 边缘情况：如果端点等于线上最近的点，那么从它到 second.position 的线将不垂直于射线
                if (d === endPointOfCast) {
                    // 延长投射半径距离的终点，因此我们得到一个垂直的点
                    endPointOfCast = first.position.add(deltaMovement.add(normalizedDeltaMovement.scale(second.radius)));
                    d = this.closestPointOnLine(first.position, endPointOfCast, second.position);
                    closestDistanceSquared = es.Vector2.sqrDistance(second.position, d);
                }
                const backDist = Math.sqrt(sumOfRadiiSquared - closestDistanceSquared);
                hit.value.centroid = d.sub(normalizedDeltaMovement.scale(backDist));
                hit.value.normal = hit.value.centroid.sub(second.position).normalize();
                hit.value.fraction = (hit.value.centroid.x - first.position.x) / deltaMovement.x;
                hit.value.distance = es.Vector2.distance(first.position, hit.value.centroid);
                hit.value.point = second.position.add(hit.value.normal.scale(second.radius));
                return true;
            }
            return false;
        }
        static circleToCircle(first, second, result) {
            result.value = new es.CollisionResult();
            const distanceSquared = es.Vector2.sqrDistance(first.position, second.position);
            const sumOfRadii = first.radius + second.radius;
            const collided = distanceSquared < sumOfRadii * sumOfRadii;
            if (collided) {
                result.value.normal = first.position.sub(second.position).normalize();
                const depth = sumOfRadii - Math.sqrt(distanceSquared);
                result.value.minimumTranslationVector = result.value.normal.scale(-depth);
                result.value.point = second.position.add(result.value.normal.scale(second.radius));
                return true;
            }
            return false;
        }
        /**
         * 适用于中心在框内的圆，也适用于与框外中心重合的圆。
         * @param circle
         * @param box
         * @param result
         */
        static circleToBox(circle, box, result) {
            result.value = new es.CollisionResult();
            const normal = new es.Out();
            const closestPointOnBounds = box.bounds.getClosestPointOnRectangleBorderToPoint(circle.position, normal);
            result.value.normal = normal.value;
            // 先处理中心在盒子里的圆，如果我们是包含的, 它的成本更低，
            if (box.containsPoint(circle.position)) {
                result.value.point = closestPointOnBounds;
                // 计算MTV。找出安全的、非碰撞的位置，并从中得到MTV
                const safePlace = closestPointOnBounds.add(result.value.normal.scale(circle.radius));
                result.value.minimumTranslationVector = circle.position.sub(safePlace);
                return true;
            }
            const sqrDistance = es.Vector2.sqrDistance(closestPointOnBounds, circle.position);
            // 看框上的点距圆的半径是否小于圆的半径
            if (sqrDistance == 0) {
                result.value.minimumTranslationVector = result.value.normal.scale(circle.radius);
            }
            else if (sqrDistance <= circle.radius * circle.radius) {
                result.value.normal = circle.position.sub(closestPointOnBounds);
                const depth = result.value.normal.magnitude() - circle.radius;
                result.value.point = closestPointOnBounds;
                result.value.normal = result.value.normal.normalize();
                result.value.minimumTranslationVector = result.value.normal.scale(depth);
                return true;
            }
            return false;
        }
        static circleToPolygon(circle, polygon, result) {
            result.value = new es.CollisionResult();
            // 圆圈在多边形中的位置坐标
            const poly2Circle = circle.position.sub(polygon.position);
            // 首先，我们需要找到从圆到多边形的最近距离
            const res = es.Polygon.getClosestPointOnPolygonToPoint(polygon.points, poly2Circle);
            result.value.normal = res.edgeNormal;
            // 确保距离的平方小于半径的平方，否则我们不会相撞。
            // 请注意，如果圆完全包含在多边形中，距离可能大于半径。
            // 正因为如此，我们还要确保圆的位置不在多边形内。
            const circleCenterInsidePoly = polygon.containsPoint(circle.position);
            if (res.distanceSquared > circle.radius * circle.radius && !circleCenterInsidePoly)
                return false;
            // 算出MTV。我们要注意处理完全包含在多边形中的圆或包含其中心的圆
            let mtv;
            if (circleCenterInsidePoly) {
                mtv = result.value.normal.scale(Math.sqrt(res.distanceSquared) - circle.radius);
            }
            else {
                // 如果我们没有距离，这意味着圆心在多边形的边缘上。只需根据它的半径移动它
                if (res.distanceSquared === 0) {
                    mtv = result.value.normal.scale(circle.radius);
                }
                else {
                    const distance = Math.sqrt(res.distanceSquared);
                    mtv = poly2Circle
                        .sub(res.closestPoint)
                        .scale(((circle.radius - distance) / distance) * -1);
                }
            }
            result.value.minimumTranslationVector = mtv;
            result.value.point = res.closestPoint.add(polygon.position);
            return true;
        }
        static closestPointOnLine(lineA, lineB, closestTo) {
            const v = lineB.sub(lineA);
            const w = closestTo.sub(lineA);
            let t = w.dot(v) / v.dot(v);
            t = es.MathHelper.clamp(t, 0, 1);
            return lineA.add(v.scaleEqual(t));
        }
    }
    es.ShapeCollisionsCircle = ShapeCollisionsCircle;
})(es || (es = {}));
var es;
(function (es) {
    class ShapeCollisionsLine {
        static lineToPoly(start, end, polygon, hit) {
            hit.value = new es.RaycastHit();
            let normal = es.Vector2.zero;
            let intersectionPoint = es.Vector2.zero;
            let fraction = Number.MAX_VALUE;
            let hasIntersection = false;
            for (let j = polygon.points.length - 1, i = 0; i < polygon.points.length; j = i, i++) {
                const edge1 = es.Vector2.add(polygon.position, polygon.points[j]);
                const edge2 = es.Vector2.add(polygon.position, polygon.points[i]);
                const intersection = es.Vector2.zero;
                if (ShapeCollisionsLine.lineToLine(edge1, edge2, start, end, intersection)) {
                    hasIntersection = true;
                    // TODO: 这是得到分数的正确和最有效的方法吗?
                    // 先检查x分数。如果是NaN，就用y代替
                    let distanceFraction = (intersection.x - start.x) / (end.x - start.x);
                    if (Number.isNaN(distanceFraction) || Math.abs(distanceFraction) == Infinity)
                        distanceFraction = (intersection.y - start.y) / (end.y - start.y);
                    if (distanceFraction < fraction) {
                        const edge = edge2.sub(edge1);
                        normal = new es.Vector2(edge.y, -edge.x);
                        fraction = distanceFraction;
                        intersectionPoint = intersection;
                    }
                }
            }
            if (hasIntersection) {
                normal = normal.normalize();
                const distance = es.Vector2.distance(start, intersectionPoint);
                hit.value.setValues(fraction, distance, intersectionPoint, normal);
                return true;
            }
            return false;
        }
        static lineToLine(a1, a2, b1, b2, intersection) {
            const b = a2.sub(a1);
            const d = b2.sub(b1);
            const bDotDPerp = b.x * d.y - b.y * d.x;
            // 如果b*d = 0，表示这两条直线平行，因此有无穷个交点
            if (bDotDPerp == 0)
                return false;
            const c = b1.sub(a1);
            const t = (c.x * d.y - c.y * d.x) / bDotDPerp;
            if (t < 0 || t > 1)
                return false;
            const u = (c.x * b.y - c.y * b.x) / bDotDPerp;
            if (u < 0 || u > 1)
                return false;
            const r = a1.add(b.scale(t));
            intersection.x = r.x;
            intersection.y = r.y;
            return true;
        }
        static lineToCircle(start, end, s, hit) {
            hit.value = new es.RaycastHit();
            // 计算这里的长度并分别对d进行标准化，因为如果我们命中了我们需要它来得到分数
            const lineLength = es.Vector2.distance(start, end);
            const d = es.Vector2.divideScaler(end.sub(start), lineLength);
            const m = start.sub(s.position);
            const b = m.dot(d);
            const c = m.dot(m) - s.radius * s.radius;
            // 如果r的原点在s之外，(c>0)和r指向s (b>0) 则返回
            if (c > 0 && b > 0)
                return false;
            let discr = b * b - c;
            // 线不在圆圈上
            if (discr < 0)
                return false;
            // 射线相交圆
            hit.value.fraction = -b - Math.sqrt(discr);
            // 如果分数为负数，射线从圈内开始，
            if (hit.value.fraction < 0)
                hit.value.fraction = 0;
            hit.value.point = start.add(d.scale(hit.value.fraction));
            hit.value.distance = es.Vector2.distance(start, hit.value.point);
            hit.value.normal = hit.value.point.sub(s.position).normalize();
            hit.value.fraction = hit.value.distance / lineLength;
            return true;
        }
    }
    es.ShapeCollisionsLine = ShapeCollisionsLine;
})(es || (es = {}));
var es;
(function (es) {
    class ShapeCollisionsPoint {
        static pointToCircle(point, circle, result) {
            result.value = new es.CollisionResult();
            let distanceSquared = es.Vector2.sqrDistance(point, circle.position);
            let sumOfRadii = 1 + circle.radius;
            let collided = distanceSquared < sumOfRadii * sumOfRadii;
            if (collided) {
                result.value.normal = point.sub(circle.position).normalize();
                let depth = sumOfRadii - Math.sqrt(distanceSquared);
                result.value.minimumTranslationVector = result.value.normal.scale(-depth);
                ;
                result.value.point = circle.position.add(result.value.normal.scale(circle.radius));
                return true;
            }
            return false;
        }
        static pointToBox(point, box, result) {
            result.value = new es.CollisionResult();
            if (box.containsPoint(point)) {
                // 在方框的空间里找到点
                const normal = new es.Out();
                result.value.point = box.bounds.getClosestPointOnRectangleBorderToPoint(point, normal);
                result.value.normal = normal.value;
                result.value.minimumTranslationVector = point.sub(result.value.point);
                return true;
            }
            return false;
        }
        static pointToPoly(point, poly, result) {
            result.value = new es.CollisionResult();
            if (poly.containsPoint(point)) {
                const res = es.Polygon.getClosestPointOnPolygonToPoint(poly.points, point.sub(poly.position));
                result.value.normal = res.edgeNormal;
                result.value.minimumTranslationVector = result.value.normal.scale(Math.sqrt(res.distanceSquared));
                result.value.point = res.closestPoint.sub(poly.position);
                return true;
            }
            return false;
        }
    }
    es.ShapeCollisionsPoint = ShapeCollisionsPoint;
})(es || (es = {}));
var es;
(function (es) {
    class ShapeCollisionsPolygon {
        /**
         * 检查两个多边形之间的碰撞
         * @param first
         * @param second
         * @param result
         */
        static polygonToPolygon(first, second, result) {
            result.value = new es.CollisionResult();
            let isIntersecting = true;
            const firstEdges = first.edgeNormals;
            const secondEdges = second.edgeNormals;
            let minIntervalDistance = Number.POSITIVE_INFINITY;
            let translationAxis = es.Vector2.zero;
            let polygonOffset = first.position.sub(second.position);
            let axis;
            // 循环穿过两个多边形的所有边
            for (let edgeIndex = 0; edgeIndex < firstEdges.length + secondEdges.length; edgeIndex++) {
                // 1. 找出当前多边形是否相交
                // 多边形的归一化轴垂直于缓存给我们的当前边
                axis = edgeIndex < firstEdges.length ? firstEdges[edgeIndex] : secondEdges[edgeIndex - firstEdges.length];
                // 求多边形在当前轴上的投影
                let intervalDist = 0;
                let { min: minA, max: maxA } = this.getInterval(axis, first);
                const { min: minB, max: maxB } = this.getInterval(axis, second);
                // 将区间设为第二个多边形的空间。由轴上投影的位置差偏移。
                const relativeIntervalOffset = polygonOffset.dot(axis);
                minA += relativeIntervalOffset;
                maxA += relativeIntervalOffset;
                // 检查多边形投影是否正在相交
                intervalDist = this.intervalDistance(minA, maxA, minB, maxB);
                if (intervalDist > 0)
                    isIntersecting = false;
                // 对于多对多数据类型转换，添加一个Vector2?参数称为deltaMovement。为了提高速度，我们这里不使用它
                // TODO: 现在找出多边形是否会相交。只要检查速度就行了
                // 如果多边形不相交，也不会相交，退出循环
                if (!isIntersecting)
                    return false;
                // 检查当前间隔距离是否为最小值。如果是，则存储间隔距离和当前距离。这将用于计算最小平移向量
                intervalDist = Math.abs(intervalDist);
                if (intervalDist < minIntervalDistance) {
                    minIntervalDistance = intervalDist;
                    translationAxis.setTo(axis.x, axis.y);
                    if (translationAxis.dot(polygonOffset) < 0)
                        translationAxis = translationAxis.scale(-1);
                }
            }
            // 利用最小平移向量对多边形进行推入。
            result.value.normal = translationAxis;
            result.value.minimumTranslationVector = translationAxis.scale(-minIntervalDistance);
            return true;
        }
        /**
         * 计算一个多边形在一个轴上的投影，并返回一个[min，max]区间
         * @param axis
         * @param polygon
         * @param min
         * @param max
         */
        static getInterval(axis, polygon) {
            const res = { min: 0, max: 0 };
            let dot;
            dot = polygon.points[0].dot(axis);
            res.max = dot;
            res.min = dot;
            for (let i = 1; i < polygon.points.length; i++) {
                dot = polygon.points[i].dot(axis);
                if (dot < res.min) {
                    res.min = dot;
                }
                else if (dot > res.max) {
                    res.max = dot;
                }
            }
            return res;
        }
        /**
         * 计算[minA, maxA]和[minB, maxB]之间的距离。如果间隔重叠，距离是负的
         * @param minA
         * @param maxA
         * @param minB
         * @param maxB
         */
        static intervalDistance(minA, maxA, minB, maxB) {
            if (minA < minB)
                return minB - maxA;
            return minA - maxB;
        }
    }
    es.ShapeCollisionsPolygon = ShapeCollisionsPolygon;
})(es || (es = {}));
var es;
(function (es) {
    /**
    * `AbstractTweenable` 是一个抽象类，实现了 `ITweenable` 接口。
    * 这个类提供了 `start`、`pause`、`resume` 和 `stop` 等方法，
    * 并且具有判断动画是否运行的方法 `isRunning`。
    * 它还有一个 `tick` 方法，子类需要根据自己的需要实现这个方法。
    *
    * `AbstractTweenable` 在完成后往往会被保留下来， `_isCurrentlyManagedByTweenManager` 标志可以让它们知道自己当前是否被 `TweenManager` 监控着，
    * 以便在必要时可以重新添加自己。
    */
    class AbstractTweenable {
        constructor() {
            this.discriminator = "ITweenable";
        }
        recycleSelf() {
        }
        isRunning() {
            return this._isCurrentlyManagedByTweenManager && !this._isPaused;
        }
        start() {
            if (this._isCurrentlyManagedByTweenManager) {
                this._isPaused = false;
                return;
            }
            es.TweenManager.addTween(this);
            this._isCurrentlyManagedByTweenManager = true;
            this._isPaused = false;
        }
        pause() {
            this._isPaused = true;
        }
        resume() {
            this._isPaused = false;
        }
        stop(bringToCompletion = false) {
            es.TweenManager.removeTween(this);
            this._isCurrentlyManagedByTweenManager = false;
            this._isPaused = true;
        }
    }
    es.AbstractTweenable = AbstractTweenable;
})(es || (es = {}));
var es;
(function (es) {
    class PropertyTarget {
        /**
         * @param target 属性动画的目标对象
         * @param propertyName 属性名
         */
        constructor(target, propertyName) {
            this._target = target;
            this._propertyName = propertyName;
        }
        getTargetObject() {
            return this._target;
        }
        setTweenedValue(value) {
            // 将属性动画的目标对象的属性值设置为动画的当前值
            this._target[this._propertyName] = value;
        }
        getTweenedValue() {
            // 获取属性动画的目标对象的属性值
            return this._target[this._propertyName];
        }
    }
    /**
     * 属性动画工具类
     */
    class PropertyTweens {
        /**
         * 创建一个属性为number类型的动画对象
         * @param self 属性动画的目标对象
         * @param memberName 属性名
         * @param to 动画结束时的属性值
         * @param duration 动画时长
         */
        static NumberPropertyTo(self, memberName, to, duration) {
            let tweenTarget = new PropertyTarget(self, memberName);
            let tween = es.TweenManager.cacheNumberTweens ? es.Pool.obtain(es.NumberTween) : new es.NumberTween();
            tween.initialize(tweenTarget, to, duration);
            return tween;
        }
        /**
         * 创建一个属性为Vector2类型的动画对象
         * @param self 属性动画的目标对象
         * @param memberName 属性名
         * @param to 动画结束时的属性值
         * @param duration 动画时长
         */
        static Vector2PropertyTo(self, memberName, to, duration) {
            let tweenTarget = new PropertyTarget(self, memberName);
            let tween = es.TweenManager.cacheVector2Tweens ? es.Pool.obtain(es.Vector2Tween) : new es.Vector2Tween();
            tween.initialize(tweenTarget, to, duration);
            return tween;
        }
    }
    es.PropertyTweens = PropertyTweens;
})(es || (es = {}));
var es;
(function (es) {
    class TransformSpringTween extends es.AbstractTweenable {
        get targetType() {
            return this._targetType;
        }
        constructor(transform, targetType, targetValue) {
            super();
            // 阻尼比（dampingRatio）和角频率（angularFrequency）的配置是公开的，以便于在设计时进行调整
            /**
             * 值越低，阻尼越小，值越高，阻尼越大，导致弹簧度越小，应在0.01-1之间，以避免系统不稳定
             */
            this.dampingRatio = 0.23;
            /**
             * 角频率为2pi(弧度/秒)意味着振荡在一秒钟内完成一个完整的周期，即1Hz.应小于35左右才能保持稳定角频率
             */
            this.angularFrequency = 25;
            this._transform = transform;
            this._targetType = targetType;
            this.setTargetValue(targetValue);
        }
        /**
         * 你可以在任何时候调用setTargetValue来重置目标值到一个新的Vector2。
         * 如果你没有调用start来添加spring tween，它会为你调用
         * @param targetValue
         */
        setTargetValue(targetValue) {
            this._velocity = es.Vector2.zero;
            this._targetValue = targetValue;
            if (!this._isCurrentlyManagedByTweenManager)
                this.start();
        }
        /**
         * lambda应该是振荡幅度减少50%时的理想持续时间
         * @param lambda
         */
        updateDampingRatioWithHalfLife(lambda) {
            this.dampingRatio = (-lambda / this.angularFrequency) * Math.log(0.5);
        }
        tick() {
            if (!this._isPaused)
                this.setTweenedValue(es.Lerps.fastSpring(this.getCurrentValueOfTweenedTargetType(), this._targetValue, this._velocity, this.dampingRatio, this.angularFrequency));
            return false;
        }
        setTweenedValue(value) {
            switch (this._targetType) {
                case es.TransformTargetType.position:
                    this._transform.position = value;
                    break;
                case es.TransformTargetType.localPosition:
                    this._transform.localPosition = value;
                    break;
                case es.TransformTargetType.scale:
                    this._transform.scale = value;
                    break;
                case es.TransformTargetType.localScale:
                    this._transform.localScale = value;
                    break;
                case es.TransformTargetType.rotationDegrees:
                    this._transform.rotationDegrees = value.x;
                case es.TransformTargetType.localRotationDegrees:
                    this._transform.localRotationDegrees = value.x;
                    break;
            }
        }
        getCurrentValueOfTweenedTargetType() {
            switch (this._targetType) {
                case es.TransformTargetType.position:
                    return this._transform.position;
                case es.TransformTargetType.localPosition:
                    return this._transform.localPosition;
                case es.TransformTargetType.scale:
                    return this._transform.scale;
                case es.TransformTargetType.localScale:
                    return this._transform.localScale;
                case es.TransformTargetType.rotationDegrees:
                    return new es.Vector2(this._transform.rotationDegrees);
                case es.TransformTargetType.localRotationDegrees:
                    return new es.Vector2(this._transform.localRotationDegrees, 0);
                default:
                    return es.Vector2.zero;
            }
        }
    }
    es.TransformSpringTween = TransformSpringTween;
})(es || (es = {}));
var es;
(function (es) {
    let LoopType;
    (function (LoopType) {
        LoopType[LoopType["none"] = 0] = "none";
        LoopType[LoopType["restartFromBeginning"] = 1] = "restartFromBeginning";
        LoopType[LoopType["pingpong"] = 2] = "pingpong";
    })(LoopType = es.LoopType || (es.LoopType = {}));
    let TweenState;
    (function (TweenState) {
        TweenState[TweenState["running"] = 0] = "running";
        TweenState[TweenState["paused"] = 1] = "paused";
        TweenState[TweenState["complete"] = 2] = "complete";
    })(TweenState = es.TweenState || (es.TweenState = {}));
    class Tween {
        constructor() {
            this._shouldRecycleTween = true; // 标志位，表示Tween执行完毕后是否要回收Tween实例
            this._tweenState = TweenState.complete; // 当前Tween的状态
            this._timeScale = 1; // 时间缩放系数
        }
        setEaseType(easeType) {
            this._easeType = easeType;
            return this;
        }
        setDelay(delay) {
            this._delay = delay;
            this._elapsedTime = -this._delay;
            return this;
        }
        setDuration(duration) {
            this._duration = duration;
            return this;
        }
        setTimeScale(timeSclae) {
            this._timeScale = timeSclae;
            return this;
        }
        setIsTimeScaleIndependent() {
            this._isTimeScaleIndependent = true;
            return this;
        }
        setCompletionHandler(completeHandler) {
            this._completionHandler = completeHandler;
            return this;
        }
        setLoops(loopType, loops = 1, delayBetweenLoops = 0) {
            this._loopType = loopType;
            this._delayBetweenLoops = delayBetweenLoops;
            if (loops < 0)
                loops = -1;
            if (loopType == LoopType.pingpong)
                loops = loops * 2;
            this._loops = loops;
            return this;
        }
        setLoopCompletionHanlder(loopCompleteHandler) {
            this._loopCompleteHandler = loopCompleteHandler;
            return this;
        }
        setFrom(from) {
            this._isFromValueOverridden = true;
            this._fromValue = from;
            return this;
        }
        prepareForReuse(from, to, duration) {
            this.initialize(this._target, to, duration);
            return this;
        }
        setRecycleTween(shouldRecycleTween) {
            this._shouldRecycleTween = shouldRecycleTween;
            return this;
        }
        setContext(context) {
            this.context = context;
            return this;
        }
        setNextTween(nextTween) {
            this._nextTween = nextTween;
            return this;
        }
        tick() {
            // 如果Tween处于暂停状态，则直接返回false
            if (this._tweenState == TweenState.paused)
                return false;
            // 计算多余的时间
            let elapsedTimeExcess = this.calculateElapsedTimeExcess();
            // 如果Tween处于有效时间范围内，则更新Tween值
            if (this._elapsedTime >= 0 && this._elapsedTime <= this._duration) {
                this.updateValue();
            }
            // 如果Tween已经完成，且需要进行循环，则处理循环
            if (this._loopType != LoopType.none && this._tweenState == TweenState.complete && this._loops != 0) {
                this.handleLooping(elapsedTimeExcess);
            }
            // 计算deltaTime并更新_elapsedTime
            let deltaTime = this.calculateDeltaTime();
            this.updateElapsedTime(deltaTime);
            // 如果Tween已经完成，则处理完成事件并启动下一个Tween（如果有的话）
            if (this._tweenState == TweenState.complete) {
                this.handleCompletion();
                return true;
            }
            return false;
        }
        // 计算多余的时间
        calculateElapsedTimeExcess() {
            let elapsedTimeExcess = 0;
            if (!this._isRunningInReverse && this._elapsedTime >= this._duration) {
                elapsedTimeExcess = this._elapsedTime - this._duration;
                this._elapsedTime = this._duration;
                this._tweenState = TweenState.complete;
            }
            else if (this._isRunningInReverse && this._elapsedTime <= 0) {
                elapsedTimeExcess = 0 - this._elapsedTime;
                this._elapsedTime = 0;
                this._tweenState = TweenState.complete;
            }
            return elapsedTimeExcess;
        }
        // 计算deltaTime
        calculateDeltaTime() {
            let deltaTime = this._isTimeScaleIndependent ? es.Time.unscaledDeltaTime : es.Time.deltaTime;
            deltaTime *= this._timeScale;
            // 如果Tween是运行在反向模式下，则需要将deltaTime取反
            if (this._isRunningInReverse)
                deltaTime = -deltaTime;
            return deltaTime;
        }
        // 更新_elapsedTime
        updateElapsedTime(deltaTime) {
            this._elapsedTime += deltaTime;
            // 如果Tween处于反向模式下，则需要将_elapsedTime限制在0和_duration之间
            if (this._isRunningInReverse) {
                this._elapsedTime = Math.max(0, this._elapsedTime);
                this._elapsedTime = Math.min(this._elapsedTime, this._duration);
            }
            // 如果Tween处于正向模式下，则需要将_elapsedTime限制在0和_duration之间
            else {
                this._elapsedTime = Math.min(this._elapsedTime, this._duration);
            }
        }
        // 处理Tween完成事件并启动下一个Tween（如果有的话）
        handleCompletion() {
            this._completionHandler && this._completionHandler(this);
            // 如果有下一个Tween，则启动它
            if (this._nextTween != null) {
                this._nextTween.start();
                this._nextTween = null;
            }
        }
        recycleSelf() {
            if (this._shouldRecycleTween) {
                this._target = null;
                this._nextTween = null;
            }
        }
        isRunning() {
            return this._tweenState == TweenState.running;
        }
        start() {
            if (!this._isFromValueOverridden)
                this._fromValue = this._target.getTweenedValue();
            if (this._tweenState == TweenState.complete) {
                this._tweenState = TweenState.running;
                es.TweenManager.addTween(this);
            }
        }
        pause() {
            this._tweenState = TweenState.paused;
        }
        resume() {
            this._tweenState = TweenState.running;
        }
        stop(bringToCompletion = false) {
            this._tweenState = TweenState.complete;
            if (bringToCompletion) {
                // 如果我们逆向运行，我们在0处结束，否则我们进入持续时间
                this._elapsedTime = this._isRunningInReverse ? 0 : this._duration;
                this._loopType = LoopType.none;
                this._loops = 0;
                // TweenManager将在下一个tick上进行删除处理
            }
            else {
                es.TweenManager.removeTween(this);
            }
        }
        jumpToElapsedTime(elapsedTime) {
            this._elapsedTime = es.MathHelper.clamp(elapsedTime, 0, this._duration);
            this.updateValue();
        }
        /**
         * 反转当前的tween，如果是向前走，就会向后走，反之亦然
         */
        reverseTween() {
            this._isRunningInReverse = !this._isRunningInReverse;
        }
        /**
         * 当通过StartCoroutine调用时，这将一直持续到tween完成
         */
        *waitForCompletion() {
            while (this._tweenState != TweenState.complete)
                yield null;
        }
        getTargetObject() {
            return this._target.getTargetObject();
        }
        resetState() {
            this.context = null;
            this._completionHandler = this._loopCompleteHandler = null;
            this._isFromValueOverridden = false;
            this._isTimeScaleIndependent = false;
            this._tweenState = TweenState.complete;
            // TODO: 我认为在没有得到用户同意的情况下，我们绝对不应该从_shouldRecycleTween=false。需要研究和思考
            // this._shouldRecycleTween = true;
            this._isRelative = false;
            this._easeType = es.TweenManager.defaultEaseType;
            if (this._nextTween != null) {
                this._nextTween.recycleSelf();
                this._nextTween = null;
            }
            this._delay = 0;
            this._duration = 0;
            this._timeScale = 1;
            this._elapsedTime = 0;
            this._loopType = LoopType.none;
            this._delayBetweenLoops = 0;
            this._loops = 0;
            this._isRunningInReverse = false;
        }
        /**
         * 将所有状态重置为默认值，并根据传入的参数设置初始状态。
         * 这个方法作为一个切入点，这样Tween子类就可以调用它，这样tweens就可以被回收。
         * 当回收时，构造函数不会再被调用，所以这个方法封装了构造函数要做的事情
         * @param target
         * @param to
         * @param duration
         */
        initialize(target, to, duration) {
            // 重置状态，以防我们被回收
            this.resetState();
            this._target = target;
            this._toValue = to;
            this._duration = duration;
        }
        /**
         * 处理循环逻辑
         * @param elapsedTimeExcess
         */
        handleLooping(elapsedTimeExcess) {
            this._loops--;
            if (this._loopType == LoopType.pingpong) {
                this.reverseTween();
            }
            if (this._loopType == LoopType.restartFromBeginning || this._loops % 2 == 0) {
                this._loopCompleteHandler && this._completionHandler(this);
            }
            // 如果我们还有循环要处理，就把我们的状态重置为Running，这样我们就可以继续处理它们了
            if (this._loops != 0) {
                this._tweenState = TweenState.running;
                // 现在，我们需要设置我们的经过时间，并考虑到我们的elapsedTimeExcess
                if (this._loopType == LoopType.restartFromBeginning) {
                    this._elapsedTime = elapsedTimeExcess - this._delayBetweenLoops;
                }
                else {
                    if (this._isRunningInReverse)
                        this._elapsedTime += this._delayBetweenLoops - elapsedTimeExcess;
                    else
                        this._elapsedTime = elapsedTimeExcess - this._delayBetweenLoops;
                }
                // 如果我们有一个elapsedTimeExcess，并且没有delayBetweenLoops，则更新该值
                if (this._delayBetweenLoops == 0 && elapsedTimeExcess > 0) {
                    this.updateValue();
                }
            }
        }
    }
    es.Tween = Tween;
})(es || (es = {}));
///<reference path="./Tween.ts"/>
var es;
///<reference path="./Tween.ts"/>
(function (es) {
    class NumberTween extends es.Tween {
        static create() {
            return es.TweenManager.cacheNumberTweens ? es.Pool.obtain(NumberTween) : new NumberTween();
        }
        constructor(target, to, duration) {
            super();
            this.initialize(target, to, duration);
        }
        setIsRelative() {
            this._isRelative = true;
            this._toValue += this._fromValue;
            return this;
        }
        updateValue() {
            this._target.setTweenedValue(es.Lerps.ease(this._easeType, this._fromValue, this._toValue, this._elapsedTime, this._duration));
        }
        recycleSelf() {
            super.recycleSelf();
            if (this._shouldRecycleTween && es.TweenManager.cacheNumberTweens)
                es.Pool.free(NumberTween, this);
        }
    }
    es.NumberTween = NumberTween;
    class Vector2Tween extends es.Tween {
        static create() {
            return es.TweenManager.cacheVector2Tweens ? es.Pool.obtain(Vector2Tween) : new Vector2Tween();
        }
        constructor(target, to, duration) {
            super();
            this.initialize(target, to, duration);
        }
        setIsRelative() {
            this._isRelative = true;
            this._toValue.add(this._fromValue);
            return this;
        }
        updateValue() {
            this._target.setTweenedValue(es.Lerps.ease(this._easeType, this._fromValue, this._toValue, this._elapsedTime, this._duration));
        }
        recycleSelf() {
            super.recycleSelf();
            if (this._shouldRecycleTween && es.TweenManager.cacheVector2Tweens)
                es.Pool.free(Vector2Tween, this);
        }
    }
    es.Vector2Tween = Vector2Tween;
    class RectangleTween extends es.Tween {
        static create() {
            return es.TweenManager.cacheRectTweens ? es.Pool.obtain(RectangleTween) : new RectangleTween();
        }
        constructor(target, to, duration) {
            super();
            this.initialize(target, to, duration);
        }
        setIsRelative() {
            this._isRelative = true;
            this._toValue = new es.Rectangle(this._toValue.x + this._fromValue.x, this._toValue.y + this._fromValue.y, this._toValue.width + this._fromValue.width, this._toValue.height + this._fromValue.height);
            return this;
        }
        updateValue() {
            this._target.setTweenedValue(es.Lerps.ease(this._easeType, this._fromValue, this._toValue, this._elapsedTime, this._duration));
        }
        recycleSelf() {
            super.recycleSelf();
            if (this._shouldRecycleTween && es.TweenManager.cacheRectTweens)
                es.Pool.free(RectangleTween, this);
        }
    }
    es.RectangleTween = RectangleTween;
})(es || (es = {}));
///<reference path="./Tweens.ts"/>
var es;
///<reference path="./Tweens.ts"/>
(function (es) {
    /**
     * 对任何与Transform相关的属性tweens都是有用的枚举
     */
    let TransformTargetType;
    (function (TransformTargetType) {
        TransformTargetType[TransformTargetType["position"] = 0] = "position";
        TransformTargetType[TransformTargetType["localPosition"] = 1] = "localPosition";
        TransformTargetType[TransformTargetType["scale"] = 2] = "scale";
        TransformTargetType[TransformTargetType["localScale"] = 3] = "localScale";
        TransformTargetType[TransformTargetType["rotationDegrees"] = 4] = "rotationDegrees";
        TransformTargetType[TransformTargetType["localRotationDegrees"] = 5] = "localRotationDegrees";
    })(TransformTargetType = es.TransformTargetType || (es.TransformTargetType = {}));
    /**
     * 这是一个特殊的情况，因为Transform是迄今为止最被ween的对象。
     * 我们将Tween和ITweenTarget封装在一个单一的、可缓存的类中
     */
    class TransformVector2Tween extends es.Vector2Tween {
        setTweenedValue(value) {
            switch (this._targetType) {
                case TransformTargetType.position:
                    this._transform.position = value;
                    break;
                case TransformTargetType.localPosition:
                    this._transform.localPosition = value;
                    break;
                case TransformTargetType.scale:
                    this._transform.scale = value;
                    break;
                case TransformTargetType.localScale:
                    this._transform.localScale = value;
                    break;
                case TransformTargetType.rotationDegrees:
                    this._transform.rotationDegrees = value.x;
                case TransformTargetType.localRotationDegrees:
                    this._transform.localRotationDegrees = value.x;
                    break;
            }
        }
        getTweenedValue() {
            switch (this._targetType) {
                case TransformTargetType.position:
                    return this._transform.position;
                case TransformTargetType.localPosition:
                    return this._transform.localPosition;
                case TransformTargetType.scale:
                    return this._transform.scale;
                case TransformTargetType.localScale:
                    return this._transform.localScale;
                case TransformTargetType.rotationDegrees:
                    return new es.Vector2(this._transform.rotationDegrees, this._transform.rotationDegrees);
                case TransformTargetType.localRotationDegrees:
                    return new es.Vector2(this._transform.localRotationDegrees, 0);
            }
        }
        getTargetObject() {
            return this._transform;
        }
        setTargetAndType(transform, targetType) {
            this._transform = transform;
            this._targetType = targetType;
        }
        updateValue() {
            // 非相对角勒普的特殊情况，使他们采取尽可能短的旋转
            if ((this._targetType == TransformTargetType.rotationDegrees ||
                this._targetType == TransformTargetType.localRotationDegrees) && !this._isRelative) {
                this.setTweenedValue(es.Lerps.easeAngle(this._easeType, this._fromValue, this._toValue, this._elapsedTime, this._duration));
            }
            else {
                this.setTweenedValue(es.Lerps.ease(this._easeType, this._fromValue, this._toValue, this._elapsedTime, this._duration));
            }
        }
        recycleSelf() {
            if (this._shouldRecycleTween) {
                this._target = null;
                this._nextTween = null;
                this._transform = null;
                es.Pool.free(es.Vector2Tween, this);
            }
        }
    }
    es.TransformVector2Tween = TransformVector2Tween;
})(es || (es = {}));
var es;
(function (es) {
    let EaseType;
    (function (EaseType) {
        EaseType[EaseType["linear"] = 0] = "linear";
        EaseType[EaseType["sineIn"] = 1] = "sineIn";
        EaseType[EaseType["sineOut"] = 2] = "sineOut";
        EaseType[EaseType["sineInOut"] = 3] = "sineInOut";
        EaseType[EaseType["quadIn"] = 4] = "quadIn";
        EaseType[EaseType["quadOut"] = 5] = "quadOut";
        EaseType[EaseType["quadInOut"] = 6] = "quadInOut";
        EaseType[EaseType["quintIn"] = 7] = "quintIn";
        EaseType[EaseType["quintOut"] = 8] = "quintOut";
        EaseType[EaseType["quintInOut"] = 9] = "quintInOut";
        EaseType[EaseType["cubicIn"] = 10] = "cubicIn";
        EaseType[EaseType["cubicOut"] = 11] = "cubicOut";
        EaseType[EaseType["cubicInOut"] = 12] = "cubicInOut";
        EaseType[EaseType["quartIn"] = 13] = "quartIn";
        EaseType[EaseType["quartOut"] = 14] = "quartOut";
        EaseType[EaseType["quartInOut"] = 15] = "quartInOut";
        EaseType[EaseType["expoIn"] = 16] = "expoIn";
        EaseType[EaseType["expoOut"] = 17] = "expoOut";
        EaseType[EaseType["expoInOut"] = 18] = "expoInOut";
        EaseType[EaseType["circleIn"] = 19] = "circleIn";
        EaseType[EaseType["circleOut"] = 20] = "circleOut";
        EaseType[EaseType["circleInOut"] = 21] = "circleInOut";
        EaseType[EaseType["elasticIn"] = 22] = "elasticIn";
        EaseType[EaseType["elasticOut"] = 23] = "elasticOut";
        EaseType[EaseType["elasticInOut"] = 24] = "elasticInOut";
        EaseType[EaseType["punch"] = 25] = "punch";
        EaseType[EaseType["backIn"] = 26] = "backIn";
        EaseType[EaseType["backOut"] = 27] = "backOut";
        EaseType[EaseType["backInOut"] = 28] = "backInOut";
        EaseType[EaseType["bounceIn"] = 29] = "bounceIn";
        EaseType[EaseType["bounceOut"] = 30] = "bounceOut";
        EaseType[EaseType["bounceInOut"] = 31] = "bounceInOut";
    })(EaseType = es.EaseType || (es.EaseType = {}));
    /**
     * 助手的一个方法，它接收一个EaseType，并通过给定的持续时间和时间参数来应用该Ease方程。
     * 我们这样做是为了避免传来传去的Funcs为垃圾收集器制造大量垃圾
     */
    class EaseHelper {
        /**
         * 返回相反的缓动类型
         * @param easeType 缓动类型
         * @returns 返回相反的缓动类型
         */
        static oppositeEaseType(easeType) {
            switch (easeType) {
                case EaseType.linear:
                    return easeType;
                case EaseType.backIn:
                    return EaseType.backOut;
                case EaseType.backOut:
                    return EaseType.backIn;
                case EaseType.backInOut:
                    return easeType;
                case EaseType.bounceIn:
                    return EaseType.bounceOut;
                case EaseType.bounceOut:
                    return EaseType.bounceIn;
                case EaseType.bounceInOut:
                    return easeType;
                case EaseType.circleIn:
                    return EaseType.circleOut;
                case EaseType.circleOut:
                    return EaseType.circleIn;
                case EaseType.circleInOut:
                    return easeType;
                case EaseType.cubicIn:
                    return EaseType.cubicOut;
                case EaseType.cubicOut:
                    return EaseType.cubicIn;
                case EaseType.circleInOut:
                    return easeType;
                case EaseType.punch:
                    return easeType;
                case EaseType.expoIn:
                    return EaseType.expoOut;
                case EaseType.expoOut:
                    return EaseType.expoIn;
                case EaseType.expoInOut:
                    return easeType;
                case EaseType.quadIn:
                    return EaseType.quadOut;
                case EaseType.quadOut:
                    return EaseType.quadIn;
                case EaseType.quadInOut:
                    return easeType;
                case EaseType.quartIn:
                    return EaseType.quadOut;
                case EaseType.quartOut:
                    return EaseType.quartIn;
                case EaseType.quadInOut:
                    return easeType;
                case EaseType.sineIn:
                    return EaseType.sineOut;
                case EaseType.sineOut:
                    return EaseType.sineIn;
                case EaseType.sineInOut:
                    return easeType;
                default:
                    return easeType;
            }
        }
        static ease(easeType, t, duration) {
            switch (easeType) {
                case EaseType.linear:
                    return es.Easing.Linear.easeNone(t, duration);
                case EaseType.backIn:
                    return es.Easing.Back.easeIn(t, duration);
                case EaseType.backOut:
                    return es.Easing.Back.easeOut(t, duration);
                case EaseType.backInOut:
                    return es.Easing.Back.easeInOut(t, duration);
                case EaseType.bounceIn:
                    return es.Easing.Bounce.easeIn(t, duration);
                case EaseType.bounceOut:
                    return es.Easing.Bounce.easeOut(t, duration);
                case EaseType.bounceInOut:
                    return es.Easing.Bounce.easeInOut(t, duration);
                case EaseType.circleIn:
                    return es.Easing.Circular.easeIn(t, duration);
                case EaseType.circleOut:
                    return es.Easing.Circular.easeOut(t, duration);
                case EaseType.circleInOut:
                    return es.Easing.Circular.easeInOut(t, duration);
                case EaseType.cubicIn:
                    return es.Easing.Cubic.easeIn(t, duration);
                case EaseType.cubicOut:
                    return es.Easing.Cubic.easeOut(t, duration);
                case EaseType.cubicInOut:
                    return es.Easing.Cubic.easeInOut(t, duration);
                case EaseType.elasticIn:
                    return es.Easing.Elastic.easeIn(t, duration);
                case EaseType.elasticOut:
                    return es.Easing.Elastic.easeOut(t, duration);
                case EaseType.elasticInOut:
                    return es.Easing.Elastic.easeInOut(t, duration);
                case EaseType.punch:
                    return es.Easing.Elastic.punch(t, duration);
                case EaseType.expoIn:
                    return es.Easing.Exponential.easeIn(t, duration);
                case EaseType.expoOut:
                    return es.Easing.Exponential.easeOut(t, duration);
                case EaseType.expoInOut:
                    return es.Easing.Exponential.easeInOut(t, duration);
                case EaseType.quadIn:
                    return es.Easing.Quadratic.easeIn(t, duration);
                case EaseType.quadOut:
                    return es.Easing.Quadratic.easeOut(t, duration);
                case EaseType.quadInOut:
                    return es.Easing.Quadratic.easeInOut(t, duration);
                case EaseType.quintIn:
                    return es.Easing.Quintic.easeIn(t, duration);
                case EaseType.quintOut:
                    return es.Easing.Quintic.easeOut(t, duration);
                case EaseType.quintInOut:
                    return es.Easing.Quintic.easeInOut(t, duration);
                case EaseType.sineIn:
                    return es.Easing.Sinusoidal.easeIn(t, duration);
                case EaseType.sineOut:
                    return es.Easing.Sinusoidal.easeOut(t, duration);
                case EaseType.sineInOut:
                    return es.Easing.Sinusoidal.easeInOut(t, duration);
                default:
                    return es.Easing.Linear.easeNone(t, duration);
            }
        }
    }
    es.EaseHelper = EaseHelper;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 全局管理器的基类。所有全局管理器都应该从此类继承。
     */
    class GlobalManager {
        /**
         * 获取或设置管理器是否启用
         */
        get enabled() {
            return this._enabled;
        }
        set enabled(value) {
            this.setEnabled(value);
        }
        /**
         * 设置管理器是否启用
         * @param isEnabled 如果为true，则启用管理器；否则禁用管理器
         */
        setEnabled(isEnabled) {
            if (this._enabled != isEnabled) {
                this._enabled = isEnabled;
                if (this._enabled) {
                    // 如果启用了管理器，则调用onEnabled方法
                    this.onEnabled();
                }
                else {
                    // 如果禁用了管理器，则调用onDisabled方法
                    this.onDisabled();
                }
            }
        }
        /**
         * 在启用管理器时调用的回调方法
         */
        onEnabled() {
        }
        /**
         * 在禁用管理器时调用的回调方法
         */
        onDisabled() {
        }
        /**
         * 更新管理器状态的方法
         */
        update() {
        }
    }
    es.GlobalManager = GlobalManager;
})(es || (es = {}));
///<reference path="./Easing/EaseType.ts" />
///<reference path="../Utils/GlobalManager.ts"/>
var es;
///<reference path="./Easing/EaseType.ts" />
///<reference path="../Utils/GlobalManager.ts"/>
(function (es) {
    class TweenManager extends es.GlobalManager {
        static get activeTweens() {
            return this._instance._activeTweens;
        }
        constructor() {
            super();
            /**
             * 当前所有活跃用户的内部列表
             */
            this._activeTweens = [];
            // 临时存储已完成的tweens
            this._tempTweens = [];
            TweenManager._instance = this;
        }
        update() {
            this._isUpdating = true;
            // 反向循环，这样我们就可以把完成的tweens删除了
            for (let i = this._activeTweens.length - 1; i >= 0; --i) {
                let tween = this._activeTweens[i];
                if (tween.tick()) {
                    // 如果tween还没有完成，将其加入临时列表中
                    this._tempTweens.push(tween);
                }
            }
            this._isUpdating = false;
            // 从临时列表中删除所有已完成的tweens
            for (let i = 0; i < this._tempTweens.length; i++) {
                this._tempTweens[i].recycleSelf();
                new es.List(this._activeTweens).remove(this._tempTweens[i]);
            }
            // 清空临时列表
            this._tempTweens.length = 0;
        }
        /**
         * 将一个tween添加到活动tweens列表中
         * @param tween
         */
        static addTween(tween) {
            TweenManager._instance._activeTweens.push(tween);
        }
        /**
         * 从当前的tweens列表中删除一个tween
         * @param tween
         */
        static removeTween(tween) {
            if (TweenManager._instance._isUpdating) {
                TweenManager._instance._tempTweens.push(tween);
            }
            else {
                tween.recycleSelf();
                new es.List(TweenManager._instance._activeTweens).remove(tween);
            }
        }
        /**
         * 停止所有的tween并选择地把他们全部完成
         * @param bringToCompletion
         */
        static stopAllTweens(bringToCompletion = false) {
            for (let i = TweenManager._instance._activeTweens.length - 1; i >= 0; --i)
                TweenManager._instance._activeTweens[i].stop(bringToCompletion);
        }
        /**
         * 返回具有特定上下文的所有tweens。
         * Tweens以ITweenable的形式返回，因为这就是TweenManager所知道的所有内容
         * @param context
         */
        static allTweensWithContext(context) {
            let foundTweens = [];
            for (let i = 0; i < TweenManager._instance._activeTweens.length; i++) {
                if (TweenManager._instance._activeTweens[i].context == context)
                    foundTweens.push(TweenManager._instance._activeTweens[i]);
            }
            return foundTweens;
        }
        /**
         * 停止所有给定上下文的tweens
         * @param context
         * @param bringToCompletion
         */
        static stopAllTweensWithContext(context, bringToCompletion = false) {
            for (let i = TweenManager._instance._activeTweens.length - 1; i >= 0; --i) {
                if (TweenManager._instance._activeTweens[i].context == context)
                    TweenManager._instance._activeTweens[i].stop(bringToCompletion);
            }
        }
        /**
         * 返回具有特定目标的所有tweens。
         * Tweens以ITweenControl的形式返回，因为TweenManager只知道这些
         * @param target
         */
        static allTweenWithTarget(target) {
            let foundTweens = [];
            for (let i = 0; i < TweenManager._instance._activeTweens.length; i++) {
                if (TweenManager._instance._activeTweens[i]) {
                    let tweenControl = TweenManager._instance._activeTweens[i];
                    if (tweenControl.getTargetObject() == target)
                        foundTweens.push(TweenManager._instance._activeTweens[i]);
                }
            }
            return foundTweens;
        }
        /**
         * 返回以特定实体为目标的所有tween
         * Tween返回为ITweenControl
         * @param target
         */
        static allTweensWithTargetEntity(target) {
            let foundTweens = [];
            for (let i = 0; i < this._instance._activeTweens.length; i++) {
                if (this._instance._activeTweens[i].discriminator == "ITweenControl") {
                    let tweenControl = this._instance._activeTweens[i];
                    let obj = tweenControl.getTargetObject();
                    if (obj instanceof es.Entity && obj == target ||
                        obj instanceof es.Component && obj.entity == target ||
                        obj instanceof es.Transform && obj.entity == target) {
                        foundTweens.push(this._instance._activeTweens[i]);
                    }
                }
            }
            return foundTweens;
        }
        /**
         * 停止所有具有TweenManager知道的特定目标的tweens
         * @param target
         * @param bringToCompletion
         */
        static stopAllTweensWithTarget(target, bringToCompletion = false) {
            for (let i = TweenManager._instance._activeTweens.length - 1; i >= 0; --i) {
                if (TweenManager._instance._activeTweens[i]) {
                    let tweenControl = TweenManager._instance._activeTweens[i];
                    if (tweenControl.getTargetObject() == target)
                        tweenControl.stop(bringToCompletion);
                }
            }
        }
    }
    TweenManager.defaultEaseType = es.EaseType.quartIn;
    /**
     * 如果为真，当加载新关卡时，活动的tween列表将被清除
     */
    TweenManager.removeAllTweensOnLevelLoad = false;
    /**
     * 这里支持各种类型的自动缓存。请
     * 注意，只有在使用扩展方法启动tweens时，或者在做自定义tweens时从缓存中获取tween时，缓存才会起作用。
     * 关于如何获取缓存的tween，请参见扩展方法的实现
     */
    TweenManager.cacheNumberTweens = true;
    TweenManager.cacheVector2Tweens = true;
    TweenManager.cacheColorTweens = true;
    TweenManager.cacheRectTweens = false;
    es.TweenManager = TweenManager;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 标准缓和方程通过将b和c参数（起始值和变化值）用0和1替换，然后进行简化。
     * 这样做的目的是为了让我们可以得到一个0 - 1之间的原始值（除了弹性/反弹故意超过界限），然后用这个值来lerp任何东西
     */
    let Easing;
    (function (Easing) {
        class Linear {
            /**
             * 线性缓动，等同于t / d
             * @param t 当前时间
             * @param d 持续时间
             */
            static easeNone(t, d) {
                return t / d;
            }
        }
        Easing.Linear = Linear;
        class Quadratic {
            /**
             * 平方缓动进入，加速运动
             * @param t 当前时间
             * @param d 持续时间
             */
            static easeIn(t, d) {
                return (t /= d) * t;
            }
            /**
             * 平方缓动退出，减速运动
             * @param t 当前时间
             * @param d 持续时间
             */
            static easeOut(t, d) {
                return -1 * (t /= d) * (t - 2);
            }
            /**
             * 平方缓动进出，加速减速运动
             * @param t 当前时间
             * @param d 持续时间
             */
            static easeInOut(t, d) {
                if ((t /= d / 2) < 1)
                    return 0.5 * t * t;
                return -0.5 * ((--t) * (t - 2) - 1);
            }
        }
        Easing.Quadratic = Quadratic;
        class Back {
            /**
             * Back.easeIn(t, d) 函数将会返回 Back 缓动进入算法的结果
             *
             * @param t 当前时间，从0开始递增
             * @param d 持续时间
             * @param s 回弹的距离，默认值为 1.70158，可以省略该参数
             * @return 缓动后的值
             */
            static easeIn(t, d, s = 1.70158) {
                // 根据公式计算缓动结果
                return (t /= d) * t * ((s + 1) * t - s);
            }
            /**
             * Back.easeOut(t, d) 函数将会返回 Back 缓动退出算法的结果
             *
             * @param t 当前时间，从0开始递增
             * @param d 持续时间
             * @param s 回弹的距离，默认值为 1.70158，可以省略该参数
             * @return 缓动后的值
             */
            static easeOut(t, d, s = 1.70158) {
                // 根据公式计算缓动结果
                return ((t = t / d - 1) * t * ((s + 1) * t + s) + 1);
            }
            /**
             * Back.easeInOut(t, d) 函数将会返回 Back 缓动进入/退出算法的结果
             *
             * @param t 当前时间，从0开始递增
             * @param d 持续时间
             * @param s 回弹的距离，默认值为 1.70158，可以省略该参数
             * @return 缓动后的值
             */
            static easeInOut(t, d, s = 1.70158) {
                // 根据公式计算缓动结果
                if ((t /= d / 2) < 1) {
                    s *= (1.525);
                    return 0.5 * (t * t * (((s + 1) * t) - s));
                }
                s *= (1.525);
                return 0.5 * ((t -= 2) * t * (((s + 1) * t) + s) + 2);
            }
        }
        Easing.Back = Back;
        class Bounce {
            /**
             * 从0到目标值的反弹动画
             * @param t 当前时间
             * @param d 持续时间
             * @returns 反弹动画进度
             */
            static easeOut(t, d) {
                if ((t /= d) < (1 / 2.75)) {
                    return (7.5625 * t * t);
                }
                else if (t < (2 / 2.75)) {
                    return (7.5625 * (t -= (1.5 / 2.75)) * t + 0.75);
                }
                else if (t < (2.5 / 2.75)) {
                    return (7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375);
                }
                else {
                    return (7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375);
                }
            }
            /**
             * 从目标值到0的反弹动画
             * @param t 当前时间
             * @param d 持续时间
             * @returns 反弹动画进度
             */
            static easeIn(t, d) {
                return 1 - this.easeOut(d - t, d);
            }
            /**
             * 从0到目标值再到0的反弹动画
             * @param t 当前时间
             * @param d 持续时间
             * @returns 反弹动画进度
             */
            static easeInOut(t, d) {
                if (t < d / 2)
                    return this.easeIn(t * 2, d) * 0.5;
                else
                    return this.easeOut(t * 2 - d, d) * 0.5 + 1 * 0.5;
            }
        }
        Easing.Bounce = Bounce;
        class Circular {
            /**
             * 缓动函数入口，表示从 0 到最大值的缓动（开始慢加速，后面变快）
             * @param t 当前时间
             * @param d 缓动总时间
             */
            static easeIn(t, d) {
                return -(Math.sqrt(1 - (t /= d) * t) - 1);
            }
            /**
             * 缓动函数出口，表示从最大值到 0 的缓动（开始快减速，后面变慢）
             * @param t 当前时间
             * @param d 缓动总时间
             */
            static easeOut(t, d) {
                return Math.sqrt(1 - (t = t / d - 1) * t);
            }
            /**
             * 缓动函数入口和出口，表示从 0 到最大值再到 0 的缓动（先慢加速，后面快减速）
             * @param t 当前时间
             * @param d 缓动总时间
             */
            static easeInOut(t, d) {
                if ((t /= d / 2) < 1)
                    return -0.5 * (Math.sqrt(1 - t * t) - 1);
                return 0.5 * (Math.sqrt(1 - (t -= 2) * t) + 1);
            }
        }
        Easing.Circular = Circular;
        class Cubic {
            /**
             * easeIn方法提供了一个以慢速开始，然后逐渐加速的缓动函数。
             * @param t 当前时间，动画已经持续的时间，范围在0到d之间，其中d是动画的总时间。
             * @param d 动画的总时间，即动画将从开始到结束的持续时间。
             * @returns 根据动画的当前时间计算出的位置值，该位置值在0到1之间。
             */
            static easeIn(t, d) {
                return (t /= d) * t * t;
            }
            /**
             * easeOut方法提供了一个以快速开始，然后逐渐减速的缓动函数。
             * @param t 当前时间，动画已经持续的时间，范围在0到d之间，其中d是动画的总时间。
             * @param d 动画的总时间，即动画将从开始到结束的持续时间。
             * @returns 根据动画的当前时间计算出的位置值，该位置值在0到1之间。
             */
            static easeOut(t, d) {
                return ((t = t / d - 1) * t * t + 1);
            }
            /**
             * easeInOut方法提供了一个慢速开始，然后加速，然后减速的缓动函数。
             * @param t 当前时间，动画已经持续的时间，范围在0到d之间，其中d是动画的总时间。
             * @param d 动画的总时间，即动画将从开始到结束的持续时间。
             * @returns 根据动画的当前时间计算出的位置值，该位置值在0到1之间。
             */
            static easeInOut(t, d) {
                if ((t /= d / 2) < 1)
                    return 0.5 * t * t * t;
                return 0.5 * ((t -= 2) * t * t + 2);
            }
        }
        Easing.Cubic = Cubic;
        class Elastic {
            /**
             * 弹性函数的 easeIn 版本
             * @param t - 已经经过的时间
             * @param d - 动画的总时间
             * @returns 经过缓动函数计算后的值
             */
            static easeIn(t, d) {
                if (t === 0)
                    return 0;
                if ((t /= d) === 1)
                    return 1;
                const p = d * 0.3;
                const s = p / 4;
                return -1 * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p);
            }
            /**
             * 弹性函数的 easeOut 版本
             * @param t - 已经经过的时间
             * @param d - 动画的总时间
             * @returns 经过缓动函数计算后的值
             */
            static easeOut(t, d) {
                if (t === 0)
                    return 0;
                if ((t /= d) === 1)
                    return 1;
                const p = d * 0.3;
                const s = p / 4;
                return 1 * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + 1;
            }
            /**
             * 弹性函数的 easeInOut 版本
             * @param t - 已经经过的时间
             * @param d - 动画的总时间
             * @returns 经过缓动函数计算后的值
             */
            static easeInOut(t, d) {
                if (t === 0)
                    return 0;
                if ((t /= d / 2) === 2)
                    return 1;
                const p = d * (0.3 * 1.5);
                const s = p / 4;
                if (t < 1) {
                    return (-0.5 *
                        Math.pow(2, 10 * (t -= 1)) *
                        Math.sin((t * d - s) * (2 * Math.PI) / p));
                }
                return (Math.pow(2, -10 * (t -= 1)) *
                    Math.sin((t * d - s) * (2 * Math.PI) / p) *
                    0.5 +
                    1);
            }
            /**
             * 弹性函数的 punch 版本
             * @param t - 已经经过的时间
             * @param d - 动画的总时间
             * @returns 经过缓动函数计算后的值
             */
            static punch(t, d) {
                if (t === 0)
                    return 0;
                if ((t /= d) === 1)
                    return 0;
                const p = 0.3;
                return Math.pow(2, -10 * t) * Math.sin(t * (2 * Math.PI) / p);
            }
        }
        Easing.Elastic = Elastic;
        class Exponential {
            /**
             * Exponential 缓动函数 - easeIn
             * @param t 当前时间
             * @param d 持续时间
             * @returns 缓动值
             */
            static easeIn(t, d) {
                return (t == 0) ? 0 : Math.pow(2, 10 * (t / d - 1));
            }
            /**
             * Exponential 缓动函数 - easeOut
             * @param t 当前时间
             * @param d 持续时间
             * @returns 缓动值
             */
            static easeOut(t, d) {
                return t == d ? 1 : (-Math.pow(2, -10 * t / d) + 1);
            }
            /**
             * Exponential 缓动函数 - easeInOut
             * @param t 当前时间
             * @param d 持续时间
             * @returns 缓动值
             */
            static easeInOut(t, d) {
                if (t == 0)
                    return 0;
                if (t == d)
                    return 1;
                if ((t /= d / 2) < 1) {
                    return 0.5 * Math.pow(2, 10 * (t - 1));
                }
                return 0.5 * (-Math.pow(2, -10 * --t) + 2);
            }
        }
        Easing.Exponential = Exponential;
        class Quartic {
            /**
             * Quartic 缓动函数的 easeIn 版本
             * @param t 当前时间
             * @param d 持续时间
             * @returns 根据当前时间计算出的值
             */
            static easeIn(t, d) {
                t /= d;
                return t * t * t * t;
            }
            /**
             * Quartic 缓动函数的 easeOut 版本
             * @param t 当前时间
             * @param d 持续时间
             * @returns 根据当前时间计算出的值
             */
            static easeOut(t, d) {
                t = t / d - 1;
                return -1 * (t * t * t * t - 1);
            }
            /**
             * Quartic 缓动函数的 easeInOut 版本
             * @param t 当前时间
             * @param d 持续时间
             * @returns 根据当前时间计算出的值
             */
            static easeInOut(t, d) {
                t /= d / 2;
                if (t < 1)
                    return 0.5 * t * t * t * t;
                t -= 2;
                return -0.5 * (t * t * t * t - 2);
            }
        }
        Easing.Quartic = Quartic;
        /**
         * Quintic 类提供了三种 Quintic 缓动函数
         */
        class Quintic {
            /**
             * 缓动函数，具有 Quintic easeIn 效果
             * @param t 当前时间（单位：毫秒）
             * @param d 持续时间（单位：毫秒）
             * @returns 缓动值
             */
            static easeIn(t, d) {
                return (t /= d) * t * t * t * t;
            }
            /**
             * 缓动函数，具有 Quintic easeOut 效果
             * @param t 当前时间（单位：毫秒）
             * @param d 持续时间（单位：毫秒）
             * @returns 缓动值
             */
            static easeOut(t, d) {
                return ((t = t / d - 1) * t * t * t * t + 1);
            }
            /**
             * 缓动函数，具有 Quintic easeInOut 效果
             * @param t 当前时间（单位：毫秒）
             * @param d 持续时间（单位：毫秒）
             * @returns 缓动值
             */
            static easeInOut(t, d) {
                if ((t /= d / 2) < 1) {
                    return 0.5 * t * t * t * t * t;
                }
                else {
                    return 0.5 * ((t -= 2) * t * t * t * t + 2);
                }
            }
        }
        Easing.Quintic = Quintic;
        class Sinusoidal {
            /**
             * Sinusoidal 类的缓动入方法。
             * @param t 当前时间（单位：毫秒）
             * @param d 持续时间（单位：毫秒）
             * @returns 介于 0 和 1 之间的数字，表示当前时间的值
             */
            static easeIn(t, d) {
                // 通过 cos 函数计算出当前时间对应的值
                return -1 * Math.cos(t / d * (Math.PI / 2)) + 1;
            }
            /**
             * Sinusoidal 类的缓动出方法。
             * @param t 当前时间（单位：毫秒）
             * @param d 持续时间（单位：毫秒）
             * @returns 介于 0 和 1 之间的数字，表示当前时间的值
             */
            static easeOut(t, d) {
                // 通过 sin 函数计算出当前时间对应的值
                return Math.sin(t / d * (Math.PI / 2));
            }
            /**
             * Sinusoidal 类的缓动入出方法。
             * @param t 当前时间（单位：毫秒）
             * @param d 持续时间（单位：毫秒）
             * @returns 介于 0 和 1 之间的数字，表示当前时间的值
             */
            static easeInOut(t, d) {
                // 通过 cos 函数计算出当前时间对应的值
                return -0.5 * (Math.cos(Math.PI * t / d) - 1);
            }
        }
        Easing.Sinusoidal = Sinusoidal;
    })(Easing = es.Easing || (es.Easing = {}));
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 一系列静态方法来处理所有常见的tween类型结构，以及它们的unclamped lerps.unclamped lerps对于超过0-1范围的bounce、elastic或其他tweens是必需的
     */
    class Lerps {
        static lerp(from, to, t) {
            // 判断传入的数据类型，并执行对应的插值逻辑
            if (typeof (from) == "number" && typeof (to) == "number") {
                return from + (to - from) * t;
            }
            if (from instanceof es.Rectangle && to instanceof es.Rectangle) {
                return new es.Rectangle((from.x + (to.x - from.x) * t), (from.y + (to.x - from.y) * t), (from.width + (to.width - from.width) * t), (from.height + (to.height - from.height) * t));
            }
            if (from instanceof es.Vector2 && to instanceof es.Vector2) {
                return new es.Vector2(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t);
            }
        }
        /**
         * 计算两个向量之间的角度差并使用线性插值函数进行插值
         * @param from 起始向量
         * @param to 目标向量
         * @param t 插值因子
         * @returns 插值后的向量
         */
        static angleLerp(from, to, t) {
            // 计算最短的角差，确保角度在[-180, 180]度之间
            let toMinusFrom = new es.Vector2(es.MathHelper.deltaAngle(from.x, to.x), es.MathHelper.deltaAngle(from.y, to.y));
            // 使用线性插值函数计算插值后的向量
            return new es.Vector2(from.x + toMinusFrom.x * t, from.y + toMinusFrom.y * t);
        }
        static ease(easeType, from, to, t, duration) {
            // 如果传入的值都是 number 类型，就直接返回两个值之间的线性插值
            if (typeof (from) == 'number' && typeof (to) == "number") {
                return this.lerp(from, to, es.EaseHelper.ease(easeType, t, duration));
            }
            // 如果传入的值都是 Vector2 类型，就返回两个 Vector2 之间的插值
            if (from instanceof es.Vector2 && to instanceof es.Vector2) {
                return this.lerp(from, to, es.EaseHelper.ease(easeType, t, duration));
            }
            // 如果传入的值都是 Rectangle 类型，就返回两个 Rectangle 之间的插值
            if (from instanceof es.Rectangle && to instanceof es.Rectangle) {
                return this.lerp(from, to, es.EaseHelper.ease(easeType, t, duration));
            }
        }
        /**
         * 通过提供的t值和持续时间使用给定的缓动类型在两个Vector2之间进行角度插值。
         * @param easeType 缓动类型
         * @param from 开始的向量
         * @param to 结束的向量
         * @param t 当前时间在持续时间内的比例
         * @param duration 持续时间
         * @returns 插值后的Vector2值
         */
        static easeAngle(easeType, from, to, t, duration) {
            return this.angleLerp(from, to, es.EaseHelper.ease(easeType, t, duration));
        }
        /**
         * 使用快速弹簧算法来实现平滑过渡。返回经过弹簧计算后的当前值。
         * @param currentValue 当前值
         * @param targetValue 目标值
         * @param velocity 当前速度
         * @param dampingRatio 阻尼比例
         * @param angularFrequency 角频率
         */
        static fastSpring(currentValue, targetValue, velocity, dampingRatio, angularFrequency) {
            // 计算下一帧的速度
            velocity.add(velocity.scale(-2 * es.Time.deltaTime * dampingRatio * angularFrequency)
                .add(targetValue.sub(currentValue).scale(es.Time.deltaTime * angularFrequency * angularFrequency)));
            // 计算下一帧的当前值
            currentValue.add(velocity.scale(es.Time.deltaTime));
            // 返回计算后的当前值
            return currentValue;
        }
    }
    es.Lerps = Lerps;
})(es || (es = {}));
var es;
(function (es) {
    class AnimCurve {
        get points() {
            return this._points;
        }
        constructor(points) {
            if (points.length < 2) {
                throw new Error('curve length must be >= 2');
            }
            points.sort((a, b) => {
                return a.t - b.t;
            });
            if (points[0].t !== 0) {
                throw new Error('curve must start with 0');
            }
            if (points[points.length - 1].t !== 1) {
                throw new Error('curve must end with 1');
            }
            this._points = points;
        }
        lerp(t) {
            for (let i = 1; i < this._points.length; i++) {
                if (t <= this._points[i].t) {
                    const m = es.MathHelper.map01(t, this._points[i - 1].t, this._points[i].t);
                    return es.MathHelper.lerp(this._points[i - 1].value, this._points[i].value, m);
                }
            }
            throw new Error('should never be here');
        }
    }
    es.AnimCurve = AnimCurve;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 用于包装事件的一个小类
     */
    class FuncPack {
        constructor(func, context) {
            this.func = func;
            this.context = context;
        }
    }
    es.FuncPack = FuncPack;
    /**
     * 用于事件管理
     */
    class Emitter {
        constructor() {
            this._messageTable = new Map();
        }
        /**
         * 开始监听项
         * @param eventType 监听类型
         * @param handler 监听函数
         * @param context 监听上下文
         */
        addObserver(eventType, handler, context) {
            let list = this._messageTable.get(eventType);
            if (!list) {
                list = [];
                this._messageTable.set(eventType, list);
            }
            if (!this.hasObserver(eventType, handler)) {
                list.push(new FuncPack(handler, context));
            }
        }
        /**
         * 移除监听项
         * @param eventType 事件类型
         * @param handler 事件函数
         */
        removeObserver(eventType, handler) {
            let messageData = this._messageTable.get(eventType);
            if (messageData) {
                let index = messageData.findIndex(data => data.func == handler);
                if (index != -1)
                    messageData.splice(index, 1);
            }
        }
        /**
         * 触发该事件
         * @param eventType 事件类型
         * @param data 事件数据
         */
        emit(eventType, ...data) {
            let list = this._messageTable.get(eventType);
            if (list) {
                for (let observer of list) {
                    observer.func.call(observer.context, ...data);
                }
            }
        }
        /**
         * 判断是否存在该类型的观察者
         * @param eventType 事件类型
         * @param handler 事件函数
         */
        hasObserver(eventType, handler) {
            let list = this._messageTable.get(eventType);
            return list ? list.some(observer => observer.func === handler) : false;
        }
    }
    es.Emitter = Emitter;
})(es || (es = {}));
var es;
(function (es) {
    let Edge;
    (function (Edge) {
        Edge[Edge["top"] = 0] = "top";
        Edge[Edge["bottom"] = 1] = "bottom";
        Edge[Edge["left"] = 2] = "left";
        Edge[Edge["right"] = 3] = "right";
    })(Edge = es.Edge || (es.Edge = {}));
})(es || (es = {}));
var es;
(function (es) {
    class EqualityComparer {
        static default() {
            return new EqualityComparer();
        }
        constructor() { }
        equals(x, y) {
            if (typeof x["equals"] == 'function') {
                return x["equals"](y);
            }
            else {
                return x === y;
            }
        }
        getHashCode(o) {
            if (typeof o == 'number') {
                return this._getHashCodeForNumber(o);
            }
            if (typeof o == 'string') {
                return this._getHashCodeForString(o);
            }
            let hashCode = 385229220;
            this.forOwn(o, (value) => {
                if (typeof value == 'number') {
                    hashCode += this._getHashCodeForNumber(value);
                }
                else if (typeof value == 'string') {
                    hashCode += this._getHashCodeForString(value);
                }
                else if (typeof value == 'object') {
                    this.forOwn(value, () => {
                        hashCode += this.getHashCode(value);
                    });
                }
            });
            return hashCode;
        }
        _getHashCodeForNumber(n) {
            return n;
        }
        _getHashCodeForString(s) {
            let hashCode = 385229220;
            for (let i = 0; i < s.length; i++) {
                hashCode = (hashCode * -1521134295) ^ s.charCodeAt(i);
            }
            return hashCode;
        }
        forOwn(object, iteratee) {
            object = Object(object);
            Object.keys(object).forEach((key) => iteratee(object[key], key, object));
        }
    }
    es.EqualityComparer = EqualityComparer;
})(es || (es = {}));
var es;
(function (es) {
    class Hash {
        /**
         * 从一个字节数组中计算一个哈希值
         * @param data
         */
        static computeHash(...data) {
            const p = 16777619;
            let hash = 2166136261;
            for (let i = 0; i < data.length; i++)
                hash = (hash ^ data[i]) * p;
            hash += hash << 13;
            hash ^= hash >> 7;
            hash += hash << 3;
            hash ^= hash >> 17;
            hash += hash << 5;
            return hash;
        }
    }
    es.Hash = Hash;
})(es || (es = {}));
var es;
(function (es) {
    class Observable {
        constructor() {
            this._listeners = [];
        }
        addListener(caller, callback) {
            if (this._listeners.findIndex(listener => listener.callback === callback && listener.caller === caller) === -1) {
                this._listeners.push({ caller, callback });
            }
        }
        removeListener(caller, callback) {
            const index = this._listeners.findIndex(listener => listener.callback === callback && listener.caller === caller);
            if (index >= 0) {
                this._listeners.splice(index, 1);
            }
        }
        clearListener() {
            this._listeners = [];
        }
        clearListenerWithCaller(caller) {
            for (let i = this._listeners.length - 1; i >= 0; i--) {
                const listener = this._listeners[i];
                if (listener.caller === caller) {
                    this._listeners.splice(i, 1);
                }
            }
        }
        notify(...args) {
            for (let i = this._listeners.length - 1; i >= 0; i--) {
                const listener = this._listeners[i];
                if (listener.caller) {
                    listener.callback.call(listener.caller, ...args);
                }
                else {
                    listener.callback(...args);
                }
            }
        }
    }
    es.Observable = Observable;
    class ObservableT extends Observable {
        addListener(caller, callback) {
            super.addListener(caller, callback);
        }
        removeListener(caller, callback) {
            super.removeListener(caller, callback);
        }
        notify(arg) {
            super.notify(arg);
        }
    }
    es.ObservableT = ObservableT;
    class ObservableTT extends Observable {
        addListener(caller, callback) {
            super.addListener(caller, callback);
        }
        removeListener(caller, callback) {
            super.removeListener(caller, callback);
        }
        notify(arg1, arg2) {
            super.notify(arg1, arg2);
        }
    }
    es.ObservableTT = ObservableTT;
    class Command {
        constructor(caller, action) {
            this.bindAction(caller, action);
            this._onExec = new Observable();
        }
        bindAction(caller, action) {
            this._caller = caller;
            this._action = action;
        }
        dispatch(...args) {
            if (this._action) {
                if (this._caller) {
                    this._action.call(this._caller, ...args);
                }
                else {
                    this._action(...args);
                }
                this._onExec.notify();
            }
            else {
                console.warn('command not bind with an action');
            }
        }
        addListener(caller, callback) {
            this._onExec.addListener(caller, callback);
        }
        removeListener(caller, callback) {
            this._onExec.removeListener(caller, callback);
        }
        clearListener() {
            this._onExec.clearListener();
        }
        clearListenerWithCaller(caller) {
            this._onExec.clearListenerWithCaller(caller);
        }
    }
    es.Command = Command;
    class ValueChangeCommand {
        constructor(value) {
            this._onValueChange = new Observable();
            this._value = value;
        }
        get onValueChange() {
            return this._onValueChange;
        }
        get value() {
            return this._value;
        }
        set value(newValue) {
            this._value = newValue;
        }
        dispatch(value) {
            if (value !== this._value) {
                const oldValue = this._value;
                this._value = value;
                this._onValueChange.notify(this._value, oldValue);
            }
        }
        addListener(caller, callback) {
            this._onValueChange.addListener(caller, callback);
        }
        removeListener(caller, callback) {
            this._onValueChange.removeListener(caller, callback);
        }
        clearListener() {
            this._onValueChange.clearListener();
        }
        clearListenerWithCaller(caller) {
            this._onValueChange.clearListenerWithCaller(caller);
        }
    }
    es.ValueChangeCommand = ValueChangeCommand;
})(es || (es = {}));
var es;
(function (es) {
    class Out {
        constructor(value = null) {
            this.value = value;
        }
    }
    es.Out = Out;
})(es || (es = {}));
var es;
(function (es) {
    class Ref {
        constructor(value) {
            this.value = value;
        }
    }
    es.Ref = Ref;
})(es || (es = {}));
var es;
(function (es) {
    class Screen {
        static get size() {
            return new es.Vector2(this.width, this.height);
        }
        static get center() {
            return new es.Vector2(this.width / 2, this.height / 2);
        }
    }
    es.Screen = Screen;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 管理数值的简单助手类。它存储值，直到累计的总数大于1。一旦超过1，该值将在调用update时添加到amount中。
     */
    class SubpixelNumber {
        /**
         * 以amount递增余数，将值截断为int，存储新的余数并将amount设置为当前值。
         * @param amount
         */
        update(amount) {
            this.remainder += amount;
            let motion = Math.trunc(this.remainder);
            this.remainder -= motion;
            return motion;
        }
        /**
         * 将余数重置为0。当一个物体与一个不可移动的物体碰撞时有用。
         * 在这种情况下，您将希望将亚像素余数归零，因为它是空的和无效的碰撞。
         */
        reset() {
            this.remainder = 0;
        }
    }
    es.SubpixelNumber = SubpixelNumber;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 简单的剪耳三角测量器，最终的三角形将出现在triangleIndices列表中。
     */
    class Triangulator {
        constructor() {
            /**
             * 上次三角函数调用中使用的点列表的三角列表条目索引
             */
            this.triangleIndices = [];
            this._triPrev = new Array(12);
            this._triNext = new Array(12);
        }
        static testPointTriangle(point, a, b, c) {
            // 如果点在AB的右边，那么外边的三角形是
            if (es.Vector2Ext.cross(point.sub(a), b.sub(a)) < 0)
                return false;
            // 如果点在BC的右边，则在三角形的外侧
            if (es.Vector2Ext.cross(point.sub(b), c.sub(b)) < 0)
                return false;
            // 如果点在ca的右边，则在三角形的外面
            if (es.Vector2Ext.cross(point.sub(c), a.sub(c)) < 0)
                return false;
            // 点在三角形上
            return true;
        }
        /**
         * 计算一个三角形列表，该列表完全覆盖给定点集所包含的区域。如果点不是CCW，则将arePointsCCW参数传递为false
         * @param points 定义封闭路径的点列表
         * @param arePointsCCW
         */
        triangulate(points, arePointsCCW = true) {
            let count = points.length;
            // 设置前一个链接和下一个链接
            this.initialize(count);
            // 非三角的多边形断路器
            let iterations = 0;
            // 从0开始
            let index = 0;
            // 继续移除所有的三角形，直到只剩下一个三角形
            while (count > 3 && iterations < 500) {
                iterations++;
                let isEar = true;
                let a = points[this._triPrev[index]];
                let b = points[index];
                let c = points[this._triNext[index]];
                if (es.Vector2Ext.isTriangleCCW(a, b, c)) {
                    let k = this._triNext[this._triNext[index]];
                    do {
                        if (Triangulator.testPointTriangle(points[k], a, b, c)) {
                            isEar = false;
                            break;
                        }
                        k = this._triNext[k];
                    } while (k != this._triPrev[index]);
                }
                else {
                    isEar = false;
                }
                if (isEar) {
                    this.triangleIndices.push(this._triPrev[index]);
                    this.triangleIndices.push(index);
                    this.triangleIndices.push(this._triNext[index]);
                    // 删除vert通过重定向相邻vert的上一个和下一个链接，从而减少vertext计数
                    this._triNext[this._triPrev[index]] = this._triNext[index];
                    this._triPrev[this._triNext[index]] = this._triPrev[index];
                    count--;
                    // 接下来访问前一个vert
                    index = this._triPrev[index];
                }
                else {
                    index = this._triNext[index];
                }
            }
            this.triangleIndices.push(this._triPrev[index]);
            this.triangleIndices.push(index);
            this.triangleIndices.push(this._triNext[index]);
            if (!arePointsCCW)
                this.triangleIndices.reverse();
        }
        initialize(count) {
            this.triangleIndices.length = 0;
            if (this._triNext.length < count) {
                this._triNext.reverse();
                this._triNext.length = Math.max(this._triNext.length * 2, count);
            }
            if (this._triPrev.length < count) {
                this._triPrev.reverse();
                this._triPrev.length = Math.max(this._triPrev.length * 2, count);
            }
            for (let i = 0; i < count; i++) {
                this._triPrev[i] = i - 1;
                this._triNext[i] = i + 1;
            }
            this._triPrev[0] = count - 1;
            this._triNext[count - 1] = 0;
        }
    }
    es.Triangulator = Triangulator;
})(es || (es = {}));
var es;
(function (es) {
    const hex = [
        // hex identity values 0-255
        "00",
        "01",
        "02",
        "03",
        "04",
        "05",
        "06",
        "07",
        "08",
        "09",
        "0a",
        "0b",
        "0c",
        "0d",
        "0e",
        "0f",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "1a",
        "1b",
        "1c",
        "1d",
        "1e",
        "1f",
        "20",
        "21",
        "22",
        "23",
        "24",
        "25",
        "26",
        "27",
        "28",
        "29",
        "2a",
        "2b",
        "2c",
        "2d",
        "2e",
        "2f",
        "30",
        "31",
        "32",
        "33",
        "34",
        "35",
        "36",
        "37",
        "38",
        "39",
        "3a",
        "3b",
        "3c",
        "3d",
        "3e",
        "3f",
        "40",
        "41",
        "42",
        "43",
        "44",
        "45",
        "46",
        "47",
        "48",
        "49",
        "4a",
        "4b",
        "4c",
        "4d",
        "4e",
        "4f",
        "50",
        "51",
        "52",
        "53",
        "54",
        "55",
        "56",
        "57",
        "58",
        "59",
        "5a",
        "5b",
        "5c",
        "5d",
        "5e",
        "5f",
        "60",
        "61",
        "62",
        "63",
        "64",
        "65",
        "66",
        "67",
        "68",
        "69",
        "6a",
        "6b",
        "6c",
        "6d",
        "6e",
        "6f",
        "70",
        "71",
        "72",
        "73",
        "74",
        "75",
        "76",
        "77",
        "78",
        "79",
        "7a",
        "7b",
        "7c",
        "7d",
        "7e",
        "7f",
        "80",
        "81",
        "82",
        "83",
        "84",
        "85",
        "86",
        "87",
        "88",
        "89",
        "8a",
        "8b",
        "8c",
        "8d",
        "8e",
        "8f",
        "90",
        "91",
        "92",
        "93",
        "94",
        "95",
        "96",
        "97",
        "98",
        "99",
        "9a",
        "9b",
        "9c",
        "9d",
        "9e",
        "9f",
        "a0",
        "a1",
        "a2",
        "a3",
        "a4",
        "a5",
        "a6",
        "a7",
        "a8",
        "a9",
        "aa",
        "ab",
        "ac",
        "ad",
        "ae",
        "af",
        "b0",
        "b1",
        "b2",
        "b3",
        "b4",
        "b5",
        "b6",
        "b7",
        "b8",
        "b9",
        "ba",
        "bb",
        "bc",
        "bd",
        "be",
        "bf",
        "c0",
        "c1",
        "c2",
        "c3",
        "c4",
        "c5",
        "c6",
        "c7",
        "c8",
        "c9",
        "ca",
        "cb",
        "cc",
        "cd",
        "ce",
        "cf",
        "d0",
        "d1",
        "d2",
        "d3",
        "d4",
        "d5",
        "d6",
        "d7",
        "d8",
        "d9",
        "da",
        "db",
        "dc",
        "dd",
        "de",
        "df",
        "e0",
        "e1",
        "e2",
        "e3",
        "e4",
        "e5",
        "e6",
        "e7",
        "e8",
        "e9",
        "ea",
        "eb",
        "ec",
        "ed",
        "ee",
        "ef",
        "f0",
        "f1",
        "f2",
        "f3",
        "f4",
        "f5",
        "f6",
        "f7",
        "f8",
        "f9",
        "fa",
        "fb",
        "fc",
        "fd",
        "fe",
        "ff",
    ];
    class UUID {
        static randomUUID() {
            const d0 = (Math.random() * 0xffffffff) | 0;
            const d1 = (Math.random() * 0xffffffff) | 0;
            const d2 = (Math.random() * 0xffffffff) | 0;
            const d3 = (Math.random() * 0xffffffff) | 0;
            return (hex[d0 & 0xff] +
                hex[(d0 >> 8) & 0xff] +
                hex[(d0 >> 16) & 0xff] +
                hex[(d0 >> 24) & 0xff] +
                "-" +
                hex[d1 & 0xff] +
                hex[(d1 >> 8) & 0xff] +
                "-" +
                hex[((d1 >> 16) & 0x0f) | 0x40] +
                hex[(d1 >> 24) & 0xff] +
                "-" +
                hex[(d2 & 0x3f) | 0x80] +
                hex[(d2 >> 8) & 0xff] +
                "-" +
                hex[(d2 >> 16) & 0xff] +
                hex[(d2 >> 24) & 0xff] +
                hex[d3 & 0xff] +
                hex[(d3 >> 8) & 0xff] +
                hex[(d3 >> 16) & 0xff] +
                hex[(d3 >> 24) & 0xff]);
        }
    }
    es.UUID = UUID;
})(es || (es = {}));
var es;
(function (es) {
    function getClassName(klass) {
        return klass.className || klass.name;
    }
    es.getClassName = getClassName;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 记录时间的持续时间，一些设计灵感来自物理秒表。
     */
    class Stopwatch {
        constructor(getSystemTime = _defaultSystemTimeGetter) {
            this.getSystemTime = getSystemTime;
            /** 自上次复位以来，秒表已停止的系统时间总数。 */
            this._stopDuration = 0;
            /**
             * 记录自上次复位以来所有已完成切片的结果。
             */
            this._completeSlices = [];
        }
        getState() {
            if (this._startSystemTime === undefined) {
                return State.IDLE;
            }
            else if (this._stopSystemTime === undefined) {
                return State.RUNNING;
            }
            else {
                return State.STOPPED;
            }
        }
        isIdle() {
            return this.getState() === State.IDLE;
        }
        isRunning() {
            return this.getState() === State.RUNNING;
        }
        isStopped() {
            return this.getState() === State.STOPPED;
        }
        /**
         *
         */
        slice() {
            return this.recordPendingSlice();
        }
        /**
         * 获取自上次复位以来该秒表已完成/记录的所有片的列表。
         */
        getCompletedSlices() {
            return Array.from(this._completeSlices);
        }
        /**
         * 获取自上次重置以来该秒表已完成/记录的所有片的列表，以及当前挂起的片。
         */
        getCompletedAndPendingSlices() {
            return [...this._completeSlices, this.getPendingSlice()];
        }
        /**
         * 获取关于这个秒表当前挂起的切片的详细信息。
         */
        getPendingSlice() {
            return this.calculatePendingSlice();
        }
        /**
         * 获取当前秒表时间。这是这个秒表自上次复位以来运行的系统时间总数。
         */
        getTime() {
            return this.caculateStopwatchTime();
        }
        /**
         * 完全重置这个秒表到它的初始状态。清除所有记录的运行持续时间、切片等。
         */
        reset() {
            this._startSystemTime = this._pendingSliceStartStopwatchTime = this._stopSystemTime = undefined;
            this._stopDuration = 0;
            this._completeSlices = [];
        }
        /**
         * 开始(或继续)运行秒表。
         * @param forceReset
         */
        start(forceReset = false) {
            if (forceReset) {
                this.reset();
            }
            if (this._stopSystemTime !== undefined) {
                const systemNow = this.getSystemTime();
                const stopDuration = systemNow - this._stopSystemTime;
                this._stopDuration += stopDuration;
                this._stopSystemTime = undefined;
            }
            else if (this._startSystemTime === undefined) {
                const systemNow = this.getSystemTime();
                this._startSystemTime = systemNow;
                this._pendingSliceStartStopwatchTime = 0;
            }
        }
        /**
         *
         * @param recordPendingSlice
         */
        stop(recordPendingSlice = false) {
            if (this._startSystemTime === undefined) {
                return 0;
            }
            const systemTimeOfStopwatchTime = this.getSystemTimeOfCurrentStopwatchTime();
            if (recordPendingSlice) {
                this.recordPendingSlice(this.caculateStopwatchTime(systemTimeOfStopwatchTime));
            }
            this._stopSystemTime = systemTimeOfStopwatchTime;
            return this.getTime();
        }
        /**
         * 计算指定秒表时间的当前挂起片。
         * @param endStopwatchTime
         */
        calculatePendingSlice(endStopwatchTime) {
            if (this._pendingSliceStartStopwatchTime === undefined) {
                return Object.freeze({ startTime: 0, endTime: 0, duration: 0 });
            }
            if (endStopwatchTime === undefined) {
                endStopwatchTime = this.getTime();
            }
            return Object.freeze({
                startTime: this._pendingSliceStartStopwatchTime,
                endTime: endStopwatchTime,
                duration: endStopwatchTime - this._pendingSliceStartStopwatchTime
            });
        }
        /**
         * 计算指定系统时间的当前秒表时间。
         * @param endSystemTime
         */
        caculateStopwatchTime(endSystemTime) {
            if (this._startSystemTime === undefined)
                return 0;
            if (endSystemTime === undefined)
                endSystemTime = this.getSystemTimeOfCurrentStopwatchTime();
            return endSystemTime - this._startSystemTime - this._stopDuration;
        }
        /**
         * 获取与当前秒表时间等效的系统时间。
         * 如果该秒表当前停止，则返回该秒表停止时的系统时间。
         */
        getSystemTimeOfCurrentStopwatchTime() {
            return this._stopSystemTime === undefined ? this.getSystemTime() : this._stopSystemTime;
        }
        /**
         * 结束/记录当前挂起的片的私有实现。
         * @param endStopwatchTime
         */
        recordPendingSlice(endStopwatchTime) {
            if (this._pendingSliceStartStopwatchTime !== undefined) {
                if (endStopwatchTime === undefined) {
                    endStopwatchTime = this.getTime();
                }
                const slice = this.calculatePendingSlice(endStopwatchTime);
                this._pendingSliceStartStopwatchTime = slice.endTime;
                this._completeSlices.push(slice);
                return slice;
            }
            else {
                return this.calculatePendingSlice();
            }
        }
    }
    es.Stopwatch = Stopwatch;
    let State;
    (function (State) {
        /** 秒表尚未启动，或已复位。 */
        State["IDLE"] = "IDLE";
        /** 秒表正在运行。 */
        State["RUNNING"] = "RUNNING";
        /** 秒表以前还在跑，但现在已经停了。 */
        State["STOPPED"] = "STOPPED";
    })(State || (State = {}));
    function setDefaultSystemTimeGetter(systemTimeGetter = Date.now) {
        _defaultSystemTimeGetter = systemTimeGetter;
    }
    es.setDefaultSystemTimeGetter = setDefaultSystemTimeGetter;
    /** 所有新实例的默认“getSystemTime”实现 */
    let _defaultSystemTimeGetter = Date.now;
})(es || (es = {}));
var es;
(function (es) {
    class Bag {
        constructor(capacity = 64) {
            this.size_ = 0;
            this.length = 0;
            this.array = [];
            this.length = capacity;
        }
        removeAt(index) {
            const e = this.array[index];
            this.array[index] = this.array[--this.size_];
            this.array[this.size_] = null;
            return e;
        }
        remove(e) {
            let i;
            let e2;
            const size = this.size_;
            for (i = 0; i < size; i++) {
                e2 = this.array[i];
                if (e == e2) {
                    this.array[i] = this.array[--this.size_];
                    this.array[this.size_] = null;
                    return true;
                }
            }
            return false;
        }
        removeLast() {
            if (this.size_ > 0) {
                const e = this.array[--this.size_];
                this.array[this.size_] = null;
                return e;
            }
            return null;
        }
        contains(e) {
            let i;
            let size;
            for (i = 0, size = this.size_; size > i; i++) {
                if (e === this.array[i]) {
                    return true;
                }
            }
            return false;
        }
        removeAll(bag) {
            let modified = false;
            let i;
            let j;
            let l;
            let e1;
            let e2;
            for (i = 0, l = bag.size(); i < l; i++) {
                e1 = bag[i];
                for (j = 0; j < this.size_; j++) {
                    e2 = this.array[j];
                    if (e1 === e2) {
                        this.removeAt(j);
                        j--;
                        modified = true;
                        break;
                    }
                }
            }
            return modified;
        }
        get(index) {
            if (index >= this.length) {
                throw new Error("ArrayIndexOutOfBoundsException");
            }
            return this.array[index];
        }
        safeGet(index) {
            if (index >= this.length) {
                this.grow((index * 7) / 4 + 1);
            }
            return this.array[index];
        }
        size() {
            return this.size_;
        }
        getCapacity() {
            return this.length;
        }
        isIndexWithinBounds(index) {
            return index < this.getCapacity();
        }
        isEmpty() {
            return this.size_ == 0;
        }
        add(e) {
            if (this.size_ === this.length) {
                this.grow();
            }
            this.array[this.size_++] = e;
        }
        set(index, e) {
            if (index >= this.length) {
                this.grow(index * 2);
            }
            this.size_ = index + 1;
            this.array[index] = e;
        }
        grow(newCapacity = ~~((this.length * 3) / 2) + 1) {
            this.length = ~~newCapacity;
        }
        ensureCapacity(index) {
            if (index >= this.length) {
                this.grow(index * 2);
            }
        }
        clear() {
            let i;
            let size;
            for (i = 0, size = this.size_; i < size; i++) {
                this.array[i] = null;
            }
            this.size_ = 0;
        }
        addAll(items) {
            let i;
            for (i = 0; items.size() > i; i++) {
                this.add(items.get(i));
            }
        }
    }
    es.Bag = Bag;
})(es || (es = {}));
var es;
(function (es) {
    class Node {
        // next为可选参数，如果不传则为undefined
        constructor(element, next) {
            this.element = element;
            this.next = next;
        }
    }
    es.Node = Node;
    function defaultEquals(a, b) {
        return a === b;
    }
    es.defaultEquals = defaultEquals;
    class LinkedList {
        constructor(equalsFn = defaultEquals) {
            // 初始化链表内部变量
            this.count = 0;
            this.next = undefined;
            this.equalsFn = equalsFn;
            this.head = null;
        }
        // 链表尾部添加元素
        push(element) {
            // 声明结点变量，将元素当作参数传入生成结点
            const node = new Node(element);
            // 存储遍历到的链表元素
            let current;
            if (this.head == null) {
                // 链表为空，直接将链表头部赋值为结点变量
                this.head = node;
            }
            else {
                // 链表不为空，我们只能拿到链表中第一个元素的引用
                current = this.head;
                // 循环访问链表
                while (current.next != null) {
                    // 赋值遍历到的元素
                    current = current.next;
                }
                // 此时已经得到了链表的最后一个元素(null)，将链表的下一个元素赋值为结点变量。
                current.next = node;
            }
            // 链表长度自增
            this.count++;
        }
        // 移除链表指定位置的元素
        removeAt(index) {
            // 边界判断: 参数是否有效
            if (index >= 0 && index < this.count) {
                // 获取当前链表头部元素
                let current = this.head;
                // 移除第一项
                if (index === 0) {
                    this.head = current.next;
                }
                else {
                    // 获取目标参数上一个结点
                    const previous = this.getElementAt(index - 1);
                    // 当前结点指向目标结点
                    current = previous.next;
                    /**
                     * 目标结点元素已找到
                     * previous.next指向目标结点
                     * current.next指向undefined
                     * previous.next指向current.next即删除目标结点的元素
                     */
                    previous.next = current.next;
                }
                // 链表长度自减
                this.count--;
                // 返回当前删除的目标结点
                return current.element;
            }
            return undefined;
        }
        // 获取链表指定位置的结点
        getElementAt(index) {
            // 参数校验
            if (index >= 0 && index <= this.count) {
                // 获取链表头部元素
                let current = this.head;
                // 从链表头部遍历至目标结点位置
                for (let i = 0; i < index && current != null; i++) {
                    // 当前结点指向下一个目标结点
                    current = current.next;
                }
                // 返回目标结点数据
                return current;
            }
            return undefined;
        }
        // 向链表中插入元素
        insert(element, index) {
            // 参数有效性判断
            if (index >= 0 && index <= this.count) {
                // 声明节点变量，将当前要插入的元素作为参数生成结点
                const node = new Node(element);
                // 第一个位置添加元素
                if (index === 0) {
                    // 将节点变量(node)的下一个元素指向链表的头部元素
                    node.next = this.head;
                    // 链表头部元素赋值为节点变量
                    this.head = node;
                }
                else {
                    // 获取目标结点的上一个结点
                    const previous = this.getElementAt(index - 1);
                    // 将节点变量的下一个元素指向目标节点
                    node.next = previous.next;
                    /**
                     * 此时node中当前结点为要插入的值
                     * next为原位置处的结点
                     * 因此将当前结点赋值为node，就完成了结点插入操作
                     */
                    previous.next = node;
                }
                // 链表长度自增
                this.count++;
                return true;
            }
            return false;
        }
        // 根据元素获取其在链表中的索引
        indexOf(element) {
            // 获取链表顶部元素
            let current = this.head;
            // 遍历链表内的元素
            for (let i = 0; i < this.count && current != null; i++) {
                // 判断当前链表中的结点与目标结点是否相等
                if (this.equalsFn(element, current.element)) {
                    // 返回索引
                    return i;
                }
                // 当前结点指向下一个结点
                current = current.next;
            }
            // 目标元素不存在
            return -1;
        }
        // 移除链表中的指定元素
        remove(element) {
            // 获取element的索引,移除索引位置的元素
            this.removeAt(this.indexOf(element));
        }
        clear() {
            this.head = undefined;
            this.count = 0;
        }
        // 获取链表长度
        size() {
            return this.count;
        }
        // 判断链表是否为空
        isEmpty() {
            return this.size() === 0;
        }
        // 获取链表头部元素
        getHead() {
            return this.head;
        }
        // 获取链表中的所有元素
        toString() {
            if (this.head == null) {
                return "";
            }
            let objString = `${this.head.element}`;
            // 获取链表顶点的下一个结点
            let current = this.head.next;
            // 遍历链表中的所有结点
            for (let i = 1; i < this.size() && current != null; i++) {
                // 将当前结点的元素拼接到最终要生成的字符串对象中
                objString = `${objString}, ${current.element}`;
                // 当前结点指向链表的下一个元素
                current = current.next;
            }
            return objString;
        }
    }
    es.LinkedList = LinkedList;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 可以用于列表池的简单类
     */
    class ListPool {
        /**
         * 预热缓存，使用最大的cacheCount对象填充缓存
         * @param cacheCount
         */
        static warmCache(type, cacheCount) {
            this.checkCreate(type);
            cacheCount -= this._objectQueue.get(type).length;
            if (cacheCount > 0) {
                for (let i = 0; i < cacheCount; i++) {
                    this._objectQueue.get(type).push([]);
                }
            }
        }
        /**
         * 将缓存修剪为cacheCount项目
         * @param cacheCount
         */
        static trimCache(type, cacheCount) {
            this.checkCreate(type);
            while (cacheCount > this._objectQueue.get(type).length)
                this._objectQueue.get(type).splice(0, 1);
        }
        /**
         * 清除缓存
         */
        static clearCache(type) {
            this.checkCreate(type);
            this._objectQueue.get(type).length = 0;
        }
        /**
         * 如果可以的话，从堆栈中弹出一个项
         */
        static obtain(type) {
            this.checkCreate(type);
            if (this._objectQueue.get(type).length > 0)
                return this._objectQueue.get(type).shift();
            return [];
        }
        /**
         * 将项推回堆栈
         * @param obj
         */
        static free(type, obj) {
            this.checkCreate(type);
            this._objectQueue.get(type).push(obj);
            obj.length = 0;
        }
        static checkCreate(type) {
            if (!this._objectQueue.has(type))
                this._objectQueue.set(type, []);
        }
    }
    ListPool._objectQueue = new Map();
    es.ListPool = ListPool;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 用于管理一对对象的简单DTO
     */
    class Pair {
        constructor(first, second) {
            this.first = first;
            this.second = second;
        }
        clear() {
            this.first = this.second = null;
        }
        equals(other) {
            // 这两种方法在功能上应该是等价的
            return this.first === other.first && this.second === other.second;
        }
    }
    es.Pair = Pair;
})(es || (es = {}));
var es;
(function (es) {
    class PairSet {
        constructor() {
            this._all = new Array();
        }
        get all() {
            return this._all;
        }
        has(pair) {
            const index = this._all.findIndex(p => p.equals(pair));
            return index > -1;
        }
        add(pair) {
            if (!this.has(pair)) {
                this._all.push(pair);
            }
        }
        remove(pair) {
            const index = this._all.findIndex(p => p.equals(pair));
            if (index > -1) {
                const temp = this._all[index];
                this._all[index] = this._all[this._all.length - 1];
                this._all[this._all.length - 1] = temp;
                this._all = this._all.slice(0, this._all.length - 1);
            }
        }
        clear() {
            this._all = [];
        }
        union(other) {
            const otherAll = other.all;
            if (otherAll.length > 0)
                for (let i = 0; i < otherAll.length; i++) {
                    const elem = otherAll[i];
                    this.add(elem);
                }
        }
        except(other) {
            const otherAll = other.all;
            if (otherAll.length > 0)
                for (let i = 0; i < otherAll.length; i++) {
                    const elem = otherAll[i];
                    this.remove(elem);
                }
        }
    }
    es.PairSet = PairSet;
})(es || (es = {}));
var es;
(function (es) {
    class Pool {
        /**
         * 预热缓存，使用最大的cacheCount对象填充缓存
         * @param type 要预热的类型
         * @param cacheCount 预热缓存数量
         */
        static warmCache(type, cacheCount) {
            this.checkCreate(type);
            const queue = this._objectQueue.get(type);
            cacheCount -= queue.length;
            // 如果需要预热更多的对象，则创建并添加到缓存
            if (cacheCount > 0) {
                for (let i = 0; i < cacheCount; i++) {
                    queue.push(new type());
                }
            }
        }
        /**
        * 将缓存修剪为cacheCount项目
        * @param type 要修剪的类型
        * @param cacheCount 修剪后的缓存数量
        */
        static trimCache(type, cacheCount) {
            this.checkCreate(type);
            const objectQueue = this._objectQueue.get(type);
            // 如果需要修剪缓存，则弹出多余的对象
            while (cacheCount < objectQueue.length) {
                objectQueue.pop();
            }
        }
        /**
         * 清除缓存
         * @param type 要清除缓存的类型
         */
        static clearCache(type) {
            this.checkCreate(type);
            const objectQueue = this._objectQueue.get(type);
            // 清空缓存数组
            objectQueue.length = 0;
        }
        /**
         * 如果可以的话，从缓存中获取一个对象
         * @param type 要获取的类型
         */
        static obtain(type) {
            this.checkCreate(type);
            const objectQueue = this._objectQueue.get(type);
            // 如果缓存中有对象，弹出一个并返回
            if (objectQueue.length > 0) {
                return objectQueue.pop();
            }
            // 如果没有缓存对象，则创建一个新的对象并返回
            return new type();
        }
        /**
         * 将对象推回缓存
         * @param type 对象的类型
         * @param obj 要推回的对象
         */
        static free(type, obj) {
            this.checkCreate(type);
            const objectQueue = this._objectQueue.get(type);
            // 将对象推回缓存
            objectQueue.push(obj);
            // 如果对象实现了IPoolable接口，则调用reset方法重置对象
            if (es.isIPoolable(obj)) {
                obj.reset();
            }
        }
        /**
         * 检查缓存中是否已存在给定类型的对象池，如果不存在则创建一个
         * @param type 要检查的类型
         */
        static checkCreate(type) {
            if (!this._objectQueue.has(type)) {
                this._objectQueue.set(type, []);
            }
        }
    }
    Pool._objectQueue = new Map();
    es.Pool = Pool;
    es.isIPoolable = (props) => {
        return typeof props.reset === 'function';
    };
})(es || (es = {}));
var es;
(function (es) {
    class Coroutine {
        /**
         * 导致Coroutine在指定的时间内暂停。在Coroutine.waitForSeconds的基础上，在Coroutine中使用Yield
         * @param seconds
         */
        static waitForSeconds(seconds) {
            return WaitForSeconds.waiter.wait(seconds);
        }
    }
    es.Coroutine = Coroutine;
    /**
     * 帮助类，用于当一个coroutine想要暂停一段时间时。返回Coroutine.waitForSeconds返回其中一个
     */
    class WaitForSeconds {
        constructor() {
            this.waitTime = 0;
        }
        wait(seconds) {
            WaitForSeconds.waiter.waitTime = seconds;
            return WaitForSeconds.waiter;
        }
    }
    WaitForSeconds.waiter = new WaitForSeconds();
    es.WaitForSeconds = WaitForSeconds;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * CoroutineManager用于隐藏Coroutine所需数据的内部类
     */
    class CoroutineImpl {
        constructor() {
            /**
             * 每当产生一个延迟，它就会被添加到跟踪延迟的waitTimer中
             */
            this.waitTimer = 0;
            this.useUnscaledDeltaTime = false;
        }
        stop() {
            this.isDone = true;
        }
        setUseUnscaledDeltaTime(useUnscaledDeltaTime) {
            this.useUnscaledDeltaTime = useUnscaledDeltaTime;
            return this;
        }
        prepareForUse() {
            this.isDone = false;
        }
        reset() {
            this.isDone = true;
            this.waitTimer = 0;
            this.waitForCoroutine = null;
            this.enumerator = null;
            this.useUnscaledDeltaTime = false;
        }
    }
    es.CoroutineImpl = CoroutineImpl;
    class CoroutineManager extends es.GlobalManager {
        constructor() {
            super(...arguments);
            this._unblockedCoroutines = [];
            this._shouldRunNextFrame = [];
        }
        /**
         * 立即停止并清除所有协程
         */
        clearAllCoroutines() {
            for (let i = 0; i < this._unblockedCoroutines.length; i++) {
                es.Pool.free(CoroutineImpl, this._unblockedCoroutines[i]);
            }
            for (let i = 0; i < this._shouldRunNextFrame.length; i++) {
                es.Pool.free(CoroutineImpl, this._shouldRunNextFrame[i]);
            }
            this._unblockedCoroutines.length = 0;
            this._shouldRunNextFrame.length = 0;
        }
        /**
         * 将IEnumerator添加到CoroutineManager中
         * Coroutine在每一帧调用Update之前被执行
         * @param enumerator
         */
        startCoroutine(enumerator) {
            const coroutine = this.getOrCreateCoroutine();
            coroutine.prepareForUse();
            coroutine.enumerator = typeof enumerator === 'function' ? enumerator() : enumerator;
            if (this.tickCoroutine(coroutine)) {
                this.addCoroutine(coroutine);
                return coroutine;
            }
            return null;
        }
        getOrCreateCoroutine() {
            const coroutine = es.Pool.obtain(CoroutineImpl);
            coroutine.prepareForUse();
            return coroutine;
        }
        addCoroutine(coroutine) {
            if (this._isInUpdate)
                this._shouldRunNextFrame.push(coroutine);
            else
                this._unblockedCoroutines.push(coroutine);
        }
        update() {
            this._isInUpdate = true;
            const unblockedCoroutines = this._unblockedCoroutines;
            const shouldRunNextFrame = this._shouldRunNextFrame;
            for (let i = unblockedCoroutines.length - 1; i >= 0; i--) {
                const coroutine = unblockedCoroutines[i];
                if (coroutine.isDone) {
                    es.Pool.free(CoroutineImpl, coroutine);
                    unblockedCoroutines.splice(i, 1);
                    continue;
                }
                const waitForCoroutine = coroutine.waitForCoroutine;
                if (waitForCoroutine != null) {
                    if (waitForCoroutine.isDone) {
                        coroutine.waitForCoroutine = null;
                    }
                    else {
                        shouldRunNextFrame.push(coroutine);
                        continue;
                    }
                }
                const waitTimer = coroutine.waitTimer;
                if (waitTimer > 0) {
                    // 递减，然后再运行下一帧，确保用适当的deltaTime递减
                    coroutine.waitTimer = waitTimer - (coroutine.useUnscaledDeltaTime ? es.Time.unscaledDeltaTime : es.Time.deltaTime);
                    shouldRunNextFrame.push(coroutine);
                    continue;
                }
                if (this.tickCoroutine(coroutine)) {
                    shouldRunNextFrame.push(coroutine);
                }
            }
            unblockedCoroutines.push(...shouldRunNextFrame);
            shouldRunNextFrame.length = 0;
            this._isInUpdate = false;
        }
        /**
         * 勾选一个coroutine，如果该coroutine应该在下一帧继续运行，则返回true。本方法会将完成的coroutine放回Pool
         * @param coroutine
         */
        tickCoroutine(coroutine) {
            const { enumerator } = coroutine;
            const { value, done } = enumerator.next();
            if (done || coroutine.isDone) {
                // 当协程执行完或标记为结束时，回收协程实例并返回 false。
                es.Pool.free(CoroutineImpl, coroutine);
                return false;
            }
            if (!value) {
                // 如果下一帧没有指定任务，返回 true 让协程继续等待下一帧执行。
                return true;
            }
            if (value instanceof es.WaitForSeconds) {
                // 如果下一帧需要等待指定时间，则记录等待时间并返回 true。
                coroutine.waitTimer = value.waitTime;
                return true;
            }
            if (typeof value === 'number') {
                // 如果下一帧需要等待指定时间，则记录等待时间并返回 true。
                coroutine.waitTimer = value;
                return true;
            }
            if (typeof value === 'string') {
                // 如果下一帧返回 'break'，标记协程为结束并返回 false。
                if (value === 'break') {
                    es.Pool.free(CoroutineImpl, coroutine);
                    return false;
                }
                // 否则返回 true 让协程继续等待下一帧执行。
                return true;
            }
            if (typeof value === 'function') {
                // 如果下一帧需要等待另一个协程完成，启动并记录另一个协程实例，并返回 true。
                coroutine.waitForCoroutine = this.startCoroutine(value);
                return true;
            }
            if (value instanceof CoroutineImpl) {
                // 如果下一帧需要等待另一个协程完成，记录另一个协程实例，并返回 true。
                coroutine.waitForCoroutine = value;
                return true;
            }
            // 否则返回 true 让协程继续等待下一帧执行。
            return true;
        }
    }
    es.CoroutineManager = CoroutineManager;
})(es || (es = {}));
var es;
(function (es) {
    class MaxRectsBinPack {
        constructor(width, height, rotations = true) {
            this.binWidth = 0;
            this.binHeight = 0;
            this.usedRectangles = [];
            this.freeRectangles = [];
            this.init(width, height, rotations);
        }
        init(width, height, rotations = true) {
            this.binWidth = width;
            this.binHeight = height;
            this.allowRotations = rotations;
            let n = new es.Rectangle();
            n.x = 0;
            n.y = 0;
            n.width = width;
            n.height = height;
            this.usedRectangles.length = 0;
            this.freeRectangles.length = 0;
            this.freeRectangles.push(n);
        }
        insert(width, height) {
            let newNode = new es.Rectangle();
            let score1 = new es.Ref(0);
            let score2 = new es.Ref(0);
            newNode = this.findPositionForNewNodeBestAreaFit(width, height, score1, score2);
            if (newNode.height == 0)
                return newNode;
            let numRectanglesToProcess = this.freeRectangles.length;
            for (let i = 0; i < numRectanglesToProcess; ++i) {
                if (this.splitFreeNode(this.freeRectangles[i], newNode)) {
                    new es.List(this.freeRectangles).removeAt(i);
                    --i;
                    --numRectanglesToProcess;
                }
            }
            this.pruneFreeList();
            this.usedRectangles.push(newNode);
            return newNode;
        }
        findPositionForNewNodeBestAreaFit(width, height, bestAreaFit, bestShortSideFit) {
            let bestNode = new es.Rectangle();
            bestAreaFit.value = Number.MAX_VALUE;
            for (let i = 0; i < this.freeRectangles.length; ++i) {
                let areaFit = this.freeRectangles[i].width * this.freeRectangles[i].height - width * height;
                // 试着将长方形放在直立（非翻转）的方向
                if (this.freeRectangles[i].width >= width && this.freeRectangles[i].height >= height) {
                    let leftoverHoriz = Math.abs(this.freeRectangles[i].width - width);
                    let leftoverVert = Math.abs(this.freeRectangles[i].height - height);
                    let shortSideFit = Math.min(leftoverHoriz, leftoverVert);
                    if (areaFit < bestAreaFit.value || (areaFit == bestAreaFit.value && shortSideFit < bestShortSideFit.value)) {
                        bestNode.x = this.freeRectangles[i].x;
                        bestNode.y = this.freeRectangles[i].y;
                        bestNode.width = width;
                        bestNode.height = height;
                        bestShortSideFit.value = shortSideFit;
                        bestAreaFit.value = areaFit;
                    }
                }
                if (this.allowRotations && this.freeRectangles[i].width >= height && this.freeRectangles[i].height >= width) {
                    let leftoverHoriz = Math.abs(this.freeRectangles[i].width - height);
                    let leftoverVert = Math.abs(this.freeRectangles[i].height - width);
                    let shortSideFit = Math.min(leftoverHoriz, leftoverVert);
                    if (areaFit < bestAreaFit.value || (areaFit == bestAreaFit.value && shortSideFit < bestShortSideFit.value)) {
                        bestNode.x = this.freeRectangles[i].x;
                        bestNode.y = this.freeRectangles[i].y;
                        bestNode.width = height;
                        bestNode.height = width;
                        bestShortSideFit.value = shortSideFit;
                        bestAreaFit.value = areaFit;
                    }
                }
                return bestNode;
            }
        }
        splitFreeNode(freeNode, usedNode) {
            // 用SAT测试长方形是否均匀相交
            if (usedNode.x >= freeNode.x + freeNode.width || usedNode.x + usedNode.width <= freeNode.x ||
                usedNode.y >= freeNode.y + freeNode.height || usedNode.y + usedNode.height <= freeNode.y)
                return false;
            if (usedNode.x < freeNode.x + freeNode.width && usedNode.x + usedNode.width > freeNode.x) {
                // 在使用过的节点的上边新建一个节点
                if (usedNode.y > freeNode.y && usedNode.y < freeNode.y + freeNode.height) {
                    let newNode = freeNode;
                    newNode.height = usedNode.y - newNode.y;
                    this.freeRectangles.push(newNode);
                }
                // 在使用过的节点的底边新建节点
                if (usedNode.y + usedNode.height < freeNode.y + freeNode.height) {
                    let newNode = freeNode;
                    newNode.y = usedNode.y + usedNode.height;
                    newNode.height = freeNode.y + freeNode.height - (usedNode.y + usedNode.height);
                    this.freeRectangles.push(newNode);
                }
            }
            if (usedNode.y < freeNode.y + freeNode.height && usedNode.y + usedNode.height > freeNode.y) {
                // 在使用过的节点的左侧新建节点
                if (usedNode.x > freeNode.x && usedNode.x < freeNode.x + freeNode.width) {
                    let newNode = freeNode;
                    newNode.width = usedNode.x - newNode.x;
                    this.freeRectangles.push(newNode);
                }
                // 在使用过的节点右侧新建节点
                if (usedNode.x + usedNode.width < freeNode.x + freeNode.width) {
                    let newNode = freeNode;
                    newNode.x = usedNode.x + usedNode.width;
                    newNode.width = freeNode.x + freeNode.width - (usedNode.x + usedNode.width);
                    this.freeRectangles.push(newNode);
                }
            }
            return true;
        }
        pruneFreeList() {
            for (let i = 0; i < this.freeRectangles.length; ++i)
                for (let j = i + 1; j < this.freeRectangles.length; ++j) {
                    if (this.isContainedIn(this.freeRectangles[i], this.freeRectangles[j])) {
                        new es.List(this.freeRectangles).removeAt(i);
                        --i;
                        break;
                    }
                    if (this.isContainedIn(this.freeRectangles[j], this.freeRectangles[i])) {
                        new es.List(this.freeRectangles).removeAt(j);
                        --j;
                    }
                }
        }
        isContainedIn(a, b) {
            return a.x >= b.x && a.y >= b.y
                && a.x + a.width <= b.x + b.width
                && a.y + a.height <= b.y + b.height;
        }
    }
    es.MaxRectsBinPack = MaxRectsBinPack;
})(es || (es = {}));
var es;
(function (es) {
    class ArrayUtils {
        /**
         * 执行冒泡排序
         * @param ary
         */
        static bubbleSort(ary) {
            let isExchange = false;
            for (let i = 0; i < ary.length; i++) {
                isExchange = false;
                for (let j = ary.length - 1; j > i; j--) {
                    if (ary[j] < ary[j - 1]) {
                        let temp = ary[j];
                        ary[j] = ary[j - 1];
                        ary[j - 1] = temp;
                        isExchange = true;
                    }
                }
                if (!isExchange)
                    break;
            }
        }
        /**
         * 执行插入排序
         * @param ary
         */
        static insertionSort(ary) {
            let len = ary.length;
            for (let i = 1; i < len; i++) {
                let val = ary[i];
                for (var j = i; j > 0 && ary[j - 1] > val; j--) {
                    ary[j] = ary[j - 1];
                }
                ary[j] = val;
            }
        }
        /**
         * 执行二分搜索
         * @param ary 搜索的数组（必须排序过）
         * @param value 需要搜索的值
         * @returns 返回匹配结果的数组索引
         */
        static binarySearch(ary, value) {
            let startIndex = 0;
            let endIndex = ary.length;
            let sub = (startIndex + endIndex) >> 1;
            while (startIndex < endIndex) {
                if (value <= ary[sub])
                    endIndex = sub;
                else if (value >= ary[sub])
                    startIndex = sub + 1;
                sub = (startIndex + endIndex) >> 1;
            }
            if (ary[startIndex] == value)
                return startIndex;
            return -1;
        }
        /**
         * 返回匹配项的索引
         * @param ary
         * @param num
         */
        static findElementIndex(ary, num) {
            let len = ary.length;
            for (let i = 0; i < len; ++i) {
                if (ary[i] == num)
                    return i;
            }
            return null;
        }
        /**
         * 返回数组中最大值的索引
         * @param ary
         */
        static getMaxElementIndex(ary) {
            let matchIndex = 0;
            let len = ary.length;
            for (let j = 1; j < len; j++) {
                if (ary[j] > ary[matchIndex])
                    matchIndex = j;
            }
            return matchIndex;
        }
        /**
         * 返回数组中最小值的索引
         * @param ary
         */
        static getMinElementIndex(ary) {
            let matchIndex = 0;
            let len = ary.length;
            for (let j = 1; j < len; j++) {
                if (ary[j] < ary[matchIndex])
                    matchIndex = j;
            }
            return matchIndex;
        }
        /**
         * 返回一个"唯一性"数组
         * @param ary 需要唯一性的数组
         * @returns 唯一性的数组
         *
         * @tutorial
         * 比如: [1, 2, 2, 3, 4]
         * 返回: [1, 2, 3, 4]
         */
        static getUniqueAry(ary) {
            let uAry = [];
            let newAry = [];
            let count = ary.length;
            for (let i = 0; i < count; ++i) {
                let value = ary[i];
                if (uAry.indexOf(value) == -1)
                    uAry.push(value);
            }
            count = uAry.length;
            for (let i = count - 1; i >= 0; --i) {
                newAry.unshift(uAry[i]);
            }
            return newAry;
        }
        /**
         * 返回2个数组中不同的部分
         * 比如数组A = [1, 2, 3, 4, 6]
         *    数组B = [0, 2, 1, 3, 4]
         * 返回[6, 0]
         * @param    aryA
         * @param    aryB
         * @return
         */
        static getDifferAry(aryA, aryB) {
            aryA = this.getUniqueAry(aryA);
            aryB = this.getUniqueAry(aryB);
            let ary = aryA.concat(aryB);
            let uObj = {};
            let newAry = [];
            let count = ary.length;
            for (let j = 0; j < count; ++j) {
                if (!uObj[ary[j]]) {
                    uObj[ary[j]] = {};
                    uObj[ary[j]].count = 0;
                    uObj[ary[j]].key = ary[j];
                    uObj[ary[j]].count++;
                }
                else {
                    if (uObj[ary[j]] instanceof Object) {
                        uObj[ary[j]].count++;
                    }
                }
            }
            for (let i in uObj) {
                if (uObj[i].count != 2) {
                    newAry.unshift(uObj[i].key);
                }
            }
            return newAry;
        }
        /**
         * 交换数组元素
         * @param    array    目标数组
         * @param    index1    交换后的索引
         * @param    index2    交换前的索引
         */
        static swap(array, index1, index2) {
            let temp = array[index1];
            array[index1] = array[index2];
            array[index2] = temp;
        }
        /**
         * 清除列表
         * @param ary
         */
        static clearList(ary) {
            if (!ary)
                return;
            let length = ary.length;
            for (let i = length - 1; i >= 0; i -= 1) {
                ary.splice(i, 1);
            }
        }
        /**
         * 克隆一个数组
         * @param    ary 需要克隆的数组
         * @return  克隆的数组
         */
        static cloneList(ary) {
            if (!ary)
                return null;
            return ary.slice(0, ary.length);
        }
        /**
         * 判断2个数组是否相同
         * @param ary1 数组1
         * @param ary2 数组2
         */
        static equals(ary1, ary2) {
            if (ary1 == ary2)
                return true;
            let length = ary1.length;
            if (length != ary2.length)
                return false;
            while (length--) {
                if (ary1[length] != ary2[length])
                    return false;
            }
            return true;
        }
        /**
         * 根据索引插入元素，索引和索引后的元素都向后移动一位
         * @param ary
         * @param index 插入索引
         * @param value 插入的元素
         * @returns 插入的元素 未插入则返回空
         */
        static insert(ary, index, value) {
            if (!ary)
                return null;
            let length = ary.length;
            if (index > length)
                index = length;
            if (index < 0)
                index = 0;
            if (index == length)
                ary.push(value); //插入最后
            else if (index == 0)
                ary.unshift(value); //插入头
            else {
                for (let i = length - 1; i >= index; i -= 1) {
                    ary[i + 1] = ary[i];
                }
                ary[index] = value;
            }
            return value;
        }
        /**
         * 打乱数组 Fisher–Yates shuffle
         * @param list
         */
        static shuffle(list) {
            let n = list.length;
            while (n > 1) {
                n--;
                let k = es.RandomUtils.randint(0, n + 1);
                let value = list[k];
                list[k] = list[n];
                list[n] = value;
            }
        }
        /**
         * 如果项目已经在列表中，返回false，如果成功添加，返回true
         * @param list
         * @param item
         */
        static addIfNotPresent(list, item) {
            if (new es.List(list).contains(item))
                return false;
            list.push(item);
            return true;
        }
        /**
         * 返回列表中的最后一项。列表中至少应该有一个项目
         * @param list
         */
        static lastItem(list) {
            return list[list.length - 1];
        }
        /**
         * 从列表中随机获取一个项目。不清空检查列表!
         * @param list
         */
        static randomItem(list) {
            return list[es.RandomUtils.randint(0, list.length - 1)];
        }
        /**
         * 从列表中随机获取物品。不清空检查列表，也不验证列表数是否大于项目数。返回的List可以通过ListPool.free放回池中
         * @param list
         * @param itemCount 从列表中返回的随机项目的数量
         */
        static randomItems(type, list, itemCount) {
            let set = new Set();
            while (set.size != itemCount) {
                let item = this.randomItem(list);
                if (!set.has(item))
                    set.add(item);
            }
            let items = es.ListPool.obtain(type);
            set.forEach(value => items.push(value));
            return items;
        }
    }
    es.ArrayUtils = ArrayUtils;
})(es || (es = {}));
var es;
(function (es) {
    class Base64Utils {
        /**
         * 判断是否原生支持Base64位解析
         */
        static get nativeBase64() {
            return (typeof (window.atob) === "function");
        }
        /**
         * 解码
         * @param input
         */
        static decode(input) {
            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
            if (this.nativeBase64) {
                return window.atob(input);
            }
            else {
                var output = [], chr1, chr2, chr3, enc1, enc2, enc3, enc4, i = 0;
                while (i < input.length) {
                    enc1 = this._keyStr.indexOf(input.charAt(i++));
                    enc2 = this._keyStr.indexOf(input.charAt(i++));
                    enc3 = this._keyStr.indexOf(input.charAt(i++));
                    enc4 = this._keyStr.indexOf(input.charAt(i++));
                    chr1 = (enc1 << 2) | (enc2 >> 4);
                    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                    chr3 = ((enc3 & 3) << 6) | enc4;
                    output.push(String.fromCharCode(chr1));
                    if (enc3 !== 64) {
                        output.push(String.fromCharCode(chr2));
                    }
                    if (enc4 !== 64) {
                        output.push(String.fromCharCode(chr3));
                    }
                }
                output = output.join("");
                return output;
            }
        }
        /**
         * 编码
         * @param input
         */
        static encode(input) {
            input = input.replace(/\r\n/g, "\n");
            if (this.nativeBase64) {
                window.btoa(input);
            }
            else {
                var output = [], chr1, chr2, chr3, enc1, enc2, enc3, enc4, i = 0;
                while (i < input.length) {
                    chr1 = input.charCodeAt(i++);
                    chr2 = input.charCodeAt(i++);
                    chr3 = input.charCodeAt(i++);
                    enc1 = chr1 >> 2;
                    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                    enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                    enc4 = chr3 & 63;
                    if (isNaN(chr2)) {
                        enc3 = enc4 = 64;
                    }
                    else if (isNaN(chr3)) {
                        enc4 = 64;
                    }
                    output.push(this._keyStr.charAt(enc1));
                    output.push(this._keyStr.charAt(enc2));
                    output.push(this._keyStr.charAt(enc3));
                    output.push(this._keyStr.charAt(enc4));
                }
                output = output.join("");
                return output;
            }
        }
        /**
         * 解析Base64格式数据
         * @param input
         * @param bytes
         */
        static decodeBase64AsArray(input, bytes) {
            bytes = bytes || 1;
            var dec = Base64Utils.decode(input), i, j, len;
            var ar = new Uint32Array(dec.length / bytes);
            for (i = 0, len = dec.length / bytes; i < len; i++) {
                ar[i] = 0;
                for (j = bytes - 1; j >= 0; --j) {
                    ar[i] += dec.charCodeAt((i * bytes) + j) << (j << 3);
                }
            }
            return ar;
        }
        /**
         * 暂时不支持
         * @param data
         * @param decoded
         * @param compression
         * @private
         */
        static decompress(data, decoded, compression) {
            throw new Error("GZIP/ZLIB compressed TMX Tile Map not supported!");
        }
        /**
         * 解析csv数据
         * @param input
         */
        static decodeCSV(input) {
            var entries = input.replace("\n", "").trim().split(",");
            var result = [];
            for (var i = 0; i < entries.length; i++) {
                result.push(+entries[i]);
            }
            return result;
        }
    }
    Base64Utils._keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    es.Base64Utils = Base64Utils;
})(es || (es = {}));
var es;
(function (es) {
    class EdgeExt {
        static oppositeEdge(self) {
            switch (self) {
                case es.Edge.bottom:
                    return es.Edge.top;
                case es.Edge.top:
                    return es.Edge.bottom;
                case es.Edge.left:
                    return es.Edge.right;
                case es.Edge.right:
                    return es.Edge.left;
            }
        }
        /**
         * 如果边是右或左，则返回true
         * @param self
         */
        static isHorizontal(self) {
            return self == es.Edge.right || self == es.Edge.left;
        }
        /**
         * 如果边是顶部或底部，则返回true
         * @param self
         */
        static isVertical(self) {
            return self == es.Edge.top || self == es.Edge.bottom;
        }
    }
    es.EdgeExt = EdgeExt;
})(es || (es = {}));
var es;
(function (es) {
    class NumberExtension {
        static toNumber(value) {
            if (value == undefined)
                return 0;
            return Number(value);
        }
    }
    es.NumberExtension = NumberExtension;
})(es || (es = {}));
var es;
(function (es) {
    class RandomUtils {
        /**
         * 在 start 与 stop之间取一个随机整数，可以用step指定间隔， 但不包括较大的端点（start与stop较大的一个）
         * 如
         * this.randrange(1, 10, 3)
         * 则返回的可能是   1 或  4 或  7  , 注意 这里面不会返回10，因为是10是大端点
         *
         * @param start
         * @param stop
         * @param step
         * @return 假设 start < stop,  [start, stop) 区间内的随机整数
         *
         */
        static randrange(start, stop, step = 1) {
            if (step == 0)
                throw new Error('step 不能为 0');
            let width = stop - start;
            if (width == 0)
                throw new Error('没有可用的范围(' + start + ',' + stop + ')');
            if (width < 0)
                width = start - stop;
            let n = Math.floor((width + step - 1) / step);
            return Math.floor(this.random() * n) * step + Math.min(start, stop);
        }
        /**
         * 返回a 到 b之间的随机整数，包括 a 和 b
         * @param a
         * @param b
         * @return [a, b] 之间的随机整数
         *
         */
        static randint(a, b) {
            a = Math.floor(a);
            b = Math.floor(b);
            if (a > b)
                a++;
            else
                b++;
            return this.randrange(a, b);
        }
        /**
         * 返回 a - b之间的随机数，不包括  Math.max(a, b)
         * @param a
         * @param b
         * @return 假设 a < b, [a, b)
         */
        static randnum(a, b) {
            return this.random() * (b - a) + a;
        }
        /**
         * 打乱数组
         * @param array
         * @return
         */
        static shuffle(array) {
            array.sort(this._randomCompare);
            return array;
        }
        /**
         * 从序列中随机取一个元素
         * @param sequence 可以是 数组、 vector，等只要是有length属性，并且可以用数字索引获取元素的对象，
         *                 另外，字符串也是允许的。
         * @return 序列中的某一个元素
         *
         */
        static choice(sequence) {
            if (!sequence.hasOwnProperty("length"))
                throw new Error('无法对此对象执行此操作');
            let index = Math.floor(this.random() * sequence.length);
            if (sequence instanceof String)
                return String(sequence).charAt(index);
            else
                return sequence[index];
        }
        /**
         * 对列表中的元素进行随机采æ ?
         * <pre>
         * this.sample([1, 2, 3, 4, 5],  3)  // Choose 3 elements
         * [4, 1, 5]
         * </pre>
         * @param sequence
         * @param num
         * @return
         *
         */
        static sample(sequence, num) {
            let len = sequence.length;
            if (num <= 0 || len < num)
                throw new Error("采样数量不够");
            let selected = [];
            let indices = [];
            for (let i = 0; i < num; i++) {
                let index = Math.floor(this.random() * len);
                while (indices.indexOf(index) >= 0)
                    index = Math.floor(this.random() * len);
                selected.push(sequence[index]);
                indices.push(index);
            }
            return selected;
        }
        /**
         * 返回 0.0 - 1.0 之间的随机数，等同于 Math.random()
         * @return Math.random()
         *
         */
        static random() {
            return Math.random();
        }
        /**
         * 计算概率
         * @param    chance 概率
         * @return
         */
        static boolean(chance = .5) {
            return (this.random() < chance) ? true : false;
        }
        static _randomCompare(a, b) {
            return (this.random() > .5) ? 1 : -1;
        }
    }
    es.RandomUtils = RandomUtils;
})(es || (es = {}));
var es;
(function (es) {
    class RectangleExt {
        /**
         * 获取指定边的位置
         * @param rect
         * @param edge
         */
        static getSide(rect, edge) {
            switch (edge) {
                case es.Edge.top:
                    return rect.top;
                case es.Edge.bottom:
                    return rect.bottom;
                case es.Edge.left:
                    return rect.left;
                case es.Edge.right:
                    return rect.right;
            }
        }
        /**
         * 计算两个矩形的并集。结果将是一个包含其他两个的矩形。
         * @param first
         * @param point
         */
        static union(first, point) {
            let rect = new es.Rectangle(point.x, point.y, 0, 0);
            let result = new es.Rectangle();
            result.x = Math.min(first.x, rect.x);
            result.y = Math.min(first.y, rect.y);
            result.width = Math.max(first.right, rect.right) - result.x;
            result.height = Math.max(first.bottom, rect.bottom) - result.y;
            return result;
        }
        static getHalfRect(rect, edge) {
            switch (edge) {
                case es.Edge.top:
                    return new es.Rectangle(rect.x, rect.y, rect.width, rect.height / 2);
                case es.Edge.bottom:
                    return new es.Rectangle(rect.x, rect.y + rect.height / 2, rect.width, rect.height / 2);
                case es.Edge.left:
                    return new es.Rectangle(rect.x, rect.y, rect.width / 2, rect.height);
                case es.Edge.right:
                    return new es.Rectangle(rect.x + rect.width / 2, rect.y, rect.width / 2, rect.height);
            }
        }
        /**
         * 获取矩形的一部分，其宽度/高度的大小位于矩形的边缘，但仍然包含在其中。
         * @param rect
         * @param edge
         * @param size
         */
        static getRectEdgePortion(rect, edge, size = 1) {
            switch (edge) {
                case es.Edge.top:
                    return new es.Rectangle(rect.x, rect.y, rect.width, size);
                case es.Edge.bottom:
                    return new es.Rectangle(rect.x, rect.y + rect.height - size, rect.width, size);
                case es.Edge.left:
                    return new es.Rectangle(rect.x, rect.y, size, rect.height);
                case es.Edge.right:
                    return new es.Rectangle(rect.x + rect.width - size, rect.y, size, rect.height);
            }
        }
        static expandSide(rect, edge, amount) {
            amount = Math.abs(amount);
            switch (edge) {
                case es.Edge.top:
                    rect.y -= amount;
                    rect.height += amount;
                    break;
                case es.Edge.bottom:
                    rect.height += amount;
                    break;
                case es.Edge.left:
                    rect.x -= amount;
                    rect.width += amount;
                    break;
                case es.Edge.right:
                    rect.width += amount;
                    break;
            }
        }
        static contract(rect, horizontalAmount, verticalAmount) {
            rect.x += horizontalAmount;
            rect.y += verticalAmount;
            rect.width -= horizontalAmount * 2;
            rect.height -= verticalAmount * 2;
        }
        /**
         * 给定多边形的点，计算其边界
         * @param points
         */
        static boundsFromPolygonVector(points) {
            // 我们需要找到最小/最大的x/y值。
            let minX = Number.POSITIVE_INFINITY;
            let minY = Number.POSITIVE_INFINITY;
            let maxX = Number.NEGATIVE_INFINITY;
            let maxY = Number.NEGATIVE_INFINITY;
            for (let i = 0; i < points.length; i++) {
                let pt = points[i];
                if (pt.x < minX)
                    minX = pt.x;
                if (pt.x > maxX)
                    maxX = pt.x;
                if (pt.y < minY)
                    minY = pt.y;
                if (pt.y > maxY)
                    maxY = pt.y;
            }
            return this.fromMinMaxVector(new es.Vector2(minX, minY), new es.Vector2(maxX, maxY));
        }
        /**
         * 创建一个给定最小/最大点（左上角，右下角）的矩形
         * @param min
         * @param max
         */
        static fromMinMaxVector(min, max) {
            return new es.Rectangle(min.x, min.y, max.x - min.x, max.y - min.y);
        }
        /**
         * 返回一个跨越当前边界和提供的delta位置的Bounds
         * @param rect
         * @param deltaX
         * @param deltaY
         */
        static getSweptBroadphaseBounds(rect, deltaX, deltaY) {
            let broadphasebox = es.Rectangle.empty;
            broadphasebox.x = deltaX > 0 ? rect.x : rect.x + deltaX;
            broadphasebox.y = deltaY > 0 ? rect.y : rect.y + deltaY;
            broadphasebox.width = deltaX > 0 ? deltaX + rect.width : rect.width - deltaX;
            broadphasebox.height = deltaY > 0 ? deltaY + rect.height : rect.height - deltaY;
            return broadphasebox;
        }
        /**
         * 如果矩形发生碰撞，返回true
         * moveX和moveY将返回b1为避免碰撞而必须移动的移动量
         * @param rect
         * @param other
         * @param moveX
         * @param moveY
         */
        collisionCheck(rect, other, moveX, moveY) {
            moveX.value = moveY.value = 0;
            let l = other.x - (rect.x + rect.width);
            let r = (other.x + other.width) - rect.x;
            let t = other.y - (rect.y + rect.height);
            let b = (other.y + other.height) - rect.y;
            // 检验是否有碰撞
            if (l > 0 || r < 0 || t > 0 || b < 0)
                return false;
            // 求两边的偏移量
            moveX.value = Math.abs(l) < r ? l : r;
            moveY.value = Math.abs(t) < b ? t : b;
            // 只使用最小的偏移量
            if (Math.abs(moveX.value) < Math.abs(moveY.value))
                moveY.value = 0;
            else
                moveX.value = 0;
            return true;
        }
        /**
         * 计算两个矩形之间有符号的交点深度
         * @param rectA
         * @param rectB
         * @returns 两个相交的矩形之间的重叠量。
         * 这些深度值可以是负值，取决于矩形相交的边。
         * 这允许调用者确定正确的推送对象的方向，以解决碰撞问题。
         * 如果矩形不相交，则返回Vector2.zero。
         */
        static getIntersectionDepth(rectA, rectB) {
            // 计算半尺寸
            let halfWidthA = rectA.width / 2;
            let halfHeightA = rectA.height / 2;
            let halfWidthB = rectB.width / 2;
            let halfHeightB = rectB.height / 2;
            // 计算中心
            let centerA = new es.Vector2(rectA.left + halfWidthA, rectA.top + halfHeightA);
            let centerB = new es.Vector2(rectB.left + halfWidthB, rectB.top + halfHeightB);
            // 计算当前中心间的距离和最小非相交距离
            let distanceX = centerA.x - centerB.x;
            let distanceY = centerA.y - centerB.y;
            let minDistanceX = halfWidthA + halfWidthB;
            let minDistanceY = halfHeightA + halfHeightB;
            // 如果我们根本不相交，则返回(0，0)
            if (Math.abs(distanceX) >= minDistanceX || Math.abs(distanceY) >= minDistanceY)
                return es.Vector2.zero;
            // 计算并返回交叉点深度
            let depthX = distanceX > 0 ? minDistanceX - distanceX : -minDistanceX - distanceX;
            let depthY = distanceY > 0 ? minDistanceY - distanceY : -minDistanceY - distanceY;
            return new es.Vector2(depthX, depthY);
        }
        static getClosestPointOnBoundsToOrigin(rect) {
            let max = this.getMax(rect);
            let minDist = Math.abs(rect.location.x);
            let boundsPoint = new es.Vector2(rect.location.x, 0);
            if (Math.abs(max.x) < minDist) {
                minDist = Math.abs(max.x);
                boundsPoint.x = max.x;
                boundsPoint.y = 0;
            }
            if (Math.abs(max.y) < minDist) {
                minDist = Math.abs(max.y);
                boundsPoint.x = 0;
                boundsPoint.y = max.y;
            }
            if (Math.abs(rect.location.y) < minDist) {
                minDist = Math.abs(rect.location.y);
                boundsPoint.x = 0;
                boundsPoint.y = rect.location.y;
            }
            return boundsPoint;
        }
        /**
         * 将Rectangle中或上的最接近点返回给定点
         * @param rect
         * @param point
         */
        static getClosestPointOnRectangleToPoint(rect, point) {
            // 对于每个轴，如果该点在盒子外面，则将在盒子上，否则不理会它
            let res = es.Vector2.zero;
            res.x = es.MathHelper.clamp(point.x, rect.left, rect.right);
            res.y = es.MathHelper.clamp(point.y, rect.top, rect.bottom);
            return res;
        }
        /**
         * 获取矩形边界上与给定点最接近的点
         * @param rect
         * @param point
         */
        static getClosestPointOnRectangleBorderToPoint(rect, point) {
            // 对于每个轴，如果该点在盒子外面，则将在盒子上，否则不理会它
            let res = es.Vector2.zero;
            res.x = es.MathHelper.clamp(es.MathHelper.toInt(point.x), rect.left, rect.right);
            res.y = es.MathHelper.clamp(es.MathHelper.toInt(point.y), rect.top, rect.bottom);
            // 如果点在矩形内，我们需要将res推到边框，因为它将在矩形内 
            if (rect.contains(res.x, res.y)) {
                let dl = rect.x - rect.left;
                let dr = rect.right - res.x;
                let dt = res.y - rect.top;
                let db = rect.bottom - res.y;
                let min = Math.min(dl, dr, dt, db);
                if (min == dt)
                    res.y = rect.top;
                else if (min == db)
                    res.y = rect.bottom;
                else if (min == dl)
                    res.x == rect.left;
                else
                    res.x = rect.right;
            }
            return res;
        }
        static getMax(rect) {
            return new es.Vector2(rect.right, rect.bottom);
        }
        /**
         * 以Vector2的形式获取矩形的中心点
         * @param rect
         * @returns
         */
        static getCenter(rect) {
            return new es.Vector2(rect.x + rect.width / 2, rect.y + rect.height / 2);
        }
        /**
         * 给定多边形的点即可计算边界
         * @param points
         */
        static boundsFromPolygonPoints(points) {
            // 我们需要找到最小/最大x / y值 
            let minX = Number.POSITIVE_INFINITY;
            let minY = Number.POSITIVE_INFINITY;
            let maxX = Number.NEGATIVE_INFINITY;
            let maxY = Number.NEGATIVE_INFINITY;
            for (let i = 0; i < points.length; i++) {
                let pt = points[i];
                if (pt.x < minX)
                    minX = pt.x;
                if (pt.x > maxX)
                    maxX = pt.x;
                if (pt.y < minY)
                    minY = pt.y;
                if (pt.y > maxY)
                    maxY = pt.y;
            }
            return this.fromMinMaxVector(new es.Vector2(es.MathHelper.toInt(minX), es.MathHelper.toInt(minY)), new es.Vector2(es.MathHelper.toInt(maxX), es.MathHelper.toInt(maxY)));
        }
        static calculateBounds(rect, parentPosition, position, origin, scale, rotation, width, height) {
            if (rotation == 0) {
                rect.x = es.MathHelper.toInt(parentPosition.x + position.x - origin.x * scale.x);
                rect.y = es.MathHelper.toInt(parentPosition.y + position.y - origin.y * scale.y);
                rect.width = es.MathHelper.toInt(width * scale.x);
                rect.height = es.MathHelper.toInt(height * scale.y);
            }
            else {
                // 我们需要找到我们的绝对最小/最大值，并据此创建边界
                let worldPosX = parentPosition.x + position.x;
                let worldPosY = parentPosition.y + position.y;
                let tempMat;
                // 考虑到原点，将参考点设置为世界参考
                let transformMatrix = new es.Matrix2D();
                es.Matrix2D.createTranslation(-worldPosX - origin.x, -worldPosY - origin.y, transformMatrix);
                es.Matrix2D.createScale(scale.x, scale.y, tempMat);
                transformMatrix = transformMatrix.multiply(tempMat);
                es.Matrix2D.createRotation(rotation, tempMat);
                transformMatrix = transformMatrix.multiply(tempMat);
                es.Matrix2D.createTranslation(worldPosX, worldPosY, tempMat);
                transformMatrix = transformMatrix.multiply(tempMat);
                // TODO: 我们可以把世界变换留在矩阵中，避免在世界空间中得到所有的四个角
                let topLeft = new es.Vector2(worldPosX, worldPosY);
                let topRight = new es.Vector2(worldPosX + width, worldPosY);
                let bottomLeft = new es.Vector2(worldPosX, worldPosY + height);
                let bottomRight = new es.Vector2(worldPosX + width, worldPosY + height);
                es.Vector2Ext.transformR(topLeft, transformMatrix, topLeft);
                es.Vector2Ext.transformR(topRight, transformMatrix, topRight);
                es.Vector2Ext.transformR(bottomLeft, transformMatrix, bottomLeft);
                es.Vector2Ext.transformR(bottomRight, transformMatrix, bottomRight);
                // 找出最小值和最大值，这样我们就可以计算出我们的边界框。
                let minX = es.MathHelper.toInt(Math.min(topLeft.x, bottomRight.x, topRight.x, bottomLeft.x));
                let maxX = es.MathHelper.toInt(Math.max(topLeft.x, bottomRight.x, topRight.x, bottomLeft.x));
                let minY = es.MathHelper.toInt(Math.min(topLeft.y, bottomRight.y, topRight.y, bottomLeft.y));
                let maxY = es.MathHelper.toInt(Math.max(topLeft.y, bottomRight.y, topRight.y, bottomLeft.y));
                rect.location = new es.Vector2(minX, minY);
                rect.width = es.MathHelper.toInt(maxX - minX);
                rect.height = es.MathHelper.toInt(maxY - minY);
            }
        }
        /**
         * 缩放矩形
         * @param rect
         * @param scale
         */
        static scale(rect, scale) {
            rect.x = es.MathHelper.toInt(rect.x * scale.x);
            rect.y = es.MathHelper.toInt(rect.y * scale.y);
            rect.width = es.MathHelper.toInt(rect.width * scale.x);
            rect.height = es.MathHelper.toInt(rect.height * scale.y);
        }
        static translate(rect, vec) {
            rect.location.addEqual(vec);
        }
    }
    es.RectangleExt = RectangleExt;
})(es || (es = {}));
var es;
(function (es) {
    class TextureUtils {
        static premultiplyAlpha(pixels) {
            let b = pixels[0];
            for (let i = 0; i < pixels.length; i += 4) {
                if (b[i + 3] != 255) {
                    let alpha = b[i + 3] / 255;
                    b[i + 0] = b[i + 0] * alpha;
                    b[i + 1] = b[i + 1] * alpha;
                    b[i + 2] = b[i + 2] * alpha;
                }
            }
        }
    }
    es.TextureUtils = TextureUtils;
})(es || (es = {}));
var es;
(function (es) {
    class TypeUtils {
        static getType(obj) {
            return obj.constructor;
        }
    }
    es.TypeUtils = TypeUtils;
})(es || (es = {}));
var es;
(function (es) {
    class Vector2Ext {
        /**
         * 检查三角形是CCW还是CW
         * @param a
         * @param center
         * @param c
         */
        static isTriangleCCW(a, center, c) {
            return this.cross(center.sub(a), c.sub(center)) < 0;
        }
        static halfVector() {
            return new es.Vector2(0.5, 0.5);
        }
        /**
         * 计算二维伪叉乘点(Perp(u)， v)
         * @param u
         * @param v
         */
        static cross(u, v) {
            return u.y * v.x - u.x * v.y;
        }
        /**
         * 返回垂直于传入向量的向量
         * @param first
         * @param second
         */
        static perpendicular(first, second) {
            return new es.Vector2(-1 * (second.y - first.y), second.x - first.x);
        }
        /**
         * 将x/y值翻转，并将y反转，得到垂直于x/y的值
         * @param original
         */
        static perpendicularFlip(original) {
            return new es.Vector2(-original.y, original.x);
        }
        /**
         * 返回两个向量之间的角度，单位为度
         * @param from
         * @param to
         */
        static angle(from, to) {
            this.normalize(from);
            this.normalize(to);
            return Math.acos(es.MathHelper.clamp(from.dot(to), -1, 1)) * es.MathHelper.Rad2Deg;
        }
        /**
         * 返回以自度为中心的左右角度
         * @param self
         * @param left
         * @param right
         */
        static angleBetween(self, left, right) {
            const one = left.sub(self);
            const two = right.sub(self);
            return this.angle(one, two);
        }
        /**
         * 给定两条直线(ab和cd)，求交点
         * @param a
         * @param b
         * @param c
         * @param d
         * @param intersection
         */
        static getRayIntersection(a, b, c, d, intersection = es.Vector2.zero) {
            let dy1 = b.y - a.y;
            let dx1 = b.x - a.x;
            let dy2 = d.y - c.y;
            let dx2 = d.x - c.x;
            if (dy1 * dx2 == dy2 * dx1) {
                intersection.x = Number.NaN;
                intersection.y = Number.NaN;
                return false;
            }
            let x = ((c.y - a.y) * dx1 * dx2 + dy1 * dx2 * a.x - dy2 * dx1 * c.x) / (dy1 * dx2 - dy2 * dx1);
            let y = a.y + (dy1 / dx1) * (x - a.x);
            intersection.x = x;
            intersection.y = y;
            return true;
        }
        /**
         * Vector2的临时解决方案
         * 标准化把向量弄乱了
         * @param vec
         */
        static normalize(vec) {
            let magnitude = Math.sqrt((vec.x * vec.x) + (vec.y * vec.y));
            if (magnitude > es.MathHelper.Epsilon) {
                vec.divideScaler(magnitude);
            }
            else {
                vec.x = vec.y = 0;
            }
        }
        /**
         * 通过指定的矩阵对Vector2的数组中的向量应用变换，并将结果放置在另一个数组中。
         * @param sourceArray
         * @param sourceIndex
         * @param matrix
         * @param destinationArray
         * @param destinationIndex
         * @param length
         */
        static transformA(sourceArray, sourceIndex, matrix, destinationArray, destinationIndex, length) {
            for (let i = 0; i < length; i++) {
                let position = sourceArray[sourceIndex + i];
                let destination = destinationArray[destinationIndex + i];
                destination.x = (position.x * matrix.m11) + (position.y * matrix.m21) + matrix.m31;
                destination.y = (position.x * matrix.m12) + (position.y * matrix.m22) + matrix.m32;
                destinationArray[destinationIndex + i] = destination;
            }
        }
        /**
         * 创建一个新的Vector2，该Vector2包含了通过指定的Matrix进行的二维向量变换
         * @param position
         * @param matrix
         * @param result
         */
        static transformR(position, matrix, result = es.Vector2.zero) {
            let x = (position.x * matrix.m11) + (position.y * matrix.m21) + matrix.m31;
            let y = (position.x * matrix.m12) + (position.y * matrix.m22) + matrix.m32;
            result.x = x;
            result.y = y;
        }
        /**
         * 通过指定的矩阵对Vector2的数组中的所有向量应用变换，并将结果放到另一个数组中。
         * @param sourceArray
         * @param matrix
         * @param destinationArray
         */
        static transform(sourceArray, matrix, destinationArray) {
            this.transformA(sourceArray, 0, matrix, destinationArray, 0, sourceArray.length);
        }
        static round(vec) {
            return new es.Vector2(Math.round(vec.x), Math.round(vec.y));
        }
    }
    es.Vector2Ext = Vector2Ext;
})(es || (es = {}));
var es;
(function (es) {
    class Enumerable {
        /**
         * 在指定范围内生成一个整数序列。
         */
        static range(start, count) {
            let result = new es.List();
            while (count--) {
                result.add(start++);
            }
            return result;
        }
        /**
         * 生成包含一个重复值的序列。
         */
        static repeat(element, count) {
            let result = new es.List();
            while (count--) {
                result.add(element);
            }
            return result;
        }
    }
    es.Enumerable = Enumerable;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 检查传递的参数是否为对象
     */
    es.isObj = (x) => !!x && typeof x === 'object';
    /**
     * 创建一个否定谓词结果的函数
     */
    es.negate = (pred) => (...args) => !pred(...args);
    /**
     * 比较器助手
     */
    es.composeComparers = (previousComparer, currentComparer) => (a, b) => previousComparer(a, b) || currentComparer(a, b);
    es.keyComparer = (_keySelector, descending) => (a, b) => {
        const sortKeyA = _keySelector(a);
        const sortKeyB = _keySelector(b);
        if (sortKeyA > sortKeyB) {
            return !descending ? 1 : -1;
        }
        else if (sortKeyA < sortKeyB) {
            return !descending ? -1 : 1;
        }
        else {
            return 0;
        }
    };
})(es || (es = {}));
var es;
(function (es) {
    class List {
        /**
         * 默认为列表的元素
         */
        constructor(elements = []) {
            this._elements = elements;
        }
        /**
         * 在列表的末尾添加一个对象。
         */
        add(element) {
            this._elements.push(element);
        }
        /**
         * 将一个对象追加到列表的末尾。
         */
        append(element) {
            this.add(element);
        }
        /**
         * 在列表的开头添加一个对象。
         */
        prepend(element) {
            this._elements.unshift(element);
        }
        /**
         * 将指定集合的元素添加到列表的末尾。
         */
        addRange(elements) {
            this._elements.push(...elements);
        }
        /**
         * 使用指定的累加器函数将数组中的所有元素聚合成一个值。
         * @param accumulator 用于计算聚合值的累加器函数。
         * @param initialValue 可选参数，用于指定累加器函数的初始值。
         * @returns 聚合后的值。
         */
        aggregate(accumulator, initialValue) {
            return this._elements.reduce(accumulator, initialValue);
        }
        /**
         * 判断当前列表中的所有元素是否都满足指定条件
         * @param predicate 谓词函数，用于对列表中的每个元素进行评估
         * @returns {boolean} 如果列表中的所有元素都满足条件，则返回 true；否则返回 false
         */
        all(predicate) {
            // 调用 every 方法，传入谓词函数，检查列表中的所有元素是否都满足条件
            return this._elements.every(predicate);
        }
        /**
         * 该方法用于判断数组中是否存在元素
         * @param predicate 可选参数，用于检查是否有至少一个元素满足该函数
         * @returns 如果存在元素，返回 true；如果不存在元素，返回 false
         */
        any(predicate) {
            // 如果 predicate 函数提供了，则使用 some() 方法判断是否有任意元素满足该函数
            if (predicate) {
                return this._elements.some(predicate);
            }
            // 如果没有提供 predicate 函数，则检查数组的长度是否大于 0
            return this._elements.length > 0;
        }
        /**
         * 计算数组中所有元素的平均值
         * @param transform 可选参数，用于将数组中的每个元素转换成另外的值进行计算
         * @returns 数组的平均值
         */
        average(transform) {
            // 调用 sum() 方法计算数组中所有元素的和
            const sum = this.sum(transform);
            // 调用 count() 方法计算数组中元素的个数
            const count = this.count(transform);
            // 如果元素的个数为 0，则返回 NaN
            if (count === 0) {
                return NaN;
            }
            // 计算数组的平均值并返回
            return sum / count;
        }
        /**
         * 将序列的元素转换为指定的类型。
         */
        cast() {
            return new List(this._elements);
        }
        /**
         * 从列表中删除所有元素。
         */
        clear() {
            this._elements.length = 0;
        }
        /**
         * 连接两个序列。
         */
        concat(list) {
            return new List(this._elements.concat(list.toArray()));
        }
        /**
         * 确定一个元素是否在列表中。
         */
        contains(element) {
            return this.any(x => x === element);
        }
        count(predicate) {
            return predicate ? this.where(predicate).count() : this._elements.length;
        }
        /**
         * 返回当前数组，如果当前数组为空，则返回一个只包含默认值的新数组。
         * @param defaultValue 默认值。
         * @returns 当前数组，或者只包含默认值的新数组。
         */
        defaultIfEmpty(defaultValue) {
            return this.count() ? this : new List([defaultValue]);
        }
        /**
         * 根据指定的键选择器从数组中去除重复的元素。
         * @param keySelector 用于选择每个元素的键的函数。
         * @returns 去重后的数组。
         */
        distinctBy(keySelector) {
            const groups = this.groupBy(keySelector); // 根据键选择器对数组进行分组。
            return Object.keys(groups).reduce((res, key) => {
                res.add(groups[key][0]); // 将每组的第一个元素加入结果集合。
                return res;
            }, new List()); // 返回结果集合。
        }
        /**
         * 根据指定的索引获取数组中的元素
         * @param index 要获取的元素的索引
         * @returns 数组中的元素
         * @throws {Error} 如果索引小于 0 或大于等于数组长度，则抛出 "ArgumentOutOfRangeException" 异常。
         */
        elementAt(index) {
            if (index < this.count() && index >= 0) {
                return this._elements[index];
            }
            else {
                throw new Error('ArgumentOutOfRangeException: index is less than 0 or greater than or equal to the number of elements in source.');
            }
        }
        /**
         * 获取指定索引处的元素，如果索引超出数组范围，则返回 null。
         * @param index 索引。
         * @returns 指定索引处的元素，如果索引超出数组范围，则返回 null。
         */
        elementAtOrDefault(index) {
            return index < this.count() && index >= 0 ? this._elements[index] : null;
        }
        /**
         * 返回当前数组中不在指定数组中的元素集合。
         * @param source 指定数组。
         * @returns 当前数组中不在指定数组中的元素集合。
         */
        except(source) {
            return this.where(x => !source.contains(x));
        }
        first(predicate) {
            if (this.count()) {
                return predicate ? this.where(predicate).first() : this._elements[0];
            }
            else {
                throw new Error('InvalidOperationException: The source sequence is empty.');
            }
        }
        firstOrDefault(predicate) {
            return this.count(predicate) ? this.first(predicate) : undefined;
        }
        /**
         * 对数组中的每个元素执行指定的操作
         * @param action 要执行的操作，可以是一个函数或函数表达式
         */
        forEach(action) {
            return this._elements.forEach(action);
        }
        /**
         * 根据指定的键对数组元素进行分组，并返回一个包含分组结果的对象
         * @param grouper 指定的键，用于分组
         * @param mapper 可选参数，用于对分组后的每个元素进行转换的函数
         * @returns 包含分组结果的对象，其中键为分组后的键，值为分组后的元素组成的数组
         */
        groupBy(grouper, mapper = val => val) {
            const initialValue = {};
            return this.aggregate((ac, v) => {
                const key = grouper(v);
                const existingGroup = ac[key];
                const mappedValue = mapper(v);
                existingGroup
                    ? existingGroup.push(mappedValue)
                    : (ac[key] = [mappedValue]);
                return ac;
            }, initialValue);
        }
        /**
         * 将两个数组进行联接和分组操作
         * @param list 要联接的数组
         * @param key1 用于从第一个数组中选择分组键的函数
         * @param key2 用于从第二个数组中选择分组键的函数
         * @param result 用于将分组结果映射到输出元素的函数
         * @returns 经过联接和分组后的新数组
         */
        groupJoin(list, key1, key2, result) {
            // 使用 select() 方法对第一个数组中的每个元素进行分组操作
            return this.select(x => 
            // 调用 result 函数将分组结果映射到输出元素
            result(x, 
            // 使用 where() 方法从第二个数组中选择符合条件的元素，然后使用 List 对象进行包装
            list.where(z => key1(x) === key2(z))));
        }
        /**
         * 返回当前列表中指定元素的索引
         * @param element 要查找的元素
         * @returns {number} 元素在列表中的索引值，如果不存在，则返回 -1
         */
        indexOf(element) {
            // 调用 indexOf 方法，查找元素在列表中的索引值，如果不存在，则返回 -1
            return this._elements.indexOf(element);
        }
        /**
         * 在数组的指定位置插入一个元素
         * @param index 要插入元素的位置
         * @param element 要插入的元素
         * @throws 如果索引超出了数组的范围，则抛出异常
         */
        insert(index, element) {
            // 如果索引小于 0 或大于数组长度，则抛出异常
            if (index < 0 || index > this._elements.length) {
                throw new Error('Index is out of range.');
            }
            // 使用 splice() 方法在指定位置插入元素
            this._elements.splice(index, 0, element);
        }
        /**
         * 获取当前列表和另一个列表的交集
         * @param source 另一个列表
         * @returns {List<T>} 一个包含两个列表中相同元素的新列表对象
         */
        intersect(source) {
            // 调用 where 方法，传入一个谓词函数，返回一个包含两个列表中相同元素的新列表对象
            return this.where(x => source.contains(x));
        }
        /**
         * 将当前列表和另一个列表中的元素进行联接
         * @param list 另一个列表
         * @param key1 当前列表的键选择器函数
         * @param key2 另一个列表的键选择器函数
         * @param result 结果选择器函数
         * @returns {List<R>} 一个包含联接后元素的新列表对象
         */
        join(list, key1, key2, result) {
            // 对当前列表中的每个元素调用 selectMany 方法，并传入一个返回值为列表的函数，最终返回一个新的列表对象
            return this.selectMany(x => 
            // 调用 list.where 方法，传入一个谓词函数，返回一个包含与当前元素匹配的元素的新列表对象
            list.where(y => key2(y) === key1(x)).select(z => result(x, z)));
        }
        /**
         * 返回数组的最后一个元素或满足条件的最后一个元素
         * @param predicate 可选参数，用于筛选元素的函数
         * @returns 数组的最后一个元素或满足条件的最后一个元素
         * @throws 如果数组为空，则抛出异常
         */
        last(predicate) {
            // 如果数组不为空
            if (this.count()) {
                // 如果提供了 predicate 函数，则使用 where() 方法进行筛选，并递归调用 last() 方法
                if (predicate) {
                    return this.where(predicate).last();
                }
                else {
                    // 否则，直接返回数组的最后一个元素
                    return this._elements[this.count() - 1];
                }
            }
            else {
                // 如果数组为空，则抛出异常
                throw Error('InvalidOperationException: The source sequence is empty.');
            }
        }
        /**
         * 返回数组的最后一个元素或满足条件的最后一个元素，如果数组为空或没有满足条件的元素，则返回默认值 undefined
         * @param predicate 可选参数，用于筛选元素的函数
         * @returns 数组的最后一个元素或满足条件的最后一个元素，如果数组为空或没有满足条件的元素，则返回默认值 undefined
         */
        lastOrDefault(predicate) {
            // 如果数组中存在满足条件的元素，则返回最后一个满足条件的元素；否则，返回 undefined
            return this.count(predicate) ? this.last(predicate) : undefined;
        }
        /**
         * 返回数组中的最大值，也可以通过 selector 函数对数组元素进行转换后再求最大值
         * @param selector 可选参数，用于对数组元素进行转换的函数
         * @returns 数组中的最大值，或者通过 selector 函数对数组元素进行转换后求得的最大值
         */
        max(selector) {
            // 定义一个默认的转换函数 id，用于当 selector 参数未指定时使用
            const id = x => x;
            // 使用 map() 方法对数组元素进行转换，并使用 Math.max() 方法求得最大值
            return Math.max(...this._elements.map(selector || id));
        }
        /**
         * 返回数组中的最小值，也可以通过 selector 函数对数组元素进行转换后再求最小值
         * @param selector 可选参数，用于对数组元素进行转换的函数
         * @returns 数组中的最小值，或者通过 selector 函数对数组元素进行转换后求得的最小值
         */
        min(selector) {
            // 定义一个默认的转换函数 id，用于当 selector 参数未指定时使用
            const id = x => x;
            // 使用 map() 方法对数组元素进行转换，并使用 Math.min() 方法求得最小值
            return Math.min(...this._elements.map(selector || id));
        }
        /**
         * 根据指定的类型，筛选数组中的元素并返回一个新的数组
         * @param type 指定的类型
         * @returns 新的数组，其中包含了数组中所有指定类型的元素
         */
        ofType(type) {
            let typeName;
            // 使用 switch 语句根据指定类型设置 typeName 变量
            switch (type) {
                case Number:
                    typeName = typeof 0;
                    break;
                case String:
                    typeName = typeof '';
                    break;
                case Boolean:
                    typeName = typeof true;
                    break;
                case Function:
                    typeName = typeof function () {
                    }; // 空函数，不做任何操作
                    break;
                default:
                    typeName = null;
                    break;
            }
            // 如果 typeName 为 null，则使用 "instanceof" 运算符检查类型；否则，使用 typeof 运算符检查类型
            return typeName === null
                ? this.where(x => x instanceof type).cast()
                : this.where(x => typeof x === typeName).cast();
        }
        /**
         * 根据键按升序对序列中的元素进行排序。
         */
        orderBy(keySelector, comparer = es.keyComparer(keySelector, false)) {
            // tslint:disable-next-line: no-use-before-declare
            return new OrderedList(this._elements, comparer);
        }
        /**
         * 按照指定的键选择器和比较器，对列表元素进行降序排序
         * @param keySelector 用于选择排序键的函数
         * @param comparer 可选参数，用于比较元素的函数，如果未指定则使用 keySelector 和降序排序
         * @returns 排序后的新 List<T> 对象
         */
        orderByDescending(keySelector, comparer = es.keyComparer(keySelector, true)) {
            // 使用 Array.slice() 方法复制数组元素，避免修改原数组
            const elementsCopy = this._elements.slice();
            // 根据 keySelector 和 comparer 排序元素
            elementsCopy.sort(comparer);
            // 创建新的 OrderedList<T> 对象并返回
            return new OrderedList(elementsCopy, comparer);
        }
        /**
         * 在已经按照一个或多个条件排序的列表上，再按照一个新的条件进行排序
         * @param keySelector 用于选择新排序键的函数
         * @returns 排序后的新 List<T> 对象
         */
        thenBy(keySelector) {
            // 调用 orderBy 方法，使用 keySelector 函数对列表进行排序，并返回排序后的新列表
            return this.orderBy(keySelector);
        }
        /**
         * 对当前列表中的元素进行降序排序
         * @param keySelector 键选择器函数，用于对列表中的每个元素进行转换
         * @returns {List<T>} 一个包含排序后元素的新列表对象
         */
        thenByDescending(keySelector) {
            // 调用 orderByDescending 方法，传入键选择器函数，对当前列表中的元素进行降序排序，并返回一个新的列表对象
            return this.orderByDescending(keySelector);
        }
        /**
         * 从当前列表中删除指定元素
         * @param element 要删除的元素
         * @returns {boolean} 如果删除成功，则返回 true，否则返回 false
         */
        remove(element) {
            // 调用 indexOf 方法，查找元素在列表中的索引值
            const index = this.indexOf(element);
            // 如果元素存在，则调用 removeAt 方法将其从列表中删除，并返回 true，否则返回 false
            return index !== -1 ? (this.removeAt(index), true) : false;
        }
        /**
         * 从当前列表中删除满足指定条件的所有元素，并返回一个新的列表对象
         * @param predicate 谓词函数，用于对列表中的每个元素进行评估
         * @returns {List<T>} 一个包含不满足条件的元素的新列表对象
         */
        removeAll(predicate) {
            // 调用 negate 函数对谓词函数进行取反，然后使用 where 方法筛选出不满足条件的元素
            const elements = this.where(es.negate(predicate)).toArray();
            // 创建一个新的列表对象，包含不满足条件的元素，并返回该对象
            return new List(elements);
        }
        /**
         * 从当前列表中删除指定索引位置的元素
         * @param index 要删除的元素在列表中的索引值
         */
        removeAt(index) {
            // 使用 splice 方法，传入要删除的元素在列表中的索引值和要删除的元素个数，以从列表中删除指定索引位置的元素
            this._elements.splice(index, 1);
        }
        /**
         * 反转当前列表中的元素顺序
         * @returns {List<T>} 一个包含反转后元素的新列表对象
         */
        reverse() {
            // 调用 reverse 方法，反转当前列表中的元素顺序，并使用这些反转后的元素创建一个新的列表对象
            return new List(this._elements.reverse());
        }
        /**
         * 对数组中的每个元素进行转换，生成新的数组
         * @param selector 将数组中的每个元素转换成另外的值
         * @returns 新的 List 对象，包含转换后的元素
         */
        select(selector) {
            // 使用 map() 方法对数组中的每个元素进行转换，生成新的数组
            const transformedArray = this._elements.map(selector);
            // 将新数组封装成 List 对象并返回
            return new List(transformedArray);
        }
        /**
         * 对数组中的每个元素进行转换，并将多个新数组合并成一个数组
         * @param selector 将数组中的每个元素转换成新的数组
         * @returns 合并后的新数组
         */
        selectMany(selector) {
            // 使用 aggregate() 方法对数组中的每个元素进行转换，并将多个新数组合并成一个数组
            return this.aggregate((accumulator, _, index) => {
                // 获取当前元素对应的新数组
                const selectedArray = this.select(selector).elementAt(index);
                // 将新数组中的所有元素添加到累加器中
                return accumulator.addRange(selectedArray.toArray());
            }, new List());
        }
        /**
         * 比较当前列表和指定列表是否相等
         * @param list 要比较的列表对象
         * @returns {boolean} 如果列表相等，则返回 true，否则返回 false
         */
        sequenceEqual(list) {
            // 调用 all 方法，传入一个谓词函数，用于对当前列表中的每个元素进行评估
            // 在谓词函数中调用 contains 方法，传入当前元素和指定列表对象，以检查当前元素是否存在于指定列表中
            // 如果当前列表中的所有元素都存在于指定列表中，则返回 true，否则返回 false
            return this.all(e => list.contains(e));
        }
        /**
         * 从当前列表中获取一个满足指定条件的唯一元素
         * @param predicate 谓词函数，用于对列表中的每个元素进行评估
         * @returns {T} 列表中唯一满足指定条件的元素
         * @throws {Error} 如果列表中不恰好包含一个满足指定条件的元素，则抛出异常
         */
        single(predicate) {
            // 调用 count 方法，传入谓词函数，以获取满足指定条件的元素个数
            const count = this.count(predicate);
            // 如果元素个数不等于 1，则抛出异常
            if (count !== 1) {
                throw new Error('The collection does not contain exactly one element.');
            }
            // 调用 first 方法，传入谓词函数，以获取唯一元素并返回
            return this.first(predicate);
        }
        /**
         * 从当前列表中获取一个满足指定条件的唯一元素，如果没有元素满足条件，则返回默认值 undefined
         * @param predicate 谓词函数，用于对列表中的每个元素进行评估
         * @returns {T} 列表中唯一满足指定条件的元素，如果没有元素满足条件，则返回默认值 undefined
         */
        singleOrDefault(predicate) {
            // 如果元素个数为真值，则调用 single 方法，传入谓词函数，以获取唯一元素并返回
            // 否则，返回默认值 undefined
            return this.count(predicate) ? this.single(predicate) : undefined;
        }
        /**
         * 从 List 的开头跳过指定数量的元素并返回剩余元素的新 List。
         * 如果指定数量大于 List 中的元素数，则返回一个空的 List。
         * @param amount 要跳过的元素数量
         * @returns 新 List
         */
        skip(amount) {
            return new List(this._elements.slice(Math.max(0, amount)));
        }
        /**
         * 返回由源 List 中除了最后指定数量的元素之外的所有元素组成的 List。
         * @param amount 要跳过的元素数。
         * @returns 由源 List 中除了最后指定数量的元素之外的所有元素组成的 List。
         */
        skipLast(amount) {
            return new List(this._elements.slice(0, -Math.max(0, amount)));
        }
        /**
         * 从 List 的开头开始，跳过符合指定谓词的元素，并返回剩余元素。
         * @param predicate 用于测试每个元素是否应跳过的函数。
         * @returns 一个新 List，包含源 List 中从跳过元素之后到末尾的元素。
         */
        skipWhile(predicate) {
            // aggregate() 函数接收一个函数作为参数，将该函数应用于 List 的每个元素，并在每次应用后返回一个累加器的值。
            // 此处使用 aggregate() 函数来计算从 List 的开头开始符合指定谓词的元素个数。
            return this.skip(this.aggregate(ac => (predicate(this.elementAt(ac)) ? ++ac : ac), 0));
        }
        /**
         * 计算数组中所有元素的和
         * @param transform 可选参数，用于将数组中的每个元素转换成另外的值进行计算
         * @returns 数组的和
         */
        sum(transform) {
            // 如果提供了 transform 函数，则使用 select() 方法将每个元素转换成新的值，并调用 sum() 方法计算新数组的和
            if (transform) {
                return this.select(transform).sum();
            }
            // 如果没有提供 transform 函数，则使用 aggregate() 方法计算数组的和
            // 这里使用加号 + 将元素转换为数值型
            return this.aggregate((ac, v) => (ac += +v), 0);
        }
        /**
         * 从 List 的开头返回指定数量的连续元素。
         * @param amount 要返回的元素数量
         * @returns 一个新的 List，其中包含原始 List 中开头的指定数量的元素
         */
        take(amount) {
            // 使用 slice() 函数截取原始 List 中的指定数量的元素
            return new List(this._elements.slice(0, Math.max(0, amount)));
        }
        /**
         * 从列表末尾开始获取指定数量的元素，返回一个新的 List 对象。
         * @param amount 需要获取的元素数量。
         * @returns 一个新的 List 对象，包含从末尾开始的指定数量的元素。
         */
        takeLast(amount) {
            // Math.max(0, amount) 确保 amount 大于 0，如果 amount 是负数，则返回 0。
            // slice() 方法从数组的指定位置开始提取元素，返回一个新的数组。
            // 此处使用 slice() 方法返回 List 中末尾指定数量的元素。
            return new List(this._elements.slice(-Math.max(0, amount)));
        }
        /**
         * 从 List 的开头开始取出符合指定谓词的元素，直到不符合为止，返回这些元素组成的 List。
         * @param predicate 用于测试每个元素是否符合条件的函数。
         * @returns 符合条件的元素组成的 List。
         */
        takeWhile(predicate) {
            // aggregate() 函数接收一个函数作为参数，将该函数应用于 List 的每个元素，并在每次应用后返回一个累加器的值。
            // 此处使用 aggregate() 函数来计算从 List 的开头开始符合指定谓词的元素个数。
            return this.take(this.aggregate(ac => (predicate(this.elementAt(ac)) ? ++ac : ac), 0));
        }
        /**
         * 复制列表中的元素到一个新数组。
         */
        toArray() {
            return this._elements;
        }
        /**
         * 将数组转换为字典，根据指定的键和值对元素进行分组并返回一个新的字典
         * @param key 指定的键，用于分组
         * @param value 可选参数，指定的值，用于分组后的元素的值；如果未指定，则默认使用原始元素
         * @returns 分组后的元素组成的新的字典
         */
        toDictionary(key, value) {
            return this.aggregate((dicc, v, i) => {
                // 使用 select() 方法获取元素的键和值，并将其添加到字典中
                dicc[this.select(key)
                    .elementAt(i)
                    .toString()] = value ? this.select(value).elementAt(i) : v;
                // 将键和值添加到结果列表中
                dicc.add({
                    Key: this.select(key).elementAt(i),
                    Value: value ? this.select(value).elementAt(i) : v
                });
                return dicc;
            }, new List());
        }
        /**
         * 将数组转换为一个 Set 对象
         * @returns Set 对象，其中包含了数组中的所有元素
         */
        toSet() {
            let result = new Set();
            for (let x of this._elements)
                result.add(x);
            return result;
        }
        /**
         * 将数组转换为一个查找表，根据指定的键对元素进行分组并返回一个包含键值对的对象
         * @param keySelector 指定的键，用于分组
         * @param elementSelector 可选参数，指定的值，用于分组后的元素的值；如果未指定，则默认使用原始元素
         * @returns 包含键值对的对象，其中键为分组后的键，值为分组后的元素组成的数组
         */
        toLookup(keySelector, elementSelector) {
            return this.groupBy(keySelector, elementSelector);
        }
        /**
         * 根据指定的条件，筛选数组中的元素并返回一个新的数组
         * @param predicate 指定的条件
         * @returns 新的数组，其中包含了数组中所有满足条件的元素
         */
        where(predicate) {
            return new List(this._elements.filter(predicate));
        }
        /**
         * 根据指定的函数将两个数组合并成一个新的数组
         * @param list 要合并的数组
         * @param result 指定的函数，用于将两个元素合并为一个
         * @returns 合并后的新数组
         */
        zip(list, result) {
            if (list.count() < this.count()) {
                // 如果要合并的数组的长度小于当前数组的长度，就使用要合并的数组的长度进行循环迭代
                return list.select((x, y) => result(this.elementAt(y), x));
            }
            else {
                // 如果要合并的数组的长度大于或等于当前数组的长度，就使用当前数组的长度进行循环迭代
                return this.select((x, y) => result(x, list.elementAt(y)));
            }
        }
    }
    es.List = List;
    /**
     * 表示已排序的序列。该类的方法是通过使用延迟执行来实现的。
     * 即时返回值是一个存储执行操作所需的所有信息的对象。
     * 在通过调用对象的ToDictionary、ToLookup、ToList或ToArray方法枚举对象之前，不会执行由该方法表示的查询
     */
    class OrderedList extends List {
        constructor(elements, _comparer) {
            super(elements);
            this._comparer = _comparer;
            this._elements.sort(this._comparer); // 对元素数组进行排序
        }
        /**
         * 按键按升序对序列中的元素执行后续排序。
         * @override
         */
        thenBy(keySelector) {
            return new OrderedList(this._elements, es.composeComparers(this._comparer, es.keyComparer(keySelector, false)));
        }
        /**
         * 根据键值按降序对序列中的元素执行后续排序。
         * @override
         */
        thenByDescending(keySelector) {
            return new OrderedList(this._elements, es.composeComparers(this._comparer, es.keyComparer(keySelector, true)));
        }
    }
    es.OrderedList = OrderedList;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 一段的终点
     */
    class EndPoint {
        constructor() {
            this.position = es.Vector2.zero;
            this.begin = false;
            this.segment = null;
            this.angle = 0;
        }
    }
    es.EndPoint = EndPoint;
    class EndPointComparer {
        /**
         * 按角度对点进行排序的比较功能
         * @param a
         * @param b
         */
        compare(a, b) {
            // 按角度顺序移动
            if (a.angle > b.angle)
                return 1;
            if (a.angle < b.angle)
                return -1;
            // 但对于纽带，我们希望Begin节点在End节点之前
            if (!a.begin && b.begin)
                return 1;
            if (a.begin && !b.begin)
                return -1;
            return 0;
        }
    }
    es.EndPointComparer = EndPointComparer;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 表示可见性网格中的遮挡线段
     */
    class Segment {
        constructor() {
            this.p1 = null;
            this.p2 = null;
        }
    }
    es.Segment = Segment;
})(es || (es = {}));
///<reference path="../Collections/LinkList.ts" />
var es;
///<reference path="../Collections/LinkList.ts" />
(function (es) {
    /**
     * 类，它可以计算出一个网格，表示从给定的一组遮挡物的原点可以看到哪些区域。使用方法如下。
     *
     * - 调用 begin
     * - 添加任何遮挡物
     * - 调用end来获取可见度多边形。当调用end时，所有的内部存储都会被清空。
     */
    class VisibilityComputer {
        constructor(origin, radius) {
            /**
             *  在近似圆的时候要用到的线的总数。只需要一个180度的半球，所以这将是近似该半球的线段数
             */
            this.lineCountForCircleApproximation = 10;
            this._radius = 0;
            this._origin = es.Vector2.zero;
            this._isSpotLight = false;
            this._spotStartAngle = 0;
            this._spotEndAngle = 0;
            this._endPoints = [];
            this._segments = [];
            this._origin = origin;
            this._radius = radius;
            this._radialComparer = new es.EndPointComparer();
        }
        /**
         * 增加了一个对撞机作为PolyLight的遮蔽器
         * @param collider
         */
        addColliderOccluder(collider) {
            // 特殊情况下，BoxColliders没有旋转
            if (collider instanceof es.BoxCollider && collider.rotation == 0) {
                this.addSquareOccluder(collider.bounds);
                return;
            }
            if (collider instanceof es.PolygonCollider) {
                let poly = collider.shape;
                for (let i = 0; i < poly.points.length; i++) {
                    let firstIndex = i - 1;
                    if (i == 0)
                        firstIndex += poly.points.length;
                    this.addLineOccluder(es.Vector2.add(poly.points[firstIndex], poly.position), es.Vector2.add(poly.points[i], poly.position));
                }
            }
            else if (collider instanceof es.CircleCollider) {
                this.addCircleOccluder(collider.absolutePosition, collider.radius);
            }
        }
        /**
         * 增加了一个圆形的遮挡器
         * @param position
         * @param radius
         */
        addCircleOccluder(position, radius) {
            let dirToCircle = position.sub(this._origin);
            let angle = Math.atan2(dirToCircle.y, dirToCircle.x);
            let stepSize = Math.PI / this.lineCountForCircleApproximation;
            let startAngle = angle + es.MathHelper.PiOver2;
            let lastPt = es.MathHelper.angleToVector(startAngle, radius).addEqual(position);
            for (let i = 1; i < this.lineCountForCircleApproximation; i++) {
                let nextPt = es.MathHelper.angleToVector(startAngle + i * stepSize, radius).addEqual(position);
                this.addLineOccluder(lastPt, nextPt);
                lastPt = nextPt;
            }
        }
        /**
         * 增加一个线型遮挡器
         * @param p1
         * @param p2
         */
        addLineOccluder(p1, p2) {
            this.addSegment(p1, p2);
        }
        /**
         * 增加一个方形的遮挡器
         * @param bounds
         */
        addSquareOccluder(bounds) {
            let tr = new es.Vector2(bounds.right, bounds.top);
            let bl = new es.Vector2(bounds.left, bounds.bottom);
            let br = new es.Vector2(bounds.right, bounds.bottom);
            this.addSegment(bounds.location, tr);
            this.addSegment(tr, br);
            this.addSegment(br, bl);
            this.addSegment(bl, bounds.location);
        }
        /**
         * 添加一个段，第一个点在可视化中显示，但第二个点不显示。
         * 每个端点都是两个段的一部分，但我们希望只显示一次
         * @param p1
         * @param p2
         */
        addSegment(p1, p2) {
            let segment = new es.Segment();
            let endPoint1 = new es.EndPoint();
            let endPoint2 = new es.EndPoint();
            endPoint1.position = p1;
            endPoint1.segment = segment;
            endPoint2.position = p2;
            endPoint2.segment = segment;
            segment.p1 = endPoint1;
            segment.p2 = endPoint2;
            this._segments.push(segment);
            this._endPoints.push(endPoint1);
            this._endPoints.push(endPoint2);
        }
        /**
         * 移除所有的遮挡物
         */
        clearOccluders() {
            this._segments.length = 0;
            this._endPoints.length = 0;
        }
        /**
         * 为计算机计算当前的聚光做好准备
         * @param origin
         * @param radius
         */
        begin(origin, radius) {
            this._origin = origin;
            this._radius = radius;
            this._isSpotLight = false;
        }
        /**
         * 计算可见性多边形，并返回三角形扇形的顶点（减去中心顶点）。返回的数组来自ListPool
         */
        end() {
            let output = es.ListPool.obtain(es.Vector2);
            this.updateSegments();
            this._endPoints.sort(this._radialComparer.compare);
            let currentAngle = 0;
            // 在扫描开始时，我们想知道哪些段是活动的。
            // 最简单的方法是先进行一次段的收集，然后再进行一次段的收集和处理。
            // 然而，更有效的方法是通过所有的段，找出哪些段与最初的扫描线相交，然后对它们进行分类
            for (let pass = 0; pass < 2; pass++) {
                for (let p of this._endPoints) {
                    let currentOld = VisibilityComputer._openSegments.size() == 0 ? null : VisibilityComputer._openSegments.getHead().element;
                    if (p.begin) {
                        // 在列表中的正确位置插入
                        let node = VisibilityComputer._openSegments.getHead();
                        while (node != null && this.isSegmentInFrontOf(p.segment, node.element, this._origin))
                            node = node.next;
                        if (node == null)
                            VisibilityComputer._openSegments.push(p.segment);
                        else
                            VisibilityComputer._openSegments.insert(p.segment, VisibilityComputer._openSegments.indexOf(node.element));
                    }
                    else {
                        VisibilityComputer._openSegments.remove(p.segment);
                    }
                    let currentNew = null;
                    if (VisibilityComputer._openSegments.size() != 0)
                        currentNew = VisibilityComputer._openSegments.getHead().element;
                    if (currentOld != currentNew) {
                        if (pass == 1) {
                            if (!this._isSpotLight || (VisibilityComputer.between(currentAngle, this._spotStartAngle, this._spotEndAngle) &&
                                VisibilityComputer.between(p.angle, this._spotStartAngle, this._spotEndAngle)))
                                this.addTriangle(output, currentAngle, p.angle, currentOld);
                        }
                        currentAngle = p.angle;
                    }
                }
            }
            VisibilityComputer._openSegments.clear();
            this.clearOccluders();
            return output;
        }
        addTriangle(triangles, angle1, angle2, segment) {
            let p1 = this._origin.clone();
            let p2 = new es.Vector2(this._origin.x + Math.cos(angle1), this._origin.y + Math.sin(angle1));
            let p3 = es.Vector2.zero;
            let p4 = es.Vector2.zero;
            if (segment != null) {
                // 将三角形停在相交线段上
                p3.x = segment.p1.position.x;
                p3.y = segment.p1.position.y;
                p4.x = segment.p2.position.x;
                p4.y = segment.p2.position.y;
            }
            else {
                p3.x = this._origin.x + Math.cos(angle1) * this._radius * 2;
                p3.y = this._origin.y + Math.sin(angle1) * this._radius * 2;
                p4.x = this._origin.x + Math.cos(angle2) * this._radius * 2;
                p4.y = this._origin.y + Math.sin(angle2) * this._radius * 2;
            }
            let pBegin = VisibilityComputer.lineLineIntersection(p3, p4, p1, p2);
            p2.x = this._origin.x + Math.cos(angle2);
            p2.y = this._origin.y + Math.sin(angle2);
            let pEnd = VisibilityComputer.lineLineIntersection(p3, p4, p1, p2);
            triangles.push(pBegin);
            triangles.push(pEnd);
        }
        /**
         * 计算直线p1-p2与p3-p4的交点
         * @param p1
         * @param p2
         * @param p3
         * @param p4
         */
        static lineLineIntersection(p1, p2, p3, p4) {
            let s = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x))
                / ((p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y));
            return new es.Vector2(p1.x + s * (p2.x - p1.x), p1.y + s * (p2.y - p1.y));
        }
        static between(value, min, max) {
            value = (360 + (value % 360)) % 360;
            min = (3600000 + min) % 360;
            max = (3600000 + max) % 360;
            if (min < max)
                return min <= value && value <= max;
            return min <= value || value <= max;
        }
        /**
         * 辅助函数，用于沿外周线构建分段，以限制光的半径。
         */
        loadRectangleBoundaries() {
            this.addSegment(new es.Vector2(this._origin.x - this._radius, this._origin.y - this._radius), new es.Vector2(this._origin.x + this._radius, this._origin.y - this._radius));
            this.addSegment(new es.Vector2(this._origin.x - this._radius, this._origin.y + this._radius), new es.Vector2(this._origin.x + this._radius, this._origin.y + this._radius));
            this.addSegment(new es.Vector2(this._origin.x - this._radius, this._origin.y - this._radius), new es.Vector2(this._origin.x - this._radius, this._origin.y + this._radius));
            this.addSegment(new es.Vector2(this._origin.x + this._radius, this._origin.y - this._radius), new es.Vector2(this._origin.x + this._radius, this._origin.y + this._radius));
        }
        /**
         * 助手：我们知道a段在b的前面吗？实现不反对称（也就是说，isSegmentInFrontOf(a, b) != (!isSegmentInFrontOf(b, a))）。
         * 另外要注意的是，在可见性算法中，它只需要在有限的一组情况下工作，我不认为它能处理所有的情况。
         * 见http://www.redblobgames.com/articles/visibility/segment-sorting.html
         * @param a
         * @param b
         * @param relativeTo
         */
        isSegmentInFrontOf(a, b, relativeTo) {
            // 注意：我们稍微缩短了段，所以在这个算法中，端点的交点（共同）不计入交点。
            let a1 = VisibilityComputer.isLeftOf(a.p2.position, a.p1.position, VisibilityComputer.interpolate(b.p1.position, b.p2.position, 0.01));
            let a2 = VisibilityComputer.isLeftOf(a.p2.position, a.p1.position, VisibilityComputer.interpolate(b.p2.position, b.p1.position, 0.01));
            let a3 = VisibilityComputer.isLeftOf(a.p2.position, a.p1.position, relativeTo);
            let b1 = VisibilityComputer.isLeftOf(b.p2.position, b.p1.position, VisibilityComputer.interpolate(a.p1.position, a.p2.position, 0.01));
            let b2 = VisibilityComputer.isLeftOf(b.p2.position, b.p1.position, VisibilityComputer.interpolate(a.p2.position, a.p1.position, 0.01));
            let b3 = VisibilityComputer.isLeftOf(b.p2.position, b.p1.position, relativeTo);
            // 注：考虑A1-A2这条线。如果B1和B2都在一条边上，而relativeTo在另一条边上，那么A就在观看者和B之间。
            if (b1 == b2 && b2 != b3)
                return true;
            if (a1 == a2 && a2 == a3)
                return true;
            if (a1 == a2 && a2 != a3)
                return false;
            if (b1 == b2 && b2 == b3)
                return false;
            // 如果A1 !=A2，B1 !=B2，那么我们就有一个交点。
            // 一个更稳健的实现是在交叉点上分割段，使一部分段在前面，一部分段在后面，但无论如何我们不应该有重叠的碰撞器，所以这不是太重要
            return false;
            // 注意：以前的实现方式是a.d < b.d.，这比较简单，但当段的大小不一样时，就麻烦了。
            // 如果你是在一个网格上，而且段的大小相似，那么使用距离将是一个更简单和更快的实现。
        }
        /**
         * 返回略微缩短的向量：p * (1 - f) + q * f
         * @param p
         * @param q
         * @param f
         */
        static interpolate(p, q, f) {
            return new es.Vector2(p.x * (1 - f) + q.x * f, p.y * (1 - f) + q.y * f);
        }
        /**
         * 返回点是否在直线p1-p2的 "左边"。
         * @param p1
         * @param p2
         * @param point
         */
        static isLeftOf(p1, p2, point) {
            let cross = (p2.x - p1.x) * (point.y - p1.y)
                - (p2.y - p1.y) * (point.x - p1.x);
            return cross < 0;
        }
        /**
         * 处理片段，以便我们稍后对它们进行分类
         */
        updateSegments() {
            for (let segment of this._segments) {
                // 注：未来的优化：我们可以记录象限和y/x或x/y比率，并按（象限、比率）排序，而不是调用atan2。
                // 参见<https://github.com/mikolalysenko/compare-slope>，有一个库可以做到这一点
                segment.p1.angle = Math.atan2(segment.p1.position.y - this._origin.y, segment.p1.position.x - this._origin.x);
                segment.p2.angle = Math.atan2(segment.p2.position.y - this._origin.y, segment.p2.position.x - this._origin.x);
                //  Pi和Pi之间的映射角度
                let dAngle = segment.p2.angle - segment.p1.angle;
                if (dAngle <= -Math.PI)
                    dAngle += Math.PI * 2;
                if (dAngle > Math.PI)
                    dAngle -= Math.PI * 2;
                segment.p1.begin = (dAngle > 0);
                segment.p2.begin = !segment.p1.begin;
            }
            // 如果我们有一个聚光灯，我们需要存储前两个段的角度。
            // 这些是光斑的边界，我们将用它们来过滤它们之外的任何顶点。
            if (this._isSpotLight) {
                this._spotStartAngle = this._segments[0].p2.angle;
                this._spotEndAngle = this._segments[1].p2.angle;
            }
        }
    }
    VisibilityComputer._cornerCache = [];
    VisibilityComputer._openSegments = new es.LinkedList();
    es.VisibilityComputer = VisibilityComputer;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 私有类隐藏ITimer的实现
     */
    class Timer {
        constructor() {
            this._timeInSeconds = 0;
            this._repeats = false;
            this._isDone = false;
            this._elapsedTime = 0;
        }
        getContext() {
            return this.context;
        }
        reset() {
            this._elapsedTime = 0;
        }
        stop() {
            this._isDone = true;
        }
        tick() {
            // 如果stop在tick之前被调用，那么isDone将为true，我们不应该再做任何事情
            if (!this._isDone && this._elapsedTime > this._timeInSeconds) {
                this._elapsedTime -= this._timeInSeconds;
                this._onTime(this);
                if (!this._isDone && !this._repeats)
                    this._isDone = true;
            }
            this._elapsedTime += es.Time.deltaTime;
            return this._isDone;
        }
        initialize(timeInsSeconds, repeats, context, onTime) {
            this._timeInSeconds = timeInsSeconds;
            this._repeats = repeats;
            this.context = context;
            this._onTime = onTime.bind(context);
        }
        /**
         * 空出对象引用，以便在js需要时GC可以清理它们的引用
         */
        unload() {
            this.context = null;
            this._onTime = null;
        }
    }
    es.Timer = Timer;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 允许动作的延迟和重复执行
     */
    class TimerManager extends es.GlobalManager {
        constructor() {
            super(...arguments);
            this._timers = [];
        }
        update() {
            for (let i = this._timers.length - 1; i >= 0; i--) {
                if (this._timers[i].tick()) {
                    this._timers[i].unload();
                    this._timers.splice(i, 1);
                }
            }
        }
        /**
         * 调度一个一次性或重复的计时器，该计时器将调用已传递的动作
         * @param timeInSeconds
         * @param repeats
         * @param context
         * @param onTime
         */
        schedule(timeInSeconds, repeats, context, onTime) {
            let timer = new es.Timer();
            timer.initialize(timeInSeconds, repeats, context, onTime);
            this._timers.push(timer);
            return timer;
        }
    }
    es.TimerManager = TimerManager;
})(es || (es = {}));

declare module es {
    /**
     *  全局核心类
     */
    class Core {
        /**
         * 核心发射器。只发出核心级别的事件
         */
        static emitter: Emitter<CoreEvents>;
        static paused: boolean;
        /**
         * 是否启用调试渲染
         */
        static debugRenderEndabled: boolean;
        /**
         * 简化对内部类的全局内容实例的访问
         */
        private static _instance;
        /**
         * 用于确定是否应该使用EntitySystems
         */
        static entitySystemsEnabled: boolean;
        /**
         * 是否正在debug模式
         * 仅允许在create时进行更改
         */
        readonly debug: boolean;
        _nextScene: Scene;
        _sceneTransition: SceneTransition;
        /**
         * 用于凝聚GraphicsDeviceReset事件
         */
        _graphicsDeviceChangeTimer: ITimer;
        /**
         * 全局访问系统
         */
        _globalManagers: GlobalManager[];
        _coroutineManager: CoroutineManager;
        _timerManager: TimerManager;
        private constructor();
        /**
         * 提供对单例/游戏实例的访问
         * @constructor
         */
        static get Instance(): Core;
        _frameCounterElapsedTime: number;
        _frameCounter: number;
        _totalMemory: number;
        _titleMemory: (totalMemory: number, frameCounter: number) => void;
        _scene: Scene;
        /**
         * 当前活动的场景。注意，如果设置了该设置，在更新结束之前场景实际上不会改变
         */
        static get scene(): Scene;
        /**
         * 当前活动的场景。注意，如果设置了该设置，在更新结束之前场景实际上不会改变
         * @param value
         */
        static set scene(value: Scene);
        /**
         * `Core`类的静态方法，用于创建`Core`的实例。
         * @param debug {boolean} 是否为调试模式，默认为`true`
         * @returns {Core} `Core`的实例
         */
        static create(debug?: boolean): Core;
        /**
         * 添加一个全局管理器对象，它的更新方法将调用场景前的每一帧。
         * @param manager
         */
        static registerGlobalManager(manager: es.GlobalManager): void;
        /**
         * 删除全局管理器对象
         * @param manager
         */
        static unregisterGlobalManager(manager: GlobalManager): void;
        /**
         * 获取指定类型的全局管理器实例
         * @param type 管理器类型的构造函数
         * @returns 指定类型的全局管理器实例，如果找不到则返回 null
         */
        static getGlobalManager<T extends GlobalManager>(type: new (...args: any[]) => T): T;
        /**
         * 临时运行SceneTransition，允许一个场景平滑过渡到另一个场景，并具有自定义效果
         * @param sceneTransition
         */
        static startSceneTransition<T extends SceneTransition>(sceneTransition: T): T;
        /**
         * 启动一个coroutine。Coroutine可以将number延时几秒或延时到其他startCoroutine.Yielding
         * null将使coroutine在下一帧被执行。
         * @param enumerator
         */
        static startCoroutine(enumerator: any): ICoroutine;
        /**
         * 调度一个一次性或重复的计时器，该计时器将调用已传递的动作
         * @param timeInSeconds
         * @param repeats
         * @param context
         * @param onTime
         */
        static schedule(timeInSeconds: number, repeats: boolean, context: any, onTime: (timer: ITimer) => void): Timer;
        startDebugDraw(): void;
        /**
         * 在一个场景结束后，下一个场景开始之前调用
         */
        onSceneChanged(): void;
        protected initialize(): void;
        /**
         * `Core` 类的受保护的 `update` 方法，用于更新游戏状态。
         * @param currentTime 当前时间戳，单位为毫秒，默认值为-1。
         */
        protected update(currentTime?: number): void;
        protected draw(): void;
    }
}
declare module es {
    enum LogType {
        error = 0,
        warn = 1,
        log = 2,
        info = 3,
        trace = 4
    }
    class Debug {
        /**
         * 如果条件为true，则在控制台中以警告方式打印消息。
         * @param condition 是否应该打印消息的条件
         * @param format 要打印的消息格式
         * @param args 与消息格式相对应的参数列表
         */
        static warnIf(condition: boolean, format: string, ...args: any[]): void;
        /**
         * 在控制台中以警告方式打印消息。
         * @param format 要打印的消息格式
         * @param args 与消息格式相对应的参数列表
         */
        static warn(format: string, ...args: any[]): void;
        /**
         * 在控制台中以错误方式打印消息。
         * @param format 要打印的消息格式
         * @param args 与消息格式相对应的参数列表
         */
        static error(format: string, ...args: any[]): void;
        /**
         * 在控制台中以标准日志方式打印消息。
         * @param type 要打印的日志类型
         * @param format 要打印的消息格式
         * @param args 与消息格式相对应的参数列表
         */
        static log(type: LogType, format: string, ...args: any[]): void;
    }
}
declare module es {
    /**
     * 我们在这里存储了各种系统的默认颜色，如对撞机调试渲染、Debug.drawText等。
     * 命名方式尽可能采用CLASS-THING，以明确它的使用位置
     */
    class DebugDefault {
        static debugText: number;
        static colliderBounds: number;
        static colliderEdge: number;
        static colliderPosition: number;
        static colliderCenter: number;
        static renderableBounds: number;
        static renderableCenter: number;
        static verletParticle: number;
        static verletConstraintEdge: number;
    }
}
declare module es {
    class Insist {
        static fail(message?: string, ...args: any[]): void;
        static isTrue(condition: boolean, message?: string, ...args: any[]): void;
        static isFalse(condition: boolean, message?: string, ...args: any[]): void;
        static isNull(obj: any, message?: string, ...args: any[]): void;
        static isNotNull(obj: any, message?: string, ...args: any[]): void;
        static areEqual(first: any, second: any, message: string, ...args: any[]): void;
        static areNotEqual(first: any, second: any, message: string, ...args: any[]): void;
    }
}
declare module es {
    class DebugConsole {
        static Instance: DebugConsole;
    }
}
declare module es {
    /**
     * 执行顺序
     *  - onAddedToEntity
     *  - OnEnabled
     *
     *  删除执行顺序
     *      - onRemovedFromEntity
     */
    abstract class Component {
        static _idGenerator: number;
        /**
         * 此组件的唯一标识
         */
        readonly id: number;
        /**
         * 此组件附加的实体
         */
        entity: Entity;
        constructor();
        /**
         * 快速访问 this.entity.transform
         */
        get transform(): Transform;
        private _enabled;
        /**
         * 如果组件和实体都已启用，则为。当启用该组件时，将调用该组件的生命周期方法。状态的改变会导致调用onEnabled/onDisable。
         */
        get enabled(): boolean;
        /**
         * 如果组件和实体都已启用，则为。当启用该组件时，将调用该组件的生命周期方法。状态的改变会导致调用onEnabled/onDisable。
         * @param value
         */
        set enabled(value: boolean);
        private _updateOrder;
        /** 更新此实体上组件的顺序 */
        get updateOrder(): number;
        /** 更新此实体上组件的顺序 */
        set updateOrder(value: number);
        /**
         * 当此组件已分配其实体，但尚未添加到实体的活动组件列表时调用。有用的东西，如物理组件，需要访问转换来修改碰撞体的属性。
         */
        initialize(): void;
        /**
         * 在提交所有挂起的组件更改后，将该组件添加到场景时调用。此时，设置了实体字段和实体。场景也设定好了。
         */
        onAddedToEntity(): void;
        /**
         * 当此组件从其实体中移除时调用。在这里做所有的清理工作。
         */
        onRemovedFromEntity(): void;
        /**
         * 当实体的位置改变时调用。这允许组件知道它们由于父实体的移动而移动了。
         * @param comp
         */
        onEntityTransformChanged(comp: ComponentTransform): void;
        /**
         *当父实体或此组件启用时调用
         */
        onEnabled(): void;
        /**
         * 禁用父实体或此组件时调用
         */
        onDisabled(): void;
        setEnabled(isEnabled: boolean): this;
        setUpdateOrder(updateOrder: number): this;
        /**
         * 添加组件
         * @param component 要添加的组件实例
         * @returns 返回添加的组件实例
         */
        addComponent<T extends Component>(component: T): T;
        /**
         * 获取组件
         * @param type 组件类型
         * @returns 返回获取到的组件实例
         */
        getComponent<T extends Component>(type: new (...args: any[]) => T): T;
        /**
         * 获取一组指定类型的组件
         * @param typeName 组件类型名
         * @param componentList 可选参数，存储组件实例的数组
         * @returns 返回指定类型的组件实例数组
         */
        getComponents(typeName: any, componentList?: any[]): any[];
        /**
         * 判断实体是否包含指定类型的组件
         * @param type 组件类型
         * @returns 如果实体包含指定类型的组件，返回 true，否则返回 false。
         */
        hasComponent(type: new (...args: any[]) => Component): boolean;
        /**
         * 删除组件
         * @param component 可选参数，要删除的组件实例。如果未指定该参数，则删除当前实例上的组件。
         */
        removeComponent(component?: Component): void;
    }
}
declare module es {
    class ComponentType {
        static INDEX: number;
        private index_;
        private type_;
        constructor(type: Class, index?: number);
        getName(): string;
        getIndex(): number;
        toString(): string;
    }
}
declare module es {
    enum CoreEvents {
        /**
         * 当场景发生变化时触发
         */
        sceneChanged = 0,
        /**
         * 每帧更新事件
         */
        frameUpdated = 1,
        /**
         * 当渲染发生时触发
         */
        renderChanged = 2
    }
}
declare module es {
    class EntityComparer implements IComparer<Entity> {
        compare(self: Entity, other: Entity): number;
    }
    class Entity implements IEqualityComparable {
        static entityComparer: IComparer<Entity>;
        /**
         * 当前实体所属的场景
         */
        scene: Scene;
        /**
         * 实体名称。用于在场景范围内搜索实体
         */
        name: string;
        /**
         * 此实体的唯一标识
         */
        readonly id: number;
        /**
         * 封装实体的位置/旋转/缩放，并允许设置一个高层结构
         */
        readonly transform: Transform;
        /**
         * 实体的渲染对象
         * */
        readonly stageObj: Laya.Sprite;
        /**
         * 当前附加到此实体的所有组件的列表
         */
        readonly components: ComponentList;
        /**
         * 指定应该调用这个entity update方法的频率。1表示每一帧，2表示每一帧，以此类推
         */
        updateInterval: number;
        componentBits: Bits;
        constructor(name: string, id: number);
        _isDestroyed: boolean;
        /**
         * 如果调用了destroy，那么在下一次处理实体之前这将一直为true
         */
        get isDestroyed(): boolean;
        private _tag;
        /**
         * 你可以随意使用。稍后可以使用它来查询场景中具有特定标记的所有实体
         */
        get tag(): number;
        /**
         * 你可以随意使用。稍后可以使用它来查询场景中具有特定标记的所有实体
         * @param value
         */
        set tag(value: number);
        private _enabled;
        /**
         * 启用/禁用实体。当禁用碰撞器从物理系统和组件中移除时，方法将不会被调用
         */
        get enabled(): boolean;
        /**
         * 启用/禁用实体。当禁用碰撞器从物理系统和组件中移除时，方法将不会被调用
         * @param value
         */
        set enabled(value: boolean);
        private _updateOrder;
        /**
         * 更新此实体的顺序。updateOrder还用于对scene.entities上的标签列表进行排序
         */
        get updateOrder(): number;
        /**
         * 更新此实体的顺序。updateOrder还用于对scene.entities上的标签列表进行排序
         * @param value
         */
        set updateOrder(value: number);
        get parent(): Transform;
        set parent(value: Transform);
        get childCount(): number;
        get position(): Vector2;
        set position(value: Vector2);
        get localPosition(): Vector2;
        set localPosition(value: Vector2);
        get rotation(): number;
        set rotation(value: number);
        get rotationDegrees(): number;
        set rotationDegrees(value: number);
        get localRotation(): number;
        set localRotation(value: number);
        get localRotationDegrees(): number;
        set localRotationDegrees(value: number);
        get scale(): Vector2;
        set scale(value: Vector2);
        get localScale(): Vector2;
        set localScale(value: Vector2);
        get worldInverseTransform(): Matrix2D;
        get localToWorldTransform(): Matrix2D;
        get worldToLocalTransform(): Matrix2D;
        onTransformChanged(comp: ComponentTransform): void;
        setParent(parent: Entity): any;
        setParent(parent: Transform): any;
        setPosition(x: number, y: number): this;
        setLocalPosition(localPosition: Vector2): this;
        setRotation(radians: number): this;
        setRotationDegrees(degrees: number): this;
        setLocalRotation(radians: number): this;
        setLocalRotationDegrees(degrees: number): this;
        setScale(scale: number): any;
        setScale(scale: Vector2): any;
        setLocalScale(scale: number): any;
        setLocalScale(scale: Vector2): any;
        /**
         * 设置实体的标记
         * @param tag
         */
        setTag(tag: number): Entity;
        /**
         * 设置实体的启用状态。当禁用碰撞器从物理系统和组件中移除时，方法将不会被调用
         * @param isEnabled
         */
        setEnabled(isEnabled: boolean): this;
        /**
         * 设置此实体的更新顺序。updateOrder还用于对scene.entities上的标签列表进行排序
         * @param updateOrder
         */
        setUpdateOrder(updateOrder: number): this;
        /**
         * 从场景中删除实体并销毁所有子元素
         */
        destroy(): void;
        /**
         * 将实体从场景中分离。下面的生命周期方法将被调用在组件上:OnRemovedFromEntity
         */
        detachFromScene(): void;
        /**
         * 将一个先前分离的实体附加到一个新的场景
         * @param newScene
         */
        attachToScene(newScene: Scene): void;
        /**
         * 在提交了所有挂起的实体更改后，将此实体添加到场景时调用
         */
        onAddedToScene(): void;
        /**
         * 当此实体从场景中删除时调用
         */
        onRemovedFromScene(): void;
        /**
         * 每帧进行调用进行更新组件
         */
        update(): void;
        /**
         * 创建组件的新实例。返回实例组件
         * @param componentType
         */
        createComponent<T extends Component>(componentType: new (...args: any[]) => T): T;
        /**
         * 将组件添加到组件列表中。返回组件。
         * @param component
         */
        addComponent<T extends Component>(component: T): T;
        /**
         * 获取类型T的第一个组件并返回它。如果没有找到组件，则返回null。
         * @param type
         */
        getComponent<T extends Component>(type: new (...args: any[]) => T): T;
        /**
         *  获取类型T的第一个并已加入场景的组件并返回它。如果没有找到组件，则返回null。
         * @param type
         * @returns
         */
        getComponentInScene<T extends Component>(type: new (...args: any[]) => T): T;
        /**
         * 尝试获取T类型的组件。如果未找到任何组件，则返回false
         * @param type
         * @param outComponent
         * @returns
         */
        tryGetComponent<T extends Component>(type: new (...args: any[]) => T, outComponent: Ref<T>): boolean;
        /**
         * 检查实体是否具有该组件
         * @param type
         */
        hasComponent<T extends Component>(type: new (...args: any[]) => T): boolean;
        /**
         * 获取类型T的第一个组件并返回它。如果没有找到组件，将创建组件。
         * @param type
         */
        getOrCreateComponent<T extends Component>(type: new (...args: any[]) => T): T;
        /**
         * 获取typeName类型的所有组件，但不使用列表分配
         * @param typeName
         * @param componentList
         */
        getComponents(typeName: any, componentList?: any[]): any[];
        /**
         * 从组件列表中删除组件
         * @param component
         */
        removeComponent(component: Component): void;
        /**
         * 从组件列表中删除类型为T的第一个组件
         * @param type
         */
        removeComponentForType<T extends Component>(type: any): boolean;
        /**
         * 从实体中删除所有组件
         */
        removeAllComponents(): void;
        tweenPositionTo(to: Vector2, duration?: number): ITween<Vector2>;
        tweenLocalPositionTo(to: Vector2, duration?: number): ITween<Vector2>;
        tweenScaleTo(to: Vector2, duration?: number): any;
        tweenScaleTo(to: number, duration?: number): any;
        tweenLocalScaleTo(to: Vector2, duration?: any): any;
        tweenLocalScaleTo(to: number, duration?: any): any;
        tweenRotationDegreesTo(to: number, duration?: number): TransformVector2Tween;
        tweenLocalRotationDegreesTo(to: number, duration?: number): TransformVector2Tween;
        compareTo(other: Entity): number;
        equals(other: Entity): boolean;
        toString(): string;
    }
}
declare module es {
    /** 2d 向量 */
    class Vector2 implements IEquatable<Vector2> {
        x: number;
        y: number;
        /**
         * 从两个值构造一个带有X和Y的二维向量。
         * @param x 二维空间中的x坐标
         * @param y 二维空间的y坐标
         */
        constructor(x?: number, y?: number);
        static get zero(): Vector2;
        static get one(): Vector2;
        static get unitX(): Vector2;
        static get unitY(): Vector2;
        static get up(): Vector2;
        static get down(): Vector2;
        static get left(): Vector2;
        static get right(): Vector2;
        /**
         *
         * @param value1
         * @param value2
         */
        static add(value1: Vector2, value2: Vector2): Vector2;
        /**
         *
         * @param value1
         * @param value2
         */
        static divide(value1: Vector2, value2: Vector2): Vector2;
        static divideScaler(value1: Vector2, value2: number): Vector2;
        /**
         * 返回两个向量之间距离的平方
         * @param value1
         * @param value2
         */
        static sqrDistance(value1: Vector2, value2: Vector2): number;
        /**
         * 将指定的值限制在一个范围内
         * @param value1
         * @param min
         * @param max
         */
        static clamp(value1: Vector2, min: Vector2, max: Vector2): Vector2;
        /**
         * 创建一个新的Vector2，其中包含指定向量的线性插值
         * @param value1 第一个向量
         * @param value2 第二个向量
         * @param amount 加权值(0.0-1.0之间)
         * @returns 指定向量的线性插值结果
         */
        static lerp(value1: Vector2, value2: Vector2, amount: number): Vector2;
        /**
         * 创建一个新的Vector2，其中包含指定矢量的线性插值
         * @param value1
         * @param value2
         * @param amount
         * @returns
         */
        static lerpPrecise(value1: Vector2, value2: Vector2, amount: number): Vector2;
        /**
         * 创建一个新的Vector2，该Vector2包含了通过指定的Matrix进行的二维向量变换。
         * @param position
         * @param matrix
         */
        static transform(position: Vector2, matrix: Matrix2D): Vector2;
        /**
         * 创建一个新的Vector2，其中包含由指定的Matrix转换的指定法线
         * @param normal
         * @param matrix
         */
        static transformNormal(normal: Vector2, matrix: Matrix): Vector2;
        /**
         * 返回两个向量之间的距离
         * @param value1
         * @param value2
         * @returns 两个向量之间的距离
         */
        static distance(vec1: Vector2, vec2: Vector2): number;
        /**
         * 返回两个向量之间的角度，单位是度数
         * @param from
         * @param to
         */
        static angle(from: Vector2, to: Vector2): number;
        /**
         * 创建一个包含指定向量反转的新Vector2
         * @param value
         * @returns 矢量反演的结果
         */
        static negate(value: Vector2): Vector2;
        /**
         * 向量的反射，输入为两个二维向量vector和normal。函数返回一个新的向量，即vector相对于normal的反射
         * @param vector
         * @param normal
         * @returns
         */
        static reflect(vector: Vector2, normal: Vector2): Vector2;
        /**
         * 创建一个新的Vector2，其中包含指定矢量的三次插值
         * @param value1
         * @param value2
         * @param amount
         * @returns
         */
        static smoothStep(value1: Vector2, value2: Vector2, amount: number): Vector2;
        setTo(x: number, y: number): void;
        negate(): Vector2;
        /**
         *
         * @param value
         */
        add(v: Vector2): Vector2;
        addEqual(v: Vector2): Vector2;
        /**
         *
         * @param value
         */
        divide(value: Vector2): Vector2;
        divideScaler(value: number): Vector2;
        /**
         *
         * @param value
         */
        multiply(value: Vector2): Vector2;
        /**
         *
         * @param value
         * @returns
         */
        multiplyScaler(value: number): Vector2;
        /**
         * 从当前Vector2减去一个Vector2
         * @param value 要减去的Vector2
         * @returns 当前Vector2
         */
        sub(value: Vector2): Vector2;
        subEqual(v: Vector2): Vector2;
        dot(v: Vector2): number;
        /**
         *
         * @param size
         * @returns
         */
        scale(size: number): Vector2;
        scaleEqual(size: number): Vector2;
        transform(matrix: Matrix2D): Vector2;
        normalize(): Vector2;
        /**
         * 将这个Vector2变成一个方向相同的单位向量
         */
        normalizeEqual(): Vector2;
        magnitude(): number;
        distance(v?: Vector2): number;
        /**
         * 返回该Vector2的平方长度
         * @returns 这个Vector2的平方长度
         */
        lengthSquared(): number;
        /**
         * 从原点到向量末端的距离
         * @returns
         */
        getLength(): number;
        /**
         * 四舍五入X和Y值
         */
        round(): Vector2;
        /**
         * 返回以自己为中心点的左右角，单位为度
         * @param left
         * @param right
         */
        angleBetween(left: Vector2, right: Vector2): number;
        getDistance(other: Vector2): number;
        getDistanceSquared(other: Vector2): number;
        isBetween(v1: Vector2, v2: Vector2): boolean;
        /**
         * 两个向量的叉积
         * @param other
         * @returns
         */
        cross(other: Vector2): number;
        /**
         * 计算向量与x轴之间的夹角
         */
        getAngle(): number;
        /**
         * 比较当前实例是否等于指定的对象
         * @param other 要比较的对象
         * @returns 如果实例相同true 否则false
         */
        equals(other: Vector2, tolerance?: number): boolean;
        isValid(): boolean;
        /**
         * 创建一个新的Vector2，其中包含来自两个向量的最小值
         * @param value1
         * @param value2
         * @returns
         */
        static min(value1: Vector2, value2: Vector2): Vector2;
        /**
         * 创建一个新的Vector2，其中包含两个向量的最大值
         * @param value1
         * @param value2
         * @returns
         */
        static max(value1: Vector2, value2: Vector2): Vector2;
        /**
         * 创建一个新的Vector2，其中包含Hermite样条插值
         * @param value1
         * @param tangent1
         * @param value2
         * @param tangent2
         * @param amount
         * @returns
         */
        static hermite(value1: Vector2, tangent1: Vector2, value2: Vector2, tangent2: Vector2, amount: number): Vector2;
        static unsignedAngle(from: Vector2, to: Vector2, round?: boolean): number;
        static fromAngle(angle: number, magnitude?: number): Vector2;
        clone(): Vector2;
        copyFrom(source: Vector2): Vector2;
    }
}
declare module es {
    /** 场景 */
    abstract class Scene extends fairygui.GComponent {
        /** 这个场景中的实体列表 */
        readonly entities: EntityList;
        /** 管理所有实体处理器 */
        readonly entityProcessors: EntityProcessorList;
        readonly _sceneComponents: SceneComponent[];
        readonly identifierPool: IdentifierPool;
        private _didSceneBegin;
        constructor();
        onConstruct(): void;
        /**
         * 初始化场景，可以在派生类中覆盖
         *
         * 这个方法会在场景创建时被调用。您可以在这个方法中添加实体和组件，
         * 或者执行一些必要的准备工作，以便场景能够开始运行。
         */
        initialize(): void;
        /**
         * 开始运行场景时调用此方法，可以在派生类中覆盖
         *
         * 这个方法会在场景开始运行时被调用。您可以在这个方法中执行场景开始时需要进行的操作。
         * 比如，您可以开始播放一段背景音乐、启动UI等等。
         */
        onStart(): void;
        /**
         * 卸载场景时调用此方法，可以在派生类中覆盖
         *
         * 这个方法会在场景被销毁时被调用。您可以在这个方法中销毁实体和组件、释放资源等等。
         * 您也可以在这个方法中执行一些必要的清理工作，以确保场景被完全卸载。
         */
        onUnload(): void;
        /**
         * 开始场景，初始化物理系统、启动实体处理器等
         *
         * 这个方法会启动场景。它将重置物理系统、启动实体处理器等，并调用onStart方法。
         */
        begin(): void;
        /**
         * 结束场景，清除实体、场景组件、物理系统等
         *
         * 这个方法会结束场景。它将移除所有实体并调用它们的onRemovedFromScene方法，清除物理系统，结束实体处理器等，并调用unload方法。
         */
        end(): void;
        /**
         * 更新场景，更新实体组件、实体处理器等
         */
        update(): void;
        /**
         * 向组件列表添加并返回SceneComponent
         * @param component
         */
        addSceneComponent<T extends SceneComponent>(component: T): T;
        /**
         * 获取类型为T的第一个SceneComponent并返回它。如果没有找到组件，则返回null。
         * @param type
         */
        getSceneComponent<T extends SceneComponent>(type: any): T;
        /**
         * 获取类型为T的第一个SceneComponent并返回它。如果没有找到SceneComponent，则将创建SceneComponent。
         * @param type
         */
        getOrCreateSceneComponent<T extends SceneComponent>(type: any): T;
        /**
         * 从SceneComponents列表中删除一个SceneComponent
         * @param component
         */
        removeSceneComponent(component: SceneComponent): void;
        /**
         * 将实体添加到此场景，并返回它
         * @param name
         */
        createEntity(name: string): Entity;
        /**
         * 在场景的实体列表中添加一个实体
         * @param entity
         */
        addEntity(entity: Entity): Entity;
        /**
         * 从场景中删除所有实体
         */
        destroyAllEntities(): void;
        /**
         * 搜索并返回第一个具有名称的实体
         * @param name
         */
        findEntity(name: string): Entity;
        findEntityById(id: number): Entity;
        /**
         * 返回具有给定标记的所有实体
         * @param tag
         */
        findEntitiesWithTag(tag: number): Entity[];
        /**
         * 返回提一个具有该标记的实体
         * @param tag
         * @returns
         */
        findEntityWithTag(tag: number): Entity;
        /**
         * 返回第一个启用加载的类型为T的组件
         * @param type
         */
        findComponentOfType<T extends Component>(type: new (...args: any[]) => T): T;
        /**
         * 返回类型为T的所有已启用已加载组件的列表
         * @param type
         */
        findComponentsOfType<T extends Component>(type: new (...args: any[]) => T): T[];
        /**
         * 返回场景中包含特定组件的实体列表
         * @param type
         * @returns
         */
        findEntitiesOfComponent(...types: any[]): Entity[];
        /**
         * 在场景中添加一个EntitySystem处理器
         * @param processor 处理器
         */
        addEntityProcessor(processor: EntitySystem): EntitySystem;
        /**
         * 从场景中删除EntitySystem处理器
         * @param processor
         */
        removeEntityProcessor(processor: EntitySystem): void;
        /**
         * 获取EntitySystem处理器
         */
        getEntityProcessor<T extends EntitySystem>(type: new (...args: any[]) => T): T;
    }
}
declare module es {
    /**
     * SceneTransition用于从一个场景过渡到另一个场景，或在一个场景内进行效果转换。
     * 如果sceneLoadAction为null，框架将执行场景内过渡，而不是加载新的场景中间过渡。
     */
    abstract class SceneTransition {
        /** 该函数应返回新加载的场景 */
        protected sceneLoadAction: () => Scene;
        /**
         * 在loadNextScene执行时调用
         * 这在进行场景间转换时非常有用，这样您就可以知道何时可以重新设置相机或重置任何实体
         */
        onScreenObscured: Function;
        /**
         * 转换完成后调用，以便调用其他工作，例如启动另一个场景转换
         */
        onTransitionCompleted: Function;
        /**
         * 指示此转换是否将加载新场景的标志
         */
        _loadsNewScene: boolean;
        private _hasPreviousSceneRender;
        get hasPreviousSceneRender(): boolean;
        /**
         * 将此用于两部分过渡。例如，褪色会先褪色为黑色，然后当_isNewSceneLoaded变为true时会褪色。
         * 对于场景内转换，应在中点将isNewSceneLoaded设置为true，就像加载了新场景一样
         */
        _isNewSceneLoaded: boolean;
        protected constructor(sceneLoadAction: () => Scene);
        protected LoadNextScene(): Generator<string, void, unknown>;
        /**
         * 在前一个场景出现第一次（也是唯一一次）后调用。
         * 此时，可以在生成一帧后加载新场景（因此第一次渲染调用发生在场景加载之前）
         */
        onBeginTransition(): any;
        /**
         * 在渲染场景之前调用
         */
        preRender(): void;
        /**
         * 在这里进行所有渲染
         */
        render(): void;
        /**
         * 当过渡完成且新场景已设置时，将调用此函数
         */
        protected transitionComplete(): void;
    }
}
declare module es {
    enum ComponentTransform {
        position = 0,
        scale = 1,
        rotation = 2
    }
    enum DirtyType {
        clean = 0,
        positionDirty = 1,
        scaleDirty = 2,
        rotationDirty = 4
    }
    class Transform {
        /** 与此转换关联的实体 */
        readonly entity: Entity;
        hierarchyDirty: DirtyType;
        _localDirty: boolean;
        _localPositionDirty: boolean;
        _localScaleDirty: boolean;
        _localRotationDirty: boolean;
        _positionDirty: boolean;
        _worldToLocalDirty: boolean;
        _worldInverseDirty: boolean;
        /**
         * 值会根据位置、旋转和比例自动重新计算
         */
        _localTransform: Matrix2D;
        /**
         * 值将自动从本地和父矩阵重新计算。
         */
        _worldTransform: Matrix2D;
        _rotationMatrix: Matrix2D;
        _translationMatrix: Matrix2D;
        _scaleMatrix: Matrix2D;
        _children: Transform[];
        constructor(entity: Entity);
        /**
         * 这个转换的所有子元素
         */
        get childCount(): number;
        /**
         * 变换在世界空间的旋转度
         */
        get rotationDegrees(): number;
        /**
         * 变换在世界空间的旋转度
         * @param value
         */
        set rotationDegrees(value: number);
        /**
         * 旋转相对于父变换旋转的角度
         */
        get localRotationDegrees(): number;
        /**
         * 旋转相对于父变换旋转的角度
         * @param value
         */
        set localRotationDegrees(value: number);
        get localToWorldTransform(): Matrix2D;
        _parent: Transform;
        /**
         * 获取此转换的父转换
         */
        get parent(): Transform;
        /**
         * 设置此转换的父转换
         * @param value
         */
        set parent(value: Transform);
        _worldToLocalTransform: Matrix2D;
        get worldToLocalTransform(): Matrix2D;
        _worldInverseTransform: Matrix2D;
        get worldInverseTransform(): Matrix2D;
        _position: Vector2;
        /**
         * 变换在世界空间中的位置
         */
        get position(): Vector2;
        /**
         * 变换在世界空间中的位置
         * @param value
         */
        set position(value: Vector2);
        _scale: Vector2;
        /**
         * 变换在世界空间的缩放
         */
        get scale(): Vector2;
        /**
         * 变换在世界空间的缩放
         * @param value
         */
        set scale(value: Vector2);
        _rotation: number;
        /**
         * 在世界空间中以弧度旋转的变换
         */
        get rotation(): number;
        /**
         * 变换在世界空间的旋转度
         * @param value
         */
        set rotation(value: number);
        _localPosition: Vector2;
        /**
         * 转换相对于父转换的位置。如果转换没有父元素，则与transform.position相同
         */
        get localPosition(): Vector2;
        /**
         * 转换相对于父转换的位置。如果转换没有父元素，则与transform.position相同
         * @param value
         */
        set localPosition(value: Vector2);
        _localScale: Vector2;
        /**
         * 转换相对于父元素的比例。如果转换没有父元素，则与transform.scale相同
         */
        get localScale(): Vector2;
        /**
         * 转换相对于父元素的比例。如果转换没有父元素，则与transform.scale相同
         * @param value
         */
        set localScale(value: Vector2);
        _localRotation: number;
        /**
         * 相对于父变换的旋转，变换的旋转。如果转换没有父元素，则与transform.rotation相同
         */
        get localRotation(): number;
        /**
         * 相对于父变换的旋转，变换的旋转。如果转换没有父元素，则与transform.rotation相同
         * @param value
         */
        set localRotation(value: number);
        /**
         * 返回在索引处的转换子元素
         * @param index
         */
        getChild(index: number): Transform;
        /**
         * 设置此转换的父转换
         * @param parent
         */
        setParent(parent: Transform): Transform;
        /**
         * 设置转换在世界空间中的位置
         * @param x
         * @param y
         */
        setPosition(x: number, y: number): Transform;
        /**
         * 设置转换相对于父转换的位置。如果转换没有父元素，则与transform.position相同
         * @param localPosition
         */
        setLocalPosition(localPosition: Vector2): Transform;
        /**
         * 设置变换在世界空间的旋转度
         * @param radians
         */
        setRotation(radians: number): Transform;
        /**
         * 设置变换在世界空间的旋转度
         * @param degrees
         */
        setRotationDegrees(degrees: number): Transform;
        /**
         * 旋转精灵的顶部，使其朝向位置
         * @param pos
         */
        lookAt(pos: Vector2): void;
        /**
         * 相对于父变换的旋转设置变换的旋转。如果转换没有父元素，则与transform.rotation相同
         * @param radians
         */
        setLocalRotation(radians: number): this;
        /**
         * 相对于父变换的旋转设置变换的旋转。如果转换没有父元素，则与transform.rotation相同
         * @param degrees
         */
        setLocalRotationDegrees(degrees: number): Transform;
        /**
         * 设置变换在世界空间中的缩放
         * @param scale
         */
        setScale(scale: Vector2): Transform;
        /**
         * 设置转换相对于父对象的比例。如果转换没有父元素，则与transform.scale相同
         * @param scale
         */
        setLocalScale(scale: Vector2): Transform;
        /**
         * 对精灵坐标进行四舍五入
         */
        roundPosition(): void;
        updateTransform(): void;
        setDirty(dirtyFlagType: DirtyType): void;
        /**
         * 从另一个transform属性进行拷贝
         * @param transform
         */
        copyFrom(transform: Transform): void;
        toString(): string;
    }
}
declare module es {
    /**
     * 接口，当添加到一个Component时，只要Component和实体被启用，它就会在每个框架中调用更新方法。
     */
    interface IUpdatable {
        enabled: boolean;
        updateOrder: number;
        update(): any;
    }
    /**
     * 用于比较组件更新排序
     */
    class IUpdatableComparer implements IComparer<IUpdatable> {
        compare(a: IUpdatable, b: IUpdatable): number;
    }
    var isIUpdatable: (props: any) => props is IUpdatable;
}
declare module es {
    class SceneComponent implements IComparer<SceneComponent> {
        /**
         * 这个场景组件被附加到的场景
         */
        scene: Scene;
        /**
         * 如果启用了SceneComponent，则为true。状态的改变会导致调用onEnabled/onDisable。
         */
        get enabled(): boolean;
        /**
         * 如果启用了SceneComponent，则为true。状态的改变会导致调用onEnabled/onDisable。
         * @param value
         */
        set enabled(value: boolean);
        /**
         * 更新此场景中SceneComponents的顺序
         */
        updateOrder: number;
        _enabled: boolean;
        /**
         * 在启用此SceneComponent时调用
         */
        onEnabled(): void;
        /**
         * 当禁用此SceneComponent时调用
         */
        onDisabled(): void;
        /**
         * 当该SceneComponent从场景中移除时调用
         */
        onRemovedFromScene(): void;
        /**
         * 在实体更新之前每一帧调用
         */
        update(): void;
        /**
         * 启用/禁用这个SceneComponent
         * @param isEnabled
         */
        setEnabled(isEnabled: boolean): SceneComponent;
        /**
         * 设置SceneComponent的updateOrder并触发某种SceneComponent
         * @param updateOrder
         */
        setUpdateOrder(updateOrder: number): this;
        compare(other: SceneComponent): number;
    }
}
declare module es {
    /**
     * 请注意，这不是一个完整的、多迭代的物理系统！它可以用于简单的、街机风格的物理。
     * 这可以用于简单的，街机风格的物理学
     */
    class ArcadeRigidbody extends Component implements IUpdatable {
        /** 这个刚体的质量。质量为0，则是一个不可移动的物体 */
        get mass(): number;
        set mass(value: number);
        /**
         * 0-1范围，其中0为无反弹，1为完全反射。
         */
        get elasticity(): number;
        set elasticiy(value: number);
        /**
         * 0 - 1范围。0表示没有摩擦力，1表示物体会停止在原地
         */
        get friction(): number;
        set friction(value: number);
        /**
         * 0-9的范围。当发生碰撞时，沿碰撞面做直线运动时，如果其平方幅度小于glue摩擦力，则将碰撞设置为上限
         */
        get glue(): number;
        set glue(value: number);
        /**
         *  如果为真，则每一帧都会考虑到Physics.gravity
         */
        shouldUseGravity: boolean;
        /**
         * 该刚体的速度
         */
        velocity: Vector2;
        /**
         * 质量为0的刚体被认为是不可移动的。改变速度和碰撞对它们没有影响
         */
        get isImmovable(): boolean;
        _mass: number;
        _elasticity: number;
        _friction: number;
        _glue: number;
        _inverseMass: number;
        _collider: Collider;
        constructor();
        /**
         * 这个刚体的质量。质量为0，则是一个不可移动的物体
         * @param mass
         */
        setMass(mass: number): ArcadeRigidbody;
        /**
         * 0-1范围，其中0为无反弹，1为完全反射。
         * @param value
         */
        setElasticity(value: number): ArcadeRigidbody;
        /**
         * 0 - 1范围。0表示没有摩擦力，1表示物体会停止在原地
         * @param value
         */
        setFriction(value: number): ArcadeRigidbody;
        /**
         * 0-9的范围。当发生碰撞时，沿碰撞面做直线运动时，如果其平方幅度小于glue摩擦力，则将碰撞设置为上限
         * @param value
         */
        setGlue(value: number): ArcadeRigidbody;
        setVelocity(velocity: Vector2): ArcadeRigidbody;
        /**
         * 用刚体的质量给刚体加上一个瞬间的力脉冲。力是一个加速度，单位是每秒像素每秒。将力乘以100000，使数值使用更合理
         * @param force
         */
        addImpulse(force: Vector2): void;
        onAddedToEntity(): void;
        update(): void;
        /**
         * 将两个重叠的刚体分开。也处理其中一个不可移动的情况
         * @param other
         * @param minimumTranslationVector
         */
        processOverlap(other: ArcadeRigidbody, minimumTranslationVector: Vector2): void;
        /**
         * 处理两个非重叠的刚体的碰撞。新的速度将根据情况分配给每个刚体
         * @param other
         * @param minimumTranslationVector
         */
        processCollision(other: ArcadeRigidbody, minimumTranslationVector: Vector2): void;
        /**
         *  给定两个物体和MTV之间的相对速度，本方法修改相对速度，使其成为碰撞响应
         * @param relativeVelocity
         * @param minimumTranslationVector
         * @param responseVelocity
         */
        calculateResponseVelocity(relativeVelocity: Vector2, minimumTranslationVector: Vector2): Vector2;
    }
}
declare module es {
    class CharacterCollisionState2D {
        right: boolean;
        left: boolean;
        above: boolean;
        below: boolean;
        becameGroundedThisFrame: boolean;
        wasGroundedLastFrame: boolean;
        movingDownSlope: boolean;
        slopeAngle: number;
        hasCollision(): boolean;
        reset(): void;
        toString(): string;
    }
    export class CharacterController implements ITriggerListener {
        onControllerCollidedEvent: ObservableT<RaycastHit>;
        onTriggerEnterEvent: ObservableT<Collider>;
        onTriggerExitEvent: ObservableT<Collider>;
        /**
         * 如果为 true，则在垂直移动单帧时将忽略平台的一种方式
         */
        ignoreOneWayPlatformsTime: number;
        supportSlopedOneWayPlatforms: boolean;
        ignoredColliders: Set<Collider>;
        /**
         * 定义距离碰撞射线的边缘有多远。
         * 如果使用 0 范围进行投射，则通常会导致不需要的光线击中（例如，直接从表面水平投射的足部碰撞器可能会导致击中）
         */
        get skinWidth(): number;
        set skinWidth(value: number);
        /**
         * CC2D 可以爬升的最大坡度角
         */
        slopeLimit: number;
        /**
         * 构成跳跃的帧之间垂直运动变化的阈值
         */
        jumpingThreshold: number;
        /**
         * 基于斜率乘以速度的曲线（负 = 下坡和正 = 上坡）
         */
        slopeSpeedMultiplier: AnimCurve;
        totalHorizontalRays: number;
        totalVerticalRays: number;
        collisionState: CharacterCollisionState2D;
        velocity: Vector2;
        get isGrounded(): boolean;
        get raycastHitsThisFrame(): RaycastHit[];
        constructor(player: Entity, skinWidth?: number, platformMask?: number, onewayPlatformMask?: number, triggerMask?: number);
        onTriggerEnter(other: Collider, local: Collider): void;
        onTriggerExit(other: Collider, local: Collider): void;
        /**
         * 尝试将角色移动到位置 + deltaMovement。 任何挡路的碰撞器都会在遇到时导致运动停止
         * @param deltaMovement
         * @param deltaTime
         */
        move(deltaMovement: Vector2, deltaTime: number): void;
        /**
         * 直接向下移动直到接地
         * @param maxDistance
         */
        warpToGrounded(maxDistance?: number): void;
        /**
         * 这应该在您必须在运行时修改 BoxCollider2D 的任何时候调用。
         * 它将重新计算用于碰撞检测的光线之间的距离。
         * 它也用于 skinWidth setter，以防在运行时更改。
         */
        recalculateDistanceBetweenRays(): void;
        /**
         * 将 raycastOrigins 重置为由 skinWidth 插入的框碰撞器的当前范围。
         * 插入它是为了避免从直接接触另一个碰撞器的位置投射光线，从而导致不稳定的法线数据。
         */
        private primeRaycastOrigins;
        /**
         * 我们必须在这方面使用一些技巧。
         * 光线必须从我们的碰撞器（skinWidth）内部的一小段距离投射，以避免零距离光线会得到错误的法线。
         * 由于这个小偏移，我们必须增加光线距离 skinWidth 然后记住在实际移动玩家之前从 deltaMovement 中删除 skinWidth
         * @param deltaMovement
         * @returns
         */
        private moveHorizontally;
        private moveVertically;
        /**
         * 检查 BoxCollider2D 下的中心点是否存在坡度。
         * 如果找到一个，则调整 deltaMovement 以便玩家保持接地，并考虑slopeSpeedModifier 以加快移动速度。
         * @param deltaMovement
         * @returns
         */
        private handleVerticalSlope;
        /**
         * 如果我们要上坡，则处理调整 deltaMovement
         * @param deltaMovement
         * @param angle
         * @returns
         */
        private handleHorizontalSlope;
        private _player;
        private _collider;
        private _skinWidth;
        private _triggerHelper;
        /**
         * 这用于计算为检查坡度而投射的向下光线。
         * 我们使用有点随意的值 75 度来计算检查斜率的射线的长度。
         */
        private _slopeLimitTangent;
        private readonly kSkinWidthFloatFudgeFactor;
        /**
         * 我们的光线投射原点角的支架（TR、TL、BR、BL）
         */
        private _raycastOrigins;
        /**
         * 存储我们在移动过程中命中的光线投射
         */
        private _raycastHit;
        /**
         * 存储此帧发生的任何光线投射命中。
         * 我们必须存储它们，以防我们遇到水平和垂直移动的碰撞，以便我们可以在设置所有碰撞状态后发送事件
         */
        private _raycastHitsThisFrame;
        private _verticalDistanceBetweenRays;
        private _horizontalDistanceBetweenRays;
        /**
         * 我们使用这个标志来标记我们正在爬坡的情况，我们修改了 delta.y 以允许爬升。
         * 原因是，如果我们到达斜坡的尽头，我们可以进行调整以保持接地
         */
        private _isGoingUpSlope;
        private _isWarpingToGround;
        private platformMask;
        private triggerMask;
        private oneWayPlatformMask;
        private readonly rayOriginSkinMutiplier;
    }
    export {};
}
declare module es {
    /**
     * 当添加到组件时，每当实体上的冲突器与另一个组件重叠/退出时，将调用这些方法。
     * ITriggerListener方法将在实现接口的触发器实体上的任何组件上调用。
     * 注意，这个接口只与Mover类一起工作
     */
    interface ITriggerListener {
        /**
         * 当碰撞器与触发碰撞器相交时调用。这是在触发碰撞器和触发碰撞器上调用的。
         * 移动必须由Mover/ProjectileMover方法处理，以使其自动工作。
         * @param other
         * @param local
         */
        onTriggerEnter(other: Collider, local: Collider): any;
        /**
         * 当另一个碰撞器离开触发碰撞器时调用
         * @param other
         * @param local
         */
        onTriggerExit(other: Collider, local: Collider): any;
    }
    class TriggerListenerHelper {
        static getITriggerListener(entity: Entity, components: ITriggerListener[]): ITriggerListener[];
    }
    var isITriggerListener: (props: any) => props is ITriggerListener;
}
declare module es {
    /**
     * 辅助类说明了一种处理移动的方法，它考虑了包括触发器在内的所有冲突。
     * ITriggerListener接口用于管理对移动过程中违反的任何触发器的回调。
     * 一个物体只能通过移动器移动。要正确报告触发器的move方法。
     *
     * 请注意，多个移动者相互交互将多次调用ITriggerListener。
     */
    class Mover extends Component {
        private _triggerHelper;
        onAddedToEntity(): void;
        /**
         * 计算修改运动矢量的运动，以考虑移动时可能发生的碰撞
         * @param motion
         * @param collisionResult
         */
        calculateMovement(motion: Vector2, collisionResult: Out<CollisionResult>): boolean;
        /**
         *  将calculatemomovement应用到实体并更新triggerHelper
         * @param motion
         */
        applyMovement(motion: Vector2): void;
        /**
         * 通过调用calculateMovement和applyMovement来移动考虑碰撞的实体;
         * @param motion
         * @param collisionResult
         */
        move(motion: Vector2, collisionResult: Out<CollisionResult>): boolean;
    }
}
declare module es {
    /**
     * 移动时考虑到碰撞，只用于向任何ITriggerListeners报告。
     * 物体总是会全量移动，所以如果需要的话，由调用者在撞击时销毁它。
     */
    class ProjectileMover extends Component {
        private _tempTriggerList;
        private _collider;
        onAddedToEntity(): void;
        /**
         * 在考虑到碰撞的情况下移动实体
         * @param motion
         */
        move(motion: Vector2): boolean;
        private notifyTriggerListeners;
    }
}
declare module es {
    class Collider extends Component {
        static readonly lateSortOrder = 999;
        castSortOrder: number;
        /**
         * 对撞机的基本形状
         */
        shape: Shape;
        /**
         * 如果这个碰撞器是一个触发器，它将不会引起碰撞，但它仍然会触发事件
         */
        isTrigger: boolean;
        /**
         * 在处理冲突时，physicsLayer可以用作过滤器。Flags类有帮助位掩码的方法
         */
        physicsLayer: Ref<number>;
        /**
         * 碰撞器在使用移动器移动时应该碰撞的层
         * 默认为所有层
         */
        collidesWithLayers: Ref<number>;
        /**
         * 如果为true，碰撞器将根据附加的变换缩放和旋转
         */
        shouldColliderScaleAndRotateWithTransform: boolean;
        /**
         * 这个对撞机在物理系统注册时的边界。
         * 存储这个允许我们始终能够安全地从物理系统中移除对撞机，即使它在试图移除它之前已经被移动了。
         */
        registeredPhysicsBounds: Rectangle;
        _localOffsetLength: number;
        _isPositionDirty: boolean;
        _isRotationDirty: boolean;
        /**
         * 标记来跟踪我们的实体是否被添加到场景中
         */
        protected _isParentEntityAddedToScene: any;
        /**
         * 标记来记录我们是否注册了物理系统
         */
        protected _isColliderRegistered: any;
        /**
         * 表示碰撞器的绝对位置
         */
        get absolutePosition(): Vector2;
        /**
         * 封装变换。如果碰撞器没和实体一起旋转 则返回transform.rotation
         */
        get rotation(): number;
        get bounds(): Rectangle;
        protected _localOffset: Vector2;
        /**
         * 将localOffset添加到实体。获取碰撞器几何图形的最终位置。
         * 允许向一个实体添加多个碰撞器并分别定位，还允许你设置缩放/旋转
         */
        get localOffset(): Vector2;
        /**
         * 将localOffset添加到实体。获取碰撞器几何图形的最终位置。
         * 允许向一个实体添加多个碰撞器并分别定位，还允许你设置缩放/旋转
         * @param value
         */
        set localOffset(value: Vector2);
        /**
         * 将localOffset添加到实体。获取碰撞器的最终位置。
         * 这允许您向一个实体添加多个碰撞器并分别定位它们。
         * @param offset
         */
        setLocalOffset(offset: Vector2): Collider;
        /**
         * 如果为true，碰撞器将根据附加的变换缩放和旋转
         * @param shouldColliderScaleAndRotationWithTransform
         */
        setShouldColliderScaleAndRotateWithTransform(shouldColliderScaleAndRotationWithTransform: boolean): Collider;
        onAddedToEntity(): void;
        onRemovedFromEntity(): void;
        onEntityTransformChanged(comp: ComponentTransform): void;
        onEnabled(): void;
        onDisabled(): void;
        /**
         * 父实体会在不同的时间调用它(当添加到场景，启用，等等)
         */
        registerColliderWithPhysicsSystem(): void;
        /**
         * 父实体会在不同的时候调用它(从场景中移除，禁用，等等)
         */
        unregisterColliderWithPhysicsSystem(): void;
        /**
         * 检查这个形状是否与物理系统中的其他对撞机重叠
         * @param other
         */
        overlaps(other: Collider): boolean;
        /**
         * 检查这个与运动应用的碰撞器(移动向量)是否与碰撞器碰撞。如果是这样，将返回true，并且结果将填充碰撞数据。
         * @param collider
         * @param motion
         * @param result
         */
        collidesWith(collider: Collider, motion: Vector2, result: Out<CollisionResult>): boolean;
        /**
         * 检查这个对撞机是否与对撞机发生碰撞。如果碰撞，则返回true，结果将被填充
         * @param collider
         * @param result
         */
        collidesWithNonMotion(collider: Collider, result: Out<CollisionResult>): boolean;
        /**
         * 检查此碰撞器是否已应用运动（增量运动矢量）与任何碰撞器发生碰撞。
         * 如果是这样，则将返回true，并且将使用碰撞数据填充结果。 运动将设置为碰撞器在碰撞之前可以行进的最大距离。
         * @param motion
         * @param result
         */
        collidesWithAny(motion: Vector2, result: Out<CollisionResult>): boolean;
        /**
         * 检查此碰撞器是否与场景中的其他碰撞器碰撞。它相交的第一个碰撞器将在碰撞结果中返回碰撞数据。
         * @param result
         */
        collidesWithAnyNonMotion(result: Out<CollisionResult>): boolean;
    }
}
declare module es {
    class BoxCollider extends Collider {
        /**
         * 创建一个BoxCollider，并使用x/y组件作为局部Offset
         * @param x
         * @param y
         * @param width
         * @param height
         */
        constructor(x?: number, y?: number, width?: number, height?: number);
        get width(): number;
        set width(value: number);
        get height(): number;
        set height(value: number);
        /**
         * 设置BoxCollider的大小
         * @param width
         * @param height
         */
        setSize(width: number, height: number): this;
        /**
         * 设置BoxCollider的宽度
         * @param width
         */
        setWidth(width: number): BoxCollider;
        /**
         * 设置BoxCollider的高度
         * @param height
         */
        setHeight(height: number): void;
        toString(): string;
    }
}
declare module es {
    class CircleCollider extends Collider {
        /**
         * 创建一个具有半径的CircleCollider。
         * 请注意，当指定半径时，如果在实体上使用RenderableComponent，您将需要设置原点来对齐CircleCollider。
         * 例如，如果RenderableComponent有一个0,0的原点，并且创建了一个半径为1.5f * renderable.width的CircleCollider，你可以通过设置originNormalied为中心除以缩放尺寸来偏移原点
         *
         * @param radius
         */
        constructor(radius?: number);
        get radius(): number;
        set radius(value: number);
        /**
         * 设置圆的半径
         * @param radius
         */
        setRadius(radius: number): CircleCollider;
        toString(): string;
    }
}
declare module es {
    /**
     * 多边形应该以顺时针方式定义
     */
    class PolygonCollider extends Collider {
        /**
         * 如果这些点没有居中，它们将以localOffset的差异为居中。
         * @param points
         */
        constructor(points: Vector2[]);
    }
}
declare module es {
    /**
     * 扇形碰撞器
     */
    class SectorCollider extends Collider {
        constructor(center: Vector2, radius: number, startAngle: number, endAngle: number);
    }
}
declare module es {
    interface Map<K, V> {
        clear(): void;
        containsKey(key: any): boolean;
        containsValue(value: any): boolean;
        get(key: any): V;
        isEmpty(): boolean;
        put(key: any, value: any): void;
        remove(key: any): V;
        size(): number;
        values(): V[];
    }
    export class HashMap<K, V> implements Map<K, V> {
        private map_;
        private keys_;
        constructor();
        clear(): void;
        values(): V[];
        contains(value: any): boolean;
        containsKey(key: any): boolean;
        containsValue(value: any): boolean;
        get(key: K): V;
        isEmpty(): boolean;
        keys(): K[];
        /**
         * if key is a string, use as is, else use key.id_ or key.name
         */
        put(key: any, value: any): void;
        remove(key: any): V;
        size(): number;
    }
    export {};
}
declare module es {
    /**
     * 实体系统的基类，用于处理一组实体。
     */
    abstract class EntitySystem {
        private _entities;
        private _updateOrder;
        private _startTime;
        private _endTime;
        private _useTime;
        /** 获取系统在当前帧所消耗的时间 仅在debug模式下生效 */
        get useTime(): number;
        /**
         * 获取系统的更新时序
         */
        get updateOrder(): number;
        set updateOrder(value: number);
        constructor(matcher?: Matcher);
        private _scene;
        /**
         * 这个系统所属的场景
         */
        get scene(): Scene;
        set scene(value: Scene);
        private _matcher;
        get matcher(): Matcher;
        /**
         * 设置更新时序
         * @param order 更新时序
         */
        setUpdateOrder(order: number): void;
        initialize(): void;
        onChanged(entity: Entity): void;
        add(entity: Entity): void;
        onAdded(entity: Entity): void;
        remove(entity: Entity): void;
        onRemoved(entity: Entity): void;
        update(): void;
        lateUpdate(): void;
        /**
         * 在系统处理开始前调用
         * 在下一个系统开始处理或新的处理回合开始之前（以先到者为准），使用此方法创建的任何实体都不会激活
         */
        protected begin(): void;
        protected process(entities: Entity[]): void;
        protected lateProcess(entities: Entity[]): void;
        /**
         * 系统处理完毕后调用
         */
        protected end(): void;
        /**
         * 系统是否需要处理
         *
         * 在启用系统时有用，但仅偶尔需要处理
         * 这只影响处理，不影响事件或订阅列表
         * @returns 如果系统应该处理，则为true，如果不处理则为false。
         */
        protected checkProcessing(): boolean;
    }
}
declare module es {
    /**
     * 这个类是一个实体系统的基类，其可以被子类继承并在子类中实现具体的实体处理逻辑。
     * 该类提供了实体的添加、删除、更新等基本操作，并支持设置系统的更新时序、检查系统是否需要处理实体、获取系统的场景等方法
     */
    abstract class DelayedIteratingSystem extends EntitySystem {
        private delay;
        private running;
        private acc;
        constructor(matcher: Matcher);
        protected process(entities: Entity[]): void;
        protected checkProcessing(): boolean;
        /**
         * 只有当提供的延迟比系统当前计划执行的时间短时，才会重新启动系统。
         * 如果系统已经停止（不运行），那么提供的延迟将被用来重新启动系统，无论其值如何
         * 如果系统已经在倒计时，并且提供的延迟大于剩余时间，系统将忽略它。
         * 如果提供的延迟时间短于剩余时间，系统将重新启动，以提供的延迟时间运行。
         * @param offeredDelay 提供的延迟时间，单位为秒
         */
        offerDelay(offeredDelay: number): void;
        /**
         * 获取系统被命令处理实体后的初始延迟
         */
        getInitialTimeDelay(): number;
        /**
        * 获取系统计划运行前的时间
        * 如果系统没有运行，则返回零
        */
        getRemainingTimeUntilProcessing(): number;
        /**
         * 检查系统是否正在倒计时处理
         */
        isRunning(): boolean;
        /**
         * 停止系统运行，中止当前倒计时
         */
        stop(): void;
        /**
        * 处理给定实体的延迟时间的一部分，抽象出累积的 Delta 值。
        * @param entity 要处理的实体
        * @param accumulatedDelta 本系统最后一次执行后的累积 delta 时间
        */
        protected abstract processDelta(entity: Entity, accumulatedDelta: number): any;
        /**
         * 处理已到期的实体。
         * @param entity 要处理的实体
         */
        protected abstract processExpired(entity: Entity): any;
        /**
         * 获取给定实体剩余的延迟时间。
         * @param entity 要检查的实体
         * @returns 剩余的延迟时间（以秒为单位）
         */
        protected abstract getRemainingDelay(entity: Entity): number;
    }
}
declare module es {
    /**
     * 定义一个处理实体的抽象类，继承自 EntitySystem 类。
     * 子类需要实现 processEntity 方法，用于实现具体的实体处理逻辑。
     */
    abstract class EntityProcessingSystem extends EntitySystem {
        /**
         * 是否启用系统，默认为启用。
         */
        enabled: boolean;
        /**
         * 构造函数，初始化实体匹配器。
         * @param matcher 实体匹配器
         */
        constructor(matcher: Matcher);
        /**
         * 处理单个实体，由子类实现。
         * @param entity 待处理的实体
         */
        abstract processEntity(entity: Entity): void;
        /**
         * 在晚于 update 的时间更新实体，由子类实现。
         * @param entity 待处理的实体
         */
        lateProcessEntity(entity: Entity): void;
        /**
         * 遍历系统的所有实体，逐个进行实体处理。
         * @param entities 实体数组
         */
        protected process(entities: Entity[]): void;
        /**
         * 在晚于 update 的时间更新实体。
         * @param entities 实体数组
         */
        protected lateProcess(entities: Entity[]): void;
        /**
         * 判断系统是否需要进行实体处理。
         * 如果启用了系统，则需要进行实体处理，返回 true；
         * 否则不需要进行实体处理，返回 false。
         */
        protected checkProcessing(): boolean;
    }
}
declare module es {
    /**
     * 定义一个按时间间隔处理的抽象类，继承自 EntitySystem 类。
     * 子类需要实现 process 方法，用于实现具体的处理逻辑。
     */
    abstract class IntervalSystem extends EntitySystem {
        /**
         * 累积增量以跟踪间隔
         */
        private acc;
        /**
         * 更新之间需要等待多长时间
         */
        private readonly interval;
        /**
         * 时间间隔的余数，用于计算下一次需要等待的时间
         */
        private intervalRemainder;
        /**
         * 构造函数，初始化时间间隔。
         * @param matcher 实体匹配器
         * @param interval 时间间隔
         */
        constructor(matcher: Matcher, interval: number);
        /**
         * 判断是否需要进行处理。
         * 如果需要进行处理，则更新累积增量和时间间隔余数，返回 true；
         * 否则返回 false。
         */
        protected checkProcessing(): boolean;
        /**
         * 获取本系统上次处理后的实际 delta 值。
         * 实际 delta 值等于时间间隔加上时间间隔余数。
         */
        protected getIntervalDelta(): number;
    }
}
declare module es {
    /**
     * 定时遍历处理实体的系统，用于按指定的时间间隔遍历并处理感兴趣的实体。
     */
    abstract class IntervalIteratingSystem extends IntervalSystem {
        constructor(matcher: Matcher, interval: number);
        /**
         * 处理本系统感兴趣的实体
         * @param entity
         */
        abstract processEntity(entity: Entity): any;
        /**
         * 遍历处理实体。
         * @param entities 本系统感兴趣的实体列表
         */
        protected process(entities: Entity[]): void;
    }
}
declare module es {
    /**
     * 定义一个被动的实体系统，继承自 EntitySystem 类。
     * 被动的实体系统不会对实体进行任何修改，只会被动地接收实体的变化事件。
     */
    abstract class PassiveSystem extends EntitySystem {
        /**
         * 当实体发生变化时，不进行任何操作。
         * @param entity 发生变化的实体
         */
        onChanged(entity: Entity): void;
        /**
         * 不进行任何处理，只进行开始和结束计时。
         * @param entities 实体数组，未被使用
         */
        protected process(entities: Entity[]): void;
    }
}
declare module es {
    /**
     * 定义一个处理实体的抽象类，继承自 EntitySystem 类。
     * 子类需要实现 processSystem 方法，用于实现具体的处理逻辑。
     */
    abstract class ProcessingSystem extends EntitySystem {
        /**
         * 当实体发生变化时，不进行任何操作。
         * @param entity 发生变化的实体
         */
        onChanged(entity: Entity): void;
        /**
         * 处理实体，每帧调用 processSystem 方法进行处理。
         * @param entities 实体数组，未被使用
         */
        protected process(entities: Entity[]): void;
        /**
         * 处理实体的具体方法，由子类实现。
         */
        abstract processSystem(): void;
    }
}
declare module es {
    /**
     * 位操作类，用于操作一个位数组。
     */
    class Bits {
        private _bit;
        /**
         * 设置指定位置的位值。
         * @param index 位置索引
         * @param value 位值（0 或 1）
         */
        set(index: number, value: number): void;
        /**
         * 获取指定位置的位值。
         * @param index 位置索引
         * @returns 位值（0 或 1）
         */
        get(index: number): number;
    }
}
declare module es {
    class ComponentList {
        /**
         * 比较IUpdatable对象的更新顺序。
         */
        static compareUpdatableOrder: IUpdatableComparer;
        _entity: Entity;
        /**
         * 实体的组件列表。
         */
        _components: Component[];
        /**
         * 可更新的组件列表。
         */
        _updatableComponents: IUpdatable[];
        /**
         * 等待添加到实体的组件列表。
         */
        _componentsToAdd: {
            [index: number]: Component;
        };
        /**
         * 等待从实体中移除的组件列表。
         */
        _componentsToRemove: {
            [index: number]: Component;
        };
        /**
         * 等待添加到实体的组件列表（作为数组）。
         */
        _componentsToAddList: Component[];
        /**
         * 等待从实体中移除的组件列表（作为数组）。
         */
        _componentsToRemoveList: Component[];
        /**
         * 临时的组件缓冲列表。
         */
        _tempBufferList: Component[];
        /**
         * 指示组件列表是否已排序的标志。
         */
        _isComponentListUnsorted: boolean;
        /**
         * 按组件类型组织的组件列表字典。
         */
        private componentsByType;
        /**
         * 按组件类型组织的等待添加到实体的组件列表字典。
         */
        private componentsToAddByType;
        constructor(entity: Entity);
        get count(): number;
        get buffer(): Component[];
        markEntityListUnsorted(): void;
        /**
         * 将组件添加到实体的组件列表中，并添加到组件类型字典中。
         * @param component 要添加的组件。
         */
        add(component: Component): void;
        /**
         * 从实体的组件列表中移除组件，并从相应的组件类型字典中移除组件。
         * @param component 要从实体中移除的组件。
         */
        remove(component: Component): void;
        /**
         * 立即从组件列表中删除所有组件
         */
        removeAllComponents(): void;
        /**
         * 从实体的所有组件上注销并从相关数据结构中删除它们。
         */
        deregisterAllComponents(): void;
        /**
         * 注册实体的所有组件，并将它们添加到相应的数据结构中。
         */
        registerAllComponents(): void;
        /**
         * 从实体的位掩码中减去组件类型的索引。
         * @param component 要从实体中删除的组件。
         */
        private decreaseBits;
        /**
         * 在实体的位掩码中添加组件类型的索引。
         * @param component 要添加到实体的组件。
         */
        private addBits;
        /**
         * 更新实体的组件列表和相关数据结构。
         * 如果有组件要添加或删除，它将相应地更新组件列表和其他数据结构。
         */
        updateLists(): void;
        handleRemove(component: Component): void;
        private removeComponentsByType;
        private addComponentsByType;
        /**
         * 从待添加组件列表中移除指定类型的组件。
         * @param component 要移除的组件
         */
        private removeComponentsToAddByType;
        /**
         * 向待添加组件列表中添加指定类型的组件。
         * @param component 要添加的组件
         */
        private addComponentsToAddByType;
        /**
         * 获取指定类型的第一个组件实例。
         * @param type 组件类型
         * @param onlyReturnInitializedComponents 是否仅返回已初始化的组件
         * @returns 指定类型的第一个组件实例，如果不存在则返回 null
         */
        getComponent<T extends Component>(type: new (...args: any[]) => T, onlyReturnInitializedComponents: boolean): T;
        /**
         * 获取指定类型的所有组件实例。
         * @param typeName 组件类型名称
         * @param components 存储组件实例的数组
         * @returns 存储了指定类型的所有组件实例的数组
         */
        getComponents(typeName: any, components?: any[]): any[];
        update(): void;
        onEntityTransformChanged(comp: ComponentTransform): void;
        onEntityEnabled(): void;
        onEntityDisabled(): void;
    }
}
declare module es {
    /**
     * 组件类型工厂，用于生成和管理组件类型。
     * 维护了一个类型映射表，将组件类型与其唯一索引相对应，以便在运行时高效地检查实体是否包含特定的组件类型。
     */
    class ComponentTypeFactory {
        /** 组件类型与其唯一索引的映射表 */
        private componentTypes;
        /** 组件类型列表，按索引访问组件类型 */
        readonly types: Bag<ComponentType>;
        /** 当前组件类型的计数器 */
        private componentTypeCount;
        /**
         * 获取给定组件类型的唯一索引。
         * 如果该组件类型尚未存在于类型映射表中，则创建一个新的组件类型，并将其添加到映射表和类型列表中。
         * @param c 要查找或创建的组件类型
         * @returns 组件类型的唯一索引
         */
        getIndexFor(c: new (...args: any[]) => any): number;
        /**
         * 获取给定组件类型的ComponentType对象。
         * 如果该组件类型尚未存在于类型映射表中，则创建一个新的ComponentType对象，并将其添加到映射表和类型列表中。
         * @param c 要查找或创建的组件类型
         * @returns 组件类型的ComponentType对象
         */
        getTypeFor(c: new (...args: any[]) => any): ComponentType;
    }
}
declare module es {
    /**
     * 组件类型管理器，维护了一个组件类型和它们对应的位掩码之间的映射关系。
     * 用于实现实体匹配器中组件类型的比较操作，以确定实体是否符合给定的匹配器条件。
     */
    class ComponentTypeManager {
        /** 存储组件类型和它们对应的位掩码的Map */
        private static _componentTypesMask;
        /**
         * 将给定的组件类型添加到组件类型列表中，并分配一个唯一的位掩码。
         * @param type 要添加的组件类型
         */
        static add(type: any): void;
        /**
         * 获取给定组件类型的位掩码。
         * 如果该组件类型还没有分配位掩码，则将其添加到列表中，并分配一个唯一的位掩码。
         * @param type 要获取位掩码的组件类型
         * @returns 组件类型的位掩码
         */
        static getIndexFor(type: any): number;
    }
}
declare module es {
    class EntityList {
        /**
         * 场景引用
         */
        scene: Scene;
        /**
         * 实体列表
         */
        _entities: Entity[];
        /**
         * 待添加的实体字典
         */
        _entitiesToAdded: {
            [index: number]: Entity;
        };
        /**
         * 待移除的实体字典
         */
        _entitiesToRemove: {
            [index: number]: Entity;
        };
        /**
         * 待添加的实体列表
         */
        _entitiesToAddedList: Entity[];
        /**
         * 待移除的实体列表
         */
        _entitiesToRemoveList: Entity[];
        /**
         * 实体列表是否已排序
         */
        _isEntityListUnsorted: boolean;
        /**
         * 实体字典，以实体标签为键
         */
        _entityDict: Map<number, Set<Entity>>;
        /**
         * 未排序的标签集合
         */
        _unsortedTags: Set<number>;
        constructor(scene: Scene);
        get count(): number;
        get buffer(): Entity[];
        markEntityListUnsorted(): void;
        markTagUnsorted(tag: number): void;
        /**
         * 将一个实体添加到列表中。所有的生命周期方法将在下一帧中被调用
         * @param entity
         */
        add(entity: Entity): void;
        /**
         * 从场景中移除实体。
         * @param entity 要从场景中移除的实体。
         */
        remove(entity: Entity): void;
        /**
         * 从场景中移除所有实体。
         */
        removeAllEntities(): void;
        /**
         * 检查实体是否已经被添加到场景中。
         * @param entity 要检查的实体
         * @returns 如果实体已经被添加到场景中，则返回true；否则返回false
         */
        contains(entity: Entity): boolean;
        /**
         * 获取具有指定标签的实体列表。
         * 如果列表不存在，则创建一个新列表并返回。
         * @param tag 实体标签
         * @returns 具有指定标签的实体列表
         */
        getTagList(tag: number): Set<Entity>;
        /**
         * 添加实体到标签列表中。
         * @param entity 实体
         */
        addToTagList(entity: Entity): void;
        /**
         * 从标签列表中移除实体。
         * @param entity 实体
         */
        removeFromTagList(entity: Entity): void;
        /**
         * 更新场景中所有启用的实体的Update方法
         * 如果实体的UpdateInterval为1或Time.frameCount模除UpdateInterval为0，则每帧调用Update
         */
        update(): void;
        /**
         * 更新场景中实体的列表。
         */
        updateLists(): void;
        /**
         * 返回第一个找到的名字为name的实体。如果没有找到则返回null
         * @param name
         */
        findEntity(name: string): Entity;
        /**
         * 返回最后一个找到的名字为name的实体。如果没有找到则返回null
         * @param name
         */
        findEntityRight(name: string): Entity;
        /**
         * 通过实体ID在场景中查找对应实体
         * @param id 实体ID
         * @returns 返回找到的实体，如果没有找到则返回 null
         */
        findEntityById(id: number): Entity;
        /**
         * 获取标签对应的实体列表
         * @param tag 实体的标签
         * @returns 返回所有拥有该标签的实体列表
         */
        entitiesWithTag(tag: number): Entity[];
        /**
         * 返回第一个找到该tag的实体
         * @param tag
         * @returns
         */
        entityWithTag(tag: number): Entity;
        /**
         * 在场景中查找具有给定类型的组件。
         * @param type 要查找的组件类型。
         * @returns 如果找到，则返回该组件；否则返回null。
         */
        findComponentOfType<T extends Component>(type: new (...args: any[]) => T): T | null;
        /**
         * 在场景中查找具有给定类型的所有组件。
         * @param type 要查找的组件类型。
         * @returns 具有给定类型的所有组件的列表。
         */
        findComponentsOfType<T extends Component>(type: new (...args: any[]) => T): T[];
        /**
         * 返回拥有指定类型组件的所有实体
         * @param types 要查询的组件类型列表
         * @returns 返回拥有指定类型组件的所有实体
         */
        findEntitiesOfComponent(...types: any[]): Entity[];
    }
}
declare module es {
    class EntityProcessorList {
        private _processors;
        private _orderDirty;
        /** 获取处理器列表 */
        get processors(): EntitySystem[];
        /** 获取处理器数量 */
        get count(): number;
        /**
         * 添加处理器
         * @param processor 要添加的处理器
         */
        add(processor: EntitySystem): void;
        /**
         * 移除处理器
         * @param processor 要移除的处理器
         */
        remove(processor: EntitySystem): void;
        /**
         * 在实体上添加组件时被调用
         * @param entity 添加组件的实体
         */
        onComponentAdded(entity: Entity): void;
        /**
         * 在实体上移除组件时被调用
         * @param entity 移除组件的实体
         */
        onComponentRemoved(entity: Entity): void;
        /**
         * 在场景中添加实体时被调用
         * @param entity 添加的实体
         */
        onEntityAdded(entity: Entity): void;
        /**
         * 在场景中移除实体时被调用
         * @param entity 移除的实体
         */
        onEntityRemoved(entity: Entity): void;
        /** 在处理器列表上开始循环 */
        begin(): void;
        /** 更新处理器列表 */
        update(): void;
        /** 在处理器列表上完成循环 */
        end(): void;
        /** 设置处理器排序标志 */
        setDirty(): void;
        /** 清除处理器排序标志 */
        clearDirty(): void;
        /**
         * 获取指定类型的处理器
         * @param type 指定类型的构造函数
         * @returns 指定类型的处理器
         */
        getProcessor<T extends EntitySystem>(type: new (...args: any[]) => T): T;
        /**
         * 通知处理器实体已更改
         * @param entity 发生更改的实体
         */
        protected notifyEntityChanged(entity: Entity): void;
        /**
         * 从处理器列表中移除实体
         * @param entity 要移除的实体
         */
        protected removeFromProcessors(entity: Entity): void;
        /** 在处理器列表上进行后期更新 */
        lateUpdate(): void;
    }
}
declare module es {
    class HashHelpers {
        static readonly hashCollisionThreshold: number;
        static readonly hashPrime: number;
        static readonly primes: number[];
        static readonly maxPrimeArrayLength = 2146435069;
        /**
         * 判断一个数是否为质数
         * @param candidate 要判断的数
         * @returns 是否为质数
         */
        static isPrime(candidate: number): boolean;
        /**
         * 获取大于等于指定值的最小质数
         * @param min 指定值
         * @returns 大于等于指定值的最小质数
         */
        static getPrime(min: number): number;
        /**
         * 扩展哈希表容量
         * @param oldSize 原哈希表容量
         * @returns 扩展后的哈希表容量
         */
        static expandPrime(oldSize: number): number;
        /**
         * 计算字符串的哈希值
         * @param str 要计算哈希值的字符串
         * @returns 哈希值
         */
        static getHashCode(str: string): number;
    }
}
declare module es {
    class IdentifierPool {
        private ids;
        private nextAvailableId_;
        constructor();
        checkOut(): number;
        checkIn(id: number): void;
    }
}
declare module es {
    /**
     * 定义一个实体匹配器类。
     */
    class Matcher {
        protected allSet: (new (...args: any[]) => Component)[];
        protected exclusionSet: (new (...args: any[]) => Component)[];
        protected oneSet: (new (...args: any[]) => Component)[];
        static empty(): Matcher;
        getAllSet(): (new (...args: any[]) => Component)[];
        getExclusionSet(): (new (...args: any[]) => Component)[];
        getOneSet(): (new (...args: any[]) => Component)[];
        isInterestedEntity(e: Entity): boolean;
        isInterested(components: Bits): boolean;
        /**
        * 添加所有包含的组件类型。
        * @param types 所有包含的组件类型列表
        */
        all(...types: (new (...args: any[]) => Component)[]): Matcher;
        /**
         * 添加排除包含的组件类型。
         * @param types 排除包含的组件类型列表
         */
        exclude(...types: (new (...args: any[]) => Component)[]): Matcher;
        /**
         * 添加至少包含其中之一的组件类型。
         * @param types 至少包含其中之一的组件类型列表
         */
        one(...types: (new (...args: any[]) => Component)[]): Matcher;
    }
}
declare module es {
    class StringUtils {
        /**
         * 特殊符号字符串
         */
        private static specialSigns;
        /**
         * 匹配中文字符
         * @param str 需要匹配的字符串
         * @return
         */
        static matchChineseWord(str: string): string[];
        /**
         * 去除字符串左端的空白字符
         * @param target 目标字符串
         * @return
         */
        static lTrim(target: string): string;
        /**
         * 去除字符串右端的空白字符
         * @param target 目标字符串
         * @return
         */
        static rTrim(target: string): string;
        /**
         * 返回一个去除2段空白字符的字符串
         * @param target
         * @return 返回一个去除2段空白字符的字符串
         */
        static trim(target: string): string;
        /**
         * 返回该字符是否为空白字符
         * @param    str
         * @return  返回该字符是否为空白字符
         */
        static isWhiteSpace(str: string): boolean;
        /**
         * 返回该字符是否为空字符或者为null
         * @param str
         * @returns
         */
        static isNullOrEmpty(str: string): boolean;
        /**
         * 返回执行替换后的字符串
         * @param mainStr 待查找字符串
         * @param targetStr 目标字符串
         * @param replaceStr 替换字符串
         * @param caseMark 是否忽略大小写
         * @return 返回执行替换后的字符串
         */
        static replaceMatch(mainStr: string, targetStr: string, replaceStr: string, caseMark?: boolean): string;
        /**
         * 用html实体换掉字符窜中的特殊字符
         * @param str 需要替换的字符串
         * @param reversion 是否翻转替换：将转义符号替换为正常的符号
         * @return 换掉特殊字符后的字符串
         */
        static htmlSpecialChars(str: string, reversion?: boolean): string;
        /**
         * 给数字字符前面添 "0"
         *
         * @param str 要进行处理的字符串
         * @param width 处理后字符串的长度，
         *              如果str.length >= width，将不做任何处理直接返回原始的str。
         * @return
         *
         */
        static zfill(str: string, width?: number): string;
        /**
         * 翻转字符串
         * @param str 字符串
         * @return 翻转后的字符串
         */
        static reverse(str: string): string;
        /**
         * 截断某段字符串
         * @param str 目标字符串
         * @param start 需要截断的起始索引
         * @param en 截断长度
         * @param order 顺序，true从字符串头部开始计算，false从字符串尾巴开始结算。
         * @return 截断后的字符串
         */
        static cutOff(str: string, start: number, len: number, order?: boolean): string;
        /**
         * {0} 字符替换
         */
        static strReplace(str: string, rStr: string[]): string;
        static format(str: string, ...args: any[]): string;
    }
}
declare module es {
    /**
     * 时间管理器，用于管理游戏中的时间相关属性
     */
    class Time {
        /** 游戏运行的总时间，单位为秒 */
        static totalTime: number;
        /** deltaTime 的未缩放版本，不受时间尺度的影响 */
        static unscaledDeltaTime: number;
        /** 前一帧到当前帧的时间增量，按时间刻度进行缩放 */
        static deltaTime: number;
        /** 时间刻度缩放，可以加快或减慢游戏时间 */
        static timeScale: number;
        /** DeltaTime 可以为的最大值，避免游戏出现卡顿情况 */
        static maxDeltaTime: number;
        /** 已传递的帧总数 */
        static frameCount: number;
        /** 自场景加载以来的总时间，单位为秒 */
        static timeSinceSceneLoad: number;
        /** 上一次记录的时间，用于计算两次调用 update 之间的时间差 */
        private static _lastTime;
        /**
         * 更新时间管理器
         * @param currentTime 当前时间
         * @param useEngineTime 是否使用引擎时间
         */
        static update(currentTime: number, useEngineTime: boolean): void;
        static sceneChanged(): void;
        /**
         * 检查指定时间间隔是否已过去
         * @param interval 指定时间间隔
         * @returns 是否已过去指定时间间隔
         */
        static checkEvery(interval: number): boolean;
    }
}
declare module es {
    class TimeUtils {
        /**
         * 获取日期对应的年份和月份的数字组合
         * @param d 要获取月份的日期对象，不传则默认为当前时间
         * @returns 返回数字组合的年份和月份
         */
        static monthId(d?: Date): number;
        /**
         * 获取日期的数字组合
         * @param t - 可选参数，传入时间，若不传入则使用当前时间
         * @returns 数字组合
         */
        static dateId(t?: Date): number;
        /**
         * 获取当前日期所在周的数字组合
         * @param d - 可选参数，传入日期，若不传入则使用当前日期
         * @param first - 是否将当前周视为本年度的第1周，默认为true
         * @returns 数字组合
         */
        static weekId(d?: Date, first?: boolean): number;
        /**
         * 计算两个日期之间相差的天数
         * @param a 第一个日期
         * @param b 第二个日期
         * @param fixOne 是否将相差天数四舍五入到整数
         * @returns 两个日期之间相差的天数
         */
        static diffDay(a: Date, b: Date, fixOne?: boolean): number;
        /**
         * 获取指定日期所在周的第一天
         * @param d 指定日期，默认值为今天
         * @returns 指定日期所在周的第一天
         */
        static getFirstDayOfWeek(d?: Date): Date;
        /**
         * 获取当日凌晨时间
         */
        static getFirstOfDay(d?: Date): Date;
        /**
         * 获取次日凌晨时间
         */
        static getNextFirstOfDay(d?: Date): Date;
        /**
         * 格式化日期为 "YYYY-MM-DD" 的字符串形式
         * @param date 要格式化的日期
         * @returns 格式化后的日期字符串
         */
        static formatDate(date: Date): string;
        /**
         * 将日期对象格式化为 "YYYY-MM-DD HH:mm:ss" 的字符串
         * @param date 日期对象
         * @returns 格式化后的字符串
         */
        static formatDateTime(date: Date): string;
        /**
         * 将字符串解析为Date对象
         * @param s 要解析的日期字符串，例如：2022-01-01
         * @returns 返回解析后的Date对象，如果解析失败，则返回当前时间的Date对象
         */
        static parseDate(s: string): Date;
        /**
         * 将秒数转换为时分秒的格式
         * @param time 秒数
         * @param partition 分隔符
         * @param showHour 是否显示小时位
         * @returns 转换后的时间字符串
         */
        static secondToTime(time?: number, partition?: string, showHour?: boolean): string;
        /**
         * 将时间字符串转换为毫秒数
         * @param time 时间字符串，如 "01:30:15" 表示 1小时30分钟15秒
         * @param partition 分隔符，默认为 ":"
         * @returns 转换后的毫秒数字符串
         */
        static timeToMillisecond(time: string, partition?: string): string;
    }
}
declare module es {
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
        static getPoint(p0: Vector2, p1: Vector2, p2: Vector2, t: number): Vector2;
        /**
         * 求解一个立方体曲率
         * @param start
         * @param firstControlPoint
         * @param secondControlPoint
         * @param end
         * @param t
         */
        static getPointThree(start: Vector2, firstControlPoint: Vector2, secondControlPoint: Vector2, end: Vector2, t: number): Vector2;
        /**
         * 得到二次贝塞尔函数的一阶导数
         * @param p0
         * @param p1
         * @param p2
         * @param t
         */
        static getFirstDerivative(p0: Vector2, p1: Vector2, p2: Vector2, t: number): Vector2;
        /**
         * 得到一个三次贝塞尔函数的一阶导数
         * @param start
         * @param firstControlPoint
         * @param secondControlPoint
         * @param end
         * @param t
         */
        static getFirstDerivativeThree(start: Vector2, firstControlPoint: Vector2, secondControlPoint: Vector2, end: Vector2, t: number): Vector2;
        /**
         * 递归地细分bezier曲线，直到满足距离校正
         * 在这种算法中，平面切片的点要比曲面切片少。返回完成后应返回到ListPool的合并列表。
         * @param start
         * @param firstCtrlPoint
         * @param secondCtrlPoint
         * @param end
         * @param distanceTolerance
         */
        static getOptimizedDrawingPoints(start: Vector2, firstCtrlPoint: Vector2, secondCtrlPoint: Vector2, end: Vector2, distanceTolerance?: number): Vector2[];
        /**
         * 递归地细分bezier曲线，直到满足距离校正。在这种算法中，平面切片的点要比曲面切片少。
         * @param start
         * @param firstCtrlPoint
         * @param secondCtrlPoint
         * @param end
         * @param points
         * @param distanceTolerance
         */
        private static recursiveGetOptimizedDrawingPoints;
    }
}
declare module es {
    /**
     * 提供了一系列立方贝塞尔点，并提供了帮助方法来访问贝塞尔
     */
    class BezierSpline {
        _points: Vector2[];
        _curveCount: number;
        /**
         * 在这个过程中，t被修改为在曲线段的范围内。
         * @param t
         */
        pointIndexAtTime(t: number): {
            time: number;
            range: number;
        };
        /**
         * 设置一个控制点，考虑到这是否是一个共享点，如果是，则适当调整
         * @param index
         * @param point
         */
        setControlPoint(index: number, point: Vector2): void;
        /**
         * 得到时间t的贝塞尔曲线上的点
         * @param t
         */
        getPointAtTime(t: number): Vector2;
        /**
         * 得到贝塞尔在时间t的速度（第一导数）
         * @param t
         */
        getVelocityAtTime(t: number): Vector2;
        /**
         * 得到时间t时贝塞尔的方向（归一化第一导数）
         * @param t
         */
        getDirectionAtTime(t: number): Vector2;
        /**
         * 在贝塞尔曲线上添加一条曲线
         * @param start
         * @param firstControlPoint
         * @param secondControlPoint
         * @param end
         */
        addCurve(start: Vector2, firstControlPoint: Vector2, secondControlPoint: Vector2, end: Vector2): void;
        /**
         * 重置bezier，移除所有点
         */
        reset(): void;
        /**
         * 将splitine分解成totalSegments部分，并返回使用线条绘制所需的所有点
         * @param totalSegments
         */
        getDrawingPoints(totalSegments: number): Vector2[];
    }
}
declare module es {
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
        static isFlagSet(self: number, flag: number): boolean;
        /**
         * 检查指定二进制数字中是否已设置未移位的指定标志位
         * @param self 二进制数字
         * @param flag 标志位，不应移位（应为2的幂）
         * @returns 如果设置了指定的标志位，则返回true，否则返回false
         */
        static isUnshiftedFlagSet(self: number, flag: number): boolean;
        /**
         * 将指定的标志位设置为二进制数字的唯一标志
         * @param self 二进制数字
         * @param flag 标志位，应该为2的幂
         */
        static setFlagExclusive(self: Ref<number>, flag: number): void;
        /**
         * 将指定的标志位设置为二进制数字
         * @param self 二进制数字的引用
         * @param flag 标志位，应该为2的幂
         */
        static setFlag(self: Ref<number>, flag: number): void;
        /**
         * 将指定的标志位从二进制数字中取消设置
         * @param self 二进制数字的引用
         * @param flag 标志位，应该为2的幂
         */
        static unsetFlag(self: Ref<number>, flag: number): void;
        /**
         * 反转二进制数字中的所有位（将1变为0，将0变为1）
         * @param self 二进制数字的引用
         */
        static invertFlags(self: Ref<number>): void;
        /**
         * 返回二进制数字的字符串表示形式（以二进制形式）
         * @param self 二进制数字
         * @param leftPadWidth 返回的字符串的最小宽度（在左侧填充0）
         * @returns 二进制数字的字符串表示形式
         */
        static binaryStringRepresentation(self: number, leftPadWidth?: number): string;
    }
}
declare module es {
    class MathHelper {
        static readonly Epsilon: number;
        static readonly Rad2Deg = 57.29578;
        static readonly Deg2Rad = 0.0174532924;
        /**
         * 表示pi除以2的值(1.57079637)
         */
        static readonly PiOver2: number;
        /**
         * 将弧度转换成角度。
         * @param radians 用弧度表示的角
         */
        static toDegrees(radians: number): number;
        /**
         * 将角度转换为弧度
         * @param degrees
         */
        static toRadians(degrees: number): number;
        /**
         * 计算三角形上给定两个归一化重心坐标所确定点在某个轴上的笛卡尔坐标
         * @param value1 三角形上某个顶点在该轴上的笛卡尔坐标
         * @param value2 三角形上另一个顶点在该轴上的笛卡尔坐标
         * @param value3 三角形上第三个顶点在该轴上的笛卡尔坐标
         * @param amount1 第一个重心坐标，即点相对于三角形边2的面积比例
         * @param amount2 第二个重心坐标，即点相对于三角形边1的面积比例
         * @returns 计算出的点在该轴上的笛卡尔坐标
         */
        static barycentric(value1: number, value2: number, value3: number, amount1: number, amount2: number): number;
        /**
         * 使用Catmull-Rom插值算法在指定的四个数值之间进行插值，返回给定位置的插值结果
         * @param value1 插值范围中的第一个数据点
         * @param value2 插值范围中的第二个数据点
         * @param value3 插值范围中的第三个数据点
         * @param value4 插值范围中的第四个数据点
         * @param amount 插值位置的值，取值范围为[0, 1]，表示该位置在value2和value3之间的相对位置
         * @returns 经过Catmull-Rom插值计算后在给定位置的插值结果
         */
        static catmullRom(value1: number, value2: number, value3: number, value4: number, amount: number): number;
        /**
         * 对给定值进行范围映射。
         * @param value 要映射的值。
         * @param leftMin 输入范围的最小值。
         * @param leftMax 输入范围的最大值。
         * @param rightMin 输出范围的最小值。
         * @param rightMax 输出范围的最大值。
         * @returns 映射后的值。
         */
        static map(value: number, leftMin: number, leftMax: number, rightMin: number, rightMax: number): number;
        /**
         * 将值从任意范围映射到0到1范围
         * @param value
         * @param min
         * @param max
         * @returns
         */
        static map01(value: number, min: number, max: number): number;
        /**
         * 接收一个值value和两个边界min和max作为参数。它将value映射到0到1的范围内，然后返回1减去该结果的值，因此该函数的结果将在1到0之间
         * @param value
         * @param min
         * @param max
         * @returns
         */
        static map10(value: number, min: number, max: number): number;
        /**
         * 在两个值之间进行平滑的线性插值。与 lerp 相似，但具有平滑过渡的特点，当 t 在 0 和 1 之间时，返回 [value1, value2] 之间平滑插值后的结果。
         * @param value1 起始值
         * @param value2 结束值
         * @param amount 插值的程度，范围在 0 到 1 之间。
         * @returns 两个值之间进行平滑的线性插值后的结果。
         */
        static smoothStep(value1: number, value2: number, amount: number): number;
        /**
         * 将给定角度减小到π到-π之间的值
         * @param angle 给定角度值
         * @returns 减小后的角度值，保证在[-π, π]的范围内
         */
        static wrapAngle(angle: number): number;
        /**
         * 判断给定的数值是否是2的幂
         * @param value
         * @returns
         */
        static isPowerOfTwo(value: number): boolean;
        /**
         * 线性插值
         * @param from
         * @param to
         * @param t
         * @returns
         */
        static lerp(from: number, to: number, t: number): number;
        /**
         * 线性插值前检查两个数的差是否小于一个给定的epsilon值，如果小于，则直接返回结束值b，否则执行线性插值并返回插值结果。
         * @param a 起始值
         * @param b 结束值
         * @param t 插值因子
         * @param epsilon 差值阈值，当两个数的差小于epsilon时直接返回结束值b。
         * @returns 如果a和b的差小于给定的epsilon值，则返回b，否则返回a到b的插值结果。
         */
        static betterLerp(a: number, b: number, t: number, epsilon: number): number;
        /**
         * 在两个角度之间进行插值，使用角度值表示角度
         * @param a 起始角度
         * @param b 结束角度
         * @param t 插值比例，范围[0, 1]
         * @returns 两个角度之间插值后的角度，使用角度值表示
         */
        static lerpAngle(a: number, b: number, t: number): number;
        /**
         * 在两个角度之间进行插值，使用弧度值表示角度
         * @param a 起始角度
         * @param b 结束角度
         * @param t 插值比例，范围[0, 1]
         * @returns 两个角度之间插值后的角度，使用弧度值表示
         */
        static lerpAngleRadians(a: number, b: number, t: number): number;
        /**
         * 指定长度上来回“弹跳”（ping-pong）一个变量
         * 因为弹跳的过程是来回循环的。最后，根据t在弹跳过程中相对于length的位置
         * @param t 变量的当前值
         * @param length 指定的长度
         * @returns 0到length之间变化的值
         */
        static pingPong(t: number, length: number): number;
        /**
         * 当value的绝对值大于等于threshold时返回value的符号，否则返回0
         * @param value - 输入的值
         * @param threshold - 阈值
         * @returns value的符号或0
         */
        static signThreshold(value: number, threshold: number): number;
        /**
         * 计算t值在[from, to]区间内的插值比例
         * @param from 插值区间的起点
         * @param to 插值区间的终点
         * @param t 需要计算插值比例的数值
         * @returns t值在[from, to]区间内的插值比例，取值范围在[0, 1]之间
         */
        static inverseLerp(from: number, to: number, t: number): number;
        /**
         * 精确的线性插值，避免出现累积误差
         * @param value1 起始值
         * @param value2 结束值
         * @param amount 插值比例
         * @returns 两个值的线性插值结果
         */
        static lerpPrecise(value1: number, value2: number, amount: number): number;
        /**
         * 将给定值限制在指定范围内
         * @param value 需要被限制的值
         * @param min 最小值
         * @param max 最大值
         * @returns 限制后的值
         */
        static clamp(value: number, min: number, max: number): number;
        /**
         * 按照指定增量取整到最接近的整数倍数
         * @param value
         * @param increment
         * @returns
         */
        static snap(value: number, increment: number): number;
        /**
         * 如果值为偶数，返回true
         * @param value
         */
        static isEven(value: number): boolean;
        /**
         * 如果值是奇数，则返回true
         * @param value
         * @returns
         */
        static isOdd(value: number): boolean;
        /**
         * 将数值四舍五入到最接近的整数，并计算四舍五入的数量
         * @param value 要四舍五入的数值
         * @param roundedAmount 用于存储四舍五入的数量的参数
         * @returns 四舍五入后的整数
         */
        static roundWithRoundedAmount(value: number, roundedAmount: Ref<number>): number;
        /**
         * 将一个数值限制在 [0,1] 范围内
         * @param value 要限制的数值
         * @returns 限制后的数值
         */
        static clamp01(value: number): number;
        /**
         * 计算从一个向量到另一个向量之间的角度
         * @param from 起始向量
         * @param to 目标向量
         * @returns 两个向量之间的角度（弧度制）
         */
        static angleBetweenVectors(from: Vector2, to: Vector2): number;
        /**
         * 将极角和极径转换为向量坐标
         * @param angleRadians 极角弧度值
         * @param length 极径长度
         * @returns 对应向量坐标
         */
        static angleToVector(angleRadians: number, length: number): Vector2;
        /**
         * 将一个数加上1，并在结果等于指定长度时将其设置为0
         * @param t 要加上1的数
         * @param length 指定长度
         * @returns 加上1后的结果，如果等于指定长度，则为0
         */
        static incrementWithWrap(t: number, length: number): number;
        /**
         * 将一个数减去1，并在结果小于0时将其设置为指定长度减去1
         * @param t 要减去1的数
         * @param length 指定长度
         * @returns 减去1后的结果，如果小于0，则为指定长度减去1
         */
        static decrementWithWrap(t: number, length: number): number;
        /**
         * 计算直角三角形斜边长度，即求两个数的欧几里得距离
         * @param x 直角三角形的一条直角边
         * @param y 直角三角形的另一条直角边
         * @returns 三角形斜边长度
         */
        static hypotenuse(x: number, y: number): number;
        /**
         * 计算大于给定数字的最小二次幂
         * @param x 给定数字
         * @returns 大于给定数字的最小二次幂
         */
        static closestPowerOfTwoGreaterThan(x: number): number;
        /**
         * 将数字舍入到最接近的指定值
         * @param value 需要被舍入的数字
         * @param roundToNearest 指定的舍入值
         * @returns 舍入后的结果
         */
        static roundToNearest(value: number, roundToNearest: number): number;
        /**
         * 判断给定值是否接近于零
         * @param value 给定值
         * @param ep 阈值（可选，默认为Epsilon）
         * @returns 如果接近于零，返回true，否则返回false
         */
        static withinEpsilon(value: number, ep?: number): boolean;
        /**
         * 逐渐逼近目标值
         * @param start 起始值
         * @param end 目标值
         * @param shift 逼近步长
         * @returns 逼近后的值
         */
        static approach(start: number, end: number, shift: number): number;
        /**
         * 逐渐逼近目标角度
         * @param start 起始角度
         * @param end 目标角度
         * @param shift 逼近步长
         * @returns 最终角度
         */
        static approachAngle(start: number, end: number, shift: number): number;
        /**
         * 计算向量在另一个向量上的投影向量
         * @param self 要投影的向量
         * @param other 目标向量
         * @returns 投影向量
         */
        static project(self: Vector2, other: Vector2): Vector2;
        /**
         * 逐渐接近目标角度
         * @param start 当前角度值（弧度制）
         * @param end 目标角度值（弧度制）
         * @param shift 每次逐渐接近目标角度的增量（弧度制）
         * @returns 逐渐接近目标角度后的角度值（弧度制）
         */
        static approachAngleRadians(start: number, end: number, shift: number): number;
        /**
         * 判断两个数值是否在指定公差内近似相等
         * @param value1 第一个数值
         * @param value2 第二个数值
         * @param tolerance 指定公差，默认为 Epsilon 常量
         * @returns 是否在指定公差内近似相等
         */
        static approximately(value1: number, value2: number, tolerance?: number): boolean;
        /**
         * 计算两个角度值之间的角度差值
         * @param current 当前角度值
         * @param target 目标角度值
         * @returns 角度差值
         */
        static deltaAngle(current: number, target: number): number;
        /**
         * 判断给定数值是否在指定区间内
         * @param value 给定数值
         * @param min 区间最小值
         * @param max 区间最大值
         * @returns 是否在指定区间内
         */
        static between(value: number, min: number, max: number): boolean;
        /**
         * 计算两个弧度值之间的角度差值
         * @param current 当前弧度值
         * @param target 目标弧度值
         * @returns 角度差值
         */
        static deltaAngleRadians(current: number, target: number): number;
        /**
         * 将给定的数值限定在一个循环范围内
         * @param t 给定的数值
         * @param length 循环范围长度
         * @returns 限定在循环范围内的数值
         */
        static repeat(t: number, length: number): number;
        /**
         * 将给定的浮点数向下取整为整数
         * @param f 给定的浮点数
         * @returns 向下取整后的整数
         */
        static floorToInt(f: number): number;
        /**
         * 绕着一个点旋转
         * @param position 原点坐标
         * @param speed 旋转速度
         * @returns 经过旋转后的点坐标
         */
        static rotateAround(position: Vector2, speed: number): Vector2;
        /**
         * 绕给定中心点旋转指定角度后得到的新点坐标
         * @param point 要旋转的点的坐标
         * @param center 旋转中心点的坐标
         * @param angleIndegrees 旋转的角度，单位为度
         * @returns 旋转后的新点的坐标，返回值类型为Vector2
         */
        static rotateAround2(point: Vector2, center: Vector2, angleIndegrees: number): Vector2;
        /**
         * 计算以给定点为圆心、给定半径的圆上某一点的坐标
         * @param circleCenter 圆心坐标
         * @param radius 圆半径
         * @param angleInDegrees 角度值（度数制）
         * @returns 计算出的圆上某一点的坐标
         */
        static pointOnCircle(circleCenter: Vector2, radius: number, angleInDegrees: number): Vector2;
        /**
         * 计算以给定点为圆心、给定半径的圆上某一点的坐标
         * @param circleCenter 圆心坐标
         * @param radius 圆半径
         * @param angleInRadians 角度值（弧度制）
         * @returns 计算出的圆上某一点的坐标
         */
        static pointOnCircleRadians(circleCenter: Vector2, radius: number, angleInRadians: number): Vector2;
        /**
         * 生成一个Lissajous曲线上的点的坐标
         * @param xFrequency x方向上的频率，默认值为2
         * @param yFrequency y方向上的频率，默认值为3
         * @param xMagnitude x方向上的振幅，默认值为1
         * @param yMagnitude y方向上的振幅，默认值为1
         * @param phase 相位，默认值为0
         * @returns 在Lissajous曲线上的点的坐标，返回值类型为Vector2
         */
        static lissajou(xFrequency?: number, yFrequency?: number, xMagnitude?: number, yMagnitude?: number, phase?: number): Vector2;
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
        static lissajouDamped(xFrequency?: number, yFrequency?: number, xMagnitude?: number, yMagnitude?: number, phase?: number, damping?: number, oscillationInterval?: number): Vector2;
        /**
         * 计算在曲线上特定位置的值。
         * @param value1 第一个插值点的值
         * @param tangent1 第一个插值点的切线或方向向量
         * @param value2 第二个插值点的值
         * @param tangent2 第二个插值点的切线或方向向量
         * @param amount 在这两个点之间进行插值的位置
         * @returns 在曲线上特定位置的值
         */
        static hermite(value1: number, tangent1: number, value2: number, tangent2: number, amount: number): number;
        /**
         * 判断给定的数字是否有效
         * 如果输入的数字是 NaN 或正无穷大，该函数将返回 false；否则返回 true
         * @param x
         * @returns
         */
        static isValid(x: number): boolean;
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
        static smoothDamp(current: number, target: number, currentVelocity: number, smoothTime: number, maxSpeed: number, deltaTime: number): {
            value: number;
            currentVelocity: number;
        };
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
        static smoothDampVector(current: Vector2, target: Vector2, currentVelocity: Vector2, smoothTime: number, maxSpeed: number, deltaTime: number): Vector2;
        /**
         * 将一个值从一个区间映射到另一个区间
         * @param value 需要映射的值
         * @param leftMin 所在区间的最小值
         * @param leftMax 所在区间的最大值
         * @param rightMin 需要映射到的目标区间的最小值
         * @param rightMax 需要映射到的目标区间的最大值
         * @returns
         */
        static mapMinMax(value: number, leftMin: number, leftMax: number, rightMin: number, rightMax: number): number;
        /**
         * 返回一个给定角度的单位向量。角度被解释为弧度制。
         * @param angle - 给定角度，以弧度制表示。
         * @returns 一个新的已归一化的二维向量。
         */
        static fromAngle(angle: number): Vector2;
        /**
         * 将一个数字转换为最接近的整数
         * @param val 需要被转换的数字
         * @returns 最接近的整数
         */
        static toInt(val: number): number;
    }
}
declare module es {
    /**
     * 代表右手4x4浮点矩阵，可以存储平移、比例和旋转信息
     */
    class Matrix {
        private static identity;
        static get Identity(): Matrix;
        m11: number;
        m12: number;
        m13: number;
        m14: number;
        m21: number;
        m22: number;
        m23: number;
        m24: number;
        m31: number;
        m32: number;
        m33: number;
        m34: number;
        m41: number;
        m42: number;
        m43: number;
        m44: number;
        constructor(m11?: any, m12?: any, m13?: any, m14?: any, m21?: any, m22?: any, m23?: any, m24?: any, m31?: any, m32?: any, m33?: any, m34?: any, m41?: any, m42?: any, m43?: any, m44?: any);
        /**
         * 为自定义的正交视图创建一个新的投影矩阵
         * @param left
         * @param right
         * @param top
         * @param zFarPlane
         * @param result
         */
        static createOrthographicOffCenter(left: number, right: number, bottom: number, top: number, zNearPlane: number, zFarPlane: number, result?: Matrix): void;
        static createTranslation(position: Vector2, result: Matrix): void;
        static createRotationZ(radians: number, result: Matrix): void;
        /**
         * 创建一个新的矩阵，其中包含两个矩阵的乘法。
         * @param matrix1
         * @param matrix2
         * @param result
         */
        static multiply(matrix1: Matrix, matrix2: Matrix, result?: Matrix): void;
    }
}
declare module es {
    /**
     * 表示右手3 * 3的浮点矩阵，可以存储平移、缩放和旋转信息。
     */
    class Matrix2D implements IEquatable<Matrix2D> {
        m11: number;
        m12: number;
        m21: number;
        m22: number;
        m31: number;
        m32: number;
        /**
         * 返回标识矩阵
         */
        static get identity(): Matrix2D;
        setIdentity(): Matrix2D;
        setValues(m11: number, m12: number, m21: number, m22: number, m31: number, m32: number): Matrix2D;
        /**
         * 储存在该矩阵中的位置
         */
        get translation(): Vector2;
        set translation(value: Vector2);
        /**
         * 以弧度为单位的旋转，存储在这个矩阵中
         */
        get rotation(): number;
        set rotation(value: number);
        /**
         * 矩阵中存储的旋转度数
         */
        get rotationDegrees(): number;
        set rotationDegrees(value: number);
        /**
         * 储存在这个矩阵中的缩放
         */
        get scale(): Vector2;
        set scale(value: Vector2);
        /**
         * 创建一个新的围绕Z轴的旋转矩阵2D
         * @param radians
         */
        static createRotation(radians: number, result: Matrix2D): void;
        static createRotationOut(radians: number, result: Matrix2D): void;
        /**
         * 创建一个新的缩放矩阵2D
         * @param xScale
         * @param yScale
         */
        static createScale(xScale: number, yScale: number, result: Matrix2D): void;
        static createScaleOut(xScale: number, yScale: number, result: Matrix2D): void;
        /**
         * 创建一个新的平移矩阵2D
         * @param xPosition
         * @param yPosition
         */
        static createTranslation(xPosition: number, yPosition: number, result: Matrix2D): Matrix2D;
        static createTranslationOut(position: Vector2, result: Matrix2D): void;
        static invert(matrix: Matrix2D): Matrix2D;
        /**
         * 创建一个新的matrix, 它包含两个矩阵的和。
         * @param matrix
         */
        add(matrix: Matrix2D): Matrix2D;
        substract(matrix: Matrix2D): Matrix2D;
        divide(matrix: Matrix2D): Matrix2D;
        multiply(matrix: Matrix2D): Matrix2D;
        static multiply(matrix1: Matrix2D, matrix2: Matrix2D, result: Matrix2D): void;
        determinant(): number;
        /**
         * 创建一个新的Matrix2D，包含指定矩阵中的线性插值。
         * @param matrix1
         * @param matrix2
         * @param amount
         */
        static lerp(matrix1: Matrix2D, matrix2: Matrix2D, amount: number): Matrix2D;
        /**
         * 交换矩阵的行和列
         * @param matrix
         */
        static transpose(matrix: Matrix2D): Matrix2D;
        mutiplyTranslation(x: number, y: number): Matrix2D;
        /**
         * 比较当前实例是否等于指定的Matrix2D
         * @param other
         */
        equals(other: Matrix2D): boolean;
        static toMatrix(mat: Matrix2D): Matrix;
        toString(): string;
    }
}
declare module es {
    class MatrixHelper {
        /**
         * 该静态方法用于计算两个 Matrix2D 对象的和。
         * @param {Matrix2D} matrix1 - 加数矩阵。
         * @param {Matrix2D} matrix2 - 加数矩阵。
         * @returns {Matrix2D} - 计算结果的 Matrix2D 对象。
         */
        static add(matrix1: Matrix2D, matrix2: Matrix2D): Matrix2D;
        /**
         * 该静态方法用于计算两个 Matrix2D 对象的商。
         * @param {Matrix2D} matrix1 - 被除数矩阵。
         * @param {Matrix2D} matrix2 - 除数矩阵。
         * @returns {Matrix2D} - 计算结果的 Matrix2D 对象。
         */
        static divide(matrix1: Matrix2D, matrix2: Matrix2D): Matrix2D;
        /**
         * 该静态方法用于计算两个 Matrix2D 对象或一个 Matrix2D 对象和一个数字的乘积。
         * @param {Matrix2D} matrix1 - 第一个矩阵。
         * @param {Matrix2D | number} matrix2 - 第二个矩阵或一个数字。
         * @returns {Matrix2D} - 计算结果的 Matrix2D 对象。
         */
        static multiply(matrix1: Matrix2D, matrix2: Matrix2D | number): Matrix2D;
        /**
         * 该静态方法用于计算两个 Matrix2D 对象的差。
         * @param {Matrix2D} matrix1 - 第一个矩阵。
         * @param {Matrix2D} matrix2 - 第二个矩阵。
         * @returns {Matrix2D} - 计算结果的 Matrix2D 对象。
         */
        static subtract(matrix1: Matrix2D, matrix2: Matrix2D): Matrix2D;
    }
}
declare module es {
    class Rectangle implements IEquatable<Rectangle> {
        /**
         * 该矩形的左上角的x坐标
         */
        x: number;
        /**
         * 该矩形的左上角的y坐标
         */
        y: number;
        /**
         * 该矩形的宽度
         */
        width: number;
        /**
         * 该矩形的高度
         */
        height: number;
        /**
         * 返回X=0, Y=0, Width=0, Height=0的矩形
         */
        static get empty(): Rectangle;
        /**
         * 返回一个Number.Min/Max值的矩形
         */
        static get maxRect(): Rectangle;
        /**
         * 返回此矩形左边缘的X坐标
         */
        get left(): number;
        /**
         * 返回此矩形右边缘的X坐标
         */
        get right(): number;
        /**
         * 返回此矩形顶边的y坐标
         */
        get top(): number;
        /**
         * 返回此矩形底边的y坐标
         */
        get bottom(): number;
        /**
         * 获取矩形的最大点，即右下角
         */
        get max(): Vector2;
        /**
         * 这个矩形的宽和高是否为0，位置是否为（0，0）
         */
        isEmpty(): boolean;
        /** 这个矩形的左上角坐标 */
        get location(): Vector2;
        set location(value: Vector2);
        /**
         * 这个矩形的宽-高坐标
         */
        get size(): Vector2;
        set size(value: Vector2);
        /**
         * 位于这个矩形中心的一个点
         * 如果 "宽度 "或 "高度 "是奇数，则中心点将向下舍入
         */
        get center(): Vector2;
        _tempMat: Matrix2D;
        _transformMat: Matrix2D;
        /**
         * 创建一个新的Rectanglestruct实例，指定位置、宽度和高度。
         * @param x 创建的矩形的左上角的X坐标
         * @param y 创建的矩形的左上角的y坐标
         * @param width 创建的矩形的宽度
         * @param height 创建的矩形的高度
         */
        constructor(x?: number, y?: number, width?: number, height?: number);
        /**
         * 创建一个给定最小/最大点（左上角，右下角）的矩形
         * @param minX
         * @param minY
         * @param maxX
         * @param maxY
         */
        static fromMinMax(minX: number, minY: number, maxX: number, maxY: number): Rectangle;
        /**
         * 给定多边形的点，计算边界
         * @param points
         * @returns 来自多边形的点
         */
        static rectEncompassingPoints(points: Vector2[]): Rectangle;
        /**
         * 获取指定边缘的位置
         * @param edge
         */
        getSide(edge: Edge): number;
        /**
         * 获取所提供的坐标是否在这个矩形的范围内
         * @param x 检查封堵点的X坐标
         * @param y 检查封堵点的Y坐标
         */
        contains(x: number, y: number): boolean;
        /**
         * 按指定的水平和垂直方向调整此矩形的边缘
         * @param horizontalAmount 调整左、右边缘的值
         * @param verticalAmount 调整上、下边缘的值
         */
        inflate(horizontalAmount: number, verticalAmount: number): void;
        /**
         * 获取其他矩形是否与这个矩形相交
         * @param value 另一个用于测试的矩形
         */
        intersects(value: Rectangle): boolean;
        rayIntersects(ray: Ray2D): {
            intersected: boolean;
            distance: number;
        };
        /**
         * 获取所提供的矩形是否在此矩形的边界内
         * @param value
         */
        containsRect(value: Rectangle): boolean;
        getHalfSize(): Vector2;
        getClosestPointOnBoundsToOrigin(): Vector2;
        /**
         * 返回离给定点最近的点
         * @param point 矩形上离点最近的点
         */
        getClosestPointOnRectangleToPoint(point: Vector2): Vector2;
        /**
         * 获取矩形边界上与给定点最近的点
         * @param point
         * @param edgeNormal
         * @returns 矩形边框上离点最近的点
         */
        getClosestPointOnRectangleBorderToPoint(point: Vector2, edgeNormal: Out<Vector2>): Vector2;
        /**
         * 创建一个新的RectangleF，该RectangleF包含两个其他矩形的重叠区域
         * @param value1
         * @param value2
         * @returns 将两个矩形的重叠区域作为输出参数
         */
        static intersect(value1: Rectangle, value2: Rectangle): Rectangle;
        /**
         * 改变这个矩形的位置
         * @param offsetX 要添加到这个矩形的X坐标
         * @param offsetY 要添加到这个矩形的y坐标
         */
        offset(offsetX: number, offsetY: number): this;
        /**
         * 创建一个完全包含两个其他矩形的新矩形
         * @param value1
         * @param value2
         */
        static union(value1: Rectangle, value2: Rectangle): Rectangle;
        /**
         * 在矩形重叠的地方创建一个新的矩形
         * @param value1
         * @param value2
         */
        static overlap(value1: Rectangle, value2: Rectangle): Rectangle;
        calculateBounds(parentPosition: Vector2, position: Vector2, origin: Vector2, scale: Vector2, rotation: number, width: number, height: number): void;
        /**
         * 返回一个横跨当前矩形和提供的三角形位置的矩形
         * @param deltaX
         * @param deltaY
         */
        getSweptBroadphaseBounds(deltaX: number, deltaY: number): Rectangle;
        /**
         * 如果发生碰撞，返回true
         * moveX和moveY将返回b1为避免碰撞而必须移动的移动量
         * @param other
         * @param moveX
         * @param moveY
         */
        collisionCheck(other: Rectangle, moveX: Ref<number>, moveY: Ref<number>): boolean;
        /**
         * 计算两个矩形之间有符号的交点深度
         * @param rectA
         * @param rectB
         * @returns 两个相交的矩形之间的重叠量。
         * 这些深度值可以是负值，取决于矩形/相交的哪些边。
         * 这允许调用者确定正确的推送对象的方向，以解决碰撞问题。
         * 如果矩形不相交，则返回Vector2.Zero
         */
        static getIntersectionDepth(rectA: Rectangle, rectB: Rectangle): Vector2;
        /**
         * 比较当前实例是否等于指定的矩形
         * @param other
         */
        equals(other: Rectangle): boolean;
        /**
         * 获取这个矩形的哈希码
         */
        getHashCode(): number;
        clone(): Rectangle;
    }
}
declare module es {
    /**
     * 该类用于存储具有亚像素分辨率的浮点数。
     */
    class SubpixelFloat {
        /**
         * 存储 SubpixelFloat 值的浮点余数。
         */
        remainder: number;
        /**
         * 通过将给定数量的像素添加到余数中来更新 SubpixelFloat 值。
         * 返回更新后的整数部分，余数表示当前值中包含的亚像素部分。
         * @param {number} amount - 要添加到余数中的像素数。
         * @returns {number} 更新后的整数部分。
         */
        update(amount: number): number;
        /**
         * 将 SubpixelFloat 值重置为零。
         */
        reset(): void;
    }
}
declare module es {
    /**
     * 该类用于存储具有亚像素分辨率的二维向量。
     */
    class SubpixelVector2 {
        /**
         * 用于存储 x 坐标的 SubpixelFloat 对象。
         */
        _x: SubpixelFloat;
        /**
         * 用于存储 y 坐标的 SubpixelFloat 对象。
         */
        _y: SubpixelFloat;
        /**
         * 通过将给定数量的像素添加到余数中来更新 SubpixelVector2 值。
         * @param {Vector2} amount - 要添加到余数中的像素向量。
         */
        update(amount: Vector2): void;
        /**
         * 将 SubpixelVector2 值的余数重置为零。
         */
        reset(): void;
    }
}
declare module es {
    /**
     * 移动器使用的帮助器类，用于管理触发器碰撞器交互并调用itriggerlistener
     */
    class ColliderTriggerHelper {
        private _entity;
        /** 存储当前帧中发生的所有活动交点对 */
        private _activeTriggerIntersections;
        /** 存储前一帧的交点对，这样我们就可以在移动这一帧后检测到退出 */
        private _previousTriggerIntersections;
        private _tempTriggerList;
        constructor(entity: Entity);
        /**
         * update应该在实体被移动后被调用，它将处理任何与Colllider重叠的ITriggerListeners。
         * 它将处理任何与Collider重叠的ITriggerListeners。
         */
        update(): void;
        private getColliders;
        private checkForExitedColliders;
        private notifyTriggerListeners;
    }
}
declare module es {
    enum PointSectors {
        center = 0,
        top = 1,
        bottom = 2,
        topLeft = 9,
        topRight = 5,
        left = 8,
        right = 4,
        bottomLeft = 10,
        bottomRight = 6
    }
    class Collisions {
        static lineToLine(a1: Vector2, a2: Vector2, b1: Vector2, b2: Vector2): boolean;
        static lineToLineIntersection(a1: Vector2, a2: Vector2, b1: Vector2, b2: Vector2, intersection?: Vector2): boolean;
        static closestPointOnLine(lineA: Vector2, lineB: Vector2, closestTo: Vector2): Vector2;
        static circleToCircle(circleCenter1: Vector2, circleRadius1: number, circleCenter2: Vector2, circleRadius2: number): boolean;
        static circleToLine(circleCenter: Vector2, radius: number, lineFrom: Vector2, lineTo: Vector2): boolean;
        static circleToPoint(circleCenter: Vector2, radius: number, point: Vector2): boolean;
        static rectToCircle(rect: Rectangle, cPosition: Vector2, cRadius: number): boolean;
        /**
         * 检查矩形和线段之间是否相交
         * @param rect - 要检查的矩形
         * @param lineFrom - 线段起点
         * @param lineTo - 线段终点
         * @returns 如果相交返回 true，否则返回 false
         */
        static rectToLine(rect: Rectangle, lineFrom: Vector2, lineTo: Vector2): boolean;
        static rectToPoint(rX: number, rY: number, rW: number, rH: number, point: Vector2): boolean;
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
        static getSector(rX: number, rY: number, rW: number, rH: number, point: Vector2): PointSectors;
    }
}
declare module es {
    class RaycastHit {
        /**
         * 对撞机被射线击中
         */
        collider: Collider;
        /**
         * 撞击发生时沿射线的距离。
         */
        fraction: number;
        /**
         * 从射线原点到碰撞点的距离
         */
        distance: number;
        /**
         * 世界空间中光线击中对撞机表面的点
         */
        point: Vector2;
        /**
         * 被射线击中的表面的法向量
         */
        normal: Vector2;
        /**
         * 用于执行转换的质心。使其接触的形状的位置。
         */
        centroid: Vector2;
        constructor(collider?: Collider, fraction?: number, distance?: number, point?: Vector2, normal?: Vector2);
        setAllValues(collider: Collider, fraction: number, distance: number, point: Vector2, normal: Vector2): void;
        setValues(fraction: number, distance: number, point: Vector2, normal: Vector2): void;
        reset(): void;
        clone(): RaycastHit;
        toString(): string;
    }
}
declare module es {
    class Physics {
        static _spatialHash: SpatialHash;
        /** 用于在全局范围内存储重力值的方便字段 */
        static gravity: Vector2;
        /** 调用reset并创建一个新的SpatialHash时使用的单元格大小 */
        static spatialHashCellSize: number;
        /** 接受layerMask的所有方法的默认值 */
        static readonly allLayers: number;
        /**
         * raycast是否检测配置为触发器的碰撞器
         */
        static raycastsHitTriggers: boolean;
        /**
         * 在碰撞器中开始的射线/直线是否强制转换检测到那些碰撞器
         */
        static raycastsStartInColliders: boolean;
        static debugRender: boolean;
        /**
         * 我们保留它以避免在每次raycast发生时分配它
         */
        static _hitArray: RaycastHit[];
        /**
         * 避免重叠检查和形状投射的分配
         */
        static _colliderArray: Collider[];
        static reset(): void;
        /**
         * 从SpatialHash中移除所有碰撞器
         */
        static clear(): void;
        /**
         * 检查是否有对撞机落在一个圆形区域内。返回遇到的第一个对撞机
         * @param center
         * @param radius
         * @param layerMask
         */
        static overlapCircle(center: Vector2, radius: number, layerMask?: number): Collider;
        /**
         * 获取所有落在指定圆圈内的碰撞器
         * @param center
         * @param randius
         * @param results
         * @param layerMask
         */
        static overlapCircleAll(center: Vector2, radius: number, results: Collider[], layerMask?: number): number;
        /**
         * 返回所有碰撞器与边界相交的碰撞器。bounds。请注意，这是一个broadphase检查，所以它只检查边界，不做单个碰撞到碰撞器的检查!
         * @param rect
         * @param layerMask
         */
        static boxcastBroadphase(rect: Rectangle, layerMask?: number): Collider[];
        /**
         * 返回所有被边界交错的碰撞器，但不包括传入的碰撞器（self）。
         * 如果你想为其他查询自己创建扫描边界，这个方法很有用
         * @param collider
         * @param rect
         * @param layerMask
         */
        static boxcastBroadphaseExcludingSelf(collider: Collider, rect: Rectangle, layerMask?: number): Collider[];
        /**
         * 返回所有边界与 collider.bounds 相交的碰撞器，但不包括传入的碰撞器(self)
         * @param collider
         * @param layerMask
         */
        static boxcastBroadphaseExcludingSelfNonRect(collider: Collider, layerMask?: number): Collider[];
        /**
         * 返回所有被 collider.bounds 扩展为包含 deltaX/deltaY 的碰撞器，但不包括传入的碰撞器（self）
         * @param collider
         * @param deltaX
         * @param deltaY
         * @param layerMask
         */
        static boxcastBroadphaseExcludingSelfDelta(collider: Collider, deltaX: number, deltaY: number, layerMask?: number): Collider[];
        /**
         * 将对撞机添加到物理系统中
         * @param collider
         */
        static addCollider(collider: Collider): void;
        /**
         * 从物理系统中移除对撞机
         * @param collider
         */
        static removeCollider(collider: Collider): void;
        /**
         * 更新物理系统中对撞机的位置。这实际上只是移除然后重新添加带有新边界的碰撞器
         * @param collider
         */
        static updateCollider(collider: Collider): void;
        /**
         * 返回与layerMask匹配的碰撞器的第一次命中
         * @param start
         * @param end
         * @param layerMask
         */
        static linecast(start: Vector2, end: Vector2, layerMask?: number, ignoredColliders?: Set<Collider>): RaycastHit;
        /**
         * 通过空间散列强制执行一行，并用该行命中的任何碰撞器填充hits数组
         * @param start
         * @param end
         * @param hits
         * @param layerMask
         */
        static linecastAll(start: Vector2, end: Vector2, hits: RaycastHit[], layerMask?: number, ignoredColliders?: Set<Collider>): number;
        /**
         * 检查是否有对撞机落在一个矩形区域中
         * @param rect
         * @param layerMask
         */
        static overlapRectangle(rect: Rectangle, layerMask?: number): Collider;
        /**
         * 获取所有在指定矩形范围内的碰撞器
         * @param rect
         * @param results
         * @param layerMask
         */
        static overlapRectangleAll(rect: Rectangle, results: Collider[], layerMask?: number): number;
    }
}
declare module es {
    /**
     * 不是真正的射线(射线只有开始和方向)，作为一条线和射线。
     */
    class Ray2D {
        get start(): Vector2;
        get direction(): Vector2;
        get end(): Vector2;
        constructor(pos: Vector2, end: Vector2);
        private _start;
        private _direction;
        private _end;
    }
}
declare module es {
    class SpatialHash {
        gridBounds: Rectangle;
        _raycastParser: RaycastResultParser;
        /**
         * 散列中每个单元格的大小
         */
        _cellSize: number;
        /**
         * 1除以单元格大小。缓存结果，因为它被大量使用。
         */
        _inverseCellSize: number;
        /**
         * 重叠检查缓存框
         */
        _overlapTestBox: Box;
        /**
         * 重叠检查缓存圈
         */
        _overlapTestCircle: Circle;
        /**
         * 保存所有数据的字典
         */
        _cellDict: NumberDictionary<Collider>;
        /**
         * 用于返回冲突信息的共享HashSet
         */
        _tempHashSet: Set<Collider>;
        constructor(cellSize?: number);
        /**
         * 注册一个碰撞器
         * @param collider 碰撞器
         */
        register(collider: Collider): void;
        /**
         * 从空间哈希中移除一个碰撞器
         * @param collider 碰撞器
         */
        remove(collider: Collider): void;
        /**
         * 使用蛮力方法从SpatialHash中删除对象
         * @param obj
         */
        removeWithBruteForce(obj: Collider): void;
        clear(): void;
        /**
         * 执行基于 AABB 的广域相交检测并返回碰撞器列表
         * @param bounds 边界矩形
         * @param excludeCollider 排除的碰撞器
         * @param layerMask 碰撞层掩码
         * @returns 碰撞器列表
         */
        aabbBroadphase(bounds: Rectangle, excludeCollider: Collider, layerMask: number): Collider[];
        /**
         * 执行基于线段的射线检测并返回所有命中的碰撞器
         * @param start 射线起点
         * @param end 射线终点
         * @param hits 射线命中结果
         * @param layerMask 碰撞层掩码
         * @param ignoredColliders 忽略的碰撞器
         * @returns 命中的碰撞器数量
         */
        linecast(start: Vector2, end: Vector2, hits: RaycastHit[], layerMask: number, ignoredColliders: Set<Collider>): number;
        /**
         * 执行矩形重叠检测并返回所有命中的碰撞器
         * @param rect 矩形
         * @param results 碰撞器命中结果
         * @param layerMask 碰撞层掩码
         * @returns 命中的碰撞器数量
         */
        overlapRectangle(rect: Rectangle, results: Collider[], layerMask: number): number;
        /**
         * 执行圆形重叠检测并返回所有命中的碰撞器
         * @param circleCenter 圆心坐标
         * @param radius 圆形半径
         * @param results 碰撞器命中结果
         * @param layerMask 碰撞层掩码
         * @returns 命中的碰撞器数量
         */
        overlapCircle(circleCenter: Vector2, radius: number, results: Collider[], layerMask: number): number;
        /**
         * 将给定的 x 和 y 坐标转换为单元格坐标
         * @param x X 坐标
         * @param y Y 坐标
         * @returns 转换后的单元格坐标
         */
        cellCoords(x: number, y: number): Vector2;
        /**
         * 返回一个包含特定位置处的所有碰撞器的数组
         * 如果此位置上没有单元格并且createCellIfEmpty参数为true，则会创建一个新的单元格
         * @param x 单元格 x 坐标
         * @param y 单元格 y 坐标
         * @param createCellIfEmpty 如果该位置上没有单元格是否创建一个新单元格，默认为false
         * @returns 该位置上的所有碰撞器
         */
        cellAtPosition(x: number, y: number, createCellIfEmpty?: boolean): Collider[];
    }
    /**
     * 数字字典
     */
    class NumberDictionary<T> {
        _store: Map<string, T[]>;
        /**
         * 将指定的列表添加到以给定 x 和 y 为键的字典条目中
         * @param x 字典的 x 坐标
         * @param y 字典的 y 坐标
         * @param list 要添加到字典的列表
         */
        add(x: number, y: number, list: T[]): void;
        /**
         * 从字典中删除给定的对象
         * @param obj 要删除的对象
         */
        remove(obj: T): void;
        /**
         * 尝试从字典中检索指定键的值
         * @param x 字典的 x 坐标
         * @param y 字典的 y 坐标
         * @returns 指定键的值，如果不存在则返回 null
         */
        tryGetValue(x: number, y: number): T[];
        /**
         * 根据给定的 x 和 y 坐标返回一个唯一的字符串键
         * @param x 字典的 x 坐标
         * @param y 字典的 y 坐标
         * @returns 唯一的字符串键
         */
        getKey(x: number, y: number): string;
        /**
         * 清空字典
         */
        clear(): void;
    }
    class RaycastResultParser {
        hitCounter: number;
        static compareRaycastHits: (a: RaycastHit, b: RaycastHit) => number;
        _hits: RaycastHit[];
        _tempHit: RaycastHit;
        _checkedColliders: Collider[];
        _cellHits: RaycastHit[];
        _ray: Ray2D;
        _layerMask: number;
        private _ignoredColliders;
        start(ray: Ray2D, hits: RaycastHit[], layerMask: number, ignoredColliders: Set<Collider>): void;
        /**
         * 对射线检测到的碰撞器进行进一步的处理，将结果存储在传递的碰撞数组中。
         * @param cellX 当前单元格的x坐标
         * @param cellY 当前单元格的y坐标
         * @param cell 该单元格中的碰撞器列表
         * @returns 如果当前单元格有任何碰撞器与射线相交，则返回true
         */
        checkRayIntersection(cellX: number, cellY: number, cell: Collider[]): boolean;
        reset(): void;
    }
}
declare module es {
    abstract class Shape {
        position: Vector2;
        center: Vector2;
        bounds: Rectangle;
        /**
         * 根据形状的碰撞器重新计算形状的边界。
         * @param {Collider} collider - 用于重新计算形状边界的碰撞器。
         */
        abstract recalculateBounds(collider: Collider): any;
        /**
         * 确定形状是否与另一个形状重叠。
         * @param {Shape} other - 要检查重叠的形状。
         * @returns {boolean} 如果形状重叠，则为 true；否则为 false。
         */
        abstract overlaps(other: Shape): boolean;
        /**
         * 确定形状是否与另一个形状碰撞。
         * @param {Shape} other - 要检查碰撞的形状。
         * @param {Out<CollisionResult>} collisionResult - 如果形状碰撞，则要填充的碰撞结果对象。
         * @returns {boolean} 如果形状碰撞，则为 true；否则为 false。
         */
        abstract collidesWithShape(other: Shape, collisionResult: Out<CollisionResult>): boolean;
        /**
         * 确定形状是否与线段相交。
         * @param {Vector2} start - 线段的起点。
         * @param {Vector2} end - 线段的终点。
         * @param {Out<RaycastHit>} hit - 如果形状与线段相交，则要填充的射线命中结果对象。
         * @returns {boolean} 如果形状与线段相交，则为 true；否则为 false。
         */
        abstract collidesWithLine(start: Vector2, end: Vector2, hit: Out<RaycastHit>): boolean;
        /**
         * 确定形状是否包含一个点。
         * @param {Vector2} point - 要检查包含的点。
         */
        abstract containsPoint(point: Vector2): any;
        /**
         * 确定一个点是否与形状相交。
         * @param {Vector2} point - 要检查与形状相交的点。
         * @param {Out<CollisionResult>} result - 如果点与形状相交，则要填充的碰撞结果对象。
         * @returns {boolean} 如果点与形状相交，则为 true；否则为 false。
         */
        abstract pointCollidesWithShape(point: Vector2, result: Out<CollisionResult>): boolean;
    }
}
declare module es {
    /**
     * 多边形
     */
    class Polygon extends Shape {
        /**
         * 组成多边形的点
         * 保持顺时针与凸边形
         */
        points: Vector2[];
        _areEdgeNormalsDirty: boolean;
        /**
         * 多边形的原始数据
         */
        _originalPoints: Vector2[];
        _polygonCenter: Vector2;
        /**
         * 用于优化未旋转box碰撞
         */
        isBox: boolean;
        isUnrotated: boolean;
        /**
         * 从点构造一个多边形
         * 多边形应该以顺时针方式指定 不能重复第一个/最后一个点，它们以0 0为中心
         * @param points
         * @param isBox
         */
        constructor(points: Vector2[], isBox?: boolean);
        create(vertCount: number, radius: number): void;
        _edgeNormals: Vector2[];
        /**
         * 边缘法线用于SAT碰撞检测。缓存它们用于避免squareRoots
         * box只有两个边缘 因为其他两边是平行的
         */
        get edgeNormals(): Vector2[];
        /**
         * 重置点并重新计算中心和边缘法线
         * @param points
         */
        setPoints(points: Vector2[]): void;
        /**
         * 重新计算多边形中心
         * 如果点数改变必须调用该方法
         */
        recalculateCenterAndEdgeNormals(): void;
        /**
         * 建立多边形边缘法线
         * 它们仅由edgeNormals getter惰性创建和更新
         */
        buildEdgeNormals(): void;
        /**
         * 建立一个对称的多边形(六边形，八角形，n角形)并返回点
         * @param vertCount
         * @param radius
         */
        static buildSymmetricalPolygon(vertCount: number, radius: number): any[];
        /**
         * 重定位多边形的点
         * @param points
         */
        static recenterPolygonVerts(points: Vector2[]): void;
        /**
         * 找到多边形的中心。注意，这对于正则多边形是准确的。不规则多边形没有中心。
         * @param points
         */
        static findPolygonCenter(points: Vector2[]): Vector2;
        /**
         * 不知道辅助顶点，所以取每个顶点，如果你知道辅助顶点，执行climbing算法
         * @param points
         * @param direction
         */
        static getFarthestPointInDirection(points: Vector2[], direction: Vector2): Vector2;
        /**
         * 迭代多边形的所有边，并得到任意边上离点最近的点。
         * 通过最近点的平方距离和它所在的边的法线返回。
         * 点应该在多边形的空间中(点-多边形.位置)
         * @param points
         * @param point
         * @param distanceSquared
         * @param edgeNormal
         */
        static getClosestPointOnPolygonToPoint(points: Vector2[], point: Vector2): {
            distanceSquared: number;
            edgeNormal: Vector2;
            closestPoint: Vector2;
        };
        /**
         * 旋转原始点并复制旋转的值到旋转的点
         * @param radians
         * @param originalPoints
         * @param rotatedPoints
         */
        static rotatePolygonVerts(radians: number, originalPoints: Vector2[], rotatedPoints: Vector2[]): void;
        recalculateBounds(collider: Collider): void;
        overlaps(other: Shape): boolean;
        collidesWithShape(other: Shape, result: Out<CollisionResult>): boolean;
        collidesWithLine(start: Vector2, end: Vector2, hit: Out<RaycastHit>): boolean;
        /**
         * 本质上，这个算法所做的就是从一个点发射一条射线。
         * 如果它与奇数条多边形边相交，我们就知道它在多边形内部。
         * @param point
         */
        containsPoint(point: Vector2): boolean;
        pointCollidesWithShape(point: Vector2, result: Out<CollisionResult>): boolean;
    }
}
declare module es {
    /**
     * 多边形的特殊情况。在进行SAT碰撞检查时，我们只需要检查2个轴而不是8个轴
     */
    class Box extends Polygon {
        width: number;
        height: number;
        constructor(width: number, height: number);
        /**
         * 在一个盒子的形状中建立多边形需要的点的帮助方法
         * @param width
         * @param height
         */
        private static buildBox;
        /**
         * 更新框点，重新计算中心，设置宽度/高度
         * @param width
         * @param height
         */
        updateBox(width: number, height: number): void;
        getEdges(): Array<Line>;
        overlaps(other: Shape): boolean;
        collidesWithShape(other: Shape, result: Out<CollisionResult>): boolean;
        containsPoint(point: Vector2): boolean;
        pointCollidesWithShape(point: Vector2, result: Out<CollisionResult>): boolean;
        getFurthestPoint(normal: Vector2): Vector2;
    }
}
declare module es {
    class Circle extends Shape {
        radius: number;
        _originalRadius: number;
        constructor(radius: number);
        recalculateBounds(collider: Collider): void;
        overlaps(other: Shape): boolean;
        collidesWithShape(other: Shape, result: Out<CollisionResult>): boolean;
        collidesWithLine(start: Vector2, end: Vector2, hit: Out<RaycastHit>): boolean;
        getPointAlongEdge(angle: number): Vector2;
        /**
         * 获取所提供的点是否在此范围内
         * @param point
         */
        containsPoint(point: Vector2): boolean;
        pointCollidesWithShape(point: Vector2, result: Out<CollisionResult>): boolean;
    }
}
declare module es {
    class CollisionResult {
        /**
         * 与之相撞的对撞机
         */
        collider: Collider;
        /**
         * 被形状击中的表面的法向量
         */
        normal: Vector2;
        /**
         * 应用于第一个形状以推入形状的转换
         */
        minimumTranslationVector: Vector2;
        /**
         * 不是所有冲突类型都使用!在依赖这个字段之前，请检查ShapeCollisions切割类!
         */
        point: Vector2;
        reset(): void;
        cloneTo(cr: CollisionResult): void;
        /**
         * 从移动向量中移除水平方向的位移，以确保形状只沿垂直方向运动。如果移动向量包含水平移动，则通过计算垂直位移来修复响应距离。
         * @param deltaMovement - 移动向量
         */
        removeHorizontalTranslation(deltaMovement: Vector2): void;
        invertResult(): void;
        toString(): string;
    }
}
declare module es {
    class Line {
        start: Vector2;
        end: Vector2;
        constructor(start: Vector2, end: Vector2);
        get direction(): Vector2;
        getNormal(): Vector2;
        getDirection(out: Vector2): Vector2;
        getLength(): number;
        getLengthSquared(): number;
        distanceToPoint(normal: Vector2, center: Vector2): number;
        getFurthestPoint(direction: Vector2): Vector2;
        getClosestPoint(point: Vector2, out: Vector2): Vector2;
    }
}
declare module es {
    /**
     * 计算投影和重叠区域
     */
    class Projection {
        min: number;
        max: number;
        constructor();
        project(axis: Vector2, polygon: Polygon): void;
        overlap(other: Projection): boolean;
        getOverlap(other: Projection): number;
    }
}
declare module es {
    class RealtimeCollisions {
        /**
         * 判断移动的圆是否与矩形相交，并返回相撞的时间。
         * @param s 移动的圆
         * @param b 矩形
         * @param movement 移动的向量
         * @param time 时间
         * @returns 是否相撞
         */
        static intersectMovingCircleBox(s: Circle, b: Box, movement: Vector2, time: number): boolean;
        /**
         * 返回矩形的第n个角的坐标。
         * @param b 矩形
         * @param n 第n个角的编号
         * @returns 第n个角的坐标
         */
        static corner(b: Rectangle, n: number): es.Vector2;
        /**
         * 测试一个圆和一个矩形是否相交，并返回是否相交。
         * @param circle 圆
         * @param box 矩形
         * @param point 离圆心最近的点
         * @returns 是否相交
         */
        static testCircleBox(circle: Circle, box: Box, point: Vector2): boolean;
    }
}
declare module es {
    /**
     * 扇形形状
     */
    class Sector extends Shape {
        center: Vector2;
        radius: number;
        startAngle: number;
        endAngle: number;
        angle: number;
        radiusSquared: number;
        numberOfPoints: number;
        angleStep: number;
        points: Vector2[];
        get sectorAngle(): number;
        constructor(center: Vector2, radius: number, startAngle: number, endAngle: number);
        /**
         * 获取圆弧的质心。
         * @returns 圆弧的质心
         */
        getCentroid(): Vector2;
        /**
         * 计算向量角度
         * @returns
         */
        getAngle(): number;
        recalculateBounds(collider: Collider): void;
        overlaps(other: Shape): boolean;
        collidesWithShape(other: Shape, collisionResult: Out<CollisionResult>): boolean;
        collidesWithLine(start: Vector2, end: Vector2, hit: Out<RaycastHit>): boolean;
        containsPoint(point: Vector2): boolean;
        pointCollidesWithShape(point: Vector2, result: Out<CollisionResult>): boolean;
        getPoints(): Vector2[];
        private calculateProperties;
        getFurthestPoint(normal: Vector2): Vector2;
    }
}
declare module es {
    class ShapeCollisionSector {
        static sectorToPolygon(first: Sector, second: Polygon, result: Out<CollisionResult>): boolean;
        static sectorToCircle(first: Sector, second: Circle, result: Out<CollisionResult>): boolean;
        static sectorToBox(first: Sector, second: Box, result: Out<CollisionResult>): boolean;
    }
}
declare module es {
    class ShapeCollisionsBox {
        static boxToBox(first: Box, second: Box, result: Out<CollisionResult>): boolean;
        /**
         * 用second检查被deltaMovement移动的框的结果
         * @param first
         * @param second
         * @param movement
         * @param hit
         */
        static boxToBoxCast(first: Box, second: Box, movement: Vector2, hit: RaycastHit): boolean;
        private static minkowskiDifference;
    }
}
declare module es {
    class ShapeCollisionsCircle {
        static circleToCircleCast(first: Circle, second: Circle, deltaMovement: Vector2, hit: Out<RaycastHit>): boolean;
        static circleToCircle(first: Circle, second: Circle, result: Out<CollisionResult>): boolean;
        /**
         * 适用于中心在框内的圆，也适用于与框外中心重合的圆。
         * @param circle
         * @param box
         * @param result
         */
        static circleToBox(circle: Circle, box: Box, result: Out<CollisionResult>): boolean;
        static circleToPolygon(circle: Circle, polygon: Polygon, result: Out<CollisionResult>): boolean;
        static closestPointOnLine(lineA: Vector2, lineB: Vector2, closestTo: Vector2): Vector2;
    }
}
declare module es {
    class ShapeCollisionsLine {
        static lineToPoly(start: Vector2, end: Vector2, polygon: Polygon, hit: Out<RaycastHit>): boolean;
        static lineToLine(a1: Vector2, a2: Vector2, b1: Vector2, b2: Vector2, intersection: Vector2): boolean;
        static lineToCircle(start: Vector2, end: Vector2, s: Circle, hit: Out<RaycastHit>): boolean;
    }
}
declare module es {
    class ShapeCollisionsPoint {
        static pointToCircle(point: Vector2, circle: Circle, result: Out<CollisionResult>): boolean;
        static pointToBox(point: Vector2, box: Box, result: Out<CollisionResult>): boolean;
        static pointToPoly(point: Vector2, poly: Polygon, result: Out<CollisionResult>): boolean;
    }
}
declare module es {
    class ShapeCollisionsPolygon {
        /**
         * 检查两个多边形之间的碰撞
         * @param first
         * @param second
         * @param result
         */
        static polygonToPolygon(first: Polygon, second: Polygon, result: Out<CollisionResult>): boolean;
        /**
         * 计算一个多边形在一个轴上的投影，并返回一个[min，max]区间
         * @param axis
         * @param polygon
         * @param min
         * @param max
         */
        static getInterval(axis: Vector2, polygon: Polygon): {
            min: number;
            max: number;
        };
        /**
         * 计算[minA, maxA]和[minB, maxB]之间的距离。如果间隔重叠，距离是负的
         * @param minA
         * @param maxA
         * @param minB
         * @param maxB
         */
        static intervalDistance(minA: number, maxA: number, minB: number, maxB: number): number;
    }
}
declare module es {
    /**
    * `AbstractTweenable` 是一个抽象类，实现了 `ITweenable` 接口。
    * 这个类提供了 `start`、`pause`、`resume` 和 `stop` 等方法，
    * 并且具有判断动画是否运行的方法 `isRunning`。
    * 它还有一个 `tick` 方法，子类需要根据自己的需要实现这个方法。
    *
    * `AbstractTweenable` 在完成后往往会被保留下来， `_isCurrentlyManagedByTweenManager` 标志可以让它们知道自己当前是否被 `TweenManager` 监控着，
    * 以便在必要时可以重新添加自己。
    */
    abstract class AbstractTweenable implements ITweenable {
        readonly discriminator = "ITweenable";
        protected _isPaused: boolean;
        /**
         * abstractTweenable在完成后往往会被保留下来。
         * 这个标志可以让它们在内部知道自己当前是否被TweenManager盯上了，以便在必要时可以重新添加自己。
         */
        protected _isCurrentlyManagedByTweenManager: boolean;
        abstract tick(): boolean;
        recycleSelf(): void;
        isRunning(): boolean;
        start(): void;
        pause(): void;
        resume(): void;
        stop(bringToCompletion?: boolean): void;
    }
}
declare module es {
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
        static NumberPropertyTo(self: any, memberName: string, to: number, duration: number): ITween<number>;
        /**
         * 创建一个属性为Vector2类型的动画对象
         * @param self 属性动画的目标对象
         * @param memberName 属性名
         * @param to 动画结束时的属性值
         * @param duration 动画时长
         */
        static Vector2PropertyTo(self: any, memberName: string, to: Vector2, duration: number): ITween<Vector2>;
    }
}
declare module es {
    class TransformSpringTween extends AbstractTweenable {
        get targetType(): TransformTargetType;
        private _transform;
        private _targetType;
        private _targetValue;
        private _velocity;
        /**
         * 值越低，阻尼越小，值越高，阻尼越大，导致弹簧度越小，应在0.01-1之间，以避免系统不稳定
         */
        dampingRatio: number;
        /**
         * 角频率为2pi(弧度/秒)意味着振荡在一秒钟内完成一个完整的周期，即1Hz.应小于35左右才能保持稳定角频率
         */
        angularFrequency: number;
        constructor(transform: Transform, targetType: TransformTargetType, targetValue: Vector2);
        /**
         * 你可以在任何时候调用setTargetValue来重置目标值到一个新的Vector2。
         * 如果你没有调用start来添加spring tween，它会为你调用
         * @param targetValue
         */
        setTargetValue(targetValue: Vector2): void;
        /**
         * lambda应该是振荡幅度减少50%时的理想持续时间
         * @param lambda
         */
        updateDampingRatioWithHalfLife(lambda: number): void;
        tick(): boolean;
        private setTweenedValue;
        private getCurrentValueOfTweenedTargetType;
    }
}
declare module es {
    enum LoopType {
        none = 0,
        restartFromBeginning = 1,
        pingpong = 2
    }
    enum TweenState {
        running = 0,
        paused = 1,
        complete = 2
    }
    abstract class Tween<T> implements ITweenable, ITween<T> {
        readonly discriminator: "ITweenControl";
        protected _target: ITweenTarget<T>;
        protected _isFromValueOverridden: boolean;
        protected _fromValue: T;
        protected _toValue: T;
        protected _easeType: EaseType;
        protected _shouldRecycleTween: boolean;
        protected _isRelative: boolean;
        protected _completionHandler: (tween: ITween<T>) => void;
        protected _loopCompleteHandler: (tween: ITween<T>) => void;
        protected _nextTween: ITweenable;
        protected _tweenState: TweenState;
        private _isTimeScaleIndependent;
        protected _delay: number;
        protected _duration: number;
        protected _timeScale: number;
        protected _elapsedTime: number;
        protected _loopType: LoopType;
        protected _loops: number;
        protected _delayBetweenLoops: number;
        private _isRunningInReverse;
        context: any;
        setEaseType(easeType: EaseType): ITween<T>;
        setDelay(delay: number): ITween<T>;
        setDuration(duration: number): ITween<T>;
        setTimeScale(timeSclae: number): ITween<T>;
        setIsTimeScaleIndependent(): ITween<T>;
        setCompletionHandler(completeHandler: (tween: ITween<T>) => void): ITween<T>;
        setLoops(loopType: LoopType, loops?: number, delayBetweenLoops?: number): ITween<T>;
        setLoopCompletionHanlder(loopCompleteHandler: (tween: ITween<T>) => void): ITween<T>;
        setFrom(from: T): ITween<T>;
        prepareForReuse(from: T, to: T, duration: number): ITween<T>;
        setRecycleTween(shouldRecycleTween: boolean): ITween<T>;
        abstract setIsRelative(): ITween<T>;
        setContext(context: any): ITween<T>;
        setNextTween(nextTween: ITweenable): ITween<T>;
        tick(): boolean;
        private calculateElapsedTimeExcess;
        private calculateDeltaTime;
        private updateElapsedTime;
        private handleCompletion;
        recycleSelf(): void;
        isRunning(): boolean;
        start(): void;
        pause(): void;
        resume(): void;
        stop(bringToCompletion?: boolean): void;
        jumpToElapsedTime(elapsedTime: any): void;
        /**
         * 反转当前的tween，如果是向前走，就会向后走，反之亦然
         */
        reverseTween(): void;
        /**
         * 当通过StartCoroutine调用时，这将一直持续到tween完成
         */
        waitForCompletion(): Generator<any, void, unknown>;
        getTargetObject(): any;
        private resetState;
        /**
         * 将所有状态重置为默认值，并根据传入的参数设置初始状态。
         * 这个方法作为一个切入点，这样Tween子类就可以调用它，这样tweens就可以被回收。
         * 当回收时，构造函数不会再被调用，所以这个方法封装了构造函数要做的事情
         * @param target
         * @param to
         * @param duration
         */
        initialize(target: ITweenTarget<T>, to: T, duration: number): void;
        /**
         * 处理循环逻辑
         * @param elapsedTimeExcess
         */
        private handleLooping;
        protected abstract updateValue(): any;
    }
}
declare module es {
    class NumberTween extends Tween<number> {
        static create(): NumberTween;
        constructor(target?: ITweenTarget<number>, to?: number, duration?: number);
        setIsRelative(): ITween<number>;
        protected updateValue(): void;
        recycleSelf(): void;
    }
    class Vector2Tween extends Tween<Vector2> {
        static create(): Vector2Tween;
        constructor(target?: ITweenTarget<Vector2>, to?: Vector2, duration?: number);
        setIsRelative(): ITween<Vector2>;
        protected updateValue(): void;
        recycleSelf(): void;
    }
    class RectangleTween extends Tween<Rectangle> {
        static create(): RectangleTween;
        constructor(target?: ITweenTarget<Rectangle>, to?: Rectangle, duration?: number);
        setIsRelative(): ITween<Rectangle>;
        protected updateValue(): void;
        recycleSelf(): void;
    }
}
declare module es {
    /**
     * 对任何与Transform相关的属性tweens都是有用的枚举
     */
    enum TransformTargetType {
        position = 0,
        localPosition = 1,
        scale = 2,
        localScale = 3,
        rotationDegrees = 4,
        localRotationDegrees = 5
    }
    /**
     * 这是一个特殊的情况，因为Transform是迄今为止最被ween的对象。
     * 我们将Tween和ITweenTarget封装在一个单一的、可缓存的类中
     */
    class TransformVector2Tween extends Vector2Tween implements ITweenTarget<Vector2> {
        private _transform;
        private _targetType;
        setTweenedValue(value: Vector2): void;
        getTweenedValue(): Vector2;
        getTargetObject(): Transform;
        setTargetAndType(transform: Transform, targetType: TransformTargetType): void;
        protected updateValue(): void;
        recycleSelf(): void;
    }
}
declare module es {
    enum EaseType {
        linear = 0,
        sineIn = 1,
        sineOut = 2,
        sineInOut = 3,
        quadIn = 4,
        quadOut = 5,
        quadInOut = 6,
        quintIn = 7,
        quintOut = 8,
        quintInOut = 9,
        cubicIn = 10,
        cubicOut = 11,
        cubicInOut = 12,
        quartIn = 13,
        quartOut = 14,
        quartInOut = 15,
        expoIn = 16,
        expoOut = 17,
        expoInOut = 18,
        circleIn = 19,
        circleOut = 20,
        circleInOut = 21,
        elasticIn = 22,
        elasticOut = 23,
        elasticInOut = 24,
        punch = 25,
        backIn = 26,
        backOut = 27,
        backInOut = 28,
        bounceIn = 29,
        bounceOut = 30,
        bounceInOut = 31
    }
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
        static oppositeEaseType(easeType: EaseType): EaseType.linear | EaseType.sineIn | EaseType.sineOut | EaseType.sineInOut | EaseType.quadIn | EaseType.quadOut | EaseType.quadInOut | EaseType.quintIn | EaseType.quintOut | EaseType.quintInOut | EaseType.cubicIn | EaseType.cubicOut | EaseType.cubicInOut | EaseType.quartIn | EaseType.quartInOut | EaseType.expoIn | EaseType.expoOut | EaseType.expoInOut | EaseType.circleIn | EaseType.circleOut | EaseType.circleInOut | EaseType.elasticIn | EaseType.elasticOut | EaseType.elasticInOut | EaseType.punch | EaseType.backIn | EaseType.backOut | EaseType.backInOut | EaseType.bounceIn | EaseType.bounceOut | EaseType.bounceInOut;
        static ease(easeType: EaseType, t: number, duration: number): number;
    }
}
declare module es {
    /**
     * 全局管理器的基类。所有全局管理器都应该从此类继承。
     */
    class GlobalManager {
        /**
         * 表示管理器是否启用
         */
        _enabled: boolean;
        /**
         * 获取或设置管理器是否启用
         */
        get enabled(): boolean;
        set enabled(value: boolean);
        /**
         * 设置管理器是否启用
         * @param isEnabled 如果为true，则启用管理器；否则禁用管理器
         */
        setEnabled(isEnabled: boolean): void;
        /**
         * 在启用管理器时调用的回调方法
         */
        onEnabled(): void;
        /**
         * 在禁用管理器时调用的回调方法
         */
        onDisabled(): void;
        /**
         * 更新管理器状态的方法
         */
        update(): void;
    }
}
declare module es {
    class TweenManager extends GlobalManager {
        static defaultEaseType: EaseType;
        /**
         * 如果为真，当加载新关卡时，活动的tween列表将被清除
         */
        static removeAllTweensOnLevelLoad: boolean;
        /**
         * 这里支持各种类型的自动缓存。请
         * 注意，只有在使用扩展方法启动tweens时，或者在做自定义tweens时从缓存中获取tween时，缓存才会起作用。
         * 关于如何获取缓存的tween，请参见扩展方法的实现
         */
        static cacheNumberTweens: boolean;
        static cacheVector2Tweens: boolean;
        static cacheColorTweens: boolean;
        static cacheRectTweens: boolean;
        /**
         * 当前所有活跃用户的内部列表
         */
        private _activeTweens;
        static get activeTweens(): ITweenable[];
        private _tempTweens;
        private _isUpdating;
        private static _instance;
        constructor();
        update(): void;
        /**
         * 将一个tween添加到活动tweens列表中
         * @param tween
         */
        static addTween(tween: ITweenable): void;
        /**
         * 从当前的tweens列表中删除一个tween
         * @param tween
         */
        static removeTween(tween: ITweenable): void;
        /**
         * 停止所有的tween并选择地把他们全部完成
         * @param bringToCompletion
         */
        static stopAllTweens(bringToCompletion?: boolean): void;
        /**
         * 返回具有特定上下文的所有tweens。
         * Tweens以ITweenable的形式返回，因为这就是TweenManager所知道的所有内容
         * @param context
         */
        static allTweensWithContext(context: any): ITweenable[];
        /**
         * 停止所有给定上下文的tweens
         * @param context
         * @param bringToCompletion
         */
        static stopAllTweensWithContext(context: any, bringToCompletion?: boolean): void;
        /**
         * 返回具有特定目标的所有tweens。
         * Tweens以ITweenControl的形式返回，因为TweenManager只知道这些
         * @param target
         */
        static allTweenWithTarget(target: any): ITweenable[];
        /**
         * 返回以特定实体为目标的所有tween
         * Tween返回为ITweenControl
         * @param target
         */
        static allTweensWithTargetEntity(target: Entity): any[];
        /**
         * 停止所有具有TweenManager知道的特定目标的tweens
         * @param target
         * @param bringToCompletion
         */
        static stopAllTweensWithTarget(target: any, bringToCompletion?: boolean): void;
    }
}
declare module es {
    /**
     * 标准缓和方程通过将b和c参数（起始值和变化值）用0和1替换，然后进行简化。
     * 这样做的目的是为了让我们可以得到一个0 - 1之间的原始值（除了弹性/反弹故意超过界限），然后用这个值来lerp任何东西
     */
    module Easing {
        class Linear {
            /**
             * 线性缓动，等同于t / d
             * @param t 当前时间
             * @param d 持续时间
             */
            static easeNone(t: number, d: number): number;
        }
        class Quadratic {
            /**
             * 平方缓动进入，加速运动
             * @param t 当前时间
             * @param d 持续时间
             */
            static easeIn(t: number, d: number): number;
            /**
             * 平方缓动退出，减速运动
             * @param t 当前时间
             * @param d 持续时间
             */
            static easeOut(t: number, d: number): number;
            /**
             * 平方缓动进出，加速减速运动
             * @param t 当前时间
             * @param d 持续时间
             */
            static easeInOut(t: number, d: number): number;
        }
        class Back {
            /**
             * Back.easeIn(t, d) 函数将会返回 Back 缓动进入算法的结果
             *
             * @param t 当前时间，从0开始递增
             * @param d 持续时间
             * @param s 回弹的距离，默认值为 1.70158，可以省略该参数
             * @return 缓动后的值
             */
            static easeIn(t: number, d: number, s?: number): number;
            /**
             * Back.easeOut(t, d) 函数将会返回 Back 缓动退出算法的结果
             *
             * @param t 当前时间，从0开始递增
             * @param d 持续时间
             * @param s 回弹的距离，默认值为 1.70158，可以省略该参数
             * @return 缓动后的值
             */
            static easeOut(t: number, d: number, s?: number): number;
            /**
             * Back.easeInOut(t, d) 函数将会返回 Back 缓动进入/退出算法的结果
             *
             * @param t 当前时间，从0开始递增
             * @param d 持续时间
             * @param s 回弹的距离，默认值为 1.70158，可以省略该参数
             * @return 缓动后的值
             */
            static easeInOut(t: number, d: number, s?: number): number;
        }
        class Bounce {
            /**
             * 从0到目标值的反弹动画
             * @param t 当前时间
             * @param d 持续时间
             * @returns 反弹动画进度
             */
            static easeOut(t: number, d: number): number;
            /**
             * 从目标值到0的反弹动画
             * @param t 当前时间
             * @param d 持续时间
             * @returns 反弹动画进度
             */
            static easeIn(t: number, d: number): number;
            /**
             * 从0到目标值再到0的反弹动画
             * @param t 当前时间
             * @param d 持续时间
             * @returns 反弹动画进度
             */
            static easeInOut(t: number, d: number): number;
        }
        class Circular {
            /**
             * 缓动函数入口，表示从 0 到最大值的缓动（开始慢加速，后面变快）
             * @param t 当前时间
             * @param d 缓动总时间
             */
            static easeIn(t: number, d: number): number;
            /**
             * 缓动函数出口，表示从最大值到 0 的缓动（开始快减速，后面变慢）
             * @param t 当前时间
             * @param d 缓动总时间
             */
            static easeOut(t: number, d: number): number;
            /**
             * 缓动函数入口和出口，表示从 0 到最大值再到 0 的缓动（先慢加速，后面快减速）
             * @param t 当前时间
             * @param d 缓动总时间
             */
            static easeInOut(t: number, d: number): number;
        }
        class Cubic {
            /**
             * easeIn方法提供了一个以慢速开始，然后逐渐加速的缓动函数。
             * @param t 当前时间，动画已经持续的时间，范围在0到d之间，其中d是动画的总时间。
             * @param d 动画的总时间，即动画将从开始到结束的持续时间。
             * @returns 根据动画的当前时间计算出的位置值，该位置值在0到1之间。
             */
            static easeIn(t: number, d: number): number;
            /**
             * easeOut方法提供了一个以快速开始，然后逐渐减速的缓动函数。
             * @param t 当前时间，动画已经持续的时间，范围在0到d之间，其中d是动画的总时间。
             * @param d 动画的总时间，即动画将从开始到结束的持续时间。
             * @returns 根据动画的当前时间计算出的位置值，该位置值在0到1之间。
             */
            static easeOut(t: number, d: number): number;
            /**
             * easeInOut方法提供了一个慢速开始，然后加速，然后减速的缓动函数。
             * @param t 当前时间，动画已经持续的时间，范围在0到d之间，其中d是动画的总时间。
             * @param d 动画的总时间，即动画将从开始到结束的持续时间。
             * @returns 根据动画的当前时间计算出的位置值，该位置值在0到1之间。
             */
            static easeInOut(t: number, d: number): number;
        }
        class Elastic {
            /**
             * 弹性函数的 easeIn 版本
             * @param t - 已经经过的时间
             * @param d - 动画的总时间
             * @returns 经过缓动函数计算后的值
             */
            static easeIn(t: number, d: number): number;
            /**
             * 弹性函数的 easeOut 版本
             * @param t - 已经经过的时间
             * @param d - 动画的总时间
             * @returns 经过缓动函数计算后的值
             */
            static easeOut(t: number, d: number): number;
            /**
             * 弹性函数的 easeInOut 版本
             * @param t - 已经经过的时间
             * @param d - 动画的总时间
             * @returns 经过缓动函数计算后的值
             */
            static easeInOut(t: number, d: number): number;
            /**
             * 弹性函数的 punch 版本
             * @param t - 已经经过的时间
             * @param d - 动画的总时间
             * @returns 经过缓动函数计算后的值
             */
            static punch(t: number, d: number): number;
        }
        class Exponential {
            /**
             * Exponential 缓动函数 - easeIn
             * @param t 当前时间
             * @param d 持续时间
             * @returns 缓动值
             */
            static easeIn(t: number, d: number): number;
            /**
             * Exponential 缓动函数 - easeOut
             * @param t 当前时间
             * @param d 持续时间
             * @returns 缓动值
             */
            static easeOut(t: number, d: number): number;
            /**
             * Exponential 缓动函数 - easeInOut
             * @param t 当前时间
             * @param d 持续时间
             * @returns 缓动值
             */
            static easeInOut(t: number, d: number): number;
        }
        class Quartic {
            /**
             * Quartic 缓动函数的 easeIn 版本
             * @param t 当前时间
             * @param d 持续时间
             * @returns 根据当前时间计算出的值
             */
            static easeIn(t: number, d: number): number;
            /**
             * Quartic 缓动函数的 easeOut 版本
             * @param t 当前时间
             * @param d 持续时间
             * @returns 根据当前时间计算出的值
             */
            static easeOut(t: number, d: number): number;
            /**
             * Quartic 缓动函数的 easeInOut 版本
             * @param t 当前时间
             * @param d 持续时间
             * @returns 根据当前时间计算出的值
             */
            static easeInOut(t: number, d: number): number;
        }
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
            static easeIn(t: number, d: number): number;
            /**
             * 缓动函数，具有 Quintic easeOut 效果
             * @param t 当前时间（单位：毫秒）
             * @param d 持续时间（单位：毫秒）
             * @returns 缓动值
             */
            static easeOut(t: number, d: number): number;
            /**
             * 缓动函数，具有 Quintic easeInOut 效果
             * @param t 当前时间（单位：毫秒）
             * @param d 持续时间（单位：毫秒）
             * @returns 缓动值
             */
            static easeInOut(t: number, d: number): number;
        }
        class Sinusoidal {
            /**
             * Sinusoidal 类的缓动入方法。
             * @param t 当前时间（单位：毫秒）
             * @param d 持续时间（单位：毫秒）
             * @returns 介于 0 和 1 之间的数字，表示当前时间的值
             */
            static easeIn(t: number, d: number): number;
            /**
             * Sinusoidal 类的缓动出方法。
             * @param t 当前时间（单位：毫秒）
             * @param d 持续时间（单位：毫秒）
             * @returns 介于 0 和 1 之间的数字，表示当前时间的值
             */
            static easeOut(t: number, d: number): number;
            /**
             * Sinusoidal 类的缓动入出方法。
             * @param t 当前时间（单位：毫秒）
             * @param d 持续时间（单位：毫秒）
             * @returns 介于 0 和 1 之间的数字，表示当前时间的值
             */
            static easeInOut(t: number, d: number): number;
        }
    }
}
declare module es {
    /**
     * 一系列静态方法来处理所有常见的tween类型结构，以及它们的unclamped lerps.unclamped lerps对于超过0-1范围的bounce、elastic或其他tweens是必需的
     */
    class Lerps {
        /**
         * 提供通用的线性插值方法，支持数字、矩形和二维向量类型。
         * @param from 起点值
         * @param to 终点值
         * @param t 插值参数，取值范围[0, 1]
         * @returns 返回两个值的插值结果
         */
        static lerp(from: number, to: number, t: number): number;
        static lerp(from: Rectangle, to: Rectangle, t: number): Rectangle;
        static lerp(from: Vector2, to: Vector2, t: number): Vector2;
        /**
         * 计算两个向量之间的角度差并使用线性插值函数进行插值
         * @param from 起始向量
         * @param to 目标向量
         * @param t 插值因子
         * @returns 插值后的向量
         */
        static angleLerp(from: Vector2, to: Vector2, t: number): Vector2;
        /**
         * 根据不同类型的数据，使用指定的缓动类型对两个值进行插值
         * @param easeType 缓动类型
         * @param from 起始值
         * @param to 目标值
         * @param t 当前时间（相对于持续时间的百分比）
         * @param duration 持续时间
         * @returns 两个值之间的插值
         */
        static ease(easeType: EaseType, from: Rectangle, to: Rectangle, t: number, duration: number): any;
        static ease(easeType: EaseType, from: Vector2, to: Vector2, t: number, duration: number): any;
        static ease(easeType: EaseType, from: number, to: number, t: number, duration: number): any;
        /**
         * 通过提供的t值和持续时间使用给定的缓动类型在两个Vector2之间进行角度插值。
         * @param easeType 缓动类型
         * @param from 开始的向量
         * @param to 结束的向量
         * @param t 当前时间在持续时间内的比例
         * @param duration 持续时间
         * @returns 插值后的Vector2值
         */
        static easeAngle(easeType: EaseType, from: Vector2, to: Vector2, t: number, duration: number): Vector2;
        /**
         * 使用快速弹簧算法来实现平滑过渡。返回经过弹簧计算后的当前值。
         * @param currentValue 当前值
         * @param targetValue 目标值
         * @param velocity 当前速度
         * @param dampingRatio 阻尼比例
         * @param angularFrequency 角频率
         */
        static fastSpring(currentValue: Vector2, targetValue: Vector2, velocity: Vector2, dampingRatio: number, angularFrequency: number): Vector2;
    }
}
declare module es {
    /**
     * 一系列强类型、可链式的方法来设置各种tween属性
     */
    interface ITween<T> extends ITweenControl {
        /**
         * 设置该tween的易用性类型
         * @param easeType
         */
        setEaseType(easeType: EaseType): ITween<T>;
        /**
         * 设置启动tween前的延迟
         * @param delay
         */
        setDelay(delay: number): ITween<T>;
        /**
         * 设置tween的持续时间
         * @param duration
         */
        setDuration(duration: number): ITween<T>;
        /**
         * 设置这个tween使用的timeScale。
         * TimeScale将与Time.deltaTime/Time.unscaledDeltaTime相乘，从而得到tween实际使用的delta时间
         * @param timeScale
         */
        setTimeScale(timeScale: number): ITween<T>;
        /**
         * 设置tween使用Time.unscaledDeltaTime代替Time.deltaTime
         */
        setIsTimeScaleIndependent(): ITween<T>;
        /**
         * 设置当tween完成时应该调用的动作
         * @param completionHandler
         */
        setCompletionHandler(completionHandler: (tween: ITween<T>) => void): ITween<T>;
        /**
         * 设置tween的循环类型。一个pingpong循环意味着从开始-结束-开始
         * @param loopType
         * @param loops
         * @param delayBetweenLoops
         */
        setLoops(loopType: LoopType, loops: number, delayBetweenLoops: number): ITween<T>;
        /**
         * 设置tween的起始位置
         * @param from
         */
        setFrom(from: T): ITween<T>;
        /**
         * 通过重置tween的from/to值和持续时间，为重复使用tween做准备。
         * @param from
         * @param to
         * @param duration
         */
        prepareForReuse(from: T, to: T, duration: number): ITween<T>;
        /**
         * 如果为true(默认值)，tween将在使用后被回收。
         * 如果在TweenManager类中进行了配置，所有的Tween<T>子类都有自己相关的自动缓存
         * @param shouldRecycleTween
         */
        setRecycleTween(shouldRecycleTween: boolean): ITween<T>;
        /**
         * 帮助程序，只是将tween的to值设置为相对于其当前值的+从使tween
         */
        setIsRelative(): ITween<T>;
        /**
         * 允许你通过tween.context.context来设置任何可检索的对象引用。
         * 这对于避免完成处理程序方法的闭包分配是很方便的。
         * 你也可以在TweenManager中搜索具有特定上下文的所有tweens
         * @param context
         */
        setContext(context: any): ITween<T>;
        /**
         * 允许你添加一个tween，这个tween完成后会被运行。
         * 注意 nextTween 必须是一个 ITweenable! 同时注意，所有的ITweenT都是ITweenable
         * @param nextTween
         */
        setNextTween(nextTween: ITweenable): ITween<T>;
    }
}
declare module es {
    /**
     * 更多具体的Tween播放控制在这里
     */
    interface ITweenControl extends ITweenable {
        readonly discriminator: "ITweenControl";
        /**
         * 当使用匿名方法时，您可以在任何回调（如完成处理程序）中使用该属性来避免分配
         */
        context: any;
        /**
         * 将tween扭曲为elapsedTime，并将其限制在0和duration之间，无论tween对象是暂停、完成还是运行，都会立即更新
         * @param elapsedTime 所用时间
         */
        jumpToElapsedTime(elapsedTime: number): any;
        /**
         * 当从StartCoroutine调用时，它将直到tween完成
         */
        waitForCompletion(): any;
        /**
         *  获取tween的目标，如果TweenTargets不一定都是一个对象，则为null，它的唯一真正用途是让TweenManager按目标查找tweens的列表
         */
        getTargetObject(): any;
    }
}
declare module es {
    /**
     * 任何想要被weened的对象都需要实现这个功能。
     * TweenManager内部喜欢做一个简单的对象来实现这个接口，并存储一个对被tweened对象的引用
     */
    interface ITweenTarget<T> {
        /**
         * 在你选择的对象上设置最终的tweened值
         * @param value
         */
        setTweenedValue(value: T): any;
        getTweenedValue(): T;
        /**
         * 获取tween的目标，如果TweenTargets不一定都是一个对象，则为null，它的唯一真正用途是让TweenManager按目标查找tweens的列表
         */
        getTargetObject(): any;
    }
}
declare module es {
    interface ITweenable {
        readonly discriminator: string;
        /**
         * 就像内部的Update一样，每一帧都被TweenManager调用
         */
        tick(): boolean;
        /**
         * 当一个tween被移除时，由TweenManager调用。子
         * 类可以选择自己回收。子类应该首先在其实现中检查_shouldRecycleTween bool!
         */
        recycleSelf(): any;
        /**
         * 检查是否有tween在运行
         */
        isRunning(): boolean;
        /**
         * 启动tween
         */
        start(): any;
        /**
         * 暂停
         */
        pause(): any;
        /**
         * 暂停后恢复tween
         */
        resume(): any;
        /**
         * 停止tween，并可选择将其完成
         * @param bringToCompletion
         */
        stop(bringToCompletion: boolean): any;
    }
}
declare module es {
    interface IAnimFrame {
        t: number;
        value: number;
    }
    class AnimCurve {
        get points(): IAnimFrame[];
        constructor(points: IAnimFrame[]);
        lerp(t: number): number;
        _points: IAnimFrame[];
    }
}
declare module es {
    /**
     * 用于包装事件的一个小类
     */
    class FuncPack {
        /** 函数 */
        func: Function;
        /** 上下文 */
        context: any;
        constructor(func: Function, context: any);
    }
    /**
     * 用于事件管理
     */
    class Emitter<T> {
        private _messageTable;
        constructor();
        /**
         * 开始监听项
         * @param eventType 监听类型
         * @param handler 监听函数
         * @param context 监听上下文
         */
        addObserver(eventType: T, handler: Function, context: any): void;
        /**
         * 移除监听项
         * @param eventType 事件类型
         * @param handler 事件函数
         */
        removeObserver(eventType: T, handler: Function): void;
        /**
         * 触发该事件
         * @param eventType 事件类型
         * @param data 事件数据
         */
        emit(eventType: T, ...data: any[]): void;
        /**
         * 判断是否存在该类型的观察者
         * @param eventType 事件类型
         * @param handler 事件函数
         */
        hasObserver(eventType: T, handler: Function): boolean;
    }
}
declare module es {
    enum Edge {
        top = 0,
        bottom = 1,
        left = 2,
        right = 3
    }
}
declare module es {
    class EqualityComparer<T> implements IEqualityComparer<T> {
        static default<T>(): EqualityComparer<T>;
        protected constructor();
        equals(x: T, y: T): boolean;
        getHashCode(o: T): number;
        private _getHashCodeForNumber;
        private _getHashCodeForString;
        private forOwn;
    }
}
declare module es {
    class Hash {
        /**
         * 从一个字节数组中计算一个哈希值
         * @param data
         */
        static computeHash(...data: number[]): number;
    }
}
declare module es {
    interface IComparer<T> {
        compare(x: T, y: T): number;
    }
}
declare module es {
    /**
     * 对象声明自己的平等方法和Hashcode的生成
     */
    interface IEqualityComparable {
        /**
         * 确定另一个对象是否等于这个实例
         * @param other
         */
        equals(other: any): boolean;
    }
}
declare module es {
    /**
     * 为确定对象的哈希码和两个项目是否相等提供接口
     */
    interface IEqualityComparer<T> {
        /**
         * 判断两个对象是否相等
         * @param x
         * @param y
         */
        equals(x: T, y: T): boolean;
        /**
         * 生成对象的哈希码
         * @param value
         */
        getHashCode(value: T): number;
    }
}
declare module es {
    /**
     * 实现该接口用于判定两个对象是否相等的快速接口
     */
    interface IEquatable<T> {
        equals(other: T): boolean;
    }
}
declare module es {
    interface IListener {
        caller: object;
        callback: Function;
    }
    interface IObservable {
        addListener(caller: object, callback: Function): any;
        removeListener(caller: object, callback: Function): any;
        clearListener(): any;
        clearListenerWithCaller(caller: object): any;
    }
    class Observable implements IObservable {
        constructor();
        addListener(caller: object, callback: Function): void;
        removeListener(caller: object, callback: Function): void;
        clearListener(): void;
        clearListenerWithCaller(caller: object): void;
        notify(...args: any[]): void;
        private _listeners;
    }
    class ObservableT<T> extends Observable {
        addListener(caller: object, callback: (arg: T) => void): void;
        removeListener(caller: object, callback: (arg: T) => void): void;
        notify(arg: T): void;
    }
    class ObservableTT<T, R> extends Observable {
        addListener(caller: object, callback: (arg1: T, arg2: R) => void): void;
        removeListener(caller: object, callback: (arg: T, arg2: R) => void): void;
        notify(arg1: T, arg2: R): void;
    }
    class Command implements IObservable {
        constructor(caller: object, action: Function);
        bindAction(caller: object, action: Function): void;
        dispatch(...args: any[]): void;
        addListener(caller: object, callback: Function): void;
        removeListener(caller: object, callback: Function): void;
        clearListener(): void;
        clearListenerWithCaller(caller: object): void;
        private _onExec;
        private _caller;
        private _action;
    }
    class ValueChangeCommand<T> implements IObservable {
        constructor(value: T);
        get onValueChange(): Observable;
        get value(): T;
        set value(newValue: T);
        dispatch(value: T): void;
        addListener(caller: object, callback: Function): void;
        removeListener(caller: object, callback: Function): void;
        clearListener(): void;
        clearListenerWithCaller(caller: object): void;
        private _onValueChange;
        private _value;
    }
}
declare module es {
    class Out<T> {
        value: T;
        constructor(value?: T);
    }
}
declare module es {
    class Ref<T> {
        value: T;
        constructor(value: T);
    }
}
declare module es {
    class Screen {
        static width: number;
        static height: number;
        static get size(): Vector2;
        static get center(): Vector2;
    }
}
declare module es {
    /**
     * 管理数值的简单助手类。它存储值，直到累计的总数大于1。一旦超过1，该值将在调用update时添加到amount中。
     */
    class SubpixelNumber {
        remainder: number;
        /**
         * 以amount递增余数，将值截断为int，存储新的余数并将amount设置为当前值。
         * @param amount
         */
        update(amount: number): number;
        /**
         * 将余数重置为0。当一个物体与一个不可移动的物体碰撞时有用。
         * 在这种情况下，您将希望将亚像素余数归零，因为它是空的和无效的碰撞。
         */
        reset(): void;
    }
}
declare module es {
    /**
     * 简单的剪耳三角测量器，最终的三角形将出现在triangleIndices列表中。
     */
    class Triangulator {
        /**
         * 上次三角函数调用中使用的点列表的三角列表条目索引
         */
        triangleIndices: number[];
        private _triPrev;
        private _triNext;
        static testPointTriangle(point: Vector2, a: Vector2, b: Vector2, c: Vector2): boolean;
        /**
         * 计算一个三角形列表，该列表完全覆盖给定点集所包含的区域。如果点不是CCW，则将arePointsCCW参数传递为false
         * @param points 定义封闭路径的点列表
         * @param arePointsCCW
         */
        triangulate(points: Vector2[], arePointsCCW?: boolean): void;
        private initialize;
    }
}
declare module es {
    class UUID {
        static randomUUID(): string;
    }
}
declare module es {
    interface Class extends Function {
    }
    function getClassName(klass: any): string;
}
declare namespace es {
    /**
     * 记录时间的持续时间，一些设计灵感来自物理秒表。
     */
    export class Stopwatch {
        private readonly getSystemTime;
        /**
         * 秒表启动的系统时间。
         * undefined，如果秒表尚未启动，或已复位。
         */
        private _startSystemTime;
        /**
         * 秒表停止的系统时间。
         * undefined，如果秒表目前没有停止，尚未开始，或已复位。
         */
        private _stopSystemTime;
        /** 自上次复位以来，秒表已停止的系统时间总数。 */
        private _stopDuration;
        /**
         * 用秒表计时，当前等待的切片开始的时间。
         * undefined，如果秒表尚未启动，或已复位。
         */
        private _pendingSliceStartStopwatchTime;
        /**
         * 记录自上次复位以来所有已完成切片的结果。
         */
        private _completeSlices;
        constructor(getSystemTime?: GetTimeFunc);
        getState(): State;
        isIdle(): boolean;
        isRunning(): boolean;
        isStopped(): boolean;
        /**
         *
         */
        slice(): Slice;
        /**
         * 获取自上次复位以来该秒表已完成/记录的所有片的列表。
         */
        getCompletedSlices(): Slice[];
        /**
         * 获取自上次重置以来该秒表已完成/记录的所有片的列表，以及当前挂起的片。
         */
        getCompletedAndPendingSlices(): Slice[];
        /**
         * 获取关于这个秒表当前挂起的切片的详细信息。
         */
        getPendingSlice(): Slice;
        /**
         * 获取当前秒表时间。这是这个秒表自上次复位以来运行的系统时间总数。
         */
        getTime(): number;
        /**
         * 完全重置这个秒表到它的初始状态。清除所有记录的运行持续时间、切片等。
         */
        reset(): void;
        /**
         * 开始(或继续)运行秒表。
         * @param forceReset
         */
        start(forceReset?: boolean): void;
        /**
         *
         * @param recordPendingSlice
         */
        stop(recordPendingSlice?: boolean): number;
        /**
         * 计算指定秒表时间的当前挂起片。
         * @param endStopwatchTime
         */
        private calculatePendingSlice;
        /**
         * 计算指定系统时间的当前秒表时间。
         * @param endSystemTime
         */
        private caculateStopwatchTime;
        /**
         * 获取与当前秒表时间等效的系统时间。
         * 如果该秒表当前停止，则返回该秒表停止时的系统时间。
         */
        private getSystemTimeOfCurrentStopwatchTime;
        /**
         * 结束/记录当前挂起的片的私有实现。
         * @param endStopwatchTime
         */
        private recordPendingSlice;
    }
    /**
     * 返回某个系统的“当前时间”的函数。
     * 惟一的要求是，对该函数的每次调用都必须返回一个大于或等于前一次对该函数的调用的数字。
     */
    export type GetTimeFunc = () => number;
    enum State {
        /** 秒表尚未启动，或已复位。 */
        IDLE = "IDLE",
        /** 秒表正在运行。 */
        RUNNING = "RUNNING",
        /** 秒表以前还在跑，但现在已经停了。 */
        STOPPED = "STOPPED"
    }
    export function setDefaultSystemTimeGetter(systemTimeGetter?: GetTimeFunc): void;
    /**
     * 由秒表记录的单个“薄片”的测量值
     */
    interface Slice {
        /** 秒表显示的时间在这一片开始的时候。 */
        readonly startTime: number;
        /** 秒表在这片片尾的时间。 */
        readonly endTime: number;
        /** 该切片的运行时间 */
        readonly duration: number;
    }
    export {};
}
declare module es {
    class Bag<E> implements ImmutableBag<E> {
        size_: number;
        length: number;
        private array;
        constructor(capacity?: number);
        removeAt(index: number): E;
        remove(e: E): boolean;
        removeLast(): E;
        contains(e: E): boolean;
        removeAll(bag: ImmutableBag<E>): boolean;
        get(index: number): E;
        safeGet(index: number): E;
        size(): number;
        getCapacity(): number;
        isIndexWithinBounds(index: number): boolean;
        isEmpty(): boolean;
        add(e: E): void;
        set(index: number, e: E): void;
        grow(newCapacity?: number): void;
        ensureCapacity(index: number): void;
        clear(): void;
        addAll(items: ImmutableBag<E>): void;
    }
}
declare module es {
    interface ImmutableBag<E> {
        get(index: number): E;
        size(): number;
        isEmpty(): boolean;
        contains(e: E): boolean;
    }
}
declare module es {
    export class Node<T> {
        element: T;
        next: Node<T>;
        constructor(element: T, next?: Node<T>);
    }
    interface equalsFnType<T> {
        (a: T, b: T): boolean;
    }
    export function defaultEquals<T>(a: T, b: T): boolean;
    export class LinkedList<T> {
        protected count: number;
        protected next: any;
        protected equalsFn: equalsFnType<T>;
        protected head: Node<T>;
        constructor(equalsFn?: typeof defaultEquals);
        push(element: T): void;
        removeAt(index: number): T;
        getElementAt(index: number): Node<T>;
        insert(element: T, index: number): boolean;
        indexOf(element: T): number;
        remove(element: T): void;
        clear(): void;
        size(): number;
        isEmpty(): boolean;
        getHead(): Node<T>;
        toString(): string;
    }
    export {};
}
declare module es {
    /**
     * 可以用于列表池的简单类
     */
    class ListPool {
        private static readonly _objectQueue;
        /**
         * 预热缓存，使用最大的cacheCount对象填充缓存
         * @param cacheCount
         */
        static warmCache<T>(type: new (...args: any[]) => T, cacheCount: number): void;
        /**
         * 将缓存修剪为cacheCount项目
         * @param cacheCount
         */
        static trimCache<T>(type: new (...args: any[]) => T, cacheCount: number): void;
        /**
         * 清除缓存
         */
        static clearCache<T>(type: new (...args: any[]) => T): void;
        /**
         * 如果可以的话，从堆栈中弹出一个项
         */
        static obtain<T>(type: new (...args: any[]) => T): T[];
        /**
         * 将项推回堆栈
         * @param obj
         */
        static free<T>(type: new (...args: any[]) => T, obj: T[]): void;
        private static checkCreate;
    }
}
declare module es {
    /**
     * 用于管理一对对象的简单DTO
     */
    class Pair<T> {
        first: T;
        second: T;
        constructor(first: T, second: T);
        clear(): void;
        equals(other: Pair<T>): boolean;
    }
}
declare module es {
    class PairSet<T> {
        get all(): Array<Pair<T>>;
        has(pair: Pair<T>): boolean;
        add(pair: Pair<T>): void;
        remove(pair: Pair<T>): void;
        clear(): void;
        union(other: PairSet<T>): void;
        except(other: PairSet<T>): void;
        private _all;
    }
}
declare module es {
    class Pool {
        private static _objectQueue;
        /**
         * 预热缓存，使用最大的cacheCount对象填充缓存
         * @param type 要预热的类型
         * @param cacheCount 预热缓存数量
         */
        static warmCache<T>(type: new (...args: any[]) => T, cacheCount: number): void;
        /**
        * 将缓存修剪为cacheCount项目
        * @param type 要修剪的类型
        * @param cacheCount 修剪后的缓存数量
        */
        static trimCache<T>(type: new (...args: any[]) => T, cacheCount: number): void;
        /**
         * 清除缓存
         * @param type 要清除缓存的类型
         */
        static clearCache<T>(type: new (...args: any[]) => T): void;
        /**
         * 如果可以的话，从缓存中获取一个对象
         * @param type 要获取的类型
         */
        static obtain<T>(type: new (...args: any[]) => T): T;
        /**
         * 将对象推回缓存
         * @param type 对象的类型
         * @param obj 要推回的对象
         */
        static free<T>(type: new (...args: any[]) => T, obj: T): void;
        /**
         * 检查缓存中是否已存在给定类型的对象池，如果不存在则创建一个
         * @param type 要检查的类型
         */
        private static checkCreate;
    }
    interface IPoolable {
        reset(): void;
    }
    const isIPoolable: (props: any) => props is IPoolable;
}
declare module es {
    /**
     * startCoroutine返回的接口，它提供了中途停止coroutine的能力。
     */
    interface ICoroutine {
        /**
         * 停止Coroutine
         */
        stop(): any;
        /**
         * 设置Coroutine是否应该使用deltaTime或unscaledDeltaTime进行计时
         * @param useUnscaledDeltaTime
         */
        setUseUnscaledDeltaTime(useUnscaledDeltaTime: boolean): ICoroutine;
    }
    class Coroutine {
        /**
         * 导致Coroutine在指定的时间内暂停。在Coroutine.waitForSeconds的基础上，在Coroutine中使用Yield
         * @param seconds
         */
        static waitForSeconds(seconds: number): WaitForSeconds;
    }
    /**
     * 帮助类，用于当一个coroutine想要暂停一段时间时。返回Coroutine.waitForSeconds返回其中一个
     */
    class WaitForSeconds {
        static waiter: WaitForSeconds;
        waitTime: number;
        wait(seconds: number): WaitForSeconds;
    }
}
declare module es {
    /**
     * CoroutineManager用于隐藏Coroutine所需数据的内部类
     */
    class CoroutineImpl implements ICoroutine, IPoolable {
        enumerator: any;
        /**
         * 每当产生一个延迟，它就会被添加到跟踪延迟的waitTimer中
         */
        waitTimer: number;
        isDone: boolean;
        waitForCoroutine: CoroutineImpl;
        useUnscaledDeltaTime: boolean;
        stop(): void;
        setUseUnscaledDeltaTime(useUnscaledDeltaTime: boolean): this;
        prepareForUse(): void;
        reset(): void;
    }
    class CoroutineManager extends GlobalManager {
        /**
         * 标志来跟踪我们何时处于更新循环中。
         * 如果在更新循环中启动了一个新的coroutine，我们必须将它贴在shouldRunNextFrame列表中，以避免在迭代时修改一个数组
         */
        _isInUpdate: boolean;
        _unblockedCoroutines: CoroutineImpl[];
        _shouldRunNextFrame: CoroutineImpl[];
        /**
         * 立即停止并清除所有协程
         */
        clearAllCoroutines(): void;
        /**
         * 将IEnumerator添加到CoroutineManager中
         * Coroutine在每一帧调用Update之前被执行
         * @param enumerator
         */
        startCoroutine<T>(enumerator: Iterator<T> | (() => Iterator<T>)): CoroutineImpl | null;
        private getOrCreateCoroutine;
        private addCoroutine;
        update(): void;
        /**
         * 勾选一个coroutine，如果该coroutine应该在下一帧继续运行，则返回true。本方法会将完成的coroutine放回Pool
         * @param coroutine
         */
        tickCoroutine(coroutine: CoroutineImpl): boolean;
    }
}
declare module es {
    class MaxRectsBinPack {
        binWidth: number;
        binHeight: number;
        allowRotations: boolean;
        usedRectangles: Rectangle[];
        freeRectangles: Rectangle[];
        constructor(width: number, height: number, rotations?: boolean);
        init(width: number, height: number, rotations?: boolean): void;
        insert(width: number, height: number): Rectangle;
        findPositionForNewNodeBestAreaFit(width: number, height: number, bestAreaFit: Ref<number>, bestShortSideFit: Ref<number>): Rectangle;
        splitFreeNode(freeNode: Rectangle, usedNode: Rectangle): boolean;
        pruneFreeList(): void;
        isContainedIn(a: Rectangle, b: Rectangle): boolean;
    }
}
declare module es {
    class ArrayUtils {
        /**
         * 执行冒泡排序
         * @param ary
         */
        static bubbleSort(ary: number[]): void;
        /**
         * 执行插入排序
         * @param ary
         */
        static insertionSort(ary: number[]): void;
        /**
         * 执行二分搜索
         * @param ary 搜索的数组（必须排序过）
         * @param value 需要搜索的值
         * @returns 返回匹配结果的数组索引
         */
        static binarySearch(ary: number[], value: number): number;
        /**
         * 返回匹配项的索引
         * @param ary
         * @param num
         */
        static findElementIndex(ary: any[], num: any): any;
        /**
         * 返回数组中最大值的索引
         * @param ary
         */
        static getMaxElementIndex(ary: number[]): number;
        /**
         * 返回数组中最小值的索引
         * @param ary
         */
        static getMinElementIndex(ary: number[]): number;
        /**
         * 返回一个"唯一性"数组
         * @param ary 需要唯一性的数组
         * @returns 唯一性的数组
         *
         * @tutorial
         * 比如: [1, 2, 2, 3, 4]
         * 返回: [1, 2, 3, 4]
         */
        static getUniqueAry(ary: number[]): number[];
        /**
         * 返回2个数组中不同的部分
         * 比如数组A = [1, 2, 3, 4, 6]
         *    数组B = [0, 2, 1, 3, 4]
         * 返回[6, 0]
         * @param    aryA
         * @param    aryB
         * @return
         */
        static getDifferAry(aryA: number[], aryB: number[]): number[];
        /**
         * 交换数组元素
         * @param    array    目标数组
         * @param    index1    交换后的索引
         * @param    index2    交换前的索引
         */
        static swap(array: any[], index1: number, index2: number): void;
        /**
         * 清除列表
         * @param ary
         */
        static clearList(ary: any[]): void;
        /**
         * 克隆一个数组
         * @param    ary 需要克隆的数组
         * @return  克隆的数组
         */
        static cloneList(ary: any[]): any[];
        /**
         * 判断2个数组是否相同
         * @param ary1 数组1
         * @param ary2 数组2
         */
        static equals(ary1: number[], ary2: number[]): Boolean;
        /**
         * 根据索引插入元素，索引和索引后的元素都向后移动一位
         * @param ary
         * @param index 插入索引
         * @param value 插入的元素
         * @returns 插入的元素 未插入则返回空
         */
        static insert(ary: any[], index: number, value: any): any;
        /**
         * 打乱数组 Fisher–Yates shuffle
         * @param list
         */
        static shuffle<T>(list: T[]): void;
        /**
         * 如果项目已经在列表中，返回false，如果成功添加，返回true
         * @param list
         * @param item
         */
        static addIfNotPresent<T>(list: T[], item: T): boolean;
        /**
         * 返回列表中的最后一项。列表中至少应该有一个项目
         * @param list
         */
        static lastItem<T>(list: T[]): T;
        /**
         * 从列表中随机获取一个项目。不清空检查列表!
         * @param list
         */
        static randomItem<T>(list: T[]): T;
        /**
         * 从列表中随机获取物品。不清空检查列表，也不验证列表数是否大于项目数。返回的List可以通过ListPool.free放回池中
         * @param list
         * @param itemCount 从列表中返回的随机项目的数量
         */
        static randomItems<T>(type: any, list: T[], itemCount: number): T[];
    }
}
declare module es {
    class Base64Utils {
        private static _keyStr;
        /**
         * 判断是否原生支持Base64位解析
         */
        static get nativeBase64(): boolean;
        /**
         * 解码
         * @param input
         */
        static decode(input: string): string;
        /**
         * 编码
         * @param input
         */
        static encode(input: string): string;
        /**
         * 解析Base64格式数据
         * @param input
         * @param bytes
         */
        static decodeBase64AsArray(input: string, bytes: number): Uint32Array;
        /**
         * 暂时不支持
         * @param data
         * @param decoded
         * @param compression
         * @private
         */
        static decompress(data: string, decoded: any, compression: string): any;
        /**
         * 解析csv数据
         * @param input
         */
        static decodeCSV(input: string): Array<number>;
    }
}
declare module es {
    class EdgeExt {
        static oppositeEdge(self: Edge): Edge;
        /**
         * 如果边是右或左，则返回true
         * @param self
         */
        static isHorizontal(self: Edge): boolean;
        /**
         * 如果边是顶部或底部，则返回true
         * @param self
         */
        static isVertical(self: Edge): boolean;
    }
}
declare module es {
    class NumberExtension {
        static toNumber(value: any): number;
    }
}
declare module es {
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
        static randrange(start: number, stop: number, step?: number): number;
        /**
         * 返回a 到 b之间的随机整数，包括 a 和 b
         * @param a
         * @param b
         * @return [a, b] 之间的随机整数
         *
         */
        static randint(a: number, b: number): number;
        /**
         * 返回 a - b之间的随机数，不包括  Math.max(a, b)
         * @param a
         * @param b
         * @return 假设 a < b, [a, b)
         */
        static randnum(a: number, b: number): number;
        /**
         * 打乱数组
         * @param array
         * @return
         */
        static shuffle(array: any[]): any[];
        /**
         * 从序列中随机取一个元素
         * @param sequence 可以是 数组、 vector，等只要是有length属性，并且可以用数字索引获取元素的对象，
         *                 另外，字符串也是允许的。
         * @return 序列中的某一个元素
         *
         */
        static choice(sequence: any): any;
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
        static sample(sequence: any[], num: number): any[];
        /**
         * 返回 0.0 - 1.0 之间的随机数，等同于 Math.random()
         * @return Math.random()
         *
         */
        static random(): number;
        /**
         * 计算概率
         * @param    chance 概率
         * @return
         */
        static boolean(chance?: number): boolean;
        private static _randomCompare;
    }
}
declare module es {
    class RectangleExt {
        /**
         * 获取指定边的位置
         * @param rect
         * @param edge
         */
        static getSide(rect: Rectangle, edge: Edge): number;
        /**
         * 计算两个矩形的并集。结果将是一个包含其他两个的矩形。
         * @param first
         * @param point
         */
        static union(first: Rectangle, point: Vector2): Rectangle;
        static getHalfRect(rect: Rectangle, edge: Edge): Rectangle;
        /**
         * 获取矩形的一部分，其宽度/高度的大小位于矩形的边缘，但仍然包含在其中。
         * @param rect
         * @param edge
         * @param size
         */
        static getRectEdgePortion(rect: Rectangle, edge: Edge, size?: number): Rectangle;
        static expandSide(rect: Rectangle, edge: Edge, amount: number): void;
        static contract(rect: Rectangle, horizontalAmount: any, verticalAmount: any): void;
        /**
         * 给定多边形的点，计算其边界
         * @param points
         */
        static boundsFromPolygonVector(points: Vector2[]): Rectangle;
        /**
         * 创建一个给定最小/最大点（左上角，右下角）的矩形
         * @param min
         * @param max
         */
        static fromMinMaxVector(min: Vector2, max: Vector2): Rectangle;
        /**
         * 返回一个跨越当前边界和提供的delta位置的Bounds
         * @param rect
         * @param deltaX
         * @param deltaY
         */
        static getSweptBroadphaseBounds(rect: Rectangle, deltaX: number, deltaY: number): Rectangle;
        /**
         * 如果矩形发生碰撞，返回true
         * moveX和moveY将返回b1为避免碰撞而必须移动的移动量
         * @param rect
         * @param other
         * @param moveX
         * @param moveY
         */
        collisionCheck(rect: Rectangle, other: Rectangle, moveX: Ref<number>, moveY: Ref<number>): boolean;
        /**
         * 计算两个矩形之间有符号的交点深度
         * @param rectA
         * @param rectB
         * @returns 两个相交的矩形之间的重叠量。
         * 这些深度值可以是负值，取决于矩形相交的边。
         * 这允许调用者确定正确的推送对象的方向，以解决碰撞问题。
         * 如果矩形不相交，则返回Vector2.zero。
         */
        static getIntersectionDepth(rectA: Rectangle, rectB: Rectangle): Vector2;
        static getClosestPointOnBoundsToOrigin(rect: Rectangle): Vector2;
        /**
         * 将Rectangle中或上的最接近点返回给定点
         * @param rect
         * @param point
         */
        static getClosestPointOnRectangleToPoint(rect: Rectangle, point: Vector2): Vector2;
        /**
         * 获取矩形边界上与给定点最接近的点
         * @param rect
         * @param point
         */
        static getClosestPointOnRectangleBorderToPoint(rect: Rectangle, point: Vector2): Vector2;
        static getMax(rect: Rectangle): Vector2;
        /**
         * 以Vector2的形式获取矩形的中心点
         * @param rect
         * @returns
         */
        static getCenter(rect: Rectangle): Vector2;
        /**
         * 给定多边形的点即可计算边界
         * @param points
         */
        static boundsFromPolygonPoints(points: Vector2[]): Rectangle;
        static calculateBounds(rect: Rectangle, parentPosition: Vector2, position: Vector2, origin: Vector2, scale: Vector2, rotation: number, width: number, height: number): void;
        /**
         * 缩放矩形
         * @param rect
         * @param scale
         */
        static scale(rect: Rectangle, scale: Vector2): void;
        static translate(rect: Rectangle, vec: Vector2): void;
    }
}
declare module es {
    class TextureUtils {
        static premultiplyAlpha(pixels: number[]): void;
    }
}
declare module es {
    class TypeUtils {
        static getType(obj: any): any;
    }
}
declare module es {
    class Vector2Ext {
        /**
         * 检查三角形是CCW还是CW
         * @param a
         * @param center
         * @param c
         */
        static isTriangleCCW(a: Vector2, center: Vector2, c: Vector2): boolean;
        static halfVector(): Vector2;
        /**
         * 计算二维伪叉乘点(Perp(u)， v)
         * @param u
         * @param v
         */
        static cross(u: Vector2, v: Vector2): number;
        /**
         * 返回垂直于传入向量的向量
         * @param first
         * @param second
         */
        static perpendicular(first: Vector2, second: Vector2): Vector2;
        /**
         * 将x/y值翻转，并将y反转，得到垂直于x/y的值
         * @param original
         */
        static perpendicularFlip(original: Vector2): Vector2;
        /**
         * 返回两个向量之间的角度，单位为度
         * @param from
         * @param to
         */
        static angle(from: Vector2, to: Vector2): number;
        /**
         * 返回以自度为中心的左右角度
         * @param self
         * @param left
         * @param right
         */
        static angleBetween(self: Vector2, left: Vector2, right: Vector2): number;
        /**
         * 给定两条直线(ab和cd)，求交点
         * @param a
         * @param b
         * @param c
         * @param d
         * @param intersection
         */
        static getRayIntersection(a: Vector2, b: Vector2, c: Vector2, d: Vector2, intersection?: Vector2): boolean;
        /**
         * Vector2的临时解决方案
         * 标准化把向量弄乱了
         * @param vec
         */
        static normalize(vec: Vector2): void;
        /**
         * 通过指定的矩阵对Vector2的数组中的向量应用变换，并将结果放置在另一个数组中。
         * @param sourceArray
         * @param sourceIndex
         * @param matrix
         * @param destinationArray
         * @param destinationIndex
         * @param length
         */
        static transformA(sourceArray: Vector2[], sourceIndex: number, matrix: Matrix2D, destinationArray: Vector2[], destinationIndex: number, length: number): void;
        /**
         * 创建一个新的Vector2，该Vector2包含了通过指定的Matrix进行的二维向量变换
         * @param position
         * @param matrix
         * @param result
         */
        static transformR(position: Vector2, matrix: Matrix2D, result?: Vector2): void;
        /**
         * 通过指定的矩阵对Vector2的数组中的所有向量应用变换，并将结果放到另一个数组中。
         * @param sourceArray
         * @param matrix
         * @param destinationArray
         */
        static transform(sourceArray: Vector2[], matrix: Matrix2D, destinationArray: Vector2[]): void;
        static round(vec: Vector2): Vector2;
    }
}
declare module es {
    class Enumerable {
        /**
         * 在指定范围内生成一个整数序列。
         */
        static range(start: number, count: number): List<number>;
        /**
         * 生成包含一个重复值的序列。
         */
        static repeat<T>(element: T, count: number): List<T>;
    }
}
declare module es {
    /**
     * 检查传递的参数是否为对象
     */
    const isObj: <T>(x: T) => boolean;
    /**
     * 创建一个否定谓词结果的函数
     */
    const negate: <T>(pred: (...args: T[]) => boolean) => (...args: T[]) => boolean;
    /**
     * 比较器助手
     */
    const composeComparers: <T>(previousComparer: (a: T, b: T) => number, currentComparer: (a: T, b: T) => number) => (a: T, b: T) => number;
    const keyComparer: <T>(_keySelector: (key: T) => string, descending?: boolean) => (a: T, b: T) => number;
}
declare module es {
    type PredicateType<T> = (value?: T, index?: number, list?: T[]) => boolean;
    export class List<T> {
        protected _elements: T[];
        /**
         * 默认为列表的元素
         */
        constructor(elements?: T[]);
        /**
         * 在列表的末尾添加一个对象。
         */
        add(element: T): void;
        /**
         * 将一个对象追加到列表的末尾。
         */
        append(element: T): void;
        /**
         * 在列表的开头添加一个对象。
         */
        prepend(element: T): void;
        /**
         * 将指定集合的元素添加到列表的末尾。
         */
        addRange(elements: T[]): void;
        /**
         * 使用指定的累加器函数将数组中的所有元素聚合成一个值。
         * @param accumulator 用于计算聚合值的累加器函数。
         * @param initialValue 可选参数，用于指定累加器函数的初始值。
         * @returns 聚合后的值。
         */
        aggregate<U>(accumulator: (accum: U, value?: T, index?: number, list?: T[]) => any, initialValue?: U): any;
        /**
         * 判断当前列表中的所有元素是否都满足指定条件
         * @param predicate 谓词函数，用于对列表中的每个元素进行评估
         * @returns {boolean} 如果列表中的所有元素都满足条件，则返回 true；否则返回 false
         */
        all(predicate: PredicateType<T>): boolean;
        /**
         * 该方法用于判断数组中是否存在元素
         * @param predicate 可选参数，用于检查是否有至少一个元素满足该函数
         * @returns 如果存在元素，返回 true；如果不存在元素，返回 false
         */
        any(predicate?: (element: T) => boolean): boolean;
        /**
         * 计算数组中所有元素的平均值
         * @param transform 可选参数，用于将数组中的每个元素转换成另外的值进行计算
         * @returns 数组的平均值
         */
        average(transform?: (value?: T, index?: number, list?: T[]) => any): number;
        /**
         * 将序列的元素转换为指定的类型。
         */
        cast<U>(): List<U>;
        /**
         * 从列表中删除所有元素。
         */
        clear(): void;
        /**
         * 连接两个序列。
         */
        concat(list: List<T>): List<T>;
        /**
         * 确定一个元素是否在列表中。
         */
        contains(element: T): boolean;
        /**
         * 计算数组中所有元素的数量，或者根据指定的条件计算符合条件的元素的数量。
         * @param predicate 可选参数，用于过滤元素的条件函数。
         * @returns 数组元素的数量。
         */
        count(): number;
        count(predicate: PredicateType<T>): number;
        /**
         * 返回当前数组，如果当前数组为空，则返回一个只包含默认值的新数组。
         * @param defaultValue 默认值。
         * @returns 当前数组，或者只包含默认值的新数组。
         */
        defaultIfEmpty(defaultValue?: T): List<T>;
        /**
         * 根据指定的键选择器从数组中去除重复的元素。
         * @param keySelector 用于选择每个元素的键的函数。
         * @returns 去重后的数组。
         */
        distinctBy(keySelector: (key: T) => string | number): List<T>;
        /**
         * 根据指定的索引获取数组中的元素
         * @param index 要获取的元素的索引
         * @returns 数组中的元素
         * @throws {Error} 如果索引小于 0 或大于等于数组长度，则抛出 "ArgumentOutOfRangeException" 异常。
         */
        elementAt(index: number): T;
        /**
         * 获取指定索引处的元素，如果索引超出数组范围，则返回 null。
         * @param index 索引。
         * @returns 指定索引处的元素，如果索引超出数组范围，则返回 null。
         */
        elementAtOrDefault(index: number): T | null;
        /**
         * 返回当前数组中不在指定数组中的元素集合。
         * @param source 指定数组。
         * @returns 当前数组中不在指定数组中的元素集合。
         */
        except(source: List<T>): List<T>;
        /**
         * 返回当前数组中第一个元素，或者符合条件的第一个元素。
         * @param predicate 符合条件的判断函数。
         * @returns 当前数组中第一个元素，或者符合条件的第一个元素。
         */
        first(): T;
        first(predicate: PredicateType<T>): T;
        /**
         * 根据指定的条件查询数组中第一个符合条件的元素，如果不存在符合条件的元素，则返回默认值 null 或 undefined。
         * @param predicate 可选参数，表示查询条件的谓词函数
         * @returns 符合条件的元素或默认值 null 或 undefined
         */
        firstOrDefault(): T;
        firstOrDefault(predicate: PredicateType<T>): T;
        /**
         * 对数组中的每个元素执行指定的操作
         * @param action 要执行的操作，可以是一个函数或函数表达式
         */
        forEach(action: (value?: T, index?: number, list?: T[]) => any): void;
        /**
         * 根据指定的键对数组元素进行分组，并返回一个包含分组结果的对象
         * @param grouper 指定的键，用于分组
         * @param mapper 可选参数，用于对分组后的每个元素进行转换的函数
         * @returns 包含分组结果的对象，其中键为分组后的键，值为分组后的元素组成的数组
         */
        groupBy<TResult>(grouper: (key: T) => string | number, mapper?: (element: T) => TResult): {
            [key: string]: TResult[];
        };
        /**
         * 将两个数组进行联接和分组操作
         * @param list 要联接的数组
         * @param key1 用于从第一个数组中选择分组键的函数
         * @param key2 用于从第二个数组中选择分组键的函数
         * @param result 用于将分组结果映射到输出元素的函数
         * @returns 经过联接和分组后的新数组
         */
        groupJoin<U, R>(list: List<U>, key1: (k: T) => any, key2: (k: U) => any, result: (first: T, second: List<U>) => R): List<R>;
        /**
         * 返回当前列表中指定元素的索引
         * @param element 要查找的元素
         * @returns {number} 元素在列表中的索引值，如果不存在，则返回 -1
         */
        indexOf(element: T): number;
        /**
         * 在数组的指定位置插入一个元素
         * @param index 要插入元素的位置
         * @param element 要插入的元素
         * @throws 如果索引超出了数组的范围，则抛出异常
         */
        insert(index: number, element: T): void;
        /**
         * 获取当前列表和另一个列表的交集
         * @param source 另一个列表
         * @returns {List<T>} 一个包含两个列表中相同元素的新列表对象
         */
        intersect(source: List<T>): List<T>;
        /**
         * 将当前列表和另一个列表中的元素进行联接
         * @param list 另一个列表
         * @param key1 当前列表的键选择器函数
         * @param key2 另一个列表的键选择器函数
         * @param result 结果选择器函数
         * @returns {List<R>} 一个包含联接后元素的新列表对象
         */
        join<U, R>(list: List<U>, key1: (key: T) => any, key2: (key: U) => any, result: (first: T, second: U) => R): List<R>;
        /**
         * 返回数组的最后一个元素或满足条件的最后一个元素
         * @param predicate 可选参数，用于筛选元素的函数
         * @returns 数组的最后一个元素或满足条件的最后一个元素
         * @throws 如果数组为空，则抛出异常
         */
        last(predicate?: PredicateType<T>): T;
        /**
         * 返回数组的最后一个元素或满足条件的最后一个元素，如果数组为空或没有满足条件的元素，则返回默认值 undefined
         * @param predicate 可选参数，用于筛选元素的函数
         * @returns 数组的最后一个元素或满足条件的最后一个元素，如果数组为空或没有满足条件的元素，则返回默认值 undefined
         */
        lastOrDefault(predicate?: PredicateType<T>): T;
        /**
         * 返回数组中的最大值，也可以通过 selector 函数对数组元素进行转换后再求最大值
         * @param selector 可选参数，用于对数组元素进行转换的函数
         * @returns 数组中的最大值，或者通过 selector 函数对数组元素进行转换后求得的最大值
         */
        max(selector?: (value: T, index: number, array: T[]) => number): number;
        /**
         * 返回数组中的最小值，也可以通过 selector 函数对数组元素进行转换后再求最小值
         * @param selector 可选参数，用于对数组元素进行转换的函数
         * @returns 数组中的最小值，或者通过 selector 函数对数组元素进行转换后求得的最小值
         */
        min(selector?: (value: T, index: number, array: T[]) => number): number;
        /**
         * 根据指定的类型，筛选数组中的元素并返回一个新的数组
         * @param type 指定的类型
         * @returns 新的数组，其中包含了数组中所有指定类型的元素
         */
        ofType<U>(type: any): List<U>;
        /**
         * 根据键按升序对序列中的元素进行排序。
         */
        orderBy(keySelector: (key: T) => any, comparer?: (a: T, b: T) => number): List<T>;
        /**
         * 按照指定的键选择器和比较器，对列表元素进行降序排序
         * @param keySelector 用于选择排序键的函数
         * @param comparer 可选参数，用于比较元素的函数，如果未指定则使用 keySelector 和降序排序
         * @returns 排序后的新 List<T> 对象
         */
        orderByDescending(keySelector: (key: T) => any, comparer?: (a: T, b: T) => number): List<T>;
        /**
         * 在已经按照一个或多个条件排序的列表上，再按照一个新的条件进行排序
         * @param keySelector 用于选择新排序键的函数
         * @returns 排序后的新 List<T> 对象
         */
        thenBy(keySelector: (key: T) => any): List<T>;
        /**
         * 对当前列表中的元素进行降序排序
         * @param keySelector 键选择器函数，用于对列表中的每个元素进行转换
         * @returns {List<T>} 一个包含排序后元素的新列表对象
         */
        thenByDescending(keySelector: (key: T) => any): List<T>;
        /**
         * 从当前列表中删除指定元素
         * @param element 要删除的元素
         * @returns {boolean} 如果删除成功，则返回 true，否则返回 false
         */
        remove(element: T): boolean;
        /**
         * 从当前列表中删除满足指定条件的所有元素，并返回一个新的列表对象
         * @param predicate 谓词函数，用于对列表中的每个元素进行评估
         * @returns {List<T>} 一个包含不满足条件的元素的新列表对象
         */
        removeAll(predicate: PredicateType<T>): List<T>;
        /**
         * 从当前列表中删除指定索引位置的元素
         * @param index 要删除的元素在列表中的索引值
         */
        removeAt(index: number): void;
        /**
         * 反转当前列表中的元素顺序
         * @returns {List<T>} 一个包含反转后元素的新列表对象
         */
        reverse(): List<T>;
        /**
         * 对数组中的每个元素进行转换，生成新的数组
         * @param selector 将数组中的每个元素转换成另外的值
         * @returns 新的 List 对象，包含转换后的元素
         */
        select<TOut>(selector: (element: T, index: number) => TOut): List<TOut>;
        /**
         * 对数组中的每个元素进行转换，并将多个新数组合并成一个数组
         * @param selector 将数组中的每个元素转换成新的数组
         * @returns 合并后的新数组
         */
        selectMany<TOut extends List<any>>(selector: (element: T, index: number) => TOut): TOut;
        /**
         * 比较当前列表和指定列表是否相等
         * @param list 要比较的列表对象
         * @returns {boolean} 如果列表相等，则返回 true，否则返回 false
         */
        sequenceEqual(list: List<T>): boolean;
        /**
         * 从当前列表中获取一个满足指定条件的唯一元素
         * @param predicate 谓词函数，用于对列表中的每个元素进行评估
         * @returns {T} 列表中唯一满足指定条件的元素
         * @throws {Error} 如果列表中不恰好包含一个满足指定条件的元素，则抛出异常
         */
        single(predicate?: PredicateType<T>): T;
        /**
         * 从当前列表中获取一个满足指定条件的唯一元素，如果没有元素满足条件，则返回默认值 undefined
         * @param predicate 谓词函数，用于对列表中的每个元素进行评估
         * @returns {T} 列表中唯一满足指定条件的元素，如果没有元素满足条件，则返回默认值 undefined
         */
        singleOrDefault(predicate?: PredicateType<T>): T;
        /**
         * 从 List 的开头跳过指定数量的元素并返回剩余元素的新 List。
         * 如果指定数量大于 List 中的元素数，则返回一个空的 List。
         * @param amount 要跳过的元素数量
         * @returns 新 List
         */
        skip(amount: number): List<T>;
        /**
         * 返回由源 List 中除了最后指定数量的元素之外的所有元素组成的 List。
         * @param amount 要跳过的元素数。
         * @returns 由源 List 中除了最后指定数量的元素之外的所有元素组成的 List。
         */
        skipLast(amount: number): List<T>;
        /**
         * 从 List 的开头开始，跳过符合指定谓词的元素，并返回剩余元素。
         * @param predicate 用于测试每个元素是否应跳过的函数。
         * @returns 一个新 List，包含源 List 中从跳过元素之后到末尾的元素。
         */
        skipWhile(predicate: PredicateType<T>): List<T>;
        /**
         * 计算数组中所有元素的和
         * @param transform 可选参数，用于将数组中的每个元素转换成另外的值进行计算
         * @returns 数组的和
         */
        sum(transform?: (value?: T, index?: number, list?: T[]) => number): number;
        /**
         * 从 List 的开头返回指定数量的连续元素。
         * @param amount 要返回的元素数量
         * @returns 一个新的 List，其中包含原始 List 中开头的指定数量的元素
         */
        take(amount: number): List<T>;
        /**
         * 从列表末尾开始获取指定数量的元素，返回一个新的 List 对象。
         * @param amount 需要获取的元素数量。
         * @returns 一个新的 List 对象，包含从末尾开始的指定数量的元素。
         */
        takeLast(amount: number): List<T>;
        /**
         * 从 List 的开头开始取出符合指定谓词的元素，直到不符合为止，返回这些元素组成的 List。
         * @param predicate 用于测试每个元素是否符合条件的函数。
         * @returns 符合条件的元素组成的 List。
         */
        takeWhile(predicate: PredicateType<T>): List<T>;
        /**
         * 复制列表中的元素到一个新数组。
         */
        toArray(): T[];
        /**
         * 将数组转换为字典，根据指定的键和值对元素进行分组并返回一个新的字典
         * @param key 指定的键，用于分组
         * @param value 可选参数，指定的值，用于分组后的元素的值；如果未指定，则默认使用原始元素
         * @returns 分组后的元素组成的新的字典
         */
        toDictionary<TKey, TValue = T>(key: (key: T) => TKey, value?: (value: T) => TValue): List<{
            Key: TKey;
            Value: T | TValue;
        }>;
        /**
         * 将数组转换为一个 Set 对象
         * @returns Set 对象，其中包含了数组中的所有元素
         */
        toSet(): Set<unknown>;
        /**
         * 将数组转换为一个查找表，根据指定的键对元素进行分组并返回一个包含键值对的对象
         * @param keySelector 指定的键，用于分组
         * @param elementSelector 可选参数，指定的值，用于分组后的元素的值；如果未指定，则默认使用原始元素
         * @returns 包含键值对的对象，其中键为分组后的键，值为分组后的元素组成的数组
         */
        toLookup<TResult>(keySelector: (key: T) => string | number, elementSelector: (element: T) => TResult): {
            [key: string]: TResult[];
        };
        /**
         * 根据指定的条件，筛选数组中的元素并返回一个新的数组
         * @param predicate 指定的条件
         * @returns 新的数组，其中包含了数组中所有满足条件的元素
         */
        where(predicate: PredicateType<T>): List<T>;
        /**
         * 根据指定的函数将两个数组合并成一个新的数组
         * @param list 要合并的数组
         * @param result 指定的函数，用于将两个元素合并为一个
         * @returns 合并后的新数组
         */
        zip<U, TOut>(list: List<U>, result: (first: T, second: U) => TOut): List<TOut>;
    }
    /**
     * 表示已排序的序列。该类的方法是通过使用延迟执行来实现的。
     * 即时返回值是一个存储执行操作所需的所有信息的对象。
     * 在通过调用对象的ToDictionary、ToLookup、ToList或ToArray方法枚举对象之前，不会执行由该方法表示的查询
     */
    export class OrderedList<T> extends List<T> {
        private _comparer;
        constructor(elements: T[], _comparer: (a: T, b: T) => number);
        /**
         * 按键按升序对序列中的元素执行后续排序。
         * @override
         */
        thenBy(keySelector: (key: T) => any): List<T>;
        /**
         * 根据键值按降序对序列中的元素执行后续排序。
         * @override
         */
        thenByDescending(keySelector: (key: T) => any): List<T>;
    }
    export {};
}
declare module es {
    /**
     * 一段的终点
     */
    class EndPoint {
        /** 该部分的位置 */
        position: Vector2;
        /** 如果这个端点是一个段的起始点或终点（每个段只有一个起始点和一个终点） */
        begin: boolean;
        /** 该端点所属的段 */
        segment: Segment;
        /** 端点相对于能见度测试位置的角度 */
        angle: number;
        constructor();
    }
    class EndPointComparer implements IComparer<EndPoint> {
        /**
         * 按角度对点进行排序的比较功能
         * @param a
         * @param b
         */
        compare(a: EndPoint, b: EndPoint): 0 | 1 | -1;
    }
}
declare module es {
    /**
     * 表示可见性网格中的遮挡线段
     */
    class Segment {
        /**
         * 该部分的第一个终点
         */
        p1: EndPoint;
        /**
         * 该部分的第二个终点
         */
        p2: EndPoint;
        constructor();
    }
}
declare module es {
    /**
     * 类，它可以计算出一个网格，表示从给定的一组遮挡物的原点可以看到哪些区域。使用方法如下。
     *
     * - 调用 begin
     * - 添加任何遮挡物
     * - 调用end来获取可见度多边形。当调用end时，所有的内部存储都会被清空。
     */
    class VisibilityComputer {
        /**
         *  在近似圆的时候要用到的线的总数。只需要一个180度的半球，所以这将是近似该半球的线段数
         */
        lineCountForCircleApproximation: number;
        _radius: number;
        _origin: Vector2;
        _isSpotLight: boolean;
        _spotStartAngle: number;
        _spotEndAngle: number;
        _endPoints: EndPoint[];
        _segments: Segment[];
        _radialComparer: EndPointComparer;
        static _cornerCache: Vector2[];
        static _openSegments: LinkedList<Segment>;
        constructor(origin?: Vector2, radius?: number);
        /**
         * 增加了一个对撞机作为PolyLight的遮蔽器
         * @param collider
         */
        addColliderOccluder(collider: Collider): void;
        /**
         * 增加了一个圆形的遮挡器
         * @param position
         * @param radius
         */
        addCircleOccluder(position: Vector2, radius: number): void;
        /**
         * 增加一个线型遮挡器
         * @param p1
         * @param p2
         */
        addLineOccluder(p1: Vector2, p2: Vector2): void;
        /**
         * 增加一个方形的遮挡器
         * @param bounds
         */
        addSquareOccluder(bounds: Rectangle): void;
        /**
         * 添加一个段，第一个点在可视化中显示，但第二个点不显示。
         * 每个端点都是两个段的一部分，但我们希望只显示一次
         * @param p1
         * @param p2
         */
        addSegment(p1: Vector2, p2: Vector2): void;
        /**
         * 移除所有的遮挡物
         */
        clearOccluders(): void;
        /**
         * 为计算机计算当前的聚光做好准备
         * @param origin
         * @param radius
         */
        begin(origin: Vector2, radius: number): void;
        /**
         * 计算可见性多边形，并返回三角形扇形的顶点（减去中心顶点）。返回的数组来自ListPool
         */
        end(): Vector2[];
        addTriangle(triangles: Vector2[], angle1: number, angle2: number, segment: Segment): void;
        /**
         * 计算直线p1-p2与p3-p4的交点
         * @param p1
         * @param p2
         * @param p3
         * @param p4
         */
        static lineLineIntersection(p1: Vector2, p2: Vector2, p3: Vector2, p4: Vector2): Vector2;
        static between(value: number, min: number, max: number): boolean;
        /**
         * 辅助函数，用于沿外周线构建分段，以限制光的半径。
         */
        loadRectangleBoundaries(): void;
        /**
         * 助手：我们知道a段在b的前面吗？实现不反对称（也就是说，isSegmentInFrontOf(a, b) != (!isSegmentInFrontOf(b, a))）。
         * 另外要注意的是，在可见性算法中，它只需要在有限的一组情况下工作，我不认为它能处理所有的情况。
         * 见http://www.redblobgames.com/articles/visibility/segment-sorting.html
         * @param a
         * @param b
         * @param relativeTo
         */
        isSegmentInFrontOf(a: Segment, b: Segment, relativeTo: Vector2): boolean;
        /**
         * 返回略微缩短的向量：p * (1 - f) + q * f
         * @param p
         * @param q
         * @param f
         */
        static interpolate(p: Vector2, q: Vector2, f: number): Vector2;
        /**
         * 返回点是否在直线p1-p2的 "左边"。
         * @param p1
         * @param p2
         * @param point
         */
        static isLeftOf(p1: Vector2, p2: Vector2, point: Vector2): boolean;
        /**
         * 处理片段，以便我们稍后对它们进行分类
         */
        updateSegments(): void;
    }
}
declare module es {
    interface ITimer {
        context: any;
        /**
         * 调用stop以停止此计时器再次运行。这对非重复计时器没有影响。
         */
        stop(): any;
        /**
         * 将计时器的运行时间重置为0
         */
        reset(): any;
        /**
         * 返回投向T的上下文，作为方便
         */
        getContext<T>(): T;
    }
}
declare module es {
    /**
     * 私有类隐藏ITimer的实现
     */
    class Timer implements ITimer {
        context: any;
        _timeInSeconds: number;
        _repeats: boolean;
        _onTime: (timer: ITimer) => void;
        _isDone: boolean;
        _elapsedTime: number;
        getContext<T>(): T;
        reset(): void;
        stop(): void;
        tick(): boolean;
        initialize(timeInsSeconds: number, repeats: boolean, context: any, onTime: (timer: ITimer) => void): void;
        /**
         * 空出对象引用，以便在js需要时GC可以清理它们的引用
         */
        unload(): void;
    }
}
declare module es {
    /**
     * 允许动作的延迟和重复执行
     */
    class TimerManager extends GlobalManager {
        _timers: Timer[];
        update(): void;
        /**
         * 调度一个一次性或重复的计时器，该计时器将调用已传递的动作
         * @param timeInSeconds
         * @param repeats
         * @param context
         * @param onTime
         */
        schedule(timeInSeconds: number, repeats: boolean, context: any, onTime: (timer: ITimer) => void): Timer;
    }
}

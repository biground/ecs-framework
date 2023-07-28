module es {
    // 对象池中的对象需要实现的接口，包含可选的 reset 方法用于重置对象状态
    export interface IPoolable {
        reset?(): void;
    }

    // 判断一个对象是否实现了 IPoolable 接口的辅助函数
    export const isIPoolable = (props: any): props is IPoolable => {
        return typeof props.reset === 'function';
    };

    // 对象池类，用于创建和管理可复用对象
    export class Pool {
        private static _objectQueue = new Map<new (...args: any[]) => IPoolable, ObjectPool<IPoolable>>();

        // 确保对象池存在于队列中
        private static ensurePoolExists<T>(objectClass: new (...args: any[]) => T) {
            if (!Pool._objectQueue.has(objectClass)) {
                const pool = new ObjectPool<T>();
                Pool._objectQueue.set(objectClass, pool);
            }
        }
        
        // 判断对象是否在对象池中
        public static contains<T>(objectClass: new (...args: any[]) => T, obj: T) {
            Pool.ensurePoolExists(objectClass);
            const pool = Pool._objectQueue.get(objectClass) as ObjectPool<T>;
            return pool.contains(obj);
        }

        // 返回对象池是否存在指定类的队列
        public static hasPool<T>(objectClass: new (...args: any[]) => T) {
            return Pool._objectQueue.has(objectClass);
        }

        // 预热对象池，将指定类的对象加入对象池缓存中
        public static warmCache<T>(objectClass: new (...args: any[]) => T, count: number) {
            Pool.ensurePoolExists(objectClass);
            const pool = Pool._objectQueue.get(objectClass) as ObjectPool<T>;
            for (let i = 0; i < count; i++) {
                pool.warmUpCache(objectClass);
            }
        }

        // 从对象池中获取指定类的对象，如果对象池为空，则创建新对象
        public static obtain<T>(objectClass: new (...args: any[]) => T): T {
            Pool.ensurePoolExists(objectClass);
            const pool = Pool._objectQueue.get(objectClass) as ObjectPool<T>;
            return pool.getObject(objectClass);
        }

        // 将对象释放回对象池，以备后续重用
        public static free<T>(objectClass: new (...args: any[]) => T, obj: T) {
            Pool.ensurePoolExists(objectClass);
            const pool = Pool._objectQueue.get(objectClass) as ObjectPool<T>;
            pool.releaseObject(obj);
        }
    }

    // 对象池内部类，管理特定类的对象缓存
    class ObjectPool<T extends IPoolable> {
        private cacheSize: number;
        private pool: Set<T> = new Set();

        constructor(cacheSize: number = 10) {
            this.cacheSize = cacheSize;
        }

        // 从对象池中获取对象，如果对象池为空，则创建新对象
        getObject(objectClass: new (...args: any[]) => T): T {
            if (this.pool.size > 0) {
                const obj = this.pool.values().next().value as T; // 获取第一个对象
                this.pool.delete(obj);
                return obj;
            } else {
                return this.createNewObject(objectClass);
            }
        }

        // 将对象释放回对象池，以备后续重用
        releaseObject(obj: T) {
            es.Debug.warnIf(this.pool.has(obj), '尝试释放一个已经在池中的对象');
            if (isIPoolable(obj)) obj.reset(); // 重置对象状态
            this.pool.add(obj);
        }

        // 创建新的对象并加入对象池缓存
        private createNewObject(objectClass: new (...args: any[]) => T): T {
            return new objectClass() as T;
        }

        // 预热对象池，将指定类的对象加入对象池缓存中
        warmUpCache(objectClass: new (...args: any[]) => T) {
            for (let i = 0; i < this.cacheSize; i++) {
                const obj = this.createNewObject(objectClass);
                this.pool.add(obj);
            }
        }

        // 判断对象是否在对象池中
        contains(obj: T) {
            return this.pool.has(obj);
        }
    }
}
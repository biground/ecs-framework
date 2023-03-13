module es {
    /**
     * 定义一个按时间间隔处理的抽象类，继承自 EntitySystem 类。
     * 子类需要实现 process 方法，用于实现具体的处理逻辑。
     */
    export abstract class IntervalSystem extends EntitySystem {
        /**
         * 累积增量以跟踪间隔 
         */
        private acc: number = 0;

        /**
         * 更新之间需要等待多长时间
         */
        private readonly interval: number;

        /**
         * 时间间隔的余数，用于计算下一次需要等待的时间
         */
        private intervalRemainder: number = 0;

        /**
         * 构造函数，初始化时间间隔。
         * @param matcher 实体匹配器
         * @param interval 时间间隔
         */
        constructor(matcher: Matcher, interval: number) {
            super(matcher);
            this.interval = interval;
        }

        /**
         * 判断是否需要进行处理。
         * 如果需要进行处理，则更新累积增量和时间间隔余数，返回 true；
         * 否则返回 false。
         */
        protected checkProcessing(): boolean {
            // 更新累积增量
            this.acc += Time.deltaTime;

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
        protected getIntervalDelta(): number {
            return this.interval + this.intervalRemainder;
        }
    }
}
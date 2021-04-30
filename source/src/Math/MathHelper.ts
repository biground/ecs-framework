module es {
    export class MathHelper {
        public static readonly Epsilon: number = 0.00001;
        public static readonly Rad2Deg = 57.29578;
        public static readonly Deg2Rad = 0.0174532924;
        /**
         * 表示pi除以2的值(1.57079637)
         */
        public static readonly PiOver2 = Math.PI / 2;

        /**
         * 将弧度转换成角度。
         * @param radians 用弧度表示的角
         */
        public static toDegrees(radians: number) {
            return radians * 57.295779513082320876798154814105;
        }

        /**
         * 将角度转换为弧度
         * @param degrees
         */
        public static toRadians(degrees: number) {
            return degrees * 0.017453292519943295769236907684886;
        }

        /**
         * mapps值(在leftMin - leftMax范围内)到rightMin - rightMax范围内的值
         * @param value
         * @param leftMin
         * @param leftMax
         * @param rightMin
         * @param rightMax
         */
        public static map(value: number, leftMin: number, leftMax: number, rightMin: number, rightMax: number) {
            return rightMin + (value - leftMin) * (rightMax - rightMin) / (leftMax - leftMin);
        }

        public static lerp(from: number, to: number, t: number) {
            return from + (to - from) * this.clamp01(t);
        }

        /**
         * 使度数的角度在a和b之间
         * 用于处理360度环绕 
         * @param a 
         * @param b 
         * @param t 
         * @returns 
         */
        public static lerpAngle(a: number, b: number, t: number) {
            let num = this.repeat(b - a, 360);
            if (num > 180)
                num -= 360;

            return a + num * this.clamp01(t);
        }

        /**
         * 使弧度的角度在a和b之间
         * @param a 
         * @param b 
         * @param t 
         * @returns 
         */
        public static lerpAngleRadians(a: number, b: number, t: number) {
            let num = this.repeat(b - a, Math.PI * 2);
            if (num > Math.PI)
                num -= Math.PI * 2;

            return a + num * this.clamp01(t);
        }

        /**
         * 循环t使其不大于长度且不小于0 
         * @param t 
         * @param length 
         * @returns 
         */
        public static pingPong(t: number, length: number) {
            t = this.repeat(t, length * 2);
            return length - Math.abs(t - length);
        }

        /**
         * 如果value> = threshold返回其符号，否则返回0 
         * @param value 
         * @param threshold 
         * @returns 
         */
        public static signThreshold(value: number, threshold: number) {
            if (Math.abs(value) >= threshold)
                return Math.sign(value);
            else
                return 0;
        }

        public static inverseLerp(from: number, to: number, t: number) {
            if (from < to) {
                if (t < from)
                    return 0;
                else if(t > to)
                    return 1;
            } else {
                if (t < to)
                    return 1;
                else if(t > from)
                    return 0;
            }

            return (t - from) / (to - from);
        }

        public static clamp(value: number, min: number, max: number) {
            if (value < min)
                return min;

            if (value > max)
                return max;

            return value;
        }

        public static snap(value: number, increment: number) {
            return Math.round(value / increment) * increment;
        }

        /**
         * 给定圆心、半径和角度，得到圆周上的一个点。0度是3点钟。
         * @param circleCenter
         * @param radius
         * @param angleInDegrees
         */
        public static pointOnCirlce(circleCenter: Vector2, radius: number, angleInDegrees: number) {
            let radians = MathHelper.toRadians(angleInDegrees);
            return new Vector2(Math.cos(radians) * radians + circleCenter.x,
                Math.sin(radians) * radians + circleCenter.y);
        }

        /**
         * 如果值为偶数，返回true
         * @param value
         */
        public static isEven(value: number) {
            return value % 2 == 0;
        }

        /**
         * 数值限定在0-1之间
         * @param value
         */
        public static clamp01(value: number) {
            if (value < 0)
                return 0;

            if (value > 1)
                return 1;

            return value;
        }

        public static angleBetweenVectors(from: Vector2, to: Vector2) {
            return Math.atan2(to.y - from.y, to.x - from.x);
        }

        public static angleToVector(angleRadians: number, length: number) {
            return new Vector2(Math.cos(angleRadians) * length, Math.sin(angleRadians) * length);
        }

        /**
         * 增加t并确保它总是大于或等于0并且小于长度
         * @param t
         * @param length
         */
        public static incrementWithWrap(t: number, length: number) {
            t++;
            if (t == length)
                return 0;

            return t;
        }

        /**
         * 以roundToNearest为步长，将值舍入到最接近的数字。例如：在125中找到127到最近的5个结果
         * @param value 
         * @param roundToNearest 
         */
        public static roundToNearest(value: number, roundToNearest: number) {
            return Math.round(value / roundToNearest) * roundToNearest;
        }

        /**
         * 检查传递的值是否在某个阈值之下。对于小规模、精确的比较很有用
         * @param value 
         * @param ep 
         */
        public static withinEpsilon(value: number, ep: number = this.Epsilon) {
            return Math.abs(value) < ep;
        }

        /**
         * 由上移量向上移。start可以小于或大于end。例如:开始是2，结束是10，移位是4，结果是6
         * @param start
         * @param end
         * @param shift
         */
        public static approach(start: number, end: number, shift: number): number {
            if (start < end)
                return Math.min(start + shift, end);

            return Math.max(start - shift, end);
        }

        /**
         * 通过偏移量钳位结果并选择最短路径，将起始角度向终止角度移动，起始值可以小于或大于终止值。 
         * 示例1：开始是30，结束是100，移位是25，结果为55
         * 示例2：开始是340，结束是30，移位是25，结果是5（365换为5） 
         * @param start 
         * @param end 
         * @param shift 
         * @returns 
         */
        public static approachAngle(start: number, end: number, shift: number) {
            let deltaAngle = this.deltaAngle(start, end);
            if (-shift < deltaAngle && deltaAngle < shift)
                return end;

            return this.repeat(this.approach(start, start + deltaAngle, shift), 360);
        }

        /**
         * 通过将偏移量（全部以弧度为单位）夹住结果并选择最短路径，起始角度朝向终止角度。
         * 起始值可以小于或大于终止值。 
         * 此方法的工作方式与“角度”方法非常相似，唯一的区别是使用弧度代替度，并以2 * Pi代替360。 
         * @param start 
         * @param end 
         * @param shift 
         * @returns 
         */
        public static approachAngleRadians(start: number, end: number, shift: number) {
            let deltaAngleRadians = this.deltaAngleRadians(start, end);
            if (-shift < deltaAngleRadians && deltaAngleRadians < shift)
                return end;

            return this.repeat(this.approach(start, start + deltaAngleRadians, shift), Math.PI * 2);
        }

        /**
         * 使用可接受的检查公差检查两个值是否大致相同 
         * @param value1 
         * @param value2 
         * @param tolerance 
         * @returns 
         */
        public static approximately(value1: number, value2: number, tolerance: number = this.Epsilon) {
            return Math.abs(value1 - value2) <= tolerance;
        }

        /**
         * 计算两个给定角之间的最短差值（度数）
         * @param current 
         * @param target 
         */
        public static deltaAngle(current: number, target: number) {
            let num = this.repeat(target - current, 360);
            if (num > 180)
                num -= 360;

            return num;
        }

        /**
         * 计算以弧度为单位的两个给定角度之间的最短差 
         * @param current 
         * @param target 
         * @returns 
         */
        public static deltaAngleRadians(current: number, target: number) {
            let num = this.repeat(target - current, 2 * Math.PI);
            if (num > Math.PI)
                num -= 2 * Math.PI;

            return num;
        }

        /**
         * 循环t，使其永远不大于长度，永远不小于0
         * @param t 
         * @param length 
         */
        public static repeat(t: number, length: number) {
            return t - Math.floor(t / length) * length;
        }

        /**
         * 将值绕一圈移动的助手
         * @param position 
         * @param speed 
         * @returns 
         */
        public static rotateAround(position: Vector2, speed: number) {
            let time = Time.totalTime * speed;

            let x = Math.cos(time);
            let y = Math.sin(time);

            return new Vector2(position.x + x, position.y + y);
        }

        /**
         * 旋转是相对于当前位置而不是总旋转。 
         * 例如，如果您当前处于90度并且想要旋转到135度，则可以使用45度而不是135度的角度
         * @param point 
         * @param center 
         * @param angleIndegrees 
         */
        public static rotateAround2(point: Vector2, center: Vector2, angleIndegrees: number) {
            angleIndegrees = this.toRadians(angleIndegrees);
            let cos = Math.cos(angleIndegrees);
            let sin = Math.sin(angleIndegrees);
            let rotatedX = cos * (point.x - center.x) - sin * (point.y - center.y) + center.x;
            let rotatedY = sin * (point.x - center.x) + cos * (point.y - center.y) + center.y;

            return new Vector2(rotatedX, rotatedY);
        }

        /**
         * 根据圆的中心，半径和角度在圆的圆周上得到一个点。 0度是3点钟方向
         * @param circleCenter 
         * @param radius 
         * @param angleInDegrees 
         */
        public static pointOnCircle(circleCenter: Vector2, radius: number, angleInDegrees: number) {
            let radians = this.toRadians(angleInDegrees);
            return new Vector2(Math.cos(radians) * radius + circleCenter.x, Math.sin(radians) * radius + circleCenter.y);
        }

        /**
         * 根据圆的中心，半径和角度在圆的圆周上得到一个点。 0弧度是3点钟方向
         * @param circleCenter 
         * @param radius 
         * @param angleInRadians 
         * @returns 
         */
        public static pointOnCircleRadians(circleCenter: Vector2, radius: number, angleInRadians: number) {
            return new Vector2(Math.cos(angleInRadians) * radius + circleCenter.x, Math.sin(angleInRadians) * radius + circleCenter.y);
        }

        /**
         * lissajou曲线 
         * @param xFrequency 
         * @param yFrequency 
         * @param xMagnitude 
         * @param yMagnitude 
         * @param phase 
         * @returns 
         */
        public static lissajou(xFrequency: number = 2, yFrequency: number = 3, xMagnitude: number = 1, yMagnitude: number = 1, phase: number = 0) {
            let x = Math.sin(Time.totalTime * xFrequency + phase) * xMagnitude;
            let y = Math.cos(Time.totalTime * yFrequency) * yMagnitude;

            return new Vector2(x, y);
        }

        /**
         * lissajou曲线的阻尼形式，其振荡随时间在0和最大幅度之间。 
         * 为获得最佳效果，阻尼应在0到1之间。 
         * 振荡间隔是动画循环的一半完成的时间（以秒为单位）。 
         * @param xFrequency 
         * @param yFrequency 
         * @param xMagnitude 
         * @param yMagnitude 
         * @param phase 
         * @param damping 
         * @param oscillationInterval 
         * @returns 
         */
        public static lissajouDamped(xFrequency: number = 2, yFrequency: number = 3, xMagnitude: number = 1, 
            yMagnitude: number = 1, phase: number = 0.5, damping: number = 0,
            oscillationInterval: number = 5) {
                let wrappedTime = this.pingPong(Time.totalTime, oscillationInterval);
                let damped = Math.pow(Math.E, -damping * wrappedTime);

                let x = damped * Math.sin(Time.totalTime * xFrequency + phase) * xMagnitude;
                let y = damped * Math.cos(Time.totalTime * yFrequency) * yMagnitude;

                return new Vector2(x, y);
        }
    }
}

module es {
    /**
     * 扇形形状
     */
    export class Sector extends Shape {
        public center: Vector2;
        public m_radius: number;
        /** 扇形扫过的角度 */
        public angleDegree: number;
        /** 扇形扫过的弧度半角 */
        public halfAngle: number;
        /** 弧度，x轴到中线的顺时针旋转弧度 */
        public fromXAngle: number;
        public radiusSquared: number;
        public numberOfPoints: number;
        public angleStep: number;
        public points: Vector2[];
        public centerLine: Vector2;

        private m_startAngle: number;
        get startAngle(): number {
            return this.m_startAngle;
        }
        set startAngle(startAngle: number) {
            this.m_startAngle = startAngle;
            this.angleDegree = Math.abs(this.m_endAngle - startAngle);
            this.halfAngle = MathHelper.toRadians(this.angleDegree / 2);
            this.calculateProperties();
        }
        private m_endAngle: number;
        get endAngle(): number {
            return this.m_endAngle;
        }
        set endAngle(endAngle: number) {
            this.m_endAngle = endAngle;
            this.angleDegree = Math.abs(endAngle - this.m_startAngle);
            this.halfAngle = MathHelper.toRadians(this.angleDegree / 2);
            this.calculateProperties();
        }

        public get sectorAngle(): number {
            let angle = this.endAngle - this.startAngle;
            if (angle < 0) angle += 360;
            return angle;
        }

        constructor(center: Vector2, radius: number, startAngle: number, endAngle: number) {
            super();
            this.center = center;
            this.radius = radius;
            this.m_startAngle = startAngle;
            this.m_endAngle = endAngle;
            this.angleDegree = Math.abs(endAngle - startAngle);
            this.halfAngle = MathHelper.toRadians(this.angleDegree / 2);
            this.points = this.getPoints();
            this.calculateProperties();
        }
        get radius() {
            return this.m_radius;
        }
        set radius(r) {
            this.m_radius = r;
            this.radiusSquared = r * r;
        }

        /**
         * 获取圆弧的质心。
         * @returns 圆弧的质心
         */
        public getCentroid(): Vector2 {
            // 计算圆弧的质心坐标
            const x = ((Math.cos(this.startAngle) + Math.cos(this.endAngle)) * this.m_radius) / 3;
            const y = ((Math.sin(this.startAngle) + Math.sin(this.endAngle)) * this.m_radius) / 3;
            // 返回质心坐标
            return new Vector2(x + this.center.x, y + this.center.y);
        }

        /**
         * 计算向量角度
         * @returns
         */
        public getAngle(): number {
            return this.startAngle;
        }

        public recalculateBounds(collider: Collider): void {
            const localCenter = this.center.add(collider.localOffset);
            const x = localCenter.x - this.m_radius;
            const y = localCenter.y - this.m_radius;
            const height = this.m_radius * 2;
            const width = this.m_radius * 2;
            const bounds = new Rectangle(x, y, width, height);
            this.bounds = bounds;

            this.center = localCenter;
        }

        public overlaps(other: Shape): boolean {
            let result = new Out<CollisionResult>();
            if (other instanceof Box) return this.containsPoint(other.bounds.center);
            if (other instanceof Polygon) return ShapeCollisionSector.sectorToPolygon(this, other, result);

            if (other instanceof Circle) {
                if (ShapeCollisionSector.sectorToCircle2(this, other)) {
                    return true;
                }

                return false;
            }

            console.error(`overlaps of Sector to ${other} are not supported`);
            console.error(other);
            return false;
        }

        public collidesWithShape(other: Shape, collisionResult: Out<CollisionResult>): boolean {
            if (other instanceof Box) {
                return ShapeCollisionSector.sectorToBox(this, other, collisionResult);
            }

            if (other instanceof Polygon) {
                return ShapeCollisionSector.sectorToPolygon(this, other, collisionResult);
            }

            if (other instanceof Circle) {
                return ShapeCollisionSector.sectorToCircle2(this, other);
            }

            console.error(`overlaps of Pologon to ${other.constructor.name} are not supported`);
            console.error(other);
            return false;
        }

        public collidesWithLine(start: Vector2, end: Vector2, hit: Out<RaycastHit>): boolean {
            const toStart = start.sub(this.center); // 线段起点到圆心的向量
            const toEnd = end.sub(this.center); // 线段终点到圆心的向量
            const angleStart = toStart.getAngle(); // 起点向量与 x 轴正方向的夹角
            const angleEnd = toEnd.getAngle(); // 终点向量与 x 轴正方向的夹角
            let angleDiff = angleEnd - angleStart; // 终点角度减去起点角度得到角度差

            // 将角度差限制在 -PI 到 PI 之间，方便判断是否跨越了 0 度
            if (angleDiff > Math.PI) {
                angleDiff -= 2 * Math.PI;
            } else if (angleDiff < -Math.PI) {
                angleDiff += 2 * Math.PI;
            }

            // 如果角度差在圆弧的起始角度和结束角度之间，则有可能发生相交
            if (angleDiff >= this.startAngle && angleDiff <= this.endAngle) {
                const r = toStart.getLength(); // 圆心到线段起点的距离
                const t = this.startAngle - angleStart; // 起点角度到圆弧起始角度的角度差
                const x = r * Math.cos(t); // 圆弧上与线段相交的点的 x 坐标
                const y = r * Math.sin(t); // 圆弧上与线段相交的点的 y 坐标
                const intersection = new Vector2(x, y); // 相交点的二维坐标

                // 判断相交点是否在线段上
                if (intersection.isBetween(start, end)) {
                    const distance = intersection.sub(start).getLength(); // 相交点到线段起点的距离
                    const fraction = distance / start.getDistance(end); // 相交点处于线段的分数
                    const normal = intersection.sub(this.center).normalize(); // 相交点处圆弧的法向量
                    const point = intersection.add(this.center); // 相交点的全局坐标

                    // 将相交信息存储到 hit 参数中
                    const raycastHit = new RaycastHit();
                    raycastHit.setValues(fraction, distance, point, normal);
                    hit.value = raycastHit;

                    return true; // 返回 true 表示相交
                }
            }

            return false; // 返回 false 表示不相交
        }

        public containsPoint(point: Vector2): boolean {
            const toPoint = point.sub(this.center); // 点到圆心的向量
            const distanceSquared = toPoint.lengthSquared(); // 点到圆心距离的平方

            if (distanceSquared > this.radiusSquared) {
                // 如果点到圆心的距离平方大于圆形区域半径平方，则该点不在圆形区域内
                return false;
            }

            const angle = MathHelper.toDegrees(toPoint.getAngle()); // 点到圆心的向量与 x 轴正方向的夹角
            const startAngle = this.startAngle; // 圆弧起始角度
            const endAngle = startAngle + this.angleDegree; // 圆弧终止角度

            let angleDiff = angle - startAngle; // 计算点到圆弧起始角度的角度差
            if (angleDiff < 0) {
                // 如果角度差小于 0，则说明点在圆弧角度的另一侧，需要加上 2 * PI
                angleDiff += 360;
            }
            angleDiff %= 360;
            if (angleDiff > this.angleDegree) {
                // 如果角度差大于圆弧角度，则该点不在圆弧范围内
                return false;
            }

            return true; // 点在圆形区域内
        }

        public pointCollidesWithShape(point: Vector2, result: Out<CollisionResult>): boolean {
            if (!this.containsPoint(point)) {
                if (result) {
                    result.value = null;
                }
                return false;
            }

            if (result) {
                result.value = new CollisionResult();
                result.value.normal = point.sub(this.center).normalize();
                result.value.minimumTranslationVector = result.value.normal.scale(this.m_radius - point.sub(this.center).getLength());
                result.value.point = point;
            }

            return true;
        }

        public getPoints(): Vector2[] {
            let points = new Array<Vector2>(this.numberOfPoints);
            for (let i = 0; i < this.numberOfPoints; i++) {
                let angle = this.startAngle + i * this.angleStep;
                points[i] = Vector2.fromAngle(angle, this.m_radius).add(this.center);
            }
            return points;
        }

        public calculateProperties() {
            this.numberOfPoints = Math.max(10, Math.floor(this.m_radius * 0.1));
            this.angleStep = this.angleDegree / (this.numberOfPoints - 1);
            this.fromXAngle = MathHelper.toRadians(this.m_startAngle + this.angleDegree / 2);
            this.centerLine = Vector2.fromAngle(this.fromXAngle);
        }

        public getFurthestPoint(normal: Vector2): Vector2 {
            let maxProjection = -Number.MAX_VALUE; // 最大投影值
            let furthestPoint = new Vector2(); // 最远点
            for (let i = 0; i < this.numberOfPoints; i++) {
                // 遍历多边形的所有顶点
                let projection = this.points[i].dot(normal); // 计算当前顶点到法线的投影
                if (projection > maxProjection) {
                    // 如果当前投影值大于最大投影值，则更新最大投影值和最远点
                    maxProjection = projection;
                    furthestPoint.copyFrom(this.points[i]);
                }
            }
            return furthestPoint; // 返回最远点
        }
    }
}

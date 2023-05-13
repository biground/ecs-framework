///<reference path="./Polygon.ts" />
module es {
    /**
     * 多边形的特殊情况。在进行SAT碰撞检查时，我们只需要检查2个轴而不是8个轴
     */
    export class Box extends Polygon {
        public width: number;
        public height: number;

        constructor(width: number, height: number) {
            super(Box.buildBox(width, height), true);
            this.width = width;
            this.height = height;
        }

        /**
         * 在一个盒子的形状中建立多边形需要的点的帮助方法
         * @param width
         * @param height
         */
        private static buildBox(width: number, height: number): Vector2[] {
            // 我们在(0,0)的中心周围创建点
            let halfWidth = width / 2;
            let halfHeight = height / 2;
            let verts = new Array(4);
            verts[0] = new Vector2(-halfWidth, -halfHeight);
            verts[1] = new Vector2(halfWidth, -halfHeight);
            verts[2] = new Vector2(halfWidth, halfHeight);
            verts[3] = new Vector2(-halfWidth, halfHeight);

            return verts;
        }

        /**
         * 更新框点，重新计算中心，设置宽度/高度
         * @param width
         * @param height
         */
        public updateBox(width: number, height: number) {
            this.width = width;
            this.height = height;

            // 我们在(0,0)的中心周围创建点
            let halfWidth = width / 2;
            let halfHeight = height / 2;

            this.points[0] = new Vector2(-halfWidth, -halfHeight);
            this.points[1] = new Vector2(halfWidth, -halfHeight);
            this.points[2] = new Vector2(halfWidth, halfHeight);
            this.points[3] = new Vector2(-halfWidth, halfHeight);

            for (let i = 0; i < this.points.length; i++)
                this._originalPoints[i] = this.points[i];
        }

        public getEdges(): Array<Line> {
            const edges = [];

            for (let i = 0; i < this.points.length; i++) {
                const j = (i + 1) % this.points.length;
                edges.push(new Line(this.points[i], this.points[j]));
            }

            return edges;
        }

        public overlaps(other: Shape) {
            // 特殊情况，这一个高性能方式实现，其他情况则使用polygon方法检测
            if (this.isUnrotated) {
                if (other instanceof Box && other.isUnrotated)
                    return this.bounds.intersects(other.bounds);

                if (other instanceof Circle)
                    return Collisions.rectToCircle(this.bounds, other.position, other.radius);
            }

            return super.overlaps(other);
        }

        public collidesWithShape(other: Shape, result: Out<CollisionResult>): boolean {
            // 特殊情况，这一个高性能方式实现，其他情况则使用polygon方法检测
            if (other instanceof Box && (other as Box).isUnrotated) {
                return ShapeCollisionsBox.boxToBox(this, other, result);
            }

            // TODO: 让 minkowski 运行于 cricleToBox

            return super.collidesWithShape(other, result);
        }

        public containsPoint(point: Vector2) {
            if (this.isUnrotated)
                return this.bounds.contains(point.x, point.y);

            return super.containsPoint(point);
        }

        public pointCollidesWithShape(point: Vector2, result: Out<CollisionResult>): boolean {
            if (this.isUnrotated)
                return ShapeCollisionsPoint.pointToBox(point, this, result);

            return super.pointCollidesWithShape(point, result);
        }

        public getFurthestPoint(normal: Vector2): Vector2 {
            const halfWidth = this.width / 2;
            const halfHeight = this.height / 2;

            let furthestPoint = new Vector2(halfWidth, halfHeight);
            let dotProduct = furthestPoint.dot(normal);

            let tempPoint = new Vector2(-halfWidth, halfHeight);
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

        public recalculateBounds(collider: Collider) {
            this.center = collider.localOffset;

            if (collider.shouldColliderScaleAndRotateWithTransform) {
                let hasUnitScale = true;
                const tempMat = new Matrix2D();
                const combinedMatrix = new Matrix2D();

                Matrix2D.createTranslation(-this._polygonCenter.x, -this._polygonCenter.y, combinedMatrix);

                const scale = collider.entity.transform.scale;
                if (!scale.equals(Vector2.one)) {
                    Matrix2D.createScale(scale.x, scale.y, tempMat);
                    Matrix2D.multiply(combinedMatrix, tempMat, combinedMatrix);
                    hasUnitScale = false;

                    const scaledOffset = collider.localOffset.multiply(scale);
                    this.center = scaledOffset;
                }

                const rotation = collider.entity.transform.rotationDegrees;
                if (rotation !== 0) {
                    const offsetLength = hasUnitScale ? collider._localOffsetLength : collider.localOffset.multiply(scale).magnitude();
                    const offsetAngle = Math.atan2(collider.localOffset.y * scale.y, collider.localOffset.x * scale.x) * MathHelper.Rad2Deg;
                    this.center = MathHelper.pointOnCircle(Vector2.zero, offsetLength, rotation + offsetAngle);
                    Matrix2D.createRotation(MathHelper.Deg2Rad * rotation, tempMat);
                    Matrix2D.multiply(combinedMatrix, tempMat, combinedMatrix);
                }

                Matrix2D.createTranslation(this._polygonCenter.x + collider.transform.position.x + this.center.x, this._polygonCenter.y + collider.transform.position.y + this.center.y, tempMat);
                Matrix2D.multiply(combinedMatrix, tempMat, combinedMatrix);

                this.points = this._originalPoints.map(p => p.transform(combinedMatrix));
                this.isUnrotated = rotation === 0;
                if (collider._isRotationDirty) this._areEdgeNormalsDirty = true;
            }

            this.position = collider.transform.position.add(this.center);
            this.bounds = Rectangle.rectEncompassingPoints(this.points).offset(this.position.x, this.position.y);
        }
    }
}
module es {
    export class ShapeCollisionSector {
        public static sectorToPolygon(first: Sector, second: Polygon, result: Out<CollisionResult>): boolean {
            const numPoints = second.points.length;
            let collision = false;
            const edgeStart = new Vector2();
            const edgeEnd = new Vector2();
            const hit = new Out<RaycastHit>();

            for (let i = 0; i < numPoints; i++) {
                const point = second.points[i];
                if (first.containsPoint(point)) {
                    if (result) {
                        result.value = new CollisionResult();
                        result.value.point = point.clone();
                        result.value.normal = point.sub(first.center).normalize();
                    }
                    collision = true;
                    break;
                }
            }

            if (!collision && second.containsPoint(first.center)) {
                if (result) {
                    result.value = new CollisionResult();
                    result.value.point = first.center.clone();
                    result.value.normal = new Vector2(0, 0);
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
                            result.value = new CollisionResult();
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

        /**
         * 
         * @param first 扇形区域
         * @param second 圆形区域
         * @returns 
         */
        public static sectorToCircle2(first: Sector, second: Circle): boolean {
            /**
             * @param center 扇形中心坐标
             * @param centerLine 扇形中线单位向量
             * @param halfAngle 扇形扫过半角
             * @param m_radius 扇形边长
             */
            let { center, centerLine, halfAngle, m_radius: length } = first;
            /**
             * @param center 圆形中心坐标
             * @param m_radius 圆形半径
             */
            let { position, radius } = second;
            const d = position.sub(center);
            const dSqrtMagnitude = d.lengthSquared();
            const rSum = length + radius;
            if (dSqrtMagnitude > rSum * rSum) {
                return false;
            }
            const px = d.dot(centerLine);
            const py = Math.abs(d.dot(Vector2Ext.perpendicularFlip(centerLine)));
            if (px > Math.sqrt(dSqrtMagnitude) * Math.cos(halfAngle)) {
                return true;
            }
            const q = Vector2.fromAngle(halfAngle).scale(length);
            const p = new Vector2(px, py);

            const t = p.dot(q) / q.lengthSquared();
            return p.sub(q.scale(MathHelper.clamp01(t))).lengthSquared() <= radius * radius;
        }

        public static sectorToCircle(first: Sector, second: Circle, result: Out<CollisionResult>): boolean {
            const radiusSquared = second.radius * second.radius;
            const distanceSquared = first.center.getDistanceSquared(second.position);
            const angleDiff = Math.abs(second.position.sub(first.center).getAngle() - first.getAngle());
            const sectorAngle = first.endAngle - first.startAngle;

            if (distanceSquared <= radiusSquared && angleDiff <= sectorAngle / 2) {
                if (result) {
                    result.value = new CollisionResult();
                    result.value.normal = second.position.sub(first.center).normalize();
                    result.value.point = second.position.clone().add(result.value.normal.clone().multiplyScaler(second.radius));
                }
                return true;
            }

            if (result) {
                result.value = null;
            }
            return false;
        }

        public static sectorToBox(first: Sector, second: Box, result: Out<CollisionResult>): boolean {
            result.value = new CollisionResult();

            // 获取box的四条边
            let boxEdges = second.getEdges();

            // 遍历box的每一条边
            for (let i = 0; i < boxEdges.length; i++) {
                let normal = boxEdges[i].getNormal();
                let furthestPointBox = second.getFurthestPoint(normal);
                let furthestPointSector = first.getFurthestPoint(normal.negate());

                let distance = normal.dot(furthestPointSector.sub(furthestPointBox));

                // 没有相交
                if (distance > 0) return false;

                if (result.value && Math.abs(distance) < result.value.minimumTranslationVector.getLength()) {
                    result.value.minimumTranslationVector = normal.clone().multiplyScaler(distance);
                    result.value.normal = normal;
                }
            }

            return true;
        }
    }
}

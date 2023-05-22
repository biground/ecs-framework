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

        public static sectorToCircle2(first: Sector, second: Circle, result: Out<CollisionResult>): boolean {
            const { center: a, centerLine: u, angle: theta, radius: l } = first;
            const { position: c, radius: r } = second;
            const d: Vector2 = c.sub(a);
            const rsum = l + r;
            const radiusSquared = second.radius * second.radius;
            const distanceSquared = first.center.getDistanceSquared(second.position);
            if (distanceSquared > radiusSquared) return false;
            const px = d.dot(u);
            const py = Math.abs(d.dot(Vector2Ext.perpendicularFlip(u)));
            if (px > d.getLength() * Math.cos(theta)) {
              return true;
            }
            const q = Vector2.fromAngle(theta, l);
            const p = new Vector2(px, py);
            const t = p.sub(Vector2.zero).dot(u) / u.lengthSquared();
            return p.sub(Vector2.zero.add(u.scale(MathHelper.clamp01(t)))).lengthSquared() <= radiusSquared;
        }

        public static sectorToCircle(first: Sector, second: Circle, result: Out<CollisionResult>): boolean {
            const radiusSquared = second.radius * second.radius;
            const distanceSquared = first.center.getDistanceSquared(second.center);
            const angleDiff = Math.abs(second.center.sub(first.center).getAngle() - first.getAngle());
            const sectorAngle = first.endAngle - first.startAngle;

            if (distanceSquared <= radiusSquared && angleDiff <= sectorAngle / 2) {
                if (result) {
                    result.value = new CollisionResult();
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

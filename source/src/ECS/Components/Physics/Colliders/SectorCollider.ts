module es {
    /**
     * 扇形碰撞器
     */
    export class SectorCollider extends Collider {
        public shape: Sector;
        constructor(center: Vector2, radius: number, startAngle: number, endAngle: number) {
            super();
            this.shape = new Sector(center, radius, startAngle, endAngle);
        }
        set radius(r) {
            this.shape.radius = r;
        }
        set startAngle(a) {
            this.shape.startAngle = a;
        }
        set endAngle(a) {
            this.shape.endAngle = a;
        }
    }
}

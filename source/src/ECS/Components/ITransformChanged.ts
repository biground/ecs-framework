module es {

    export interface INeedUpdateTransform {
        enabled: boolean;
        updateOrder: number;
        onEntityTransformChanged(comp: ComponentTransform);
    }

    export var isNeedUpdateTransform = (props: any): props is INeedUpdateTransform => typeof (props as INeedUpdateTransform)['onEntityTransformChanged'] !== 'undefined';
}
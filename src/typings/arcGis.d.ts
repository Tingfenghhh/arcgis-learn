interface SingPointItem {
    id: string;
    name: string;
    center: [number, number];
    img?: string;
}

interface PopupData {
    left: number,
    top: number,
    attributes: SingPointItem
}
interface SinglePointItem {
    id: string;
    name: string;
    center: [number, number];
    img?: string;
}

interface PopupData {
    left: number,
    top: number,
    attributes: SinglePointItem
}
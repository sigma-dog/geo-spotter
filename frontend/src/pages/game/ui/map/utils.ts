import type { SelectionPoint } from '../../lib/types';

export const createMarkerElement = (label: string) => {
    const markerElement = document.createElement('button');

    markerElement.type = 'button';
    markerElement.textContent = label;
    markerElement.style.width = '42px';
    markerElement.style.height = '42px';
    markerElement.style.borderRadius = '999px';
    markerElement.style.border = '2px solid rgba(255,255,255,0.9)';
    markerElement.style.fontWeight = '700';
    markerElement.style.fontSize = '14px';
    markerElement.style.cursor = 'pointer';
    markerElement.style.boxShadow = '0 12px 30px rgba(15, 23, 42, 0.25)';
    markerElement.style.transition =
        'transform 0.2s ease, background 0.2s ease';

    return markerElement;
};

export const setMarkerActiveState = (
    element: HTMLElement,
    isActive: boolean
) => {
    element.style.background = isActive ? '#e53e3e' : '#0f172a';
    element.style.color = '#ffffff';
    element.style.transform = isActive ? 'scale(1.08)' : 'scale(1)';
};

export const createSelectionBox = (
    startPoint: SelectionPoint,
    endPoint: SelectionPoint
) => ({
    left: Math.min(startPoint.x, endPoint.x),
    top: Math.min(startPoint.y, endPoint.y),
    width: Math.abs(endPoint.x - startPoint.x),
    height: Math.abs(endPoint.y - startPoint.y),
});

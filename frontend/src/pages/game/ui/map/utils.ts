import type { SelectionPoint } from '../../lib/types';

export const createUserMarkerElement = (
    avatarUrl?: string | null,
    fallbackLabel = 'U'
) => {
    const markerElement = document.createElement('div');
    const avatarShell = document.createElement('div');
    const pointerElement = document.createElement('div');

    markerElement.style.width = '52px';
    markerElement.style.height = '64px';
    markerElement.style.position = 'relative';
    markerElement.style.display = 'flex';
    markerElement.style.alignItems = 'flex-start';
    markerElement.style.justifyContent = 'center';
    markerElement.style.cursor = 'pointer';
    markerElement.style.transform = 'translateY(-8px)';
    markerElement.style.zIndex = '20';

    avatarShell.style.width = '44px';
    avatarShell.style.height = '44px';
    avatarShell.style.borderRadius = '999px';
    avatarShell.style.border = '3px solid rgba(255,255,255,0.96)';
    avatarShell.style.boxShadow = '0 12px 30px rgba(15, 23, 42, 0.32)';
    avatarShell.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
    avatarShell.style.overflow = 'hidden';
    avatarShell.style.padding = '0';
    avatarShell.style.background = '#e53e3e';
    markerElement.style.display = 'flex';
    avatarShell.style.alignItems = 'center';
    avatarShell.style.justifyContent = 'center';

    pointerElement.style.position = 'absolute';
    pointerElement.style.left = '50%';
    pointerElement.style.bottom = '6px';
    pointerElement.style.width = '14px';
    pointerElement.style.height = '14px';
    pointerElement.style.background = '#e53e3e';
    pointerElement.style.borderRight = '3px solid rgba(255,255,255,0.96)';
    pointerElement.style.borderBottom = '3px solid rgba(255,255,255,0.96)';
    pointerElement.style.transform = 'translateX(-50%) rotate(45deg)';
    pointerElement.style.boxShadow = '4px 4px 14px rgba(15, 23, 42, 0.18)';

    if (avatarUrl) {
        const imageElement = document.createElement('img');

        imageElement.src = avatarUrl;
        imageElement.alt = 'User avatar';
        imageElement.style.width = '100%';
        imageElement.style.height = '100%';
        imageElement.style.objectFit = 'cover';
        imageElement.style.display = 'block';
        imageElement.draggable = false;
        avatarShell.appendChild(imageElement);
    } else {
        const fallbackElement = document.createElement('span');

        fallbackElement.textContent = fallbackLabel;
        fallbackElement.style.fontWeight = '700';
        fallbackElement.style.fontSize = '14px';
        fallbackElement.style.lineHeight = '1';
        fallbackElement.style.color = '#ffffff';
        avatarShell.appendChild(fallbackElement);
    }

    markerElement.appendChild(pointerElement);
    markerElement.appendChild(avatarShell);

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

export const createPanoramaMarkerElement = () => {
    const markerElement = document.createElement('button');

    markerElement.type = 'button';
    markerElement.setAttribute('aria-label', 'Открыть панораму');
    markerElement.style.width = '16px';
    markerElement.style.height = '16px';
    markerElement.style.borderRadius = '999px';
    markerElement.style.border = '2px solid rgba(255,255,255,0.95)';
    markerElement.style.background = '#0f172a';
    markerElement.style.cursor = 'pointer';
    markerElement.style.boxShadow = '0 6px 18px rgba(15, 23, 42, 0.28)';
    markerElement.style.transition =
        'transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease';

    return markerElement;
};

export const setPanoramaMarkerActiveState = (
    element: HTMLElement,
    isActive: boolean
) => {
    element.style.background = isActive ? '#e53e3e' : '#0f172a';
    element.style.transform = isActive ? 'scale(1.3)' : 'scale(1)';
    element.style.boxShadow = isActive
        ? '0 10px 24px rgba(229, 62, 62, 0.35)'
        : '0 6px 18px rgba(15, 23, 42, 0.28)';
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

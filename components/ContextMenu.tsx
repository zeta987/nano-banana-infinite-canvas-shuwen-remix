
import React, { useRef, useEffect, useState } from 'react';
import type { Point, ElementType } from '../types';
import { COLORS } from '../App';

interface ContextMenuData {
    x: number;
    y: number;
    worldPoint: Point;
    elementId: string | null;
}

interface ContextMenuProps {
  menuData: ContextMenuData;
  onClose: () => void;
  actions: {
    addNote: (position: Point) => void;
    addArrow: (position: Point) => void;
    addDrawing: (position: Point) => void;
    addIFrame: (position: Point) => void;
    editDrawing: (elementId: string) => void;
    startImageEdit: (elementId: string) => void;
    startOutpainting: (elementId: string) => void;
    startCrop: (elementId: string) => void;
    addImage: (position: Point) => void;
    deleteElement: () => void;
    bringToFront: () => void;
    sendToBack: () => void;
    changeColor: (color: string) => void;
    downloadImage: (elementId: string) => void;
    duplicateElement: (elementId: string) => void;
    toggleLanguage: () => void;
    groupElements: () => void;
    ungroupElements: () => void;
    copyToClipboard: (elementId: string) => void;
    tidyUp: () => void;
  };
  canChangeColor: boolean;
  canGroup: boolean;
  canUngroup: boolean;
  selectedCount: number;
  elementType: ElementType | null;
  t: (key: string) => string;
}

const MenuItem: React.FC<{ onClick: () => void; children: React.ReactNode; disabled?: boolean; className?: string }> = ({ onClick, children, disabled, className }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:text-gray-400 disabled:bg-transparent flex items-center gap-2 ${className || ''}`}
    >
        {children}
    </button>
);

export const ContextMenu: React.FC<ContextMenuProps> = ({ menuData, onClose, actions, canChangeColor, canGroup, canUngroup, selectedCount, elementType, t }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [colorSubMenuVisible, setColorSubMenuVisible] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        // Use timeout to prevent the same click event that opened the menu from closing it
        setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 0);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);
    
    const handleAction = (action: Function) => {
        action();
        onClose();
    };
    
    const handleColorSubMenu = (e: React.MouseEvent) => {
        if (!canChangeColor) return;
        e.stopPropagation();
        setColorSubMenuVisible(true);
    };

    const menuStyle: React.CSSProperties = {
        position: 'absolute',
        left: `${menuData.x}px`,
        top: `${menuData.y}px`,
        zIndex: 50,
    };
    
    const colorSubMenuStyle: React.CSSProperties = {
        position: 'absolute',
        left: '100%',
        top: 0,
        zIndex: 51,
    }

    return (
        <div
            ref={menuRef}
            style={menuStyle}
            className="w-52 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none py-1"
            onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing the menu via the main app listener
        >
            {menuData.elementId || selectedCount > 0 ? (
                // Element(s) Menu
                <>
                    {selectedCount > 1 && (
                        <>
                            <MenuItem onClick={() => handleAction(actions.tidyUp)} className="text-indigo-600 font-bold">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                                {t('tidyUp')}
                            </MenuItem>
                            <div className="border-t my-1 border-gray-200" />
                        </>
                    )}

                    {canGroup && <MenuItem onClick={() => handleAction(actions.groupElements)}>{t('group')}</MenuItem>}
                    {canUngroup && <MenuItem onClick={() => handleAction(actions.ungroupElements)}>{t('ungroup')}</MenuItem>}
                    {(canGroup || canUngroup) && <div className="border-t my-1 border-gray-200" />}

                    {elementType === 'image' && (
                         <>
                            <MenuItem onClick={() => handleAction(() => actions.startImageEdit(menuData.elementId!))}>
                                {t('removeOrEditObject')}
                            </MenuItem>
                            <MenuItem onClick={() => handleAction(() => actions.startOutpainting(menuData.elementId!))}>
                                {t('expandImage')}
                            </MenuItem>
                            <MenuItem onClick={() => handleAction(() => actions.startCrop(menuData.elementId!))}>
                                {t('cropImage')}
                            </MenuItem>
                             <div className="border-t my-1 border-gray-200" />
                        </>
                    )}
                    {elementType === 'drawing' && (
                         <>
                            <MenuItem onClick={() => handleAction(() => actions.editDrawing(menuData.elementId!))}>
                                {t('editDrawing')}
                            </MenuItem>
                             <div className="border-t my-1 border-gray-200" />
                        </>
                    )}
                    {(elementType === 'image' || elementType === 'drawing') && (
                        <>
                            <MenuItem onClick={() => handleAction(() => actions.downloadImage(menuData.elementId!))}>
                                {t('downloadImage')}
                            </MenuItem>
                            <div className="border-t my-1 border-gray-200" />
                        </>
                    )}
                    {(elementType === 'note' || elementType === 'image' || elementType === 'drawing') && (
                        <>
                            <MenuItem onClick={() => handleAction(() => actions.copyToClipboard(menuData.elementId!))}>
                                {t('copyToClipboard')}
                            </MenuItem>
                            <div className="border-t my-1 border-gray-200" />
                        </>
                    )}
                    {(elementType === 'note' || elementType === 'image' || elementType === 'drawing' || elementType === 'arrow') && (
                        <>
                           <MenuItem onClick={() => handleAction(() => actions.duplicateElement(menuData.elementId!))}>
                                {t('duplicate')}
                            </MenuItem>
                             <div className="border-t my-1 border-gray-200" />
                        </>
                    )}
                    <div className="relative" onMouseLeave={() => setColorSubMenuVisible(false)}>
                        <button
                            onMouseEnter={handleColorSubMenu}
                            disabled={!canChangeColor}
                            className="w-full flex justify-between items-center text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:text-gray-400 disabled:bg-transparent"
                        >
                            <span className="flex items-center gap-2">{t('changeColor')}</span>
                            <span className="text-xs">▶</span>
                        </button>
                         {colorSubMenuVisible && canChangeColor && (
                             <div 
                                style={colorSubMenuStyle}
                                className="w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none py-1"
                             >
                                 <div className="p-2 grid grid-cols-5 gap-2">
                                     {COLORS.map(color => (
                                         <button
                                             key={color.name}
                                             onClick={() => handleAction(() => actions.changeColor(color.bg))}
                                             className={`w-6 h-6 rounded-full border-2 ${color.bg} border-white`}
                                             aria-label={`Change color to ${color.name}`}
                                         />
                                     ))}
                                 </div>
                             </div>
                         )}
                    </div>
                    <div className="border-t my-1 border-gray-200" />
                    <MenuItem onClick={() => handleAction(actions.bringToFront)}>{t('bringToFront')}</MenuItem>
                    <MenuItem onClick={() => handleAction(actions.sendToBack)}>{t('sendToBack')}</MenuItem>
                    <div className="border-t my-1 border-gray-200" />
                    <MenuItem onClick={() => handleAction(actions.deleteElement)} className="text-red-600">{t('delete')}</MenuItem>
                </>
            ) : (
                // Canvas Menu
                <>
                    <MenuItem onClick={() => handleAction(() => actions.addNote(menuData.worldPoint))}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        {t('addNote')}
                    </MenuItem>
                    <MenuItem onClick={() => handleAction(() => actions.addArrow(menuData.worldPoint))}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                        {t('addArrow')}
                    </MenuItem>
                    <MenuItem onClick={() => handleAction(() => actions.addDrawing(menuData.worldPoint))}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                        {t('addDrawing')}
                    </MenuItem>
                    <MenuItem onClick={() => handleAction(() => actions.addImage(menuData.worldPoint))}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        {t('addImages')}
                    </MenuItem>
                    <MenuItem onClick={() => handleAction(() => actions.addIFrame(menuData.worldPoint))}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>
                        {t('addWebpage')}
                    </MenuItem>
                    <div className="border-t my-1 border-gray-200" />
                    <MenuItem onClick={() => handleAction(actions.toggleLanguage)}>{t('changeLanguage')}</MenuItem>
                </>
            )}
        </div>
    );
};

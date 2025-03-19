import { useEffect, useCallback, useRef } from 'react';

// Utility to check if the target element is an input or textarea
const isInputElement = (element) => {
    return element.tagName === 'INPUT' ||
           element.tagName === 'TEXTAREA' ||
           element.contentEditable === 'true';
};

// Utility to normalize key combinations
const normalizeKey = (key) => {
    return key.toLowerCase().replace(/\s/g, '');
};

// Parse key combination string
const parseKeyCombination = (combination) => {
    const keys = combination.split('+').map(key => normalizeKey(key));
    const mainKey = keys[keys.length - 1];
    const modifiers = keys.slice(0, -1).sort();
    return { mainKey, modifiers };
};

const useKeyboardShortcuts = (shortcuts = {}, options = {}) => {
    const {
        enabled = true,
        preventDefault = true,
        stopPropagation = true,
        allowInInput = false,
        scope = 'global'
    } = options;

    const activeShortcutsRef = useRef(new Map());
    const pressedKeysRef = useRef(new Set());

    // Parse and store shortcuts
    const parseShortcuts = useCallback(() => {
        const parsed = new Map();
        
        Object.entries(shortcuts).forEach(([combination, callback]) => {
            const { mainKey, modifiers } = parseKeyCombination(combination);
            const key = JSON.stringify({ mainKey, modifiers });
            parsed.set(key, callback);
        });

        activeShortcutsRef.current = parsed;
    }, [shortcuts]);

    // Check if modifiers match
    const checkModifiers = useCallback((event) => {
        const currentModifiers = [];

        if (event.ctrlKey) currentModifiers.push('ctrl');
        if (event.shiftKey) currentModifiers.push('shift');
        if (event.altKey) currentModifiers.push('alt');
        if (event.metaKey) currentModifiers.push('meta');

        return currentModifiers.sort();
    }, []);

    // Handle keydown event
    const handleKeyDown = useCallback((event) => {
        if (!enabled) return;

        // Skip if target is input element and allowInInput is false
        if (!allowInInput && isInputElement(event.target)) return;

        const key = normalizeKey(event.key);
        const modifiers = checkModifiers(event);

        // Store pressed key
        pressedKeysRef.current.add(key);

        // Check for matching shortcuts
        activeShortcutsRef.current.forEach((callback, shortcutKey) => {
            const { mainKey, modifiers: shortcutModifiers } = JSON.parse(shortcutKey);

            if (
                key === mainKey &&
                modifiers.length === shortcutModifiers.length &&
                modifiers.every((mod, i) => mod === shortcutModifiers[i])
            ) {
                if (preventDefault) event.preventDefault();
                if (stopPropagation) event.stopPropagation();
                callback(event);
            }
        });
    }, [enabled, allowInInput, preventDefault, stopPropagation, checkModifiers]);

    // Handle keyup event
    const handleKeyUp = useCallback((event) => {
        const key = normalizeKey(event.key);
        pressedKeysRef.current.delete(key);
    }, []);

    // Register keyboard event listeners
    useEffect(() => {
        parseShortcuts();

        if (scope === 'global') {
            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('keyup', handleKeyUp);

            return () => {
                window.removeEventListener('keydown', handleKeyDown);
                window.removeEventListener('keyup', handleKeyUp);
            };
        }
    }, [scope, parseShortcuts, handleKeyDown, handleKeyUp]);

    // Return methods to manage shortcuts
    const addShortcut = useCallback((combination, callback) => {
        const { mainKey, modifiers } = parseKeyCombination(combination);
        const key = JSON.stringify({ mainKey, modifiers });
        activeShortcutsRef.current.set(key, callback);
    }, []);

    const removeShortcut = useCallback((combination) => {
        const { mainKey, modifiers } = parseKeyCombination(combination);
        const key = JSON.stringify({ mainKey, modifiers });
        activeShortcutsRef.current.delete(key);
    }, []);

    const getActiveShortcuts = useCallback(() => {
        const shortcuts = [];
        activeShortcutsRef.current.forEach((callback, shortcutKey) => {
            const { mainKey, modifiers } = JSON.parse(shortcutKey);
            shortcuts.push({
                combination: [...modifiers, mainKey].join('+'),
                callback
            });
        });
        return shortcuts;
    }, []);

    return {
        addShortcut,
        removeShortcut,
        getActiveShortcuts
    };
};

// Predefined shortcut combinations
export const SHORTCUTS = {
    SAVE: 'ctrl+s',
    NEW: 'ctrl+n',
    DELETE: 'ctrl+d',
    SEARCH: 'ctrl+f',
    HELP: 'ctrl+h',
    REFRESH: 'ctrl+r',
    PRINT: 'ctrl+p',
    UNDO: 'ctrl+z',
    REDO: 'ctrl+shift+z',
    CUT: 'ctrl+x',
    COPY: 'ctrl+c',
    PASTE: 'ctrl+v',
    SELECT_ALL: 'ctrl+a',
    ESCAPE: 'escape'
};

// Example usage with specific features
export const useNavigationShortcuts = (options = {}) => {
    return useKeyboardShortcuts({
        [SHORTCUTS.SEARCH]: options.onSearch || (() => {}),
        [SHORTCUTS.HELP]: options.onHelp || (() => {}),
        [SHORTCUTS.REFRESH]: options.onRefresh || (() => {})
    }, options);
};

export const useEditorShortcuts = (options = {}) => {
    return useKeyboardShortcuts({
        [SHORTCUTS.SAVE]: options.onSave || (() => {}),
        [SHORTCUTS.NEW]: options.onNew || (() => {}),
        [SHORTCUTS.DELETE]: options.onDelete || (() => {}),
        [SHORTCUTS.UNDO]: options.onUndo || (() => {}),
        [SHORTCUTS.REDO]: options.onRedo || (() => {}),
        [SHORTCUTS.CUT]: options.onCut || (() => {}),
        [SHORTCUTS.COPY]: options.onCopy || (() => {}),
        [SHORTCUTS.PASTE]: options.onPaste || (() => {}),
        [SHORTCUTS.SELECT_ALL]: options.onSelectAll || (() => {})
    }, {
        ...options,
        allowInInput: true
    });
};

export const useDialogShortcuts = (options = {}) => {
    return useKeyboardShortcuts({
        [SHORTCUTS.ESCAPE]: options.onClose || (() => {})
    }, options);
};

export default useKeyboardShortcuts; 
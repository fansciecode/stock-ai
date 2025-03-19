import { useState, useEffect, useCallback, useContext, createContext } from 'react';

// Create Permission Context
const PermissionContext = createContext({
    permissions: [],
    roles: [],
    loading: false,
    error: null,
    checkPermission: () => false,
    checkRole: () => false,
    hasAnyPermission: () => false,
    hasAllPermissions: () => false,
    hasAnyRole: () => false,
    hasAllRoles: () => false
});

// Permission Provider Component
export const PermissionProvider = ({ children }) => {
    const [permissions, setPermissions] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch user permissions and roles
    const fetchPermissions = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch from local storage or API
            const storedPermissions = localStorage.getItem('user_permissions');
            const storedRoles = localStorage.getItem('user_roles');

            if (storedPermissions && storedRoles) {
                setPermissions(JSON.parse(storedPermissions));
                setRoles(JSON.parse(storedRoles));
            } else {
                // Fetch from API if not in local storage
                const response = await fetch('/api/auth/permissions');
                const data = await response.json();

                setPermissions(data.permissions);
                setRoles(data.roles);

                // Store in local storage
                localStorage.setItem('user_permissions', JSON.stringify(data.permissions));
                localStorage.setItem('user_roles', JSON.stringify(data.roles));
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initialize permissions
    useEffect(() => {
        fetchPermissions();
    }, [fetchPermissions]);

    // Check single permission
    const checkPermission = useCallback((permission) => {
        return permissions.includes(permission);
    }, [permissions]);

    // Check single role
    const checkRole = useCallback((role) => {
        return roles.includes(role);
    }, [roles]);

    // Check if user has any of the given permissions
    const hasAnyPermission = useCallback((requiredPermissions = []) => {
        return requiredPermissions.some(permission => checkPermission(permission));
    }, [checkPermission]);

    // Check if user has all of the given permissions
    const hasAllPermissions = useCallback((requiredPermissions = []) => {
        return requiredPermissions.every(permission => checkPermission(permission));
    }, [checkPermission]);

    // Check if user has any of the given roles
    const hasAnyRole = useCallback((requiredRoles = []) => {
        return requiredRoles.some(role => checkRole(role));
    }, [checkRole]);

    // Check if user has all of the given roles
    const hasAllRoles = useCallback((requiredRoles = []) => {
        return requiredRoles.every(role => checkRole(role));
    }, [checkRole]);

    const value = {
        permissions,
        roles,
        loading,
        error,
        checkPermission,
        checkRole,
        hasAnyPermission,
        hasAllPermissions,
        hasAnyRole,
        hasAllRoles
    };

    return (
        <PermissionContext.Provider value={value}>
            {children}
        </PermissionContext.Provider>
    );
};

// Custom hook to use permissions
const usePermissions = () => {
    const context = useContext(PermissionContext);
    if (!context) {
        throw new Error('usePermissions must be used within a PermissionProvider');
    }
    return context;
};

// Higher-order component to protect routes/components
export const withPermission = (WrappedComponent, options = {}) => {
    const {
        permissions = [],
        roles = [],
        requireAll = false,
        fallback = null
    } = options;

    return (props) => {
        const {
            hasAnyPermission,
            hasAllPermissions,
            hasAnyRole,
            hasAllRoles,
            loading
        } = usePermissions();

        if (loading) {
            return null; // Or loading component
        }

        const hasRequiredPermissions = requireAll
            ? hasAllPermissions(permissions)
            : hasAnyPermission(permissions);

        const hasRequiredRoles = requireAll
            ? hasAllRoles(roles)
            : hasAnyRole(roles);

        if ((permissions.length === 0 || hasRequiredPermissions) &&
            (roles.length === 0 || hasRequiredRoles)) {
            return <WrappedComponent {...props} />;
        }

        return fallback;
    };
};

// Permission guard component
export const PermissionGuard = ({
    children,
    permissions = [],
    roles = [],
    requireAll = false,
    fallback = null
}) => {
    const {
        hasAnyPermission,
        hasAllPermissions,
        hasAnyRole,
        hasAllRoles,
        loading
    } = usePermissions();

    if (loading) {
        return null; // Or loading component
    }

    const hasRequiredPermissions = requireAll
        ? hasAllPermissions(permissions)
        : hasAnyPermission(permissions);

    const hasRequiredRoles = requireAll
        ? hasAllRoles(roles)
        : hasAnyRole(roles);

    if ((permissions.length === 0 || hasRequiredPermissions) &&
        (roles.length === 0 || hasRequiredRoles)) {
        return children;
    }

    return fallback;
};

// Predefined permission sets
export const PERMISSIONS = {
    // User Management
    USER_VIEW: 'user:view',
    USER_CREATE: 'user:create',
    USER_EDIT: 'user:edit',
    USER_DELETE: 'user:delete',

    // Event Management
    EVENT_VIEW: 'event:view',
    EVENT_CREATE: 'event:create',
    EVENT_EDIT: 'event:edit',
    EVENT_DELETE: 'event:delete',

    // Order Management
    ORDER_VIEW: 'order:view',
    ORDER_CREATE: 'order:create',
    ORDER_EDIT: 'order:edit',
    ORDER_DELETE: 'order:delete',

    // Financial Management
    FINANCE_VIEW: 'finance:view',
    FINANCE_CREATE: 'finance:create',
    FINANCE_EDIT: 'finance:edit',
    FINANCE_DELETE: 'finance:delete',

    // Report Management
    REPORT_VIEW: 'report:view',
    REPORT_CREATE: 'report:create',
    REPORT_EXPORT: 'report:export',

    // System Settings
    SETTINGS_VIEW: 'settings:view',
    SETTINGS_EDIT: 'settings:edit',

    // Role Management
    ROLE_VIEW: 'role:view',
    ROLE_CREATE: 'role:create',
    ROLE_EDIT: 'role:edit',
    ROLE_DELETE: 'role:delete'
};

// Predefined roles
export const ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    MANAGER: 'manager',
    STAFF: 'staff',
    VIEWER: 'viewer'
};

export default usePermissions; 
export const MENU_COLLECTION = 'menu';
export const MENU_ROOT_COLLECTION = 'deliveryuai';
export const MENU_DEV_TENANT = 'localhost';

// Endpoint opcional para cenários em que o backend exponha payload HTTP ao invés de Firestore SDK.
export const MENU_HTTP_SOURCE = import.meta.env.VITE_CUSTOMER_MENU_SOURCE || '/deliveryuai/localhost/menu';

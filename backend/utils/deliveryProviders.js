export const initializeDeliveryProvider = (provider) => {
    switch (provider) {
        case 'DUNZO':
            return new DunzoProvider();
        case 'RAPIDO':
            return new RapidoProvider();
        default:
            return new DefaultProvider();
    }
};

class DefaultProvider {
    async createDelivery(orderDetails) {
        // Default implementation
        return {
            trackingId: `DEL${Date.now()}`,
            provider: 'DEFAULT'
        };
    }

    async updateStatus(trackingId) {
        // Default implementation
        return {
            status: 'IN_TRANSIT'
        };
    }
} 
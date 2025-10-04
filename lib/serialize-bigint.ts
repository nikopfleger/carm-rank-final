/**
 * Helper function to convert BigInt to string for JSON serialization
 * This is needed because JSON.stringify() cannot serialize BigInt values directly
 */
export function serializeBigInt(obj: any): any {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (typeof obj === 'bigint') {
        return obj.toString();
    }

    if (Array.isArray(obj)) {
        return obj.map(serializeBigInt);
    }

    if (typeof obj === 'object') {
        // Handle Date objects
        if (obj instanceof Date) {
            return obj.toISOString();
        }

        // Handle other special objects
        if (obj.constructor && obj.constructor.name !== 'Object') {
            return obj.toString();
        }

        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = serializeBigInt(value);
        }
        return result;
    }

    return obj;
}

// Configurar JSON.stringify para lidar com BigInt globalmente
(BigInt.prototype as any).toJSON = function() {
    return Number(this);
};

// Helper para converter objetos com BigInt
export function convertBigIntToNumber(obj: any): any {
    if (obj === null || obj === undefined) {
        return obj;
    }
    
    if (typeof obj === 'bigint') {
        return Number(obj);
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => convertBigIntToNumber(item));
    }
    
    if (typeof obj === 'object') {
        const converted: any = {};
        for (const [key, value] of Object.entries(obj)) {
            converted[key] = convertBigIntToNumber(value);
        }
        return converted;
    }
    
    return obj;
}

// Helper específico para resultados do Prisma
export function sanitizePrismaResult<T>(result: T): T {
    return JSON.parse(JSON.stringify(result, (key, value) =>
        typeof value === 'bigint' ? Number(value) : value
    ));
}
// SMART MOCK DB Implementation
// Features: In-memory storage, persistence across hot-reloads (via globalThis), and simulated delays.

type Product = {
    id: string;
    name: string;
    description: string;
    price: number;
    images: string[];
    categoryId: string;
    stock: number;
    createdAt: Date;
    category?: Category;
};

type Category = {
    id: string;
    name: string;
};

type Order = {
    id: string;
    customer: string;
    total: number;
    status: string;
    date: string;
    items: number;
};

// Initial Data
const initialProducts: Product[] = [
    { id: "1", name: "Royal Banarasi Silk", description: "Elegant silk saree.", price: 15000, stock: 5, categoryId: "sarees", category: { id: "sarees", name: "Sarees" }, images: ["/images/category-sarees.png"], createdAt: new Date() },
    { id: "2", name: "Embroidered Lehenga", description: "Heavy embroidery work.", price: 25000, stock: 2, categoryId: "lehengas", category: { id: "lehengas", name: "Lehengas" }, images: ["/images/category-lehenga.png"], createdAt: new Date() },
];

const initialOrders: Order[] = [
    { id: "ORD-001", customer: "Priya Sharma", total: 15000, status: "Delivered", date: "2024-01-15", items: 1 },
    { id: "ORD-002", customer: "Rahul Verma", total: 4500, status: "Processing", date: "2024-01-16", items: 2 },
];

class SmartMockDB {
    private products: Product[];
    private orders: Order[];

    constructor() {
        this.products = [...initialProducts];
        this.orders = [...initialOrders];
    }

    // Product Methods
    async findProducts() {
        // Return shallow copy to avoid mutation issues
        return [...this.products];
    }

    async createProduct(data: any) {
        const newProduct = {
            id: Math.random().toString(36).substr(2, 9),
            ...data,
            createdAt: new Date(),
            category: { id: "custom", name: data.category?.create?.name || "Custom" } // Mock category connection
        };
        this.products.unshift(newProduct);
        return newProduct;
    }

    // Order Methods
    async findOrders() {
        return [...this.orders];
    }

    // Pass-through for compatibility
    get product() {
        return {
            findMany: async (args: any) => {
                // Simple filter simulation
                let res = this.products;
                if (args?.where?.categoryId) {
                    res = res.filter(p => p.categoryId === args.where.categoryId);
                }
                return res;
            },
            create: async (args: any) => this.createProduct(args.data),
            count: async () => this.products.length
        };
    }

    get order() {
        return {
            findMany: async () => this.findOrders(),
        };
    }

    get category() {
        return {
            findMany: async () => [{ id: 'sarees', name: 'Sarees' }, { id: 'lehengas', name: 'Lehengas' }]
        }
    }
}

// Persist in global scope to survive hot reloads in dev
const globalForPrisma = globalThis as unknown as { prisma: SmartMockDB };

const prisma = globalForPrisma.prisma || new SmartMockDB();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;

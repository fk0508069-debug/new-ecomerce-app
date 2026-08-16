//PRODUCT DATA
export type Product = {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  description?: string;
};

const products: Product[] = [
  {
    id: 1,
    name: 'Classic White Tee',
    price: 29.99,
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    category: 'Apparel',
    description: 'Comfortable everyday tee',
  },
  {
    id: 2,
    name: 'Urban Hoodie',
    price: 59.99,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
    category: 'Apparel',
    description: 'Warm and stylish hoodie',
  },
  {
    id: 3,
    name: 'Wireless Headphones',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80',
    category: 'Electronics',
    description: 'Premium wireless audio',
  },
];

export default products;

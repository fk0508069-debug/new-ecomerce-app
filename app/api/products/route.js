import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';

const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret';

function getUserFromToken(req) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return null;
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    await connectDB();
    const products = await Product.find().sort({ createdAt: -1 });
    return NextResponse.json({ products }, { status: 200 });
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = getUserFromToken(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, price, category, stock, images } = body;

    if (!name || !description || !category || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: 'Name, description, category, and at least one image are required' },
        { status: 400 }
      );
    }

    if (price === undefined || Number(price) <= 0) {
      return NextResponse.json({ error: 'Valid product price is required' }, { status: 400 });
    }

    await connectDB();

    const product = await Product.create({
      name,
      description,
      price: Number(price),
      category,
      stock: Number(stock || 0),
      images,
    });

    return NextResponse.json({ message: 'Product created successfully', product }, { status: 201 });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

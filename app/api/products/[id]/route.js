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

export async function GET(req, { params }) {
  try {
    const resolvedParams = await params;
    const productId = resolvedParams?.id;

    if (!productId) {
      return NextResponse.json({ error: 'Product id is required' }, { status: 400 });
    }

    await connectDB();
    const product = await Product.findById(productId);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product }, { status: 200 });
  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const resolvedParams = await params;
    const productId = resolvedParams?.id;

    if (!productId) {
      return NextResponse.json({ error: 'Product id is required' }, { status: 400 });
    }

    const user = getUserFromToken(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, price, category, stock, images } = body;

    await connectDB();
    const product = await Product.findById(productId);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (name) product.name = name;
    if (description) product.description = description;
    if (price !== undefined) product.price = Number(price);
    if (category) product.category = category;
    if (stock !== undefined) product.stock = Number(stock);
    if (Array.isArray(images)) product.images = images;

    await product.save();
    return NextResponse.json({ message: 'Product updated successfully', product }, { status: 200 });
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const resolvedParams = await params;
    const productId = resolvedParams?.id;

    if (!productId) {
      return NextResponse.json({ error: 'Product id is required' }, { status: 400 });
    }

    const user = getUserFromToken(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    await connectDB();
    const product = await Product.findByIdAndDelete(productId);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}

"use client";
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Package, Truck, Home, Download } from "lucide-react";
import { useStore } from "@/store/useStore"; // Ensure this path matches your project
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

// Define TypeScript interface for orderData
interface OrderItem {
  id: string;
  title: string;
  image: string;
  selectedSize: string;
  selectedColor: string;
  price: number;
  quantity: number;
}

interface OrderData {
  items: OrderItem[];
  subtotal: number;
  gst: number;
  shipping: number;
  total: number;
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
}

export const OrderSuccess = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart, addOrder, user } = useStore();

  // Extract orderId and orderData from query parameters
  const orderId = searchParams.get("orderId");
  const orderDataString = searchParams.get("orderData");
  const orderData: OrderData | null = orderDataString
    ? JSON.parse(decodeURIComponent(orderDataString))
    : null;

  useEffect(() => {
    // if (!orderId || !orderData) {
    //   router.push("/");
    //   return;
    // }

    // Clear cart after successful order
    if (user && orderData) {
      const order:any = {
        id: orderId,
        userId: user.email,
        items: orderData.items,
        total: orderData.total,
        status: "pending" as const,
        shippingAddress: orderData.shippingAddress,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      addOrder(order);
      clearCart();
    }
  }, [orderId, orderData, router, clearCart, addOrder, user]);

  if (!orderId || !orderData) {
    return null;
  }

  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);

  return (
    <div className="min-h-screen pt-32 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-12 h-12 text-green-600" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold mb-4"
          >
            Order Confirmed! 🎉
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-gray-600 mb-2"
          >
            Thank you for your purchase!
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg font-medium"
          >
            Order ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{orderId}</span>
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Details */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white p-6 rounded-lg border border-gray-200"
          >
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
              <Package className="w-6 h-6" />
              Order Details
            </h2>

            <div className="space-y-4 mb-6">
              {orderData.items.map((item) => (
                <div key={`${item.id}-${item.selectedSize}-${item.selectedColor}`} className="flex gap-4">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-sm text-gray-500">
                      Size: {item.selectedSize}, Color: {item.selectedColor}
                    </p>
                    <p className="text-sm">₹{item.price.toLocaleString()} × {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-t pt-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{orderData.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (18%)</span>
                <span>₹{orderData.gst.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>
                  {orderData.shipping === 0 ? (
                    <span className="text-green-600">Free</span>
                  ) : (
                    `₹${orderData.shipping.toLocaleString()}`
                  )}
                </span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total Paid</span>
                  <span>₹{orderData.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Shipping & Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="space-y-6"
          >
            {/* Shipping Information */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-3">
                <Truck className="w-5 h-5" />
                Shipping Information
              </h3>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>{orderData.shippingAddress.fullName}</strong>
                </p>
                <p>{orderData.shippingAddress.address}</p>
                <p>
                  {orderData.shippingAddress.city}, {orderData.shippingAddress.state}
                </p>
                <p>PIN: {orderData.shippingAddress.pincode}</p>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-700">
                  <strong>Estimated Delivery:</strong>{" "}
                  {estimatedDelivery.toLocaleDateString("en-IN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* Order Status */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-xl font-semibold mb-4">Order Status</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Order Confirmed</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  <span className="text-sm text-gray-500">Processing</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  <span className="text-sm text-gray-500">Shipped</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  <span className="text-sm text-gray-500">Delivered</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button className="w-full bg-gray-100 text-black py-3 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                <Download className="w-5 h-5" />
                Download Invoice
              </button>
              <Link
                href="/"
                className="w-full bg-black text-white py-3 rounded-md hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                Continue Shopping
              </Link>
            </div>
          </motion.div>
        </div>

        {/* What's Next */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-12 bg-gradient-to-r from-purple-50 to-pink-50 p-8 rounded-lg"
        >
          <h3 className="text-2xl font-semibold mb-4">What's Next?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-medium mb-2">We'll Pack Your Order</h4>
              <p className="text-sm text-gray-600">
                Your items will be carefully packed and prepared for shipping.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-medium mb-2">Track Your Package</h4>
              <p className="text-sm text-gray-600">
                You'll receive tracking information via email once shipped.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-medium mb-2">Enjoy Your Purchase</h4>
              <p className="text-sm text-gray-600">
                Your order will arrive within 5-7 business days.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};


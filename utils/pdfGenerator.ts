
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import QRCode from 'qrcode';

/**
 * Generates a professional Invoice PDF and returns the Blob.
 * UI Utility: Safe to run in browser.
 */
export const generateInvoiceBlob = async (order: any): Promise<Blob> => {
  const doc = new jsPDF() as any;
  const margin = 20;
  const invoiceNumber = `CH-INV-${order.id.slice(-6).toUpperCase()}`;

  doc.setFontSize(22);
  doc.setTextColor(79, 70, 229);
  doc.text('CycleHub Pvt Ltd', margin, 25);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Plot 42, Okhla Industrial Estate, Phase III', margin, 32);
  doc.text('New Delhi, Delhi 110020', margin, 37);
  doc.text('GSTIN: 07AABCC1234D1Z5', margin, 42);

  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`INVOICE: ${invoiceNumber}`, 140, 25);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 140, 32);
  doc.text(`Order ID: #${order.id.slice(0, 8)}`, 140, 39);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('BILL TO:', margin, 60);
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text(order.users?.full_name || 'Valued Customer', margin, 67);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(order.shipping_address || 'No Address Provided', margin, 74, { maxWidth: 80 });
  doc.text(`Mobile: ${order.customer_mobile || 'N/A'}`, margin, 90);

  const tableRows = order.order_items?.map((item: any) => [
    item.products?.name || 'Cycle Product',
    item.quantity.toString(),
    `₹${item.price.toLocaleString()}`,
    `₹${(item.price * item.quantity).toLocaleString()}`
  ]) || [];

  doc.autoTable({
    startY: 100,
    head: [['Product Name', 'Qty', 'Unit Price', 'Total']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
    margin: { left: margin, right: margin }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.text('Grand Total:', 140, finalY + 10);
  doc.text(`₹${order.total_price.toLocaleString()}`, 180, finalY + 10, { align: 'right' });

  return doc.output('blob');
};

/**
 * Generates an Amazon-style Shipping Label (A6 format) and returns the Blob.
 */
export const generateShippingLabelBlob = async (order: any): Promise<Blob> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a6'
  });

  const margin = 10;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ORDER ID', margin, 15);
  doc.setFontSize(12);
  doc.text(`#${order.id.slice(0, 12).toUpperCase()}`, margin, 22);

  try {
    const qrDataUrl = await QRCode.toDataURL(order.id);
    doc.addImage(qrDataUrl, 'PNG', 65, 10, 30, 30);
  } catch (err) {
    console.error('QR Code error', err);
  }

  doc.line(margin, 45, 95, 45);
  doc.setFontSize(10);
  doc.text('SHIP TO:', margin, 52);
  doc.setFontSize(14);
  doc.text(order.users?.full_name || 'Customer', margin, 60);
  doc.setFontSize(10);
  doc.text(order.shipping_address || 'No Address', margin, 68, { maxWidth: 85 });

  return doc.output('blob');
};

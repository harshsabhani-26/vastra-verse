import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateInvoicePDF = async (order: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Helper to draw text with label
    const drawField = (label: string, value: string, x: number, y: number, labelWidth = 30) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, x, y);
        doc.setFont("helvetica", "normal");
        doc.text(String(value || "-"), x + labelWidth, y);
    };

    // --- Header ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Tax Invoice", pageWidth / 2, 15, { align: "center" });

    // Box for Invoice Number (Top Right)
    doc.setFontSize(10);
    doc.setDrawColor(0);
    doc.rect(pageWidth - 80, 5, 70, 15); // x, y, w, h
    doc.text(`Invoice Number: #${order.id.slice(0, 8).toUpperCase()}`, pageWidth - 75, 14);

    // --- SOLD BY Section ---
    let y = 30;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Sold By: M & H Silk Heritage", 14, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Ship-from Address: 123 Silk Street, Heritage City, Gujarat, India - 395006", 14, y);
    y += 5;
    doc.text("GSTIN: 27AABCO4794P1ZN", 14, y); // Placeholder GST


    // --- Order Details Horizontal Bar ---
    y += 8;
    doc.line(14, y, pageWidth - 14, y);
    y += 6;

    // Order ID | Order Date | Invoice Date | PAN
    const colWidth = (pageWidth - 28) / 4;
    doc.setFont("helvetica", "bold");
    doc.text("Order ID:", 14, y);
    doc.text("Order Date:", 14 + colWidth, y);
    doc.text("Invoice Date:", 14 + colWidth * 2, y);
    // doc.text("PAN:", 14 + colWidth * 3, y); // Optional

    y += 5;
    doc.setFont("helvetica", "normal");
    doc.text(order.id, 14, y);

    const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN");
    const invoiceDate = new Date().toLocaleDateString("en-IN");

    doc.text(orderDate, 14 + colWidth, y);
    doc.text(invoiceDate, 14 + colWidth * 2, y);
    // doc.text("AABCO4794P", 14 + colWidth * 3, y);

    y += 5;
    doc.line(14, y, pageWidth - 14, y);
    y += 8;


    // --- Addresses (Bill To / Ship To) ---
    doc.setFont("helvetica", "bold");
    doc.text("Bill To:", 14, y);
    doc.text("Ship To:", 14 + colWidth * 2, y);

    y += 5;
    doc.setFont("helvetica", "bold");
    // Name
    const customerName = order.customerName || order.user?.name || "Customer";
    doc.text(customerName, 14, y);
    doc.text(customerName, 14 + colWidth * 2, y);

    y += 5;
    doc.setFont("helvetica", "normal");

    // Address Split
    const address = order.shippingAddress || "No address provided";
    const splitAddr = doc.splitTextToSize(address, colWidth * 1.5);

    doc.text(splitAddr, 14, y);
    doc.text(splitAddr, 14 + colWidth * 2, y);

    // Calculate Y after address
    y += (splitAddr.length * 4) + 5;

    // Phone
    const phone = order.customerPhone || order.user?.phone || "-";
    doc.text(`Phone: ${phone}`, 14, y);
    doc.text(`Phone: ${phone}`, 14 + colWidth * 2, y);

    // Right side note
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("*Keep this invoice for warranty purposes.", pageWidth - 14, y, { align: "right" });

    y += 8;
    doc.line(14, y, pageWidth - 14, y);

    // --- Item Table ---
    // Columns: Product, Title, Qty, Gross Amount, Discount, Taxable Value, IGST, Total
    // Gross = Price before tax/discount? Normally Price * Qty.
    // Let's assume stored price is Final Unit Price.
    // We will back-calculate for display if needed.
    // For simplicity: Item | Qty | Unit Price | Tax | Total

    const tableColumn = [
        "Product",
        "Title",
        "Qty",
        "Gross Amt",
        "Taxable Value",
        "IGST",
        "Total"
    ];

    const tableRows: (string | number)[][] = [];

    // GST Calculation Helper
    // Assuming price is inclusive of 18% GST default
    const calculateTax = (amount: number, rate = 18) => {
        const taxable = amount / (1 + rate / 100);
        const tax = amount - taxable;
        return { taxable, tax };
    };

    let grandTotal = 0;

    order.items.forEach((item: any) => {
        const qty = item.quantity;
        const unitPrice = Number(item.price);
        const total = unitPrice * qty;
        grandTotal += total;

        const { taxable, tax } = calculateTax(unitPrice);
        const totalTaxable = taxable * qty;
        const totalTax = tax * qty;

        // Is it IGST or CGST+SGST? 
        // We will just label it IGST/Tax for now to match strict column request
        // Or generic "Tax"

        tableRows.push([
            "Apparel", // Generic Product Category
            item.product.name,
            qty,
            unitPrice.toFixed(2), // Gross (Unit)
            totalTaxable.toFixed(2), // Taxable
            totalTax.toFixed(2), // Tax
            total.toFixed(2)
        ]);
    });

    // @ts-ignore
    autoTable(doc, {
        startY: y + 5,
        head: [tableColumn],
        body: tableRows,
        theme: 'plain',
        styles: { fontSize: 8, cellPadding: 2, lineColor: 200, lineWidth: 0.1 },
        headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: "bold" },
        columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 50 },
            6: { halign: 'right' }
        },
        margin: { top: 10, left: 14, right: 14 }
    });

    // --- Footer Totals ---
    // @ts-ignore
    let finalY = doc.lastAutoTable.finalY + 5;

    doc.line(14, finalY, pageWidth - 14, finalY);
    finalY += 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Grand Total", pageWidth - 60, finalY);
    doc.text(`Rs. ${grandTotal.toLocaleString()}`, pageWidth - 14, finalY, { align: "right" });

    finalY += 10;
    doc.line(14, finalY, pageWidth - 14, finalY);

    // Disclaimer
    finalY += 20;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("This is a computer generated invoice. No signature required.", pageWidth / 2, finalY, { align: "center" });

    // Logo (Simulated text)
    finalY += 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 77, 58);
    doc.text("M & H Silk Heritage", pageWidth - 14, finalY, { align: "right" });

    return Buffer.from(doc.output("arraybuffer"));
};

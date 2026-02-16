import React from "react";

export default function FAQPage() {
    return (
        <div className="container mx-auto px-4 py-12 md:py-20 max-w-4xl">
            <h1 className="text-3xl md:text-4xl font-serif text-primary text-center mb-12">Frequently Asked Questions</h1>

            <div className="space-y-8">
                <div className="space-y-4">
                    <h2 className="text-xl font-medium text-primary">Orders & Shipping</h2>
                    <div className="space-y-4">
                        <details className="group border border-stone-200 rounded-lg p-4 cursor-pointer">
                            <summary className="font-medium text-stone-800 list-none flex justify-between items-center">
                                How do I track my order?
                                <span className="transition-transform group-open:rotate-180">▼</span>
                            </summary>
                            <p className="text-stone-600 mt-4 text-sm leading-relaxed">
                                Once your order is shipped, you will receive a confirmation email with a tracking number. You can also track your order status in your account under "My Orders".
                            </p>
                        </details>
                        <details className="group border border-stone-200 rounded-lg p-4 cursor-pointer">
                            <summary className="font-medium text-stone-800 list-none flex justify-between items-center">
                                Do you ship internationally?
                                <span className="transition-transform group-open:rotate-180">▼</span>
                            </summary>
                            <p className="text-stone-600 mt-4 text-sm leading-relaxed">
                                Yes, we ship to most countries worldwide. International shipping rates and delivery times vary by location.
                            </p>
                        </details>
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-xl font-medium text-primary">Returns & Exchanges</h2>
                    <div className="space-y-4">
                        <details className="group border border-stone-200 rounded-lg p-4 cursor-pointer">
                            <summary className="font-medium text-stone-800 list-none flex justify-between items-center">
                                What is your return policy?
                                <span className="transition-transform group-open:rotate-180">▼</span>
                            </summary>
                            <p className="text-stone-600 mt-4 text-sm leading-relaxed">
                                Returns are only accepted for wrong or defective products delivered within 7 days of receipt. We do not accept returns for change of mind or size issues. Please visit our Returns & Exchange page for more details.
                            </p>
                        </details>
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-xl font-medium text-primary">Products</h2>
                    <div className="space-y-4">
                        <details className="group border border-stone-200 rounded-lg p-4 cursor-pointer">
                            <summary className="font-medium text-stone-800 list-none flex justify-between items-center">
                                Are your sarees pure silk?
                                <span className="transition-transform group-open:rotate-180">▼</span>
                            </summary>
                            <p className="text-stone-600 mt-4 text-sm leading-relaxed">
                                Yes, we specialize in authentic handloom and pure silk sarees. Each product description includes detailed fabric information.
                            </p>
                        </details>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function MaintenancePage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full text-center p-8">
                <div className="mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                        <svg
                            className="w-8 h-8 text-yellow-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        We'll Be Back Soon
                    </h1>
                    <p className="text-gray-600">
                        We're currently performing scheduled maintenance to improve your experience.
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                    <p className="text-sm text-gray-700">
                        Our site is currently undergoing scheduled maintenance. We expect to be back online shortly.
                        Thank you for your patience!
                    </p>
                </div>

                <div className="text-sm text-gray-500">
                    <p>For urgent inquiries, please contact us at:</p>
                    <a href="mailto:support@example.com" className="text-blue-600 hover:underline">
                        support@example.com
                    </a>
                </div>
            </div>
        </div>
    );
}

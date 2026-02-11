export default function CorporatePage() {
    return (
        <div className="container mx-auto px-4 py-12 md:py-20">
            <div className="max-w-4xl mx-auto space-y-8">
                <h1 className="font-serif text-3xl md:text-4xl text-[#1C1917] text-center mb-12">Corporate Information</h1>
                <div className="prose prose-stone max-w-none">
                    <p><strong>Registered Office:</strong><br />
                        20/C Pali Village, Opp. SAISA Club, Off 16th Rd, Bandra (W), Mumbai - 400050</p>

                    <p><strong>Corporate Office:</strong><br />
                        Plot No R 847/1/1, TTC Ind. Area, MIDC, Rabale, Navi Mumbai, India – 400701</p>

                    <p><strong>CIN:</strong> U17116MH1995PTC086449</p>

                    <p><strong>Contact:</strong><br />
                        Email: care@vastraverse.com<br />
                        Phone: +91 81549 49599</p>
                </div>
            </div>
        </div>
    );
}

'use client';

import Image from 'next/image';
import { formatPin } from '@/lib/utils/pin';

interface QRDisplayProps {
    pin: string;
    qrDataUrl: string;
}

export default function QRDisplay({ pin, qrDataUrl }: QRDisplayProps) {
    return (
        <div className="neo-card p-4 text-center">
            <p className="text-xs font-black text-[#a0a0b0] mb-3">ÚNETE CON QR O PIN</p>
            {qrDataUrl ? (
                <div className="border-4 border-black rounded-lg overflow-hidden mb-3 mx-auto w-fit">
                    <Image src={qrDataUrl} alt="QR Code" width={200} height={200} className="block" />
                </div>
            ) : (
                <div
                    className="w-[200px] h-[200px] mx-auto mb-3 rounded-lg flex items-center justify-center border-4 border-black"
                    style={{ background: '#f5f5f5' }}
                >
                    <span className="text-3xl animate-spin">⚙️</span>
                </div>
            )}
            <p className="text-xs text-[#a0a0b0] mb-1">PIN</p>
            <p className="font-black text-3xl text-[var(--text-primary)] tracking-widest">{formatPin(pin)}</p>
        </div>
    );
}
